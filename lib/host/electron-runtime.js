import { existsSync, readFileSync } from 'node:fs';
import { copyFile, mkdir, rename, rm, symlink } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import yauzl from 'yauzl';
import { resolveDshHome } from './config.js';
/**
 * Electron 运行时的定位与自动准备。
 *
 * 桌面模式要一份独立的 Electron 可执行文件（约 200 MB），不能塞进 npm 包，
 * 也不能依赖用户自己下载。这里的策略是：
 *   1. 先找 DSH_PET_ELECTRON_PATH 和常见安装位置；
 *   2. 找不到就从国内镜像（npmmirror）下载解压到 ~/.dsh/electron；
 *   3. 全程报告进度，失败时报明确原因。
 */
/** 与作者机器一致的版本；可用 DSH_PET_ELECTRON_VERSION 覆盖。 */
const DEFAULT_VERSION = '43.3.0';
const MAX_DOWNLOAD_BYTES = 400 * 1024 * 1024;
export function electronVersion() {
    return (process.env.DSH_PET_ELECTRON_VERSION || DEFAULT_VERSION).trim();
}
export function electronHome() {
    return process.env.DSH_PET_ELECTRON_HOME || join(resolveDshHome(), 'electron');
}
/** 解压后 Electron 可执行文件在一份发行包里的相对路径。 */
export function electronExecutable(dir) {
    if (process.platform === 'darwin') {
        return join(dir, 'Electron.app', 'Contents', 'MacOS', 'Electron');
    }
    if (process.platform === 'win32') {
        return join(dir, 'electron.exe');
    }
    return join(dir, 'electron');
}
/** 现有的可用 Electron；找不到返回 undefined。 */
export function findElectron() {
    const explicit = process.env.DSH_PET_ELECTRON_PATH;
    if (explicit && existsSync(explicit))
        return explicit;
    const candidates = [
        electronExecutable(electronHome()),
        electronExecutable(join(homedir(), '.dsh', 'electron')),
    ];
    return candidates.find((candidate) => existsSync(candidate));
}
function platformTag() {
    if (process.platform === 'win32')
        return 'win32';
    if (process.platform === 'darwin')
        return 'darwin';
    return 'linux';
}
function archTag() {
    if (process.arch === 'arm64')
        return 'arm64';
    if (process.arch === 'ia32')
        return 'ia32';
    return 'x64';
}
/**
 * 按优先级列出下载地址：npmmirror 的几个入口优先（国内可达），GitHub 兜底。
 * registry.npmmirror.com 和 pnpm 用的是同一个域名，装机时已经证明能连通。
 */
function downloadUrls(version) {
    const explicit = process.env.DSH_PET_ELECTRON_URL;
    if (explicit)
        return [explicit];
    const file = `electron-v${version}-${platformTag()}-${archTag()}.zip`;
    return [
        `https://registry.npmmirror.com/-/binary/electron/${version}/${file}`,
        `https://cdn.npmmirror.com/binaries/electron/${version}/${file}`,
        `https://npmmirror.com/mirrors/electron/${version}/${file}`,
        `https://github.com/electron/electron/releases/download/v${version}/${file}`,
    ];
}
/** 把下载地址缩成 "host" 形式，便于在错误信息里聚合。 */
function hostOf(url) {
    try {
        return new URL(url).host;
    }
    catch {
        return url.length > 40 ? `${url.slice(0, 40)}…` : url;
    }
}
function openZip(zipPath) {
    // 用 fromBuffer 而不是 open(path)：在 ESM 上下文里 fd 不会被事件循环保活，
    // 会表现为"解压刚开始进程就静默退出"。media.ts 的 ffmpeg 解压用的是同一写法。
    const buffer = readFileSync(zipPath);
    return new Promise((resolve, reject) => {
        yauzl.fromBuffer(buffer, { lazyEntries: true, autoClose: false }, (error, file) => {
            if (error || !file)
                reject(error ?? new Error('无法打开 Electron 压缩包'));
            else
                resolve(file);
        });
    });
}
function openEntryStream(zip, entry) {
    return new Promise((resolve, reject) => {
        zip.openReadStream(entry, (error, stream) => {
            if (error || !stream)
                reject(error ?? new Error('无法读取压缩包条目'));
            else
                resolve(stream);
        });
    });
}
function readEntryBuffer(zip, entry) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        zip.openReadStream(entry, (error, stream) => {
            if (error || !stream) {
                reject(error ?? new Error('无法读取压缩包条目'));
                return;
            }
            stream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    });
}
/** 把 Electron 的 zip 解压到目标目录；返回解压条目数。 */
async function extractZip(zipPath, destDir) {
    const zip = await openZip(zipPath);
    let count = 0;
    await new Promise((resolve, reject) => {
        zip.on('error', reject);
        zip.on('end', () => resolve());
        zip.on('entry', (entry) => {
            void (async () => {
                try {
                    const relative = entry.fileName.replace(/\\/g, '/').replace(/^\/+/, '');
                    if (!relative || relative.includes('..')) {
                        zip.readEntry();
                        return;
                    }
                    const target = join(destDir, relative);
                    const mode = (entry.externalFileAttributes >>> 16) & 0o170000;
                    if (relative.endsWith('/')) {
                        await mkdir(target, { recursive: true });
                    }
                    else if (mode === 0o120000) {
                        // macOS 的 Electron.app 里有符号链接
                        const link = await readEntryBuffer(zip, entry);
                        await mkdir(dirname(target), { recursive: true });
                        await rm(target, { force: true });
                        await symlink(link.toString('utf8'), target);
                    }
                    else {
                        await mkdir(dirname(target), { recursive: true });
                        const stream = await openEntryStream(zip, entry);
                        await pipeline(stream, createWriteStream(target));
                    }
                    count += 1;
                    zip.readEntry();
                }
                catch (error) {
                    reject(error);
                }
            })();
        });
        zip.readEntry();
    });
    zip.close();
    return count;
}
function describeError(error) {
    if (!(error instanceof Error))
        return String(error);
    const cause = error.cause;
    const code = cause?.code ?? error.code;
    return code ? `${error.message}（${code}）` : error.message;
}
/**
 * 用 node:https 而不是全局 fetch 下载。
 * 宿主进程里的 fetch 在部分环境下直接失败且只抛 "fetch failed"，
 * 用 http(s).request 能拿到真实的网络错误码。
 */
function downloadTo(url, target, onProgress) {
    return new Promise((resolve, reject) => {
        const follow = (current, hops) => {
            if (hops > 5) {
                reject(new Error('重定向次数过多'));
                return;
            }
            let parsed;
            try {
                parsed = new URL(current);
            }
            catch {
                reject(new Error(`无效的下载地址：${current}`));
                return;
            }
            const request = parsed.protocol === 'http:' ? httpRequest : httpsRequest;
            const req = request(parsed, { headers: { 'user-agent': 'dsh-xiaofu', accept: '*/*' } }, (res) => {
                const status = res.statusCode ?? 0;
                const location = res.headers.location;
                if (status >= 300 && status < 400 && location) {
                    res.resume();
                    follow(new URL(location, parsed).href, hops + 1);
                    return;
                }
                if (status !== 200) {
                    res.resume();
                    reject(new Error(`HTTP ${status}（${parsed.host}）`));
                    return;
                }
                const total = Number(res.headers['content-length'] ?? 0);
                let received = 0;
                const output = createWriteStream(target);
                output.on('error', reject);
                res.on('error', reject);
                output.on('finish', () => resolve());
                res.on('data', (chunk) => {
                    received += chunk.length;
                    if (received > MAX_DOWNLOAD_BYTES) {
                        req.destroy(new Error('Electron 压缩包超过 400 MB，已中止'));
                        output.destroy();
                        return;
                    }
                    onProgress(received, total);
                });
                res.pipe(output);
            });
            req.on('error', (error) => reject(error));
            req.setTimeout(30_000, () => req.destroy(new Error('连接超时（30 秒无响应）')));
            req.end();
        };
        follow(url, 0);
    });
}
let provisioning;
/**
 * 确保 Electron 可用。已存在则直接返回；否则下载解压。
 * 并发调用共享同一次下载。
 */
export function ensureElectron(onProgress) {
    if (!provisioning) {
        provisioning = provision(onProgress).finally(() => {
            provisioning = undefined;
        });
    }
    return provisioning;
}
async function provision(onProgress) {
    const existing = findElectron();
    if (existing)
        return existing;
    const version = electronVersion();
    const home = electronHome();
    const zipPath = join(home, `electron-${version}.zip`);
    const staging = `${home}.tmp-${process.pid}`;
    const report = (progress) => {
        try {
            onProgress?.(progress);
        }
        catch {
            // 进度回调不应影响下载
        }
    };
    report({ phase: 'downloading', percent: 0, message: `正在准备桌面运行环境（Electron ${version}）…` });
    const failures = [];
    for (const url of downloadUrls(version)) {
        try {
            await mkdir(home, { recursive: true });
            // 允许把 DSH_PET_ELECTRON_URL 指向本地已下载好的 zip
            if (existsSync(url)) {
                await copyFile(url, zipPath);
            }
            else {
                await downloadTo(url, zipPath, (received, total) => {
                    const percent = total > 0 ? Math.min(85, Math.round((received / total) * 85)) : 0;
                    report({
                        phase: 'downloading',
                        percent,
                        message: `正在下载桌面运行环境 ${total > 0 ? `${percent}%` : `${Math.round(received / 1024 / 1024)} MB`}`,
                    });
                });
            }
            report({ phase: 'extracting', percent: 88, message: '正在解压桌面运行环境…' });
            await rm(staging, { recursive: true, force: true });
            await mkdir(staging, { recursive: true });
            await extractZip(zipPath, staging);
            const staged = electronExecutable(staging);
            if (!existsSync(staged))
                throw new Error('解压后找不到 Electron 可执行文件');
            await rm(home, { recursive: true, force: true });
            await rename(staging, home);
            await rm(zipPath, { force: true });
            const ready = electronExecutable(home);
            report({ phase: 'ready', percent: 100, message: '桌面运行环境就绪' });
            return existsSync(ready) ? ready : undefined;
        }
        catch (error) {
            failures.push(`${hostOf(url)} → ${describeError(error)}`);
            await rm(zipPath, { force: true }).catch(() => undefined);
            await rm(staging, { recursive: true, force: true }).catch(() => undefined);
        }
    }
    report({
        phase: 'failed',
        percent: 0,
        message: `桌面运行环境准备失败：${failures.join('；') || '未知原因'}（可设置 DSH_PET_ELECTRON_URL 指定镜像，或指向本地 zip）`,
    });
    return undefined;
}
/** 供诊断用：当前 Electron 来源与版本信息。 */
export function electronDiagnostics() {
    const found = findElectron();
    let version = '';
    try {
        const marker = join(dirname(found ?? ''), 'version');
        if (found && existsSync(marker))
            version = readFileSync(marker, 'utf8').trim();
    }
    catch {
        version = '';
    }
    return {
        platform: `${platformTag()}-${archTag()}`,
        expectedVersion: electronVersion(),
        home: electronHome(),
        executable: found ?? null,
        installedVersion: version || null,
    };
}

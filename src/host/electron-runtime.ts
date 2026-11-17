import { existsSync, readFileSync } from 'node:fs';
import { mkdir, rename, rm, symlink } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
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

export interface ElectronProgress {
  phase: 'checking' | 'downloading' | 'extracting' | 'ready' | 'failed';
  percent: number;
  message: string;
}

export function electronVersion(): string {
  return (process.env.DSH_PET_ELECTRON_VERSION || DEFAULT_VERSION).trim();
}

export function electronHome(): string {
  return process.env.DSH_PET_ELECTRON_HOME || join(resolveDshHome(), 'electron');
}

/** 解压后 Electron 可执行文件在一份发行包里的相对路径。 */
export function electronExecutable(dir: string): string {
  if (process.platform === 'darwin') {
    return join(dir, 'Electron.app', 'Contents', 'MacOS', 'Electron');
  }
  if (process.platform === 'win32') {
    return join(dir, 'electron.exe');
  }
  return join(dir, 'electron');
}

/** 现有的可用 Electron；找不到返回 undefined。 */
export function findElectron(): string | undefined {
  const explicit = process.env.DSH_PET_ELECTRON_PATH;
  if (explicit && existsSync(explicit)) return explicit;

  const candidates = [
    electronExecutable(electronHome()),
    electronExecutable(join(homedir(), '.dsh', 'electron')),
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

function platformTag(): string {
  if (process.platform === 'win32') return 'win32';
  if (process.platform === 'darwin') return 'darwin';
  return 'linux';
}

function archTag(): string {
  if (process.arch === 'arm64') return 'arm64';
  if (process.arch === 'ia32') return 'ia32';
  return 'x64';
}

/** 按优先级列出下载地址：国内镜像优先，GitHub 兜底。 */
function downloadUrls(version: string): string[] {
  const explicit = process.env.DSH_PET_ELECTRON_URL;
  if (explicit) return [explicit];

  const file = `electron-v${version}-${platformTag()}-${archTag()}.zip`;
  return [
    `https://npmmirror.com/mirrors/electron/${version}/${file}`,
    `https://registry.npmmirror.com/-/binary/electron/${version}/${file}`,
    `https://github.com/electron/electron/releases/download/v${version}/${file}`,
  ];
}

function openZip(zipPath: string): Promise<yauzl.ZipFile> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true, autoClose: true }, (error, file) => {
      if (error || !file) reject(error ?? new Error('无法打开 Electron 压缩包'));
      else resolve(file);
    });
  });
}

function openEntryStream(zip: yauzl.ZipFile, entry: yauzl.Entry): Promise<NodeJS.ReadableStream> {
  return new Promise((resolve, reject) => {
    zip.openReadStream(entry, (error, stream) => {
      if (error || !stream) reject(error ?? new Error('无法读取压缩包条目'));
      else resolve(stream);
    });
  });
}

function readEntryBuffer(zip: yauzl.ZipFile, entry: yauzl.Entry): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
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
async function extractZip(zipPath: string, destDir: string): Promise<number> {
  const zip = await openZip(zipPath);
  let count = 0;

  await new Promise<void>((resolve, reject) => {
    zip.on('error', reject);
    zip.on('end', () => resolve());
    zip.on('entry', (entry: yauzl.Entry) => {
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
          } else if (mode === 0o120000) {
            // macOS 的 Electron.app 里有符号链接
            const link = await readEntryBuffer(zip, entry);
            await mkdir(dirname(target), { recursive: true });
            await rm(target, { force: true });
            await symlink(link.toString('utf8'), target);
          } else {
            await mkdir(dirname(target), { recursive: true });
            const stream = await openEntryStream(zip, entry);
            const output = createWriteStream(target);
            for await (const chunk of stream) {
              const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as never);
              if (!output.write(buffer)) {
                await new Promise<void>((resolve) => output.once('drain', () => resolve()));
              }
            }
            await new Promise<void>((resolve, reject) => {
              output.on('close', () => resolve());
              output.on('error', reject);
              output.end();
            });
          }
          count += 1;
          zip.readEntry();
        } catch (error) {
          reject(error);
        }
      })();
    });
    zip.readEntry();
  });

  return count;
}

async function downloadTo(url: string, target: string, onProgress: (received: number, total: number) => void): Promise<void> {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (!response.body) throw new Error('下载响应为空');

  const total = Number(response.headers.get('content-length') ?? 0);
  let received = 0;
  const stream = Readable.fromWeb(response.body as never);
  const output = createWriteStream(target);

  try {
    for await (const chunk of stream) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      received += buffer.length;
      if (received > MAX_DOWNLOAD_BYTES) throw new Error('Electron 压缩包超过 400 MB，已中止');
      if (!output.write(buffer)) {
        await new Promise<void>((resolve) => output.once('drain', () => resolve()));
      }
      onProgress(received, total);
    }
  } finally {
    output.end();
  }

  await new Promise<void>((resolve, reject) => {
    output.on('close', () => resolve());
    output.on('error', reject);
  });
}

let provisioning: Promise<string | undefined> | undefined;

/**
 * 确保 Electron 可用。已存在则直接返回；否则下载解压。
 * 并发调用共享同一次下载。
 */
export function ensureElectron(onProgress?: (progress: ElectronProgress) => void): Promise<string | undefined> {
  if (!provisioning) {
    provisioning = provision(onProgress).finally(() => {
      provisioning = undefined;
    });
  }
  return provisioning;
}

async function provision(onProgress?: (progress: ElectronProgress) => void): Promise<string | undefined> {
  const existing = findElectron();
  if (existing) return existing;

  const version = electronVersion();
  const home = electronHome();
  const zipPath = join(home, `electron-${version}.zip`);
  const staging = `${home}.tmp-${process.pid}`;

  const report = (progress: ElectronProgress) => {
    try {
      onProgress?.(progress);
    } catch {
      // 进度回调不应影响下载
    }
  };

  report({ phase: 'downloading', percent: 0, message: `正在准备桌面运行环境（Electron ${version}）…` });

  let lastError = '';
  for (const url of downloadUrls(version)) {
    try {
      await mkdir(home, { recursive: true });
      await downloadTo(url, zipPath, (received, total) => {
        const percent = total > 0 ? Math.min(85, Math.round((received / total) * 85)) : 0;
        report({
          phase: 'downloading',
          percent,
          message: `正在下载桌面运行环境 ${total > 0 ? `${percent}%` : `${Math.round(received / 1024 / 1024)} MB`}`,
        });
      });

      report({ phase: 'extracting', percent: 88, message: '正在解压桌面运行环境…' });
      await rm(staging, { recursive: true, force: true });
      await mkdir(staging, { recursive: true });
      await extractZip(zipPath, staging);

      const staged = electronExecutable(staging);
      if (!existsSync(staged)) throw new Error('解压后找不到 Electron 可执行文件');

      await rm(home, { recursive: true, force: true });
      await rename(staging, home);
      await rm(zipPath, { force: true });

      const ready = electronExecutable(home);
      report({ phase: 'ready', percent: 100, message: '桌面运行环境就绪' });
      return existsSync(ready) ? ready : undefined;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      await rm(zipPath, { force: true }).catch(() => undefined);
      await rm(staging, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  report({
    phase: 'failed',
    percent: 0,
    message: `桌面运行环境准备失败：${lastError}（可设置 DSH_PET_ELECTRON_URL 指定镜像）`,
  });
  return undefined;
}

/** 供诊断用：当前 Electron 来源与版本信息。 */
export function electronDiagnostics(): Record<string, unknown> {
  const found = findElectron();
  let version = '';
  try {
    const marker = join(dirname(found ?? ''), 'version');
    if (found && existsSync(marker)) version = readFileSync(marker, 'utf8').trim();
  } catch {
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

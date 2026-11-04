import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { delimiter, join } from 'node:path';
import { execFile } from 'node:child_process';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { promisify } from 'node:util';
import yauzl from 'yauzl';

const run = promisify(execFile);

const DEFAULT_WINDOWS_URL =
  'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-lgpl.zip';
const MAX_DOWNLOAD_BYTES = 300 * 1024 * 1024;

export interface FfmpegLocation {
  path: string;
  source: 'env' | 'managed' | 'path';
}

export interface MediaStatus {
  available: boolean;
  path?: string;
  source?: FfmpegLocation['source'];
  version?: string;
  error?: string;
}

export interface DownloadState {
  status: 'idle' | 'downloading' | 'extracting' | 'done' | 'failed';
  received: number;
  total: number;
  error?: string;
}

export function findFfmpegPath(
  dataDir: string,
  env: NodeJS.ProcessEnv = process.env,
): FfmpegLocation | undefined {
  const executable = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';

  const explicit = env.DSH_PET_FFMPEG_PATH;
  if (explicit && existsSync(explicit)) {
    return { path: explicit, source: 'env' };
  }

  const managed = join(dataDir, 'bin', executable);
  if (existsSync(managed)) {
    return { path: managed, source: 'managed' };
  }

  for (const directory of (env.PATH ?? '').split(delimiter)) {
    if (!directory) continue;
    const candidate = join(directory, executable);
    if (existsSync(candidate)) {
      return { path: candidate, source: 'path' };
    }
  }

  return undefined;
}

export class MediaManager {
  private state: DownloadState = { status: 'idle', received: 0, total: 0 };

  constructor(private readonly dataDir: string) {}

  private binDir(): string {
    return join(this.dataDir, 'bin');
  }

  async status(): Promise<MediaStatus> {
    const location = findFfmpegPath(this.dataDir);
    if (!location) return { available: false, error: '未找到 ffmpeg' };
    try {
      const { stdout } = await run(location.path, ['-version'], { timeout: 5000 });
      const version = stdout.split('\n')[0]?.trim();
      return { available: true, ...location, version };
    } catch (error) {
      return {
        available: false,
        ...location,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  downloadState(): DownloadState {
    return { ...this.state };
  }

  startDownload(): DownloadState {
    if (this.state.status === 'downloading' || this.state.status === 'extracting') {
      return this.downloadState();
    }
    this.state = { status: 'downloading', received: 0, total: 0 };
    void this.runDownload();
    return this.downloadState();
  }

  private async runDownload(): Promise<void> {
    if (process.platform !== 'win32') {
      this.state = {
        status: 'failed',
        received: 0,
        total: 0,
        error: '自动下载目前只支持 Windows；其它平台请设置 DSH_PET_FFMPEG_PATH',
      };
      return;
    }

    const url = process.env.DSH_PET_FFMPEG_URL || DEFAULT_WINDOWS_URL;
    const binDir = this.binDir();
    const zipPath = join(binDir, 'ffmpeg-download.zip');
    const target = join(binDir, 'ffmpeg.exe');
    await mkdir(binDir, { recursive: true });

    try {
      const response = await fetch(url, { redirect: 'follow' });
      if (!response.ok) throw new Error(`下载失败：HTTP ${response.status}`);
      this.state.total = Number(response.headers.get('content-length') ?? 0);

      if (!response.body) throw new Error('下载响应为空');
      const stream = Readable.fromWeb(response.body as never);
      const output = createWriteStream(zipPath);
      let received = 0;

      for await (const chunk of stream) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        received += buffer.length;
        if (received > MAX_DOWNLOAD_BYTES) throw new Error('下载文件过大');
        if (!output.write(buffer)) {
          await new Promise<void>((resolve) => {
            output.once('drain', () => resolve());
          });
        }
        this.state.received = received;
      }
      output.end();
      await finished(output);

      this.state.status = 'extracting';
      await extractFfmpeg(zipPath, target);
      await rm(zipPath, { force: true });
      this.state = { status: 'done', received, total: this.state.total || received };
    } catch (error) {
      await rm(zipPath, { force: true });
      this.state = {
        status: 'failed',
        received: this.state.received,
        total: this.state.total,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export async function extractFfmpeg(zipPath: string, target: string): Promise<void> {
  const buffer = await readFile(zipPath);
  const zipFile = await new Promise<yauzl.ZipFile>((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true, autoClose: false }, (error, file) => {
      if (error || !file) reject(error ?? new Error('无法打开 ffmpeg 压缩包'));
      else resolve(file);
    });
  });

  try {
    const entry = await new Promise<yauzl.Entry | undefined>((resolve, reject) => {
      zipFile.on('error', reject);
      zipFile.on('end', () => resolve(undefined));
      zipFile.on('entry', (candidate: yauzl.Entry) => {
        const name = candidate.fileName.replace(/\\/g, '/');
        if (name.endsWith('/bin/ffmpeg.exe') || name === 'ffmpeg.exe') {
          resolve(candidate);
          return;
        }
        zipFile.readEntry();
      });
      zipFile.readEntry();
    });

    if (!entry) throw new Error('压缩包里没有 ffmpeg.exe');

    const stream = await new Promise<NodeJS.ReadableStream>((resolve, reject) => {
      zipFile.openReadStream(entry, (error, input) => {
        if (error || !input) reject(error ?? new Error('无法读取 ffmpeg'));
        else resolve(input);
      });
    });

    const output = createWriteStream(target);
    for await (const chunk of stream) {
      const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      if (!output.write(bufferChunk)) {
        await new Promise<void>((resolve) => {
          output.once('drain', () => resolve());
        });
      }
    }
    output.end();
    await finished(output);
  } finally {
    zipFile.close();
  }
}

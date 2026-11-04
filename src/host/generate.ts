import { createWriteStream } from 'node:fs';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import yauzl from 'yauzl';
import type { ConfigStore } from './config.js';

export const MAX_GENERATE_ZIP_BYTES = 120 * 1024 * 1024;
export const MAX_FRAMES = 300;
export const MAX_FRAME_BYTES = 20 * 1024 * 1024;

export function frameSortKey(name: string): number {
  const match = /(\d+)\.(png|webp)$/i.exec(name);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

export async function inspectFrames(buffer: Buffer): Promise<FrameInspection> {
  const entries = await collectFrameEntries(buffer);
  if (entries.length === 0) throw new Error('压缩包里没有 PNG / WebP 帧');

  const counts = new Map<string, number>();
  for (const item of entries) {
    counts.set(item.segment, (counts.get(item.segment) ?? 0) + 1);
  }
  const segments = [...counts.entries()]
    .map(([name, frames]) => ({ name, frames }))
    .sort((a, b) => {
      if (a.name === 'idle') return -1;
      if (b.name === 'idle') return 1;
      return a.name.localeCompare(b.name);
    });

  const previewSegment = counts.has('idle') ? 'idle' : segments[0]?.name;
  const previewEntry = entries.find((item) => item.segment === previewSegment);
  let preview: string | undefined;

  if (previewEntry) {
    const zipFile = await openZip(buffer);
    try {
      const data = await readEntryBuffer(zipFile, previewEntry.entry);
      if (data.length > 0 && data.length <= 2 * 1024 * 1024) {
        const type = /\.webp$/i.test(previewEntry.entry.fileName) ? 'image/webp' : 'image/png';
        preview = `data:${type};base64,${data.toString('base64')}`;
      }
    } catch {
      preview = undefined;
    } finally {
      zipFile.close();
    }
  }

  return { segments, preview };
}

function readEntryBuffer(zipFile: yauzl.ZipFile, entry: yauzl.Entry): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    zipFile.openReadStream(entry, (error, stream) => {
      if (error || !stream) {
        reject(error ?? new Error('无法读取帧'));
        return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      stream.on('data', (chunk) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size <= 2 * 1024 * 1024) chunks.push(buffer);
        else chunks.length = 0;
      });
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  });
}

interface FrameEntry {
  entry: yauzl.Entry;
  segment: string;
}

export interface GenerateOptions {
  dataDir: string;
  buffer: Buffer;
  name: string;
  id: string;
  store: ConfigStore;
  ffmpegPath: string;
  fps?: number;
  segmentMeta?: Record<string, { fps?: number; mode?: 'loop' | 'once' }>;
  onProgress?: (percent: number, message: string) => void;
  isCancelled?: () => boolean;
}

export interface InspectionSegment {
  name: string;
  frames: number;
}

export interface FrameInspection {
  segments: InspectionSegment[];
  preview?: string;
}

export interface GenerateResult {
  id: string;
  name: string;
  version: string;
  animations: string[];
  animationMeta?: Record<string, { fps: number; mode: 'loop' | 'once' }>;
  preview: string;
  frames: number;
  segments: string[];
}

export async function generatePack(options: GenerateOptions): Promise<GenerateResult> {
  const { dataDir, buffer, name, id, store, ffmpegPath } = options;
  const fps = options.fps ?? 24;

  const tempDir = await mkdtemp(join(dataDir, '.generate-'));
  const framesRoot = join(tempDir, 'frames');
  await mkdir(framesRoot, { recursive: true });

  try {
    const entries = await collectFrameEntries(buffer);
    if (entries.length === 0) throw new Error('压缩包里没有 PNG / WebP 帧');
    if (entries.length > MAX_FRAMES) {
      throw new Error(`帧数过多：${entries.length}（上限 ${MAX_FRAMES}）`);
    }
    options.onProgress?.(10, '已读取帧列表');

    const groups = new Map<string, yauzl.Entry[]>();
    for (const item of entries) {
      const list = groups.get(item.segment) ?? [];
      list.push(item.entry);
      groups.set(item.segment, list);
    }
    const segments = [...groups.keys()].sort((a, b) => {
      if (a === 'idle') return -1;
      if (b === 'idle') return 1;
      return a.localeCompare(b);
    });
    const segmentExt = new Map<string, string>();
    for (const segment of segments) {
      const exts = new Set(
        (groups.get(segment) ?? []).map((entry) => extname(entry.fileName).toLowerCase()),
      );
      if (exts.size !== 1) throw new Error(`动画段 ${segment} 混用了 PNG/WebP 帧`);
      segmentExt.set(segment, [...exts][0] ?? '.png');
    }

    const packDir = join(dataDir, 'packs', id);
    const animationsDir = join(packDir, 'animations');
    await mkdir(animationsDir, { recursive: true });

    const settings = new Map<string, { fps: number; mode: 'loop' | 'once' }>();
    for (const segment of segments) {
      const requested = options.segmentMeta?.[segment] ?? {};
      settings.set(segment, {
        fps:
          typeof requested.fps === 'number' && requested.fps >= 1 && requested.fps <= 60
            ? Math.round(requested.fps)
            : fps,
        mode: requested.mode ?? (segment === 'idle' ? 'loop' : 'once'),
      });
    }

    const zipFile = await openZip(buffer);
    try {
      for (const segment of segments) {
        if (options.isCancelled?.()) throw new Error('已取消');
        const list = groups.get(segment) ?? [];
        list.sort((a, b) => frameSortKey(a.fileName) - frameSortKey(b.fileName));
        const segmentDir = join(framesRoot, segment);
        await mkdir(segmentDir, { recursive: true });

        let index = 0;
        for (const entry of list) {
          index += 1;
          const target = join(
            segmentDir,
            `frame_${String(index).padStart(4, '0')}${segmentExt.get(segment) ?? '.png'}`,
          );
          const stream = await openEntry(zipFile, entry);
          await pipeline(stream, createWriteStream(target));
        }

        const segmentIndex = segments.indexOf(segment);
        const base = 20 + (segmentIndex / Math.max(1, segments.length)) * 70;
        const span = 70 / Math.max(1, segments.length);
        options.onProgress?.(
          Math.round(base),
          `编码 ${segment}（${list.length} 帧）`,
        );
        await encodeFrames(
          ffmpegPath,
          segmentDir,
          join(animationsDir, `${segment}.webm`),
          settings.get(segment)?.fps ?? fps,
          segmentExt.get(segment) ?? '.png',
          {
            totalFrames: list.length,
            isCancelled: options.isCancelled,
            onProgress: (ratio) =>
              options.onProgress?.(
                Math.round(base + ratio * span),
                `编码 ${segment} ${Math.round(ratio * 100)}%`,
              ),
          },
        );
      }
    } finally {
      zipFile.close();
    }
    if (options.isCancelled?.()) throw new Error('已取消');
    options.onProgress?.(92, '写入 manifest');

    const previewSegment = groups.has('idle') ? 'idle' : segments[0];
    const previewExt = segmentExt.get(previewSegment) ?? '.png';
    const previewName = `preview${previewExt}`;
    const previewPath = join(packDir, previewName);
    await copyFile(
      join(framesRoot, previewSegment, `frame_0001${previewExt}`),
      previewPath,
    );

    const animations = segments.map((segment) => `animations/${segment}.webm`);
    const animationMeta: Record<string, { fps: number; mode: 'loop' | 'once' }> = {};
    for (const segment of segments) {
      const setting = settings.get(segment);
      if (setting) {
        animationMeta[`animations/${segment}.webm`] = {
          fps: setting.fps,
          mode: setting.mode,
        };
      }
    }
    const manifest = {
      schema: 'dsh-hex-pet.pack/1',
      id,
      name,
      version: '1.0.0',
      animations,
      animationMeta,
      preview: previewName,
      author: 'local',
      license: 'user-provided',
    };
    await writeFile(join(packDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

    const config = await store.read();
    config.packs[id] = { version: '1.0.0', enabled: true };
    await store.write(config);

    return {
      id,
      name,
      version: '1.0.0',
      animations,
      animationMeta,
      preview: manifest.preview,
      frames: entries.length,
      segments,
    };
  } catch (error) {
    await rm(join(dataDir, 'packs', id), { recursive: true, force: true }).catch(() => undefined);
    throw error;
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export const MAX_PASSTHROUGH_BYTES = 50 * 1024 * 1024;

/** 已符合规格的透明 webm：不重编码，直接建包。 */
export async function importTransparentWebm(options: {
  dataDir: string;
  buffer: Buffer;
  name: string;
  id: string;
  store: ConfigStore;
}): Promise<GenerateResult> {
  const { dataDir, buffer, name, id, store } = options;
  if (buffer.length === 0) throw new Error('webm 文件为空');
  if (buffer.length > MAX_PASSTHROUGH_BYTES) throw new Error('webm 超过 50MB');
  if (
    buffer.length < 4 ||
    buffer[0] !== 0x1a ||
    buffer[1] !== 0x45 ||
    buffer[2] !== 0xdf ||
    buffer[3] !== 0xa3
  ) {
    throw new Error('不是有效的 WebM（缺少 EBML 头）');
  }

  const packDir = join(dataDir, 'packs', id);
  try {
    await mkdir(join(packDir, 'animations'), { recursive: true });
    await writeFile(join(packDir, 'animations', 'idle.webm'), buffer);

    const animations = ['animations/idle.webm'];
    const manifest = {
      schema: 'dsh-hex-pet.pack/1',
      id,
      name,
      version: '1.0.0',
      animations,
      animationMeta: { 'animations/idle.webm': { mode: 'loop' as const } },
      author: 'local',
      license: 'user-provided',
    };
    await writeFile(join(packDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

    const config = await store.read();
    config.packs[id] = { version: '1.0.0', enabled: true };
    await store.write(config);

    return {
      id,
      name,
      version: '1.0.0',
      animations,
      animationMeta: { 'animations/idle.webm': { fps: 24, mode: 'loop' } },
      preview: '',
      frames: 0,
      segments: ['idle'],
    };
  } catch (error) {
    await rm(packDir, { recursive: true, force: true }).catch(() => undefined);
    throw error;
  }
}

function segmentOf(fileName: string): string {
  const parts = fileName.replace(/\\/g, '/').split('/').filter(Boolean);
  if (parts.length <= 1) return 'idle';
  return parts[0].toLowerCase();
}

function collectFrameEntries(buffer: Buffer): Promise<FrameEntry[]> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (error, zipFile) => {
      if (error || !zipFile) {
        reject(error ?? new Error('无法读取 zip'));
        return;
      }
      const entries: FrameEntry[] = [];
      let total = 0;
      zipFile.on('error', reject);
      zipFile.on('entry', (entry: yauzl.Entry) => {
        const fileName = basename(entry.fileName);
        if (!/\.(png|webp)$/i.test(fileName)) {
          zipFile.readEntry();
          return;
        }
        const segment = segmentOf(entry.fileName);
        if (!/^[a-z0-9-]{1,16}$/.test(segment)) {
          reject(new Error(`非法的动画段目录：${segment}`));
          return;
        }
        total += entry.uncompressedSize;
        if (total > MAX_FRAMES * MAX_FRAME_BYTES) {
          reject(new Error('解压后体积过大'));
          return;
        }
        entries.push({ entry, segment });
        zipFile.readEntry();
      });
      zipFile.on('end', () => resolve(entries));
      zipFile.readEntry();
    });
  });
}

function openZip(buffer: Buffer): Promise<yauzl.ZipFile> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true, autoClose: false }, (error, zipFile) => {
      if (error || !zipFile) reject(error ?? new Error('无法读取 zip'));
      else resolve(zipFile);
    });
  });
}

function openEntry(zipFile: yauzl.ZipFile, entry: yauzl.Entry): Promise<NodeJS.ReadableStream> {
  return new Promise((resolve, reject) => {
    zipFile.openReadStream(entry, (error, stream) => {
      if (error || !stream) reject(error ?? new Error('无法读取帧'));
      else resolve(stream);
    });
  });
}

interface EncodeOptions {
  totalFrames?: number;
  onProgress?: (ratio: number) => void;
  isCancelled?: () => boolean;
}

function encodeFrames(
  ffmpegPath: string,
  framesDir: string,
  target: string,
  fps: number,
  ext: string,
  options: EncodeOptions = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      ffmpegPath,
      [
        '-y',
        '-hide_banner',
        '-loglevel',
        'error',
        '-framerate',
        String(fps),
        '-i',
        join(framesDir, `frame_%04d${ext}`),
        '-c:v',
        'libvpx-vp9',
        '-pix_fmt',
        'yuva420p',
        '-auto-alt-ref',
        '0',
        '-b:v',
        '0',
        '-crf',
        '28',
        '-an',
        '-progress',
        'pipe:1',
        '-nostats',
        target,
      ],
      { windowsHide: true },
    );

    let stderr = '';
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    };

    child.stderr?.on('data', (chunk) => {
      stderr += String(chunk);
      if (stderr.length > 4000) stderr = stderr.slice(-4000);
    });

    let progressBuffer = '';
    child.stdout?.on('data', (chunk) => {
      progressBuffer += String(chunk);
      const lines = progressBuffer.split('\n');
      progressBuffer = lines.pop() ?? '';
      for (const line of lines) {
        const match = /^frame=(\d+)/.exec(line.trim());
        if (!match) continue;
        if (options.totalFrames && options.totalFrames > 0) {
          const ratio = Math.min(1, Number(match[1]) / options.totalFrames);
          options.onProgress?.(ratio);
        }
        if (options.isCancelled?.()) {
          child.kill();
          finish(new Error('已取消'));
          return;
        }
      }
    });

    const timer = setTimeout(() => {
      child.kill();
      finish(new Error('ffmpeg 编码超时'));
    }, 120000);

    child.on('error', (error) => {
      finish(error);
    });
    child.on('exit', (code) => {
      if (settled) return;
      if (code === 0) finish();
      else finish(new Error(`ffmpeg 失败（code=${code}）：${stderr.slice(-500)}`));
    });
  });
}

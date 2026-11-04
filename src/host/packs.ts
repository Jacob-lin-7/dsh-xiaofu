import { createWriteStream } from 'node:fs';
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import yauzl from 'yauzl';
import { z } from 'zod';
import type { ConfigStore } from './config.js';
import { applyAnimationExt } from './animation-ext.js';

export const MAX_ZIP_BYTES = 50 * 1024 * 1024;
export const MAX_UNCOMPRESSED_BYTES = 120 * 1024 * 1024;
export const MAX_ENTRIES = 200;

const ALLOWED_EXTENSIONS = ['.webm', '.mov', '.png', '.jpg', '.jpeg', '.webp', '.md', '.txt', '.json'];

const animationMetaSchema = z.object({
  fps: z.number().int().min(1).max(60).optional(),
  mode: z.enum(['loop', 'once']).optional(),
});

export const manifestSchema = z.object({
  schema: z.string().default('dsh-hex-pet.pack/1'),
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{1,31}$/),
  name: z.string().min(1).max(64),
  version: z.string().min(1).max(32).default('1.0.0'),
  animations: z.array(z.string().min(1)).min(1),
  animationMeta: z.record(z.string(), animationMetaSchema).optional(),
  preview: z.string().optional(),
  icon: z.string().optional(),
  author: z.string().optional(),
  license: z.string().optional(),
});
export type PackManifest = z.infer<typeof manifestSchema>;
export type AnimationMeta = z.infer<typeof animationMetaSchema>;

export interface PackInfo {
  id: string;
  name: string;
  version: string;
  animations: string[];
  animationMeta?: Record<string, AnimationMeta>;
  preview?: string;
  icon?: string;
  author?: string;
  license?: string;
  dir: string;
  enabled?: boolean;
}

export class PackError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 400,
    readonly id?: string,
  ) {
    super(message);
    this.name = 'PackError';
  }
}

function isSafeEntryName(name: string): boolean {
  if (!name || name.startsWith('/') || name.includes('\\')) return false;
  const segments = name.split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) return false;
  return true;
}

function extensionOf(name: string): string {
  const index = name.lastIndexOf('.');
  return index >= 0 ? name.slice(index).toLowerCase() : '';
}

/** 对一组“文件名 → 内容”做路径、扩展名、条目数和体积检查。 */
export function validateFileSet(files: Map<string, Buffer>): void {
  if (files.size > MAX_ENTRIES) {
    throw new PackError('TOO_MANY_ENTRIES', `压缩包条目过多（上限 ${MAX_ENTRIES}）`);
  }
  let total = 0;
  for (const [name, data] of files) {
    if (!isSafeEntryName(name)) {
      throw new PackError('UNSAFE_PATH', `非法路径：${name}`);
    }
    if (!ALLOWED_EXTENSIONS.includes(extensionOf(name))) {
      throw new PackError('UNSUPPORTED_FILE', `不支持的文件类型：${name}`);
    }
    total += data.length;
    if (total > MAX_UNCOMPRESSED_BYTES) {
      throw new PackError('TOO_LARGE', '解压后体积超限', 413);
    }
  }
}

export function readZip(buffer: Buffer): Promise<Map<string, Buffer>> {
  return new Promise((resolvePromise, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (error, zip) => {
      if (error || !zip) {
        reject(new PackError('INVALID_ZIP', `不是有效的 zip：${error?.message ?? 'unknown'}`));
        return;
      }

      const files = new Map<string, Buffer>();
      let total = 0;
      let count = 0;

      const fail = (packError: PackError) => {
        zip.close();
        reject(packError);
      };

      zip.on('entry', (entry: yauzl.Entry) => {
        count += 1;
        if (count > MAX_ENTRIES) {
          fail(new PackError('TOO_MANY_ENTRIES', `压缩包条目过多（上限 ${MAX_ENTRIES}）`));
          return;
        }

        const name = entry.fileName;
        if (name.endsWith('/')) {
          zip.readEntry();
          return;
        }
        if (!isSafeEntryName(name)) {
          fail(new PackError('UNSAFE_PATH', `非法路径：${name}`));
          return;
        }
        if (!ALLOWED_EXTENSIONS.includes(extensionOf(name))) {
          fail(new PackError('UNSUPPORTED_FILE', `不支持的文件类型：${name}`));
          return;
        }

        total += entry.uncompressedSize;
        if (total > MAX_UNCOMPRESSED_BYTES) {
          fail(new PackError('TOO_LARGE', '解压后体积超限', 413));
          return;
        }

        zip.openReadStream(entry, (streamError, stream) => {
          if (streamError || !stream) {
            fail(new PackError('READ_FAILED', `读取失败：${name}`));
            return;
          }
          const chunks: Buffer[] = [];
          stream.on('data', (chunk: Buffer) => chunks.push(chunk));
          stream.on('error', () => fail(new PackError('READ_FAILED', `读取失败：${name}`)));
          stream.on('end', () => {
            files.set(name, Buffer.concat(chunks));
            zip.readEntry();
          });
        });
      });

      zip.on('end', () => resolvePromise(files));
      zip.on('error', (zipError: Error) =>
        reject(new PackError('INVALID_ZIP', `解压失败：${zipError.message}`)),
      );
      zip.readEntry();
    });
  });
}

export interface PackValidation {
  manifest: PackManifest;
  files: string[];
}

/** 校验解包后的完整文件集，返回 manifest；安装与 CLI 共用。 */
export function validatePackFiles(files: Map<string, Buffer>): PackValidation {
  validateFileSet(files);
  const manifestRaw = files.get('manifest.json');
  if (!manifestRaw) {
    throw new PackError('MISSING_MANIFEST', '缺少 manifest.json');
  }

  let manifest: PackManifest;
  try {
    manifest = manifestSchema.parse(JSON.parse(manifestRaw.toString('utf8')));
  } catch (error) {
    throw new PackError('INVALID_MANIFEST', `manifest 校验失败：${(error as Error).message}`);
  }

  for (const animation of manifest.animations) {
    if (!isSafeEntryName(animation) || !files.has(animation)) {
      throw new PackError('MISSING_ANIMATION', `manifest 引用的动画不存在：${animation}`);
    }
    if (!['.webm', '.mov'].includes(extensionOf(animation))) {
      throw new PackError('INVALID_ANIMATION', `动画必须是 .webm 或 .mov：${animation}`);
    }
  }

  if (manifest.preview && !files.has(manifest.preview)) {
    throw new PackError('MISSING_PREVIEW', `预览图不存在：${manifest.preview}`);
  }
  if (manifest.icon && !files.has(manifest.icon)) {
    throw new PackError('MISSING_ICON', `托盘图标不存在：${manifest.icon}`);
  }

  return { manifest, files: [...files.keys()].sort() };
}

async function readExistingManifest(dir: string): Promise<PackManifest | undefined> {
  try {
    const raw = await readFile(join(dir, 'manifest.json'), 'utf8');
    return manifestSchema.parse(JSON.parse(raw));
  } catch {
    return undefined;
  }
}

export async function listPacks(dataDir: string): Promise<PackInfo[]> {
  const packsDir = join(dataDir, 'packs');
  let entries: string[];
  try {
    entries = await readdir(packsDir);
  } catch {
    return [];
  }

  const result: PackInfo[] = [];
  for (const id of entries.sort()) {
    if (id.startsWith('.')) continue;
    const dir = join(packsDir, id);
    const stored = await readExistingManifest(dir);
    if (!stored) continue;
    const manifest = await applyAnimationExt(dataDir, id, stored);
    result.push({
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      animations: manifest.animations,
      animationMeta: manifest.animationMeta,
      preview: manifest.preview,
  icon: manifest.icon,
      author: manifest.author,
      license: manifest.license,
      dir,
    });
  }
  return result;
}

export interface InstallOptions {
  dataDir: string;
  buffer: Buffer;
  store: ConfigStore;
}

export async function installPack(options: InstallOptions): Promise<PackInfo> {
  const { dataDir, buffer, store } = options;
  if (buffer.length > MAX_ZIP_BYTES) {
    throw new PackError('TOO_LARGE', '压缩包超过 50MB', 413);
  }

  const files = await readZip(buffer);
  const { manifest } = validatePackFiles(files);

  const packsDir = join(dataDir, 'packs');
  const target = join(packsDir, manifest.id);
  try {
    await readdir(target);
    throw new PackError('PACK_EXISTS', `形象包已存在：${manifest.id}`, 409, manifest.id);
  } catch (error) {
    if (error instanceof PackError) throw error;
  }

  await mkdir(packsDir, { recursive: true });
  const staging = join(packsDir, `.tmp-${manifest.id}-${process.pid}-${Date.now()}`);
  try {
    for (const [name, content] of files) {
      const targetFile = resolve(staging, name);
      if (!targetFile.startsWith(resolve(staging) + sep)) {
        throw new PackError('UNSAFE_PATH', `非法路径：${name}`);
      }
      await mkdir(dirname(targetFile), { recursive: true });
      await writeFile(targetFile, content);
    }
    await rename(staging, target);
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }

  const config = await store.read();
  const next = {
    ...config,
    packs: {
      ...config.packs,
      [manifest.id]: { version: manifest.version, enabled: true },
    },
  };
  await store.write(next);

  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    animations: manifest.animations,
    animationMeta: manifest.animationMeta,
    preview: manifest.preview,
  icon: manifest.icon,
    author: manifest.author,
    license: manifest.license,
    dir: target,
  };
}

export interface DeleteOptions {
  dataDir: string;
  id: string;
  store: ConfigStore;
}

export async function deletePack(options: DeleteOptions): Promise<{ id: string }> {
  const { dataDir, id, store } = options;
  const packsRoot = resolve(dataDir, 'packs');
  const target = resolve(packsRoot, id);
  if (!target.startsWith(packsRoot + sep)) {
    throw new PackError('UNSAFE_PATH', '非法形象包路径');
  }

  try {
    await readdir(target);
  } catch {
    throw new PackError('PACK_NOT_FOUND', `形象包不存在：${id}`, 404);
  }

  await rm(target, { recursive: true, force: true });

  const config = await store.read();
  const packs = { ...config.packs };
  delete packs[id];
  const pets = config.pets.map((pet) => (pet.pack === id ? { ...pet, pack: 'builtin' } : pet));
  await store.write({ ...config, packs, pets });

  return { id };
}
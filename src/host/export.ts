import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { PackError } from './packs.js';
import { createZip, type ZipEntry } from './zip.js';

/** 把已安装的 pack 目录原样打回 petpack.zip。 */
export async function exportPack(
  dataDir: string,
  id: string,
): Promise<{ buffer: Buffer; filename: string }> {
  const packsRoot = resolve(dataDir, 'packs');
  const dir = resolve(packsRoot, id);
  if (!dir.startsWith(packsRoot + sep)) {
    throw new PackError('UNSAFE_PATH', '非法形象包路径');
  }

  try {
    await readdir(dir);
  } catch {
    throw new PackError('PACK_NOT_FOUND', `形象包不存在：${id}`, 404);
  }

  const entries: ZipEntry[] = [];
  const walk = async (current: string): Promise<void> => {
    const items = await readdir(current, { withFileTypes: true });
    for (const item of items) {
      const full = join(current, item.name);
      if (item.isDirectory()) {
        await walk(full);
        continue;
      }
      if (!item.isFile()) continue;
      const name = relative(dir, full).split(sep).join('/');
      entries.push({ name, data: await readFile(full) });
    }
  };
  await walk(dir);

  if (entries.length === 0) {
    throw new PackError('EMPTY_PACK', '形象包没有文件');
  }

  entries.sort((a, b) => a.name.localeCompare(b.name));
  return { buffer: createZip(entries), filename: `${id}.petpack.zip` };
}

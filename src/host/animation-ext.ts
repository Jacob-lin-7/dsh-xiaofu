import { access, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { z } from 'zod';
import type { PackManifest } from './packs.js';

const appendItemSchema = z.object({
  name: z.string().min(1),
  mode: z.enum(['loop', 'once']).optional(),
  fps: z.number().int().min(1).max(60).optional(),
});

const extensionSchema = z.object({
  target: z.string().min(1),
  append: z.array(appendItemSchema).min(1),
});

function isSafeRelative(name: string): boolean {
  if (!name || name.startsWith('/') || name.includes('\\')) return false;
  return !name
    .split('/')
    .some((segment) => segment === '' || segment === '.' || segment === '..');
}

/**
 * 给已安装的 pack 追加动画，不改原包。
 * 文件：<dataDir>/animation-ext/<packId>-ext.json
 * 任何一条非法都会整段忽略，返回原 manifest。
 */
export async function applyAnimationExt(
  dataDir: string,
  packId: string,
  manifest: PackManifest,
): Promise<PackManifest> {
  try {
    const raw = await readFile(join(dataDir, 'animation-ext', `${packId}-ext.json`), 'utf8');
    const extension = extensionSchema.parse(JSON.parse(raw));
    const targetIndex = manifest.animations.indexOf(extension.target);
    if (targetIndex < 0) return manifest;

    const additions: Array<{ name: string; mode: 'loop' | 'once'; fps?: number }> = [];
    for (const item of extension.append) {
      if (!isSafeRelative(item.name)) return manifest;
      if (!['.webm', '.mov'].includes(extname(item.name).toLowerCase())) return manifest;
      if (manifest.animations.includes(item.name)) return manifest;
      await access(join(dataDir, 'packs', packId, item.name));
      additions.push({ name: item.name, mode: item.mode ?? 'once', fps: item.fps });
    }

    const animations = [
      ...manifest.animations.slice(0, targetIndex + 1),
      ...additions.map((item) => item.name),
      ...manifest.animations.slice(targetIndex + 1),
    ];
    const animationMeta = { ...(manifest.animationMeta ?? {}) };
    for (const item of additions) {
      animationMeta[item.name] = {
        mode: item.mode,
        ...(item.fps ? { fps: item.fps } : {}),
      };
    }
    return { ...manifest, animations, animationMeta };
  } catch {
    return manifest;
  }
}

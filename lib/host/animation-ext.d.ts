import type { PackManifest } from './packs.js';
/**
 * 给已安装的 pack 追加动画，不改原包。
 * 文件：<dataDir>/animation-ext/<packId>-ext.json
 * 任何一条非法都会整段忽略，返回原 manifest。
 */
export declare function applyAnimationExt(dataDir: string, packId: string, manifest: PackManifest): Promise<PackManifest>;

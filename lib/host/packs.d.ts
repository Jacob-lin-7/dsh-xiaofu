import { z } from 'zod';
import type { ConfigStore } from './config.js';
export declare const MAX_ZIP_BYTES: number;
export declare const MAX_UNCOMPRESSED_BYTES: number;
export declare const MAX_ENTRIES = 200;
declare const animationMetaSchema: z.ZodObject<{
    fps: z.ZodOptional<z.ZodNumber>;
    mode: z.ZodOptional<z.ZodEnum<{
        loop: "loop";
        once: "once";
    }>>;
}, z.core.$strip>;
export declare const manifestSchema: z.ZodObject<{
    schema: z.ZodDefault<z.ZodString>;
    id: z.ZodString;
    name: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    animations: z.ZodArray<z.ZodString>;
    animationMeta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        fps: z.ZodOptional<z.ZodNumber>;
        mode: z.ZodOptional<z.ZodEnum<{
            loop: "loop";
            once: "once";
        }>>;
    }, z.core.$strip>>>;
    preview: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    license: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
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
export declare class PackError extends Error {
    readonly code: string;
    readonly status: number;
    readonly id?: string | undefined;
    constructor(code: string, message: string, status?: number, id?: string | undefined);
}
/** 对一组“文件名 → 内容”做路径、扩展名、条目数和体积检查。 */
export declare function validateFileSet(files: Map<string, Buffer>): void;
export declare function readZip(buffer: Buffer): Promise<Map<string, Buffer>>;
export interface PackValidation {
    manifest: PackManifest;
    files: string[];
}
/** 校验解包后的完整文件集，返回 manifest；安装与 CLI 共用。 */
export declare function validatePackFiles(files: Map<string, Buffer>): PackValidation;
export declare function listPacks(dataDir: string): Promise<PackInfo[]>;
export interface InstallOptions {
    dataDir: string;
    buffer: Buffer;
    store: ConfigStore;
}
export declare function installPack(options: InstallOptions): Promise<PackInfo>;
export interface DeleteOptions {
    dataDir: string;
    id: string;
    store: ConfigStore;
}
export declare function deletePack(options: DeleteOptions): Promise<{
    id: string;
}>;
export {};

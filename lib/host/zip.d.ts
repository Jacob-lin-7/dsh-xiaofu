export interface ZipEntry {
    name: string;
    data: Buffer;
}
/**
 * 最小 ZIP 写入器：deflate + UTF-8 文件名，足够导出 petpack。
 * 不追求 zip64；单包上限 50MB，远低于 4GB。
 */
export declare function createZip(entries: ZipEntry[]): Buffer;

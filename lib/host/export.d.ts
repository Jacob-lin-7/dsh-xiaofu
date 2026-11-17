/** 把已安装的 pack 目录原样打回 petpack.zip。 */
export declare function exportPack(dataDir: string, id: string): Promise<{
    buffer: Buffer;
    filename: string;
}>;

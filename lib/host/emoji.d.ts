export declare const MAX_EMOJI_BYTES: number;
export interface EmojiItem {
    id: string;
    name: string;
    description: string;
    file: string;
    createdAt: number;
}
export declare class EmojiError extends Error {
    readonly code: string;
    readonly status: number;
    constructor(code: string, message: string, status?: number);
}
export declare class EmojiStore {
    private readonly dataDir;
    private readonly dir;
    private readonly metaPath;
    constructor(dataDir: string);
    private readMeta;
    private writeMeta;
    list(): Promise<EmojiItem[]>;
    add(input: {
        name?: string;
        description?: string;
        data: Buffer;
    }): Promise<EmojiItem>;
    remove(id: string): Promise<boolean>;
    update(id: string, patch: {
        name?: string;
        description?: string;
    }): Promise<EmojiItem | undefined>;
    asset(id: string): Promise<{
        path: string;
        contentType: string;
        size: number;
    } | undefined>;
}

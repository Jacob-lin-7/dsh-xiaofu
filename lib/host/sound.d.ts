export declare const MAX_SOUND_BYTES: number;
export declare class SoundError extends Error {
    readonly code: string;
    readonly status: number;
    constructor(code: string, message: string, status?: number);
}
export declare class SoundStore {
    private readonly dir;
    constructor(dataDir: string);
    set(data: Buffer): Promise<{
        file: string;
        contentType: string;
    }>;
    asset(file: string): Promise<{
        path: string;
        contentType: string;
        size: number;
    } | undefined>;
    remove(file: string): Promise<void>;
}

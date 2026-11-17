export interface FfmpegLocation {
    path: string;
    source: 'env' | 'managed' | 'path';
}
export interface MediaStatus {
    available: boolean;
    path?: string;
    source?: FfmpegLocation['source'];
    version?: string;
    error?: string;
}
export interface DownloadState {
    status: 'idle' | 'downloading' | 'extracting' | 'done' | 'failed';
    received: number;
    total: number;
    error?: string;
}
export declare function findFfmpegPath(dataDir: string, env?: NodeJS.ProcessEnv): FfmpegLocation | undefined;
export declare class MediaManager {
    private readonly dataDir;
    private state;
    constructor(dataDir: string);
    private binDir;
    status(): Promise<MediaStatus>;
    downloadState(): DownloadState;
    startDownload(): DownloadState;
    private runDownload;
}
export declare function extractFfmpeg(zipPath: string, target: string): Promise<void>;

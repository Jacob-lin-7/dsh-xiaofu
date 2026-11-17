import type { ConfigStore } from './config.js';
export declare const MAX_GENERATE_ZIP_BYTES: number;
export declare const MAX_FRAMES = 300;
export declare const MAX_FRAME_BYTES: number;
export declare function frameSortKey(name: string): number;
export declare function inspectFrames(buffer: Buffer): Promise<FrameInspection>;
export interface GenerateOptions {
    dataDir: string;
    buffer: Buffer;
    name: string;
    id: string;
    store: ConfigStore;
    ffmpegPath: string;
    fps?: number;
    segmentMeta?: Record<string, {
        fps?: number;
        mode?: 'loop' | 'once';
    }>;
    onProgress?: (percent: number, message: string) => void;
    isCancelled?: () => boolean;
}
export interface InspectionSegment {
    name: string;
    frames: number;
}
export interface FrameInspection {
    segments: InspectionSegment[];
    preview?: string;
}
export interface GenerateResult {
    id: string;
    name: string;
    version: string;
    animations: string[];
    animationMeta?: Record<string, {
        fps: number;
        mode: 'loop' | 'once';
    }>;
    preview: string;
    frames: number;
    segments: string[];
}
export declare function generatePack(options: GenerateOptions): Promise<GenerateResult>;
export declare const MAX_PASSTHROUGH_BYTES: number;
/** 已符合规格的透明 webm：不重编码，直接建包。 */
export declare function importTransparentWebm(options: {
    dataDir: string;
    buffer: Buffer;
    name: string;
    id: string;
    store: ConfigStore;
}): Promise<GenerateResult>;

export type DesktopStatus = 'stopped' | 'starting' | 'running' | 'provisioning' | 'failed';
export interface DesktopAnimation {
    name: string;
    path: string;
    mode: 'loop' | 'once';
    fps?: number;
}
export interface DesktopStartOptions {
    petId: string;
    name?: string;
    videoPath: string;
    idleVideoPaths?: string[];
    clickVideoPath?: string;
    clickVideoPaths?: string[];
    doubleClickVideoPath?: string;
    doubleClickVideoPaths?: string[];
    animations?: DesktopAnimation[];
    animationsFile?: string;
    packsFile?: string;
    currentPack?: string;
    dshUrl?: string;
    iconPath?: string;
    size: number;
    corner: string;
    marginX: number;
    marginY: number;
    x?: number;
    y?: number;
    /** 0 = 无限期隐藏；正数 = 恢复时间戳；undefined = 立即可见 */
    hiddenUntil?: number;
    soundClick?: boolean;
    soundVolume?: number;
    soundFile?: string;
    bubbleQuotes?: string[];
    bubbleDuration?: number;
    bubbleStyle?: Record<string, unknown>;
    emojiFile?: string;
    fontFamily?: string;
    fontSize?: number;
    clickAction?: string;
    doubleClickAction?: string;
    clickEnabled?: boolean;
    roamEnabled?: boolean;
}
export interface DesktopWindow {
    petId: string;
    pid?: number;
    restarts?: number;
}
export interface DesktopSnapshot {
    status: DesktopStatus;
    pid?: number;
    error?: string;
    windows: DesktopWindow[];
    failed?: Array<{
        petId: string;
        error: string;
    }>;
    /** 首次启动桌面模式时自动下载 Electron 的进度。 */
    provisioning?: {
        percent: number;
        message: string;
    };
}
export declare class DesktopManager {
    private children;
    private desired;
    private attempts;
    private timers;
    private failedPets;
    private intentional;
    private errorValue;
    private provisioningState;
    private provisioningStarted;
    private requestHandler;
    constructor();
    setRequestHandler(handler: (message: Record<string, unknown>) => Promise<Record<string, unknown>>): void;
    status(): DesktopSnapshot;
    private electronPath;
    private helperPath;
    start(options: DesktopStartOptions): DesktopSnapshot;
    private spawn;
    /**
     * 首次启动桌面模式时，本机没有 Electron：自动下载并解压，
     * 期间 status() 报告 provisioning 进度，完成后补齐所有待启动的宠物。
     */
    private startProvisioning;
    isRunning(petId: string): boolean;
    updatePosition(petId: string, x: number, y: number): void;
    stopPet(petId: string): DesktopSnapshot;
    stop(): DesktopSnapshot;
}
export declare const desktopManager: DesktopManager;

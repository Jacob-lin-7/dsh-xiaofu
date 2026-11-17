export interface ElectronProgress {
    phase: 'checking' | 'downloading' | 'extracting' | 'ready' | 'failed';
    percent: number;
    message: string;
}
export declare function electronVersion(): string;
export declare function electronHome(): string;
/** 解压后 Electron 可执行文件在一份发行包里的相对路径。 */
export declare function electronExecutable(dir: string): string;
/** 现有的可用 Electron；找不到返回 undefined。 */
export declare function findElectron(): string | undefined;
/**
 * 确保 Electron 可用。已存在则直接返回；否则下载解压。
 * 并发调用共享同一次下载。
 */
export declare function ensureElectron(onProgress?: (progress: ElectronProgress) => void): Promise<string | undefined>;
/** 供诊断用：当前 Electron 来源与版本信息。 */
export declare function electronDiagnostics(): Record<string, unknown>;

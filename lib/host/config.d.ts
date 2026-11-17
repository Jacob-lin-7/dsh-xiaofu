import { type Config } from '../shared/schema.js';
export declare function resolveDshHome(): string;
export declare function resolveDataDir(): string;
export interface ConfigStoreOptions {
    dataDir: string;
    logger?: {
        warn(message: string): void;
    };
}
/**
 * 配置存储：单一写入者、原子写、轮转备份。
 * 读失败时依次尝试 .bak.1 ~ .bak.3，全部失败才回出厂默认。
 */
export declare class ConfigStore {
    readonly dataDir: string;
    readonly configPath: string;
    private readonly logger;
    private readonly writeListeners;
    constructor(options: ConfigStoreOptions);
    /** 宿主写入成功后回调；用于热重载 watcher 区分“自己写的”和“外部改的”。 */
    onWrite(listener: (config: Config) => void): () => void;
    private backupPath;
    read(): Promise<Config>;
    write(input: unknown): Promise<Config>;
    private tryRead;
    private rotateBackups;
}

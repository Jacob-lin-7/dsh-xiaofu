import type { Config } from '../shared/schema.js';
export interface LlmStatus {
    enabled: boolean;
    configured: boolean;
    paused: boolean;
    failures: number;
    lastError: string;
    model: string;
    endpoint: string;
}
export interface WhisperResult {
    ok: boolean;
    text?: string;
    error?: string;
    paused: boolean;
}
/**
 * LLM 失败隔离：所有网络/协议/配置错误都转成结果对象，不向上抛。
 * 连续失败 3 次自动暂停，调用 resume() 恢复。
 */
export declare class WhisperService {
    private readonly readConfig;
    private failures;
    private paused;
    private lastError;
    constructor(readConfig: () => Promise<Config>);
    status(): Promise<LlmStatus>;
    resume(): void;
    private fail;
    whisper(prompt?: string): Promise<WhisperResult>;
}

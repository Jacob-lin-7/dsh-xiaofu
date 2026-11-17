import type { Config } from '../shared/schema.js';
export interface ActiveState {
    event: string;
    label: string;
    animation: string;
    animations: string[];
    bubble: string;
    quotes: string[];
    durationMs: number;
    gapMs: number;
    followAction: boolean;
    detail?: string;
    since: number;
    until?: number;
}
export declare class StateError extends Error {
    readonly code: string;
    readonly status: number;
    constructor(code: string, message: string, status?: number);
}
export declare class StateController {
    private readonly readConfig;
    private active;
    private timer;
    private onExpire;
    private readonly listeners;
    constructor(readConfig: () => Promise<Config>);
    subscribe(listener: (state: ActiveState | null) => void): () => void;
    private notify;
    private findEntry;
    private clearTimer;
    clear(): void;
    trigger(event: string, detail?: string, onExpire?: () => void | Promise<void>): Promise<ActiveState>;
    current(): ActiveState | null;
}

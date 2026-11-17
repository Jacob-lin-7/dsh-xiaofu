export interface AccountBalance {
    available: boolean;
    currencies: Record<string, number>;
    error?: string;
}
export declare function readAccountBalance(getBalance?: () => Promise<unknown>, timeoutMs?: number): Promise<AccountBalance>;
export declare function tokensInUsage(usage: unknown): number;
export declare class TaskUsageGuard {
    tokens: number;
    triggered: boolean;
    taskId: number;
    start(): void;
    add(tokens: number): void;
}

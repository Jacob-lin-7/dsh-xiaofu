import type { IncomingMessage, ServerResponse } from 'node:http';
export declare const name = "dsh-xiaofu";
export declare const inject: string[];
export declare function apply(ctx: {
    effect(fn: () => unknown, label?: string): void;
    webServer: {
        port?: number;
        register(options: {
            kind: 'prefix';
            path: string;
            handler: (req: IncomingMessage, res: ServerResponse) => Promise<void> | void;
        }): unknown;
    };
    /** 可选：DSH 实时 Agent 注册表；旧宿主没有该服务时状态显示为不可用。 */
    agents?: {
        list(): Array<{
            status?: string;
        }>;
    };
    deepseekAccount?: {
        getBalance(): Promise<unknown>;
    };
    inject?(deps: string[], callback: (ctx: Record<string, unknown>) => unknown): unknown;
    on?(event: string, listener: (...args: any[]) => unknown, options?: {
        prepend?: boolean;
        global?: boolean;
    }): unknown;
}): void;

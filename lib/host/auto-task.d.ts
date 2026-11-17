/**
 * 把 DSH 的 session/event 映射成桌宠状态。
 *
 * 参考 早期桌宠项目：宿主只负责“现在 agent 在做什么”，
 * 具体播哪个动作仍由用户的 stateMapping 决定。
 *
 * 与 早期桌宠项目 的全局 agentStatus 不同，这里按 session 记录任务状态：
 * 只有当前活跃 session 能驱动桌宠，后台 session 不会互相覆盖。
 */
export interface StateTrigger {
    trigger(event: string, detail?: string): Promise<unknown>;
}
export interface SessionEventLike {
    type?: string;
    data?: unknown;
}
export interface AutoTaskOptions {
    /** 任务开始后多久进入“耗时过长” */
    timeoutMs?: number;
    /** 超时动作结束后，多久回到“任务进行中” */
    returnMs?: number;
}
export declare class AutoTaskDriver {
    private readonly state;
    private readonly options;
    private readonly sessions;
    private activeSessionId;
    private taskActive;
    private approvalActive;
    private timer;
    private generation;
    constructor(state: StateTrigger, options?: AutoTaskOptions);
    get isTaskActive(): boolean;
    get isApprovalActive(): boolean;
    get activeSession(): string | null;
    private session;
    private clearTimer;
    private safeTrigger;
    private armTimeout;
    private armReturn;
    startTask(sessionId?: string): Promise<void>;
    /** 余额警告等临时状态结束后，回到当前任务；没有任务则保持空闲。 */
    resumeTask(): Promise<void>;
    endTask(sessionId?: string): Promise<void>;
    /** 把 approval/request 的 waterfall 包一层：等审批期间显示“等待确认”。 */
    wrapApproval<T>(sessionId: string, next: () => Promise<T>): Promise<T>;
    onSessionEvent(sessionId: string, event: SessionEventLike): void;
}

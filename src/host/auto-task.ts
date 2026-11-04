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

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
const DEFAULT_RETURN_MS = 5 * 60 * 1000;

interface SessionState {
  active: boolean;
  updatedAt: number;
}

export class AutoTaskDriver {
  private readonly sessions = new Map<string, SessionState>();
  private activeSessionId: string | null = null;
  private taskActive = false;
  private approvalActive = false;
  private timer: NodeJS.Timeout | null = null;
  private generation = 0;

  constructor(
    private readonly state: StateTrigger,
    private readonly options: AutoTaskOptions = {},
  ) {}

  get isTaskActive(): boolean {
    return this.taskActive;
  }

  get isApprovalActive(): boolean {
    return this.approvalActive;
  }

  get activeSession(): string | null {
    return this.activeSessionId;
  }

  private session(id: string): SessionState {
    let value = this.sessions.get(id);
    if (!value) {
      value = { active: false, updatedAt: 0 };
      this.sessions.set(id, value);
    }
    return value;
  }

  private clearTimer(): void {
    this.generation += 1;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private async safeTrigger(event: string, detail?: string): Promise<void> {
    try {
      await this.state.trigger(event, detail);
    } catch {
      // 没有配置对应动作时静默跳过；不要影响 DSH 会话。
    }
  }

  private armTimeout(ms: number): void {
    this.clearTimer();
    if (!this.taskActive || this.approvalActive) return;
    const token = this.generation;
    this.timer = setTimeout(() => {
      if (token !== this.generation || !this.taskActive || this.approvalActive) return;
      this.timer = null;
      void this.safeTrigger('task-timeout', '任务耗时过长').then(() => {
        if (!this.taskActive || this.approvalActive) return;
        this.armReturn();
      });
    }, ms);
    this.timer.unref();
  }

  private armReturn(): void {
    this.clearTimer();
    if (!this.taskActive || this.approvalActive) return;
    const token = this.generation;
    this.timer = setTimeout(() => {
      if (token !== this.generation || !this.taskActive || this.approvalActive) return;
      this.timer = null;
      void this.safeTrigger('task-start').then(() => {
        if (!this.taskActive || this.approvalActive) return;
        this.armTimeout(this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
      });
    }, this.options.returnMs ?? DEFAULT_RETURN_MS);
    this.timer.unref();
  }

  async startTask(sessionId = 'default'): Promise<void> {
    const entry = this.session(sessionId);
    entry.active = true;
    entry.updatedAt = Date.now();
    if (this.approvalActive) return;

    // 已经有前台 session 时，后台 session 只记状态，不抢桌宠。
    if (this.activeSessionId !== null && this.activeSessionId !== sessionId) return;

    this.activeSessionId = sessionId;
    if (!this.taskActive) {
      this.taskActive = true;
      await this.safeTrigger('task-start');
    }
    this.armTimeout(this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  }

  /** 余额警告等临时状态结束后，回到当前任务；没有任务则保持空闲。 */
  async resumeTask(): Promise<void> {
    if (!this.taskActive || this.approvalActive) return;
    await this.safeTrigger('task-start');
    this.armTimeout(this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  }

  async endTask(sessionId = 'default'): Promise<void> {    const entry = this.session(sessionId);
    entry.active = false;
    entry.updatedAt = Date.now();

    // 后台 session 结束不影响当前桌宠。
    if (this.activeSessionId !== null && this.activeSessionId !== sessionId) return;
    if (this.activeSessionId === null) return;

    this.clearTimer();
    this.taskActive = false;
    this.approvalActive = false;
    this.activeSessionId = null;
    await this.safeTrigger('task-done');
  }

  /** 把 approval/request 的 waterfall 包一层：等审批期间显示“等待确认”。 */
  async wrapApproval<T>(sessionId: string, next: () => Promise<T>): Promise<T> {
    // 后台 session 的审批不抢当前桌宠。
    if (this.activeSessionId !== null && this.activeSessionId !== sessionId) {
      return next();
    }
    const wasTask = this.taskActive;
    this.activeSessionId = sessionId;
    this.approvalActive = true;
    this.clearTimer();
    await this.safeTrigger('approval-needed');
    try {
      return await next();
    } finally {
      this.approvalActive = false;
      if (wasTask && this.taskActive) {
        await this.safeTrigger('task-start');
        this.armTimeout(this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
      }
    }
  }

  onSessionEvent(sessionId: string, event: SessionEventLike): void {
    const entry = this.session(sessionId);
    entry.updatedAt = Date.now();

    switch (event.type) {
      case 'turn/start':
        entry.active = true;
        void this.startTask(sessionId);
        return;
      case 'assistant/chunk':
      case 'tool/call':
      case 'tool/result':
        entry.active = true;
        if (!this.taskActive) void this.startTask(sessionId);
        return;
      case 'turn/end':
        void this.endTask(sessionId);
        return;
      default:
        return;
    }
  }
}

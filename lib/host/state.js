export class StateError extends Error {
    code;
    status;
    constructor(code, message, status = 400) {
        super(message);
        this.code = code;
        this.status = status;
        this.name = 'StateError';
    }
}
export class StateController {
    readConfig;
    active = null;
    timer = null;
    onExpire = null;
    listeners = new Set();
    constructor(readConfig) {
        this.readConfig = readConfig;
    }
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    notify() {
        for (const listener of this.listeners) {
            try {
                listener(this.active);
            }
            catch {
                // 单个订阅者失败不能影响其它订阅者
            }
        }
    }
    findEntry(config, event) {
        const pack = config.pets?.[0]?.pack;
        const entries = (pack ? config.stateMapping.byCharacter?.[pack]?.entries : undefined) ??
            config.stateMapping.entries ??
            [];
        return entries.find((entry) => entry.enabled && entry.event === event);
    }
    clearTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    clear() {
        this.clearTimer();
        this.onExpire = null;
        const changed = this.active !== null;
        this.active = null;
        if (changed)
            this.notify();
    }
    async trigger(event, detail, onExpire) {
        const config = await this.readConfig();
        const entry = this.findEntry(config, event);
        if (!entry) {
            throw new StateError('STATE_NOT_FOUND', `没有启用的状态映射：${event}`, 404);
        }
        this.clearTimer();
        this.onExpire = onExpire ?? null;
        const now = Date.now();
        const animations = entry.animations && entry.animations.length > 0
            ? entry.animations
            : [entry.animation];
        const quotes = config.bubble?.stateQuotes?.[entry.event] ?? [];
        const quoteList = quotes.length > 0 ? quotes : entry.bubble ? [entry.bubble] : [];
        const timing = config.bubble?.stateTiming?.[entry.event];
        const bubble = quoteList[0] ?? '';
        const holdDefaults = {
            'task-done': 1200,
            'task-timeout': 300,
            'balance-warning': 120,
        };
        const holdSeconds = entry.event in holdDefaults
            ? entry.holdSec || holdDefaults[entry.event]
            : entry.durationSec;
        const active = {
            event: entry.event,
            label: entry.label || entry.event,
            animation: animations[0],
            animations,
            bubble,
            quotes: quoteList,
            durationMs: timing?.durationMs ?? config.bubble?.durationMs ?? 3200,
            gapMs: timing?.gapMs ?? 1200,
            followAction: Boolean(timing?.followAction),
            detail,
            since: now,
            ...(holdSeconds > 0 ? { until: now + holdSeconds * 1000 } : {}),
        };
        this.active = active;
        this.notify();
        if (holdSeconds > 0) {
            this.timer = setTimeout(() => {
                this.active = null;
                this.timer = null;
                const expire = this.onExpire;
                this.onExpire = null;
                this.notify();
                if (expire)
                    void Promise.resolve().then(expire);
            }, holdSeconds * 1000);
            this.timer.unref();
        }
        return active;
    }
    current() {
        if (this.active?.until && Date.now() >= this.active.until) {
            this.clear();
        }
        return this.active;
    }
}

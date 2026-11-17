function sumWallets(raw) {
    const result = {};
    const snapshot = (raw ?? {});
    if (snapshot.status && snapshot.status !== 'ready') {
        throw new Error(`account status: ${snapshot.status}`);
    }
    const wallets = [
        ...(Array.isArray(snapshot.value) ? snapshot.value : []),
        ...(Array.isArray(snapshot.bonusWallets) ? snapshot.bonusWallets : []),
    ];
    for (const wallet of wallets) {
        const currency = String(wallet.currency ?? '').toUpperCase();
        const amount = Number(wallet.balance);
        if (!currency || !Number.isFinite(amount))
            continue;
        result[currency] = (result[currency] ?? 0) + amount;
    }
    return result;
}
export async function readAccountBalance(getBalance, timeoutMs = 12000) {
    if (!getBalance) {
        return { available: false, currencies: {}, error: '当前宿主没有 deepseekAccount 服务' };
    }
    try {
        let timer;
        const timeout = new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error(`余额查询超时（${Math.round(timeoutMs / 1000)} 秒）`)), timeoutMs);
            timer.unref();
        });
        try {
            const raw = await Promise.race([getBalance(), timeout]);
            if (raw === null || raw === undefined) {
                return { available: false, currencies: {}, error: '当前账户未登录或授权已失效' };
            }
            const currencies = sumWallets(raw);
            return { available: true, currencies };
        }
        finally {
            if (timer)
                clearTimeout(timer);
        }
    }
    catch (error) {
        return {
            available: false,
            currencies: {},
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
export function tokensInUsage(usage) {
    if (!usage || typeof usage !== 'object')
        return 0;
    const value = usage;
    const sum = [
        value.inputTokens,
        value.cacheReadTokens,
        value.cacheWriteTokens,
        value.outputTokens,
    ].reduce((total, item) => total + (Number.isFinite(Number(item)) ? Number(item) : 0), 0);
    return Math.max(0, Math.round(sum));
}
export class TaskUsageGuard {
    tokens = 0;
    triggered = false;
    taskId = 0;
    start() {
        this.taskId += 1;
        this.tokens = 0;
        this.triggered = false;
    }
    add(tokens) {
        this.tokens = Math.max(0, this.tokens + Math.max(0, Math.round(tokens)));
    }
}

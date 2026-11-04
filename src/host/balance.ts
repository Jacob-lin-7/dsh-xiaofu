export interface AccountBalance {
  available: boolean;
  currencies: Record<string, number>;
  error?: string;
}

function sumWallets(raw: unknown): Record<string, number> {
  const result: Record<string, number> = {};
  const snapshot = (raw ?? {}) as {
    status?: string;
    value?: Array<{ currency?: string; balance?: string | number }>;
    bonusWallets?: Array<{ currency?: string; balance?: string | number }>;
  };
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
    if (!currency || !Number.isFinite(amount)) continue;
    result[currency] = (result[currency] ?? 0) + amount;
  }
  return result;
}

export async function readAccountBalance(
  getBalance?: () => Promise<unknown>,
): Promise<AccountBalance> {
  if (!getBalance) {
    return { available: false, currencies: {}, error: '当前宿主没有 deepseekAccount 服务' };
  }
  try {
    const currencies = sumWallets(await getBalance());
    return { available: true, currencies };
  } catch (error) {
    return {
      available: false,
      currencies: {},
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function tokensInUsage(usage: unknown): number {
  if (!usage || typeof usage !== 'object') return 0;
  const value = usage as {
    inputTokens?: unknown;
    cacheReadTokens?: unknown;
    cacheWriteTokens?: unknown;
    outputTokens?: unknown;
  };
  const sum = [
    value.inputTokens,
    value.cacheReadTokens,
    value.cacheWriteTokens,
    value.outputTokens,
  ].reduce<number>((total, item) => total + (Number.isFinite(Number(item)) ? Number(item) : 0), 0);
  return Math.max(0, Math.round(sum));
}

export class TaskUsageGuard {  tokens = 0;
  triggered = false;
  taskId = 0;

  start(): void {
    this.taskId += 1;
    this.tokens = 0;
    this.triggered = false;
  }

  add(tokens: number): void {
    this.tokens = Math.max(0, this.tokens + Math.max(0, Math.round(tokens)));
  }
}

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
export class WhisperService {
  private failures = 0;
  private paused = false;
  private lastError = '';

  constructor(private readonly readConfig: () => Promise<Config>) {}

  async status(): Promise<LlmStatus> {
    const settings = (await this.readConfig()).llm;
    return {
      enabled: settings.enabled,
      configured: Boolean(settings.endpoint.trim() && settings.model.trim()),
      paused: this.paused,
      failures: this.failures,
      lastError: this.lastError,
      model: settings.model,
      endpoint: settings.endpoint,
    };
  }

  resume(): void {
    this.failures = 0;
    this.paused = false;
    this.lastError = '';
  }

  private fail(message: string): WhisperResult {
    this.failures += 1;
    this.lastError = message;
    if (this.failures >= 3) this.paused = true;
    return {
      ok: false,
      error: this.paused ? `${message}（连续失败 3 次，已暂停）` : message,
      paused: this.paused,
    };
  }

  async whisper(prompt = '用一句 20 字以内的中文，像桌宠一样说一句当下的碎碎念。'): Promise<WhisperResult> {
    if (this.paused) {
      return { ok: false, error: 'LLM 已暂停，请手动恢复', paused: true };
    }
    let settings;
    try {
      settings = (await this.readConfig()).llm;
    } catch (error) {
      return this.fail(`读取配置失败：${error instanceof Error ? error.message : String(error)}`);
    }
    if (!settings.enabled) return this.fail('LLM 未启用');
    if (!settings.endpoint.trim() || !settings.model.trim()) {
      return this.fail('未配置 LLM endpoint / model');
    }

    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      const key = process.env.DSH_XIAOFU_LLM_KEY ?? process.env.DSH_HEX_PET_LLM_KEY;
      if (key) headers.authorization = `Bearer ${key}`;
      const response = await fetch(settings.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: settings.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 80,
        }),
        signal: AbortSignal.timeout(settings.timeoutMs),
      });
      if (!response.ok) {
        return this.fail(`LLM 返回 HTTP ${response.status}`);
      }
      const body = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = body.choices?.[0]?.message?.content?.trim();
      if (!text) return this.fail('LLM 返回为空');
      this.failures = 0;
      this.lastError = '';
      return { ok: true, text, paused: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.fail(`LLM 请求失败：${message}`);
    }
  }
}

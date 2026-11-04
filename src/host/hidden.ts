import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export interface HiddenEntry {
  petId: string;
  until: number;
}

interface HiddenFile {
  version?: number;
  hidden?: Record<string, number>;
}

/**
 * 桌面隐藏状态的持久化。
 *
 * `until = 0` 表示无限期隐藏（托盘「显示/隐藏」），正数是恢复时间戳。
 * 写入走 temp → rename；失败只吞掉，不让磁盘问题中断隐藏本身。
 */
export class HiddenStore {
  private readonly values = new Map<string, number>();

  constructor(private readonly file: string) {}

  load(now = Date.now()): void {
    this.values.clear();
    try {
      if (!existsSync(this.file)) return;
      const parsed = JSON.parse(readFileSync(this.file, 'utf8')) as HiddenFile;
      const hidden = parsed?.hidden ?? {};
      for (const [petId, until] of Object.entries(hidden)) {
        if (!petId || typeof until !== 'number' || !Number.isFinite(until)) continue;
        if (until !== 0 && until <= now) continue;
        this.values.set(petId, until);
      }
    } catch {
      // 坏文件按空状态处理
    }
  }

  get(petId: string, now = Date.now()): number | undefined {
    const until = this.values.get(petId);
    if (until === undefined) return undefined;
    if (until !== 0 && until <= now) {
      this.delete(petId);
      return undefined;
    }
    return until;
  }

  set(petId: string, until: number): void {
    if (!petId || !Number.isFinite(until)) return;
    this.values.set(petId, until);
    this.save();
  }

  delete(petId: string): void {
    if (this.values.delete(petId)) this.save();
  }

  clear(): void {
    if (this.values.size === 0) return;
    this.values.clear();
    this.save();
  }

  snapshot(now = Date.now()): HiddenEntry[] {
    const result: HiddenEntry[] = [];
    let changed = false;
    for (const [petId, until] of this.values) {
      if (until !== 0 && until <= now) {
        this.values.delete(petId);
        changed = true;
        continue;
      }
      result.push({ petId, until });
    }
    if (changed) this.save();
    return result;
  }

  private save(): void {
    try {
      mkdirSync(dirname(this.file), { recursive: true });
      const tmp = `${this.file}.tmp`;
      const payload: HiddenFile = { version: 1, hidden: Object.fromEntries(this.values) };
      writeFileSync(tmp, JSON.stringify(payload), 'utf8');
      renameSync(tmp, this.file);
    } catch {
      // 持久化失败不影响隐藏本身
    }
  }
}

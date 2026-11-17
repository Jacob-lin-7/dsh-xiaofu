import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
/**
 * 桌面隐藏状态的持久化。
 *
 * `until = 0` 表示无限期隐藏（托盘「显示/隐藏」），正数是恢复时间戳。
 * 写入走 temp → rename；失败只吞掉，不让磁盘问题中断隐藏本身。
 */
export class HiddenStore {
    file;
    values = new Map();
    constructor(file) {
        this.file = file;
    }
    load(now = Date.now()) {
        this.values.clear();
        try {
            if (!existsSync(this.file))
                return;
            const parsed = JSON.parse(readFileSync(this.file, 'utf8'));
            const hidden = parsed?.hidden ?? {};
            for (const [petId, until] of Object.entries(hidden)) {
                if (!petId || typeof until !== 'number' || !Number.isFinite(until))
                    continue;
                if (until !== 0 && until <= now)
                    continue;
                this.values.set(petId, until);
            }
        }
        catch {
            // 坏文件按空状态处理
        }
    }
    get(petId, now = Date.now()) {
        const until = this.values.get(petId);
        if (until === undefined)
            return undefined;
        if (until !== 0 && until <= now) {
            this.delete(petId);
            return undefined;
        }
        return until;
    }
    set(petId, until) {
        if (!petId || !Number.isFinite(until))
            return;
        this.values.set(petId, until);
        this.save();
    }
    delete(petId) {
        if (this.values.delete(petId))
            this.save();
    }
    clear() {
        if (this.values.size === 0)
            return;
        this.values.clear();
        this.save();
    }
    snapshot(now = Date.now()) {
        const result = [];
        let changed = false;
        for (const [petId, until] of this.values) {
            if (until !== 0 && until <= now) {
                this.values.delete(petId);
                changed = true;
                continue;
            }
            result.push({ petId, until });
        }
        if (changed)
            this.save();
        return result;
    }
    save() {
        try {
            mkdirSync(dirname(this.file), { recursive: true });
            const tmp = `${this.file}.tmp`;
            const payload = { version: 1, hidden: Object.fromEntries(this.values) };
            writeFileSync(tmp, JSON.stringify(payload), 'utf8');
            renameSync(tmp, this.file);
        }
        catch {
            // 持久化失败不影响隐藏本身
        }
    }
}

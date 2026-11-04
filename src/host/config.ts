import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, renameSync } from 'node:fs';
import { copyFile, mkdir, open, readFile, rename, rm } from 'node:fs/promises';
import { configSchema, defaultConfig, type Config } from '../shared/schema.js';

export function resolveDshHome(): string {
  return process.env.DSH_HOME && process.env.DSH_HOME.trim().length > 0
    ? process.env.DSH_HOME
    : join(homedir(), '.dsh');
}

export function resolveDataDir(): string {
  const home = resolveDshHome();
  const next = join(home, 'dsh-xiaofu');
  const legacy = join(home, 'dsh-hex-pet');
  if (!existsSync(next) && existsSync(legacy)) {
    try {
      renameSync(legacy, next);
    } catch {
      // 迁移失败时退回旧目录，保证配置可用。
      return legacy;
    }
  }
  return next;
}

const BACKUP_COUNT = 3;

export interface ConfigStoreOptions {
  dataDir: string;
  logger?: { warn(message: string): void };
}

/**
 * 配置存储：单一写入者、原子写、轮转备份。
 * 读失败时依次尝试 .bak.1 ~ .bak.3，全部失败才回出厂默认。
 */
export class ConfigStore {
  readonly dataDir: string;
  readonly configPath: string;
  private readonly logger: { warn(message: string): void };
  private readonly writeListeners = new Set<(config: Config) => void>();

  constructor(options: ConfigStoreOptions) {
    this.dataDir = options.dataDir;
    this.configPath = join(this.dataDir, 'main-config.json');
    this.logger = options.logger ?? { warn: (m) => console.warn(m) };
  }

  /** 宿主写入成功后回调；用于热重载 watcher 区分“自己写的”和“外部改的”。 */
  onWrite(listener: (config: Config) => void): () => void {
    this.writeListeners.add(listener);
    return () => this.writeListeners.delete(listener);
  }

  private backupPath(index: number): string {
    return `${this.configPath}.bak.${index}`;
  }

  async read(): Promise<Config> {
    const primary = await this.tryRead(this.configPath);
    if (primary) return primary;

    for (let i = 1; i <= BACKUP_COUNT; i += 1) {
      const backup = await this.tryRead(this.backupPath(i));
      if (backup) {
        this.logger.warn(`dsh-xiaofu: 主配置不可用，已从 ${this.backupPath(i)} 恢复`);
        return backup;
      }
    }

    return defaultConfig();
  }

  async write(input: unknown): Promise<Config> {
    const parsed = configSchema.parse(input);
    await mkdir(this.dataDir, { recursive: true });
    await this.rotateBackups();

    const tmp = join(
      this.dataDir,
      `.main-config.${process.pid}.${Date.now()}.tmp`,
    );
    const handle = await open(tmp, 'w');
    try {
      await handle.writeFile(`${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
      await handle.sync();
    } finally {
      await handle.close();
    }

    try {
      await rename(tmp, this.configPath);
    } catch (error) {
      await rm(tmp, { force: true });
      throw error;
    }
    for (const listener of this.writeListeners) {
      try {
        listener(parsed);
      } catch {
        // 监听器失败不影响写入
      }
    }
    return parsed;
  }

  private async tryRead(path: string): Promise<Config | undefined> {
    let raw: string;
    try {
      raw = await readFile(path, 'utf8');
    } catch {
      return undefined;
    }
    try {
      return configSchema.parse(JSON.parse(raw));
    } catch {
      this.logger.warn(`dsh-xiaofu: 配置解析失败：${path}`);
      return undefined;
    }
  }

  private async rotateBackups(): Promise<void> {
    try {
      await readFile(this.configPath);
    } catch {
      return; // 还没有主配置，无需备份
    }

    await rm(this.backupPath(BACKUP_COUNT), { force: true });
    for (let i = BACKUP_COUNT - 1; i >= 1; i -= 1) {
      await rm(this.backupPath(i + 1), { force: true });
      try {
        await rename(this.backupPath(i), this.backupPath(i + 1));
      } catch {
        // 该份备份不存在，跳过
      }
    }
    await copyFile(this.configPath, this.backupPath(1));
  }
}

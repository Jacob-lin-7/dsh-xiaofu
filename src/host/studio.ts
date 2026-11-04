import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export type StudioJobStatus = 'waiting' | 'running' | 'done' | 'failed' | 'cancelled';

export interface StudioJob {
  id: string;
  kind: 'character' | 'action' | 'other';
  note: string;
  status: StudioJobStatus;
  createdAt: number;
  updatedAt: number;
  result?: string;
  error?: string;
}

export class StudioStore {
  private jobs = new Map<string, StudioJob>();
  private loaded = false;

  constructor(private readonly dataDir: string) {}

  private get file(): string {
    return join(this.dataDir, 'studio-jobs.json');
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;
    try {
      const raw = await readFile(this.file, 'utf8');
      const items = JSON.parse(raw) as StudioJob[];
      for (const item of items) this.jobs.set(item.id, item);
    } catch {
      // first run
    }
  }

  private async persist(): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    await writeFile(this.file, `${JSON.stringify([...this.jobs.values()], null, 2)}\n`, 'utf8');
  }

  async create(kind: StudioJob['kind'], note: string): Promise<StudioJob> {
    await this.ensureLoaded();
    const now = Date.now();
    const job: StudioJob = {
      id: `studio-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      kind,
      note,
      status: 'waiting',
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(job.id, job);
    await this.persist();
    return job;
  }

  async list(): Promise<StudioJob[]> {
    await this.ensureLoaded();
    return [...this.jobs.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  async get(id: string): Promise<StudioJob | undefined> {
    await this.ensureLoaded();
    return this.jobs.get(id);
  }

  async update(
    id: string,
    patch: Partial<Pick<StudioJob, 'status' | 'result' | 'error'>>,
  ): Promise<StudioJob | undefined> {
    await this.ensureLoaded();
    const job = this.jobs.get(id);
    if (!job) return undefined;
    Object.assign(job, patch, { updatedAt: Date.now() });
    await this.persist();
    return job;
  }
}

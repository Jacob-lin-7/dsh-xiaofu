import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
export class StudioStore {
    dataDir;
    jobs = new Map();
    loaded = false;
    constructor(dataDir) {
        this.dataDir = dataDir;
    }
    get file() {
        return join(this.dataDir, 'studio-jobs.json');
    }
    async ensureLoaded() {
        if (this.loaded)
            return;
        this.loaded = true;
        try {
            const raw = await readFile(this.file, 'utf8');
            const items = JSON.parse(raw);
            for (const item of items)
                this.jobs.set(item.id, item);
        }
        catch {
            // first run
        }
    }
    async persist() {
        await mkdir(this.dataDir, { recursive: true });
        await writeFile(this.file, `${JSON.stringify([...this.jobs.values()], null, 2)}\n`, 'utf8');
    }
    async create(kind, note) {
        await this.ensureLoaded();
        const now = Date.now();
        const job = {
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
    async list() {
        await this.ensureLoaded();
        return [...this.jobs.values()].sort((a, b) => b.createdAt - a.createdAt);
    }
    async get(id) {
        await this.ensureLoaded();
        return this.jobs.get(id);
    }
    async update(id, patch) {
        await this.ensureLoaded();
        const job = this.jobs.get(id);
        if (!job)
            return undefined;
        Object.assign(job, patch, { updatedAt: Date.now() });
        await this.persist();
        return job;
    }
}

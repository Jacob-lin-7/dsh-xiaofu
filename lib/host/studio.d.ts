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
export declare class StudioStore {
    private readonly dataDir;
    private jobs;
    private loaded;
    constructor(dataDir: string);
    private get file();
    private ensureLoaded;
    private persist;
    create(kind: StudioJob['kind'], note: string): Promise<StudioJob>;
    list(): Promise<StudioJob[]>;
    get(id: string): Promise<StudioJob | undefined>;
    update(id: string, patch: Partial<Pick<StudioJob, 'status' | 'result' | 'error'>>): Promise<StudioJob | undefined>;
}

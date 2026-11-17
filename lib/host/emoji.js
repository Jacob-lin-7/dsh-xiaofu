import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
export const MAX_EMOJI_BYTES = 5 * 1024 * 1024;
export class EmojiError extends Error {
    code;
    status;
    constructor(code, message, status = 400) {
        super(message);
        this.code = code;
        this.status = status;
        this.name = 'EmojiError';
    }
}
function detectImage(data) {
    if (data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
        return { ext: '.png', type: 'image/png' };
    }
    if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
        return { ext: '.jpg', type: 'image/jpeg' };
    }
    if (data.length >= 12 &&
        data.subarray(0, 4).toString('ascii') === 'RIFF' &&
        data.subarray(8, 12).toString('ascii') === 'WEBP') {
        return { ext: '.webp', type: 'image/webp' };
    }
    if (data.length >= 6 && data.subarray(0, 6).toString('ascii').startsWith('GIF8')) {
        return { ext: '.gif', type: 'image/gif' };
    }
    return undefined;
}
export class EmojiStore {
    dataDir;
    dir;
    metaPath;
    constructor(dataDir) {
        this.dataDir = dataDir;
        this.dir = join(dataDir, 'emoji');
        this.metaPath = join(this.dir, 'emoji.json');
    }
    async readMeta() {
        try {
            const parsed = JSON.parse(await readFile(this.metaPath, 'utf8'));
            return {
                version: 1,
                items: Array.isArray(parsed.items) ? parsed.items : [],
            };
        }
        catch {
            return { version: 1, items: [] };
        }
    }
    async writeMeta(meta) {
        await mkdir(this.dir, { recursive: true });
        const tmp = `${this.metaPath}.${process.pid}.${Date.now()}.tmp`;
        await writeFile(tmp, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
        await rename(tmp, this.metaPath);
    }
    async list() {
        return (await this.readMeta()).items;
    }
    async add(input) {
        if (input.data.length > MAX_EMOJI_BYTES) {
            throw new EmojiError('TOO_LARGE', '表情图超过 5MB', 413);
        }
        const detected = detectImage(input.data);
        if (!detected) {
            throw new EmojiError('UNSUPPORTED_IMAGE', '只支持 PNG / JPEG / WebP / GIF');
        }
        const name = (input.name ?? '').trim().slice(0, 40) || '表情';
        const description = (input.description ?? '').trim().slice(0, 120);
        const id = `e-${Date.now().toString(36)}-${randomBytes(3).toString('hex')}`;
        const file = `${id}${detected.ext}`;
        await mkdir(this.dir, { recursive: true });
        await writeFile(join(this.dir, file), input.data);
        const meta = await this.readMeta();
        const item = { id, name, description, file, createdAt: Date.now() };
        meta.items.push(item);
        try {
            await this.writeMeta(meta);
        }
        catch (error) {
            await rm(join(this.dir, file), { force: true }).catch(() => { });
            throw error;
        }
        return item;
    }
    async remove(id) {
        const meta = await this.readMeta();
        const item = meta.items.find((candidate) => candidate.id === id);
        if (!item)
            return false;
        meta.items = meta.items.filter((candidate) => candidate.id !== id);
        await this.writeMeta(meta);
        await rm(join(this.dir, item.file), { force: true }).catch(() => { });
        return true;
    }
    async update(id, patch) {
        const meta = await this.readMeta();
        const item = meta.items.find((candidate) => candidate.id === id);
        if (!item)
            return undefined;
        if (typeof patch.name === 'string' && patch.name.trim()) {
            item.name = patch.name.trim().slice(0, 40);
        }
        if (typeof patch.description === 'string') {
            item.description = patch.description.trim().slice(0, 120);
        }
        await this.writeMeta(meta);
        return item;
    }
    async asset(id) {
        const item = (await this.readMeta()).items.find((candidate) => candidate.id === id);
        if (!item || item.file.includes('/') || item.file.includes('\\'))
            return undefined;
        const path = join(this.dir, item.file);
        try {
            const info = await stat(path);
            if (!info.isFile())
                return undefined;
            const type = detectImage(await readFile(path))?.type ?? 'application/octet-stream';
            return { path, contentType: type, size: info.size };
        }
        catch {
            return undefined;
        }
    }
}

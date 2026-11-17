import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
export const MAX_SOUND_BYTES = 2 * 1024 * 1024;
export class SoundError extends Error {
    code;
    status;
    constructor(code, message, status = 400) {
        super(message);
        this.code = code;
        this.status = status;
        this.name = 'SoundError';
    }
}
function detectAudio(data) {
    if (data.length >= 12 &&
        data.subarray(0, 4).toString('ascii') === 'RIFF' &&
        data.subarray(8, 12).toString('ascii') === 'WAVE') {
        return { ext: '.wav', type: 'audio/wav' };
    }
    if (data.length >= 3 &&
        ((data[0] === 0x49 && data[1] === 0x44 && data[2] === 0x33) ||
            (data[0] === 0xff && (data[1] & 0xe0) === 0xe0))) {
        return { ext: '.mp3', type: 'audio/mpeg' };
    }
    if (data.length >= 4 && data.subarray(0, 4).toString('ascii') === 'OggS') {
        return { ext: '.ogg', type: 'audio/ogg' };
    }
    return undefined;
}
export class SoundStore {
    dir;
    constructor(dataDir) {
        this.dir = join(dataDir, 'sounds');
    }
    async set(data) {
        if (data.length > MAX_SOUND_BYTES) {
            throw new SoundError('TOO_LARGE', '音效文件超过 2MB', 413);
        }
        const detected = detectAudio(data);
        if (!detected) {
            throw new SoundError('UNSUPPORTED_AUDIO', '只支持 WAV / MP3 / OGG');
        }
        await mkdir(this.dir, { recursive: true });
        for (const name of await readdir(this.dir)) {
            if (name.startsWith('click.'))
                await rm(join(this.dir, name), { force: true });
        }
        const file = `click${detected.ext}`;
        await writeFile(join(this.dir, file), data);
        return { file, contentType: detected.type };
    }
    async asset(file) {
        if (!file || file.includes('/') || file.includes('\\'))
            return undefined;
        try {
            const path = join(this.dir, file);
            const info = await stat(path);
            if (!info.isFile())
                return undefined;
            const type = detectAudio(await readFile(path))?.type ?? 'application/octet-stream';
            return { path, contentType: type, size: info.size };
        }
        catch {
            return undefined;
        }
    }
    async remove(file) {
        if (!file || file.includes('/') || file.includes('\\'))
            return;
        await rm(join(this.dir, file), { force: true }).catch(() => { });
    }
}

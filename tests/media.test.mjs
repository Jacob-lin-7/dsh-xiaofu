import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findFfmpegPath } from '../lib/host/media.js';

const executable = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';

test('DSH_PET_FFMPEG_PATH wins over managed and PATH', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hex-media-'));
  try {
    const explicit = join(root, 'custom-ffmpeg');
    await writeFile(explicit, '');
    await mkdir(join(root, 'data', 'bin'), { recursive: true });
    await writeFile(join(root, 'data', 'bin', executable), '');

    const found = findFfmpegPath(join(root, 'data'), {
      PATH: root,
      DSH_PET_FFMPEG_PATH: explicit,
    });
    assert.equal(found?.source, 'env');
    assert.equal(found?.path, explicit);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('managed ffmpeg is found when env is absent', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hex-media-'));
  try {
    await mkdir(join(root, 'data', 'bin'), { recursive: true });
    const managed = join(root, 'data', 'bin', executable);
    await writeFile(managed, '');

    const found = findFfmpegPath(join(root, 'data'), { PATH: '' });
    assert.equal(found?.source, 'managed');
    assert.equal(found?.path, managed);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('returns undefined when nothing is available', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hex-media-'));
  try {
    assert.equal(findFfmpegPath(join(root, 'data'), { PATH: '' }), undefined);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

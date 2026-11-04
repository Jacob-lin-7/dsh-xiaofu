import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SoundStore, MAX_SOUND_BYTES } from '../lib/host/sound.js';

const WAV = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0, 0, 0, 0]),
  Buffer.from('WAVEfmt '),
  Buffer.alloc(24),
]);

async function withStore(fn) {
  const home = await mkdtemp(join(tmpdir(), 'dsh-hex-sound-'));
  try {
    await fn(new SoundStore(home));
  } finally {
    await rm(home, { recursive: true, force: true });
  }
}

test('stores and serves a custom click sound', async () => {
  await withStore(async (store) => {
    const saved = await store.set(WAV);
    assert.equal(saved.file, 'click.wav');
    const asset = await store.asset(saved.file);
    assert.ok(asset);
    assert.equal(asset.contentType, 'audio/wav');
    assert.equal(asset.size, WAV.length);

    await store.remove(saved.file);
    assert.equal(await store.asset(saved.file), undefined);
  });
});

test('rejects unsupported and oversized audio', async () => {
  await withStore(async (store) => {
    await assert.rejects(
      () => store.set(Buffer.from('not audio')),
      (error) => error.code === 'UNSUPPORTED_AUDIO',
    );
    await assert.rejects(
      () => store.set(Buffer.alloc(MAX_SOUND_BYTES + 1)),
      (error) => error.code === 'TOO_LARGE',
    );
  });
});

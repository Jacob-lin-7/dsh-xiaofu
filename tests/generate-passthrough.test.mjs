import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore } from '../lib/host/config.js';
import { importTransparentWebm } from '../lib/host/generate.js';

const WEBM = Buffer.concat([
  Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
  Buffer.alloc(32, 7),
]);

async function withHome(fn) {
  const home = await mkdtemp(join(tmpdir(), 'dsh-hex-webm-'));
  try {
    await fn(home, new ConfigStore({ dataDir: home }));
  } finally {
    await rm(home, { recursive: true, force: true });
  }
}

test('imports a transparent webm without re-encoding', async () => {
  await withHome(async (home, store) => {
    const result = await importTransparentWebm({
      dataDir: home,
      buffer: WEBM,
      name: '直通形象',
      id: 'webm-demo',
      store,
    });
    assert.deepEqual(result.animations, ['animations/idle.webm']);
    const manifest = JSON.parse(
      await readFile(join(home, 'packs', 'webm-demo', 'manifest.json'), 'utf8'),
    );
    assert.equal(manifest.name, '直通形象');
    assert.deepEqual(manifest.animations, ['animations/idle.webm']);
    assert.equal((await store.read()).packs['webm-demo'].enabled, true);
  });
});

test('rejects a non-webm buffer and cleans up', async () => {
  await withHome(async (home, store) => {
    await assert.rejects(
      () =>
        importTransparentWebm({
          dataDir: home,
          buffer: Buffer.from('not webm'),
          name: 'bad',
          id: 'webm-bad',
          store,
        }),
      /WebM/,
    );
  });
});

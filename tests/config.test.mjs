import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore } from '../lib/host/config.js';
import { defaultConfig } from '../lib/shared/schema.js';

async function withStore(fn) {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-hex-pet-test-'));
  try {
    await fn(new ConfigStore({ dataDir: dir }), dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('missing config falls back to defaults', async () => {
  await withStore(async (store) => {
    const config = await store.read();
    assert.equal(config.pets[0].id, 'main');
  });
});

test('write is atomic and readable', async () => {
  await withStore(async (store) => {
    const input = defaultConfig();
    input.pets[0].name = '第一版';
    await store.write(input);
    const config = await store.read();
    assert.equal(config.pets[0].name, '第一版');
  });
});

test('second write keeps a backup and corrupt main recovers from it', async () => {
  await withStore(async (store, dir) => {
    const first = defaultConfig();
    first.pets[0].name = '第一版';
    await store.write(first);

    const second = defaultConfig();
    second.pets[0].name = '第二版';
    await store.write(second);

    const backup = JSON.parse(await readFile(join(dir, 'main-config.json.bak.1'), 'utf8'));
    assert.equal(backup.pets[0].name, '第一版');

    await writeFile(join(dir, 'main-config.json'), '{ broken', 'utf8');
    const recovered = await store.read();
    assert.equal(recovered.pets[0].name, '第一版');
  });
});

test('onWrite reports the saved config and can unsubscribe', async () => {
  await withStore(async (store) => {
    let seen;
    const off = store.onWrite((config) => {
      seen = config;
    });
    const input = defaultConfig();
    input.pets[0].name = '热重载';
    await store.write(input);
    assert.equal(seen.pets[0].name, '热重载');
    off();
    seen = undefined;
    await store.write(defaultConfig());
    assert.equal(seen, undefined);
  });
});

test('invalid input is rejected before touching disk', async () => {
  await withStore(async (store, dir) => {
    const before = await readFile(join(dir, 'main-config.json'), 'utf8').catch(() => undefined);
    await assert.rejects(() => store.write({ pets: [{ id: '' }] }));
    const after = await readFile(join(dir, 'main-config.json'), 'utf8').catch(() => undefined);
    assert.equal(before, after);
  });
});

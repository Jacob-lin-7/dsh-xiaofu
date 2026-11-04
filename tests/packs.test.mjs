import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConfigStore } from '../lib/host/config.js';
import { installPack, listPacks, deletePack, manifestSchema, PackError } from '../lib/host/packs.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = join(here, 'fixtures/sample.petpack.zip');

async function withDir(fn) {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-hex-pet-pack-'));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('installs a valid petpack and records it in config', async () => {
  await withDir(async (dataDir) => {
    const store = new ConfigStore({ dataDir });
    const buffer = await readFile(fixture);

    const pack = await installPack({ dataDir, buffer, store });
    assert.equal(pack.id, 'sample-cat');
    assert.equal(pack.name, 'Sample Cat');

    const installedFile = join(dataDir, 'packs', 'sample-cat', 'animations', 'idle.webm');
    assert.ok((await stat(installedFile)).isFile());

    const config = await store.read();
    assert.equal(config.packs['sample-cat'].version, '1.0.0');

    const packs = await listPacks(dataDir);
    assert.equal(packs.length, 1);
    assert.equal(packs[0].id, 'sample-cat');
  });
});

test('rejects a duplicate pack id', async () => {
  await withDir(async (dataDir) => {
    const store = new ConfigStore({ dataDir });
    const buffer = await readFile(fixture);
    await installPack({ dataDir, buffer, store });

    await assert.rejects(
      () => installPack({ dataDir, buffer, store }),
      (error) => error instanceof PackError && error.code === 'PACK_EXISTS',
    );
  });
});

test('rejects a non-zip buffer', async () => {
  await withDir(async (dataDir) => {
    const store = new ConfigStore({ dataDir });
    await assert.rejects(
      () => installPack({ dataDir, buffer: Buffer.from('not a zip'), store }),
      (error) => error instanceof PackError && error.code === 'INVALID_ZIP',
    );
  });
});

test('deletes a pack and rebinds pets using it', async () => {
  await withDir(async (dataDir) => {
    const store = new ConfigStore({ dataDir });
    const buffer = await readFile(fixture);
    await installPack({ dataDir, buffer, store });

    const config = await store.read();
    config.pets[0].pack = 'sample-cat';
    await store.write(config);

    await deletePack({ dataDir, id: 'sample-cat', store });

    const after = await store.read();
    assert.equal(after.packs['sample-cat'], undefined);
    assert.equal(after.pets[0].pack, 'builtin');
    await assert.rejects(() => stat(join(dataDir, 'packs', 'sample-cat')));
  });
});
test('manifest accepts per-animation fps and loop mode', () => {
  const manifest = manifestSchema.parse({
    id: 'meta-pack',
    name: 'Meta',
    animations: ['animations/idle.webm', 'animations/click.webm'],
    animationMeta: {
      'animations/idle.webm': { fps: 30, mode: 'loop' },
      'animations/click.webm': { mode: 'once' },
    },
  });
  assert.equal(manifest.animationMeta['animations/idle.webm'].fps, 30);
  assert.equal(manifest.animationMeta['animations/click.webm'].mode, 'once');
});
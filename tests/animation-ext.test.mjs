import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyAnimationExt } from '../lib/host/animation-ext.js';
import { listPacks } from '../lib/host/packs.js';

async function withHome(fn) {
  const home = await mkdtemp(join(tmpdir(), 'dsh-hex-ext-'));
  try {
    await fn(home);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
}

const baseManifest = {
  schema: 'dsh-hex-pet.pack/1',
  id: 'demo',
  name: 'Demo',
  version: '1.0.0',
  animations: ['animations/idle.webm'],
};

test('appends animations after the target and merges metadata', async () => {
  await withHome(async (home) => {
    await mkdir(join(home, 'packs', 'demo', 'animations'), { recursive: true });
    await writeFile(join(home, 'packs', 'demo', 'animations', 'idle.webm'), 'idle');
    await writeFile(join(home, 'packs', 'demo', 'animations', 'wave.webm'), 'wave');
    await mkdir(join(home, 'animation-ext'), { recursive: true });
    await writeFile(
      join(home, 'animation-ext', 'demo-ext.json'),
      JSON.stringify({
        target: 'animations/idle.webm',
        append: [{ name: 'animations/wave.webm', mode: 'once', fps: 30 }],
      }),
    );

    const merged = await applyAnimationExt(home, 'demo', baseManifest);
    assert.deepEqual(merged.animations, ['animations/idle.webm', 'animations/wave.webm']);
    assert.deepEqual(merged.animationMeta['animations/wave.webm'], { mode: 'once', fps: 30 });
  });
});

test('ignores the whole extension when any appended file is missing', async () => {
  await withHome(async (home) => {
    await mkdir(join(home, 'animation-ext'), { recursive: true });
    await writeFile(
      join(home, 'animation-ext', 'demo-ext.json'),
      JSON.stringify({
        target: 'animations/idle.webm',
        append: [{ name: 'animations/missing.webm' }],
      }),
    );
    const merged = await applyAnimationExt(home, 'demo', baseManifest);
    assert.deepEqual(merged, baseManifest);
  });
});

test('ignores malformed extension files', async () => {
  await withHome(async (home) => {
    await mkdir(join(home, 'animation-ext'), { recursive: true });
    await writeFile(join(home, 'animation-ext', 'demo-ext.json'), '{not json');
    const merged = await applyAnimationExt(home, 'demo', baseManifest);
    assert.deepEqual(merged, baseManifest);
  });
});

test('listPacks reflects the applied extension', async () => {
  await withHome(async (home) => {
    const dir = join(home, 'packs', 'demo');
    await mkdir(join(dir, 'animations'), { recursive: true });
    await writeFile(join(dir, 'manifest.json'), JSON.stringify(baseManifest), 'utf8');
    await writeFile(join(dir, 'animations', 'idle.webm'), 'idle');
    await writeFile(join(dir, 'animations', 'wave.webm'), 'wave');
    await mkdir(join(home, 'animation-ext'), { recursive: true });
    await writeFile(
      join(home, 'animation-ext', 'demo-ext.json'),
      JSON.stringify({
        target: 'animations/idle.webm',
        append: [{ name: 'animations/wave.webm' }],
      }),
    );

    const packs = await listPacks(home);
    assert.equal(packs.length, 1);
    assert.deepEqual(packs[0].animations, ['animations/idle.webm', 'animations/wave.webm']);
  });
});

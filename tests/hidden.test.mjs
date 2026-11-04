import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { HiddenStore } from '../lib/host/hidden.js';

test('persists hidden pets across reloads', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-hex-hidden-'));
  try {
    const file = join(dir, 'hidden.json');
    const until = Date.now() + 60_000;
    const first = new HiddenStore(file);
    first.set('main', until);
    first.set('second', 0);

    const second = new HiddenStore(file);
    second.load();
    assert.equal(second.get('main'), until);
    assert.equal(second.get('second'), 0);

    second.delete('main');
    const third = new HiddenStore(file);
    third.load();
    assert.equal(third.get('main'), undefined);
    assert.equal(third.get('second'), 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('drops expired entries but keeps indefinite hides', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-hex-hidden-'));
  try {
    const file = join(dir, 'hidden.json');
    const now = Date.now();
    await writeFile(
      file,
      JSON.stringify({
        version: 1,
        hidden: { expired: now - 1000, forever: 0, later: now + 60_000 },
      }),
      'utf8',
    );

    const store = new HiddenStore(file);
    store.load(now);
    assert.equal(store.get('expired', now), undefined);
    assert.equal(store.get('forever', now), 0);
    assert.equal(store.get('later', now), now + 60_000);
    assert.deepEqual(
      store.snapshot(now).map((item) => item.petId).sort(),
      ['forever', 'later'],
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('ignores a corrupt hidden file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-hex-hidden-'));
  try {
    const file = join(dir, 'hidden.json');
    await writeFile(file, '{not json', 'utf8');
    const store = new HiddenStore(file);
    store.load();
    assert.deepEqual(store.snapshot(), []);
    store.set('main', Date.now() + 1000);
    const next = new HiddenStore(file);
    next.load();
    assert.ok(next.get('main'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

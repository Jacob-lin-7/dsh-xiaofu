import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EmojiStore, MAX_EMOJI_BYTES } from '../lib/host/emoji.js';

const PNG_HEAD = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

async function withStore(fn) {
  const home = await mkdtemp(join(tmpdir(), 'dsh-hex-emoji-'));
  try {
    await fn(new EmojiStore(home), home);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
}

test('adds, lists and removes an emoji', async () => {
  await withStore(async (store) => {
    const item = await store.add({
      name: '笑',
      description: '开心',
      data: Buffer.concat([PNG_HEAD, Buffer.alloc(16)]),
    });
    assert.equal(item.name, '笑');
    assert.equal((await store.list()).length, 1);

    const asset = await store.asset(item.id);
    assert.ok(asset);
    assert.equal(asset.contentType, 'image/png');
    assert.equal(asset.size, 24);

    const updated = await store.update(item.id, { name: '大笑', description: '新描述' });
    assert.equal(updated.name, '大笑');
    assert.equal(updated.description, '新描述');
    assert.equal((await store.list())[0].name, '大笑');

    assert.equal(await store.remove(item.id), true);
    assert.deepEqual(await store.list(), []);
    assert.equal(await store.asset(item.id), undefined);
  });
});

test('rejects unsupported images and oversized files', async () => {
  await withStore(async (store) => {
    await assert.rejects(
      () => store.add({ data: Buffer.from('not an image') }),
      (error) => error.code === 'UNSUPPORTED_IMAGE',
    );
    await assert.rejects(
      () => store.add({ data: Buffer.alloc(MAX_EMOJI_BYTES + 1) }),
      (error) => error.code === 'TOO_LARGE',
    );
  });
});

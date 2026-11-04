import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildMessage } = require('../lib/desktop-helper/protocol.cjs');

test('injects petId into position messages', () => {
  assert.deepEqual(buildMessage('main', 'set-position', { x: 10, y: 20 }, 7), {
    petId: 'main',
    x: 10,
    y: 20,
    type: 'set-position',
    requestId: 7,
  });
});

test('keeps an explicit payload petId', () => {
  assert.equal(buildMessage('main', 'set-hidden', { petId: 'pet-2', until: 0 }, 1).petId, 'pet-2');
});

test('does not mutate the payload', () => {
  const payload = { x: 1, y: 2 };
  buildMessage('main', 'set-position', payload, 1);
  assert.deepEqual(payload, { x: 1, y: 2 });
});

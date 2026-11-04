import test from 'node:test';
import assert from 'node:assert/strict';
import { frameSortKey } from '../lib/host/generate.js';

test('sorts frame numbers numerically, not lexically', () => {
  assert.ok(frameSortKey('frame_2.png') < frameSortKey('frame_10.png'));
  assert.ok(frameSortKey('x8.png') < frameSortKey('x9.png'));
});
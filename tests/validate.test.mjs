import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  readZip,
  validateFileSet,
  validatePackFiles,
} from '../lib/host/packs.js';

test('validates the sample petpack fixture', async () => {
  const buffer = await readFile(join(import.meta.dirname, 'fixtures', 'sample.petpack.zip'));
  const files = await readZip(buffer);
  const result = validatePackFiles(files);
  assert.equal(result.manifest.id, 'sample-cat');
  assert.deepEqual(result.files, ['animations/idle.webm', 'manifest.json']);
});

test('rejects unsafe paths and unsupported extensions', () => {
  assert.throws(
    () => validateFileSet(new Map([['../escape.png', Buffer.from('x')]])),
    (error) => error.code === 'UNSAFE_PATH',
  );
  assert.throws(
    () => validateFileSet(new Map([['tool.exe', Buffer.from('x')]])),
    (error) => error.code === 'UNSUPPORTED_FILE',
  );
});

test('rejects a pack without manifest', () => {
  assert.throws(
    () => validatePackFiles(new Map([['animations/idle.webm', Buffer.from('x')]])),
    (error) => error.code === 'MISSING_MANIFEST',
  );
});

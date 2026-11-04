import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import yauzl from 'yauzl';
import { createZip } from '../lib/host/zip.js';
import { exportPack } from '../lib/host/export.js';

function readZip(buffer) {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (error, zip) => {
      if (error || !zip) {
        reject(error ?? new Error('no zip'));
        return;
      }
      const files = new Map();
      zip.on('entry', (entry) => {
        if (entry.fileName.endsWith('/')) {
          zip.readEntry();
          return;
        }
        zip.openReadStream(entry, (streamError, stream) => {
          if (streamError || !stream) {
            reject(streamError ?? new Error('no stream'));
            return;
          }
          const chunks = [];
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('end', () => {
            files.set(entry.fileName, Buffer.concat(chunks));
            zip.readEntry();
          });
        });
      });
      zip.on('end', () => resolve(files));
      zip.on('error', reject);
      zip.readEntry();
    });
  });
}

test('createZip round-trips UTF-8 content', async () => {
  const buffer = createZip([
    { name: 'manifest.json', data: Buffer.from('{"name":"Hex"}', 'utf8') },
    { name: 'animations/idle.webm', data: Buffer.from([1, 2, 3, 4]) },
  ]);
  const files = await readZip(buffer);
  assert.equal(files.get('manifest.json').toString('utf8'), '{"name":"Hex"}');
  assert.deepEqual([...files.get('animations/idle.webm')], [1, 2, 3, 4]);
});

test('exportPack zips the installed pack directory', async () => {
  const home = await mkdtemp(join(tmpdir(), 'dsh-hex-export-'));
  try {
    const packDir = join(home, 'packs', 'demo');
    await mkdir(join(packDir, 'animations'), { recursive: true });
    await writeFile(join(packDir, 'manifest.json'), '{"id":"demo"}', 'utf8');
    await writeFile(join(packDir, 'animations', 'idle.webm'), Buffer.from([9, 8, 7]));

    const { buffer, filename } = await exportPack(home, 'demo');
    assert.equal(filename, 'demo.petpack.zip');
    const files = await readZip(buffer);
    assert.equal(files.get('manifest.json').toString('utf8'), '{"id":"demo"}');
    assert.deepEqual([...files.get('animations/idle.webm')], [9, 8, 7]);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});

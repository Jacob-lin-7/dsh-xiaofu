import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { WhisperService } from '../lib/host/llm.js';

async function withServer(handler, fn) {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}/chat/completions`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const configFor = (endpoint) => async () => ({
  llm: {
    enabled: true,
    endpoint,
    model: 'mock',
    intervalMinutes: 30,
    timeoutMs: 2000,
  },
});

test('pauses after three consecutive failures and resumes', async () => {
  let requests = 0;
  let healthy = false;
  await withServer(
    (req, res) => {
      requests += 1;
      if (!healthy) {
        res.writeHead(500, { 'content-type': 'application/json' });
        res.end('{"error":"boom"}');
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ choices: [{ message: { content: '今天也要加油！' } }] }));
    },
    async (endpoint) => {
      const service = new WhisperService(configFor(endpoint));
      for (let i = 0; i < 3; i += 1) {
        const result = await service.whisper();
        assert.equal(result.ok, false);
      }
      assert.equal((await service.status()).paused, true);
      assert.equal(requests, 3);

      const paused = await service.whisper();
      assert.equal(paused.paused, true);
      assert.equal(requests, 3);

      service.resume();
      healthy = true;
      const result = await service.whisper();
      assert.equal(result.ok, true);
      assert.equal(result.text, '今天也要加油！');
      assert.equal((await service.status()).failures, 0);
    },
  );
});

test('missing configuration fails without throwing', async () => {
  const service = new WhisperService(async () => ({
    llm: { enabled: false, endpoint: '', model: '', intervalMinutes: 30, timeoutMs: 1000 },
  }));
  const result = await service.whisper();
  assert.equal(result.ok, false);
  assert.equal(result.paused, false);
});

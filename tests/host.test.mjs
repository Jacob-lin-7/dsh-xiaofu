import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apply } from '../lib/host/index.js';

function fakeRes() {
  return {
    status: 0,
    headers: {},
    body: '',
    writeHead(status, headers) {
      this.status = status;
      this.headers = headers;
    },
    end(text) {
      this.body = text;
    },
  };
}

function fakeReq(url, method = 'GET', body) {
  const req = new EventEmitter();
  req.url = url;
  req.method = method;
  if (body !== undefined) {
    queueMicrotask(() => {
      req.emit('data', Buffer.from(body, 'utf8'));
      req.emit('end');
    });
  }
  return req;
}

async function withApp(fn) {
  const home = await mkdtemp(join(tmpdir(), 'dsh-xiaofu-home-'));
  process.env.DSH_HOME = home;
  let handler;
  apply({
    effect: (run) => run(),
    webServer: {
      register: (options) => {
        handler = options.handler;
        return () => {};
      },
    },
  });
  try {
    await fn(handler, home);
  } finally {
    delete process.env.DSH_HOME;
    await rm(home, { recursive: true, force: true });
  }
}

test('health endpoint reports plugin identity', async () => {
  await withApp(async (handler) => {
    const res = fakeRes();
    await handler(fakeReq('/dsh-xiaofu/health'), res);
    const body = JSON.parse(res.body);
    assert.equal(res.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.name, 'dsh-xiaofu');
    assert.equal(body.pets, 1);
  });
});

test('config endpoint returns defaults and persists a valid update', async () => {
  await withApp(async (handler) => {
    const getRes = fakeRes();
    await handler(fakeReq('/dsh-xiaofu/config'), getRes);
    const original = JSON.parse(getRes.body);
    assert.equal(original.pets[0].name, '小符');

    original.pets[0].name = '小六';
    const putRes = fakeRes();
    await handler(fakeReq('/dsh-xiaofu/config', 'PUT', JSON.stringify(original)), putRes);
    assert.equal(putRes.status, 200);

    const afterRes = fakeRes();
    await handler(fakeReq('/dsh-xiaofu/config'), afterRes);
    assert.equal(JSON.parse(afterRes.body).pets[0].name, '小六');
  });
});

test('invalid config body returns 400 and keeps previous value', async () => {
  await withApp(async (handler) => {
    const bad = fakeRes();
    await handler(fakeReq('/dsh-xiaofu/config', 'PUT', JSON.stringify({ pets: [{ id: '' }] })), bad);
    assert.equal(bad.status, 400);

    const afterRes = fakeRes();
    await handler(fakeReq('/dsh-xiaofu/config'), afterRes);
    assert.equal(JSON.parse(afterRes.body).pets[0].name, '小符');
  });
});

test('features endpoint updates the composed menu', async () => {
  await withApp(async (handler) => {
    const putRes = fakeRes();
    await handler(
      fakeReq('/dsh-xiaofu/features', 'PUT', JSON.stringify({ global: { 'menu.chat': false } })),
      putRes,
    );
    assert.equal(putRes.status, 200);

    const menuRes = fakeRes();
    await handler(fakeReq('/dsh-xiaofu/menu?platform=web'), menuRes);
    const ids = JSON.parse(menuRes.body).menu.map((node) => node.id);
    assert.equal(ids.includes('menu.chat'), false);
  });
});

test('disable mode keeps unmet features visible with a reason', async () => {
  await withApp(async (handler) => {
    const modeRes = fakeRes();
    await handler(
      fakeReq('/dsh-xiaofu/features', 'PUT', JSON.stringify({ menu: { mode: 'disable' } })),
      modeRes,
    );
    assert.equal(modeRes.status, 200);

    const menuRes = fakeRes();
    await handler(fakeReq('/dsh-xiaofu/menu?platform=web&llm=0'), menuRes);
    const chat = JSON.parse(menuRes.body).menu.find((node) => node.id === 'menu.chat');
    assert.ok(chat);
    assert.equal(chat.disabled, true);
  });
});

test('settings stays in the menu after being turned off', async () => {
  await withApp(async (handler) => {
    const putRes = fakeRes();
    await handler(
      fakeReq('/dsh-xiaofu/features', 'PUT', JSON.stringify({ global: { 'menu.settings': false } })),
      putRes,
    );
    assert.equal(putRes.status, 200);

    const menuRes = fakeRes();
    await handler(fakeReq('/dsh-xiaofu/menu?platform=web'), menuRes);
    const ids = JSON.parse(menuRes.body).menu.map((node) => node.id);
    assert.equal(ids.includes('menu.settings'), true);
  });
});
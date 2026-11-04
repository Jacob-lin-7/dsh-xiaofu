import test from 'node:test';
import assert from 'node:assert/strict';
import { StateController } from '../lib/host/state.js';

const config = {
  stateMapping: {
    entries: [
      {
        event: 'go',
        label: 'Go',
        animation: 'animations/state-working.webm',
        bubble: 'working',
        durationSec: 0,
        enabled: true,
      },
      {
        event: 'brief',
        label: 'Brief',
        animation: 'animations/state-done.webm',
        bubble: 'done',
        durationSec: 1,
        enabled: true,
      },
      {
        event: 'disabled',
        label: '',
        animation: 'animations/state-done.webm',
        bubble: '',
        durationSec: 0,
        enabled: false,
      },
    ],
  },
};

test('triggers an enabled state and keeps it until cleared', async () => {
  const controller = new StateController(async () => config);
  const active = await controller.trigger('go');
  assert.equal(active.event, 'go');
  assert.equal(controller.current().bubble, 'working');
  controller.clear();
  assert.equal(controller.current(), null);
});

test('rejects unknown and disabled events', async () => {
  const controller = new StateController(async () => config);
  await assert.rejects(() => controller.trigger('missing'), /没有启用的状态映射/);
  await assert.rejects(() => controller.trigger('disabled'), /没有启用的状态映射/);
});

test('keeps multiple animations for the overlay to rotate', async () => {
  const multi = {
    stateMapping: {
      entries: [
        {
          event: 'multi',
          label: 'Multi',
          animation: 'animations/a.webm',
          animations: ['animations/a.webm', 'animations/b.webm'],
          bubble: '',
          durationSec: 0,
          enabled: true,
        },
      ],
    },
  };
  const controller = new StateController(async () => multi);
  const active = await controller.trigger('multi');
  assert.deepEqual(active.animations, ['animations/a.webm', 'animations/b.webm']);
  assert.equal(active.animation, 'animations/a.webm');
});

test('uses the active character mapping when present', async () => {
  const config = {
    pets: [{ pack: 'xiaofu' }],
    stateMapping: {
      entries: [
        {
          event: 'go',
          label: 'Global',
          animation: 'animations/global.webm',
          bubble: '',
          durationSec: 0,
          enabled: true,
        },
      ],
      byCharacter: {
        xiaofu: {
          entries: [
            {
              event: 'go',
              label: 'Xiaofu',
              animation: 'animations/xiaofu.webm',
              bubble: '',
              durationSec: 0,
              enabled: true,
            },
          ],
        },
      },
    },
  };
  const controller = new StateController(async () => config);
  const active = await controller.trigger('go');
  assert.equal(active.animation, 'animations/xiaofu.webm');
});

test('uses state dialogue from bubble settings', async () => {
  const config = {
    bubble: {
      stateQuotes: { go: ['第一句', '第二句'] },
      stateTiming: { go: { durationMs: 1000, gapMs: 200 } },
    },
    stateMapping: {
      entries: [
        {
          event: 'go',
          label: 'Go',
          animation: 'animations/a.webm',
          animations: ['animations/a.webm'],
          bubble: 'fallback',
          durationSec: 0,
          enabled: true,
        },
      ],
    },
  };
  const controller = new StateController(async () => config);
  const active = await controller.trigger('go');
  assert.ok(['第一句', '第二句'].includes(active.bubble));
  assert.deepEqual(active.quotes, ['第一句', '第二句']);
  assert.equal(active.durationMs, 1000);
  assert.equal(active.gapMs, 200);
});

test('auto-expires a state after its duration', async () => {
  const controller = new StateController(async () => config);
  await controller.trigger('brief');
  assert.ok(controller.current());
  await new Promise((resolve) => setTimeout(resolve, 1100));
  assert.equal(controller.current(), null);
});

test('runs the expire callback after a temporary state', async () => {
  const controller = new StateController(async () => config);
  let expired = false;
  await controller.trigger('brief', undefined, () => {
    expired = true;
  });
  await new Promise((resolve) => setTimeout(resolve, 1100));
  assert.equal(expired, true);
});

test('task-done defaults to a 20-minute hold and ignores legacy durationSec', async () => {
  const doneConfig = {
    stateMapping: {
      entries: [
        {
          event: 'task-done',
          label: '任务完成',
          animation: 'animations/state-done.webm',
          animations: ['animations/state-done.webm'],
          bubble: '',
          durationSec: 5,
          holdSec: 0,
          enabled: true,
        },
      ],
    },
  };
  const controller = new StateController(async () => doneConfig);
  const before = Date.now();
  const active = await controller.trigger('task-done');
  assert.ok(active.until);
  const seconds = Math.round((active.until - before) / 1000);
  assert.ok(seconds >= 1199 && seconds <= 1201, `expected 1200s, got ${seconds}s`);
  controller.clear();
});

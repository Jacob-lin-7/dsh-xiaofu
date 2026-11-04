import test from 'node:test';
import assert from 'node:assert/strict';
import { AutoTaskDriver } from '../lib/host/auto-task.js';

function fakeState() {
  const events = [];
  return {
    events,
    async trigger(event, detail) {
      events.push({ event, detail });
    },
  };
}

test('starts on turn/start and ends on turn/end', async () => {
  const state = fakeState();
  const driver = new AutoTaskDriver(state);
  driver.onSessionEvent('s1', { type: 'turn/start' });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(driver.isTaskActive, true);
  assert.equal(driver.activeSession, 's1');
  assert.deepEqual(state.events.map((item) => item.event), ['task-start']);

  driver.onSessionEvent('s1', { type: 'turn/end' });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(driver.isTaskActive, false);
  assert.deepEqual(state.events.map((item) => item.event), ['task-start', 'task-done']);
});

test('background sessions do not steal the active pet state', async () => {
  const state = fakeState();
  const driver = new AutoTaskDriver(state);
  driver.onSessionEvent('s1', { type: 'turn/start' });
  await new Promise((resolve) => setTimeout(resolve, 0));
  driver.onSessionEvent('s2', { type: 'turn/start' });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(driver.activeSession, 's1');
  assert.equal(state.events.filter((item) => item.event === 'task-start').length, 1);
  driver.onSessionEvent('s2', { type: 'turn/end' });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(driver.isTaskActive, true);
  assert.equal(driver.activeSession, 's1');
  assert.equal(state.events.filter((item) => item.event === 'task-done').length, 0);
});

test('assistant chunks do not restart an active task', async () => {
  const state = fakeState();
  const driver = new AutoTaskDriver(state);
  await driver.startTask('s1');
  driver.onSessionEvent('s1', { type: 'assistant/chunk' });
  driver.onSessionEvent('s1', { type: 'tool/call' });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(state.events.filter((item) => item.event === 'task-start').length, 1);
});

test('approval shows waiting state and restores the task after resolving', async () => {
  const state = fakeState();
  const driver = new AutoTaskDriver(state);
  await driver.startTask('s1');
  const result = await driver.wrapApproval('s1', async () => {
    assert.equal(driver.isApprovalActive, true);
    return 'ok';
  });
  assert.equal(result, 'ok');
  assert.equal(driver.isApprovalActive, false);
  assert.deepEqual(
    state.events.map((item) => item.event),
    ['task-start', 'approval-needed', 'task-start'],
  );
});

test('resumeTask restores task-start after a temporary warning state', async () => {
  const state = fakeState();
  const driver = new AutoTaskDriver(state);
  await driver.startTask('s1');
  await driver.resumeTask();
  assert.deepEqual(state.events.map((item) => item.event), ['task-start', 'task-start']);
});

test('turn/end clears the task and timer', async () => {
  const state = fakeState();
  const driver = new AutoTaskDriver(state, { timeoutMs: 50, returnMs: 50 });
  await driver.startTask('s1');
  await driver.endTask('s1');
  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.equal(driver.isTaskActive, false);
  assert.deepEqual(state.events.map((item) => item.event), ['task-start', 'task-done']);
});

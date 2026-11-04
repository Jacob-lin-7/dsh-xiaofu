import test from 'node:test';
import assert from 'node:assert/strict';
import { readAccountBalance, TaskUsageGuard } from '../lib/host/balance.js';

test('sums topped-up and bonus wallets per currency', async () => {
  const result = await readAccountBalance(async () => ({
    status: 'ready',
    value: [
      { currency: 'CNY', balance: '8.79' },
      { currency: 'USD', balance: '0.80' },
    ],
    bonusWallets: [
      { currency: 'CNY', balance: '5.00' },
      { currency: 'USD', balance: '0.20' },
    ],
  }));
  assert.equal(result.available, true);
  assert.equal(result.currencies.CNY, 13.79);
  assert.equal(result.currencies.USD, 1);
});

test('reports unavailable without the account service', async () => {
  const result = await readAccountBalance(undefined);
  assert.equal(result.available, false);
});

test('task usage resets per task and accumulates tokens', () => {
  const guard = new TaskUsageGuard();
  guard.add(12000);
  guard.add(3000);
  assert.equal(guard.tokens, 15000);
  guard.start();
  assert.equal(guard.tokens, 0);
  assert.equal(guard.triggered, false);
  assert.equal(guard.taskId, 1);
});

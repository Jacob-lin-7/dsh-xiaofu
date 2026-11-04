import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultConfig, configSchema } from '../lib/shared/schema.js';

test('default config has one web pet', () => {
  const config = defaultConfig();
  assert.equal(config.schemaVersion, 1);
  assert.equal(config.pets.length, 1);
  assert.equal(config.pets[0].id, 'main');
  assert.equal(config.pets[0].name, '小符');
  assert.equal(config.pets[0].display, 'both');
  assert.equal(config.features.menu.mode, 'hide');
});

test('partial pet gets defaults filled in', () => {
  const config = configSchema.parse({ pets: [{ id: 'p1' }] });
  assert.equal(config.pets[0].size, 420);
  assert.equal(config.pets[0].position.corner, 'top-right');
  assert.equal(config.pets[0].display, 'web');
});

test('unknown top-level fields are stripped', () => {
  const config = configSchema.parse({ schemaVersion: 1, extra: true });
  assert.equal('extra' in config, false);
});

test('position accepts absolute x/y after dragging', () => {
  const config = configSchema.parse({
    pets: [{ id: 'main', position: { x: 120, y: 80 } }],
  });
  assert.equal(config.pets[0].position.x, 120);
  assert.equal(config.pets[0].position.y, 80);
  assert.equal(config.pets[0].position.corner, 'top-right');
});

test('sound volume defaults and validates its range', () => {
  assert.equal(defaultConfig().sound.volume, 0.2);
  assert.equal(configSchema.parse({ sound: { volume: 0.3 } }).sound.volume, 0.3);
  assert.throws(() => configSchema.parse({ sound: { volume: 1.5 } }));
});

test('click action defaults to animation and accepts known values', () => {
  assert.equal(configSchema.parse({ pets: [{ id: 'p' }] }).pets[0].clickAction, 'animation');
  assert.equal(
    configSchema.parse({ pets: [{ id: 'p', clickAction: 'chat' }] }).pets[0].clickAction,
    'chat',
  );
  assert.throws(() => configSchema.parse({ pets: [{ id: 'p', clickAction: 'dance' }] }));
});

test('tray icon pack is optional and preserved', () => {
  assert.equal(configSchema.parse({ pets: [{ id: 'p' }] }).pets[0].trayIconPack, undefined);
  assert.equal(
    configSchema.parse({ pets: [{ id: 'p', trayIconPack: 'hex-purple' }] }).pets[0]
      .trayIconPack,
    'hex-purple',
  );
});

test('appearance defaults and validates font settings', () => {
  const defaults = defaultConfig().appearance;
  assert.equal(defaults.fontFamily, 'system');
  assert.equal(defaults.fontSize, 12);
  assert.equal(defaults.scaleWithPet, true);
  assert.equal(
    configSchema.parse({ appearance: { fontSize: 18, scaleWithPet: true } }).appearance
      .fontSize,
    18,
  );
  assert.throws(() => configSchema.parse({ appearance: { fontSize: 30 } }));
});

test('bubble settings have defaults and limits', () => {
  const defaults = defaultConfig().bubble;
  assert.equal(defaults.enabled, true);
  assert.ok(defaults.quotes.length > 0);
  assert.equal(
    configSchema.parse({ bubble: { quotes: ['你好'], durationMs: 2400 } }).bubble.quotes[0],
    '你好',
  );
  assert.throws(() => configSchema.parse({ bubble: { durationMs: 500 } }));
  assert.throws(() =>
    configSchema.parse({ bubble: { quotes: Array.from({ length: 21 }, (_, i) => `q${i}`) } }),
  );
});

test('action mapping includes idle and balance warning defaults', () => {
  const config = defaultConfig();
  assert.equal(config.stateMapping.entries[0].event, 'idle');
  assert.ok(config.stateMapping.entries.some((entry) => entry.event === 'balance-warning'));
  assert.deepEqual(
    config.balanceWarning.thresholds.map((item) => item.currency),
    ['CNY', 'USD'],
  );
  assert.equal(config.balanceWarning.tokenThreshold, 20000);
});
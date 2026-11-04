import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultConfig } from '../lib/shared/schema.js';
import { composeMenu } from '../lib/shared/menu.js';
import { resolveFeature } from '../lib/shared/features.js';

const caps = { llm: true, balance: true, desktop: true, pack: true };

function ids(nodes) {
  return nodes.map((node) => node.id);
}

test('default menu is concise and excludes opt-in features', () => {
  const config = defaultConfig();
  const menu = composeMenu({ config, petId: 'main', platform: 'web', caps });
  assert.deepEqual(ids(menu), [
    'menu.chat',
    'menu.actions',
    'menu.petpack',
    'menu.display',
    'menu.snooze',
    'menu.balance',
    'menu.settings',
    'menu.about',
  ]);
  assert.equal(ids(menu).includes('menu.whisper'), false);
});

test('disabled feature is hidden in both modes', () => {
  const config = defaultConfig();
  config.features.global['menu.chat'] = false;
  for (const mode of ['hide', 'disable']) {
    const menu = composeMenu({ config, petId: 'main', platform: 'web', caps, mode });
    assert.equal(ids(menu).includes('menu.chat'), false);
  }
});

test('unmet dependency hides or disables depending on mode', () => {
  const config = defaultConfig();
  const noLlm = { ...caps, llm: false };

  const hidden = composeMenu({ config, petId: 'main', platform: 'web', caps: noLlm, mode: 'hide' });
  assert.equal(ids(hidden).includes('menu.chat'), false);

  const disabled = composeMenu({ config, petId: 'main', platform: 'web', caps: noLlm, mode: 'disable' });
  const chat = disabled.find((node) => node.id === 'menu.chat');
  assert.ok(chat);
  assert.equal(chat.disabled, true);
  assert.match(chat.reason ?? '', /配置模型/);
});

test('per-pet override beats global', () => {
  const config = defaultConfig();
  config.features.global['menu.chat'] = false;
  config.features.pets.main = { 'menu.chat': true };
  assert.equal(resolveFeature(config, 'main', 'menu.chat'), true);
  assert.equal(resolveFeature(config, 'other', 'menu.chat'), false);
});

test('settings cannot be removed from menu', () => {
  const config = defaultConfig();
  config.features.global['menu.settings'] = false;
  const menu = composeMenu({ config, petId: 'main', platform: 'web', caps });
  assert.equal(ids(menu).includes('menu.settings'), true);
});

test('custom order is respected', () => {
  const config = defaultConfig();
  config.features.menu.order = ['menu.settings', 'menu.chat'];
  const menu = composeMenu({ config, petId: 'main', platform: 'web', caps });
  assert.equal(menu[0].id, 'menu.settings');
  assert.equal(menu[1].id, 'menu.chat');
});

test('desktop-only features do not appear on web', () => {
  const config = defaultConfig();
  config.features.global['tray.icon'] = true;
  const menu = composeMenu({ config, petId: 'main', platform: 'web', caps });
  assert.equal(ids(menu).includes('tray.icon'), false);
});

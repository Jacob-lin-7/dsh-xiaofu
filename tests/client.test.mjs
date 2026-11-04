import test from 'node:test';
import assert from 'node:assert/strict';

let loaded;

test('client factory registers a settings section', async () => {
  globalThis.window = {
    __ModuleLoader__: {
      load(info) {
        loaded = info;
      },
    },
  };

  await import('../lib/client.js');
  assert.ok(loaded, 'client should call __ModuleLoader__.load');
  assert.equal(loaded.id, 'dsh-xiaofu');

  const react = {
    useState: () => [null, () => {}],
    useCallback: (fn) => fn,
    useEffect: () => {},
  };
  const jsxRuntime = {
    jsx: (type, props) => ({ type, props }),
  };
  const require = (id) => {
    if (id === 'react') return react;
    if (id === 'react/jsx-runtime') return jsxRuntime;
    throw new Error(`unexpected require: ${id}`);
  };

  const module = loaded.factory(require);
  assert.equal(module.name, 'dsh-xiaofu');
  assert.deepEqual(module.inject, ['slots']);

  const registered = {};
  const injections = [];
  const ctx = {
    slots: {
      inject(name, generator) {
        injections.push(name);
        generator().next();
      },
      register(options, component) {
        registered[options.name] = { options, component };
        return () => {};
      },
    },
  };

  module.apply(ctx);
  assert.deepEqual(injections, ['settings.section', 'shell.overlay']);
  assert.ok(registered['settings.section'], 'settings section should be registered');
  assert.equal(registered['settings.section'].options.id, 'hex-pet');
  assert.equal(registered['settings.section'].options.label(), '桌宠配置');
  assert.equal(typeof registered['settings.section'].component, 'function');
  assert.ok(registered['shell.overlay'], 'overlay should be registered');
  assert.equal(typeof registered['shell.overlay'].component, 'function');
});

test('settings deep link opens settings and removes its marker', () => {
  let replaced = '';
  let settingsClicks = 0;
  let navClicks = 0;
  const settingsButton = {
    innerText: '设置',
    click: () => {
      settingsClicks += 1;
    },
  };
  const navButton = {
    innerText: '桌宠配置',
    click: () => {
      navClicks += 1;
    },
  };

  globalThis.window = {
    __ModuleLoader__: { load() {} },
    location: { href: 'http://127.0.0.1:3000/?token=abc&dsh-xiaofu=settings' },
    history: {
      replaceState(_state, _title, url) {
        replaced = url;
      },
    },
    setTimeout(fn) {
      fn();
      return 0;
    },
  };
  globalThis.document = {
    querySelector(selector) {
      return selector.includes('设置') ? settingsButton : null;
    },
    querySelectorAll() {
      return [navButton];
    },
  };

  const react = {
    useState: () => [null, () => {}],
    useCallback: (fn) => fn,
    useEffect: () => {},
  };
  const jsxRuntime = { jsx: (type, props) => ({ type, props }) };
  const require = (id) => {
    if (id === 'react') return react;
    if (id === 'react/jsx-runtime') return jsxRuntime;
    throw new Error(`unexpected require: ${id}`);
  };

  loaded.factory(require);

  assert.equal(settingsClicks, 1);
  assert.equal(navClicks, 1);
  assert.ok(!replaced.includes('dsh-xiaofu=settings'), 'marker should be removed');
  assert.ok(replaced.includes('token=abc'), 'other query params should survive');
});

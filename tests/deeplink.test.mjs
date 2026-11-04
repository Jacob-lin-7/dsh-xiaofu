import test from 'node:test';
import assert from 'node:assert/strict';
import {
  withPetSettingsLink,
  PET_SETTINGS_PARAM,
  PET_SETTINGS_VALUE,
} from '../lib/shared/deeplink.js';

test('adds the settings marker without dropping the token', () => {
  assert.equal(
    withPetSettingsLink('http://127.0.0.1:3000/?token=abc'),
    `http://127.0.0.1:3000/?token=abc&${PET_SETTINGS_PARAM}=${PET_SETTINGS_VALUE}`,
  );
});

test('replaces an existing marker instead of duplicating it', () => {
  const once = withPetSettingsLink('http://127.0.0.1:3000/');
  assert.equal(withPetSettingsLink(once), once);
  assert.equal(new URL(once).searchParams.getAll(PET_SETTINGS_PARAM).length, 1);
});

test('leaves empty and invalid values untouched', () => {
  assert.equal(withPetSettingsLink(''), '');
  assert.equal(withPetSettingsLink('not a url'), 'not a url');
});

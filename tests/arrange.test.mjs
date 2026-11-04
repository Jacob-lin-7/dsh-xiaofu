import test from 'node:test';
import assert from 'node:assert/strict';
import { arrangeDesktopPets } from '../lib/host/arrange.js';

test('offsets same-corner desktop pets vertically', () => {
  const pets = [
    { id: 'a', size: 420, display: 'both', position: { corner: 'top-right', marginY: 100 } },
    { id: 'b', size: 336, display: 'desktop', position: { corner: 'top-right', marginY: 100 } },
  ];
  const arranged = arrangeDesktopPets(pets);
  assert.equal(arranged[0].position.marginY, 100);
  assert.equal(arranged[1].position.marginY, 100 + 236 + 12);
});

test('manual x/y and other corners are left alone', () => {
  const pets = [
    { id: 'a', size: 420, display: 'both', position: { corner: 'top-right', x: 10, y: 20 } },
    { id: 'b', size: 336, display: 'desktop', position: { corner: 'bottom-left', marginY: 40 } },
  ];
  const arranged = arrangeDesktopPets(pets);
  assert.deepEqual(arranged[0].position, pets[0].position);
  assert.equal(arranged[1].position.marginY, 40);
});

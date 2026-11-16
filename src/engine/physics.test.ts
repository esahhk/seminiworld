import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveMove,
  computeMovementDelta,
  selectBestInteractable,
  easeInOutQuad,
} from './physics';
import { SCENES_META, sceneIdxById } from '../data/scenesMeta';
import { BOOKS } from '../data/books';

test('resolveMove clamps player inside bounds', () => {
  const bounds = { minX: -7.2, maxX: 7.2, minZ: -7.2, maxZ: 7.2 };
  const [x, z] = resolveMove(12, -15, 1.65, 1.65, bounds, []);
  assert.equal(x, 7.2);
  assert.equal(z, -7.2);
});

test('resolveMove pushes player out of active AABB collider along minimum penetration axis', () => {
  const bounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
  const colliders = [
    {
      minX: -1,
      maxX: 1,
      minZ: -1,
      maxZ: 1,
      minY: 0,
      maxY: 2.5,
      active: true,
    },
  ];
  const [x, z] = resolveMove(-1.1, 0, 1.65, 1.65, bounds, colliders);
  assert.ok(x <= -1.349);
  assert.equal(z, 0);
});

test('resolveMove allows stepping onto low obstacles below step threshold', () => {
  const bounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
  const lowStep = [
    {
      minX: -1,
      maxX: 1,
      minZ: -1,
      maxZ: 1,
      minY: 0,
      maxY: 0.35,
      active: true,
    },
  ];
  const [x, z] = resolveMove(0, 0, 1.65, 1.65, bounds, lowStep);
  assert.equal(x, 0);
  assert.equal(z, 0);
});

test('computeMovementDelta normalizes diagonal speed and slows down in water', () => {
  const normal = computeMovementDelta(1, 1, 0, false, 'stone', 1);
  assert.ok(Math.abs(Math.hypot(normal.dx, normal.dz) - 4.1) < 1e-6);

  const water = computeMovementDelta(1, 0, 0, false, 'water', 1);
  assert.ok(Math.abs(Math.hypot(water.dx, water.dz) - 4.1 * 0.68) < 1e-6);

  const sprint = computeMovementDelta(1, 0, 0, true, 'concrete', 1);
  assert.ok(Math.abs(Math.hypot(sprint.dx, sprint.dz) - 6.4) < 1e-6);
});

test('selectBestInteractable picks focused interactable within range', () => {
  const items = [
    { id: 'far', pos: { x: 0, y: 1.5, z: -5 }, radius: 2.0 },
    { id: 'front', pos: { x: 0, y: 1.5, z: -1.8 }, radius: 2.4 },
    { id: 'behind', pos: { x: 0, y: 1.5, z: 1.2 }, radius: 2.4 },
  ];
  const best = selectBestInteractable(
    items,
    { x: 0, y: 1.65, z: 0 },
    { x: 0, y: 0, z: -1 },
  );
  assert.equal((best as { id: string } | null)?.id, 'front');
});

test('easeInOutQuad maps endpoints accurately', () => {
  assert.equal(easeInOutQuad(0), 0);
  assert.equal(easeInOutQuad(0.5), 0.5);
  assert.equal(easeInOutQuad(1), 1);
});

test('SCENES_META contains all 16 scenes with unique IDs and collectibles', () => {
  assert.equal(SCENES_META.length, 16);
  const ids = new Set(SCENES_META.map((s) => s.id));
  assert.equal(ids.size, 16);
  assert.equal(sceneIdxById('platform'), 0);
  assert.equal(sceneIdxById('cave'), 15);
  for (const m of SCENES_META) {
    assert.ok(m.name.length > 0);
    assert.ok(m.item.length > 0);
    assert.ok(m.desc.length > 0);
  }
});

test('BOOKS contains complete multi-page text for office, studio, and convenience', () => {
  assert.equal(BOOKS.office.pages.length, 5);
  assert.equal(BOOKS.studio.pages.length, 6);
  assert.equal(BOOKS.convenience.pages.length, 4);
  for (const key of ['office', 'studio', 'convenience'] as const) {
    assert.ok(BOOKS[key].title.length > 0);
    for (const page of BOOKS[key].pages) {
      assert.ok(page.label.length > 0);
      assert.ok(page.body.length > 100);
    }
  }
});

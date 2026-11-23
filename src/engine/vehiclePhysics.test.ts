import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTruckState,
  findTruckSummonPose,
  stepTruckPhysics,
} from './vehiclePhysics';
import { createSpatialColliderGrid } from './physics';
import { CITY_CANAL_Z, cityGroundHeightAt } from '../scenes/city';

test('stepTruckPhysics respects D, brake, N coast, P lock, and R reverse gears', () => {
  const bounds = { minX: -340, maxX: 340, minZ: -340, maxZ: 340 };
  let truck = createTruckState(0, 0, 0, 'D');

  for (let i = 0; i < 30; i++) {
    truck = stepTruckPhysics(
      truck,
      { gas: 1, brake: 0, steer: 0, handbrake: false },
      bounds,
      [],
      1 / 60,
    );
  }
  assert.ok(truck.speed > 10);
  assert.ok(truck.z < -2.0);
  assert.equal(truck.reversing, false);

  const braked = stepTruckPhysics(
    truck,
    { gas: 0, brake: 1, steer: 0, handbrake: false },
    bounds,
    [],
    1 / 60,
  );
  assert.equal(braked.braking, true);
  assert.ok(braked.speed < truck.speed);

  let neutral = createTruckState(0, 0, 0, 'N');
  neutral.speed = 6.0;
  neutral = stepTruckPhysics(
    neutral,
    { gas: 1, brake: 0, steer: 0, handbrake: false },
    bounds,
    [],
    1 / 60,
  );
  assert.ok(neutral.speed < 6.0);

  let parked = createTruckState(0, 0, 0, 'P');
  parked = stepTruckPhysics(
    parked,
    { gas: 1, brake: 0, steer: 0, handbrake: false },
    bounds,
    [],
    1 / 60,
  );
  assert.equal(parked.speed, 0);
  assert.equal(parked.z, 0);

  let reversed = createTruckState(0, 0, 0, 'R');
  for (let i = 0; i < 25; i++) {
    reversed = stepTruckPhysics(
      reversed,
      { gas: 1, brake: 0, steer: 0, handbrake: false },
      bounds,
      [],
      1 / 60,
    );
  }
  assert.equal(reversed.reversing, true);
  assert.ok(reversed.speed < -2.0);
  assert.ok(reversed.z > 0.2);
});

test('stepTruckPhysics hits high top speed, drains and recovers turbo boost, and supports S auto-reverse in D', () => {
  const bounds = { minX: -340, maxX: 340, minZ: -340, maxZ: 340 };
  let truck = createTruckState(0, 200, 0, 'D');

  for (let i = 0; i < 180; i++) {
    truck = stepTruckPhysics(
      truck,
      { gas: 1, brake: 0, steer: 0, handbrake: false, turbo: false },
      bounds,
      [],
      1 / 60,
    );
  }
  assert.ok(truck.speed > 40, `Expected normal top speed > 40 m/s, got ${truck.speed}`);
  assert.equal(truck.turbo, false);

  for (let i = 0; i < 90; i++) {
    truck = stepTruckPhysics(
      truck,
      { gas: 1, brake: 0, steer: 0, handbrake: false, turbo: true },
      bounds,
      [],
      1 / 60,
    );
  }
  assert.ok(truck.speed > 55, `Expected turbo speed > 55 m/s, got ${truck.speed}`);
  assert.equal(truck.turbo, true);
  assert.ok(truck.boostEnergy < 0.85);

  const drainedEnergy = truck.boostEnergy;
  for (let i = 0; i < 60; i++) {
    truck = stepTruckPhysics(
      truck,
      { gas: 0, brake: 0, steer: 0, handbrake: false, turbo: false },
      bounds,
      [],
      1 / 60,
    );
  }
  assert.ok(truck.boostEnergy > drainedEnergy);

  let autoRev = createTruckState(0, 0, 0, 'D');
  for (let i = 0; i < 40; i++) {
    autoRev = stepTruckPhysics(
      autoRev,
      { gas: 0, brake: 1, steer: 0, handbrake: false, autoReverse: true },
      bounds,
      [],
      1 / 60,
    );
  }
  assert.ok(autoRev.speed < -2.0);
  assert.equal(autoRev.reversing, true);
});

test('stepTruckPhysics handbrake generates driftAngle, slides tangentially along walls, and follows bridge groundYFn', () => {
  const bounds = { minX: -340, maxX: 340, minZ: -340, maxZ: 340 };
  let driftTruck = createTruckState(0, 0, 0, 'D');
  driftTruck.speed = 28;
  driftTruck.vz = -28;
  for (let i = 0; i < 20; i++) {
    driftTruck = stepTruckPhysics(
      driftTruck,
      { gas: 1, brake: 0, steer: 1, handbrake: true },
      bounds,
      [],
      1 / 60,
    );
  }
  assert.ok(Math.abs(driftTruck.driftAngle) > 0.04);

  const angledWall = [
    { minX: -20, maxX: 20, minZ: -8, maxZ: -6, minY: 0, maxY: 6, active: true },
  ];
  let slideTruck = createTruckState(0, -3.5, -0.5, 'D');
  slideTruck.vx = 10;
  slideTruck.vz = -16;
  const grid = createSpatialColliderGrid(angledWall, 18);
  const resWithGrid = stepTruckPhysics(
    slideTruck,
    { gas: 1, brake: 0, steer: 0, handbrake: false },
    bounds,
    angledWall,
    1 / 30,
    grid,
  );
  const resNoGrid = stepTruckPhysics(
    slideTruck,
    { gas: 1, brake: 0, steer: 0, handbrake: false },
    bounds,
    angledWall,
    1 / 30,
  );
  assert.ok(Math.abs(resWithGrid.vx) > 2.0, 'Should retain tangential X velocity along Z wall');
  assert.ok(Math.abs(resWithGrid.x - resNoGrid.x) < 1e-6);
  assert.ok(Math.abs(resWithGrid.z - resNoGrid.z) < 1e-6);

  let bridgeTruck = createTruckState(0, CITY_CANAL_Z, 0, 'D');
  for (let i = 0; i < 30; i++) {
    bridgeTruck = stepTruckPhysics(
      bridgeTruck,
      { gas: 0, brake: 0, steer: 0, handbrake: false },
      bounds,
      [],
      1 / 30,
      null,
      cityGroundHeightAt,
    );
  }
  assert.ok(bridgeTruck.y > 1.8);
});

test('stepTruckPhysics turns smoothly with steering and resolves wall collisions', () => {
  const bounds = { minX: -140, maxX: 140, minZ: -140, maxZ: 140 };
  const wall = [
    { minX: -2, maxX: 2, minZ: -8, maxZ: -6, minY: 0, maxY: 6, active: true },
  ];
  let truck = createTruckState(0, 0, 0, 'D');
  for (let i = 0; i < 25; i++) {
    truck = stepTruckPhysics(
      truck,
      { gas: 1, brake: 0, steer: -1, handbrake: false },
      bounds,
      [],
      1 / 60,
    );
  }
  assert.ok(truck.yaw < -0.1);
  assert.ok(truck.steerAngle < -0.2);

  let crashing = createTruckState(0, -3.4, 0, 'D');
  crashing.speed = 12;
  crashing = stepTruckPhysics(
    crashing,
    { gas: 1, brake: 0, steer: 0, handbrake: false },
    bounds,
    wall,
    1 / 30,
  );
  assert.ok(crashing.z >= -3.6);
  assert.ok(crashing.speed < 12);
});

test('findTruckSummonPose avoids overlapping buildings and picks clear road spot', () => {
  const bounds = { minX: -140, maxX: 140, minZ: -140, maxZ: 140 };
  const building = [
    { minX: -4, maxX: 4, minZ: -10, maxZ: -1, minY: 0, maxY: 8, active: true },
  ];
  const pose = findTruckSummonPose(0, 0, 0, bounds, building, [
    { x: 10, z: 0, yaw: 0 },
  ]);
  assert.ok(Math.hypot(pose.x - 0, pose.z - 0) > 2.4);
  const insideBuilding =
    pose.x > -4.5 && pose.x < 4.5 && pose.z > -10.5 && pose.z < -0.5;
  assert.equal(insideBuilding, false);
});

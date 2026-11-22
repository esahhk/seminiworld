import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTruckState,
  findTruckSummonPose,
  stepTruckPhysics,
} from './vehiclePhysics';

test('stepTruckPhysics respects D, brake, N coast, P lock, and R reverse gears', () => {
  const bounds = { minX: -140, maxX: 140, minZ: -140, maxZ: 140 };
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
  assert.ok(truck.speed > 5.5);
  assert.ok(truck.z < -1.0);
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

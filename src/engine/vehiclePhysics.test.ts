import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTruckState,
  findTruckSummonPose,
  stepTruckPhysics,
} from './vehiclePhysics';

test('stepTruckPhysics accelerates forward, brakes smoothly, then reverses', () => {
  const bounds = { minX: -60, maxX: 60, minZ: -60, maxZ: 60 };
  let truck = createTruckState(0, 0, 0);

  for (let i = 0; i < 30; i++) {
    truck = stepTruckPhysics(truck, { throttle: 1, steer: 0, handbrake: false }, bounds, [], 1 / 60);
  }
  assert.ok(truck.speed > 5.0);
  assert.ok(truck.z < -1.0);
  assert.equal(truck.reversing, false);

  const braked = stepTruckPhysics(
    truck,
    { throttle: -1, steer: 0, handbrake: false },
    bounds,
    [],
    1 / 60,
  );
  assert.equal(braked.braking, true);
  assert.ok(braked.speed < truck.speed);

  let stopped = createTruckState(0, 0, 0);
  for (let i = 0; i < 20; i++) {
    stopped = stepTruckPhysics(
      stopped,
      { throttle: -1, steer: 0, handbrake: false },
      bounds,
      [],
      1 / 60,
    );
  }
  assert.equal(stopped.reversing, true);
  assert.ok(stopped.speed < -1.5);
  assert.ok(stopped.z > 0.1);
});

test('stepTruckPhysics turns smoothly with steering and resolves wall collisions', () => {
  const bounds = { minX: -50, maxX: 50, minZ: -50, maxZ: 50 };
  const wall = [
    { minX: -2, maxX: 2, minZ: -8, maxZ: -6, minY: 0, maxY: 6, active: true },
  ];
  let truck = createTruckState(0, 0, 0);
  for (let i = 0; i < 25; i++) {
    truck = stepTruckPhysics(
      truck,
      { throttle: 1, steer: -1, handbrake: false },
      bounds,
      [],
      1 / 60,
    );
  }
  assert.ok(truck.yaw < -0.1);
  assert.ok(truck.steerAngle < -0.2);

  let crashing = createTruckState(0, -3.4, 0);
  crashing.speed = 12;
  crashing = stepTruckPhysics(
    crashing,
    { throttle: 1, steer: 0, handbrake: false },
    bounds,
    wall,
    1 / 30,
  );
  assert.ok(crashing.z >= -3.6);
  assert.ok(crashing.speed < 12);
});

test('findTruckSummonPose avoids overlapping buildings and picks clear road spot', () => {
  const bounds = { minX: -60, maxX: 60, minZ: -60, maxZ: 60 };
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

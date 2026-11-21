import type { Bounds, Collider } from '../types/game';

export interface TruckState {
  x: number;
  y: number;
  z: number;
  yaw: number;
  speed: number;
  steerAngle: number;
  wheelSpin: number;
  pitch: number;
  roll: number;
  braking: boolean;
  reversing: boolean;
}

export interface TruckInput {
  throttle: number;
  steer: number;
  handbrake: boolean;
}

export type TruckCollider = Pick<
  Collider,
  'minX' | 'maxX' | 'minZ' | 'maxZ' | 'minY' | 'maxY' | 'active'
>;

export function createTruckState(x = 0, z = 0, yaw = 0): TruckState {
  return {
    x,
    y: 0,
    z,
    yaw,
    speed: 0,
    steerAngle: 0,
    wheelSpin: 0,
    pitch: 0,
    roll: 0,
    braking: false,
    reversing: false,
  };
}

function resolveCircleAabb(
  cx: number,
  cz: number,
  radius: number,
  colliders: readonly TruckCollider[],
  truckY: number,
): [number, number, boolean] {
  let x = cx;
  let z = cz;
  let hit = false;
  for (const c of colliders) {
    if (!c.active || truckY + 2.8 < c.minY || truckY + 0.1 > c.maxY) {
      continue;
    }
    const qx = Math.max(c.minX, Math.min(x, c.maxX));
    const qz = Math.max(c.minZ, Math.min(z, c.maxZ));
    const dx = x - qx;
    const dz = z - qz;
    const distSq = dx * dx + dz * dz;
    if (distSq < radius * radius) {
      hit = true;
      if (distSq > 1e-6) {
        const dist = Math.sqrt(distSq);
        const push = radius - dist;
        x += (dx / dist) * push;
        z += (dz / dist) * push;
      } else {
        const ox1 = Math.abs(x - c.minX);
        const ox2 = Math.abs(c.maxX - x);
        const oz1 = Math.abs(z - c.minZ);
        const oz2 = Math.abs(c.maxZ - z);
        const m = Math.min(ox1, ox2, oz1, oz2);
        if (m === ox1) {
          x = c.minX - radius;
        } else if (m === ox2) {
          x = c.maxX + radius;
        } else if (m === oz1) {
          z = c.minZ - radius;
        } else {
          z = c.maxZ + radius;
        }
      }
    }
  }
  return [x, z, hit];
}

export function stepTruckPhysics(
  truck: TruckState,
  input: TruckInput,
  bounds: Bounds,
  colliders: readonly TruckCollider[],
  dt: number,
): TruckState {
  const maxFwd = 22.0;
  const maxRev = 7.5;
  const accelFwd = 13.5;
  const accelRev = 8.0;
  const footBrake = 25.0;
  const handBrakeDecel = 20.0;
  const drag = 2.6;
  const wheelBase = 3.55;

  const th = Math.max(-1, Math.min(1, input.throttle));
  const st = Math.max(-1, Math.min(1, input.steer));

  let speed = truck.speed;
  let braking = false;
  let accel = 0;

  if (input.handbrake) {
    braking = Math.abs(speed) > 0.08;
    const dec = handBrakeDecel * dt;
    if (Math.abs(speed) <= dec) {
      speed = 0;
    } else {
      speed -= Math.sign(speed) * dec;
    }
  } else if (th > 0.04) {
    if (speed < -0.25) {
      braking = true;
      accel = footBrake;
      speed = Math.min(0, speed + footBrake * dt);
    } else {
      accel = accelFwd * th;
      speed = Math.min(maxFwd, speed + accel * dt);
    }
  } else if (th < -0.04) {
    if (speed > 0.25) {
      braking = true;
      accel = -footBrake;
      speed = Math.max(0, speed - footBrake * dt);
    } else {
      accel = accelRev * th;
      speed = Math.max(-maxRev, speed + accel * dt);
    }
  } else {
    const drop = (drag + Math.abs(speed) * 0.14) * dt;
    if (Math.abs(speed) <= drop) {
      speed = 0;
    } else {
      speed -= Math.sign(speed) * drop;
    }
  }

  const speedFactor = Math.min(1, Math.abs(speed) / 18);
  const maxSteer = 0.56 - speedFactor * 0.24;
  const targetSteer = st * maxSteer;
  const steerBlend = Math.min(1, dt * (Math.abs(st) > 0.05 ? 7.5 : 10.0));
  const steerAngle = truck.steerAngle + (targetSteer - truck.steerAngle) * steerBlend;

  let yaw = truck.yaw;
  if (Math.abs(speed) > 0.05 && Math.abs(steerAngle) > 0.002) {
    const angularVel = (speed / wheelBase) * Math.tan(steerAngle);
    yaw += angularVel * dt;
  }

  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  let nx = truck.x + fx * speed * dt;
  let nz = truck.z + fz * speed * dt;

  const margin = 1.9;
  const minX = bounds.minX + margin;
  const maxX = bounds.maxX - margin;
  const minZ = bounds.minZ + margin;
  const maxZ = bounds.maxZ - margin;
  let anyHit = false;
  if (nx < minX) {
    nx = minX;
    anyHit = true;
  } else if (nx > maxX) {
    nx = maxX;
    anyHit = true;
  }
  if (nz < minZ) {
    nz = minZ;
    anyHit = true;
  } else if (nz > maxZ) {
    nz = maxZ;
    anyHit = true;
  }

  const halfProbe = 1.65;
  const probeRadius = 1.15;
  for (const offset of [halfProbe, 0, -halfProbe]) {
    const px = nx + fx * offset;
    const pz = nz + fz * offset;
    const [rx, rz, hit] = resolveCircleAabb(px, pz, probeRadius, colliders, truck.y);
    if (hit) {
      nx += rx - px;
      nz += rz - pz;
      anyHit = true;
    }
  }

  if (anyHit) {
    speed *= 0.45;
  }

  const targetPitch = Math.max(-0.045, Math.min(0.045, -accel * 0.0022));
  const targetRoll = Math.max(
    -0.06,
    Math.min(0.06, steerAngle * Math.min(1, Math.abs(speed) / 10) * Math.sign(speed || 1) * 0.14),
  );
  const suspBlend = Math.min(1, dt * 8.5);
  const pitch = truck.pitch + (targetPitch - truck.pitch) * suspBlend;
  const roll = truck.roll + (targetRoll - truck.roll) * suspBlend;
  const wheelSpin = truck.wheelSpin + (speed / 0.44) * dt;

  return {
    x: nx,
    y: truck.y,
    z: nz,
    yaw,
    speed,
    steerAngle,
    wheelSpin,
    pitch,
    roll,
    braking,
    reversing: speed < -0.15,
  };
}

export function isTruckClearAt(
  x: number,
  z: number,
  yaw: number,
  bounds: Bounds,
  colliders: readonly TruckCollider[],
): boolean {
  const margin = 2.4;
  if (
    x < bounds.minX + margin ||
    x > bounds.maxX - margin ||
    z < bounds.minZ + margin ||
    z > bounds.maxZ - margin
  ) {
    return false;
  }
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  for (const offset of [1.8, 0, -1.8]) {
    const px = x + fx * offset;
    const pz = z + fz * offset;
    const [, , hit] = resolveCircleAabb(px, pz, 1.35, colliders, 0);
    if (hit) {
      return false;
    }
  }
  return true;
}

export function findTruckSummonPose(
  playerX: number,
  playerZ: number,
  playerYaw: number,
  bounds: Bounds,
  colliders: readonly TruckCollider[],
  roadCenters: readonly { x: number; z: number; yaw: number }[] = [],
): { x: number; z: number; yaw: number } {
  const fx = -Math.sin(playerYaw);
  const fz = -Math.cos(playerYaw);
  const rx = Math.cos(playerYaw);
  const rz = -Math.sin(playerYaw);

  const candidates: { x: number; z: number; yaw: number }[] = [
    { x: playerX + fx * 4.8 + rx * 1.4, z: playerZ + fz * 4.8 + rz * 1.4, yaw: playerYaw },
    { x: playerX + fx * 4.8 - rx * 1.4, z: playerZ + fz * 4.8 - rz * 1.4, yaw: playerYaw },
    { x: playerX + rx * 3.8, z: playerZ + rz * 3.8, yaw: playerYaw },
    { x: playerX - rx * 3.8, z: playerZ - rz * 3.8, yaw: playerYaw },
    { x: playerX - fx * 4.8, z: playerZ - fz * 4.8, yaw: playerYaw },
  ];

  for (const c of candidates) {
    if (isTruckClearAt(c.x, c.z, c.yaw, bounds, colliders)) {
      return c;
    }
  }

  let bestRoad: { x: number; z: number; yaw: number } | null = null;
  let bestDist = Infinity;
  for (const rp of roadCenters) {
    if (!isTruckClearAt(rp.x, rp.z, rp.yaw, bounds, colliders)) {
      continue;
    }
    const d = Math.hypot(rp.x - playerX, rp.z - playerZ);
    if (d > 2.6 && d < bestDist) {
      bestDist = d;
      bestRoad = rp;
    }
  }
  if (bestRoad) {
    return bestRoad;
  }

  return {
    x: Math.max(bounds.minX + 4, Math.min(bounds.maxX - 4, playerX)),
    z: Math.max(bounds.minZ + 4, Math.min(bounds.maxZ - 4, playerZ + 4.5)),
    yaw: playerYaw,
  };
}

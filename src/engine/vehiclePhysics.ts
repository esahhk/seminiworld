import type { Bounds, TruckGear } from '../types/game';
import {
  querySpatialColliderGrid,
  type SimpleCollider,
  type SpatialColliderGrid,
} from './physics';

export interface TruckState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  yaw: number;
  speed: number;
  steerAngle: number;
  angularVel: number;
  wheelSpin: number;
  pitch: number;
  roll: number;
  braking: boolean;
  reversing: boolean;
  turbo: boolean;
  boostEnergy: number;
  driftAngle: number;
  rpm: number;
  gear: TruckGear;
}

export interface TruckInput {
  gas: number;
  brake: number;
  steer: number;
  handbrake: boolean;
  turbo?: boolean;
  autoReverse?: boolean;
}

export type TruckCollider = SimpleCollider;

export function createTruckState(
  x = 0,
  z = 0,
  yaw = 0,
  gear: TruckGear = 'D',
): TruckState {
  return {
    x,
    y: 0,
    z,
    vx: 0,
    vz: 0,
    yaw,
    speed: 0,
    steerAngle: 0,
    angularVel: 0,
    wheelSpin: 0,
    pitch: 0,
    roll: 0,
    braking: false,
    reversing: false,
    turbo: false,
    boostEnergy: 1,
    driftAngle: 0,
    rpm: 0.14,
    gear,
  };
}

const _truckQueryIndices: number[] = [];

function resolveCircleAabb(
  cx: number,
  cz: number,
  radius: number,
  colliders: readonly TruckCollider[],
  truckY: number,
  grid?: SpatialColliderGrid | null,
): [number, number, boolean] {
  let x = cx;
  let z = cz;
  let hit = false;

  const checkCol = (c: TruckCollider) => {
    if (!c.active || truckY + 2.9 < c.minY || truckY + 0.12 > c.maxY) {
      return;
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
  };

  if (grid && grid.colliders === colliders) {
    querySpatialColliderGrid(
      grid,
      x - radius - 0.5,
      x + radius + 0.5,
      z - radius - 0.5,
      z + radius + 0.5,
      _truckQueryIndices,
    );
    for (let i = 0; i < _truckQueryIndices.length; i++) {
      checkCol(colliders[_truckQueryIndices[i]]);
    }
  } else {
    for (let i = 0; i < colliders.length; i++) {
      checkCol(colliders[i]);
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
  grid?: SpatialColliderGrid | null,
  groundYFn?: ((x: number, z: number) => number) | null,
): TruckState {
  const maxFwd = 46.0;
  const maxTurbo = 66.0;
  const maxRev = 16.0;
  const accelFwd = 28.0;
  const accelRev = 18.5;
  const footBrake = 44.0;
  const parkLockDecel = 46.0;
  const handBrakeDecel = 30.0;
  const rollingDrag = 1.65;
  const aeroDrag = 0.011;
  const wheelBase = 3.55;

  const gas = Math.max(0, Math.min(1, input.gas));
  const brake = Math.max(0, Math.min(1, input.brake));
  const st = Math.max(-1, Math.min(1, input.steer));
  const autoReverse = input.autoReverse ?? true;

  const fx0 = -Math.sin(truck.yaw);
  const fz0 = -Math.cos(truck.yaw);
  const rx0 = Math.cos(truck.yaw);
  const rz0 = -Math.sin(truck.yaw);

  let vx = truck.vx;
  let vz = truck.vz;
  if (Math.abs(vx) < 1e-6 && Math.abs(vz) < 1e-6 && Math.abs(truck.speed) > 1e-6) {
    vx = fx0 * truck.speed;
    vz = fz0 * truck.speed;
  }

  let vLong = vx * fx0 + vz * fz0;
  const vLong0 = vLong;

  let boostEnergy = truck.boostEnergy ?? 1;
  const wantTurbo = Boolean(input.turbo) && truck.gear === 'D' && gas > 0.1;
  const turboActive = wantTurbo && boostEnergy > 0.04;
  if (turboActive) {
    boostEnergy = Math.max(0, boostEnergy - dt * 0.32);
  } else {
    boostEnergy = Math.min(1, boostEnergy + dt * (wantTurbo ? 0.04 : 0.24));
  }

  let braking = false;
  let longAccel = 0;

  if (truck.gear === 'P') {
    braking = Math.abs(vLong) > 0.08 || brake > 0.05;
    const dec = parkLockDecel * dt;
    vLong = Math.abs(vLong) <= dec ? 0 : vLong - Math.sign(vLong) * dec;
    vx *= Math.exp(-16 * dt);
    vz *= Math.exp(-16 * dt);
  } else if (input.handbrake) {
    braking = Math.abs(vLong) > 0.08 || brake > 0.05;
    const dec = handBrakeDecel * dt;
    if (Math.abs(vLong) <= dec) {
      vLong = 0;
    } else {
      longAccel = -Math.sign(vLong) * handBrakeDecel;
      vLong -= Math.sign(vLong) * dec;
    }
  } else if (brake > 0.04) {
    if (vLong > 0.25) {
      braking = true;
      const dec = footBrake * brake * dt;
      longAccel = -footBrake * brake;
      vLong = Math.max(0, vLong - dec);
    } else if (truck.gear === 'D' && autoReverse) {
      longAccel = -accelRev * brake * 0.88;
      vLong = Math.max(-maxRev * 0.9, vLong + longAccel * dt);
    } else if (truck.gear === 'R' && gas < 0.05) {
      braking = Math.abs(vLong) > 0.1;
      const dec = footBrake * brake * dt;
      vLong = Math.abs(vLong) <= dec ? 0 : vLong - Math.sign(vLong) * dec;
    } else {
      braking = Math.abs(vLong) > 0.08;
      const dec = footBrake * brake * dt;
      vLong = Math.abs(vLong) <= dec ? 0 : vLong - Math.sign(vLong) * dec;
    }
  } else if (truck.gear === 'D' && gas > 0.04) {
    if (vLong < -0.25) {
      braking = true;
      longAccel = footBrake * gas;
      vLong = Math.min(0, vLong + longAccel * dt);
    } else {
      const cap = turboActive ? maxTurbo : maxFwd;
      const ratio = Math.max(0, Math.min(1, vLong / cap));
      const torqueCurve = 1.24 - ratio * 0.62;
      const thrust = (accelFwd * torqueCurve + (turboActive ? 20.0 : 0)) * gas;
      longAccel = thrust;
      vLong = Math.min(cap, vLong + thrust * dt);
    }
  } else if (truck.gear === 'R' && gas > 0.04) {
    if (vLong > 0.25) {
      braking = true;
      longAccel = -footBrake * gas;
      vLong = Math.max(0, vLong + longAccel * dt);
    } else {
      longAccel = -accelRev * gas;
      vLong = Math.max(-maxRev, vLong + longAccel * dt);
    }
  } else {
    const drop = (rollingDrag + Math.abs(vLong) * 0.09 + vLong * vLong * aeroDrag) * dt;
    if (Math.abs(vLong) <= drop) {
      vLong = 0;
    } else {
      vLong -= Math.sign(vLong) * drop;
    }
  }

  const speedFactor = Math.min(1, Math.abs(vLong) / 42);
  const maxSteer = 0.64 - speedFactor * 0.30;
  const targetSteer = st * maxSteer;
  const steerBlend = Math.min(1, dt * (Math.abs(st) > 0.05 ? 11.5 : 14.0));
  const steerAngle = truck.steerAngle + (targetSteer - truck.steerAngle) * steerBlend;

  const dvLong = vLong - vLong0;
  vx += fx0 * dvLong;
  vz += fz0 * dvLong;

  let yaw = truck.yaw;
  let angularVel = truck.angularVel ?? 0;
  if (Math.abs(vLong) > 0.08 && truck.gear !== 'P') {
    const rawAng = (vLong / wheelBase) * Math.tan(steerAngle);
    const driftBoost = input.handbrake && Math.abs(steerAngle) > 0.05 ? 1.38 : 1.0;
    const clampedAng = Math.max(-2.75, Math.min(2.75, rawAng * driftBoost));
    angularVel += (clampedAng - angularVel) * Math.min(1, dt * 13.5);
    yaw += angularVel * dt;
  } else {
    angularVel *= Math.exp(-12 * dt);
  }

  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);

  const postVLong = vx * fx + vz * fz;
  let postVLat = vx * rx + vz * rz;
  const latGrip = input.handbrake ? 2.2 : Math.abs(postVLong) > 12 ? 9.5 : 12.5;
  postVLat *= Math.exp(-latGrip * dt);

  vx = fx * postVLong + rx * postVLat;
  vz = fz * postVLong + rz * postVLat;

  let nx = truck.x + vx * dt;
  let nz = truck.z + vz * dt;

  const margin = 1.95;
  const minX = bounds.minX + margin;
  const maxX = bounds.maxX - margin;
  const minZ = bounds.minZ + margin;
  const maxZ = bounds.maxZ - margin;
  let pushX = 0;
  let pushZ = 0;
  let anyHit = false;

  if (nx < minX) {
    pushX += minX - nx;
    nx = minX;
    anyHit = true;
  } else if (nx > maxX) {
    pushX += maxX - nx;
    nx = maxX;
    anyHit = true;
  }
  if (nz < minZ) {
    pushZ += minZ - nz;
    nz = minZ;
    anyHit = true;
  } else if (nz > maxZ) {
    pushZ += maxZ - nz;
    nz = maxZ;
    anyHit = true;
  }

  const targetGroundY = groundYFn ? groundYFn(nx, nz) : truck.y;
  const nextY = groundYFn
    ? truck.y + (targetGroundY - truck.y) * Math.min(1, dt * 18)
    : truck.y;

  const halfProbe = 1.65;
  const probeRadius = 1.12;
  for (const offset of [halfProbe, 0, -halfProbe]) {
    const px = nx + fx * offset;
    const pz = nz + fz * offset;
    const [rX, rZ, hit] = resolveCircleAabb(px, pz, probeRadius, colliders, nextY, grid);
    if (hit) {
      const dxp = rX - px;
      const dzp = rZ - pz;
      nx += dxp;
      nz += dzp;
      pushX += dxp;
      pushZ += dzp;
      anyHit = true;
    }
  }

  if (anyHit) {
    const pLen = Math.hypot(pushX, pushZ);
    if (pLen > 1e-5) {
      const pnx = pushX / pLen;
      const pnz = pushZ / pLen;
      const vn = vx * pnx + vz * pnz;
      if (vn < 0) {
        vx -= pnx * vn * 1.06;
        vz -= pnz * vn * 1.06;
      }
      vx *= 0.92;
      vz *= 0.92;
    } else {
      vx *= 0.72;
      vz *= 0.72;
    }
  }

  const cleanVx = Math.abs(vx) < 1e-9 ? 0 : vx;
  const cleanVz = Math.abs(vz) < 1e-9 ? 0 : vz;
  const finalVLong = cleanVx * fx + cleanVz * fz;
  const finalVLat = cleanVx * rx + cleanVz * rz;
  const speed = Math.abs(finalVLong) < 1e-9 ? 0 : finalVLong;
  const driftAngle =
    Math.abs(finalVLong) > 3.0 ? Math.atan2(finalVLat, Math.abs(finalVLong)) : 0;

  const targetPitch = Math.max(-0.055, Math.min(0.055, -longAccel * 0.0014));
  const targetRoll = Math.max(
    -0.072,
    Math.min(0.072, steerAngle * Math.min(1, Math.abs(speed) / 14) * Math.sign(speed || 1) * 0.16),
  );
  const suspBlend = Math.min(1, dt * 9.5);
  const pitch = truck.pitch + (targetPitch - truck.pitch) * suspBlend;
  const roll = truck.roll + (targetRoll - truck.roll) * suspBlend;
  const wheelSpin = truck.wheelSpin + (speed / 0.44) * dt;
  const rpmTarget =
    truck.gear === 'P'
      ? 0.12
      : Math.min(1, 0.16 + Math.abs(speed) / (turboActive ? maxTurbo : maxFwd) * 0.78 + gas * 0.14);
  const rpm = (truck.rpm ?? 0.14) + (rpmTarget - (truck.rpm ?? 0.14)) * Math.min(1, dt * 8.0);

  return {
    x: nx,
    y: nextY,
    z: nz,
    vx: cleanVx,
    vz: cleanVz,
    yaw,
    speed,
    steerAngle,
    angularVel,
    wheelSpin,
    pitch,
    roll,
    braking,
    reversing: truck.gear === 'R' || speed < -0.18,
    turbo: turboActive,
    boostEnergy,
    driftAngle,
    rpm,
    gear: truck.gear,
  };
}

export function isTruckClearAt(
  x: number,
  z: number,
  yaw: number,
  bounds: Bounds,
  colliders: readonly TruckCollider[],
  grid?: SpatialColliderGrid | null,
  groundY = 0,
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
    const [, , hit] = resolveCircleAabb(px, pz, 1.35, colliders, groundY, grid);
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
  grid?: SpatialColliderGrid | null,
  groundYFn?: ((x: number, z: number) => number) | null,
): { x: number; z: number; yaw: number } {
  const fx = -Math.sin(playerYaw);
  const fz = -Math.cos(playerYaw);
  const rx = Math.cos(playerYaw);
  const rz = -Math.sin(playerYaw);

  const candidates: { x: number; z: number; yaw: number }[] = [
    { x: playerX + fx * 5.2 + rx * 1.4, z: playerZ + fz * 5.2 + rz * 1.4, yaw: playerYaw },
    { x: playerX + fx * 5.2 - rx * 1.4, z: playerZ + fz * 5.2 - rz * 1.4, yaw: playerYaw },
    { x: playerX + rx * 4.2, z: playerZ + rz * 4.2, yaw: playerYaw },
    { x: playerX - rx * 4.2, z: playerZ - rz * 4.2, yaw: playerYaw },
    { x: playerX - fx * 5.2, z: playerZ - fz * 5.2, yaw: playerYaw },
  ];

  for (const c of candidates) {
    const gy = groundYFn ? groundYFn(c.x, c.z) : 0;
    if (isTruckClearAt(c.x, c.z, c.yaw, bounds, colliders, grid, gy)) {
      return c;
    }
  }

  let bestRoad: { x: number; z: number; yaw: number } | null = null;
  let bestDist = Infinity;
  for (const rp of roadCenters) {
    const gy = groundYFn ? groundYFn(rp.x, rp.z) : 0;
    if (!isTruckClearAt(rp.x, rp.z, rp.yaw, bounds, colliders, grid, gy)) {
      continue;
    }
    const d = Math.hypot(rp.x - playerX, rp.z - playerZ);
    if (d > 2.8 && d < bestDist) {
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

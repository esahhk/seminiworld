import type { Bounds, Collider, SurfaceType } from '../types/game';

export interface SimpleVec3 {
  x: number;
  y: number;
  z: number;
}

export type SimpleCollider = Pick<
  Collider,
  'minX' | 'maxX' | 'minZ' | 'maxZ' | 'minY' | 'maxY' | 'active'
>;

export interface SpatialColliderGrid {
  cellSize: number;
  buckets: Map<number, number[]>;
  colliders: readonly SimpleCollider[];
  seen: Uint32Array;
  stamp: number;
}

function hashGridCell(cx: number, cz: number): number {
  return (cx + 32768) * 65536 + (cz + 32768);
}

export function createSpatialColliderGrid(
  colliders: readonly SimpleCollider[],
  cellSize = 18,
): SpatialColliderGrid {
  const buckets = new Map<number, number[]>();
  const inv = 1 / cellSize;
  for (let i = 0; i < colliders.length; i++) {
    const c = colliders[i];
    if (!c.active) {
      continue;
    }
    const x0 = Math.floor(c.minX * inv);
    const x1 = Math.floor(c.maxX * inv);
    const z0 = Math.floor(c.minZ * inv);
    const z1 = Math.floor(c.maxZ * inv);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cz = z0; cz <= z1; cz++) {
        const key = hashGridCell(cx, cz);
        let arr = buckets.get(key);
        if (!arr) {
          arr = [];
          buckets.set(key, arr);
        }
        arr.push(i);
      }
    }
  }
  return {
    cellSize,
    buckets,
    colliders,
    seen: new Uint32Array(Math.max(1, colliders.length)),
    stamp: 1,
  };
}

export function querySpatialColliderGrid(
  grid: SpatialColliderGrid,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  outIndices: number[],
): void {
  outIndices.length = 0;
  grid.stamp++;
  if (grid.stamp >= 0xfffffffe) {
    grid.seen.fill(0);
    grid.stamp = 1;
  }
  const stamp = grid.stamp;
  const inv = 1 / grid.cellSize;
  const x0 = Math.floor(minX * inv);
  const x1 = Math.floor(maxX * inv);
  const z0 = Math.floor(minZ * inv);
  const z1 = Math.floor(maxZ * inv);
  for (let cx = x0; cx <= x1; cx++) {
    for (let cz = z0; cz <= z1; cz++) {
      const bucket = grid.buckets.get(hashGridCell(cx, cz));
      if (!bucket) {
        continue;
      }
      for (let k = 0; k < bucket.length; k++) {
        const idx = bucket[k];
        if (grid.seen[idx] !== stamp) {
          grid.seen[idx] = stamp;
          outIndices.push(idx);
        }
      }
    }
  }
}

const _moveQueryOut: number[] = [];

export function resolveMove(
  nx: number,
  nz: number,
  playerPosY: number,
  playerHeight: number,
  bounds: Bounds,
  colliders: readonly SimpleCollider[],
  grid?: SpatialColliderGrid | null,
): [number, number] {
  const STEP = 0.45;
  const r = 0.35;
  let x = Math.max(bounds.minX, Math.min(bounds.maxX, nx));
  let z = Math.max(bounds.minZ, Math.min(bounds.maxZ, nz));
  const py = playerPosY - playerHeight;

  const checkCollider = (c: SimpleCollider) => {
    if (!c.active || py + STEP > c.maxY || py + playerHeight < c.minY) {
      return;
    }
    if (x + r > c.minX && x - r < c.maxX && z + r > c.minZ && z - r < c.maxZ) {
      const ox1 = x + r - c.minX;
      const ox2 = c.maxX - (x - r);
      const oz1 = z + r - c.minZ;
      const oz2 = c.maxZ - (z - r);
      const minO = Math.min(ox1, ox2, oz1, oz2);
      if (minO === ox1) {
        x = c.minX - r;
      } else if (minO === ox2) {
        x = c.maxX + r;
      } else if (minO === oz1) {
        z = c.minZ - r;
      } else {
        z = c.maxZ + r;
      }
    }
  };

  if (grid && grid.colliders === colliders) {
    querySpatialColliderGrid(grid, x - r - 0.5, x + r + 0.5, z - r - 0.5, z + r + 0.5, _moveQueryOut);
    for (let i = 0; i < _moveQueryOut.length; i++) {
      checkCollider(colliders[_moveQueryOut[i]]);
    }
  } else {
    for (let i = 0; i < colliders.length; i++) {
      checkCollider(colliders[i]);
    }
  }
  return [x, z];
}

export function computeMovementDelta(
  fwdInput: number,
  strInput: number,
  yaw: number,
  sprint: boolean,
  surface: SurfaceType,
  dt: number,
): { dx: number; dz: number; inputLen: number } {
  let fwd = fwdInput;
  let str = strInput;
  const len = Math.hypot(fwd, str);
  if (len > 1) {
    fwd /= len;
    str /= len;
  }
  let speed = sprint ? 6.4 : 4.1;
  if (surface === 'water') {
    speed *= 0.68;
  }
  const sinY = Math.sin(yaw);
  const cosY = Math.cos(yaw);
  return {
    dx: (-sinY * fwd + cosY * str) * speed * dt,
    dz: (-cosY * fwd - sinY * str) * speed * dt,
    inputLen: len,
  };
}

export function selectBestInteractable<
  T extends { pos: SimpleVec3; radius: number },
>(
  interactables: readonly T[],
  playerPos: SimpleVec3,
  lookDir: SimpleVec3,
): T | null {
  const closeThresh = 0.6;
  let best: T | null = null;
  let bestScore = -1;

  for (const it of interactables) {
    const vx = it.pos.x - playerPos.x;
    const vy = it.pos.y - playerPos.y;
    const vz = it.pos.z - playerPos.z;
    const dist = Math.hypot(vx, vy, vz);
    if (dist > it.radius + 0.8 || dist < 1e-6) {
      if (dist <= 1e-6) {
        const score = 2;
        if (score > bestScore) {
          bestScore = score;
          best = it;
        }
      }
      continue;
    }
    const dot =
      (vx / dist) * lookDir.x +
      (vy / dist) * lookDir.y +
      (vz / dist) * lookDir.z;
    if (dot > 0.44 || dist < closeThresh) {
      const score = dot * 2 - dist * 0.25;
      if (score > bestScore) {
        bestScore = score;
        best = it;
      }
    }
  }
  return best;
}

export function easeInOutQuad(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2;
}

export interface SlopedColliderSpec {
  minX: number;
  maxX: number;
  startZ: number;
  endZ: number;
  startY: number;
  endY: number;
  height: number;
  segments: number;
}

export function createSlopedColliderSegments(
  spec: SlopedColliderSpec,
): {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
  active: boolean;
}[] {
  const count = Math.max(1, Math.floor(spec.segments));
  const out: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    minY: number;
    maxY: number;
    active: boolean;
  }[] = [];
  for (let i = 0; i < count; i++) {
    const t0 = i / count;
    const t1 = (i + 1) / count;
    const z0 = spec.startZ + (spec.endZ - spec.startZ) * t0;
    const z1 = spec.startZ + (spec.endZ - spec.startZ) * t1;
    const y0 = spec.startY + (spec.endY - spec.startY) * t0;
    const y1 = spec.startY + (spec.endY - spec.startY) * t1;
    out.push({
      minX: spec.minX,
      maxX: spec.maxX,
      minZ: Math.min(z0, z1),
      maxZ: Math.max(z0, z1),
      minY: Math.min(y0, y1),
      maxY: Math.max(y0, y1) + spec.height,
      active: true,
    });
  }
  return out;
}

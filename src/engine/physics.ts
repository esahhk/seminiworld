import type { Bounds, Collider, SurfaceType } from '../types/game';

export interface SimpleVec3 {
  x: number;
  y: number;
  z: number;
}

export function resolveMove(
  nx: number,
  nz: number,
  playerPosY: number,
  playerHeight: number,
  bounds: Bounds,
  colliders: readonly Pick<
    Collider,
    'minX' | 'maxX' | 'minZ' | 'maxZ' | 'minY' | 'maxY' | 'active'
  >[],
): [number, number] {
  const STEP = 0.45;
  const r = 0.35;
  let x = Math.max(bounds.minX, Math.min(bounds.maxX, nx));
  let z = Math.max(bounds.minZ, Math.min(bounds.maxZ, nz));
  const py = playerPosY - playerHeight;

  for (const c of colliders) {
    if (!c.active || py + STEP > c.maxY || py + playerHeight < c.minY) {
      continue;
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

import * as THREE from 'three/webgpu';
import type { SceneContext } from './sceneContext';
import type { SceneId, SceneInitResult } from '../types/game';
import {
  addInstancedMeshes,
  buildCamphorGrove,
  buildParkBench,
  buildPottedPlant,
  buildSedanCar,
  mergePartsToGeometry,
  type GeoPartSpec,
  type InstanceTransform,
} from '../engine/propKit';

export interface CityLandmarkAnchor {
  id: SceneId;
  x: number;
  z: number;
  yaw: number;
}

export const CITY_BOUNDS = {
  minX: -340,
  maxX: 340,
  minZ: -340,
  maxZ: 340,
};

export const CITY_AVENUES = [-288, -192, -96, 0, 96, 192, 288] as const;
export const CITY_CANAL_Z = 144;

export const CITY_LANDMARKS: CityLandmarkAnchor[] = [
  { id: 'backyard', x: 0, z: -256, yaw: 0 },
  { id: 'platform', x: -48, z: -48, yaw: 0 },
  { id: 'office', x: -48, z: -144, yaw: 0 },
  { id: 'mall', x: 48, z: -48, yaw: 0 },
  { id: 'hospital', x: 48, z: -144, yaw: 0 },
  { id: 'airport', x: 240, z: -240, yaw: 0 },
  { id: 'waterpark', x: 240, z: -48, yaw: Math.PI / 2 },
  { id: 'infirmary', x: -144, z: -144, yaw: 0 },
  { id: 'school_bbq', x: -144, z: -48, yaw: 0 },
  { id: 'convenience', x: -48, z: 48, yaw: Math.PI },
  { id: 'subway', x: 48, z: 48, yaw: Math.PI },
  { id: 'studio', x: 144, z: 48, yaw: Math.PI },
  { id: 'zigzag', x: -48, z: 240, yaw: Math.PI },
  { id: 'park_lot', x: -144, z: 48, yaw: -Math.PI / 2 },
  { id: 'garage', x: -240, z: 240, yaw: Math.PI },
  { id: 'cave', x: 240, z: 48, yaw: Math.PI / 2 },
  { id: 'hellstone', x: 240, z: 240, yaw: Math.PI },
];

export function cityGroundHeightAt(x: number, z: number): number {
  const dz = z - CITY_CANAL_Z;
  if (dz >= -14 && dz <= 14) {
    for (let i = 0; i < CITY_AVENUES.length; i++) {
      const av = CITY_AVENUES[i];
      const hw = av === 0 ? 8.2 : 7.0;
      if (Math.abs(x - av) <= hw) {
        const u = (dz + 14) / 28;
        return 0.04 + Math.sin(u * Math.PI) * 2.25;
      }
    }
  }
  return 0.02;
}

export function buildMiniatureCityScene(ctx: SceneContext): SceneInitResult {
  const {
    T,
    scene,
    tex,
    sfx,
    V,
    track,
    addBox,
    addCylinder,
    addMesh,
    addDoubleSign,
    createMaterial,
    addInteract,
    addTimedRedirect,
    colliders,
    roadCenters,
    updaters,
    sceneIdxById,
    loadScene,
    setBounds,
    setHeightFn,
    setSurfaceFn,
  } = ctx;

  scene.background = new T.Color(0xc2d8ea);
  scene.fog = new T.Fog(0xc2d8ea, 145, 420);
  scene.add(new T.HemisphereLight(0xf4f9ff, 0x55665e, 0.98));
  const sun = new T.DirectionalLight(0xfff2db, 1.42);
  sun.position.set(55, 76, 42);
  sun.castShadow = true;
  scene.add(sun);

  const grassTex = tex.grass('#587d44', '#426332');
  grassTex.repeat.set(96, 96);
  addBox(
    920,
    0.4,
    920,
    createMaterial({ map: grassTex, roughness: 0.94 }),
    0,
    -0.25,
    0,
    false,
    false,
    true,
  );

  const pavTex = tex.pavement('#c2c4be', '#b0b3ad', 'city_pav');
  pavTex.repeat.set(170, 170);
  addBox(
    684,
    0.16,
    684,
    createMaterial({
      map: pavTex,
      normalMap: tex.concreteNormal('city_pn', 1.4),
      roughness: 0.86,
    }),
    0,
    -0.06,
    0,
    false,
    false,
    true,
  );

  const roadNS = tex.asphaltRoad('city_ns_v2', true);
  roadNS.repeat.set(1, 44);
  const roadEW = tex.asphaltRoad('city_ew_v2', true);
  roadEW.repeat.set(1, 44);
  const plainAsp = tex.concrete('#35393f', 0.16, 'city_inter_v2');
  plainAsp.repeat.set(4, 4);
  const cwTex = tex.crosswalk('city_cw_v2');
  const aspNorm = tex.asphaltNormal('city_an', 1.6);

  const roadNSMat = createMaterial({ map: roadNS, normalMap: aspNorm, roughness: 0.8 });
  const roadEWMat = createMaterial({ map: roadEW, normalMap: aspNorm, roughness: 0.8 });
  const interMat = createMaterial({ map: plainAsp, normalMap: aspNorm, roughness: 0.82 });
  const cwMat = createMaterial({ map: cwTex, roughness: 0.78 });

  for (const rx of CITY_AVENUES) {
    const w = rx === 0 ? 16.0 : 13.6;
    const len = rx === 0 ? 540 : 644;
    const zOff = rx === 0 ? 52 : 0;
    addBox(w, 0.04, len, roadNSMat, rx, 0.01, zOff, false, false, true);
    for (let z = -264; z <= 312; z += 48) {
      if ((rx === 0 && Math.abs(z) < 22) || Math.abs(z - CITY_CANAL_Z) < 18) {
        continue;
      }
      roadCenters.push({ x: rx, z, yaw: 0 });
    }
  }
  for (const rz of CITY_AVENUES) {
    const d = rz === 0 ? 16.0 : 13.6;
    const strip = addBox(d, 0.045, 644, roadEWMat, 0, 0.014, rz, false, false, true);
    strip.rotation.y = Math.PI / 2;
    for (let x = -264; x <= 264; x += 48) {
      if (Math.abs(x) < 22 && Math.abs(rz) < 22) {
        continue;
      }
      roadCenters.push({ x, z: rz, yaw: Math.PI / 2 });
    }
  }

  const cwTransforms: InstanceTransform[] = [];
  for (const rx of CITY_AVENUES) {
    for (const rz of CITY_AVENUES) {
      const sz = rx === 0 || rz === 0 ? 16.4 : 14.0;
      addBox(sz, 0.05, sz, interMat, rx, 0.018, rz, false, false, true);
      if (rx !== 0 || rz !== 0) {
        cwTransforms.push({ x: rx, y: 0.028, z: rz - sz * 0.63, sx: sz * 0.86, sz: 3.1 });
        cwTransforms.push({ x: rx, y: 0.028, z: rz + sz * 0.63, sx: sz * 0.86, sz: 3.1 });
        cwTransforms.push({ x: rx - sz * 0.63, y: 0.028, z: rz, ry: Math.PI / 2, sx: sz * 0.86, sz: 3.1 });
        cwTransforms.push({ x: rx + sz * 0.63, y: 0.028, z: rz, ry: Math.PI / 2, sx: sz * 0.86, sz: 3.1 });
      }
    }
  }
  addInstancedMeshes(ctx, new T.BoxGeometry(1, 0.02, 1), cwMat, cwTransforms, false, false);

  const concMat = createMaterial({
    map: tex.concrete('#90959a', 0.14, 'lm_c'),
    normalMap: tex.concreteNormal('lm_cn', 1.8),
    roughness: 0.84,
  });
  const darkMetal = createMaterial({ color: 0x313840, metalness: 0.68, roughness: 0.34 });
  const creamPlasterMat = createMaterial({ color: 0xe6dfd0, roughness: 0.78 });
  const timberMat = createMaterial({
    map: tex.wood('#6b482e', '#452c1a', 'city_timb'),
    roughness: 0.72,
  });
  const roofSlateMat = createMaterial({ color: 0x36404a, roughness: 0.66 });
  const roofClayMat = createMaterial({ color: 0x7c4636, roughness: 0.72 });
  const canopyWineMat = createMaterial({ color: 0x99362e, roughness: 0.65 });
  const canopyForestMat = createMaterial({ color: 0x265941, roughness: 0.65 });
  const brassGoldMat = createMaterial({ color: 0xd4ad5a, metalness: 0.78, roughness: 0.24 });
  const glassBlue = createMaterial({
    color: 0x7cb8d4,
    transparent: true,
    opacity: 0.45,
    roughness: 0.08,
    metalness: 0.32,
  });
  const warmShopGlass = createMaterial({
    color: 0xffdf99,
    emissive: 0xe8a846,
    emissiveIntensity: 0.72,
    roughness: 0.18,
  });
  const coolShopGlass = createMaterial({
    color: 0xaad4eb,
    emissive: 0x3a6f8c,
    emissiveIntensity: 0.44,
    roughness: 0.18,
  });

  const waterTex = tex.waterSurface();
  waterTex.repeat.set(34, 2);
  addBox(
    680,
    0.18,
    18,
    createMaterial({ map: waterTex, roughness: 0.14, metalness: 0.25 }),
    0,
    -0.06,
    CITY_CANAL_Z,
    false,
    false,
    true,
  );
  addBox(680, 0.56, 0.9, concMat, 0, 0.28, CITY_CANAL_Z - 9.4, false, true, true);
  addBox(680, 0.56, 0.9, concMat, 0, 0.28, CITY_CANAL_Z + 9.4, false, true, true);

  for (let i = 0; i < CITY_AVENUES.length; i++) {
    const x0 = i === 0 ? -340 : CITY_AVENUES[i - 1] + (CITY_AVENUES[i - 1] === 0 ? 8.2 : 7.0);
    const x1 = CITY_AVENUES[i] - (CITY_AVENUES[i] === 0 ? 8.2 : 7.0);
    if (x1 > x0 + 1) {
      colliders.push({
        minX: x0,
        maxX: x1,
        minZ: CITY_CANAL_Z - 9.6,
        maxZ: CITY_CANAL_Z + 9.6,
        minY: 0,
        maxY: 2.2,
        active: true,
      });
    }
  }
  const lastAvRight = CITY_AVENUES[CITY_AVENUES.length - 1] + 7.0;
  if (340 > lastAvRight) {
    colliders.push({
      minX: lastAvRight,
      maxX: 340,
      minZ: CITY_CANAL_Z - 9.6,
      maxZ: CITY_CANAL_Z + 9.6,
      minY: 0,
      maxY: 2.2,
      active: true,
    });
  }

  const bridgeDeckParts: GeoPartSpec[] = [];
  const bridgeSteelParts: GeoPartSpec[] = [];
  for (const ax of CITY_AVENUES) {
    const bw = ax === 0 ? 16.4 : 14.0;
    const segs = 10;
    for (let s = 0; s < segs; s++) {
      const u0 = s / segs;
      const u1 = (s + 1) / segs;
      const um = (u0 + u1) * 0.5;
      const z0 = CITY_CANAL_Z - 14 + u0 * 28;
      const z1 = CITY_CANAL_Z - 14 + u1 * 28;
      const y0 = Math.sin(u0 * Math.PI) * 2.25;
      const y1 = Math.sin(u1 * Math.PI) * 2.25;
      const zm = (z0 + z1) * 0.5;
      const ym = Math.sin(um * Math.PI) * 2.25;
      const tilt = Math.atan2(y1 - y0, z1 - z0);
      const segLen = Math.hypot(z1 - z0, y1 - y0) + 0.25;
      bridgeDeckParts.push({
        geo: new T.BoxGeometry(bw, 0.36, segLen),
        x: ax,
        y: ym - 0.14,
        z: zm,
        rx: -tilt,
      });
      for (const side of [-bw * 0.5 + 0.25, bw * 0.5 - 0.25]) {
        bridgeSteelParts.push({
          geo: new T.BoxGeometry(0.32, 0.95, segLen),
          x: ax + side,
          y: ym + 0.45,
          z: zm,
          rx: -tilt,
        });
      }
    }
    for (const side of [-bw * 0.5 + 0.22, bw * 0.5 - 0.22]) {
      bridgeSteelParts.push({
        geo: new T.CylinderGeometry(0.24, 0.32, 7.6, 10),
        x: ax + side,
        y: 3.8,
        z: CITY_CANAL_Z,
      });
      bridgeSteelParts.push({
        geo: new T.BoxGeometry(0.14, 0.14, 24),
        x: ax + side,
        y: 4.5,
        z: CITY_CANAL_Z,
      });
    }
    for (const side of [-bw * 0.5 - 0.2, bw * 0.5 + 0.2]) {
      colliders.push({
        minX: ax + side - 0.25,
        maxX: ax + side + 0.25,
        minZ: CITY_CANAL_Z - 14,
        maxZ: CITY_CANAL_Z + 14,
        minY: 0,
        maxY: 4.5,
        active: true,
      });
    }
  }
  const bridgeDeckMesh = new T.Mesh(track(mergePartsToGeometry(bridgeDeckParts)), interMat);
  bridgeDeckMesh.receiveShadow = true;
  bridgeDeckMesh.castShadow = true;
  const bridgeSteelMesh = new T.Mesh(track(mergePartsToGeometry(bridgeSteelParts)), darkMetal);
  bridgeSteelMesh.castShadow = true;
  scene.add(bridgeDeckMesh, bridgeSteelMesh);

  addCylinder(19.5, 19.5, 0.055, 48, interMat, 0, 0.02, 0, false, true);
  addCylinder(7.6, 8.0, 0.26, 36, concMat, 0, 0.13, 0, true, true);
  addCylinder(6.8, 6.8, 0.29, 36, createMaterial({ map: grassTex, roughness: 0.92 }), 0, 0.15, 0, false, true);
  addCylinder(2.6, 2.9, 0.6, 24, concMat, 0, 0.4, 0, true);
  addCylinder(0.95, 1.32, 7.4, 18, creamPlasterMat, 0, 4.0, 0, true);
  const spireRing = addMesh(
    new T.TorusGeometry(1.55, 0.095, 10, 32),
    brassGoldMat,
    0,
    5.4,
    0,
  );
  const clockCrown = addMesh(
    new T.OctahedronGeometry(0.92, 0),
    createMaterial({ color: 0xffe4a8, emissive: 0xe6b55a, emissiveIntensity: 0.7, metalness: 0.45 }),
    0,
    8.55,
    0,
  );
  addBox(0.1, 2.1, 0.1, darkMetal, -2.0, 1.05, 4.2, false);
  addBox(0.1, 2.1, 0.1, darkMetal, 2.0, 1.05, 4.2, false);
  addDoubleSign(
    4.6,
    1.28,
    tex.sign(
      '城市微缩枢纽 · 中央大道',
      '#1a222b',
      '#f5dfb0',
      'G 召唤厢式卡车 · Shift 氮气加速 · E 进地标',
      false,
      4.6 / 1.28,
    ),
    0,
    2.25,
    4.2,
    0,
    0x3b424a,
  );
  colliders.push({ minX: -7.2, maxX: 7.2, minZ: -7.2, maxZ: 7.2, minY: 0, maxY: 9.2, active: true });

  const curbCenters: InstanceTransform[] = [];
  const blockCoords = [-240, -144, -48, 48, 144, 240];
  for (const bx of blockCoords) {
    for (const bz of blockCoords) {
      if (Math.abs(bz - CITY_CANAL_Z) < 28) {
        continue;
      }
      curbCenters.push({ x: bx, y: 0.06, z: bz });
    }
  }
  addInstancedMeshes(
    ctx,
    new T.BoxGeometry(78, 0.12, 78),
    createMaterial({ color: 0x999fa4, roughness: 0.84 }),
    curbCenters,
    false,
    true,
  );

  const lampPostTransforms: { x: number; y: number; z: number; ry: number }[] = [];
  for (const ax of [-192, -96, 0, 96, 192]) {
    const offset = ax === 0 ? 8.6 : 7.4;
    for (let z = -264; z <= 264; z += 48) {
      if (Math.abs(z - CITY_CANAL_Z) < 24 || (ax === 0 && Math.abs(z) < 24)) {
        continue;
      }
      lampPostTransforms.push({ x: ax - offset, y: 0, z, ry: 0 });
      lampPostTransforms.push({ x: ax + offset, y: 0, z, ry: Math.PI });
    }
  }
  const bulbMat = createMaterial({
    color: 0xfff6d8,
    emissive: 0xffca72,
    emissiveIntensity: 1.25,
  });
  const lampPoleGeo = track(
    mergePartsToGeometry([
      { geo: new T.CylinderGeometry(0.11, 0.16, 0.42, 8), y: 0.21 },
      { geo: new T.CylinderGeometry(0.065, 0.095, 4.6, 8), y: 2.5 },
      { geo: new T.BoxGeometry(1.1, 0.07, 0.08), x: 0.48, y: 4.76 },
      { geo: new T.BoxGeometry(0.42, 0.08, 0.22), x: 0.96, y: 4.74 },
    ]),
  );
  addInstancedMeshes(
    ctx,
    lampPoleGeo,
    darkMetal,
    lampPostTransforms.map((p) => ({ x: p.x, y: p.y, z: p.z, ry: p.ry })),
    false,
    false,
  );
  addInstancedMeshes(
    ctx,
    new T.BoxGeometry(0.34, 0.05, 0.16),
    bulbMat,
    lampPostTransforms.map((p) => ({
      x: p.x + Math.cos(p.ry) * 0.96,
      y: 4.68,
      z: p.z,
      ry: p.ry,
    })),
    false,
    false,
  );

  const signalCorners: { x: number; z: number }[] = [];
  for (const sx of [-192, -96, 0, 96, 192]) {
    for (const sz of [-192, -96, 0, 96, 192]) {
      if (sx === 0 && sz === 0) {
        continue;
      }
      const off = sx === 0 || sz === 0 ? 8.8 : 7.6;
      signalCorners.push({ x: sx - off, z: sz - off });
      signalCorners.push({ x: sx + off, z: sz + off });
    }
  }
  const sigGreenMat = createMaterial({ color: 0x3bd96f, emissive: 0x26b554, emissiveIntensity: 1.0 });
  const sigRedMat = createMaterial({ color: 0xe8483c, emissive: 0xc92c22, emissiveIntensity: 0.9 });
  const sigHousingGeo = track(
    mergePartsToGeometry([
      { geo: new T.CylinderGeometry(0.08, 0.12, 5.2, 8), y: 2.6 },
      { geo: new T.BoxGeometry(0.28, 0.78, 0.28), y: 4.9 },
    ]),
  );
  addInstancedMeshes(
    ctx,
    sigHousingGeo,
    darkMetal,
    signalCorners.map((c) => ({ x: c.x, y: 0, z: c.z })),
    false,
    false,
  );
  addInstancedMeshes(
    ctx,
    new T.SphereGeometry(0.08, 8, 6),
    sigGreenMat,
    signalCorners.map((c) => ({ x: c.x, y: 4.72, z: c.z })),
    false,
    false,
  );
  addInstancedMeshes(
    ctx,
    new T.SphereGeometry(0.08, 8, 6),
    sigRedMat,
    signalCorners.map((c) => ({ x: c.x, y: 5.08, z: c.z })),
    false,
    false,
  );

  const treeSpots: [number, number, number, number][] = [];
  for (const bx of [-240, -144, -48, 48, 144, 240]) {
    for (const bz of [-240, -144, -48, 48, 240]) {
      treeSpots.push([bx - 33, 0.12, bz - 33, 0.95]);
      treeSpots.push([bx + 33, 0.12, bz + 33, 0.92]);
    }
  }
  for (let x = -264; x <= 264; x += 48) {
    if (CITY_AVENUES.some((av) => Math.abs(x - av) < 13)) {
      continue;
    }
    treeSpots.push([x, 0.12, CITY_CANAL_Z - 14, 0.96]);
    treeSpots.push([x, 0.12, CITY_CANAL_Z + 14, 0.96]);
  }
  buildCamphorGrove(
    ctx,
    treeSpots.map(([x, y, z, scale]) => ({ x, y, z, scale, solid: true })),
    true,
  );

  const winMatA = createMaterial({
    map: (() => {
      const t = tex.facadeWindows('#556878', '#e3f1ff', 'city_wa');
      t.repeat.set(3, 5);
      return t;
    })(),
    normalMap: tex.concreteNormal('win_an', 1.2),
    roughness: 0.42,
    metalness: 0.28,
  });
  const winMatB = createMaterial({
    map: (() => {
      const t = tex.facadeWindows('#465666', '#ffebc2', 'city_wb');
      t.repeat.set(3, 6);
      return t;
    })(),
    normalMap: tex.concreteNormal('win_bn', 1.2),
    roughness: 0.38,
    metalness: 0.32,
  });
  const brickRedMat = createMaterial({
    map: (() => {
      const t = tex.brickFacade('#8c4c3e', '#cfc4b2', 'city_br1');
      t.repeat.set(3, 3);
      return t;
    })(),
    normalMap: tex.brickNormal('br_n1', 2.2),
    roughness: 0.82,
  });
  const brickTanMat = createMaterial({
    map: (() => {
      const t = tex.brickFacade('#a67f58', '#ddd2be', 'city_br2');
      t.repeat.set(3, 3);
      return t;
    })(),
    normalMap: tex.brickNormal('br_n2', 2.0),
    roughness: 0.82,
  });

  const towerBodyGeo = track(
    mergePartsToGeometry([
      { geo: new T.BoxGeometry(13.5, 4.4, 13.5), y: 2.2 },
      { geo: new T.BoxGeometry(12.2, 18.0, 12.2), y: 13.4 },
      { geo: new T.BoxGeometry(9.2, 6.8, 9.2), y: 25.8 },
    ]),
  );
  const towerTrimGeo = track(
    mergePartsToGeometry([
      { geo: new T.BoxGeometry(14.0, 0.38, 14.0), y: 4.45 },
      { geo: new T.BoxGeometry(12.7, 0.32, 12.7), y: 22.4 },
      { geo: new T.BoxGeometry(9.7, 0.32, 9.7), y: 29.25 },
      { geo: new T.CylinderGeometry(0.1, 0.22, 6.2, 8), y: 32.3 },
      { geo: new T.BoxGeometry(2.2, 1.1, 1.8), x: 2.2, y: 29.9, z: -2.0 },
    ]),
  );

  const aptBodyGeo = track(
    mergePartsToGeometry([
      { geo: new T.BoxGeometry(13.0, 13.5, 10.6), y: 6.75 },
      { geo: new T.BoxGeometry(13.6, 0.42, 11.2), y: 13.7 },
    ]),
  );
  const aptBalconyParts: GeoPartSpec[] = [
    { geo: new T.CylinderGeometry(1.1, 1.1, 1.8, 12), x: -3.2, y: 14.6, z: -2.0 },
  ];
  for (let f = 0; f < 3; f++) {
    const fy = 4.2 + f * 3.2;
    for (const bx of [-3.4, 3.4]) {
      aptBalconyParts.push({ geo: new T.BoxGeometry(3.6, 0.16, 1.2), x: bx, y: fy, z: 5.7 });
      aptBalconyParts.push({ geo: new T.BoxGeometry(3.6, 0.85, 0.1), x: bx, y: fy + 0.48, z: 6.25 });
    }
  }
  const aptTrimGeo = track(mergePartsToGeometry(aptBalconyParts));

  const cafeBodyGeo = track(
    mergePartsToGeometry([
      { geo: new T.BoxGeometry(11.4, 4.2, 9.6), y: 2.1 },
      { geo: new T.BoxGeometry(10.8, 4.8, 9.0), y: 6.6 },
    ]),
  );
  const cafeRoofGeo = track(
    mergePartsToGeometry([
      { geo: new T.BoxGeometry(11.8, 0.38, 10.0), y: 9.15 },
      { geo: new T.BoxGeometry(9.8, 0.22, 2.2), y: 3.55, z: 5.65, rx: 0.28 },
    ]),
  );
  const cafeGlassGeo = track(
    mergePartsToGeometry([
      { geo: new T.BoxGeometry(8.8, 2.4, 0.16), y: 1.6, z: 4.85 },
      { geo: new T.BoxGeometry(1.6, 2.0, 0.14), x: -3.0, y: 6.4, z: 4.54 },
      { geo: new T.BoxGeometry(1.6, 2.0, 0.14), x: 0, y: 6.4, z: 4.54 },
      { geo: new T.BoxGeometry(1.6, 2.0, 0.14), x: 3.0, y: 6.4, z: 4.54 },
    ]),
  );

  const towerList: InstanceTransform[] = [];
  const aptList: InstanceTransform[] = [];
  const cafeList: InstanceTransform[] = [];
  const parkSpots: [number, number][] = [];

  for (const bx of blockCoords) {
    for (const bz of blockCoords) {
      if (Math.abs(bz - CITY_CANAL_Z) < 30) {
        continue;
      }
      const isLandmarkBlock = CITY_LANDMARKS.some(
        (lm) => Math.abs(lm.x - bx) < 34 && Math.abs(lm.z - bz) < 34,
      );
      if (isLandmarkBlock) {
        const subCorner = ((Math.abs(bx) + Math.abs(bz)) / 48) % 2 === 0 ? -1 : 1;
        const fx = bx + subCorner * 22;
        const fz = bz + subCorner * 22;
        if (Math.abs(fx) < 310 && Math.abs(fz) < 310) {
          cafeList.push({ x: fx, y: 0.12, z: fz, ry: subCorner > 0 ? Math.PI : 0 });
          colliders.push({ minX: fx - 5.9, maxX: fx + 5.9, minZ: fz - 5.0, maxZ: fz + 5.0, minY: 0, maxY: 9.5, active: true });
        }
        continue;
      }

      const seed = Math.abs(bx * 7 + bz * 13);
      if (seed % 5 === 0) {
        parkSpots.push([bx, bz]);
      } else {
        const tx = bx - 16;
        const tz = bz - 14;
        const hScale = 0.85 + (seed % 5) * 0.16;
        towerList.push({ x: tx, y: 0.12, z: tz, sy: hScale });
        colliders.push({ minX: tx - 7.0, maxX: tx + 7.0, minZ: tz - 7.0, maxZ: tz + 7.0, minY: 0, maxY: 32 * hScale, active: true });
      }

      const ax = bx + 16;
      const az = bz - 12;
      const aRy = ((seed % 4) * Math.PI) / 2;
      aptList.push({ x: ax, y: 0.12, z: az, ry: aRy });
      const swapped = Math.abs(Math.sin(aRy)) > 0.7;
      colliders.push({
        minX: ax - (swapped ? 5.6 : 6.8),
        maxX: ax + (swapped ? 5.6 : 6.8),
        minZ: az - (swapped ? 6.8 : 5.6),
        maxZ: az + (swapped ? 6.8 : 5.6),
        minY: 0,
        maxY: 14.5,
        active: true,
      });

      const cx = bx - 14;
      const cz = bz + 18;
      cafeList.push({ x: cx, y: 0.12, z: cz, ry: Math.PI });
      colliders.push({ minX: cx - 5.9, maxX: cx + 5.9, minZ: cz - 5.0, maxZ: cz + 5.0, minY: 0, maxY: 9.5, active: true });
    }
  }

  addInstancedMeshes(ctx, towerBodyGeo, winMatA, towerList, true, true);
  addInstancedMeshes(ctx, towerTrimGeo, darkMetal, towerList, false, true);
  addInstancedMeshes(ctx, aptBodyGeo, brickRedMat, aptList, true, true);
  addInstancedMeshes(ctx, aptTrimGeo, creamPlasterMat, aptList, false, true);
  addInstancedMeshes(ctx, cafeBodyGeo, brickTanMat, cafeList, true, true);
  addInstancedMeshes(ctx, cafeRoofGeo, canopyWineMat, cafeList, false, true);
  addInstancedMeshes(ctx, cafeGlassGeo, warmShopGlass, cafeList, false, false);

  const parkRingList: InstanceTransform[] = [];
  const parkWaterList: InstanceTransform[] = [];
  for (const [px, pz] of parkSpots) {
    parkRingList.push({ x: px, y: 0.36, z: pz });
    parkWaterList.push({ x: px, y: 0.68, z: pz });
    colliders.push({ minX: px - 4.2, maxX: px + 4.2, minZ: pz - 4.2, maxZ: pz + 4.2, minY: 0, maxY: 2.0, active: true });
    buildParkBench(ctx, px - 6.8, 0.12, pz + 6.8, Math.PI / 4, true);
    buildParkBench(ctx, px + 6.8, 0.12, pz - 6.8, -Math.PI * 0.75, true);
  }
  addInstancedMeshes(ctx, new T.CylinderGeometry(3.8, 4.2, 0.6, 20), creamPlasterMat, parkRingList, true, true);
  addInstancedMeshes(
    ctx,
    new T.CylinderGeometry(3.2, 3.2, 0.12, 20),
    createMaterial({ color: 0x4caed1, roughness: 0.12 }),
    parkWaterList,
    false,
    false,
  );

  buildSedanCar(ctx, -91.5, 0.03, -44, 0, 0x3b5978, true);
  buildSedanCar(ctx, 91.5, 0.03, 44, Math.PI, 0xb84c38, true);
  buildSedanCar(ctx, 44, 0.03, -5.0, Math.PI / 2, 0xd4c8b4, true);
  buildSedanCar(ctx, -44, 0.03, 5.0, -Math.PI / 2, 0x4b6e58, true);
  buildSedanCar(ctx, -187.5, 0.03, 72, 0, 0xc7923e, true);
  buildSedanCar(ctx, 187.5, 0.03, -72, Math.PI, 0x5c6978, true);
  buildSedanCar(ctx, -5.0, 0.03, -155, 0, 0x7b4c63, true);
  buildSedanCar(ctx, 5.0, 0.03, 96, Math.PI / 2, 0x2c637d, true);

  const portalRings: THREE.Mesh[] = [];
  const portalPadTransforms: InstanceTransform[] = [];
  const totemPostTransforms: InstanceTransform[] = [];

  function registerLandmark(
    id: SceneId,
    title: string,
    sub: string,
    beaconColor: number,
    interactX: number,
    interactZ: number,
    signY = 3.5,
    signRy = 0,
  ) {
    portalPadTransforms.push({ x: interactX, y: 0.17, z: interactZ });
    const ring = addMesh(
      new T.TorusGeometry(1.15, 0.09, 10, 28),
      createMaterial({
        color: beaconColor,
        emissive: beaconColor,
        emissiveIntensity: 0.78,
        roughness: 0.2,
      }),
      interactX,
      1.45,
      interactZ,
      false,
      false,
    );
    portalRings.push(ring);
    const dx = Math.cos(signRy) * 1.55;
    const dz = -Math.sin(signRy) * 1.55;
    totemPostTransforms.push({ x: interactX - dx, y: (signY + 0.52) / 2, z: interactZ - dz, sy: signY + 0.52 });
    totemPostTransforms.push({ x: interactX + dx, y: (signY + 0.52) / 2, z: interactZ + dz, sy: signY + 0.52 });
    addDoubleSign(
      3.1,
      1.08,
      tex.sign(title, '#1a222b', '#f5e4b8', sub, false, 3.1 / 1.08),
      interactX,
      signY,
      interactZ,
      signRy,
      0x3b424a,
    );
    addInteract(
      'city_enter_' + id,
      V(interactX, 1.45, interactZ),
      `进入「${title}」`,
      sub,
      () => {
        const idx = sceneIdxById(id);
        if (idx !== -1) {
          sfx.play('door');
          addTimedRedirect(() => {
            loadScene(idx);
          }, 180);
        }
      },
      { radius: 4.0, mesh: ring },
    );
  }

  addBox(12.0, 9.6, 12.0, concMat, -48, 4.9, -48, true);
  addBox(12.8, 0.42, 12.8, darkMetal, -48, 9.85, -48, false);
  const miniFan = addMesh(
    new T.TorusGeometry(0.95, 0.16, 10, 22),
    createMaterial({ color: 0xd4dade, metalness: 0.55 }),
    -50.6,
    11.0,
    -48,
  );
  addCylinder(0.08, 0.08, 2.8, 10, darkMetal, -45.2, 11.2, -50.2);
  addMesh(new T.ConeGeometry(0.28, 1.1, 10), createMaterial({ color: 0xd96236 }), -44.6, 12.4, -50.2).rotation.z =
    -Math.PI / 2;
  registerLandmark('platform', '高处平台', '天台观测塔 · 214m', 0xc8d8e6, -48, -32, 3.5, 0);

  addBox(12.2, 19.5, 12.2, winMatB, -48, 9.9, -144, true);
  addBox(12.9, 0.45, 12.9, darkMetal, -48, 19.8, -144, false);
  addBox(5.2, 0.24, 2.4, darkMetal, -48, 3.6, -137.0, false);
  addBox(4.4, 3.2, 0.18, glassBlue, -48, 1.7, -137.8, false);
  addCylinder(0.08, 0.18, 4.2, 10, darkMetal, -48, 21.8, -144, false);
  registerLandmark('office', '写字楼念词', '幕墙办公楼 · 讲台', 0x9ec9eb, -48, -128, 3.5, 0);

  addBox(13.6, 7.2, 12.6, creamPlasterMat, 48, 3.7, -48, true);
  addBox(14.2, 0.72, 3.2, canopyWineMat, 48, 5.4, -41.4, false);
  addCylinder(2.1, 2.1, 0.65, 20, createMaterial({ color: 0xd99b4e }), 48, 7.7, -48);
  addCylinder(2.2, 2.2, 0.34, 20, createMaterial({ color: 0x6b321e }), 48, 8.2, -48);
  addCylinder(2.14, 2.14, 0.46, 20, createMaterial({ color: 0xe6ad5c }), 48, 8.58, -48);
  registerLandmark('mall', '大商场汉堡店', '炙烤牛肉汉堡站', 0xf2b554, 48, -32, 3.5, 0);

  const hospMat = createMaterial({ color: 0xe8efed, roughness: 0.55 });
  addBox(13.8, 8.2, 12.0, hospMat, 48, 4.2, -144, true);
  addBox(4.8, 0.22, 2.2, darkMetal, 48, 3.7, -137.2, false);
  addBox(2.6, 3.4, 0.34, createMaterial({ color: 0x697d85, metalness: 0.48 }), 48, 1.8, -137.8, false);
  addBox(0.45, 1.65, 0.16, createMaterial({ color: 0xc93b32 }), 48, 5.4, -137.9, false);
  addBox(1.65, 0.45, 0.16, createMaterial({ color: 0xc93b32 }), 48, 5.4, -137.9, false);
  registerLandmark('hospital', '医院厚门走廊', '隔离屏蔽门区', 0x77c4d9, 48, -128, 3.5, 0);

  addBox(16.0, 5.2, 11.4, createMaterial({ color: 0xe3e9ee }), 240, 2.7, -240, true);
  addBox(5.8, 4.4, 5.8, glassBlue, 234, 7.2, -240, false);
  const jetBodyMat = createMaterial({ color: 0xf4f6f8, roughness: 0.3, metalness: 0.25 });
  const jetFuse = addCylinder(0.62, 0.62, 7.8, 18, jetBodyMat, 241, 7.2, -234);
  jetFuse.rotation.x = Math.PI / 2;
  addMesh(new T.ConeGeometry(0.62, 1.5, 18), jetBodyMat, 241, 7.2, -229.4).rotation.x = Math.PI / 2;
  addBox(9.2, 0.18, 2.1, createMaterial({ color: 0x245682 }), 241, 7.1, -234, false);
  addBox(0.18, 1.8, 1.4, createMaterial({ color: 0x245682 }), 241, 8.2, -237.4, false);
  registerLandmark('airport', '机场登机玻璃门', '03号登机口 · 客机', 0x99d1f0, 240, -222, 3.5, 0);

  addCylinder(6.8, 7.4, 2.4, 28, createMaterial({ color: 0xeaf6f8 }), 240, 1.3, -48, true);
  addMesh(new T.SphereGeometry(6.4, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), glassBlue, 240, 2.4, -48, false);
  const slideRing = addMesh(
    new T.TorusGeometry(3.6, 0.38, 10, 28),
    createMaterial({ color: 0xf0829d }),
    240,
    3.8,
    -48,
  );
  slideRing.rotation.x = 0.65;
  registerLandmark('waterpark', '商场水上乐园', '二层戏水圆筒', 0xf287a4, 222, -48, 3.5, Math.PI / 2);

  addBox(12.2, 6.2, 10.8, createMaterial({ color: 0xdbe8df }), -144, 3.2, -144, true);
  addMesh(new T.ConeGeometry(8.2, 3.0, 4), createMaterial({ color: 0x5c8c72 }), -144, 7.8, -144).rotation.y = Math.PI / 4;
  registerLandmark('infirmary', '小学医务室', 'F字形绿墙走廊', 0x96d4b2, -144, -128, 3.5, 0);

  addBox(12.4, 6.2, 9.8, createMaterial({ color: 0xebe3d3 }), -144, 3.2, -48, true);
  addBox(2.8, 1.2, 1.1, darkMetal, -138, 0.7, -41.5, true);
  addBox(2.3, 0.16, 0.8, createMaterial({ color: 0xd9481c, emissive: 0xb82e0c, emissiveIntensity: 0.9 }), -138, 1.36, -41.5, false);
  registerLandmark('school_bbq', '小学门外烧烤', '教室与炭火烤摊', 0xf0a66e, -144, -32, 3.5, 0);

  addBox(11.6, 5.8, 10.6, createMaterial({ color: 0xf2eee3 }), -48, 3.0, 48, true);
  addBox(12.0, 1.25, 11.0, canopyForestMat, -48, 6.1, 48, false);
  addBox(12.0, 0.32, 11.0, createMaterial({ color: 0xd97a38 }), -48, 5.3, 48, false);
  addBox(7.8, 0.16, 3.2, timberMat, -48, 0.2, 39.6, false);
  registerLandmark('convenience', '便利店与修路木道', '24H热关东煮', 0xe8c47a, -48, 32, 3.5, 0);

  addBox(11.4, 0.6, 12.2, concMat, 48, 0.4, 48, true);
  addBox(10.8, 3.8, 11.4, glassBlue, 48, 2.6, 48, true);
  addBox(11.6, 0.4, 12.0, createMaterial({ color: 0x1f3c5c }), 48, 4.6, 48, false);
  registerLandmark('subway', '多线地铁站', '1/4/7号线换乘站', 0x7ab4e0, 48, 32, 3.5, 0);

  addBox(10.6, 5.6, 10.6, createMaterial({ color: 0xebe4d5 }), 144, 2.9, 48, true);
  addMesh(new T.ConeGeometry(7.8, 3.6, 4), roofClayMat, 144, 7.5, 48).rotation.y = Math.PI / 4;
  addBox(1.8, 2.2, 0.2, createMaterial({ color: 0xf2e5b8 }), 144, 2.4, 42.6, false);
  registerLandmark('studio', '小画室', '地铁旁画架工坊', 0x5d8ec7, 144, 32, 3.5, 0);

  addBox(11.8, 7.6, 11.8, createMaterial({ map: tex.concrete('#484c52', 0.2, 'lm_zig') }), -48, 3.9, 240, true);
  addBox(7.6, 0.65, 7.6, createMaterial({ color: 0x89949e, roughness: 0.45 }), -48, 7.95, 240, false);
  addBox(6.2, 0.3, 6.2, createMaterial({ color: 0xf2cf5b, emissive: 0xe6b53c, emissiveIntensity: 0.65 }), -48, 8.32, 240, false);
  for (let s = 0; s < 6; s++) {
    addBox(2.6, 0.48, 1.0, darkMetal, -43.5, 0.5 + s * 0.68, 243 - s * 1.15, false);
  }
  registerLandmark('zigzag', '之字形台阶花田', '光柱与一米花田', 0xf2e394, -48, 222, 3.5, 0);

  addBox(12.6, 0.34, 12.6, concMat, -144, 0.22, 48, false);
  buildPottedPlant(ctx, -140, 0.22, 44, 2.0, 0x5c7d42);
  buildSedanCar(ctx, -143, 0.22, 52, Math.PI / 2, 0xc8ced1, true);
  registerLandmark('park_lot', '小区林荫停车场', '香樟树荫与单车', 0x8cc775, -126, 48, 3.5, Math.PI / 2);

  addBox(12.2, 4.2, 11.8, createMaterial({ color: 0x5a6066 }), -240, 2.2, 240, true);
  addBox(8.2, 2.8, 0.26, createMaterial({ color: 0x16191e }), -240, 1.5, 234.0, false);
  addBox(7.6, 0.26, 0.24, createMaterial({ map: tex.hazard('lm_gar_h') }), -240, 2.0, 231.5, false);
  registerLandmark('garage', '地下车库', 'B2 电梯与坡道', 0xc7b588, -240, 222, 3.5, 0);

  const rockLMMat = createMaterial({
    map: tex.concrete('#5e574e', 0.22, 'lm_cv'),
    normalMap: tex.concreteNormal('lm_cvn', 2.6),
    roughness: 0.92,
  });
  const caveInnerMat = createMaterial({ color: 0x11151a, roughness: 0.96 });
  addBox(11.4, 2.0, 11.4, rockLMMat, 240, 1.1, 48, false);
  addBox(3.8, 6.0, 10.6, rockLMMat, 236.5, 3.6, 44.0, false);
  addBox(3.8, 6.0, 10.6, rockLMMat, 236.5, 3.6, 52.0, false);
  addBox(9.8, 2.4, 11.6, rockLMMat, 241.0, 7.2, 48, false);
  addBox(4.0, 4.6, 5.4, caveInnerMat, 239.0, 3.0, 48, false);
  const crysMat = createMaterial({ color: 0x7bdcf0, emissive: 0x2f8fa3, emissiveIntensity: 0.85 });
  addMesh(new T.OctahedronGeometry(0.85, 0), crysMat, 234.8, 1.5, 45.2);
  addMesh(new T.OctahedronGeometry(0.58, 0), crysMat, 234.4, 1.1, 50.6);
  colliders.push({ minX: 234.5, maxX: 245.6, minZ: 42.2, maxZ: 53.8, minY: 0, maxY: 8.5, active: true });
  registerLandmark('cave', '幽深洞穴', '狭长石灰岩溶洞', 0xe6be9c, 222, 48, 3.5, Math.PI / 2);

  addBox(12.6, 1.8, 12.6, createMaterial({ map: tex.lava(), emissive: 0x6e1a07, emissiveIntensity: 0.45 }), 240, 0.95, 240, true);
  const obsidianMat = createMaterial({ color: 0x3b2c2a, roughness: 0.75 });
  addCylinder(0.72, 1.5, 7.2, 6, obsidianMat, 240, 4.4, 240, true);
  addCylinder(0.45, 1.0, 4.6, 6, obsidianMat, 237, 3.1, 242.5, false);
  addCylinder(0.42, 0.95, 4.2, 6, obsidianMat, 243, 2.9, 237.6, false);
  addMesh(new T.OctahedronGeometry(1.15, 0), createMaterial({ color: 0xff6b3d, emissive: 0xff4500, emissiveIntensity: 1.1 }), 240, 8.6, 240);
  registerLandmark('hellstone', '地狱石平台', '玄武岩与岩浆裂隙', 0xff6b3d, 240, 222, 3.5, 0);

  addBox(18.0, 8.2, 12.0, createMaterial({ color: 0xcfd6d3, roughness: 0.62 }), 0, 4.2, -256, true);
  addBox(4.8, 5.4, 0.28, glassBlue, 0, 2.9, -249.8, false);
  addBox(19.0, 0.65, 4.6, createMaterial({ color: 0xaab4b0 }), 0, 8.5, -248.4, false);
  addBox(7.2, 0.36, 2.8, createMaterial({ color: 0xbac2bf }), 0, 0.3, -248.8, false);
  buildPottedPlant(ctx, -6.4, 0.16, -248.0, 2.0, 0x868f8a);
  buildPottedPlant(ctx, 6.4, 0.16, -248.0, 2.0, 0x868f8a);
  registerLandmark('backyard', '博物馆清晨后院', '清晨微光绣球庭院', 0xf2f7f2, 0, -238, 3.7, 0);

  addInstancedMeshes(
    ctx,
    new T.CylinderGeometry(1.55, 1.65, 0.12, 22),
    darkMetal,
    portalPadTransforms,
    false,
    true,
  );
  addInstancedMeshes(
    ctx,
    new T.BoxGeometry(0.1, 1.0, 0.1),
    darkMetal,
    totemPostTransforms,
    false,
    false,
  );

  buildParkBench(ctx, -11.5, 0.12, 12.6, Math.PI / 4, true);
  buildParkBench(ctx, 11.5, 0.12, 12.6, -Math.PI / 4, true);

  void coolShopGlass;

  updaters.push((dt, t) => {
    spireRing.rotation.y += dt * 0.6;
    clockCrown.rotation.y += dt * 1.1;
    clockCrown.position.y = 8.55 + Math.sin(t * 2.1) * 0.18;
    miniFan.rotation.z += dt * 3.5;
    for (let i = 0; i < portalRings.length; i++) {
      portalRings[i].rotation.y = t * 1.2 + i * 0.35;
    }
  });

  setBounds(CITY_BOUNDS);
  setHeightFn((x, z) => cityGroundHeightAt(x, z));
  setSurfaceFn((x, z) => {
    for (const av of CITY_AVENUES) {
      const half = av === 0 ? 8.0 : 6.8;
      if (Math.abs(x - av) < half || Math.abs(z - av) < half) {
        return 'concrete';
      }
    }
    return 'stone';
  });

  return {
    pos: V(0, 1.65, 24.5),
    yaw: 0,
    whisper: '欢迎来到微缩城市！按 [G] 召唤重型厢式卡车，按住 [Shift] 氮气全速飞驰、翻越运河大桥，走进地标光环按 [E] 进入现场。',
  };
}

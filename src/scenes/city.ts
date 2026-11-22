import type * as THREE from 'three/webgpu';
import type { SceneContext } from './sceneContext';
import type { SceneId, SceneInitResult } from '../types/game';
import {
  addInstancedMeshes,
  buildCamphorGrove,
  buildParkBench,
  buildPottedPlant,
  buildSedanCar,
} from '../engine/propKit';
import type { InstanceTransform } from '../engine/propKit';

export interface CityLandmarkAnchor {
  id: SceneId;
  x: number;
  z: number;
  yaw: number;
}

export const CITY_LANDMARKS: CityLandmarkAnchor[] = [
  { id: 'backyard', x: 0, z: -116, yaw: 0 },
  { id: 'platform', x: -24, z: -20, yaw: 0 },
  { id: 'office', x: -24, z: -68, yaw: 0 },
  { id: 'mall', x: 24, z: -20, yaw: 0 },
  { id: 'hospital', x: 24, z: -68, yaw: 0 },
  { id: 'airport', x: 72, z: -68, yaw: 0 },
  { id: 'waterpark', x: 68, z: -24, yaw: Math.PI / 2 },
  { id: 'infirmary', x: -72, z: -68, yaw: 0 },
  { id: 'school_bbq', x: -72, z: -20, yaw: 0 },
  { id: 'convenience', x: -24, z: 20, yaw: Math.PI },
  { id: 'subway', x: 24, z: 20, yaw: Math.PI },
  { id: 'studio', x: 24, z: 68, yaw: Math.PI },
  { id: 'zigzag', x: -24, z: 68, yaw: Math.PI },
  { id: 'park_lot', x: -68, z: 24, yaw: -Math.PI / 2 },
  { id: 'garage', x: -72, z: 68, yaw: Math.PI },
  { id: 'cave', x: 68, z: 24, yaw: Math.PI / 2 },
  { id: 'hellstone', x: 72, z: 68, yaw: Math.PI },
];

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

  scene.background = new T.Color(0xc6dae8);
  scene.fog = new T.Fog(0xc6dae8, 72, 260);
  scene.add(new T.HemisphereLight(0xf3f8ff, 0x5c6d64, 0.96));
  const sun = new T.DirectionalLight(0xfff4df, 1.38);
  sun.position.set(42, 58, 32);
  sun.castShadow = true;
  scene.add(sun);

  const grassTex = tex.grass('#597f45', '#446733');
  grassTex.repeat.set(40, 40);
  addBox(
    360,
    0.4,
    360,
    createMaterial({ map: grassTex, roughness: 0.95 }),
    0,
    -0.24,
    0,
    false,
    false,
    true,
  );

  const pavTex = tex.pavement('#c5c6c0', '#b4b6b0', 'city_pav');
  pavTex.repeat.set(76, 76);
  addBox(
    276,
    0.16,
    276,
    createMaterial({
      map: pavTex,
      bumpMap: tex.bumpNoise('city_pb', 22),
      bumpScale: 0.012,
      roughness: 0.85,
    }),
    0,
    -0.06,
    0,
    false,
    false,
    true,
  );

  const roadNS = tex.asphaltRoad('city_ns', true);
  roadNS.repeat.set(1, 28);
  const roadEW = tex.asphaltRoad('city_ew', true);
  roadEW.repeat.set(1, 28);
  const plainAsp = tex.concrete('#383c42', 0.14, 'city_inter');
  plainAsp.repeat.set(3, 3);
  const cwTex = tex.crosswalk('city_cw');

  const roadNSMat = createMaterial({ map: roadNS, roughness: 0.82 });
  const roadEWMat = createMaterial({ map: roadEW, roughness: 0.82 });
  const interMat = createMaterial({ map: plainAsp, roughness: 0.84 });
  const cwMat = createMaterial({ map: cwTex, roughness: 0.8 });

  const avenues = [-96, -48, 0, 48, 96];
  for (const rx of avenues) {
    const w = rx === 0 ? 11.2 : 9.6;
    const len = rx === 0 ? 228 : 258;
    const zOff = rx === 0 ? 10 : 0;
    addBox(w, 0.04, len, roadNSMat, rx, 0.01, zOff, false, false, true);
    for (let z = -100; z <= 116; z += 24) {
      if (rx === 0 && Math.abs(z) < 16) {
        continue;
      }
      roadCenters.push({ x: rx, z, yaw: 0 });
    }
  }
  for (const rz of avenues) {
    const d = rz === 0 ? 11.2 : 9.6;
    const strip = addBox(d, 0.045, 258, roadEWMat, 0, 0.014, rz, false, false, true);
    strip.rotation.y = Math.PI / 2;
    for (let x = -112; x <= 112; x += 24) {
      if (Math.abs(x) < 16 && Math.abs(rz) < 16) {
        continue;
      }
      roadCenters.push({ x, z: rz, yaw: Math.PI / 2 });
    }
  }

  const cwTransforms: InstanceTransform[] = [];
  for (const rx of avenues) {
    for (const rz of avenues) {
      const sz = rx === 0 || rz === 0 ? 11.4 : 9.8;
      addBox(sz, 0.05, sz, interMat, rx, 0.018, rz, false, false, true);
      if (rx !== 0 || rz !== 0) {
        cwTransforms.push({ x: rx, y: 0.028, z: rz - sz * 0.62, sx: sz * 0.82, sz: 2.3 });
        cwTransforms.push({ x: rx, y: 0.028, z: rz + sz * 0.62, sx: sz * 0.82, sz: 2.3 });
        cwTransforms.push({ x: rx - sz * 0.62, y: 0.028, z: rz, ry: Math.PI / 2, sx: sz * 0.82, sz: 2.3 });
        cwTransforms.push({ x: rx + sz * 0.62, y: 0.028, z: rz, ry: Math.PI / 2, sx: sz * 0.82, sz: 2.3 });
      }
    }
  }
  addInstancedMeshes(ctx, new T.BoxGeometry(1, 0.02, 1), cwMat, cwTransforms, false, false);

  addCylinder(14.8, 14.8, 0.055, 42, interMat, 0, 0.02, 0, false, true);
  addCylinder(6.8, 7.1, 0.24, 32, createMaterial({ color: 0xc2c5bf, roughness: 0.78 }), 0, 0.12, 0, true, true);
  addCylinder(6.1, 6.1, 0.27, 32, createMaterial({ map: grassTex, roughness: 0.92 }), 0, 0.14, 0, false, true);
  addCylinder(2.3, 2.6, 0.52, 20, createMaterial({ color: 0x9aa0a6, roughness: 0.55 }), 0, 0.36, 0, true);
  addCylinder(0.82, 1.12, 5.0, 16, createMaterial({ color: 0xe2ddd2, roughness: 0.48 }), 0, 2.8, 0, true);
  const spireRing = addMesh(
    new T.TorusGeometry(1.22, 0.085, 8, 28),
    createMaterial({ color: 0xd9b35f, metalness: 0.75, roughness: 0.22 }),
    0,
    4.0,
    0,
  );
  const clockCrown = addMesh(
    new T.OctahedronGeometry(0.72, 0),
    createMaterial({ color: 0xffe4a8, emissive: 0xe6b55a, emissiveIntensity: 0.65, metalness: 0.4 }),
    0,
    6.1,
    0,
  );
  const postFrameMat = createMaterial({ color: 0x3b424a, metalness: 0.7, roughness: 0.35 });
  addBox(0.08, 1.95, 0.08, postFrameMat, -1.55, 0.98, 2.8, false);
  addBox(0.08, 1.95, 0.08, postFrameMat, 1.55, 0.98, 2.8, false);
  addDoubleSign(
    4.2,
    1.18,
    tex.sign(
      '城市微缩枢纽 · 中心广场',
      '#1d252e',
      '#f5dfb0',
      'G 召唤卡车 · 进光环按 E 传送',
      false,
      4.2 / 1.18,
    ),
    0,
    2.02,
    2.8,
    0,
    0x3b424a,
  );
  colliders.push({ minX: -6.1, maxX: 6.1, minZ: -6.1, maxZ: 6.1, minY: 0, maxY: 6.8, active: true });

  const curbTransforms: InstanceTransform[] = [];
  for (const bx of [-72, -24, 24, 72]) {
    for (const bz of [-72, -24, 24, 72]) {
      curbTransforms.push({ x: bx, y: 0.06, z: bz });
    }
  }
  addInstancedMeshes(
    ctx,
    new T.BoxGeometry(34, 0.12, 34),
    createMaterial({ color: 0x9aa0a4, roughness: 0.85 }),
    curbTransforms,
    false,
    true,
  );

  const lampPostTransforms: { x: number; y: number; z: number; ry: number }[] = [];
  for (const ax of [-48, 0, 48]) {
    for (const z of [-84, -60, -36, -16, 16, 36, 60, 84]) {
      lampPostTransforms.push({ x: ax - 5.9, y: 0, z, ry: 0 });
      lampPostTransforms.push({ x: ax + 5.9, y: 0, z, ry: Math.PI });
    }
  }
  const poleMat = createMaterial({ color: 0x313840, metalness: 0.68, roughness: 0.35 });
  const bulbMat = createMaterial({
    color: 0xfff6d8,
    emissive: 0xffca72,
    emissiveIntensity: 1.2,
  });
  addInstancedMeshes(
    ctx,
    new T.CylinderGeometry(0.065, 0.095, 4.4, 8),
    poleMat,
    lampPostTransforms.map((p) => ({ x: p.x, y: 2.2, z: p.z })),
    false,
    false,
  );
  addInstancedMeshes(
    ctx,
    new T.BoxGeometry(1.0, 0.07, 0.08),
    poleMat,
    lampPostTransforms.map((p) => ({
      x: p.x + Math.cos(p.ry) * 0.45,
      y: 4.38,
      z: p.z,
      ry: p.ry,
    })),
    false,
    false,
  );
  addInstancedMeshes(
    ctx,
    new T.BoxGeometry(0.34, 0.06, 0.16),
    bulbMat,
    lampPostTransforms.map((p) => ({
      x: p.x + Math.cos(p.ry) * 0.9,
      y: 4.32,
      z: p.z,
      ry: p.ry,
    })),
    false,
    false,
  );

  const signalCorners: { x: number; z: number }[] = [];
  for (const sx of [-48, 0, 48]) {
    for (const sz of [-48, 0, 48]) {
      if (sx === 0 && sz === 0) {
        continue;
      }
      signalCorners.push({ x: sx - 6.0, z: sz - 6.0 });
      signalCorners.push({ x: sx + 6.0, z: sz + 6.0 });
    }
  }
  const sigGreenMat = createMaterial({ color: 0x3bd96f, emissive: 0x26b554, emissiveIntensity: 1.0 });
  const sigRedMat = createMaterial({ color: 0xe8483c, emissive: 0xc92c22, emissiveIntensity: 0.9 });
  addInstancedMeshes(
    ctx,
    new T.CylinderGeometry(0.075, 0.11, 5.0, 8),
    poleMat,
    signalCorners.map((c) => ({ x: c.x, y: 2.5, z: c.z })),
    false,
    false,
  );
  addInstancedMeshes(
    ctx,
    new T.BoxGeometry(0.26, 0.72, 0.26),
    poleMat,
    signalCorners.map((c) => ({ x: c.x, y: 4.7, z: c.z })),
    false,
    false,
  );
  addInstancedMeshes(
    ctx,
    new T.SphereGeometry(0.075, 8, 6),
    sigGreenMat,
    signalCorners.map((c) => ({ x: c.x, y: 4.54, z: c.z })),
    false,
    false,
  );
  addInstancedMeshes(
    ctx,
    new T.SphereGeometry(0.075, 8, 6),
    sigRedMat,
    signalCorners.map((c) => ({ x: c.x, y: 4.86, z: c.z })),
    false,
    false,
  );

  const treeSpots: [number, number, number, number][] = [
    [-8.5, 0, -28, 0.85],
    [8.5, 0, -28, 0.85],
    [-8.5, 0, 28, 0.85],
    [8.5, 0, 28, 0.85],
    [-28, 0, -8.5, 0.85],
    [28, 0, -8.5, 0.85],
    [-28, 0, 8.5, 0.85],
    [28, 0, 8.5, 0.85],
    [-56, 0, -34, 0.85],
    [-56, 0, 34, 0.85],
    [56, 0, -34, 0.85],
    [56, 0, 34, 0.85],
    [-34, 0, -56, 0.85],
    [34, 0, -56, 0.85],
    [-34, 0, 56, 0.85],
    [34, 0, 56, 0.85],
    [-82, 0, -82, 0.9],
    [82, 0, -82, 0.9],
    [-82, 0, 82, 0.9],
    [82, 0, 82, 0.9],
    [-12, 0, -108, 0.95],
    [12, 0, -108, 0.95],
  ];
  buildCamphorGrove(
    ctx,
    treeSpots.map(([x, y, z, scale]) => ({ x, y, z, scale, solid: true })),
    true,
  );

  const winMatA = createMaterial({
    map: (() => {
      const t = tex.facadeWindows('#5f7080', '#e3f1ff', 'city_wa');
      t.repeat.set(2, 3);
      return t;
    })(),
    roughness: 0.7,
  });
  const winMatB = createMaterial({
    map: (() => {
      const t = tex.facadeWindows('#4f5e6e', '#ffebc2', 'city_wb');
      t.repeat.set(2, 4);
      return t;
    })(),
    roughness: 0.68,
  });
  const brickRedMat = createMaterial({
    map: (() => {
      const t = tex.brickFacade('#8c4c3e', '#cfc4b2', 'city_br1');
      t.repeat.set(2, 2);
      return t;
    })(),
    roughness: 0.82,
  });
  const brickTanMat = createMaterial({
    map: (() => {
      const t = tex.brickFacade('#a67f58', '#ddd2be', 'city_br2');
      t.repeat.set(2, 2);
      return t;
    })(),
    roughness: 0.82,
  });
  const creamPlasterMat = createMaterial({ color: 0xe6dfd0, roughness: 0.78 });
  const timberMat = createMaterial({ map: tex.wood('#6b482e', '#452c1a', 'city_timb'), roughness: 0.72 });
  const roofSlateMat = createMaterial({ color: 0x3b444d, roughness: 0.68 });
  const roofClayMat = createMaterial({ color: 0x7c4636, roughness: 0.72 });
  const canopyWineMat = createMaterial({ color: 0x99362e, roughness: 0.65 });
  const canopyForestMat = createMaterial({ color: 0x265941, roughness: 0.65 });
  const warmShopGlass = createMaterial({
    color: 0xffdf99,
    emissive: 0xe8a846,
    emissiveIntensity: 0.72,
    roughness: 0.18,
  });
  const coolShopGlass = createMaterial({
    color: 0xaad4eb,
    emissive: 0x3a6f8c,
    emissiveIntensity: 0.42,
    roughness: 0.18,
  });
  const concMat = createMaterial({ map: tex.concrete('#90959a', 0.14, 'lm_c'), roughness: 0.85 });
  const darkMetal = createMaterial({ color: 0x363d45, metalness: 0.65, roughness: 0.35 });
  const glassBlue = createMaterial({
    color: 0x7cb8d4,
    transparent: true,
    opacity: 0.44,
    roughness: 0.1,
    metalness: 0.3,
  });
  const brassGoldMat = createMaterial({ color: 0xcfa959, metalness: 0.7, roughness: 0.3 });

  const hvacTransforms: InstanceTransform[] = [];

  function addCornerCafe(x: number, z: number, ry = 0) {
    const g = new T.Group();
    g.position.set(x, 0.12, z);
    g.rotation.y = ry;
    const mk = (geo: THREE.BufferGeometry, m: THREE.Material, lx: number, ly: number, lz: number, cast = true) => {
      const mesh = new T.Mesh(track(geo), m);
      mesh.position.set(lx, ly, lz);
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      g.add(mesh);
      return mesh;
    };
    mk(new T.BoxGeometry(7.2, 3.2, 6.2), creamPlasterMat, 0, 1.6, 0);
    mk(new T.BoxGeometry(6.8, 3.8, 5.8), brickTanMat, 0, 5.1, 0);
    mk(new T.BoxGeometry(7.4, 0.32, 6.4), roofSlateMat, 0, 7.15, 0, false);
    mk(new T.BoxGeometry(0.7, 1.1, 0.7), brickRedMat, -2.2, 7.75, -1.6, false);
    mk(new T.BoxGeometry(5.6, 1.85, 0.12), warmShopGlass, 0, 1.35, 3.12, false);
    mk(new T.BoxGeometry(2.0, 2.2, 0.16), darkMetal, -1.8, 1.1, 3.14, false);
    const awn = mk(new T.BoxGeometry(6.2, 0.18, 1.45), canopyWineMat, 0, 2.75, 3.65);
    awn.rotation.x = 0.28;
    for (const wx of [-2.0, 0, 2.0]) {
      mk(new T.BoxGeometry(1.1, 1.5, 0.12), coolShopGlass, wx, 5.0, 2.92, false);
      mk(new T.BoxGeometry(1.26, 0.16, 0.24), creamPlasterMat, wx, 4.2, 2.98, false);
    }
    for (const tx of [-1.4, 1.6]) {
      mk(new T.CylinderGeometry(0.55, 0.55, 0.06, 12), timberMat, tx, 0.78, 4.25, false);
      mk(new T.CylinderGeometry(0.05, 0.08, 0.76, 8), darkMetal, tx, 0.38, 4.25, false);
    }
    scene.add(g);
    colliders.push({ minX: x - 3.7, maxX: x + 3.7, minZ: z - 3.2, maxZ: z + 3.2, minY: 0, maxY: 7.5, active: true });
    hvacTransforms.push({ x: x + 1.4, y: 7.7, z: z - 1.2 });
  }

  function addBrickApartment(x: number, z: number, floors = 3, ry = 0) {
    const h = 3.2 + floors * 2.5;
    const g = new T.Group();
    g.position.set(x, 0.12, z);
    g.rotation.y = ry;
    const mk = (geo: THREE.BufferGeometry, m: THREE.Material, lx: number, ly: number, lz: number) => {
      const mesh = new T.Mesh(track(geo), m);
      mesh.position.set(lx, ly, lz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      g.add(mesh);
      return mesh;
    };
    mk(new T.BoxGeometry(8.2, 2.8, 6.6), concMat, 0, 1.4, 0);
    mk(new T.BoxGeometry(7.8, h - 2.8, 6.2), brickRedMat, 0, 2.8 + (h - 2.8) / 2, 0);
    mk(new T.BoxGeometry(8.4, 0.36, 6.8), roofSlateMat, 0, h + 0.18, 0);
    mk(new T.CylinderGeometry(0.85, 0.85, 1.5, 12), concMat, -2.0, h + 1.15, -1.2);
    for (let f = 0; f < floors; f++) {
      const fy = 3.3 + f * 2.5;
      for (const bx of [-2.1, 2.1]) {
        mk(new T.BoxGeometry(2.4, 0.14, 0.9), creamPlasterMat, bx, fy, 3.45);
        mk(new T.BoxGeometry(2.4, 0.65, 0.08), darkMetal, bx, fy + 0.4, 3.86);
        mk(new T.BoxGeometry(1.3, 1.6, 0.1), warmShopGlass, bx, fy + 0.95, 3.12);
      }
    }
    scene.add(g);
    colliders.push({ minX: x - 4.2, maxX: x + 4.2, minZ: z - 3.4, maxZ: z + 3.4, minY: 0, maxY: h + 0.5, active: true });
    hvacTransforms.push({ x: x + 1.8, y: h + 0.72, z: z + 0.8 });
  }

  function addIzakayaShop(x: number, z: number, ry = 0) {
    const g = new T.Group();
    g.position.set(x, 0.12, z);
    g.rotation.y = ry;
    const mk = (geo: THREE.BufferGeometry, m: THREE.Material, lx: number, ly: number, lz: number) => {
      const mesh = new T.Mesh(track(geo), m);
      mesh.position.set(lx, ly, lz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      g.add(mesh);
      return mesh;
    };
    mk(new T.BoxGeometry(6.8, 3.8, 5.6), timberMat, 0, 1.9, 0);
    const roof = mk(new T.ConeGeometry(5.2, 2.2, 4), roofClayMat, 0, 4.9, 0);
    roof.rotation.y = Math.PI / 4;
    const eave = mk(new T.BoxGeometry(7.3, 0.16, 1.35), roofClayMat, 0, 2.85, 3.25);
    eave.rotation.x = 0.24;
    mk(new T.BoxGeometry(4.4, 0.65, 0.06), canopyWineMat, 0, 2.15, 2.86);
    mk(new T.BoxGeometry(5.0, 1.65, 0.1), warmShopGlass, 0, 1.25, 2.82);
    const lanternMat = createMaterial({ color: 0xff6e3d, emissive: 0xe84018, emissiveIntensity: 1.1 });
    for (const lx of [-2.4, 0, 2.4]) {
      mk(new T.SphereGeometry(0.24, 10, 8), lanternMat, lx, 2.55, 3.55);
    }
    scene.add(g);
    colliders.push({ minX: x - 3.5, maxX: x + 3.5, minZ: z - 2.9, maxZ: z + 2.9, minY: 0, maxY: 5.5, active: true });
  }

  function addArtCinema(x: number, z: number, ry = 0) {
    const g = new T.Group();
    g.position.set(x, 0.12, z);
    g.rotation.y = ry;
    const mk = (geo: THREE.BufferGeometry, m: THREE.Material, lx: number, ly: number, lz: number) => {
      const mesh = new T.Mesh(track(geo), m);
      mesh.position.set(lx, ly, lz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      g.add(mesh);
      return mesh;
    };
    mk(new T.BoxGeometry(8.8, 7.2, 7.6), winMatB, 0, 3.6, 0);
    mk(new T.BoxGeometry(3.8, 9.6, 1.4), brickRedMat, 0, 4.8, 3.4);
    mk(new T.BoxGeometry(7.2, 0.9, 2.4), brassGoldMat, 0, 3.3, 4.4);
    mk(new T.BoxGeometry(6.8, 0.45, 2.1), warmShopGlass, 0, 3.3, 4.45);
    mk(new T.BoxGeometry(4.6, 2.4, 0.14), glassBlue, 0, 1.2, 4.12);
    scene.add(g);
    addDoubleSign(
      6.4,
      0.78,
      tex.sign('午夜胶片放映室', '#1e1918', '#f7dfa8', '今日加映 · 19:30 / 21:45', false, 6.4 / 0.78),
      x + Math.sin(ry) * 4.5,
      3.42,
      z + Math.cos(ry) * 4.5,
      ry,
      0x292422,
    );
    colliders.push({ minX: x - 4.5, maxX: x + 4.5, minZ: z - 3.9, maxZ: z + 4.1, minY: 0, maxY: 9.8, active: true });
  }

  function addSteppedTower(x: number, z: number, hMain: number) {
    addBox(8.6, hMain, 8.2, winMatA, x, hMain / 2 + 0.12, z, true, true, true);
    addBox(6.2, 4.8, 6.0, winMatB, x, hMain + 2.52, z, false, true, true);
    addBox(6.6, 0.28, 6.4, darkMetal, x, hMain + 5.05, z, false, false, true);
    addCylinder(0.06, 0.14, 3.8, 8, darkMetal, x, hMain + 7.1, z, false);
    addMesh(new T.SphereGeometry(0.16, 8, 8), sigRedMat, x, hMain + 9.0, z, false, false);
    hvacTransforms.push({ x: x + 1.8, y: hMain + 5.5, z: z - 1.4 });
  }

  function addBookshopCorner(x: number, z: number, ry = 0) {
    const g = new T.Group();
    g.position.set(x, 0.12, z);
    g.rotation.y = ry;
    const mk = (geo: THREE.BufferGeometry, m: THREE.Material, lx: number, ly: number, lz: number) => {
      const mesh = new T.Mesh(track(geo), m);
      mesh.position.set(lx, ly, lz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      g.add(mesh);
      return mesh;
    };
    mk(new T.BoxGeometry(7.2, 6.4, 6.2), creamPlasterMat, 0, 3.2, 0);
    mk(new T.BoxGeometry(7.5, 0.65, 6.5), canopyForestMat, 0, 3.3, 0);
    mk(new T.BoxGeometry(5.8, 2.1, 0.28), warmShopGlass, 0, 1.25, 3.16);
    const awn = mk(new T.BoxGeometry(6.4, 0.16, 1.3), canopyForestMat, 0, 2.7, 3.65);
    awn.rotation.x = 0.3;
    const roof = mk(new T.ConeGeometry(5.5, 2.3, 4), canopyForestMat, 0, 7.55, 0);
    roof.rotation.y = Math.PI / 4;
    scene.add(g);
    colliders.push({ minX: x - 3.7, maxX: x + 3.7, minZ: z - 3.2, maxZ: z + 3.2, minY: 0, maxY: 8.6, active: true });
  }

  function addPocketPark(x: number, z: number) {
    addCylinder(5.4, 5.6, 0.22, 24, concMat, x, 0.22, z, false, true);
    addCylinder(4.8, 4.8, 0.25, 24, createMaterial({ map: grassTex, roughness: 0.92 }), x, 0.24, z, false, true);
    addCylinder(1.8, 2.0, 0.44, 18, creamPlasterMat, x, 0.44, z, true, true);
    addCylinder(1.5, 1.5, 0.1, 18, createMaterial({ color: 0x56b2cf, roughness: 0.12 }), x, 0.64, z, false, false);
    addCylinder(0.28, 0.4, 1.15, 10, creamPlasterMat, x, 0.98, z, true);
    buildParkBench(ctx, x - 3.6, 0.12, z + 3.6, Math.PI / 4, true);
    buildParkBench(ctx, x + 3.6, 0.12, z - 3.6, -Math.PI * 0.75, true);
    colliders.push({ minX: x - 1.9, maxX: x + 1.9, minZ: z - 1.9, maxZ: z + 1.9, minY: 0, maxY: 1.5, active: true });
  }

  addCornerCafe(-18, -32, 0);
  addBrickApartment(-32, -32, 3, 0);
  addIzakayaShop(18, -32, 0);
  addSteppedTower(32, -32, 14.5);
  addBookshopCorner(-32, 32, Math.PI);
  addPocketPark(-18, 32);
  addArtCinema(24, 34, Math.PI);
  addCornerCafe(-32, -80, 0);
  addSteppedTower(-16, -80, 17.0);
  addBrickApartment(32, -80, 4, 0);
  addPocketPark(16, -80);
  addBookshopCorner(-66, -80, 0);
  addBrickApartment(-82, -80, 3, 0);
  addSteppedTower(80, -80, 15.5);
  addIzakayaShop(64, -80, 0);
  addCornerCafe(-66, -32, 0);
  addBrickApartment(-82, -32, 4, 0);
  addSteppedTower(82, -18, 13.5);
  addPocketPark(82, -33);
  addBrickApartment(-82, 18, 3, Math.PI / 2);
  addIzakayaShop(-82, 33, Math.PI / 2);
  addCornerCafe(82, 18, -Math.PI / 2);
  addBookshopCorner(82, 33, -Math.PI / 2);
  addSteppedTower(-32, 80, 16.0);
  addPocketPark(-16, 80);
  addBrickApartment(32, 80, 3, Math.PI);
  addIzakayaShop(16, 80, Math.PI);
  addSteppedTower(-82, 80, 14.0);
  addBookshopCorner(-66, 80, Math.PI);
  addArtCinema(80, 80, Math.PI);
  addCornerCafe(64, 80, Math.PI);

  for (const [tx, tz] of [
    [-116, -72],
    [-116, -24],
    [-116, 24],
    [-116, 72],
    [116, -72],
    [116, -24],
    [116, 24],
    [116, 72],
    [-72, 116],
    [-24, 116],
    [24, 116],
    [72, 116],
    [-72, -116],
    [72, -116],
  ]) {
    if ((Math.abs(tx) + Math.abs(tz)) % 48 === 0) {
      addSteppedTower(tx, tz, 13.5 + ((Math.abs(tx * 3 + tz) % 5) * 1.4));
    } else {
      addBrickApartment(tx, tz, 3, tx > 0 ? -Math.PI / 2 : tx < -100 ? Math.PI / 2 : 0);
    }
  }

  addInstancedMeshes(
    ctx,
    new T.BoxGeometry(1.6, 0.85, 1.4),
    createMaterial({ color: 0x9aa2a8, metalness: 0.4, roughness: 0.5 }),
    hvacTransforms,
    false,
    true,
  );

  buildSedanCar(ctx, -44.6, 0.03, -24, 0, 0x3b5978, true);
  buildSedanCar(ctx, 44.6, 0.03, 24, Math.PI, 0xb84c38, true);
  buildSedanCar(ctx, 26, 0.03, -4.0, Math.PI / 2, 0xd4c8b4, true);
  buildSedanCar(ctx, -26, 0.03, 4.0, -Math.PI / 2, 0x4b6e58, true);
  buildSedanCar(ctx, -44.6, 0.03, 72, 0, 0xc7923e, true);
  buildSedanCar(ctx, 44.6, 0.03, -72, Math.PI, 0x5c6978, true);

  const portalRings: ReturnType<typeof addMesh>[] = [];
  const portalPadTransforms: InstanceTransform[] = [];
  const totemPostTransforms: InstanceTransform[] = [];

  function registerLandmark(
    id: SceneId,
    title: string,
    sub: string,
    beaconColor: number,
    interactX: number,
    interactZ: number,
    signY = 3.4,
    signRy = 0,
  ) {
    portalPadTransforms.push({ x: interactX, y: 0.17, z: interactZ });
    const ring = addMesh(
      new T.TorusGeometry(1.0, 0.08, 10, 26),
      createMaterial({
        color: beaconColor,
        emissive: beaconColor,
        emissiveIntensity: 0.72,
        roughness: 0.2,
      }),
      interactX,
      1.38,
      interactZ,
      false,
      false,
    );
    portalRings.push(ring);
    const dx = Math.cos(signRy) * 1.38;
    const dz = -Math.sin(signRy) * 1.38;
    totemPostTransforms.push({ x: interactX - dx, y: (signY + 0.48) / 2, z: interactZ - dz, sy: signY + 0.48 });
    totemPostTransforms.push({ x: interactX + dx, y: (signY + 0.48) / 2, z: interactZ + dz, sy: signY + 0.48 });
    addDoubleSign(
      2.8,
      1.0,
      tex.sign(title, '#1c242d', '#f5e4b8', sub, false, 2.8),
      interactX,
      signY,
      interactZ,
      signRy,
      0x3b424a,
    );
    addInteract(
      'city_enter_' + id,
      V(interactX, 1.4, interactZ),
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
      { radius: 3.6, mesh: ring },
    );
  }

  addBox(6.8, 4.4, 6.8, concMat, -24, 2.3, -20, true);
  addBox(7.2, 0.28, 7.2, darkMetal, -24, 4.6, -20, false);
  const miniFan = addMesh(
    new T.TorusGeometry(0.65, 0.12, 8, 18),
    createMaterial({ color: 0xd4dade, metalness: 0.5 }),
    -25.5,
    5.4,
    -20,
  );
  addCylinder(0.05, 0.05, 1.8, 8, darkMetal, -22.2, 5.5, -21.5);
  addMesh(new T.ConeGeometry(0.18, 0.8, 8), createMaterial({ color: 0xd96236 }), -21.75, 6.3, -21.5).rotation.z =
    -Math.PI / 2;
  registerLandmark('platform', '高处平台', '天台观测塔 · 214m', 0xc8d8e6, -24, -13.2, 3.4, 0);

  addBox(6.6, 9.2, 6.6, winMatA, -24, 4.7, -68, true);
  addBox(6.9, 0.3, 6.9, darkMetal, -24, 9.4, -68, false);
  addBox(3.4, 0.16, 1.6, darkMetal, -24, 2.8, -64.2, false);
  addBox(3.0, 2.5, 0.14, glassBlue, -24, 1.4, -64.65, false);
  addCylinder(0.05, 0.12, 2.6, 8, darkMetal, -24, 10.7, -68, false);
  registerLandmark('office', '写字楼念词', '幕墙办公楼 · 讲台', 0x9ec9eb, -24, -60.5, 3.4, 0);

  addBox(7.4, 4.2, 7.0, createMaterial({ color: 0xefe7d6, roughness: 0.6 }), 24, 2.2, -20, true);
  addBox(7.8, 0.5, 2.2, createMaterial({ color: 0xc94832 }), 24, 3.6, -16.2, false);
  addCylinder(1.2, 1.2, 0.45, 16, createMaterial({ color: 0xd99b4e }), 24, 4.65, -20);
  addCylinder(1.25, 1.25, 0.22, 16, createMaterial({ color: 0x6b321e }), 24, 4.95, -20);
  addCylinder(1.22, 1.22, 0.3, 16, createMaterial({ color: 0xe6ad5c }), 24, 5.2, -20);
  registerLandmark('mall', '大商场汉堡店', '炙烤牛肉汉堡站', 0xf2b554, 24, -13.2, 3.4, 0);

  const hospMat = createMaterial({ color: 0xe8efed, roughness: 0.55 });
  addBox(7.4, 4.8, 6.6, hospMat, 24, 2.5, -68, true);
  addBox(3.2, 0.16, 1.5, darkMetal, 24, 2.85, -64.2, false);
  addBox(1.8, 2.6, 0.28, createMaterial({ color: 0x697d85, metalness: 0.45 }), 24, 1.4, -64.6, false);
  addBox(0.32, 1.2, 0.14, createMaterial({ color: 0xc93b32 }), 24, 3.8, -64.6, false);
  addBox(1.2, 0.32, 0.14, createMaterial({ color: 0xc93b32 }), 24, 3.8, -64.6, false);
  registerLandmark('hospital', '医院厚门走廊', '隔离屏蔽门区', 0x77c4d9, 24, -60.5, 3.3, 0);

  addBox(8.2, 2.8, 6.0, createMaterial({ color: 0xe3e9ee }), 72, 1.5, -68, true);
  addBox(3.6, 2.4, 3.6, glassBlue, 69, 3.9, -68, false);
  const jetBodyMat = createMaterial({ color: 0xf4f6f8, roughness: 0.35, metalness: 0.2 });
  const jetJet = addCylinder(0.42, 0.42, 4.4, 14, jetBodyMat, 72, 4.6, -63.5);
  jetJet.rotation.x = Math.PI / 2;
  addMesh(new T.ConeGeometry(0.42, 0.9, 14), jetBodyMat, 72, 4.6, -60.85).rotation.x = Math.PI / 2;
  addBox(5.2, 0.12, 1.3, createMaterial({ color: 0x245682 }), 72, 4.55, -63.5, false);
  addBox(0.12, 1.05, 0.85, createMaterial({ color: 0x245682 }), 72, 5.2, -65.3, false);
  registerLandmark('airport', '机场登机玻璃门', '03号登机口 · 客机', 0x99d1f0, 72, -60.5, 3.4, 0);

  addCylinder(3.8, 4.2, 1.4, 24, createMaterial({ color: 0xeaf6f8 }), 68, 0.8, -24, true);
  addMesh(new T.SphereGeometry(3.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), glassBlue, 68, 1.5, -24, false);
  const slideRing = addMesh(
    new T.TorusGeometry(2.1, 0.24, 8, 24),
    createMaterial({ color: 0xf0829d }),
    68,
    2.4,
    -24,
  );
  slideRing.rotation.x = 0.65;
  registerLandmark('waterpark', '商场水上乐园', '二层戏水圆筒', 0xf287a4, 60.2, -24, 3.4, Math.PI / 2);

  addBox(6.8, 3.8, 6.0, createMaterial({ color: 0xdbe8df }), -72, 2.0, -68, true);
  addMesh(new T.ConeGeometry(4.8, 1.8, 4), createMaterial({ color: 0x5c8c72 }), -72, 4.8, -68).rotation.y = Math.PI / 4;
  registerLandmark('infirmary', '小学医务室', 'F字形绿墙走廊', 0x96d4b2, -72, -60.5, 3.4, 0);

  addBox(7.2, 3.8, 5.4, createMaterial({ color: 0xebe3d3 }), -72, 2.0, -20, true);
  addBox(1.8, 0.9, 0.8, darkMetal, -68.8, 0.6, -16.8, true);
  addBox(1.5, 0.12, 0.6, createMaterial({ color: 0xd9481c, emissive: 0xb82e0c, emissiveIntensity: 0.9 }), -68.8, 1.08, -16.8, false);
  registerLandmark('school_bbq', '小学门外烧烤', '教室与炭火烤摊', 0xf0a66e, -72, -13.2, 3.4, 0);

  addBox(6.6, 3.6, 6.2, createMaterial({ color: 0xf2eee3 }), -24, 1.9, 20, true);
  addBox(6.8, 0.85, 6.4, createMaterial({ color: 0x1f5e48 }), -24, 3.75, 20, false);
  addBox(6.8, 0.2, 6.4, createMaterial({ color: 0xd97a38 }), -24, 3.25, 20, false);
  addBox(4.8, 0.12, 2.0, createMaterial({ map: tex.wood('#b88e5a', '#876338') }), -24, 0.18, 15.2, false);
  registerLandmark('convenience', '便利店与修路木道', '24H热关东煮', 0xe8c47a, -24, 13.2, 3.4, 0);

  addBox(6.4, 0.4, 7.2, createMaterial({ color: 0xb8bec2 }), 24, 0.3, 20, true);
  addBox(6.0, 2.4, 6.6, glassBlue, 24, 1.7, 20, true);
  addBox(6.4, 0.28, 7.0, createMaterial({ color: 0x1f3c5c }), 24, 3.0, 20, false);
  registerLandmark('subway', '多线地铁站', '1/4/7号线换乘站', 0x7ab4e0, 24, 13.2, 3.4, 0);

  addBox(6.2, 3.4, 6.2, createMaterial({ color: 0xebe4d5 }), 24, 1.8, 68, true);
  addMesh(new T.ConeGeometry(4.6, 2.2, 4), createMaterial({ color: 0x8f5b3a }), 24, 4.6, 68).rotation.y = Math.PI / 4;
  addBox(0.9, 1.4, 0.14, createMaterial({ color: 0xf2e5b8 }), 24, 1.6, 64.8, false);
  registerLandmark('studio', '小画室', '地铁旁画架工坊', 0x5d8ec7, 24, 60.5, 3.4, 0);

  addBox(6.8, 4.8, 6.8, createMaterial({ map: tex.concrete('#484c52', 0.2, 'lm_zig') }), -24, 2.5, 68, true);
  addBox(4.4, 0.45, 4.4, createMaterial({ color: 0x89949e, roughness: 0.45 }), -24, 5.05, 68, false);
  addBox(3.6, 0.2, 3.6, createMaterial({ color: 0xf2cf5b, emissive: 0xe6b53c, emissiveIntensity: 0.6 }), -24, 5.28, 68, false);
  for (let s = 0; s < 5; s++) {
    addBox(1.8, 0.35, 0.7, darkMetal, -21.4, 0.4 + s * 0.45, 69.8 - s * 0.75, false);
  }
  registerLandmark('zigzag', '之字形台阶花田', '光柱与一米花田', 0xf2e394, -24, 60.5, 3.4, 0);

  addBox(7.2, 0.24, 7.2, createMaterial({ map: tex.concrete('#5c6166', 0.16, 'lm_pk') }), -68, 0.2, 24, false);
  buildPottedPlant(ctx, -65.5, 0.2, 22.5, 1.6, 0x5c7d42);
  buildSedanCar(ctx, -67.5, 0.2, 26.5, Math.PI / 2, 0xc8ced1, true);
  registerLandmark('park_lot', '小区林荫停车场', '香樟树荫与单车', 0x8cc775, -60.2, 24, 3.4, Math.PI / 2);

  addBox(7.0, 2.4, 6.8, createMaterial({ color: 0x5a6066 }), -72, 1.3, 68, true);
  addBox(4.8, 1.8, 0.2, createMaterial({ color: 0x16191e }), -72, 1.0, 64.5, false);
  addBox(4.4, 0.16, 0.16, createMaterial({ map: tex.hazard('lm_gar_h') }), -72, 1.35, 63.2, false);
  registerLandmark('garage', '地下车库', 'B2 电梯与坡道', 0xc7b588, -72, 60.5, 3.4, 0);

  const rockLMMat = createMaterial({ map: tex.concrete('#5e574e', 0.22, 'lm_cv'), roughness: 0.92 });
  const caveInnerMat = createMaterial({ color: 0x11151a, roughness: 0.96 });
  addBox(6.8, 1.2, 6.8, rockLMMat, 68, 0.7, 24, false);
  addBox(2.2, 3.6, 6.2, rockLMMat, 65.7, 2.2, 21.6, false);
  addBox(2.2, 3.6, 6.2, rockLMMat, 65.7, 2.2, 26.4, false);
  addBox(5.6, 1.5, 6.8, rockLMMat, 68.4, 4.3, 24, false);
  addBox(2.4, 2.8, 3.4, caveInnerMat, 67.4, 1.8, 24, false);
  const crysMat = createMaterial({ color: 0x7bdcf0, emissive: 0x2f8fa3, emissiveIntensity: 0.85 });
  addMesh(new T.OctahedronGeometry(0.55, 0), crysMat, 64.8, 1.0, 22.4);
  addMesh(new T.OctahedronGeometry(0.38, 0), crysMat, 64.5, 0.75, 25.6);
  colliders.push({ minX: 64.8, maxX: 71.2, minZ: 20.8, maxZ: 27.2, minY: 0, maxY: 4.5, active: true });
  registerLandmark('cave', '幽深洞穴', '狭长石灰岩溶洞', 0xe6be9c, 60.2, 24, 3.4, Math.PI / 2);

  addBox(7.4, 1.1, 7.4, createMaterial({ map: tex.lava(), emissive: 0x6e1a07, emissiveIntensity: 0.45 }), 72, 0.6, 68, true);
  const obsidianMat = createMaterial({ color: 0x3b2c2a, roughness: 0.75 });
  addCylinder(0.45, 0.95, 4.4, 6, obsidianMat, 72, 2.7, 68, true);
  addCylinder(0.28, 0.65, 2.8, 6, obsidianMat, 70.2, 1.9, 69.5, false);
  addCylinder(0.26, 0.6, 2.5, 6, obsidianMat, 73.8, 1.8, 66.6, false);
  addMesh(new T.OctahedronGeometry(0.75, 0), createMaterial({ color: 0xff6b3d, emissive: 0xff4500, emissiveIntensity: 1.1 }), 72, 5.2, 68);
  registerLandmark('hellstone', '地狱石平台', '玄武岩与岩浆裂隙', 0xff6b3d, 72, 60.5, 3.4, 0);

  addBox(12.0, 5.2, 7.4, createMaterial({ color: 0xcfd6d3, roughness: 0.62 }), 0, 2.6, -116, true);
  addBox(3.0, 3.6, 0.2, glassBlue, 0, 1.9, -112.2, false);
  addBox(12.6, 0.42, 3.0, createMaterial({ color: 0xaab4b0 }), 0, 5.3, -111.2, false);
  addBox(4.8, 0.24, 1.8, createMaterial({ color: 0xbac2bf }), 0, 0.2, -111.4, false);
  buildPottedPlant(ctx, -4.4, 0.14, -110.8, 1.5, 0x868f8a);
  buildPottedPlant(ctx, 4.4, 0.14, -110.8, 1.5, 0x868f8a);
  registerLandmark('backyard', '博物馆清晨后院', '清晨微光绣球庭院', 0xf2f7f2, 0, -106.5, 3.6, 0);

  addInstancedMeshes(
    ctx,
    new T.CylinderGeometry(1.4, 1.5, 0.1, 20),
    createMaterial({ color: 0x262d36, roughness: 0.5 }),
    portalPadTransforms,
    false,
    true,
  );
  addInstancedMeshes(
    ctx,
    new T.BoxGeometry(0.08, 1.0, 0.08),
    postFrameMat,
    totemPostTransforms,
    false,
    false,
  );

  buildParkBench(ctx, -9.2, 0.12, 10.6, Math.PI / 4, true);
  buildParkBench(ctx, 9.2, 0.12, 10.6, -Math.PI / 4, true);

  updaters.push((dt, t) => {
    spireRing.rotation.y += dt * 0.6;
    clockCrown.rotation.y += dt * 1.1;
    clockCrown.position.y = 6.1 + Math.sin(t * 2.1) * 0.14;
    miniFan.rotation.z += dt * 3.5;
    for (let i = 0; i < portalRings.length; i++) {
      portalRings[i].rotation.y = t * 1.2 + i * 0.35;
    }
  });

  setBounds({ minX: -136, maxX: 136, minZ: -136, maxZ: 136 });
  setHeightFn(() => 0.02);
  setSurfaceFn((x, z) => {
    for (const av of avenues) {
      const half = av === 0 ? 5.6 : 4.8;
      if (Math.abs(x - av) < half || Math.abs(z - av) < half) {
        return 'concrete';
      }
    }
    return 'stone';
  });

  return {
    pos: V(0, 1.65, 19.5),
    yaw: 0,
    whisper: '欢迎来到微缩城市！按 [G] 召唤厢式卡车并切换 D/R 档穿梭街区，走进地标光环按 [E] 进入对应场景。',
  };
}

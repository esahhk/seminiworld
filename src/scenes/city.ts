import type { SceneContext } from './sceneContext';
import type { SceneId, SceneInitResult } from '../types/game';
import {
  addInstancedMeshes,
  buildCamphorTree,
  buildParkBench,
  buildPottedPlant,
  buildSedanCar,
} from '../engine/propKit';

export interface CityLandmarkAnchor {
  id: SceneId;
  x: number;
  z: number;
  yaw: number;
}

export const CITY_LANDMARKS: CityLandmarkAnchor[] = [
  { id: 'backyard', x: 0, z: -50, yaw: 0 },
  { id: 'platform', x: -18, z: -18, yaw: 0 },
  { id: 'office', x: -18, z: -50, yaw: 0 },
  { id: 'mall', x: 18, z: -18, yaw: 0 },
  { id: 'hospital', x: 18, z: -50, yaw: 0 },
  { id: 'airport', x: 50, z: -50, yaw: Math.PI },
  { id: 'waterpark', x: 50, z: -18, yaw: Math.PI / 2 },
  { id: 'infirmary', x: -50, z: -50, yaw: 0 },
  { id: 'school_bbq', x: -50, z: -18, yaw: 0 },
  { id: 'convenience', x: -18, z: 18, yaw: Math.PI },
  { id: 'subway', x: 18, z: 18, yaw: Math.PI },
  { id: 'studio', x: 18, z: 50, yaw: Math.PI },
  { id: 'zigzag', x: -18, z: 50, yaw: Math.PI },
  { id: 'park_lot', x: -50, z: 18, yaw: -Math.PI / 2 },
  { id: 'garage', x: -50, z: 50, yaw: Math.PI },
  { id: 'cave', x: 50, z: 18, yaw: Math.PI / 2 },
  { id: 'hellstone', x: 50, z: 50, yaw: Math.PI },
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
    addSign,
    createMaterial,
    addInteract,
    addTimedRedirect,
    colliders,
    roadCenters,
    updaters,
    sceneIdxById,
    loadScene,
    showWhisper,
    setBounds,
    setHeightFn,
    setSurfaceFn,
  } = ctx;

  scene.background = new T.Color(0xc9dce9);
  scene.fog = new T.Fog(0xc9dce9, 48, 155);
  scene.add(new T.HemisphereLight(0xf2f8ff, 0x62726a, 0.95));
  const sun = new T.DirectionalLight(0xfff4df, 1.35);
  sun.position.set(38, 52, 28);
  sun.castShadow = true;
  scene.add(sun);

  const grassTex = tex.grass('#5c8248', '#466a35');
  grassTex.repeat.set(22, 22);
  addBox(
    180,
    0.4,
    180,
    createMaterial({ map: grassTex, roughness: 0.95 }),
    0,
    -0.24,
    0,
    false,
    false,
    true,
  );

  const pavTex = tex.pavement('#c5c6c0', '#b4b6b0', 'city_pav');
  pavTex.repeat.set(36, 36);
  addBox(
    132,
    0.16,
    132,
    createMaterial({
      map: pavTex,
      bumpMap: tex.bumpNoise('city_pb', 24),
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
  roadNS.repeat.set(1, 14);
  const roadEW = tex.asphaltRoad('city_ew', true);
  roadEW.repeat.set(1, 14);
  const plainAsp = tex.concrete('#383c42', 0.15, 'city_inter');
  plainAsp.repeat.set(3, 3);
  const cwTex = tex.crosswalk('city_cw');

  const roadNSMat = createMaterial({ map: roadNS, roughness: 0.82 });
  const roadEWMat = createMaterial({ map: roadEW, roughness: 0.82 });
  const interMat = createMaterial({ map: plainAsp, roughness: 0.84 });
  const cwMat = createMaterial({ map: cwTex, roughness: 0.8 });

  for (const rx of [-36, 0, 36]) {
    const w = rx === 0 ? 9.4 : 8.4;
    addBox(w, 0.04, 128, roadNSMat, rx, 0.01, 0, false, false, true);
    for (let z = -54; z <= 54; z += 18) {
      roadCenters.push({ x: rx, z, yaw: 0 });
    }
  }
  for (const rz of [-36, 0, 36]) {
    const d = rz === 0 ? 9.4 : 8.4;
    const strip = addBox(d, 0.045, 128, roadEWMat, 0, 0.014, rz, false, false, true);
    strip.rotation.y = Math.PI / 2;
    for (let x = -54; x <= 54; x += 18) {
      if (Math.abs(x) > 8 || Math.abs(rz) > 8) {
        roadCenters.push({ x, z: rz, yaw: Math.PI / 2 });
      }
    }
  }
  for (const rx of [-36, 0, 36]) {
    for (const rz of [-36, 0, 36]) {
      const sz = rx === 0 || rz === 0 ? 9.8 : 8.8;
      addBox(sz, 0.05, sz, interMat, rx, 0.018, rz, false, false, true);
      if (rx !== 0 || rz !== 0) {
        for (const [cx, cz, ry] of [
          [rx, rz - sz * 0.58, 0],
          [rx, rz + sz * 0.58, 0],
          [rx - sz * 0.58, rz, Math.PI / 2],
          [rx + sz * 0.58, rz, Math.PI / 2],
        ]) {
          const cw = addBox(sz * 0.82, 0.02, 2.2, cwMat, cx, 0.025, cz, false, false, false);
          cw.rotation.y = ry;
        }
      }
    }
  }

  addCylinder(13.5, 13.5, 0.055, 42, interMat, 0, 0.02, 0, false, true);
  addCylinder(6.6, 6.8, 0.22, 32, createMaterial({ color: 0xc2c5bf, roughness: 0.78 }), 0, 0.11, 0, true, true);
  addCylinder(6.0, 6.0, 0.25, 32, createMaterial({ map: grassTex, roughness: 0.92 }), 0, 0.13, 0, false, true);
  addCylinder(2.1, 2.4, 0.48, 20, createMaterial({ color: 0x9aa0a6, roughness: 0.55 }), 0, 0.35, 0, true);
  addCylinder(0.75, 1.05, 4.4, 16, createMaterial({ color: 0xe2ddd2, roughness: 0.5 }), 0, 2.6, 0, true);
  const spireRing = addMesh(
    new T.TorusGeometry(1.1, 0.08, 8, 28),
    createMaterial({ color: 0xd9b35f, metalness: 0.75, roughness: 0.22 }),
    0,
    3.6,
    0,
  );
  const clockCrown = addMesh(
    new T.OctahedronGeometry(0.65, 0),
    createMaterial({ color: 0xffe4a8, emissive: 0xe6b55a, emissiveIntensity: 0.65, metalness: 0.4 }),
    0,
    5.45,
    0,
  );
  addBox(0.08, 0.08, 0.36, createMaterial({ color: 0x3b424a, metalness: 0.7 }), -0.9, 1.8, 1.06, false);
  addBox(0.08, 0.08, 0.36, createMaterial({ color: 0x3b424a, metalness: 0.7 }), 0.9, 1.8, 1.06, false);
  addSign(
    3.6,
    1.05,
    tex.sign('城市微缩枢纽 · 中心环岛', '#1d252e', '#f5dfb0', '按 [G] 召唤厢式卡车 · [E] 进场景'),
    0,
    1.8,
    1.25,
  );
  colliders.push({ minX: -5.8, maxX: 5.8, minZ: -5.8, maxZ: 5.8, minY: 0, maxY: 6, active: true });

  for (const bx of [-54, -18, 18, 54]) {
    for (const bz of [-54, -18, 18, 54]) {
      const curbMat = createMaterial({ color: 0x9aa0a4, roughness: 0.85 });
      addBox(24, 0.12, 24, curbMat, bx, 0.06, bz, false, false, true);
    }
  }

  const lampPostTransforms: { x: number; y: number; z: number; ry: number }[] = [];
  for (const ax of [-36, 0, 36]) {
    for (const z of [-44, -27, -14, 14, 27, 44]) {
      lampPostTransforms.push({ x: ax - 4.9, y: 0, z, ry: 0 });
      lampPostTransforms.push({ x: ax + 4.9, y: 0, z, ry: Math.PI });
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
    new T.CylinderGeometry(0.06, 0.09, 4.2, 8),
    poleMat,
    lampPostTransforms.map((p) => ({ x: p.x, y: 2.1, z: p.z })),
    false,
    false,
  );
  addInstancedMeshes(
    ctx,
    new T.BoxGeometry(0.95, 0.07, 0.08),
    poleMat,
    lampPostTransforms.map((p) => ({
      x: p.x + Math.cos(p.ry) * 0.45,
      y: 4.18,
      z: p.z,
      ry: p.ry,
    })),
    false,
    false,
  );
  addInstancedMeshes(
    ctx,
    new T.BoxGeometry(0.32, 0.06, 0.16),
    bulbMat,
    lampPostTransforms.map((p) => ({
      x: p.x + Math.cos(p.ry) * 0.85,
      y: 4.12,
      z: p.z,
      ry: p.ry,
    })),
    false,
    false,
  );

  const signalCorners: { x: number; z: number }[] = [];
  for (const sx of [-36, 36]) {
    for (const sz of [-36, 0, 36]) {
      signalCorners.push({ x: sx - 5.2, z: sz - 5.2 });
      signalCorners.push({ x: sx + 5.2, z: sz + 5.2 });
    }
  }
  const sigGreenMat = createMaterial({ color: 0x3bd96f, emissive: 0x26b554, emissiveIntensity: 1.0 });
  const sigRedMat = createMaterial({ color: 0xe8483c, emissive: 0xc92c22, emissiveIntensity: 0.9 });
  addInstancedMeshes(
    ctx,
    new T.CylinderGeometry(0.07, 0.1, 4.8, 8),
    poleMat,
    signalCorners.map((c) => ({ x: c.x, y: 2.4, z: c.z })),
    false,
    false,
  );
  addInstancedMeshes(
    ctx,
    new T.BoxGeometry(0.24, 0.68, 0.24),
    poleMat,
    signalCorners.map((c) => ({ x: c.x, y: 4.5, z: c.z })),
    false,
    false,
  );
  addInstancedMeshes(
    ctx,
    new T.SphereGeometry(0.07, 8, 6),
    sigGreenMat,
    signalCorners.map((c) => ({ x: c.x, y: 4.35, z: c.z })),
    false,
    false,
  );
  addInstancedMeshes(
    ctx,
    new T.SphereGeometry(0.07, 8, 6),
    sigRedMat,
    signalCorners.map((c) => ({ x: c.x, y: 4.65, z: c.z })),
    false,
    false,
  );

  const treeSpots: [number, number, number][] = [
    [-7.5, 0, -28],
    [7.5, 0, -28],
    [-7.5, 0, 28],
    [7.5, 0, 28],
    [-28, 0, -8],
    [28, 0, -8],
    [-28, 0, 8],
    [28, 0, 8],
    [-61, 0, -32],
    [-61, 0, 0],
    [-61, 0, 32],
    [61, 0, -32],
    [61, 0, 0],
    [61, 0, 32],
    [-28, 0, -61],
    [28, 0, -61],
    [-28, 0, 61],
    [28, 0, 61],
  ];
  for (const [tx, ty, tz] of treeSpots) {
    buildCamphorTree(ctx, tx, ty, tz, 0.82, true);
  }

  const buildingSpecs: {
    x: number;
    z: number;
    w: number;
    h: number;
    d: number;
    wallCol: string;
    litCol: string;
    roofCol: number;
    awning?: number;
  }[] = [
    { x: -25, z: -26, w: 6.8, h: 11.5, d: 6.8, wallCol: '#697582', litCol: '#ffe6aa', roofCol: 0x454d54 },
    { x: -11, z: -27, w: 6.0, h: 8.2, d: 6.4, wallCol: '#8b7968', litCol: '#ffdf9e', roofCol: 0x5c4f44, awning: 0xc24c38 },
    { x: 11, z: -27, w: 6.4, h: 9.8, d: 6.2, wallCol: '#607382', litCol: '#d9f2ff', roofCol: 0x404a52 },
    { x: 25, z: -26, w: 7.0, h: 13.5, d: 7.0, wallCol: '#7b848c', litCol: '#fff0c4', roofCol: 0x4e565e },
    { x: -26, z: -43, w: 7.2, h: 15.0, d: 6.8, wallCol: '#566978', litCol: '#e4f4ff', roofCol: 0x3b4854 },
    { x: 26, z: -43, w: 7.0, h: 12.2, d: 6.8, wallCol: '#d8d5cc', litCol: '#fff2c8', roofCol: 0x8c9296 },
    { x: -25, z: 26, w: 6.6, h: 7.5, d: 6.6, wallCol: '#9c785c', litCol: '#ffe3a8', roofCol: 0x614c3c, awning: 0x2f6e52 },
    { x: -11, z: 27, w: 6.0, h: 9.2, d: 6.2, wallCol: '#6e7b85', litCol: '#fff1cc', roofCol: 0x4a5259 },
    { x: 11, z: 27, w: 6.2, h: 10.4, d: 6.2, wallCol: '#7a828a', litCol: '#d9f0ff', roofCol: 0x4f565e },
    { x: 25, z: 26, w: 6.8, h: 8.8, d: 6.8, wallCol: '#8c7e6d', litCol: '#ffdfb0', roofCol: 0x5e5449, awning: 0xd98a38 },
    { x: -60, z: -25, w: 6.6, h: 8.0, d: 8.2, wallCol: '#d4cab8', litCol: '#ffe8b8', roofCol: 0x736c63 },
    { x: -60, z: 25, w: 6.6, h: 9.5, d: 8.2, wallCol: '#697c72', litCol: '#fff0c2', roofCol: 0x45544d },
    { x: 60, z: -25, w: 6.8, h: 11.0, d: 8.2, wallCol: '#5d7485', litCol: '#e0f4ff', roofCol: 0x3d4e5c },
    { x: 60, z: 25, w: 6.8, h: 7.2, d: 8.2, wallCol: '#5c524f', litCol: '#ffb878', roofCol: 0x3b3533 },
    { x: -26, z: 59, w: 8.0, h: 11.8, d: 6.8, wallCol: '#646e78', litCol: '#ffe5a8', roofCol: 0x454c54 },
    { x: 26, z: 59, w: 8.0, h: 10.2, d: 6.8, wallCol: '#85776b', litCol: '#fff0c4', roofCol: 0x574e46 },
    { x: -60, z: -60, w: 8.2, h: 10.0, d: 8.2, wallCol: '#748580', litCol: '#f2f7e8', roofCol: 0x4e5956 },
    { x: 60, z: -60, w: 8.2, h: 12.5, d: 8.2, wallCol: '#5c7285', litCol: '#d9f2ff', roofCol: 0x3f4e5c },
    { x: -60, z: 60, w: 8.2, h: 8.6, d: 8.2, wallCol: '#6a6f75', litCol: '#ffe8b0', roofCol: 0x45494e },
    { x: 60, z: 60, w: 8.2, h: 9.0, d: 8.2, wallCol: '#4a3d3b', litCol: '#ff9c5c', roofCol: 0x2e2625 },
  ];
  for (const b of buildingSpecs) {
    const fTex = tex.facadeWindows(b.wallCol, b.litCol, 'bldg_' + b.wallCol);
    fTex.repeat.set(Math.max(1, Math.round(b.w / 3.5)), Math.max(1, Math.round(b.h / 4)));
    addBox(
      b.w,
      b.h,
      b.d,
      createMaterial({ map: fTex, roughness: 0.72 }),
      b.x,
      b.h / 2 + 0.12,
      b.z,
      true,
      true,
      true,
    );
    addBox(
      b.w + 0.35,
      0.34,
      b.d + 0.35,
      createMaterial({ color: b.roofCol, roughness: 0.65 }),
      b.x,
      b.h + 0.25,
      b.z,
      false,
    );
    addBox(
      1.6,
      0.85,
      1.4,
      createMaterial({ color: 0x9aa2a8, metalness: 0.4, roughness: 0.5 }),
      b.x + 1.0,
      b.h + 0.8,
      b.z - 0.6,
      false,
    );
    if (b.awning !== undefined) {
      addBox(
        b.w * 0.78,
        0.22,
        1.1,
        createMaterial({ color: b.awning, roughness: 0.6 }),
        b.x,
        2.6,
        b.z + b.d / 2 + 0.5,
        false,
      ).rotation.x = 0.28;
    }
  }

  buildSedanCar(ctx, -33.2, 0.03, -24, 0, 0x3b5978, true);
  buildSedanCar(ctx, 33.2, 0.03, 24, Math.PI, 0xb84c38, true);
  buildSedanCar(ctx, 24, 0.03, -3.2, Math.PI / 2, 0xd4c8b4, true);
  buildSedanCar(ctx, -24, 0.03, 3.2, -Math.PI / 2, 0x4b6e58, true);

  const portalRings: ReturnType<typeof addMesh>[] = [];
  function registerLandmark(
    id: SceneId,
    title: string,
    sub: string,
    x: number,
    z: number,
    beaconColor: number,
    interactX = x,
    interactZ = z + 4.4,
    signY = 3.6,
  ) {
    const pad = addCylinder(
      1.35,
      1.45,
      0.1,
      20,
      createMaterial({ color: 0x262d36, roughness: 0.5 }),
      interactX,
      0.17,
      interactZ,
      false,
      true,
    );
    void pad;
    const ring = addMesh(
      new T.TorusGeometry(0.95, 0.075, 10, 26),
      createMaterial({
        color: beaconColor,
        emissive: beaconColor,
        emissiveIntensity: 0.72,
        roughness: 0.2,
      }),
      interactX,
      1.35,
      interactZ,
      false,
      false,
    );
    portalRings.push(ring);
    addSign(
      2.6,
      0.95,
      tex.sign(title, '#1c242d', '#f5e4b8', sub),
      interactX,
      signY,
      interactZ,
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
      { radius: 3.4, mesh: ring },
    );
  }

  const concMat = createMaterial({ map: tex.concrete('#90959a', 0.14, 'lm_c'), roughness: 0.85 });
  const darkMetal = createMaterial({ color: 0x363d45, metalness: 0.65, roughness: 0.35 });
  const glassBlue = createMaterial({ color: 0x7cb8d4, transparent: true, opacity: 0.42, roughness: 0.1, metalness: 0.3 });

  addBox(6.8, 4.4, 6.8, concMat, -18, 2.3, -18, true);
  addBox(7.2, 0.28, 7.2, darkMetal, -18, 4.6, -18, false);
  const miniFan = addMesh(
    new T.TorusGeometry(0.65, 0.12, 8, 18),
    createMaterial({ color: 0xd4dade, metalness: 0.5 }),
    -19.5,
    5.4,
    -18,
  );
  addCylinder(0.05, 0.05, 1.8, 8, darkMetal, -16.2, 5.5, -19.5);
  addMesh(new T.ConeGeometry(0.18, 0.8, 8), createMaterial({ color: 0xd96236 }), -15.75, 6.3, -19.5).rotation.z =
    -Math.PI / 2;
  registerLandmark('platform', '高处平台', '天台观测塔 · 214m', -18, -18, 0xc8d8e6, -18, -13.5, 3.3);

  addBox(6.6, 8.8, 6.6, createMaterial({ map: tex.facadeWindows('#4a6275', '#d6efff', 'lm_off') }), -18, 4.5, -50, true);
  addBox(6.9, 0.3, 6.9, darkMetal, -18, 9.0, -50, false);
  registerLandmark('office', '写字楼念词', '幕墙办公楼 · 讲台', -18, -50, 0x9ec9eb, -18, -45.5, 3.4);

  addBox(7.4, 4.2, 7.0, createMaterial({ color: 0xefe7d6, roughness: 0.6 }), 18, 2.2, -18, true);
  addBox(7.8, 0.5, 2.2, createMaterial({ color: 0xc94832 }), 18, 3.6, -14.2, false);
  addCylinder(1.2, 1.2, 0.45, 16, createMaterial({ color: 0xd99b4e }), 18, 4.65, -18);
  addCylinder(1.25, 1.25, 0.22, 16, createMaterial({ color: 0x6b321e }), 18, 4.95, -18);
  addCylinder(1.22, 1.22, 0.3, 16, createMaterial({ color: 0xe6ad5c }), 18, 5.2, -18);
  registerLandmark('mall', '大商场汉堡店', '炙烤牛肉汉堡站', 18, -18, 0xf2b554, 18, -13.3, 3.3);

  const hospMat = createMaterial({ color: 0xe8efed, roughness: 0.55 });
  addBox(7.4, 4.6, 6.6, hospMat, 18, 2.4, -50, true);
  addBox(1.8, 2.6, 0.28, createMaterial({ color: 0x697d85, metalness: 0.45 }), 18, 1.4, -46.6, false);
  addBox(0.32, 1.2, 0.14, createMaterial({ color: 0xc93b32 }), 18, 3.7, -46.6, false);
  addBox(1.2, 0.32, 0.14, createMaterial({ color: 0xc93b32 }), 18, 3.7, -46.6, false);
  registerLandmark('hospital', '医院厚门走廊', '隔离屏蔽门区', 18, -50, 0x77c4d9, 18, -45.4, 3.1);

  addBox(8.0, 2.8, 6.0, createMaterial({ color: 0xe3e9ee }), 50, 1.5, -50, true);
  addBox(3.6, 2.4, 3.6, glassBlue, 47, 3.9, -50, false);
  addCylinder(0.42, 0.42, 4.5, 14, createMaterial({ color: 0xf4f6f8 }), 50, 4.6, -45.5);
  addBox(5.2, 0.14, 1.4, createMaterial({ color: 0x245682 }), 50, 4.6, -45.5, false);
  registerLandmark('airport', '机场登机玻璃门', '03号登机口 · 客机', 50, -50, 0x99d1f0, 50, -44.2, 3.4);

  addCylinder(3.8, 4.2, 1.4, 24, createMaterial({ color: 0xeaf6f8 }), 50, 0.8, -18, true);
  addMesh(new T.SphereGeometry(3.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), glassBlue, 50, 1.5, -18, false);
  const slideRing = addMesh(
    new T.TorusGeometry(2.1, 0.24, 8, 24),
    createMaterial({ color: 0xf0829d }),
    50,
    2.4,
    -18,
  );
  slideRing.rotation.x = 0.65;
  registerLandmark('waterpark', '商场水上乐园', '二层戏水圆筒', 50, -18, 0xf287a4, 44.5, -18, 3.3);

  addBox(6.8, 3.8, 6.0, createMaterial({ color: 0xdbe8df }), -50, 2.0, -50, true);
  addMesh(new T.ConeGeometry(4.8, 1.8, 4), createMaterial({ color: 0x5c8c72 }), -50, 4.8, -50).rotation.y = Math.PI / 4;
  registerLandmark('infirmary', '小学医务室', 'F字形绿墙走廊', -50, -50, 0x96d4b2, -50, -45.5, 3.3);

  addBox(7.2, 3.8, 5.4, createMaterial({ color: 0xebe3d3 }), -50, 2.0, -18, true);
  addBox(1.8, 0.9, 0.8, darkMetal, -46.8, 0.6, -14.8, true);
  addBox(1.5, 0.12, 0.6, createMaterial({ color: 0xd9481c, emissive: 0xb82e0c, emissiveIntensity: 0.9 }), -46.8, 1.08, -14.8, false);
  registerLandmark('school_bbq', '小学门外烧烤', '教室与炭火烤摊', -50, -18, 0xf0a66e, -50, -13.5, 3.3);

  addBox(6.6, 3.6, 6.2, createMaterial({ color: 0xf2eee3 }), -18, 1.9, 18, true);
  addBox(6.8, 0.85, 6.4, createMaterial({ color: 0x1f5e48 }), -18, 3.75, 18, false);
  addBox(6.8, 0.2, 6.4, createMaterial({ color: 0xd97a38 }), -18, 3.25, 18, false);
  addBox(4.8, 0.12, 2.0, createMaterial({ map: tex.wood('#b88e5a', '#876338') }), -18, 0.18, 22.8, false);
  registerLandmark('convenience', '便利店与修路木道', '24H热关东煮', -18, 18, 0xe8c47a, -18, 22.5, 3.3);

  addBox(6.4, 0.4, 7.2, createMaterial({ color: 0xb8bec2 }), 18, 0.3, 18, true);
  addBox(6.0, 2.4, 6.6, glassBlue, 18, 1.7, 18, true);
  addBox(6.4, 0.28, 7.0, createMaterial({ color: 0x1f3c5c }), 18, 3.0, 18, false);
  registerLandmark('subway', '多线地铁站', '1/4/7号线换乘站', 18, 18, 0x7ab4e0, 18, 22.6, 3.3);

  addBox(6.2, 3.4, 6.2, createMaterial({ color: 0xebe4d5 }), 18, 1.8, 50, true);
  addMesh(new T.ConeGeometry(4.6, 2.2, 4), createMaterial({ color: 0x8f5b3a }), 18, 4.6, 50).rotation.y = Math.PI / 4;
  addBox(0.9, 1.4, 0.14, createMaterial({ color: 0xf2e5b8 }), 18, 1.6, 46.8, false);
  registerLandmark('studio', '小画室', '地铁旁画架工坊', 18, 50, 0x5d8ec7, 18, 45.6, 3.3);

  addBox(6.8, 4.8, 6.8, createMaterial({ map: tex.concrete('#484c52', 0.2, 'lm_zig') }), -18, 2.5, 50, true);
  addBox(4.4, 0.6, 4.4, createMaterial({ color: 0xf2cf5b }), -18, 5.1, 50, false);
  registerLandmark('zigzag', '之字形台阶花田', '光柱与一米花田', -18, 50, 0xf2e394, -18, 45.5, 3.3);

  addBox(7.2, 0.24, 7.2, createMaterial({ map: tex.concrete('#5c6166', 0.16, 'lm_pk') }), -50, 0.2, 18, false);
  buildCamphorTree(ctx, -52.2, 0.2, 16.5, 0.9, true);
  buildPottedPlant(ctx, -47.5, 0.2, 16.5, 1.6, 0x5c7d42);
  buildSedanCar(ctx, -49.5, 0.2, 20.5, Math.PI / 2, 0xc8ced1, true);
  registerLandmark('park_lot', '小区林荫停车场', '香樟树荫与单车', -50, 18, 0x8cc775, -45.2, 18, 3.3);

  addBox(7.0, 2.4, 6.8, createMaterial({ color: 0x5a6066 }), -50, 1.3, 50, true);
  addBox(4.8, 1.8, 0.2, createMaterial({ color: 0x16191e }), -50, 1.0, 46.5, false);
  addBox(4.4, 0.16, 0.16, createMaterial({ map: tex.hazard('lm_gar_h') }), -50, 1.35, 45.2, false);
  registerLandmark('garage', '地下车库', 'B2 电梯与坡道', -50, 50, 0xc7b588, -50, 44.8, 3.3);

  const rockLMMat = createMaterial({ map: tex.concrete('#54606b', 0.22, 'lm_cv') });
  addMesh(new T.DodecahedronGeometry(3.4, 1), rockLMMat, 50, 1.6, 18);
  addCylinder(1.2, 1.5, 2.6, 8, rockLMMat, 47.6, 1.4, 18);
  addMesh(new T.OctahedronGeometry(0.65, 0), createMaterial({ color: 0x7bdcf0, emissive: 0x2f8fa3, emissiveIntensity: 0.75 }), 46.8, 0.9, 16.5);
  colliders.push({ minX: 46.8, maxX: 53.2, minZ: 14.8, maxZ: 21.2, minY: 0, maxY: 4, active: true });
  registerLandmark('cave', '幽深洞穴', '狭长石灰岩溶洞', 50, 18, 0xe6be9c, 44.5, 18, 3.3);

  addBox(7.4, 1.1, 7.4, createMaterial({ map: tex.lava(), emissive: 0x6e1a07, emissiveIntensity: 0.45 }), 50, 0.6, 50, true);
  addBox(1.4, 4.2, 1.4, createMaterial({ color: 0x3b2c2a }), 50, 2.6, 50, true);
  addMesh(new T.OctahedronGeometry(0.75, 0), createMaterial({ color: 0xff6b3d, emissive: 0xff4500, emissiveIntensity: 1.1 }), 50, 5.2, 50);
  registerLandmark('hellstone', '地狱石平台', '玄武岩与岩浆裂隙', 50, 50, 0xff6b3d, 50, 45.2, 3.3);

  addBox(8.6, 4.8, 6.2, createMaterial({ color: 0xcfd6d3 }), 0, 2.5, -52, true);
  addBox(2.2, 3.2, 0.2, glassBlue, 0, 1.7, -48.8, false);
  addBox(9.0, 0.35, 2.6, createMaterial({ color: 0xadb5b2 }), 0, 4.9, -47.8, false);
  buildPottedPlant(ctx, -3.2, 0.14, -47.5, 1.4, 0x868f8a);
  buildPottedPlant(ctx, 3.2, 0.14, -47.5, 1.4, 0x868f8a);
  registerLandmark('backyard', '博物馆清晨后院', '清晨微光绣球庭院', 0, -52, 0xf2f7f2, 0, -46.2, 3.5);

  buildParkBench(ctx, -7.8, 0.12, 9.0, Math.PI / 4, true);
  buildParkBench(ctx, 7.8, 0.12, 9.0, -Math.PI / 4, true);

  updaters.push((dt, t) => {
    spireRing.rotation.y += dt * 0.6;
    clockCrown.rotation.y += dt * 1.1;
    clockCrown.position.y = 5.45 + Math.sin(t * 2.1) * 0.14;
    miniFan.rotation.z += dt * 3.5;
    for (let i = 0; i < portalRings.length; i++) {
      portalRings[i].rotation.y = t * 1.2 + i * 0.35;
    }
  });

  setBounds({ minX: -64, maxX: 64, minZ: -64, maxZ: 64 });
  setHeightFn(() => 0.02);
  setSurfaceFn((x, z) => {
    if (Math.abs(x) < 5 || Math.abs(x - 36) < 4.5 || Math.abs(x + 36) < 4.5) {
      return 'concrete';
    }
    if (Math.abs(z) < 5 || Math.abs(z - 36) < 4.5 || Math.abs(z + 36) < 4.5) {
      return 'concrete';
    }
    return 'stone';
  });

  return {
    pos: V(0, 1.65, 16.5),
    yaw: 0,
    whisper: '欢迎来到微缩城市！按 [G] 召唤厢式卡车代步，走进各地标光环按 [E] 传送进入对应场景。',
  };
}

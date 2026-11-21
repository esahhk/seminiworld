import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';
import { addInstancedMeshes, buildParkBench } from '../engine/propKit';
import type { InstanceTransform } from '../engine/propKit';

export function buildZigzagScene(ctx: SceneContext): SceneInitResult {
  const {
    T,
    scene,
    tex,
    sfx,
    V,
    track,
    addMesh,
    addBox,
    addCylinder,
    addSign,
    createMaterial,
    addInteract,
    addCollectible,
    updaters,
    showWhisper,
    setBounds,
    setHeightFn,
    setSurfaceFn,
  } = ctx;

  scene.background = new T.Color(0x1f242b);
  scene.fog = new T.Fog(0x1f242b, 18, 52);
  scene.add(new T.HemisphereLight(0x98a6b5, 0x353940, 0.58));
  scene.add(new T.AmbientLight(0x464d56, 0.45));

  const skySpot = new T.SpotLight(0xfff9eb, 2.8, 30, 0.46, 0.55);
  skySpot.position.set(0, 14.5, -5.2);
  skySpot.target.position.set(0, 4.2, -5.2);
  skySpot.castShadow = true;
  scene.add(skySpot);
  scene.add(skySpot.target);

  const stepLightLow = new T.PointLight(0xa3b3c2, 0.72, 18);
  stepLightLow.position.set(-4.0, 3.6, 3.0);
  scene.add(stepLightLow);
  const stepLightHigh = new T.PointLight(0xa3b3c2, 0.72, 18);
  stepLightHigh.position.set(4.0, 9.2, 5.5);
  scene.add(stepLightHigh);

  const bump = tex.bumpNoise('zig_b', 28);
  const wallMat = createMaterial({
    map: tex.concrete('#4a4d52', 0.24, 'zig_wall'),
    bumpMap: bump,
    bumpScale: 0.014,
    roughness: 0.94,
  });
  const stoneTex = tex.concrete('#6e6b65', 0.2, 'zig_s');
  const stepMat = createMaterial({
    map: stoneTex,
    bumpMap: bump,
    bumpScale: 0.01,
    roughness: 0.88,
  });
  const edgeMat = createMaterial({
    color: 0x89949e,
    emissive: 0x3b434d,
    emissiveIntensity: 0.55,
  });
  const railMat = createMaterial({
    color: 0x626a72,
    metalness: 0.62,
    roughness: 0.4,
  });
  const guardGlassMat = createMaterial({
    color: 0x8cb5c4,
    transparent: true,
    opacity: 0.3,
    roughness: 0.12,
  });

  addBox(
    14.8,
    0.2,
    19.6,
    createMaterial({ map: tex.concrete('#3a3d42', 0.22, 'zig_fl'), bumpMap: bump, bumpScale: 0.012 }),
    0,
    -0.1,
    1.5,
    true,
    false,
    true,
  );
  addBox(0.3, 14.2, 19.8, wallMat, -7.35, 7.0, 1.5, true);
  addBox(0.3, 14.2, 19.8, wallMat, 7.35, 7.0, 1.5, true);
  addBox(15.0, 14.2, 0.3, wallMat, 0, 7.0, -8.3, true);
  addBox(15.0, 14.2, 0.3, wallMat, 0, 7.0, 11.3, true);

  for (const pz of [-5.2, 0.5, 6.2]) {
    addBox(0.45, 13.8, 0.55, wallMat, -7.12, 6.9, pz, false);
    addBox(0.45, 13.8, 0.55, wallMat, 7.12, 6.9, pz, false);
  }

  addBox(15.0, 0.3, 14.5, wallMat, 0, 13.8, 4.05, false);
  addBox(15.0, 0.3, 1.2, wallMat, 0, 13.8, -7.8, false);
  addBox(3.4, 0.3, 4.2, wallMat, -5.8, 13.8, -5.2, false);
  addBox(3.4, 0.3, 4.2, wallMat, 5.8, 13.8, -5.2, false);
  addBox(8.2, 0.35, 0.24, wallMat, 0, 13.9, -3.2, false);
  addBox(8.2, 0.35, 0.24, wallMat, 0, 13.9, -7.2, false);
  for (const mx of [-2.0, 0, 2.0]) {
    addBox(0.1, 0.16, 4.0, railMat, mx, 13.82, -5.2, false);
  }
  addMesh(
    new T.CylinderGeometry(2.5, 4.1, 9.5, 18, 1, true),
    createMaterial({
      color: 0xf6eed8,
      emissive: 0xd9ceb0,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.11,
      depthWrite: false,
      side: T.DoubleSide,
    }),
    0,
    8.95,
    -5.2,
    false,
    false,
  );

  addBox(5, 0.4, 5, stepMat, -4.0, 0.1, 8.0, false, true, true);
  addBox(3.5, 0.35, 9.6, wallMat, -4.0, 1.95, 1.15, false, true, true).rotation.x = 0.42;

  for (let i = 0; i < 14; i++) {
    const sy = 0.15 + i * 0.29;
    const sz = 5.2 - i * 0.62;
    addBox(3.4, 0.48, 0.65, stepMat, -4.0, sy - 0.08, sz, false, false, true);
    addBox(3.42, 0.03, 0.05, edgeMat, -4.0, sy + 0.16, sz + 0.31, false, false, false);
  }

  addBox(12.4, 4.2, 4.4, stepMat, 0, 2.1, -5.2, false, true, true);
  addBox(12.4, 4.1, 0.3, wallMat, 0, 2.05, -3.05, true);
  addBox(4.6, 1.05, 0.1, guardGlassMat, 0, 4.72, -3.05, true);
  addBox(4.6, 0.06, 0.12, railMat, 0, 5.26, -3.05, false);
  for (const px of [-2.25, -0.75, 0.75, 2.25]) {
    addBox(0.08, 1.06, 0.08, railMat, px, 4.72, -3.05, false);
  }

  addBox(3.5, 0.45, 9.6, wallMat, 4.0, 6.0, 1.25, false, true, true).rotation.x = -0.42;
  for (let i = 0; i < 14; i++) {
    const sy = 4.2 + i * 0.29;
    const sz = -2.86 + i * 0.62;
    addBox(3.4, 0.48, 0.65, stepMat, 4.0, sy - 0.08, sz, false, false, true);
    addBox(3.42, 0.03, 0.05, edgeMat, 4.0, sy + 0.16, sz - 0.31, false, false, false);
  }

  addBox(0.08, 0.1, 9.6, railMat, -2.25, 2.95, 1.0, false).rotation.x = 0.43;
  addBox(0.08, 0.1, 9.6, railMat, -5.75, 2.95, 1.0, false).rotation.x = 0.43;
  addBox(0.08, 0.1, 9.6, railMat, 2.25, 7.0, 1.0, false).rotation.x = -0.43;
  addBox(0.08, 0.1, 9.6, railMat, 5.75, 7.0, 1.0, false).rotation.x = -0.43;

  const postItems: InstanceTransform[] = [];
  for (let i = 0; i < 14; i += 2) {
    const ly = 0.15 + i * 0.29;
    const lz = 5.2 - i * 0.62;
    postItems.push({ x: -2.25, y: ly + 0.62, z: lz });
    postItems.push({ x: -5.75, y: ly + 0.62, z: lz });
    const uy = 4.2 + i * 0.29;
    const uz = -2.86 + i * 0.62;
    postItems.push({ x: 2.25, y: uy + 0.62, z: uz });
    postItems.push({ x: 5.75, y: uy + 0.62, z: uz });
  }
  addInstancedMeshes(ctx, new T.CylinderGeometry(0.03, 0.03, 0.96, 6), railMat, postItems, false, false);

  addBox(0.1, 1.0, 8.6, createMaterial({ visible: false }), -2.25, 2.5, 1.0, true, false, false).rotation.x = 0.43;
  addBox(0.1, 1.0, 8.6, createMaterial({ visible: false }), 2.25, 6.5, 1.0, true, false, false).rotation.x = -0.43;

  addBox(6.6, 0.35, 1.1, createMaterial({ color: 0x8c5a44, roughness: 0.9 }), 0, 4.3, -6.1, true);
  addBox(6.3, 0.15, 0.9, createMaterial({ color: 0x423023, roughness: 1 }), 0, 4.48, -6.1, false);
  addSign(
    1.4,
    0.75,
    tex.sign('一米花田', '#e8dfcc', '#3a5c3a', '之字形台阶 · 请勿踩踏', true),
    0,
    4.85,
    -6.72,
  );

  const fColors = [0xf0cf5b, 0xe87b70, 0xf5f2e6, 0xd685b8];
  const stemItems: InstanceTransform[] = [];
  const petalItems: InstanceTransform[] = [];
  const flowerMeta: { x: number; z: number; phase: number }[] = [];
  for (let i = 0; i < 56; i++) {
    const fx = -2.95 + ((i * 1.37) % 5.9);
    const fz = -6.42 + ((i * 0.19) % 0.64);
    stemItems.push({ x: fx, y: 4.64, z: fz });
    petalItems.push({ x: fx, y: 4.8, z: fz, color: fColors[i % 4] });
    flowerMeta.push({ x: fx, z: fz, phase: i * 0.7 });
  }
  addInstancedMeshes(ctx, new T.CylinderGeometry(0.015, 0.015, 0.28, 5), createMaterial({ color: 0x4d7d3a }), stemItems, false, false);
  const petalInst = addInstancedMeshes(
    ctx,
    new T.DodecahedronGeometry(0.075, 0),
    createMaterial({ roughness: 0.7 }),
    petalItems,
    false,
    false,
  );

  addBox(6.6, 0.16, 1.1, createMaterial({ color: 0x49535c }), 0, 4.28, -4.4, true);
  const glassTankMat = createMaterial({ color: 0x8cc2d4, transparent: true, opacity: 0.28, roughness: 0.1 });
  addBox(6.6, 0.9, 0.06, glassTankMat, 0, 4.81, -3.88, true);
  addBox(6.6, 0.9, 0.06, glassTankMat, 0, 4.81, -4.92, true);
  addBox(0.06, 0.9, 1.1, glassTankMat, -3.27, 4.81, -4.4, true);
  addBox(0.06, 0.9, 1.1, glassTankMat, 3.27, 4.81, -4.4, true);
  for (const fx of [-3.27, 3.27]) {
    for (const fz of [-3.88, -4.92]) {
      addBox(0.06, 0.94, 0.06, railMat, fx, 4.81, fz, false);
    }
  }
  addCylinder(0.03, 0.03, 0.85, 8, railMat, -3.05, 4.78, -4.72, false);
  addBox(
    6.46,
    0.72,
    0.96,
    createMaterial({ color: 0x47b6cf, transparent: true, opacity: 0.42, roughness: 0.12 }),
    0,
    4.72,
    -4.4,
    false,
  );
  const tankTop = addMesh(
    new T.PlaneGeometry(6.46, 0.96),
    createMaterial({
      color: 0x72d8ed,
      map: tex.waterSurface(),
      transparent: true,
      opacity: 0.56,
      roughness: 0.08,
    }),
    0,
    5.09,
    -4.4,
    false,
    false,
  );
  tankTop.rotation.x = -Math.PI / 2;

  const fishList: { mesh: ReturnType<typeof addMesh>; phase: number; y: number }[] = [];
  const fishGeo = track(new T.SphereGeometry(0.055, 8, 6));
  const fishColors = [0xf28d4b, 0xf2c94c, 0xe86b6b, 0x8de0f2];
  for (let i = 0; i < 4; i++) {
    const fm = addMesh(fishGeo, createMaterial({ color: fishColors[i] }), 0, 4.65 + i * 0.07, -4.4, false, false);
    fm.scale.set(1.6, 0.8, 0.6);
    fishList.push({ mesh: fm, phase: i * 1.6, y: 4.62 + i * 0.07 });
  }

  addBox(5.5, 8.25, 5, stepMat, 4.0, 4.125, 7.8, false, true, true);
  buildParkBench(ctx, 4.6, 8.25, 9.1, Math.PI, true);
  addCylinder(0.14, 0.16, 0.3, 8, createMaterial({ color: 0x4c8a62 }), -4.2, 4.35, -5.6);

  let watered = false;
  let ripple = 0;
  const flowerDummy = new T.Object3D();
  updaters.push((dt, t) => {
    if (petalInst) {
      const sc = watered ? 1.24 : 0.92;
      for (let i = 0; i < flowerMeta.length; i++) {
        const fm = flowerMeta[i];
        flowerDummy.position.set(fm.x + Math.sin(t * 2 + fm.phase) * 0.015, 4.8, fm.z);
        flowerDummy.scale.setScalar(sc);
        flowerDummy.updateMatrix();
        petalInst.setMatrixAt(i, flowerDummy.matrix);
      }
      petalInst.instanceMatrix.needsUpdate = true;
    }
    for (const f of fishList) {
      f.mesh.position.x = Math.sin(t * 0.65 + f.phase) * 2.6;
      f.mesh.position.y = f.y + Math.sin(t * 1.8 + f.phase) * 0.04;
      f.mesh.position.z = -4.4 + Math.cos(t * 0.9 + f.phase) * 0.25;
    }
    ripple = Math.max(0, ripple - dt * 0.8);
    tankTop.position.y = 5.09 + Math.sin(t * (2.5 + ripple * 10)) * (0.008 + ripple * 0.028);
  });

  const zigHeight = (x: number, z: number, standingY = 0) => {
    if (x >= 1.25 && x <= 6.75 && z >= 5.3 && z <= 10.3 && standingY >= 7.5) {
      return 8.25;
    }
    if (x >= 2.3 && x <= 5.7 && z >= -3.185 && z < 5.3 && standingY >= 3.8) {
      const t = Math.min(1, Math.max(0, (z + 3.185) / 8.485));
      const h = 4.2 + t * 4.05;
      if (h <= standingY + 0.65) {
        return h;
      }
    }
    if (x >= -6.2 && x <= 6.2 && z >= -7.4 && z <= -3.0 && standingY >= 3.5) {
      return 4.2;
    }
    if (x >= -5.7 && x <= -2.3 && z >= -3.185 && z <= 5.525) {
      const t = Math.min(1, Math.max(0, (5.525 - z) / 8.71));
      const h = 0.3 + t * 3.9;
      if (h <= standingY + 0.65) {
        return h;
      }
    }
    if (x >= -6.5 && x <= -1.5 && z > 5.5 && z <= 10.5 && standingY < 1.5) {
      return 0.3;
    }
    return 0;
  };
  setHeightFn(zigHeight);

  addInteract('zig_flower', V(0, 4.7, -6.1), '给一米花田浇水', '天窗光柱正下方的花田', () => {
    watered = true;
    sfx.play('splash');
    showWhisper('水珠滚过花瓣，整条花田正好接住天窗斜照下来的一束光。');
  });
  addInteract(
    'zig_tank',
    V(0, 4.8, -4.4),
    '轻敲水族箱玻璃',
    '清水里几条小鱼正顺着光柱游过',
    () => {
      ripple = 1;
      sfx.play('splash');
      showWhisper('咚咚两声，天窗光穿进六米长的清水箱里，水面起了层细皱，鱼影游散开来。');
    },
  );
  addInteract(
    'zig_bench',
    V(4.6, 8.5, 9.1),
    '在顶层长椅歇脚',
    '俯瞰幽暗台阶和中央那道光柱',
    () => {
      sfx.play('wood');
      showWhisper('八米多高的顶层反倒背光，只有中层平台的花田和水箱亮得清清楚楚。');
    },
  );

  addCollectible('zigzag', -2.8, 4.72, -6.1, 0xf2e394);
  setBounds({ minX: -6.5, maxX: 6.7, minZ: -7.4, maxZ: 10.3 });
  setSurfaceFn((x, z, standingY = 0) =>
    zigHeight(x, z, standingY) > 0.1 ? 'stone' : 'concrete',
  );

  return {
    pos: V(-4.0, 1.95, 8.8),
    yaw: 0,
    whisper: '整座之字形石阶包在暗灰水泥墙里，只有正中天窗打下一道光柱照着花田和水箱。',
  };
}

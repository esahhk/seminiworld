import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';
import { addInstancedMeshes, buildAcCondenser, buildStreetLamp } from '../engine/propKit';
import type { InstanceTransform } from '../engine/propKit';

export function buildConvenienceScene(ctx: SceneContext): SceneInitResult {
  const {
    T,
    scene,
    player,
    state,
    tex,
    sfx,
    V,
    addMesh,
    addBox,
    addCylinder,
    addSign,
    addDoubleSign,
    syncColZ,
    createMaterial,
    addInteract,
    addCollectible,
    updaters,
    showWhisper,
    openModal,
    openBook,
    setBounds,
    setHeightFn,
    setSurfaceFn,
  } = ctx;

  scene.background = new T.Color(0x1b212b);
  scene.fog = new T.Fog(0x1b212b, 20, 66);
  scene.add(new T.HemisphereLight(0x6d7d96, 0x26292e, 0.88));
  const storeLight = new T.PointLight(0xfff1d6, 1.5, 16);
  storeLight.position.set(-8.0, 3.1, 0);
  scene.add(storeLight);
  const streetMainLight = new T.PointLight(0xffbe6e, 1.5, 28);
  streetMainLight.position.set(-1.25, 4.4, 0);
  scene.add(streetMainLight);

  const bump = tex.bumpNoise('cv_b', 22);
  const asp = tex.concrete('#43474c', 0.22, 'rw_asp');
  asp.repeat.set(4, 10);
  addBox(
    3.4,
    0.24,
    34,
    createMaterial({
      map: tex.concrete('#6b6f75', 0.16, 'cv_walk'),
      normalMap: tex.concreteNormal('cv_walk_n', 1.0),
      roughness: 0.84,
    }),
    -3.3,
    0.0,
    0,
    true,
    false,
    true,
  );
  addBox(
    12,
    0.3,
    34,
    createMaterial({
      map: asp,
      normalMap: tex.asphaltNormal('cv_asp_n', 1.25),
      roughness: 0.88,
    }),
    4.4,
    -0.15,
    0,
    true,
    false,
    true,
  );
  addBox(5.8, 0.26, 28, createMaterial({ color: 0x45372a, roughness: 1 }), 1.3, -0.35, 0, true, false, true);
  addCylinder(0.26, 0.26, 26, 10, createMaterial({ color: 0x467294 }), 1.3, -0.15, 0).rotation.x = Math.PI / 2;

  for (const lz of [-11.5, -3.8, 3.8, 11.5]) {
    buildStreetLamp(ctx, -2.1, 0.12, lz, 0, true);
  }

  const plankTex = tex.wood('#b88e5a', '#876338', 'rw_pl');
  for (const pz of [-11.0, -6.5, -2.0, 7.0, 11.5]) {
    addBox(2.5, 0.16, 4.3, createMaterial({ map: plankTex, roughness: 0.85 }), 0.0, 0.08, pz, false, true, true);
  }
  addBox(2.5, 0.16, 4.3, createMaterial({ map: plankTex, roughness: 0.85 }), 0.0, 0.08, 2.5, false, true, true);
  const sx = state.roadBridge ? 2.55 : 5.4;
  const sy = state.roadBridge ? 0.08 : 0.22;
  const sz = state.roadBridge ? 2.5 : -2.2;
  const sparePlank = addBox(
    2.45,
    0.16,
    4.3,
    createMaterial({ map: tex.wood('#c79d68', '#946d3f') }),
    sx,
    sy,
    sz,
    true,
    true,
    true,
  );
  const spareCol = sparePlank.userData.col;
  if (spareCol) {
    spareCol.minY = sy - 0.08;
    spareCol.maxY = sy + 0.5;
    spareCol.active = !state.roadBridge;
  }
  let pendingColEnable = false;
  const pAnim = {
    active: false,
    t: 0,
    from: V(0, 0, 0),
    to: V(0, 0, 0),
  };

  const coneItems: InstanceTransform[] = [];
  const coneBaseItems: InstanceTransform[] = [];
  for (const cz of [-13.2, -8.5, -4.0, 0.2, 4.8, 9.2, 13.4]) {
    coneItems.push({ x: 3.8, y: 0.38, z: cz });
    coneBaseItems.push({ x: 3.8, y: 0.03, z: cz });
  }
  addInstancedMeshes(ctx, new T.ConeGeometry(0.24, 0.72, 10), createMaterial({ color: 0xe36222 }), coneItems, true, false);
  addInstancedMeshes(ctx, new T.BoxGeometry(0.48, 0.06, 0.48), createMaterial({ color: 0x26292d }), coneBaseItems, false, true);

  const barrierOrange = createMaterial({ color: 0xd97828, roughness: 0.65 });
  const barrierStripe = createMaterial({ color: 0xebe8dc, roughness: 0.6 });
  for (const bz of [-10.8, -1.8, 7.2]) {
    addBox(0.32, 0.64, 2.2, barrierOrange, 4.35, 0.32, bz, true);
    addBox(0.34, 0.14, 2.22, barrierStripe, 4.35, 0.44, bz, false);
  }
  const warnLamp = new T.PointLight(0xff9b26, 1.25, 9);
  warnLamp.position.set(3.8, 1.2, 4.8);
  scene.add(warnLamp);
  const legWood = createMaterial({ color: 0x6b4e31, roughness: 0.8 });
  addBox(0.08, 1.35, 0.08, legWood, 2.42, 0.67, 9.2, false);
  addBox(0.08, 1.35, 0.08, legWood, 3.98, 0.67, 9.2, false);
  addDoubleSign(
    1.8,
    0.9,
    tex.sign('前方修路 走大木板', '#e0ad34', '#1e1d1a', '长段施工 慢行', true, 2),
    3.2,
    1.18,
    9.2,
    0,
    0x3b352c,
  );

  addBox(
    7.0,
    0.22,
    9.0,
    createMaterial({
      map: tex.tiles('#e6e2d8', '#dad5c9', '#b5b0a4', 5, 'cv_f'),
      bumpMap: bump,
      bumpScale: 0.004,
      roughness: 0.42,
    }),
    -8.0,
    0.04,
    0,
    false,
    false,
    true,
  );
  addBox(7.0, 3.6, 0.2, createMaterial({ color: 0xf0ece1 }), -8.0, 1.8, -4.5, true);
  addBox(7.0, 3.6, 0.2, createMaterial({ color: 0xf0ece1 }), -8.0, 1.8, 4.5, true);
  addBox(0.2, 3.6, 9.0, createMaterial({ color: 0xe8e3d7 }), -11.5, 1.8, 0, true);
  addBox(7.0, 0.2, 9.0, createMaterial({ color: 0xf4f2eb }), -8.0, 3.6, 0, false);
  const winGlassMat = createMaterial({ color: 0x9ac1d4, transparent: true, opacity: 0.34 });
  addBox(0.14, 3.6, 3.1, winGlassMat, -4.5, 1.8, -2.95, true);
  addBox(0.14, 3.6, 3.1, winGlassMat, -4.5, 1.8, 2.95, true);
  addBox(0.14, 0.8, 2.8, winGlassMat, -4.5, 3.2, 0, false);
  const doorGlassMat = createMaterial({ color: 0xaad1e3, transparent: true, opacity: 0.42 });
  const doorL = addBox(0.12, 2.8, 1.4, doorGlassMat, -4.5, 1.4, -0.7, true);
  const doorR = addBox(0.12, 2.8, 1.4, doorGlassMat, -4.5, 1.4, 0.7, true);

  addBox(0.18, 0.88, 7.36, createMaterial({ color: 0x1b4737, roughness: 0.45 }), -4.3, 3.16, 0, false);
  addSign(
    7.2,
    0.78,
    tex.sign('24H 街角便利店', '#f5f0e1', '#1f5e48', '热关东煮 · 冰饮 · 饭团', false, 7.2 / 0.78),
    -4.195,
    3.16,
    0,
    Math.PI / 2,
  );
  addBox(0.24, 0.2, 9.2, createMaterial({ color: 0x1f5e48 }), -4.42, 3.74, 0, false);
  addBox(0.24, 0.08, 9.2, createMaterial({ color: 0xd97a38 }), -4.42, 3.6, 0, false);
  const storePillarMat = createMaterial({ color: 0x1f5e48, roughness: 0.55 });
  addBox(0.22, 3.6, 0.24, storePillarMat, -4.42, 1.8, -4.5, false);
  addBox(0.22, 3.6, 0.24, storePillarMat, -4.42, 1.8, 4.5, false);
  buildAcCondenser(ctx, -4.35, 2.35, 4.05, Math.PI / 2);
  addBox(0.9, 0.04, 1.7, createMaterial({ color: 0x353b42, roughness: 0.95 }), -4.98, 0.16, 0, false);

  const ceilingStripMat = createMaterial({
    color: 0xfff8ea,
    emissive: 0xffe4b8,
    emissiveIntensity: 0.85,
  });
  for (const lz of [-2.1, 2.1]) {
    addBox(3.8, 0.06, 0.24, ceilingStripMat, -8.0, 3.48, lz, false);
  }

  const fridgeCaseMat = createMaterial({ color: 0xd8e8eb, roughness: 0.35 });
  const fridgeInnerMat = createMaterial({ color: 0xeaf4f7, roughness: 0.4 });
  const fridgeGlassMat = createMaterial({ color: 0xc2e6f2, transparent: true, opacity: 0.24, roughness: 0.08 });
  const fridgeShelfGlowMat = createMaterial({ color: 0xe6f8ff, emissive: 0xbfeaff, emissiveIntensity: 0.9 });
  const fridgeLight = new T.PointLight(0xd9f5ff, 0.95, 9);
  fridgeLight.position.set(-10.2, 2.0, 0);
  scene.add(fridgeLight);

  addBox(0.75, 2.4, 5.2, createMaterial({ visible: false }), -11.0, 1.2, 0, true);
  addBox(0.18, 2.4, 5.2, fridgeInnerMat, -11.28, 1.2, 0, false);
  addBox(0.72, 2.4, 0.14, fridgeCaseMat, -11.0, 1.2, -2.53, false);
  addBox(0.72, 2.4, 0.14, fridgeCaseMat, -11.0, 1.2, 2.53, false);
  addBox(0.72, 0.32, 5.2, fridgeCaseMat, -11.0, 2.26, 0, false);
  addBox(0.72, 0.24, 5.2, fridgeCaseMat, -11.0, 0.24, 0, false);
  addBox(0.08, 0.08, 4.9, fridgeShelfGlowMat, -10.75, 2.08, 0, false);
  for (const divZ of [-1.25, 0, 1.25]) {
    addBox(0.68, 1.85, 0.06, createMaterial({ color: 0x9aa9b2, metalness: 0.45 }), -10.98, 1.2, divZ, false);
  }

  const bottlePalette = [0x3b8c5e, 0xc94238, 0x3469a6, 0xe0a434];
  const bottleItems: InstanceTransform[] = [];
  for (const sy of [0.55, 0.96, 1.38, 1.78]) {
    addBox(0.5, 0.04, 4.92, fridgeCaseMat, -10.98, sy, 0, false);
    for (let bi = 0; bi < 16; bi++) {
      const bz = -2.25 + bi * 0.3;
      if (Math.abs(bz + 1.25) < 0.08 || Math.abs(bz) < 0.08 || Math.abs(bz - 1.25) < 0.08) {
        continue;
      }
      bottleItems.push({
        x: -10.85,
        y: sy + 0.14,
        z: bz,
        color: bottlePalette[(bi + Math.round(sy * 3)) % bottlePalette.length],
      });
    }
  }
  addInstancedMeshes(
    ctx,
    new T.CylinderGeometry(0.055, 0.058, 0.24, 8),
    createMaterial({ roughness: 0.28 }),
    bottleItems,
    false,
    false,
  );
  addBox(0.04, 1.82, 4.9, fridgeGlassMat, -10.64, 1.2, 0, false);
  for (const hz of [-1.42, -1.08, -0.17, 0.17, 1.08, 1.42]) {
    addBox(0.04, 0.36, 0.04, createMaterial({ color: 0xbac3c9, metalness: 0.72 }), -10.59, 1.25, hz, false);
  }

  addBox(0.9, 0.96, 3.0, createMaterial({ color: 0xc98447, roughness: 0.62 }), -6.5, 0.56, -2.6, true);
  addBox(0.98, 0.08, 3.08, createMaterial({ color: 0xebe6db, roughness: 0.35 }), -6.5, 1.04, -2.6, false);

  addBox(0.6, 0.24, 0.76, createMaterial({ color: 0xc2c7ca, metalness: 0.65, roughness: 0.3 }), -6.4, 1.16, -2.4, false);
  addBox(0.5, 0.02, 0.66, createMaterial({ color: 0xb87635, roughness: 0.2 }), -6.4, 1.25, -2.4, false);
  addBox(0.03, 0.08, 0.68, createMaterial({ color: 0xd9dee0, metalness: 0.7 }), -6.4, 1.26, -2.4, false);
  for (const oz of [-2.52, -2.28]) {
    addBox(0.52, 0.08, 0.03, createMaterial({ color: 0xd9dee0, metalness: 0.7 }), -6.4, 1.26, oz, false);
  }
  addCylinder(0.06, 0.06, 0.08, 10, createMaterial({ color: 0xf2ead7 }), -6.5, 1.27, -2.62, false);
  addCylinder(0.055, 0.055, 0.08, 10, createMaterial({ color: 0xf2ead7 }), -6.32, 1.27, -2.62, false);
  addBox(0.09, 0.08, 0.09, createMaterial({ color: 0x736b64 }), -6.48, 1.27, -2.38, false);
  const skewerMat = createMaterial({ color: 0xd6ba82, roughness: 0.7 });
  for (const [ox, oz] of [[-6.5, -2.62], [-6.32, -2.62], [-6.48, -2.38]]) {
    const sk = addCylinder(0.004, 0.004, 0.16, 5, skewerMat, ox, 1.33, oz, false);
    sk.rotation.z = 0.25;
  }
  addBox(0.62, 0.22, 0.78, createMaterial({ color: 0xddeef5, transparent: true, opacity: 0.3 }), -6.4, 1.38, -2.4, false);

  addCylinder(0.075, 0.055, 0.24, 10, createMaterial({ color: 0xece8de }), -6.6, 1.2, -3.1, false);
  addBox(0.32, 0.36, 0.42, createMaterial({ color: 0xe6eff2, transparent: true, opacity: 0.45 }), -6.5, 1.26, -3.55, false);
  addBox(0.34, 0.06, 0.44, createMaterial({ color: 0xc97b38 }), -6.5, 1.46, -3.55, false);
  for (const bz of [-3.46, -3.64]) {
    addMesh(new T.SphereGeometry(0.055, 8, 6), createMaterial({ color: 0xf5f2ea }), -6.5, 1.2, bz, false, false);
  }

  addBox(0.28, 0.08, 0.36, createMaterial({ color: 0x2d3238 }), -6.42, 1.12, -1.65, false);
  addBox(0.06, 0.24, 0.32, createMaterial({ color: 0x252a30 }), -6.42, 1.28, -1.65, false);
  addBox(0.07, 0.18, 0.26, createMaterial({ color: 0x5da9d9, emissive: 0x255778, emissiveIntensity: 0.6 }), -6.41, 1.29, -1.65, false);
  addBox(0.26, 0.38, 0.32, createMaterial({ color: 0x262b30, metalness: 0.55 }), -6.56, 1.26, -1.24, false);
  addCylinder(0.11, 0.09, 0.14, 10, createMaterial({ color: 0x3b4046 }), -6.56, 1.5, -1.24, false);

  const shelfColMat = createMaterial({ color: 0xdad4c8, roughness: 0.65 });
  addBox(3.4, 1.6, 0.6, createMaterial({ visible: false }), -8.2, 0.8, 1.6, true);
  addBox(3.36, 1.56, 0.08, shelfColMat, -8.2, 0.9, 1.6, false);
  addBox(3.36, 0.18, 0.58, createMaterial({ color: 0x454a4f }), -8.2, 0.2, 1.6, false);
  const snackPalette = [0xd9563f, 0xe3b13b, 0x4b9468, 0x4c79b8, 0xe8e2d3];
  const snackItems: InstanceTransform[] = [];
  for (const ty of [0.46, 0.82, 1.18, 1.54]) {
    addBox(3.4, 0.04, 0.62, shelfColMat, -8.2, ty, 1.6, false);
    addBox(3.42, 0.035, 0.63, createMaterial({ color: 0x1f5e48 }), -8.2, ty, 1.6, false);
    for (let si = 0; si < 9; si++) {
      const sxPos = -9.65 + si * 0.36;
      snackItems.push({ x: sxPos, y: ty + 0.14, z: 1.42, color: snackPalette[(si + Math.round(ty * 4)) % 5] });
      snackItems.push({ x: sxPos, y: ty + 0.14, z: 1.78, color: snackPalette[(si + 2) % 5] });
    }
  }
  addInstancedMeshes(
    ctx,
    new T.BoxGeometry(0.22, 0.24, 0.18),
    createMaterial({ roughness: 0.65 }),
    snackItems,
    false,
    false,
  );

  addBox(0.45, 0.08, 2.4, createMaterial({ map: tex.wood('#9c7248', '#704f2f') }), -4.95, 0.92, 2.6, false);
  addBox(0.45, 0.95, 2.4, createMaterial({ visible: false }), -4.95, 0.48, 2.6, true);
  for (const lz of [1.55, 3.65]) {
    addCylinder(0.03, 0.03, 0.82, 8, createMaterial({ color: 0x383d42, metalness: 0.6 }), -4.95, 0.5, lz, false);
  }
  for (const szPos of [2.05, 3.15]) {
    addCylinder(0.18, 0.18, 0.05, 12, createMaterial({ map: tex.wood('#8c653e', '#614326') }), -5.42, 0.68, szPos, false);
    addCylinder(0.03, 0.03, 0.56, 8, createMaterial({ color: 0x383d42, metalness: 0.6 }), -5.42, 0.4, szPos, false);
    addCylinder(0.16, 0.18, 0.03, 12, createMaterial({ color: 0x383d42, metalness: 0.6 }), -5.42, 0.16, szPos, false);
  }
  addBox(0.24, 0.04, 0.32, createMaterial({ color: 0xb89668 }), -4.95, 0.98, 2.4, false);
  addCylinder(0.045, 0.04, 0.1, 10, createMaterial({ color: 0xe6e1d6 }), -4.95, 1.01, 2.95, false);
  addBox(0.14, 0.1, 0.12, createMaterial({ color: 0xd9d4c7 }), -4.95, 1.01, 3.35, false);

  let doorOpen = false;
  let fridgeOn = true;
  updaters.push((dt, t) => {
    const near = player.pos.x < -1.2 && player.pos.x > -7.5 && Math.abs(player.pos.z) < 2.8;
    if (near && !doorOpen) {
      doorOpen = true;
      sfx.play('chime');
    }
    if (!near && doorOpen) {
      doorOpen = false;
    }
    const dz = doorOpen ? 1.95 : 0.7;
    doorL.position.z += (-dz - doorL.position.z) * Math.min(1, dt * 6);
    doorR.position.z += (dz - doorR.position.z) * Math.min(1, dt * 6);
    syncColZ(doorL, 0.7);
    syncColZ(doorR, 0.7);
    warnLamp.intensity = Math.sin(t * 5) > 0 ? 1.3 : 0.25;

    if (pAnim.active && spareCol) {
      spareCol.active = false;
      pAnim.t = Math.min(1, pAnim.t + dt / 0.4);
      const e = pAnim.t < 0.5 ? 2 * pAnim.t * pAnim.t : 1 - Math.pow(-2 * pAnim.t + 2, 2) / 2;
      sparePlank.position.lerpVectors(pAnim.from, pAnim.to, e);
      sparePlank.position.y += Math.sin(pAnim.t * Math.PI) * 0.55;
      if (pAnim.t >= 1) {
        pAnim.active = false;
        spareCol.minX = sparePlank.position.x - 1.225;
        spareCol.maxX = sparePlank.position.x + 1.225;
        spareCol.minZ = sparePlank.position.z - 2.15;
        spareCol.maxZ = sparePlank.position.z + 2.15;
        spareCol.minY = sparePlank.position.y - 0.08;
        spareCol.maxY = sparePlank.position.y + 0.5;
        if (!state.roadBridge) {
          pendingColEnable = true;
        } else {
          spareCol.active = false;
        }
        sfx.play('wood');
      }
    }
    if (pendingColEnable && spareCol) {
      if (
        Math.abs(player.pos.x - sparePlank.position.x) > 1.65 ||
        Math.abs(player.pos.z - sparePlank.position.z) > 2.55
      ) {
        spareCol.active = true;
        pendingColEnable = false;
      }
    }
  });

  const convHeight = (x: number, z: number) => {
    if (x < -4.5 && x > -11.5 && Math.abs(z) < 4.5) {
      return 0.15;
    }
    if (x <= -1.6 && x >= -4.8) {
      return 0.12;
    }
    if (x > -1.6 && x <= 4.2 && Math.abs(z) <= 13.8) {
      if (x <= 1.3) {
        return 0.16;
      }
      if (state.roadBridge && x > 1.3 && x <= 3.8 && z >= 0.35 && z <= 4.65) {
        return 0.16;
      }
      return -0.22;
    }
    return 0;
  };
  setHeightFn(convHeight);
  setSurfaceFn((x, z) => {
    if (x < -4.5 && x > -11.5 && Math.abs(z) < 4.5) {
      return 'stone';
    }
    if (x > -1.6 && x <= 4.2 && Math.abs(z) <= 13.8) {
      return convHeight(x, z) > 0 ? 'wood' : 'dirt';
    }
    return 'concrete';
  });

  addInteract(
    'cv_oden',
    V(-6.4, 1.2, -2.4),
    '掀开不锈钢关东煮锅盖',
    '挑一串白萝卜与魔芋丝',
    () => {
      sfx.play('sizzle');
      showWhisper('热腾腾的柴鱼汤雾气扑在脸上，白萝卜已经煮得透亮。');
    },
    { radius: 2.0 },
  );
  addInteract(
    'cv_book',
    V(-4.95, 1.05, 2.4),
    '翻看窗台边拴着的牛皮纸册',
    '《关东煮锅盖旁边的牛皮纸册》（夜归人四段故事）',
    () => openBook('convenience'),
  );
  addInteract('cv_fridge', V(-10.4, 1.4, 0), '拨动冷柜灯开关', '切换冷柜照明', () => {
    fridgeOn = !fridgeOn;
    fridgeLight.intensity = fridgeOn ? 0.95 : 0.08;
    fridgeShelfGlowMat.emissiveIntensity = fridgeOn ? 0.9 : 0.06;
    sfx.play('switch');
    showWhisper(
      fridgeOn ? '冰柜亮起一片冷白光，铝罐表面凝着细密水珠。' : '灯暗了，压缩机在墙脚嗡嗡低响。',
    );
  });

  const plankInter = addInteract(
    'rw_plank',
    V(sx, 0.4, sz),
    state.roadBridge ? '把备用大木板挪回马路边' : '把备用大木板铺到修路边上',
    '加宽店门前木板路面',
    () => {
      if (pAnim.active) {
        return;
      }
      pAnim.active = true;
      pAnim.t = 0;
      pAnim.from.copy(sparePlank.position);
      if (spareCol) {
        spareCol.active = false;
      }
      pendingColEnable = false;
      if (state.roadBridge) {
        state.roadBridge = false;
        pAnim.to.set(5.4, 0.22, -2.2);
        plankInter.pos.set(5.4, 0.4, -2.2);
        plankInter.label = '把备用大木板铺到修路边上';
        showWhisper('把多余的大木板抬回对面马路沿放好。');
      } else {
        state.roadBridge = true;
        pAnim.to.set(2.55, 0.08, 2.5);
        plankInter.pos.set(2.55, 0.4, 2.5);
        plankInter.label = '把备用大木板挪回马路边';
        showWhisper('啪一声把宽木板铺在便利店斜对面，整段木道更宽敞了。');
      }
    },
  );
  addInteract('rw_sign', V(3.2, 1.0, 9.2), '查看施工手写牌', '看一眼路边工程便条', () => {
    sfx.play('paper');
    openModal(
      '路口手写牌',
      '「整条街管线改造，路面掀开三十米，行人请走左边铺好的大木板路，旁边便利店照常营业。」',
    );
  });

  addCollectible('convenience', -6.8, 1.15, -3.2, 0xd4b277);
  setBounds({ minX: -10.8, maxX: 8.5, minZ: -15.2, maxZ: 15.2 });

  return {
    pos: V(0.0, 1.81, 13.0),
    yaw: 0,
    whisper: '长长一条大木板铺在正在重修的马路上，左边路灯底下就是24小时便利店。',
  };
}

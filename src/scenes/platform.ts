import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';
import { addInstancedMeshes, buildAcCondenser, buildParkBench } from '../engine/propKit';

export function buildPlatformScene(ctx: SceneContext): SceneInitResult {
  const {
    T,
    scene,
    camera,
    state,
    tex,
    sfx,
    V,
    track,
    mkMesh,
    addMesh,
    addBox,
    addCylinder,
    addDoubleSign,
    createMaterial,
    addInteract,
    addCollectible,
    colliders,
    updaters,
    showWhisper,
    openModal,
    setBounds,
    setSurfaceFn,
  } = ctx;

  scene.background = new T.Color(0xa6bac9);
  scene.fog = new T.FogExp2(0xa6bac9, 0.015);
  scene.add(new T.HemisphereLight(0xe4f0fa, 0x5c6872, 0.96));
  const sun = new T.DirectionalLight(0xfff4df, 1.2);
  sun.position.set(18, 28, 14);
  sun.castShadow = true;
  scene.add(sun);

  const deckTex = tex.concrete('#8f9396', 0.16, 'plat');
  deckTex.repeat.set(6, 6);
  addBox(
    16,
    1.2,
    16,
    createMaterial({
      map: deckTex,
      bumpMap: tex.bumpNoise('plat_b', 20),
      bumpScale: 0.015,
      roughness: 0.86,
    }),
    0,
    -0.6,
    0,
    true,
    false,
    true,
  );

  const parapetMat = createMaterial({ color: 0x6a7076, roughness: 0.78 });
  const copingMat = createMaterial({ color: 0x4c5259, metalness: 0.45, roughness: 0.45 });
  const steelMat = createMaterial({ color: 0x5e6770, metalness: 0.72, roughness: 0.28 });

  addBox(16.4, 0.24, 16.4, copingMat, 0, -0.1, 0, false);
  for (const [px, pz, w, d] of [
    [0, -7.85, 16.0, 0.34],
    [0, 7.85, 16.0, 0.34],
    [-7.85, 0, 0.34, 16.0],
    [7.85, 0, 0.34, 16.0],
  ]) {
    addBox(w, 0.48, d, parapetMat, px, 0.24, pz, true, true, true);
    addBox(w + 0.06, 0.07, d + 0.06, copingMat, px, 0.5, pz, false);
  }

  const railPosts: { x: number; y: number; z: number }[] = [];
  for (let i = -7.5; i <= 7.5; i += 2.5) {
    railPosts.push({ x: i, y: 0.84, z: -7.82 });
    railPosts.push({ x: i, y: 0.84, z: 7.82 });
    if (Math.abs(i) < 7.4) {
      railPosts.push({ x: -7.82, y: 0.84, z: i });
      railPosts.push({ x: 7.82, y: 0.84, z: i });
    }
  }
  addInstancedMeshes(ctx, new T.CylinderGeometry(0.032, 0.036, 0.68, 8), steelMat, railPosts, true, false);
  for (const ry of [0.82, 1.14]) {
    addBox(15.7, 0.045, 0.045, steelMat, 0, ry, -7.82, ry > 1);
    addBox(15.7, 0.045, 0.045, steelMat, 0, ry, 7.82, ry > 1);
    addBox(0.045, 0.045, 15.7, steelMat, -7.82, ry, 0, ry > 1);
    addBox(0.045, 0.045, 15.7, steelMat, 7.82, ry, 0, ry > 1);
  }

  const shedMat = createMaterial({
    map: tex.concrete('#6f7478', 0.2, 'p_shed'),
    bumpMap: tex.bumpNoise('pshed_b', 18),
    bumpScale: 0.012,
    roughness: 0.86,
  });
  addBox(2.5, 2.25, 2.9, shedMat, -5.8, 1.12, 5.6, true);
  addBox(2.8, 0.18, 3.2, copingMat, -5.8, 2.3, 5.6, false);
  addBox(1.12, 2.02, 0.1, steelMat, -5.8, 1.02, 4.13, false);
  addBox(0.96, 1.9, 0.06, createMaterial({ color: 0x425059, metalness: 0.5, roughness: 0.4 }), -5.8, 0.98, 4.11, false);
  addBox(0.04, 0.22, 0.08, createMaterial({ color: 0xd0d6db, metalness: 0.8 }), -5.42, 0.98, 4.06, false);
  addBox(0.38, 0.34, 0.08, createMaterial({ color: 0x3b444c, roughness: 0.7 }), -5.8, 1.5, 4.07, false);
  addBox(0.32, 0.14, 0.12, createMaterial({ color: 0xfff0cc, emissive: 0xffd280, emissiveIntensity: 0.85 }), -5.8, 2.12, 4.08, false);
  addCylinder(0.04, 0.04, 2.2, 8, createMaterial({ color: 0xa6382b, roughness: 0.4 }), -4.48, 1.1, 4.35);
  addMesh(new T.TorusGeometry(0.11, 0.022, 6, 12), createMaterial({ color: 0xc23e2e, metalness: 0.4 }), -4.48, 1.35, 4.28);

  buildAcCondenser(ctx, -3.5, 0, -6.95, 0);

  addBox(1.15, 0.92, 0.8, createMaterial({ color: 0x9fa3a1, roughness: 0.62 }), -5.5, 0.46, -3.35, true);
  addBox(0.95, 0.08, 0.52, copingMat, -5.5, 0.95, -3.35, false);
  const pipe = addCylinder(0.032, 0.032, 1.8, 8, copingMat, -6.15, 0.55, -3.35);
  pipe.rotation.z = Math.PI / 2;

  const shroudMat = createMaterial({
    map: tex.concrete('#c3c7cb', 0.1, 'fan_sh'),
    roughness: 0.52,
    metalness: 0.25,
    side: T.DoubleSide,
  });
  addMesh(new T.CylinderGeometry(0.46, 0.46, 0.74, 18, 1, true, Math.PI * 0.5, Math.PI), shroudMat, -5.5, 0.48, -3.02, true, true);
  addMesh(new T.CylinderGeometry(0.47, 0.47, 0.04, 18, 1, false, Math.PI * 0.5, Math.PI), shroudMat, -5.5, 0.86, -3.02, false, false);
  addMesh(new T.CylinderGeometry(0.47, 0.47, 0.04, 18, 1, false, Math.PI * 0.5, Math.PI), shroudMat, -5.5, 0.1, -3.02, false, false);
  addBox(0.05, 0.74, 0.12, shroudMat, -5.94, 0.48, -3.0, false);
  addBox(0.05, 0.74, 0.12, shroudMat, -5.06, 0.48, -3.0, false);

  const fanRotor = new T.Group();
  fanRotor.position.set(-5.5, 0.48, -3.02);
  fanRotor.add(mkMesh(new T.CylinderGeometry(0.042, 0.042, 0.68, 10), steelMat, 0, 0, 0, false, false));
  const bladeGeo = track(new T.BoxGeometry(0.12, 0.58, 0.016));
  const bladeMat = createMaterial({ color: 0x626b75, metalness: 0.65, roughness: 0.28 });
  for (let b = 0; b < 6; b++) {
    const ang = (b / 6) * Math.PI * 2;
    const bl = mkMesh(bladeGeo, bladeMat, Math.cos(ang) * 0.24, 0, Math.sin(ang) * 0.24, false, false);
    bl.rotation.y = -ang + 0.38;
    fanRotor.add(bl);
  }
  scene.add(fanRotor);

  buildParkBench(ctx, 3.2, 0, 4.2, 0, true);

  addCylinder(0.04, 0.04, 0.88, 8, steelMat, -3.76, 0.9, -7.74);
  addCylinder(0.04, 0.04, 0.88, 8, steelMat, -2.24, 0.9, -7.74);
  addDoubleSign(
    1.6,
    0.78,
    tex.sign('高空注意阵风', '#1d242b', '#f5dfb0', '天台观测平台 · 214m', true, 1.6 / 0.78),
    -3,
    1.38,
    -7.74,
    0,
    0x3b444c,
  );

  const cityWinTex = tex.facadeWindows('#5f6d7a', '#fff0c4', 'plat_sky');
  const cityMat = createMaterial({ map: cityWinTex, roughness: 0.76 });
  const roofCapMat = createMaterial({ color: 0x3b4249, roughness: 0.65 });
  const towerBeaconMat = createMaterial({ color: 0xe8483c, emissive: 0xc92c22, emissiveIntensity: 1.0 });
  const towerItems: { x: number; y: number; z: number; sx: number; sy: number; sz: number }[] = [];
  const tierItems: { x: number; y: number; z: number; sx: number; sy: number; sz: number }[] = [];
  const capItems: { x: number; y: number; z: number; sx: number; sy: number; sz: number }[] = [];
  const beaconItems: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i < 44; i++) {
    const ang = (i / 44) * Math.PI * 2 + (i % 3) * 0.14;
    const dist = 24 + (i % 5) * 15;
    const bx = Math.cos(ang) * dist;
    const bz = Math.sin(ang) * dist;
    const bh = 16 + ((i * 19) % 36);
    const bw = 6.2 + (i % 4) * 2.2;
    const bd = 6.2 + ((i + 2) % 4) * 2.1;
    const topY = -26 + bh;
    towerItems.push({ x: bx, y: -26 + bh / 2, z: bz, sx: bw, sy: bh, sz: bd });
    if (i % 2 === 0) {
      const th = 3.8 + (i % 3) * 1.8;
      tierItems.push({ x: bx, y: topY + th / 2, z: bz, sx: bw * 0.7, sy: th, sz: bd * 0.7 });
      capItems.push({ x: bx, y: topY + th + 0.2, z: bz, sx: bw * 0.74, sy: 0.35, sz: bd * 0.74 });
      if (bh > 32) {
        beaconItems.push({ x: bx, y: topY + th + 0.6, z: bz });
      }
    } else {
      capItems.push({ x: bx, y: topY + 0.2, z: bz, sx: bw * 1.04, sy: 0.38, sz: bd * 1.04 });
    }
  }
  addInstancedMeshes(ctx, new T.BoxGeometry(1, 1, 1), cityMat, towerItems, false, false);
  addInstancedMeshes(ctx, new T.BoxGeometry(1, 1, 1), cityMat, tierItems, false, false);
  addInstancedMeshes(ctx, new T.BoxGeometry(1, 1, 1), roofCapMat, capItems, false, false);
  addInstancedMeshes(ctx, new T.SphereGeometry(0.18, 6, 6), towerBeaconMat, beaconItems, false, false);

  addBox(0.75, 0.92, 0.54, copingMat, 5.5, 0.46, -5.5, true);
  addBox(0.36, 0.24, 0.04, createMaterial({ color: 0x26323a, emissive: 0x164236, emissiveIntensity: 0.7 }), 5.5, 0.65, -5.21, false);
  addCylinder(0.055, 0.08, 3.2, 8, steelMat, 5.5, 1.65, -5.5);
  const vane = addMesh(new T.ConeGeometry(0.18, 0.92, 10), createMaterial({ color: 0xd96336, roughness: 0.65 }), 5.95, 3.05, -5.5);
  const anemoHead = new T.Group();
  anemoHead.position.set(5.5, 3.3, -5.5);
  for (let c = 0; c < 3; c++) {
    const a = (c * Math.PI * 2) / 3;
    const arm = mkMesh(new T.BoxGeometry(0.34, 0.02, 0.02), steelMat, Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17, false, false);
    arm.rotation.y = -a;
    const cup = mkMesh(new T.SphereGeometry(0.055, 8, 6), steelMat, Math.cos(a) * 0.34, 0, Math.sin(a) * 0.34, false, false);
    anemoHead.add(arm, cup);
  }
  scene.add(anemoHead);

  let windFast = false;
  updaters.push((dt, t) => {
    vane.rotation.z = -Math.PI / 2 + Math.sin(t * (windFast ? 6.5 : 2.2)) * 0.22 + 0.4;
    anemoHead.rotation.y += dt * (windFast ? 14 : 4.5);
    fanRotor.rotation.y += dt * (windFast ? 11.5 : 4.2);
  });

  const brassMat = createMaterial({ color: 0xc29e52, metalness: 0.78, roughness: 0.25 });
  const darkMetal = createMaterial({ color: 0x282d33, metalness: 0.72, roughness: 0.28 });
  addBox(0.54, 0.14, 0.46, copingMat, 0, 0.07, -7.1, false);
  addCylinder(0.09, 0.12, 1.24, 12, steelMat, 0, 0.72, -7.1);
  addBox(0.28, 0.12, 0.2, darkMetal, 0, 1.36, -7.1, false);
  for (const bx of [-0.075, 0.075]) {
    const tube = addCylinder(0.048, 0.068, 0.56, 12, darkMetal, bx, 1.44, -7.15);
    tube.rotation.x = Math.PI / 2 - 0.1;
    const lensRing = addMesh(new T.TorusGeometry(0.068, 0.012, 6, 12), brassMat, bx, 1.46, -7.42, false, false);
    lensRing.rotation.x = -0.1;
  }
  colliders.push({ minX: -0.35, maxX: 0.35, minZ: -7.45, maxZ: -6.75, minY: 0, maxY: 1.5, active: true });

  addInteract('plat_scope', V(0, 1.3, -7.1), '用观景望远镜远眺', '切换远景焦距', () => {
    state.zoomActive = !state.zoomActive;
    camera.fov = state.zoomActive ? 30 : state.fov;
    camera.updateProjectionMatrix();
    sfx.play('switch');
    showWhisper(
      state.zoomActive
        ? '远处的楼群和云影被拉近，风声好像轻了些。'
        : '收回视线，脚下水泥地晒出了淡淡的灰白。',
    );
  });

  function toggleWind() {
    windFast = !windFast;
    sfx.play('chime');
    showWhisper(
      windFast
        ? '风向袋呼啦一下拉直，半圆壳里的风机叶片转得更密了。'
        : '风势落回平缓，风机叶片慢下来，能看清每片叶轮错着闪过去。',
    );
  }
  addInteract('plat_wind', V(5.5, 0.9, -5.5), '拨动风速风向仪', '切换风力挡位', toggleWind);
  addInteract('plat_fan', V(-5.5, 0.6, -3.0), '调整排风机转速挡位', '切换风机叶轮快慢', toggleWind);
  addInteract('plat_sign', V(-3, 1.2, -7.5), '看一眼手写木牌', '铁丝绑在护栏上', () => {
    sfx.play('paper');
    openModal(
      '手写木牌',
      '「高空注意阵风 · 214m\n楼道铁门反锁了别忘带钥匙，风大时别把纸杯放台边。」\n\n木牌背面拿铅笔写着几个看不清的电话号码。',
    );
  });
  addCollectible('platform', 5.2, 0.35, 5.2, 0xc5cdd4);
  setBounds({ minX: -7.2, maxX: 7.2, minZ: -7.2, maxZ: 7.2 });
  setSurfaceFn(() => 'concrete');
  return {
    pos: V(0, 1.65, 4.5),
    yaw: 0,
    whisper: '天台风很大，老式半圆壳空调风机在角落里咔哒咔哒地转着叶轮。',
  };
}

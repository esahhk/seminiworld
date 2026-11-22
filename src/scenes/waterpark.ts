import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';
import { addInstancedMeshes } from '../engine/propKit';
import type { InstanceTransform } from '../engine/propKit';

export function buildWaterparkScene(ctx: SceneContext): SceneInitResult {
  const {
    T,
    scene,
    player,
    tex,
    sfx,
    V,
    track,
    mkMesh,
    addMesh,
    addBox,
    addCylinder,
    addSign,
    addDoubleSign,
    createMaterial,
    addInteract,
    addCollectible,
    addTimedRedirect,
    colliders,
    updaters,
    showWhisper,
    setBounds,
    setHeightFn,
    setSurfaceFn,
  } = ctx;

  scene.background = new T.Color(0xc2e6ec);
  scene.fog = new T.Fog(0xc2e6ec, 24, 72);
  scene.add(new T.HemisphereLight(0xeefdff, 0x649ea8, 1.05));
  const poolLight = new T.PointLight(0x66e3f2, 1.1, 22);
  poolLight.position.set(0, 3.5, -4);
  scene.add(poolLight);
  const upperLight = new T.PointLight(0xfff4e0, 0.95, 24);
  upperLight.position.set(2, 9.4, 6);
  scene.add(upperLight);

  const bump = tex.bumpNoise('wp_b', 16);
  const tileMat = createMaterial({
    map: tex.tiles('#d8ecee', '#c6e2e6', '#9ac3c9', 6, 'wp_f'),
    bumpMap: bump,
    bumpScale: 0.004,
    roughness: 0.24,
  });
  addBox(26, 0.2, 24, tileMat, 0, -0.1, 0, true, false, true);
  addBox(26, 0.3, 24, createMaterial({ color: 0xebf4f5 }), 0, 11.5, 0, false);

  for (const ax of [-8, 0, 8]) {
    addBox(0.32, 0.45, 23.6, createMaterial({ color: 0xd0e6ea }), ax, 11.15, 0, false);
  }

  const rimMat = createMaterial({ color: 0xe6f2f4, roughness: 0.32 });
  addBox(12.2, 0.56, 0.3, rimMat, 0, 0.28, -9.85, false, true, true);
  addBox(12.2, 0.56, 0.3, rimMat, 0, 0.28, -1.15, false, true, true);
  addBox(0.3, 0.56, 8.9, rimMat, -6.05, 0.28, -5.5, false, true, true);
  addBox(0.3, 0.56, 8.9, rimMat, 6.05, 0.28, -5.5, false, true, true);
  addBox(12, 0.24, 8.6, createMaterial({ color: 0x3f8fa6 }), 0, 0.0, -5.5, false);

  const waterTex = tex.waterSurface();
  const waterMesh = addMesh(
    new T.PlaneGeometry(11.8, 8.4),
    createMaterial({
      color: 0x4ad5eb,
      map: waterTex,
      transparent: true,
      opacity: 0.72,
      roughness: 0.1,
      metalness: 0.18,
    }),
    0,
    0.46,
    -5.5,
    false,
    false,
  );
  waterMesh.rotation.x = -Math.PI / 2;

  const hoopStandMat = createMaterial({ color: 0xc8d8de, metalness: 0.65, roughness: 0.28 });
  addCylinder(0.055, 0.065, 1.02, 10, hoopStandMat, 0, 0.51, -5.5, false);
  addCylinder(0.24, 0.28, 0.12, 12, hoopStandMat, 0, 0.14, -5.5, false);
  addMesh(new T.TorusGeometry(0.65, 0.08, 10, 20), createMaterial({ color: 0xf0924b }), 0, 1.65, -5.5);

  for (const lx of [-5.2, 5.2]) {
    addBox(0.05, 0.85, 0.32, hoopStandMat, lx, 0.45, -1.25, false);
    addBox(0.05, 0.85, 0.32, hoopStandMat, lx, 0.45, -1.55, false);
  }

  const dolphin = new T.Group();
  dolphin.position.set(-2, 0.3, -5.5);
  const dolMat = createMaterial({ color: 0x577b96, roughness: 0.25, metalness: 0.15 });
  const dolBelly = createMaterial({ color: 0xd0e2eb, roughness: 0.3 });
  const dBody = mkMesh(new T.SphereGeometry(0.38, 16, 12), dolMat, 0, 0, 0);
  dBody.scale.set(0.82, 0.75, 2.05);
  const dSnout = mkMesh(new T.ConeGeometry(0.14, 0.46, 12), dolMat, 0, -0.04, 0.85);
  dSnout.rotation.x = Math.PI / 2;
  const dFin = mkMesh(new T.BoxGeometry(0.06, 0.36, 0.26), dolMat, 0, 0.28, -0.05);
  dFin.rotation.x = -0.35;
  const dPecL = mkMesh(new T.BoxGeometry(0.34, 0.04, 0.18), dolMat, -0.3, -0.1, 0.22);
  dPecL.rotation.set(0.15, 0.28, 0.35);
  const dPecR = mkMesh(new T.BoxGeometry(0.34, 0.04, 0.18), dolMat, 0.3, -0.1, 0.22);
  dPecR.rotation.set(0.15, -0.28, -0.35);
  const dTail = mkMesh(new T.BoxGeometry(0.68, 0.06, 0.28), dolMat, 0, 0.04, -0.92);
  dTail.rotation.x = 0.22;
  const dUnderside = mkMesh(new T.SphereGeometry(0.28, 12, 10), dolBelly, 0, -0.1, 0.05);
  dUnderside.scale.set(0.76, 0.55, 1.6);
  dolphin.add(dBody, dSnout, dFin, dPecL, dPecR, dTail, dUnderside);
  scene.add(dolphin);

  function addParasolAndChair(cx: number, yBase: number, cz: number, colHex: number) {
    addCylinder(0.16, 0.2, 0.06, 10, hoopStandMat, cx, yBase + 0.03, cz);
    addCylinder(0.04, 0.04, 2.25, 8, createMaterial({ color: 0xf7f5f0 }), cx, yBase + 1.15, cz);
    addCylinder(0.12, 1.05, 0.42, 12, createMaterial({ color: colHex, roughness: 0.55 }), cx, yBase + 2.38, cz);
    addBox(0.62, 0.12, 1.45, createMaterial({ color: 0xf7f5f0, roughness: 0.75 }), cx + 0.75, yBase + 0.28, cz, false);
    addBox(0.62, 0.1, 0.52, createMaterial({ color: colHex, roughness: 0.75 }), cx + 0.75, yBase + 0.44, cz - 0.55, false).rotation.x = 0.55;
  }

  for (const [cx, cz, col] of [
    [-4.5, 0.6, 0xf07f99],
    [4.5, 0.6, 0xf2c95c],
    [8.6, 0.4, 0x9b7be0],
  ]) {
    addParasolAndChair(cx, 0, cz, col);
  }

  addCylinder(0.03, 0.03, 1.85, 6, hoopStandMat, -6.55, 0.92, -5.8, false);
  addCylinder(0.03, 0.03, 1.85, 6, hoopStandMat, -6.55, 0.92, -5.0, false);
  addBox(0.55, 0.08, 0.9, createMaterial({ color: 0xffffff }), -6.55, 1.75, -5.4, false);
  addMesh(new T.TorusGeometry(0.28, 0.06, 8, 16), createMaterial({ color: 0xe34b3b }), -6.52, 1.15, -4.95, false, false).rotation.y = Math.PI / 2;

  addBox(
    2.2,
    0.3,
    2.2,
    createMaterial({ color: 0x4bb2c9, emissive: 0x1b6678, emissiveIntensity: 0.5 }),
    -7.5,
    0.15,
    -1.5,
    false,
  );
  const portalRing = addMesh(
    new T.TorusGeometry(1.1, 0.12, 10, 24),
    createMaterial({ color: 0x7ee8f5, emissive: 0x2da3b8, emissiveIntensity: 0.6 }),
    -7.5,
    1.5,
    -1.5,
  );

  addBox(4.0, 1.9, 4.0, createMaterial({ color: 0xe8dfe6 }), 7.5, 0.95, -2.5, true, true, true);
  addBox(
    2.2,
    0.25,
    2.2,
    createMaterial({ color: 0xf285a2, emissive: 0x78233c, emissiveIntensity: 0.5 }),
    7.5,
    2.0,
    -2.5,
    false,
  );
  addBox(1.8, 0.72, 0.52, createMaterial({ color: 0xf7b2c6, roughness: 0.45 }), 7.6, 2.26, -0.95, false);
  addCylinder(0.5, 0.5, 0.35, 12, createMaterial({ color: 0xf7b2c6 }), 8.7, 2.075, -1.4);

  const cylX = -8.0;
  const cylZ = 5.5;
  const meshTex = tex.mesh();
  meshTex.repeat.set(8, 5);
  const meshMat = createMaterial({
    map: meshTex,
    transparent: true,
    alphaTest: 0.12,
    side: T.DoubleSide,
    roughness: 0.4,
  });
  addMesh(
    new T.CylinderGeometry(2.05, 2.05, 6.4, 24, 1, true, Math.PI * 0.72, Math.PI * 1.56),
    meshMat,
    cylX,
    3.2,
    cylZ,
    false,
    false,
  );
  for (const pAng of [Math.PI * 0.28, Math.PI * 0.72]) {
    addCylinder(
      0.06,
      0.06,
      6.4,
      8,
      createMaterial({ color: 0xc2d8e0, metalness: 0.5 }),
      cylX + Math.sin(pAng) * 2.05,
      3.2,
      cylZ + Math.cos(pAng) * 2.05,
      false,
    );
  }
  const ringItems: InstanceTransform[] = [];
  for (let r = 0; r < 5; r++) {
    ringItems.push({ x: cylX, y: 1.1 + r * 1.25, z: cylZ, rx: Math.PI / 2 });
  }
  addInstancedMeshes(ctx, new T.TorusGeometry(2.08, 0.05, 8, 24), createMaterial({ color: 0xd9f2f7 }), ringItems, false, false);

  interface CylPlate {
    m: ReturnType<typeof addMesh>;
    phase: number;
    y: number;
  }
  const cylPlates: CylPlate[] = [];
  const plateGeo = track(new T.CylinderGeometry(1.62, 1.62, 0.16, 20));
  const plateCols = [0x6fd8e6, 0xf29cb4, 0xf2d16b, 0x9b8ee8, 0x7be0b4, 0xf2a76b];
  for (let i = 0; i < 6; i++) {
    const pm = addMesh(
      plateGeo,
      createMaterial({ color: plateCols[i], roughness: 0.28 }),
      cylX,
      i * 1.2,
      cylZ,
      true,
      true,
    );
    cylPlates.push({ m: pm, phase: i * 1.2, y: i * 1.2 });
  }
  let ridingPlate: CylPlate | null = null;

  addBox(17.4, 0.25, 9.2, tileMat, 2.8, 5.28, 6.2, false, true, true);
  addBox(5.6, 0.25, 3.1, tileMat, -8.7, 5.28, 9.25, false, true, true);
  addBox(0.9, 0.18, 2.8, tileMat, -6.3, 5.31, 5.5, false, true, true);
  const railGlassMat = createMaterial({ color: 0x90d0de, transparent: true, opacity: 0.35 });
  addBox(4.3, 1.0, 0.12, railGlassMat, -3.75, 5.9, 1.65, false);
  addBox(8.3, 1.0, 0.12, railGlassMat, 7.35, 5.9, 1.65, false);
  colliders.push({
    minX: -5.9,
    maxX: -1.6,
    minZ: 1.55,
    maxZ: 1.75,
    minY: 5.4,
    maxY: 6.5,
    active: true,
  });
  colliders.push({
    minX: 3.2,
    maxX: 11.5,
    minZ: 1.55,
    maxZ: 1.75,
    minY: 5.4,
    maxY: 6.5,
    active: true,
  });
  addSign(
    2.8,
    0.68,
    tex.sign('↓ 可由此直接跳回一层', '#f2a74b', '#1e1b18', '下方无遮挡水垫区', false, 2.8 / 0.68),
    0.8,
    5.43,
    1.9,
    0,
    -Math.PI / 2,
  );
  addBox(9.2, 0.2, 5.4, createMaterial({ color: 0x3b8ca3 }), 3.2, 5.25, 6.2, false);
  addBox(9.4, 0.52, 0.26, rimMat, 3.2, 5.56, 3.5, false, false, true);
  addBox(9.4, 0.52, 0.26, rimMat, 3.2, 5.56, 8.9, false, false, true);
  addBox(0.26, 0.52, 5.66, rimMat, -1.45, 5.56, 6.2, false, false, true);
  addBox(0.26, 0.52, 5.66, rimMat, 7.85, 5.56, 6.2, false, false, true);
  const upperWater = addMesh(
    new T.PlaneGeometry(9.0, 5.2),
    createMaterial({
      color: 0x4ad5eb,
      map: waterTex,
      transparent: true,
      opacity: 0.72,
      roughness: 0.1,
    }),
    3.2,
    5.74,
    6.2,
    false,
    false,
  );
  upperWater.rotation.x = -Math.PI / 2;
  addMesh(new T.TorusGeometry(0.55, 0.16, 10, 20), createMaterial({ color: 0xf27d9b }), 2.0, 5.76, 5.6, false, false).rotation.x = Math.PI / 2;
  addMesh(new T.TorusGeometry(0.5, 0.15, 10, 20), createMaterial({ color: 0xf2cf5c }), 4.6, 5.76, 6.8, false, false).rotation.x = Math.PI / 2;

  for (const [cx, cz, col] of [
    [-4.2, 8.8, 0xf287a4],
    [9.8, 8.5, 0x89dbad],
    [-2.5, 3.2, 0xb18ce8],
  ]) {
    addParasolAndChair(cx, 5.4, cz, col);
  }
  addCylinder(0.035, 0.035, 1.25, 8, rimMat, -4.55, 6.02, 1.72);
  addCylinder(0.035, 0.035, 1.25, 8, rimMat, -2.45, 6.02, 1.72);
  addDoubleSign(
    2.4,
    0.9,
    tex.sign('二层水上乐园', '#eefafd', '#216170', '直上圆筒可升至本层', false, 2.4 / 0.9),
    -3.5,
    6.6,
    1.72,
    0,
    0x2b5e6b,
  );

  let jumping = 0;
  updaters.push((dt, t) => {
    portalRing.rotation.y += dt * 1.5;
    waterMesh.position.y = 0.46 + Math.sin(t * 2.5) * 0.025;
    upperWater.position.y = 5.74 + Math.sin(t * 2.1 + 1.0) * 0.02;
    for (const p of cylPlates) {
      const raw = (p.phase + t * 1.05) % 7.2;
      p.y = raw - 0.3;
      p.m.position.y = p.y - 0.08;
      p.m.visible = p.y >= 0.0 && p.y <= 5.8;
    }
    if (jumping > 0) {
      jumping -= dt;
      const p = 1 - jumping / 1.4;
      dolphin.position.x = -2 + p * 4;
      dolphin.position.y = 0.25 + Math.sin(p * Math.PI) * 2.1;
      dolphin.rotation.x = -Math.cos(p * Math.PI) * 0.8;
    } else {
      dolphin.position.y = 0.25 + Math.sin(t * 2) * 0.08;
      dolphin.position.x = Math.sin(t * 0.6) * 1.5;
    }
  });

  const onCandy = (x: number, z: number) => x >= 5.5 && x <= 9.5 && z >= -4.5 && z <= -0.5;
  const inPool = (x: number, z: number) => Math.abs(x) <= 6.0 && z >= -9.8 && z <= -1.2;
  const onUpper = (x: number, z: number) =>
    (x >= -5.9 && x <= 11.5 && z >= 1.6 && z <= 10.8) ||
    (x >= -11.5 && x <= -5.9 && z >= 7.7 && z <= 10.8) ||
    (x >= -6.75 && x <= -5.85 && z >= 4.0 && z <= 7.0);
  const inUpperPool = (x: number, z: number) => x >= -1.4 && x <= 7.8 && z >= 3.5 && z <= 8.9;

  setHeightFn((x, z, standingY = 0) => {
    let best = 0;
    if (onUpper(x, z) && standingY >= 4.7) {
      ridingPlate = null;
      best = inUpperPool(x, z) ? 5.35 : 5.4;
    }
    if (Math.hypot(x - cylX, z - cylZ) <= 1.85) {
      if (
        ridingPlate &&
        ridingPlate.m.visible &&
        ridingPlate.y <= 5.65 &&
        Math.abs(ridingPlate.y - standingY) < 1.35
      ) {
        best = Math.max(best, ridingPlate.y);
      } else {
        ridingPlate = null;
        for (const p of cylPlates) {
          if (
            p.m.visible &&
            p.y <= 5.65 &&
            p.y >= standingY - 0.85 &&
            p.y <= standingY + 0.85 &&
            p.y > best
          ) {
            best = p.y;
            ridingPlate = p;
          }
        }
      }
    } else {
      ridingPlate = null;
    }
    if (best > 0) {
      return best;
    }
    if (onCandy(x, z) && standingY >= 1.3) {
      return 1.9;
    }
    if (inPool(x, z)) {
      return 0.12;
    }
    return 0;
  });
  setSurfaceFn((x, z, standingY = 0) => {
    if (onUpper(x, z) && standingY >= 4.7) {
      return inUpperPool(x, z) ? 'water' : 'stone';
    }
    if (onCandy(x, z)) {
      return 'stone';
    }
    return inPool(x, z) ? 'water' : 'stone';
  });

  addInteract('wp_tp', V(-7.5, 1.0, -1.5), '踏入水幕传送装置', '传送至糖果观演高台', () => {
    if (player.pos.y > 2.5) {
      return;
    }
    player.pos.set(7.5, 3.55, -2.5);
    player.vel.set(0, 0, 0);
    sfx.play('splash');
    showWhisper('凉丝丝的水汽掠过耳朵，人已经站上糖果高台！');
  });
  addInteract('wp_tp2', V(7.5, 2.5, -2.5), '从糖果高台传回地面', '返回表演池边', () => {
    if (player.pos.y < 2.5 || player.pos.y > 5.0) {
      return;
    }
    player.pos.set(-7.5, 1.65, 0.9);
    player.vel.set(0, 0, 0);
    sfx.play('splash');
    showWhisper('哗啦一下滑回池边地面，旁边网格圆筒里的升降板正一块块往上走。');
  });
  addInteract('wp_cyl', V(cylX + 2.1, 1.2, cylZ), '走进圆长筒升降台', '踏上移动升板前往二层', () => {
    const vis = cylPlates.filter((p) => p.m.visible && p.y >= 0.1 && p.y <= 5.1);
    const poolList = vis.length ? vis : cylPlates.filter((p) => p.m.visible);
    const lowP = poolList.length
      ? poolList.reduce((a, b) => (Math.abs(b.y - 0.8) < Math.abs(a.y - 0.8) ? b : a))
      : cylPlates[0];
    if (!lowP.m.visible || lowP.y < 0.05 || lowP.y > 5.4) {
      showWhisper('升板刚走过去，稍微等一秒下一块就上来了。');
      return;
    }
    ridingPlate = lowP;
    player.pos.set(cylX, lowP.y + 1.65, cylZ);
    player.vel.set(0, 0, 0);
    player.onGround = true;
    sfx.play('splash');
    showWhisper('站稳在升板上，网格外面的风景慢慢往下沉，马上到二楼。');
  });
  addInteract('wp_show', V(0, 0.8, -0.6), '敲响表演池边铃', '触发跃圈水花', () => {
    jumping = 1.4;
    sfx.play('bell');
    addTimedRedirect(() => sfx.play('splash'), 520);
    showWhisper('水面哗地炸开白花，灰蓝海豚稳稳穿过了橙色浮圈。');
  });
  addInteract('wp_upper_bell', V(-2.2, 6.0, 2.2), '摇响二楼戏水池摇铃', '前方缺口可直接跳回一层', () => {
    sfx.play('chime');
    showWhisper('站在二层糖果看台边往下望，中间那块没装栏杆的缺口可以直接跳回一层。');
  });

  addCollectible('waterpark', 9.6, 5.75, 5.5, 0xf28aa8);
  setBounds({ minX: -11.4, maxX: 11.4, minZ: -9.2, maxZ: 10.4 });

  return {
    pos: V(0, 1.65, 3.6),
    yaw: 0,
    whisper: '网格圆筒里头有自动往上升的圆板，走进缺口站上去就能升到二层水上乐园。',
  };
}

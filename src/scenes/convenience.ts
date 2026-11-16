import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';

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
  scene.add(new T.AmbientLight(0x526178, 0.78));
  const storeLight = new T.PointLight(0xfff1d6, 1.45, 16);
  storeLight.position.set(-8.0, 3.1, 0);
  scene.add(storeLight);

  const asp = tex.concrete('#43474c', 0.22, 'rw_asp');
  asp.repeat.set(4, 10);
  addBox(
    3.4,
    0.24,
    34,
    createMaterial({ map: tex.concrete('#6b6f75', 0.16, 'cv_walk') }),
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
    createMaterial({ map: asp, roughness: 0.88 }),
    4.4,
    -0.15,
    0,
    true,
    false,
    true,
  );
  addBox(
    5.8,
    0.26,
    28,
    createMaterial({ color: 0x45372a, roughness: 1 }),
    1.3,
    -0.35,
    0,
    true,
    false,
    true,
  );
  addCylinder(
    0.26,
    0.26,
    26,
    10,
    createMaterial({ color: 0x467294 }),
    1.3,
    -0.15,
    0,
  ).rotation.x = Math.PI / 2;

  const poleMat = createMaterial({ color: 0x383e45, metalness: 0.6 });
  const bulbMat = createMaterial({
    color: 0xfff0cc,
    emissive: 0xffb85c,
    emissiveIntensity: 1.5,
  });
  for (const lz of [-11.5, -3.8, 3.8, 11.5]) {
    addCylinder(0.08, 0.11, 4.8, 8, poleMat, -2.1, 2.4, lz, true);
    addBox(0.95, 0.08, 0.08, poleMat, -1.65, 4.75, lz, false);
    addBox(0.36, 0.1, 0.22, bulbMat, -1.25, 4.68, lz, false);
    const sl = new T.PointLight(0xffbe6e, 1.15, 15);
    sl.position.set(-1.25, 4.4, lz);
    scene.add(sl);
  }

  const plankTex = tex.wood('#b88e5a', '#876338', 'rw_pl');
  for (const pz of [-11.0, -6.5, -2.0, 7.0, 11.5]) {
    addBox(
      2.5,
      0.16,
      4.3,
      createMaterial({ map: plankTex, roughness: 0.85 }),
      0.0,
      0.08,
      pz,
      false,
      true,
      true,
    );
  }
  addBox(
    2.5,
    0.16,
    4.3,
    createMaterial({ map: plankTex, roughness: 0.85 }),
    0.0,
    0.08,
    2.5,
    false,
    true,
    true,
  );
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

  for (const cz of [-13.2, -8.5, -4.0, 0.2, 4.8, 9.2, 13.4]) {
    addMesh(
      new T.ConeGeometry(0.25, 0.75, 10),
      createMaterial({ color: 0xe36222 }),
      3.8,
      0.38,
      cz,
    );
  }
  const warnLamp = new T.PointLight(0xff9b26, 1.25, 9);
  warnLamp.position.set(3.8, 1.2, 4.8);
  scene.add(warnLamp);
  addSign(
    1.8,
    0.9,
    tex.sign('前方修路 走大木板', '#e0ad34', '#1e1d1a', '长段施工 慢行', true),
    3.2,
    1.15,
    9.2,
    0,
  );

  addBox(
    7.0,
    0.22,
    9.0,
    createMaterial({
      map: tex.tiles('#e6e2d8', '#dad5c9', '#b5b0a4', 5, 'cv_f'),
      roughness: 0.45,
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
  const winGlassMat = createMaterial({ color: 0x9ac1d4, transparent: true, opacity: 0.35 });
  addBox(0.14, 3.6, 3.1, winGlassMat, -4.5, 1.8, -2.95, true);
  addBox(0.14, 3.6, 3.1, winGlassMat, -4.5, 1.8, 2.95, true);
  addBox(0.14, 0.8, 2.8, winGlassMat, -4.5, 3.2, 0, false);
  const doorGlassMat = createMaterial({ color: 0xaad1e3, transparent: true, opacity: 0.42 });
  const doorL = addBox(0.12, 2.8, 1.4, doorGlassMat, -4.5, 1.4, -0.7, true);
  const doorR = addBox(0.12, 2.8, 1.4, doorGlassMat, -4.5, 1.4, 0.7, true);
  addSign(
    7.2,
    1.15,
    tex.sign('24H 街角便利店', '#f5f0e1', '#1f5e48', '热关东煮 · 冰饮 · 饭团'),
    -4.38,
    3.2,
    0,
    Math.PI / 2,
  );
  const fridgeLight = new T.PointLight(0xd9f5ff, 0.85, 8);
  fridgeLight.position.set(-10.5, 2.0, 0);
  scene.add(fridgeLight);
  addBox(
    0.75,
    2.4,
    5.2,
    createMaterial({ color: 0xd8e8eb, roughness: 0.3 }),
    -11.0,
    1.2,
    0,
    true,
  );
  addBox(
    0.9,
    1.0,
    3.0,
    createMaterial({ color: 0xd18a49, roughness: 0.6 }),
    -6.5,
    0.5,
    -2.6,
    true,
  );
  addBox(
    0.6,
    0.28,
    0.75,
    createMaterial({ color: 0xc9c3b8, metalness: 0.5 }),
    -6.4,
    1.14,
    -2.4,
    true,
  );
  addBox(0.34, 0.34, 0.45, createMaterial({ color: 0xe0ddd5 }), -6.6, 1.18, -3.3, false);
  addBox(3.4, 1.6, 0.6, createMaterial({ color: 0xded8cc }), -8.2, 0.8, 1.6, true);
  addBox(
    0.45,
    0.95,
    2.4,
    createMaterial({ map: tex.wood('#9c7248', '#704f2f') }),
    -4.95,
    0.48,
    2.6,
    true,
  );
  addBox(0.24, 0.06, 0.32, createMaterial({ color: 0xb89668 }), -4.95, 0.98, 2.4, false);

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
      const e =
        pAnim.t < 0.5 ? 2 * pAnim.t * pAnim.t : 1 - Math.pow(-2 * pAnim.t + 2, 2) / 2;
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
    fridgeLight.intensity = fridgeOn ? 0.85 : 0.08;
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

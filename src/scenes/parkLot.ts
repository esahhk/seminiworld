import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';

export function buildParkLotScene(ctx: SceneContext): SceneInitResult {
  const {
    T,
    scene,
    player,
    state,
    tex,
    sfx,
    V,
    track,
    mkMesh,
    addMesh,
    addBox,
    addCylinder,
    addSign,
    createMaterial,
    addInteract,
    addCollectible,
    colliders,
    updaters,
    sceneIdxById,
    loadScene,
    showWhisper,
    setBounds,
    setHeightFn,
    getHeight,
    setSurfaceFn,
    setSitTimer,
  } = ctx;

  scene.background = new T.Color(0xc5dec9);
  scene.fog = new T.Fog(0xc5dec9, 22, 68);
  scene.add(new T.HemisphereLight(0xf2faec, 0x49613f, 0.95));
  const sun = new T.DirectionalLight(0xfff4d4, 1.15);
  sun.position.set(16, 24, 10);
  sun.castShadow = true;
  scene.add(sun);

  addBox(
    34,
    0.2,
    34,
    createMaterial({
      map: tex.grass('#4c733a', '#37592a'),
    }),
    0,
    -0.1,
    0,
    true,
    false,
    true,
  );
  addBox(
    14,
    0.08,
    20,
    createMaterial({
      map: tex.concrete('#696e6b', 0.2, 'lot_asp'),
    }),
    0,
    0.02,
    0,
    false,
    false,
    true,
  );
  for (let z = -6; z <= 6; z += 3) {
    addBox(3.6, 0.03, 0.08, createMaterial({ color: 0xdde0d8 }), -5, 0.075, z, false);
    addBox(3.6, 0.03, 0.08, createMaterial({ color: 0xdde0d8 }), 5, 0.075, z, false);
  }

  const canopies: { m: ReturnType<typeof addMesh>; p: number }[] = [];
  (
    [
      [-9, -8],
      [-10, 0],
      [-9, 8],
      [9, -7],
      [10, 2],
      [8, 9],
      [-5, -11],
      [5, -11],
      [-12, -4],
      [12, -3],
      [-12, 5],
      [12, 6],
    ] as [number, number][]
  ).forEach(([tx, tz], i) => {
    addCylinder(
      0.28,
      0.4,
      4.4,
      8,
      createMaterial({ map: tex.wood('#634b35', '#473524') }),
      tx,
      2.2,
      tz,
      true,
    );
    canopies.push({
      m: addMesh(
        new T.DodecahedronGeometry(2.7 + (i % 2) * 0.45, 1),
        createMaterial({ color: i % 2 ? 0x467a3e : 0x558c47, roughness: 0.9 }),
        tx,
        4.8,
        tz,
        true,
      ),
      p: i,
    });
  });

  const stemGeo = track(new T.CylinderGeometry(0.03, 0.04, 1.4, 5));
  const bigHeadGeo = track(new T.DodecahedronGeometry(0.28, 0));
  const bushGeo = track(new T.DodecahedronGeometry(0.8, 1));
  const stemMat = createMaterial({ color: 0x3f6e33, roughness: 0.9 });
  const bushMats = [
    createMaterial({ color: 0x3b6931, roughness: 0.95 }),
    createMaterial({ color: 0x4d803e, roughness: 0.95 }),
    createMaterial({ color: 0x5c8e47, roughness: 0.95 }),
  ];
  const bloomMats = [
    createMaterial({ color: 0xf0ca4d, roughness: 0.65 }),
    createMaterial({ color: 0xe66f7a, roughness: 0.65 }),
    createMaterial({ color: 0xf4f0de, roughness: 0.65 }),
    createMaterial({ color: 0xc27ed9, roughness: 0.65 }),
    createMaterial({ color: 0xf08c4f, roughness: 0.65 }),
  ];
  for (let i = 0; i < 74; i++) {
    const side = i % 3;
    let fx: number;
    let fz: number;
    if (side === 0) {
      fx = -7.6 - Math.random() * 6.5;
      fz = -11 + Math.random() * 22;
    } else if (side === 1) {
      fx = 7.6 + Math.random() * 6.5;
      fz = -11 + Math.random() * 22;
    } else {
      fx = (Math.random() > 0.5 ? 1 : -1) * (3.2 + Math.random() * 9.5);
      fz = -10.6 - Math.random() * 3.8;
    }
    if (i % 2 === 0) {
      addMesh(bushGeo, bushMats[i % 3], fx, 0.45, fz, false, true);
    }
    const hScale = 0.85 + Math.random() * 1.2;
    const st = addMesh(stemGeo, stemMat, fx, 0.7 * hScale, fz, false, false);
    st.scale.set(1, hScale, 1);
    const hd = addMesh(bigHeadGeo, bloomMats[i % 5], fx, 1.42 * hScale, fz, false, false);
    const bs = 0.9 + Math.random() * 0.7;
    hd.scale.set(bs, bs * 0.75, bs);
  }

  const tireGeo = track(new T.TorusGeometry(0.28, 0.04, 8, 16));
  const barGeo = track(new T.CylinderGeometry(0.022, 0.022, 0.68, 6));
  const tireMat = createMaterial({ color: 0x22252a, roughness: 0.85 });

  interface BikeOpts {
    bagSeat?: boolean;
    basket?: boolean;
    rack?: boolean;
    lock?: boolean;
    lean?: number;
  }

  function addBike(bx: number, bz: number, ry: number, frameCol: number, opts: BikeOpts = {}) {
    const g = new T.Group();
    const fMat = createMaterial({ color: frameCol, roughness: 0.45, metalness: 0.45 });
    const w1 = mkMesh(tireGeo, tireMat, -0.48, 0.32, 0, true, false);
    const w2 = mkMesh(tireGeo, tireMat, 0.48, 0.32, 0, true, false);
    const f1 = mkMesh(barGeo, fMat, -0.1, 0.56, 0, true, false);
    f1.rotation.z = 1.25;
    const f2 = mkMesh(barGeo, fMat, 0.16, 0.52, 0, true, false);
    f2.rotation.z = -0.35;
    const f3 = mkMesh(barGeo, fMat, -0.34, 0.54, 0, true, false);
    f3.rotation.z = 0.2;
    const seat = mkMesh(
      new T.BoxGeometry(0.22, 0.06, 0.14),
      createMaterial({ color: opts.bagSeat ? 0xd9e0e6 : 0x2e2a27 }),
      -0.22,
      0.86,
      0,
      false,
      false,
    );
    const handle = mkMesh(
      new T.CylinderGeometry(0.018, 0.018, 0.46, 6),
      createMaterial({ color: 0xbac2c7, metalness: 0.7 }),
      0.38,
      0.92,
      0,
      false,
      false,
    );
    handle.rotation.x = Math.PI / 2;
    g.add(w1, w2, f1, f2, f3, seat, handle);
    if (opts.basket) {
      const bsk = mkMesh(
        new T.BoxGeometry(0.26, 0.22, 0.3),
        createMaterial({ color: 0x454c54, metalness: 0.4 }),
        0.52,
        0.76,
        0,
        true,
        false,
      );
      const btl = mkMesh(
        new T.CylinderGeometry(0.035, 0.035, 0.16, 8),
        createMaterial({ color: 0x9cd1e6, transparent: true, opacity: 0.7 }),
        0.52,
        0.88,
        -0.05,
        false,
        false,
      );
      g.add(bsk, btl);
    }
    if (opts.rack) {
      const rk = mkMesh(
        new T.BoxGeometry(0.36, 0.04, 0.2),
        createMaterial({ color: 0x3b4046 }),
        -0.52,
        0.64,
        0,
        false,
        false,
      );
      g.add(rk);
    }
    if (opts.lock) {
      const lk = mkMesh(
        new T.TorusGeometry(0.14, 0.02, 6, 12),
        createMaterial({ color: 0xb34332 }),
        -0.62,
        0.42,
        0.14,
        false,
        false,
      );
      g.add(lk);
    }
    g.position.set(bx, 0.04, bz);
    g.rotation.y = ry;
    if (opts.lean) {
      g.rotation.x = opts.lean;
    }
    scene.add(g);
    colliders.push({
      minX: bx - 0.65,
      maxX: bx + 0.65,
      minZ: bz - 0.5,
      maxZ: bz + 0.5,
      minY: 0,
      maxY: 1.2,
      active: true,
    });
    return g;
  }

  addBike(-6.2, 1.8, 0.35, 0x3d5c78, { basket: true, bagSeat: true });
  addBike(5.6, 2.2, -0.5, 0xc96244, { rack: true });
  addBike(-8.1, 7.6, 1.1, 0xe09b34, { lock: true, lean: 0.14 });
  addBike(6.6, -6.5, 2.4, 0x5c7560, { lean: 0.48 });

  addBox(
    3.6,
    0.65,
    1.75,
    createMaterial({ color: 0xc8ced1, roughness: 0.35, metalness: 0.45 }),
    -4.8,
    0.45,
    -4.5,
    true,
  );
  addBox(
    1.8,
    0.52,
    1.55,
    createMaterial({ color: 0xc8ced1, roughness: 0.35, metalness: 0.45 }),
    -4.6,
    1.0,
    -4.5,
    true,
  );
  addBox(
    1.6,
    0.45,
    0.55,
    createMaterial({ map: tex.wood('#9c7248', '#704f2f') }),
    4.5,
    0.35,
    6.5,
    true,
  );
  addCylinder(0.18, 0.2, 0.06, 10, createMaterial({ color: 0xd69656 }), 6.2, 0.06, 5.8);

  const haz = tex.hazard();
  const rampConc = createMaterial({ color: 0x5c6166, roughness: 0.9 });
  addBox(0.35, 3.0, 6.2, rampConc, -2.55, 1.3, -13.1, true);
  addBox(0.35, 3.0, 6.2, rampConc, 2.55, 1.3, -13.1, true);
  addBox(5.45, 0.35, 6.2, rampConc, 0, 2.95, -13.1, false).rotation.x = -0.22;
  addBox(
    4.75,
    0.2,
    6.4,
    createMaterial({ map: tex.concrete('#4c5055', 0.2, 'pk_ramp') }),
    0,
    -0.75,
    -13.1,
    false,
    true,
    true,
  ).rotation.x = 0.26;
  for (let r = 0; r < 8; r++) {
    addBox(
      4.2,
      0.04,
      0.14,
      createMaterial({ color: 0xd9ba43 }),
      0,
      0.02 - r * 0.17,
      -10.3 - r * 0.65,
      false,
    );
  }
  addBox(0.22, 0.45, 6.0, createMaterial({ map: haz }), -2.25, -0.45, -13.1, false).rotation.x = 0.26;
  addBox(0.22, 0.45, 6.0, createMaterial({ map: haz }), 2.25, -0.45, -13.1, false).rotation.x = 0.26;
  addBox(4.75, 2.8, 0.25, createMaterial({ color: 0x15181c }), 0, 0.15, -16.2, false);
  addSign(
    3.6,
    0.72,
    tex.sign('地下车库入口  B1 / B2', '#d4ad33', '#1a1a18', '限高 2.2m · 顺坡下去直达地下车库'),
    0,
    2.65,
    -9.98,
  );

  const leaves: { m: ReturnType<typeof addMesh>; s: number; p: number }[] = [];
  const lGeo = new T.PlaneGeometry(0.14, 0.09);
  const lMat = createMaterial({ color: 0x84ad58, side: T.DoubleSide });
  for (let i = 0; i < 24; i++) {
    leaves.push({
      m: addMesh(
        lGeo,
        lMat,
        (Math.random() - 0.5) * 16,
        1 + Math.random() * 4,
        (Math.random() - 0.5) * 16,
        false,
        false,
      ),
      s: 0.35 + Math.random() * 0.4,
      p: Math.random() * 6,
    });
  }
  let windShake = 0;
  let enteredGarage = false;
  updaters.push((dt, t) => {
    windShake = Math.max(0, windShake - dt * 0.6);
    canopies.forEach((c) => {
      c.m.rotation.z = Math.sin(t * 1.2 + c.p) * (0.03 + windShake * 0.08);
    });
    leaves.forEach((l) => {
      l.m.position.y -= dt * l.s;
      l.m.position.x += Math.sin(t * 2 + l.p) * dt * 0.4;
      l.m.rotation.x += dt * 1.8;
      if (l.m.position.y < 0.1) {
        l.m.position.y = 4.8;
      }
    });
    if (!enteredGarage && Math.abs(player.pos.x) < 2.2 && player.pos.z <= -14.6) {
      enteredGarage = true;
      const gi = sceneIdxById('garage');
      if (gi !== -1) {
        state.pendingSpawn = { pos: V(0, 1.8, -10.2), yaw: Math.PI };
        sfx.play('door');
        loadScene(gi);
        showWhisper('顺着斜坡走进了地下车库。');
      }
    }
  });

  const onLot = (x: number, z: number) => Math.abs(x) <= 7 && Math.abs(z) <= 10;
  setHeightFn((x, z) => {
    if (Math.abs(x) < 2.35 && z < -10.0) {
      return Math.max(-1.4, (z + 10.0) * 0.265);
    }
    return onLot(x, z) ? 0.06 : 0;
  });
  setSurfaceFn((x, z) =>
    onLot(x, z) || (Math.abs(x) < 2.35 && z < -10.0) ? 'concrete' : 'grass',
  );

  addInteract(
    'park_bike_lock',
    V(-8.1, 0.8, 7.6),
    '看一眼锁在树上的旧单车',
    '车轮上挂着一把红漆链条锁',
    () => {
      sfx.play('chime');
      showWhisper('后轮拿红锁死死锁在香樟树干上，链条掉了一半挂在牙盘外头。');
    },
  );
  addInteract(
    'park_bike_basket',
    V(-6.2, 0.8, 1.8),
    '拨一拨旧单车车筐里的东西',
    '车座上还套着塑料防雨袋',
    () => {
      sfx.play('paper');
      showWhisper('车筐里躺着半瓶喝剩的矿泉水、一张揉皱的买菜小票和几片香樟叶。');
    },
  );
  addInteract('park_bench', V(4.5, 0.6, 6.5), '坐在树荫木椅上听风', '让树冠再晃一会儿', () => {
    windShake = 1;
    sfx.play('grass');
    const gy = getHeight(player.pos.x, player.pos.z, player.pos.y - player.height);
    player.height = 0.85;
    player.pos.y = gy + 0.85;
    player.vel.y = 0;
    player.onGround = true;
    setSitTimer(() => {
      player.height = 1.65;
      player.pos.y = Math.max(
        player.pos.y,
        getHeight(player.pos.x, player.pos.z, player.pos.y - 1.65) + 1.65,
      );
    }, 2000);
    showWhisper('树冠筛下碎碎的光斑，四周高高低低的大花全在风里晃。');
  });
  addInteract(
    'park_cat',
    V(6.2, 0.25, 5.8),
    '看看灌木丛边的小猫食盆',
    '放了一小把干猫粮',
    () => {
      sfx.play('cat');
      showWhisper('花丛里窜出半条橘色尾巴，咪了一声，蹲回去继续吃。');
    },
  );
  addInteract('park_car', V(-4.5, 0.8, -4.5), '看看停在树下的白车', '挡风玻璃落了一层香樟花', () => {
    sfx.play('chime');
    showWhisper('车顶落满了细碎的绿叶和花瓣，车主大概几天没开了。');
  });

  addCollectible('park_lot', -6.2, 0.25, 4.2, 0x8cc775);
  setBounds({ minX: -11, maxX: 11, minZ: -15.4, maxZ: 10.5 });

  return {
    pos: V(0, 1.71, 8.5),
    yaw: 0,
    whisper: '高高低低的大花把停车场四周铺得满满当当，树边靠着几辆久没骑的单车。',
  };
}

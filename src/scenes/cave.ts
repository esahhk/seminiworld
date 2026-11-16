import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';

export function buildCaveScene(ctx: SceneContext): SceneInitResult {
  const {
    T,
    scene,
    player,
    state,
    tex,
    sfx,
    V,
    mkMesh,
    addMesh,
    addBox,
    addCylinder,
    addSign,
    syncColZ,
    createMaterial,
    addInteract,
    addCollectible,
    addTimedRedirect,
    activeIntervals,
    colliders,
    updaters,
    sceneIdxById,
    loadScene,
    showWhisper,
    setBounds,
    setHeightFn,
    setSurfaceFn,
  } = ctx;

  scene.background = new T.Color(0x0f151b);
  scene.fog = new T.FogExp2(0x162029, 0.032);
  scene.add(new T.AmbientLight(0x3a4b5a, 0.82));
  const lantern = new T.PointLight(0xffb86b, 2.0, 16);
  lantern.position.set(-1.5, 1.4, -1.5);
  scene.add(lantern);
  const poolGlow = new T.PointLight(0x47b5c9, 1.1, 12);
  poolGlow.position.set(2.5, 0.6, -4.5);
  scene.add(poolGlow);

  // Dawn morning backyard daylight (cool, clear, dewy)
  const dawnSun = new T.DirectionalLight(0xe4eff9, 1.1);
  dawnSun.position.set(-6, 16, 4);
  scene.add(dawnSun);
  const dawnFill = new T.PointLight(0xddecf6, 1.25, 18);
  dawnFill.position.set(0, 10.6, -3.5);
  scene.add(dawnFill);

  const rockMat = createMaterial({
    map: tex.concrete('#3a3d42', 0.26, 'cave_r'),
    roughness: 0.95,
  });
  addBox(22, 0.4, 24, rockMat, 0, -0.2, 0, true, false, true);
  addMesh(
    new T.PlaneGeometry(8, 7),
    createMaterial({
      color: 0x226878,
      emissive: 0x103842,
      emissiveIntensity: 0.5,
      roughness: 0.15,
    }),
    3,
    0.03,
    -4.5,
    false,
    false,
  ).rotation.x = -Math.PI / 2;

  for (let i = 0; i < 22; i++) {
    const ang = (i / 22) * Math.PI * 2;
    const rx = Math.cos(ang) * (9.2 + Math.sin(i * 3) * 1.2);
    const rz = Math.sin(ang) * (9.2 + Math.sin(i * 3) * 1.2);
    if (Math.abs(rx) < 2.2 && rz < -5) {
      continue;
    }
    addBox(2.8, 12.5, 2.8, rockMat, rx, 6.0, rz, true);
  }
  for (let i = 0; i < 18; i++) {
    const len = 1.0 + Math.random() * 2.2;
    const sx = (Math.random() - 0.5) * 13;
    const sz = (Math.random() - 0.5) * 13;
    if (Math.abs(sx) < 2.8 && sz < 1.2) {
      continue;
    }
    addMesh(
      new T.ConeGeometry(0.28, len, 6),
      rockMat,
      sx,
      11.4 - len / 2,
      sz,
      false,
      false,
    ).rotation.x = Math.PI;
  }

  addCylinder(
    0.14,
    0.18,
    0.3,
    8,
    createMaterial({
      color: 0xd99b43,
      emissive: 0xff8424,
      emissiveIntensity: 0.8,
    }),
    -1.5,
    0.22,
    -1.5,
  );
  addMesh(
    new T.OctahedronGeometry(0.45, 0),
    createMaterial({
      color: 0x6bcce0,
      emissive: 0x216b7d,
      emissiveIntensity: 0.4,
      roughness: 0.25,
    }),
    4.2,
    0.55,
    -6.2,
  );

  // Brass elevator shaft & upper dawn museum backyard marble path
  const brassMat = createMaterial({
    color: 0xb89652,
    metalness: 0.72,
    roughness: 0.32,
  });
  const stoneFrameMat = createMaterial({
    color: 0x6a7276,
    roughness: 0.88,
  });
  addBox(0.22, 11.2, 0.22, brassMat, -1.35, 5.6, -7.1, false);
  addBox(0.22, 11.2, 0.22, brassMat, 1.35, 5.6, -7.1, false);
  addBox(2.8, 0.24, 0.24, brassMat, 0, 3.0, -7.1, false);
  addBox(2.8, 0.24, 0.24, brassMat, 0, 10.5, -7.1, false);
  addBox(0.16, 11.2, 2.5, stoneFrameMat, -1.35, 5.6, -8.35, true);
  addBox(0.16, 11.2, 2.5, stoneFrameMat, 1.35, 5.6, -8.35, true);
  addBox(2.8, 11.2, 0.16, stoneFrameMat, 0, 5.6, -9.55, true);
  addBox(0.22, 0.38, 0.1, brassMat, 1.5, 1.25, -7.05, false);
  addBox(0.22, 0.38, 0.1, brassMat, 1.5, 8.75, -7.05, false);
  addSign(
    0.95,
    0.45,
    tex.sign('B4 · 后院', '#b89652', '#241d12', '博物馆后院小电梯'),
    1.5,
    1.72,
    -7.02,
  );

  const marbleTex = tex.tiles('#d8dcd8', '#cfd5d2', '#a5aeab', 2, 'marble_p');
  marbleTex.repeat.set(1, 5);
  addBox(
    1.75,
    0.16,
    7.6,
    createMaterial({
      map: marbleTex,
      roughness: 0.22,
      metalness: 0.12,
    }),
    0,
    7.42,
    -3.3,
    false,
    true,
    true,
  );
  const curbMat = createMaterial({ color: 0x7e8782, roughness: 0.72 });
  addBox(1.4, 0.45, 7.6, curbMat, -1.55, 7.6, -3.3, true);
  addBox(1.4, 0.45, 7.6, curbMat, 1.55, 7.6, -3.3, true);
  addBox(4.5, 0.45, 0.55, curbMat, 0, 7.6, 0.5, true);
  addBox(0.06, 0.78, 7.6, brassMat, -0.88, 7.88, -3.3, false);
  addBox(0.06, 0.78, 7.6, brassMat, 0.88, 7.88, -3.3, false);
  addBox(1.82, 0.06, 0.06, brassMat, 0, 8.25, 0.45, true);
  addBox(0.06, 0.06, 7.6, brassMat, -0.88, 8.25, -3.3, false);
  addBox(0.06, 0.06, 7.6, brassMat, 0.88, 8.25, -3.3, false);
  for (const lz of [-5.8, -3.3, -0.8]) {
    for (const lx of [-1.1, 1.1]) {
      const gl = new T.PointLight(0xeef5ea, 0.36, 3.4);
      gl.position.set(lx, 7.92, lz);
      scene.add(gl);
      addCylinder(
        0.08,
        0.08,
        0.03,
        10,
        createMaterial({
          color: 0xf4faf0,
          emissive: 0xdce8d5,
          emissiveIntensity: 0.8,
        }),
        lx,
        7.84,
        lz,
        false,
        false,
      );
    }
  }

  const fernMat = createMaterial({ color: 0x456b3e, roughness: 0.55, metalness: 0.08 });
  const ivyMat = createMaterial({ color: 0x3b6036, roughness: 0.5 });
  const hydBlue = createMaterial({ color: 0x9cb4d9, roughness: 0.5 });
  const hydWhite = createMaterial({ color: 0xedf2ef, roughness: 0.45 });
  const dewMat = createMaterial({ color: 0xf0f8ff, roughness: 0.1, metalness: 0.25 });
  for (let i = 0; i < 28; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const fx = side * (1.05 + Math.random() * 1.0);
    const fz = -6.7 + (i / 28) * 7.0;
    addMesh(
      new T.DodecahedronGeometry(0.28 + (i % 3) * 0.08, 0),
      i % 3 === 0 ? ivyMat : fernMat,
      fx,
      7.95,
      fz,
      false,
      true,
    );
    if (i % 2 === 0) {
      const fl = addMesh(
        new T.DodecahedronGeometry(0.14, 1),
        i % 4 === 0 ? hydBlue : hydWhite,
        fx - side * 0.14,
        8.18,
        fz,
        false,
        false,
      );
      fl.rotation.z = side * 0.25;
      addMesh(
        new T.SphereGeometry(0.028, 6, 6),
        dewMat,
        fx - side * 0.14,
        8.28,
        fz,
        false,
        false,
      );
    }
  }
  const sunCone = addMesh(
    new T.CylinderGeometry(1.1, 2.2, 6.2, 16, 1, true),
    createMaterial({
      color: 0xeaf4fc,
      transparent: true,
      opacity: 0.09,
      side: T.DoubleSide,
      depthWrite: false,
    }),
    -0.3,
    10.2,
    -3.2,
    false,
    false,
  );
  sunCone.rotation.z = -0.22;
  addSign(
    1.8,
    0.7,
    tex.sign('博物馆后院 · 清晨小路', '#dfe6e1', '#31423a', '露水未干 · 轻步慢行'),
    0,
    8.75,
    0.35,
  );

  // Brass-framed frosted-glass elevator cabin
  const elevCabin = new T.Group();
  const cFloor = mkMesh(
    new T.BoxGeometry(2.4, 0.12, 2.3),
    createMaterial({ map: marbleTex, roughness: 0.25 }),
    0,
    0.06,
    0,
    false,
    true,
  );
  const cCeil = mkMesh(
    new T.BoxGeometry(2.4, 0.14, 2.3),
    createMaterial({ color: 0xd8dfd8, roughness: 0.7 }),
    0,
    2.92,
    0,
    false,
    false,
  );
  const cBack = mkMesh(
    new T.BoxGeometry(2.4, 2.9, 0.14),
    createMaterial({ color: 0xc2cbc6, roughness: 0.65 }),
    0,
    1.48,
    -1.15,
    false,
    false,
  );
  const cLeft = mkMesh(
    new T.BoxGeometry(0.14, 2.9, 2.3),
    createMaterial({ color: 0xc2cbc6, roughness: 0.65 }),
    -1.18,
    1.48,
    0,
    false,
    false,
  );
  const cRight = mkMesh(
    new T.BoxGeometry(0.14, 2.9, 2.3),
    createMaterial({ color: 0xc2cbc6, roughness: 0.65 }),
    1.18,
    1.48,
    0,
    false,
    false,
  );
  const cDoor = mkMesh(
    new T.BoxGeometry(2.15, 2.72, 0.1),
    createMaterial({
      color: 0xdce6e4,
      transparent: true,
      opacity: 0.62,
      roughness: 0.35,
    }),
    0,
    1.42,
    1.15,
    false,
    false,
  );
  const cBulb = mkMesh(
    new T.SphereGeometry(0.1, 10, 10),
    createMaterial({
      color: 0xffdfb0,
      emissive: 0xffc670,
      emissiveIntensity: 0.65,
    }),
    0,
    2.78,
    0,
    false,
    false,
  );
  const elevLight = new T.PointLight(0xffdfb0, 0.55, 6);
  elevLight.position.set(0, 2.65, 0);
  elevCabin.add(cFloor, cCeil, cBack, cLeft, cRight, cDoor, cBulb, elevLight);
  elevCabin.position.set(0, 0, -8.3);
  scene.add(elevCabin);

  const doorColBottom = {
    minX: -1.15,
    maxX: 1.15,
    minZ: -7.18,
    maxZ: -7.02,
    minY: 0,
    maxY: 2.85,
    active: true,
  };
  const doorColTop = {
    minX: -1.15,
    maxX: 1.15,
    minZ: -7.18,
    maxZ: -7.02,
    minY: 7.45,
    maxY: 10.35,
    active: true,
  };
  const ceilCol = {
    minX: -1.3,
    maxX: 1.3,
    minZ: -9.5,
    maxZ: -7.1,
    minY: 2.82,
    maxY: 3.12,
    active: true,
  };
  colliders.push(doorColBottom, doorColTop, ceilCol);

  // Hollow west freight elevator shaft to B2 Garage
  const cargoSteel = createMaterial({ color: 0x4b4f54, metalness: 0.65, roughness: 0.55 });
  addBox(2.4, 0.14, 2.6, cargoSteel, -7.8, 0.04, 1.8, false, false, true);
  addBox(2.4, 0.16, 2.6, cargoSteel, -7.8, 2.96, 1.8, false);
  addBox(0.18, 3.0, 2.6, cargoSteel, -8.92, 1.5, 1.8, true);
  addBox(2.4, 3.0, 0.18, cargoSteel, -7.8, 1.5, 0.55, true);
  addBox(2.4, 3.0, 0.18, cargoSteel, -7.8, 1.5, 3.05, true);
  const cargoDoorL = addBox(
    0.12,
    2.8,
    1.15,
    createMaterial({ color: 0x5c6268, metalness: 0.5, roughness: 0.5 }),
    -6.58,
    1.4,
    1.22,
    true,
  );
  const cargoDoorR = addBox(
    0.12,
    2.8,
    1.15,
    createMaterial({ color: 0x5c6268, metalness: 0.5, roughness: 0.5 }),
    -6.58,
    1.4,
    2.38,
    true,
  );
  const cargoLamp = new T.PointLight(0xffa23a, 0.9, 7);
  cargoLamp.position.set(-7.5, 2.72, 1.8);
  scene.add(cargoLamp);
  addBox(0.16, 0.34, 0.22, createMaterial({ color: 0x3b4046 }), -6.52, 1.25, 3.15, true);
  addSign(
    0.95,
    0.48,
    tex.sign('B2 车库 · 上行', '#2b2f33', '#e6aa45', '旧货运电梯'),
    -6.48,
    2.95,
    1.8,
    Math.PI / 2,
  );

  let lanternHigh = true;
  let elevOpen = false;
  let elevFloor = 4;
  let elevY = 0;
  let elevMoving = false;
  let elevTargetY = 0;
  let elevMoveT = 0;
  let elevStartY = 0;
  let cargoOpen = false;
  let cargoPending = false;

  const elevInInter = addInteract(
    'cave_elev_in',
    V(0, 1.2, -8.3),
    '按下后院小电梯按键',
    '在B4溶洞与清晨后院间升降',
    () => {
      if (elevMoving) {
        return;
      }
      elevOpen = false;
      elevMoving = true;
      elevMoveT = 0;
      elevStartY = elevY;
      elevTargetY = elevFloor === 4 ? 7.38 : 0;
      elevFloor = elevFloor === 4 ? 1 : 4;
      sfx.play('switch');
      showWhisper(
        elevFloor === 1
          ? '磨砂玻璃门轻咔合上，小电梯稳稳升向清晨后院……'
          : '小电梯轻轻往下降，湿冷的洞窟重新漫了上来。',
      );
    },
  );

  updaters.push((dt, t) => {
    lantern.intensity = (lanternHigh ? 2.0 : 0.45) + Math.sin(t * 7) * 0.12;
    if (elevMoving) {
      elevMoveT = Math.min(1, elevMoveT + dt / 2.2);
      const e =
        elevMoveT < 0.5 ? 2 * elevMoveT * elevMoveT : 1 - Math.pow(-2 * elevMoveT + 2, 2) / 2;
      elevY = elevStartY + (elevTargetY - elevStartY) * e;
      if (elevMoveT >= 1) {
        elevMoving = false;
        elevOpen = true;
        sfx.play('click');
        showWhisper(
          elevFloor === 1
            ? '磨砂玻璃门轻咔滑开，清晨带着露水的湿泥和青草气迎面漫了过来。'
            : '门轻咔滑开，又回到了 B4 暗池洞窟。',
        );
      }
    }
    elevCabin.position.y = elevY;
    cDoor.position.x += ((elevOpen ? 2.1 : 0) - cDoor.position.x) * Math.min(1, dt * 4.2);
    doorColBottom.active = !(elevY < 0.25 && cDoor.position.x > 1.1);
    doorColTop.active = !(elevY > 7.15 && cDoor.position.x > 1.1);
    ceilCol.minY = elevY + 2.82;
    ceilCol.maxY = elevY + 3.12;
    elevInInter.pos.y = elevY + 1.2;

    if (
      Math.abs(player.pos.x) < 1.25 &&
      player.pos.z < -7.0 &&
      player.pos.z > -9.4 &&
      elevMoving
    ) {
      player.pos.y = elevY + 0.12 + player.height;
      player.vel.y = 0;
      player.onGround = true;
    }

    const cOff = cargoOpen ? 1.85 : 1.22;
    cargoDoorL.position.z +=
      (1.8 - (cOff - 1.22) - 0.58 - cargoDoorL.position.z) * Math.min(1, dt * 3.5);
    cargoDoorR.position.z +=
      (1.8 + (cOff - 1.22) + 0.58 - cargoDoorR.position.z) * Math.min(1, dt * 3.5);
    syncColZ(cargoDoorL, 0.57);
    syncColZ(cargoDoorR, 0.57);
  });

  addInteract('cave_lantern', V(-1.5, 0.6, -1.5), '拧动露营煤油灯旋钮', '调亮或压暗洞内火光', () => {
    lanternHigh = !lanternHigh;
    sfx.play('switch');
    showWhisper(
      lanternHigh
        ? '暖黄灯光扑到潮湿的钟乳石上，岩石反出湿漉漉的亮面。'
        : '灯光压暗，地下暗池泛出微弱蓝绿微光。',
    );
  });

  addInteract('cave_pool', V(2.8, 0.4, -3.5), '朝地下暗池投一颗小石子', '听回声荡开', () => {
    const stone = mkMesh(
      new T.SphereGeometry(0.04, 6, 6),
      createMaterial({ color: 0x888888 }),
      player.pos.x,
      1.5,
      player.pos.z,
    );
    scene.add(stone);
    const sx = player.pos.x;
    const sz = player.pos.z;
    const t0 = performance.now();
    const iv = window.setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / 600);
      stone.position.set(
        sx + (2.8 - sx) * p,
        1.5 + (0.4 - 1.5) * p + Math.sin(p * Math.PI) * 1.1,
        sz + (-3.5 - sz) * p,
      );
      if (p >= 1) {
        clearInterval(iv);
        const idx = activeIntervals.indexOf(iv);
        if (idx !== -1) {
          activeIntervals.splice(idx, 1);
        }
        scene.remove(stone);
        stone.geometry.dispose();
        (stone.material as InstanceType<typeof T.Material>).dispose();
        sfx.play('splash');
        showWhisper('咚——水声在岩壁间回响了三四次才慢慢散掉。');
      }
    }, 16);
    activeIntervals.push(iv);
  });

  addInteract(
    'cave_elev_btn',
    V(1.5, 1.25, -6.9),
    '按洞底后院小电梯按钮',
    '召唤/轻开磨砂玻璃门',
    () => {
      if (elevMoving) {
        return;
      }
      if (elevY > 0.5) {
        elevOpen = false;
        elevMoving = true;
        elevMoveT = 0;
        elevStartY = elevY;
        elevTargetY = 0;
        elevFloor = 4;
        sfx.play('click');
        showWhisper('小电梯从清晨后院轻轻降了下来。');
      } else {
        elevOpen = !elevOpen;
        sfx.play('click');
        showWhisper(
          elevOpen ? '磨砂玻璃门轻咔一声滑开，里头顶灯还亮着一点暖光。' : '玻璃门轻轻合上。',
        );
      }
    },
  );
  addInteract(
    'cave_elev_btn_top',
    V(1.5, 8.75, -6.9),
    '按后院小路电梯按钮',
    '召唤/轻开磨砂玻璃门',
    () => {
      if (elevMoving) {
        return;
      }
      if (elevY < 7.0) {
        elevOpen = false;
        elevMoving = true;
        elevMoveT = 0;
        elevStartY = elevY;
        elevTargetY = 7.38;
        elevFloor = 1;
        sfx.play('click');
        showWhisper('小电梯从底下洞窟慢慢升了上来。');
      } else {
        elevOpen = !elevOpen;
        sfx.play('click');
        showWhisper(elevOpen ? '后院小电梯玻璃门轻咔滑开。' : '玻璃门轻轻合拢。');
      }
    },
  );

  function goToGarageByCargo() {
    if (cargoPending) {
      return;
    }
    cargoPending = true;
    cargoOpen = false;
    sfx.play('door');
    showWhisper('铁门重重合拢，钢索震动着往 B2 地下车库上行……');
    addTimedRedirect(() => {
      cargoPending = false;
      const gi = sceneIdxById('garage');
      if (gi !== -1) {
        state.pendingSpawn = {
          pos: V(6.6, 1.65, 8.2),
          yaw: -Math.PI * 0.5,
        };
        loadScene(gi);
        showWhisper('货运电梯停稳，门外就是昏黄的 B2 地下车库。');
      }
    }, 720);
  }

  addInteract(
    'cave_cargo_btn',
    V(-6.3, 1.25, 3.15),
    '按货运电梯呼叫/上行 B2 车库',
    '铁皮双开门直通地下车库',
    () => {
      if (cargoPending) {
        return;
      }
      if (!cargoOpen) {
        cargoOpen = true;
        sfx.play('door');
        showWhisper('生锈的铁皮双开门吱呀滑开，门缝里渗出一股地下车库的机油味。');
      } else {
        goToGarageByCargo();
      }
    },
  );

  addInteract(
    'cave_cargo_go',
    V(-7.6, 1.3, 1.8),
    '按下货运电梯上行 B2 车库',
    '铁门闭合后直达 B2 地下车库',
    goToGarageByCargo,
  );

  addCollectible('cave', 4.2, 1.1, -6.0, 0xe6be9c);
  setBounds({ minX: -8.3, maxX: 7.2, minZ: -9.1, maxZ: 7.2 });
  setHeightFn((x, z, standingY = 0) => {
    if (Math.abs(x) < 1.25 && z < -7.0 && z > -9.4) {
      return elevY + 0.12;
    }
    if (z <= 0.8 && z >= -7.2 && Math.abs(x) <= 2.4 && standingY >= 6.6) {
      return 7.5;
    }
    if (x < -6.6 && z >= 0.6 && z <= 3.0) {
      return 0.08;
    }
    return 0;
  });
  setSurfaceFn((x, z, standingY = 0) => {
    if (standingY >= 6.8 || (Math.abs(x) < 1.25 && z < -7.0)) {
      return 'marble';
    }
    if (x < -6.6 && z >= 0.6 && z <= 3.0) {
      return 'metal';
    }
    if (x >= -1.0 && x <= 7.0 && z <= -1.0 && z >= -8.0 && standingY < 1.0) {
      return 'water';
    }
    return 'stone';
  });

  return {
    pos: V(0, 1.65, 5.5),
    yaw: 0,
    whisper: '湿冷的洞穴尽头嵌着一部黄铜框的后院小电梯，西侧还有一部通往 B2 车库的旧货运梯。',
  };
}

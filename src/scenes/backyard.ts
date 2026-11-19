import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';

export function buildBackyardScene(ctx: SceneContext): SceneInitResult {
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
    addTimedRedirect,
    colliders,
    updaters,
    sceneIdxById,
    loadScene,
    showWhisper,
    openModal,
    closeModal,
    setBounds,
    setHeightFn,
    setSurfaceFn,
  } = ctx;

  scene.background = new T.Color(0xdbe7ee);
  scene.fog = new T.FogExp2(0xdde8ef, 0.01);
  scene.add(new T.HemisphereLight(0xf3f9fd, 0x627366, 1.15));
  const dawnSun = new T.DirectionalLight(0xf7fbff, 1.4);
  dawnSun.position.set(-10, 18, 9);
  dawnSun.castShadow = true;
  scene.add(dawnSun);
  const softFill = new T.PointLight(0xe6f2f8, 0.75, 22);
  softFill.position.set(0, 4.2, -1.5);
  scene.add(softFill);

  const grassTex = tex.grass('#53734a', '#3f5c37');
  grassTex.repeat.set(8, 8);
  addBox(
    48,
    0.2,
    48,
    createMaterial({ map: grassTex, roughness: 0.95 }),
    0,
    -0.25,
    0,
    true,
    false,
    true,
  );

  addMesh(
    new T.PlaneGeometry(18, 12),
    createMaterial({
      color: 0x5c858f,
      roughness: 0.14,
      metalness: 0.15,
    }),
    0,
    -0.12,
    9.5,
    false,
    false,
  ).rotation.x = -Math.PI / 2;

  const facadeMat = createMaterial({
    map: tex.concrete('#cdd3d0', 0.12, 'by_wall'),
    roughness: 0.85,
  });
  addBox(9.2, 5.2, 0.4, facadeMat, -5.95, 2.5, -7.25, true);
  addBox(9.2, 5.2, 0.4, facadeMat, 5.95, 2.5, -7.25, true);
  addBox(3.0, 2.2, 0.4, facadeMat, 0, 4.0, -7.25, true);
  addBox(22, 0.35, 3.6, createMaterial({ color: 0xadb5b2, roughness: 0.8 }), 0, 5.25, -8.8, false);

  const marbleTex = tex.tiles('#dce0dc', '#d2d8d5', '#a8b0ad', 2, 'by_marble');
  marbleTex.repeat.set(1, 6);
  addBox(
    1.8,
    0.16,
    9.2,
    createMaterial({
      map: marbleTex,
      roughness: 0.2,
      metalness: 0.14,
    }),
    0,
    -0.02,
    -2.5,
    false,
    true,
    true,
  );

  const curbMat = createMaterial({ color: 0x868f8a, roughness: 0.78 });
  addBox(1.45, 0.46, 9.2, curbMat, -1.62, 0.21, -2.5, true);
  addBox(1.45, 0.46, 9.2, curbMat, 1.62, 0.21, -2.5, true);
  addBox(4.7, 0.46, 0.55, curbMat, 0, 0.21, 2.15, true);

  const brassMat = createMaterial({
    color: 0xb89652,
    metalness: 0.72,
    roughness: 0.3,
  });
  for (let pz = -6.5; pz <= 2.0; pz += 1.7) {
    addCylinder(0.025, 0.028, 0.76, 8, brassMat, -0.88, 0.44, pz, false);
    addCylinder(0.025, 0.028, 0.76, 8, brassMat, 0.88, 0.44, pz, false);
  }
  addBox(0.05, 0.05, 9.0, brassMat, -0.88, 0.82, -2.5, false);
  addBox(0.05, 0.05, 9.0, brassMat, 0.88, 0.82, -2.5, false);
  addBox(1.82, 0.05, 0.05, brassMat, 0, 0.82, 2.0, true);

  for (const lz of [-5.8, -2.5, 0.8]) {
    for (const lx of [-1.1, 1.1]) {
      const gl = new T.PointLight(0xeef5ea, 0.32, 3.6);
      gl.position.set(lx, 0.5, lz);
      scene.add(gl);
      addCylinder(
        0.08,
        0.08,
        0.03,
        10,
        createMaterial({
          color: 0xf4faf0,
          emissive: 0xdce8d5,
          emissiveIntensity: 0.75,
        }),
        lx,
        0.45,
        lz,
        false,
        false,
      );
    }
  }

  const fernMat = createMaterial({ color: 0x456d3e, roughness: 0.52, metalness: 0.08 });
  const ivyMat = createMaterial({ color: 0x3b6036, roughness: 0.5 });
  const hydBlue = createMaterial({ color: 0x9ab4dc, roughness: 0.48 });
  const hydWhite = createMaterial({ color: 0xedf2ef, roughness: 0.45 });
  const dewMat = createMaterial({ color: 0xf0f8ff, roughness: 0.1, metalness: 0.25 });
  const bushGeos = [
    track(new T.DodecahedronGeometry(0.28, 0)),
    track(new T.DodecahedronGeometry(0.36, 0)),
    track(new T.DodecahedronGeometry(0.44, 0)),
  ];
  const hydGeo = track(new T.DodecahedronGeometry(0.14, 1));
  const dewGeo = track(new T.SphereGeometry(0.028, 6, 6));
  for (let i = 0; i < 34; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const fx = side * (1.06 + Math.random() * 1.15);
    const fz = -6.7 + (i / 34) * 8.4;
    addMesh(
      bushGeos[i % 3],
      i % 3 === 0 ? ivyMat : fernMat,
      fx,
      0.56,
      fz,
      false,
      true,
    );
    if (i % 2 === 0) {
      const fl = addMesh(
        hydGeo,
        i % 4 === 0 ? hydBlue : hydWhite,
        fx - side * 0.14,
        0.78,
        fz,
        false,
        false,
      );
      fl.rotation.z = side * 0.25;
      addMesh(
        dewGeo,
        dewMat,
        fx - side * 0.14,
        0.88,
        fz,
        false,
        false,
      );
    }
  }

  const hedgeMat = createMaterial({ color: 0x42633c, roughness: 0.9 });
  const trunkMat = createMaterial({ map: tex.wood('#614b38', '#453425') });
  for (const [tx, tz] of [
    [-7.5, -2.5],
    [7.5, -2.0],
    [-9.5, 4.5],
    [9.2, 5.2],
    [-6.5, 14.5],
    [6.8, 15.0],
  ]) {
    addCylinder(0.22, 0.3, 3.4, 8, trunkMat, tx, 1.5, tz, false);
    addMesh(new T.DodecahedronGeometry(2.1, 1), hedgeMat, tx, 3.6, tz, false);
  }

  const sunCone = addMesh(
    new T.CylinderGeometry(1.1, 2.3, 6.6, 16, 1, true),
    createMaterial({
      color: 0xf2f8fc,
      transparent: true,
      opacity: 0.08,
      side: T.DoubleSide,
      depthWrite: false,
    }),
    -0.4,
    2.8,
    -2.2,
    false,
    false,
  );
  sunCone.rotation.z = -0.24;

  addSign(
    1.8,
    0.7,
    tex.sign('博物馆后院 · 清晨小路', '#e4ebe6', '#2e4037', '露水未干 · 轻步慢行'),
    0,
    1.32,
    1.78,
    Math.PI,
  );

  addBox(0.22, 3.1, 0.22, brassMat, -1.35, 1.55, -7.1, false);
  addBox(0.22, 3.1, 0.22, brassMat, 1.35, 1.55, -7.1, false);
  addBox(2.92, 0.24, 0.24, brassMat, 0, 3.0, -7.1, false);
  addBox(0.16, 3.1, 2.5, facadeMat, -1.35, 1.55, -8.35, true);
  addBox(0.16, 3.1, 2.5, facadeMat, 1.35, 1.55, -8.35, true);
  addBox(2.8, 3.1, 0.16, facadeMat, 0, 1.55, -9.55, true);

  addBox(0.2, 0.36, 0.08, brassMat, 1.65, 1.25, -7.02, false);
  addBox(0.98, 0.48, 0.04, brassMat, 2.08, 1.88, -7.02, false);
  addSign(
    0.92,
    0.44,
    tex.sign('1F · 后院', '#c9a661', '#211a10', 'B2 车库 / B4 溶洞'),
    2.08,
    1.88,
    -6.98,
  );

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
    new T.SphereGeometry(0.09, 10, 10),
    createMaterial({
      color: 0xffdfb0,
      emissive: 0xffc670,
      emissiveIntensity: 0.45,
    }),
    0,
    2.78,
    0,
    false,
    false,
  );
  const elevLight = new T.PointLight(0xffdfb0, 0.4, 6);
  elevLight.position.set(0, 2.65, 0);
  elevCabin.add(cFloor, cCeil, cBack, cLeft, cRight, cDoor, cBulb, elevLight);
  elevCabin.position.set(0, -0.02, -8.3);
  scene.add(elevCabin);

  const doorCol = {
    minX: -1.15,
    maxX: 1.15,
    minZ: -7.18,
    maxZ: -7.02,
    minY: 0,
    maxY: 2.85,
    active: false,
  };
  colliders.push(doorCol);

  let elevOpen = true;
  let elevPending = false;
  let wasOutsideCabin = false;

  function rideElevatorTo(target: 'garage' | 'cave') {
    if (elevPending) {
      return;
    }
    elevPending = true;
    closeModal();
    elevOpen = false;
    sfx.play('click');
    showWhisper(
      target === 'garage'
        ? '磨砂玻璃门轻咔合上，小电梯稳稳往下沉向 B2 地下车库……'
        : '磨砂玻璃门轻咔合上，小电梯缓缓降回湿冷的 B4 幽深洞穴……',
    );
    addTimedRedirect(() => {
      elevPending = false;
      const idx = sceneIdxById(target);
      if (idx !== -1) {
        if (target === 'garage') {
          state.pendingSpawn = { pos: V(8.4, 1.75, 12.8), yaw: 0 };
          loadScene(idx);
          showWhisper('门轻咔滑开，门外是亮堂的 B2 地下车库。');
        } else {
          state.pendingSpawn = { pos: V(0, 1.77, -12.1), yaw: Math.PI };
          loadScene(idx);
          showWhisper('电梯停稳，又回到了 B4 幽深洞穴的北端。');
        }
      }
    }, 680);
  }

  function openFloorSelector() {
    if (elevPending) {
      return;
    }
    sfx.play('click');
    openModal(
      '1F · 电梯楼层选择',
      '黄铜面板上亮着另外两层按键。请选择要前往的楼层，或开关电梯门：',
      [
        { label: '前往 B2 · 地下车库', fn: () => rideElevatorTo('garage') },
        { label: '前往 B4 · 幽深洞穴', fn: () => rideElevatorTo('cave') },
        {
          label: elevOpen ? '关闭电梯门' : '打开电梯门',
          fn: () => {
            elevOpen = !elevOpen;
            wasOutsideCabin = false;
            sfx.play('click');
            closeModal();
          },
        },
      ],
      { meta: '博物馆后院小电梯 · 清晨微光中' },
    );
  }

  updaters.push((dt) => {
    const inCabin = Math.abs(player.pos.x) < 1.12 && player.pos.z < -7.35;
    if (!inCabin && player.pos.z > -6.8) {
      wasOutsideCabin = true;
    }
    if (inCabin && wasOutsideCabin && elevOpen && !elevPending) {
      elevOpen = false;
      wasOutsideCabin = false;
      sfx.play('click');
      showWhisper('走进轿厢后，磨砂玻璃门自动合拢；按 [E] 选择楼层或重新开门。');
    }
    cDoor.position.x += ((elevOpen ? 2.1 : 0) - cDoor.position.x) * Math.min(1, dt * 4.2);
    doorCol.active = cDoor.position.x <= 1.1;
  });

  addInteract(
    'by_elev_btn',
    V(1.65, 1.25, -6.75),
    '按后院小电梯门外按钮',
    '打开磨砂玻璃门进入轿厢',
    () => {
      if (elevPending) {
        return;
      }
      elevOpen = !elevOpen;
      sfx.play('click');
      showWhisper(
        elevOpen ? '磨砂玻璃门轻咔滑开，走进去后门会自动关上。' : '玻璃门轻轻合拢。',
      );
    },
    {
      radius: 0.9,
      getLabel: () => (elevOpen ? '关闭后院小电梯门' : '打开后院小电梯门'),
    },
  );
  addInteract(
    'by_elev_in',
    V(0, 1.45, -7.55),
    '按下轿厢楼层按键',
    '选择前往 B2 车库、B4 洞穴或开关门',
    openFloorSelector,
    { radius: 1.4 },
  );

  addInteract('by_flowers', V(-0.9, 0.7, -3.0), '俯身看看沾着露水的绣球与蕨叶', '摸一把清晨石沿', () => {
    sfx.play('grass');
    showWhisper('花瓣微微低着头，指尖一碰就滑下几滴凉丝丝的早露。');
  });

  addCollectible('backyard', 0, 0.72, 1.1, 0xf2f7f2);
  setBounds({ minX: -2.2, maxX: 2.2, minZ: -9.1, maxZ: 2.0 });
  setHeightFn((x, z) => (Math.abs(x) < 1.25 && z < -7.0 ? 0.1 : 0.06));
  setSurfaceFn(() => 'marble');

  return {
    pos: V(0, 1.75, -7.8),
    yaw: Math.PI,
    whisper: '磨砂玻璃门轻咔滑开，带着露水的湿泥与青草味迎面扑进清爽的清晨空气里。',
  };
}

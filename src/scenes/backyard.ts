import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';
import { addInstancedMeshes, buildCamphorGrove } from '../engine/propKit';

export function buildBackyardScene(ctx: SceneContext): SceneInitResult {
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
    addDoubleSign,
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
  const softFill = new T.PointLight(0xe6f2f8, 0.85, 24);
  softFill.position.set(0, 4.2, -1.5);
  scene.add(softFill);

  const grassTex = tex.grass('#53734a', '#3f5c37');
  grassTex.repeat.set(8, 8);
  addBox(48, 0.2, 48, createMaterial({ map: grassTex, roughness: 0.95 }), 0, -0.25, 0, true, false, true);

  addMesh(
    new T.PlaneGeometry(20, 12),
    createMaterial({ color: 0x4f7d87, roughness: 0.1, metalness: 0.25 }),
    0,
    -0.12,
    9.5,
    false,
    false,
  ).rotation.x = -Math.PI / 2;

  const lilyMat = createMaterial({ color: 0x4d7d47, roughness: 0.6 });
  const lotusBudMat = createMaterial({ color: 0xf4c2cf, roughness: 0.45 });
  const pondRimMat = createMaterial({ color: 0x8a928d, roughness: 0.82 });
  addBox(20.4, 0.18, 0.45, pondRimMat, 0, -0.08, 3.55, false, false, true);
  for (const [lx, lz, ls, bud] of [
    [-2.4, 6.4, 0.34, true],
    [2.1, 7.2, 0.28, false],
    [-1.2, 8.8, 0.38, true],
    [3.4, 6.2, 0.3, false],
  ] as [number, number, number, boolean][]) {
    addCylinder(ls, ls, 0.02, 16, lilyMat, lx, -0.1, lz, false);
    if (bud) {
      addMesh(new T.ConeGeometry(0.08, 0.18, 8), lotusBudMat, lx, -0.02, lz, false, false);
    }
  }

  const facadeMat = createMaterial({
    map: tex.concrete('#cdd3d0', 0.12, 'by_wall'),
    bumpMap: tex.bumpNoise('by_b', 18),
    bumpScale: 0.012,
    roughness: 0.84,
  });
  const trimStone = createMaterial({ color: 0xb6bebb, roughness: 0.72 });
  addBox(9.2, 5.2, 0.4, facadeMat, -5.95, 2.5, -7.25, true);
  addBox(9.2, 5.2, 0.4, facadeMat, 5.95, 2.5, -7.25, true);
  addBox(3.0, 2.2, 0.4, facadeMat, 0, 4.0, -7.25, true);
  addBox(22, 0.35, 3.6, createMaterial({ color: 0xadb5b2, roughness: 0.8 }), 0, 5.25, -8.8, false);
  for (const px of [-7.8, -4.5, -2.0, 2.0, 4.5, 7.8]) {
    addBox(0.38, 5.0, 0.16, trimStone, px, 2.5, -7.02, false);
    addBox(0.48, 0.24, 0.22, trimStone, px, 4.95, -7.02, false);
  }
  const winGlass = createMaterial({ color: 0x9ac0ce, transparent: true, opacity: 0.48, roughness: 0.12 });
  for (const wx of [-6.1, 6.1]) {
    addBox(1.8, 2.8, 0.12, trimStone, wx, 2.2, -7.02, false);
    addBox(1.55, 2.55, 0.08, winGlass, wx, 2.2, -7.0, false);
  }

  const marbleTex = tex.tiles('#dce0dc', '#d2d8d5', '#a8b0ad', 2, 'by_marble');
  marbleTex.repeat.set(1, 6);
  addBox(
    1.8,
    0.16,
    9.2,
    createMaterial({ map: marbleTex, roughness: 0.2, metalness: 0.14 }),
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

  const brassMat = createMaterial({ color: 0xb89652, metalness: 0.78, roughness: 0.26 });
  const bollardMat = createMaterial({ color: 0x3b4244, metalness: 0.55, roughness: 0.4 });
  const bollardGlowMat = createMaterial({ color: 0xf4faf0, emissive: 0xdce8d5, emissiveIntensity: 0.9 });
  for (let pz = -6.5; pz <= 2.0; pz += 1.7) {
    addCylinder(0.025, 0.028, 0.76, 8, brassMat, -0.88, 0.44, pz, false);
    addCylinder(0.025, 0.028, 0.76, 8, brassMat, 0.88, 0.44, pz, false);
  }
  addBox(0.05, 0.05, 9.0, brassMat, -0.88, 0.82, -2.5, false);
  addBox(0.05, 0.05, 9.0, brassMat, 0.88, 0.82, -2.5, false);
  addBox(1.82, 0.05, 0.05, brassMat, 0, 0.82, 2.0, true);

  for (const lz of [-5.8, -2.5, 0.8]) {
    for (const lx of [-1.1, 1.1]) {
      addCylinder(0.06, 0.075, 0.22, 10, bollardMat, lx, 0.55, lz, false, false);
      addCylinder(0.065, 0.065, 0.06, 10, bollardGlowMat, lx, 0.67, lz, false, false);
      addCylinder(0.08, 0.02, 0.05, 10, bollardMat, lx, 0.72, lz, false, false);
    }
  }

  const bushItems: { x: number; y: number; z: number; sx: number; sy: number; sz: number; color: number }[] = [];
  const flItems: { x: number; y: number; z: number; rx: number; rz: number; color: number }[] = [];
  const dewItems: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i < 36; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const fx = side * (1.06 + Math.random() * 1.15);
    const fz = -6.7 + (i / 36) * 8.4;
    const sc = 0.85 + (i % 3) * 0.22;
    bushItems.push({ x: fx, y: 0.56, z: fz, sx: sc, sy: sc, sz: sc, color: i % 3 === 0 ? 0x3b6036 : 0x456d3e });
    if (i % 2 === 0) {
      flItems.push({ x: fx - side * 0.14, y: 0.78, z: fz, rx: 0, rz: side * 0.25, color: i % 4 === 0 ? 0x9ab4dc : 0xedf2ef });
      dewItems.push({ x: fx - side * 0.14, y: 0.88, z: fz });
    }
  }
  addInstancedMeshes(ctx, new T.IcosahedronGeometry(0.32, 1), createMaterial({ color: 0xffffff, roughness: 0.55 }), bushItems, false, true);
  addInstancedMeshes(ctx, new T.IcosahedronGeometry(0.15, 2), createMaterial({ color: 0xffffff, roughness: 0.45 }), flItems, false, false);
  addInstancedMeshes(ctx, new T.SphereGeometry(0.028, 6, 6), createMaterial({ color: 0xf0f8ff, roughness: 0.1, metalness: 0.25 }), dewItems, false, false);

  buildCamphorGrove(
    ctx,
    [[-7.5, -2.5], [7.5, -2.0], [-9.5, 4.5], [9.2, 5.2], [-6.5, 14.5], [6.8, 15.0]].map(([x, z]) => ({
      x,
      y: -0.15,
      z,
      scale: 0.9,
      solid: false,
    })),
    true,
  );

  const sunCone = addMesh(
    new T.CylinderGeometry(1.1, 2.3, 6.6, 16, 1, true),
    createMaterial({ color: 0xf2f8fc, transparent: true, opacity: 0.08, side: T.DoubleSide, depthWrite: false }),
    -0.4,
    2.8,
    -2.2,
    false,
    false,
  );
  sunCone.rotation.z = -0.24;

  addCylinder(0.035, 0.035, 1.35, 8, brassMat, -0.72, 0.67, 1.78);
  addCylinder(0.035, 0.035, 1.35, 8, brassMat, 0.72, 0.67, 1.78);
  addDoubleSign(
    1.8,
    0.72,
    tex.sign('博物馆后院 · 清晨小路', '#e4ebe6', '#2e4037', '露水未干 · 轻步慢行', false, 1.8 / 0.72),
    0,
    1.28,
    1.78,
    Math.PI,
    0x3b4840,
  );

  addBox(0.22, 3.1, 0.22, brassMat, -1.35, 1.55, -7.1, false);
  addBox(0.22, 3.1, 0.22, brassMat, 1.35, 1.55, -7.1, false);
  addBox(2.92, 0.24, 0.24, brassMat, 0, 3.0, -7.1, false);
  addBox(0.16, 3.1, 2.5, facadeMat, -1.35, 1.55, -8.35, true);
  addBox(0.16, 3.1, 2.5, facadeMat, 1.35, 1.55, -8.35, true);
  addBox(2.8, 3.1, 0.16, facadeMat, 0, 1.55, -9.55, true);

  addBox(0.22, 0.38, 0.08, brassMat, 1.65, 1.25, -7.02, false);
  addCylinder(0.03, 0.03, 0.03, 8, createMaterial({ color: 0xffe4a0, emissive: 0xffc65c, emissiveIntensity: 1.0 }), 1.65, 1.3, -6.97);
  addBox(0.98, 0.48, 0.04, brassMat, 2.08, 1.88, -7.02, false);
  addSign(
    0.92,
    0.44,
    tex.sign('1F · 后院', '#c9a661', '#211a10', 'B2 车库 / B4 溶洞', false, 0.92 / 0.44),
    2.08,
    1.88,
    -6.98,
  );

  const elevCabin = new T.Group();
  const cFloor = mkMesh(new T.BoxGeometry(2.4, 0.12, 2.3), createMaterial({ map: marbleTex, roughness: 0.25 }), 0, 0.06, 0, false, true);
  const cCeil = mkMesh(new T.BoxGeometry(2.4, 0.14, 2.3), createMaterial({ color: 0xd8dfd8, roughness: 0.7 }), 0, 2.92, 0, false, false);
  const cBack = mkMesh(new T.BoxGeometry(2.4, 2.9, 0.14), createMaterial({ color: 0xc2cbc6, roughness: 0.65 }), 0, 1.48, -1.15, false, false);
  const cLeft = mkMesh(new T.BoxGeometry(0.14, 2.9, 2.3), createMaterial({ color: 0xc2cbc6, roughness: 0.65 }), -1.18, 1.48, 0, false, false);
  const cRight = mkMesh(new T.BoxGeometry(0.14, 2.9, 2.3), createMaterial({ color: 0xc2cbc6, roughness: 0.65 }), 1.18, 1.48, 0, false, false);
  const cRail = mkMesh(new T.CylinderGeometry(0.025, 0.025, 2.1, 8), brassMat, 0, 0.92, -1.02, false, false);
  cRail.rotation.z = Math.PI / 2;
  const cPanel = mkMesh(new T.BoxGeometry(0.05, 0.42, 0.22), brassMat, 1.09, 1.25, 0.72, false, false);
  const cDoor = mkMesh(
    new T.BoxGeometry(2.15, 2.72, 0.1),
    createMaterial({ color: 0xdce6e4, transparent: true, opacity: 0.62, roughness: 0.35 }),
    0,
    1.42,
    1.15,
    false,
    false,
  );
  const cBulb = mkMesh(
    new T.SphereGeometry(0.09, 10, 10),
    createMaterial({ color: 0xffdfb0, emissive: 0xffc670, emissiveIntensity: 0.45 }),
    0,
    2.78,
    0,
    false,
    false,
  );
  const elevLight = new T.PointLight(0xffdfb0, 0.5, 6);
  elevLight.position.set(0, 2.65, 0);
  elevCabin.add(cFloor, cCeil, cBack, cLeft, cRight, cRail, cPanel, cDoor, cBulb, elevLight);
  elevCabin.position.set(0, -0.02, -8.3);
  scene.add(elevCabin);

  const doorCol = { minX: -1.15, maxX: 1.15, minZ: -7.18, maxZ: -7.02, minY: 0, maxY: 2.85, active: false };
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
      showWhisper(elevOpen ? '磨砂玻璃门轻咔滑开，走进去后门会自动关上。' : '玻璃门轻轻合拢。');
    },
    { radius: 0.9, getLabel: () => (elevOpen ? '关闭后院小电梯门' : '打开后院小电梯门') },
  );
  addInteract('by_elev_in', V(0, 1.45, -7.55), '按下轿厢楼层按键', '选择前往 B2 车库、B4 洞穴或开关门', openFloorSelector, {
    radius: 1.4,
  });
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

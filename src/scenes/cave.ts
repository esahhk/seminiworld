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
    openModal,
    closeModal,
    setBounds,
    setHeightFn,
    setSurfaceFn,
  } = ctx;

  scene.background = new T.Color(0x0f151b);
  scene.fog = new T.FogExp2(0x162029, 0.032);
  scene.add(new T.AmbientLight(0x465a6b, 0.92));
  const lantern = new T.PointLight(0xffb86b, 2.1, 16);
  lantern.position.set(-1.5, 1.4, -1.5);
  scene.add(lantern);
  const poolGlow = new T.PointLight(0x47b5c9, 1.2, 13);
  poolGlow.position.set(2.5, 0.6, -4.5);
  scene.add(poolGlow);

  const rockMat = createMaterial({
    map: tex.concrete('#3a3d42', 0.26, 'cave_r'),
    roughness: 0.95,
  });
  addBox(22, 0.4, 24, rockMat, 0, -0.2, 0, true, false, true);
  addBox(22, 0.6, 24, rockMat, 0, 11.8, 0, false, false, false);
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
    addBox(2.8, 12.2, 2.8, rockMat, rx, 6.0, rz, true);
  }
  for (let i = 0; i < 22; i++) {
    const len = 1.0 + Math.random() * 2.2;
    const sx = (Math.random() - 0.5) * 14;
    const sz = (Math.random() - 0.5) * 14;
    if (Math.abs(sx) < 1.8 && sz < -6.2) {
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

  // Unified brass-framed frosted-glass elevator shaft (1F Morning Backyard <-> B2 Garage <-> B4 Cave)
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
  addBox(2.92, 0.24, 0.24, brassMat, 0, 3.0, -7.1, false);
  addBox(0.16, 11.2, 2.5, stoneFrameMat, -1.35, 5.6, -8.35, true);
  addBox(0.16, 11.2, 2.5, stoneFrameMat, 1.35, 5.6, -8.35, true);
  addBox(2.8, 11.2, 0.16, stoneFrameMat, 0, 5.6, -9.55, true);

  // Non-clipping call button & brass plaque cleanly offset to the right of the brass frame (x = 1.35..1.46)
  addBox(0.2, 0.36, 0.08, brassMat, 1.68, 1.25, -7.02, false);
  addBox(1.1, 0.52, 0.05, stoneFrameMat, 2.18, 1.9, -7.04, false);
  addSign(
    1.04,
    0.46,
    tex.sign('B4 · 电梯间', '#c8a45b', '#221a0f', '1F 后院 / B2 车库'),
    2.18,
    1.9,
    -6.99,
  );

  const marbleFloorTex = tex.tiles('#d8dcd8', '#cfd5d2', '#a5aeab', 2, 'cave_mfl');
  const elevCabin = new T.Group();
  const cFloor = mkMesh(
    new T.BoxGeometry(2.4, 0.12, 2.3),
    createMaterial({ map: marbleFloorTex, roughness: 0.25 }),
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
  const elevLight = new T.PointLight(0xffdfb0, 0.65, 7);
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
  colliders.push(doorColBottom);

  let lanternHigh = true;
  let elevOpen = false;
  let elevPending = false;

  function rideToFloor(target: 'backyard' | 'garage') {
    if (elevPending) {
      return;
    }
    elevPending = true;
    closeModal();
    elevOpen = false;
    sfx.play('click');
    showWhisper(
      target === 'backyard'
        ? '磨砂玻璃门轻咔合上，小电梯穿过长井稳稳升向清晨后院……'
        : '磨砂玻璃门轻咔合上，小电梯稳稳升往 B2 地下车库……',
    );
    addTimedRedirect(() => {
      elevPending = false;
      const idx = sceneIdxById(target);
      if (idx !== -1) {
        if (target === 'backyard') {
          state.pendingSpawn = { pos: V(0, 1.65, -7.8), yaw: Math.PI };
          loadScene(idx);
          showWhisper('磨砂玻璃门轻咔滑开，阳光照着的清晨后院和露水花草正迎面扑来。');
        } else {
          state.pendingSpawn = { pos: V(8.4, 1.75, 12.8), yaw: Math.PI };
          loadScene(idx);
          showWhisper('门轻咔滑开，外面就是亮堂的 B2 地下车库。');
        }
      }
    }, 680);
  }

  function openFloorChoices() {
    if (elevPending) {
      return;
    }
    sfx.play('click');
    openModal(
      'B4 · 电梯楼层选择',
      '同一部黄铜小电梯往上既可通往清晨的博物馆后院，也可停靠 B2 地下车库。请选择楼层：',
      [
        { label: '前往 1F · 博物馆清晨后院', fn: () => rideToFloor('backyard') },
        { label: '前往 B2 · 地下车库', fn: () => rideToFloor('garage') },
        { label: '留在 B4 洞穴', fn: closeModal },
      ],
      { meta: '洞窟北侧小电梯' },
    );
  }

  updaters.push((dt, t) => {
    lantern.intensity = (lanternHigh ? 2.1 : 0.45) + Math.sin(t * 7) * 0.12;
    cDoor.position.x += ((elevOpen ? 2.1 : 0) - cDoor.position.x) * Math.min(1, dt * 4.2);
    doorColBottom.active = cDoor.position.x <= 1.1;
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
    V(1.68, 1.25, -6.9),
    '按小电梯门外按钮',
    '轻开磨砂玻璃门',
    () => {
      if (elevPending) {
        return;
      }
      elevOpen = !elevOpen;
      sfx.play('click');
      showWhisper(
        elevOpen
          ? '磨砂玻璃门轻咔一声滑开，里头顶灯还亮着一点暖光。'
          : '玻璃门轻轻合上。',
      );
    },
  );
  addInteract(
    'cave_elev_in',
    V(0, 1.2, -8.3),
    '按下电梯楼层按键',
    '选择前往 1F 清晨后院或 B2 地下车库',
    openFloorChoices,
  );

  addCollectible('cave', 4.2, 1.1, -6.0, 0xe6be9c);
  setBounds({ minX: -7.8, maxX: 7.2, minZ: -9.1, maxZ: 7.2 });
  setHeightFn((x, z) => (Math.abs(x) < 1.25 && z < -7.0 && z > -9.4 ? 0.12 : 0));
  setSurfaceFn((x, z) => {
    if (Math.abs(x) < 1.25 && z < -7.0) {
      return 'marble';
    }
    if (x >= -1.0 && x <= 7.0 && z <= -1.0 && z >= -8.0) {
      return 'water';
    }
    return 'stone';
  });

  return {
    pos: V(0, 1.65, 5.5),
    yaw: 0,
    whisper: '湿冷的洞穴北壁嵌着一部黄铜磨砂玻璃小电梯，可以选去清晨后院或 B2 地下车库。',
  };
}

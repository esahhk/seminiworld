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

  scene.background = new T.Color(0x1b2630);
  scene.fog = new T.FogExp2(0x1e2c36, 0.022);
  scene.add(new T.HemisphereLight(0x88b4c9, 0x3b444a, 1.05));
  scene.add(new T.AmbientLight(0x526b7a, 0.72));

  const lantern = new T.PointLight(0xffc078, 2.3, 18);
  lantern.position.set(-1.35, 1.65, 2.5);
  scene.add(lantern);

  const southFill = new T.PointLight(0x7ca8be, 1.35, 18);
  southFill.position.set(0, 4.2, 10.5);
  scene.add(southFill);

  const poolGlow = new T.PointLight(0x57cce0, 1.65, 16);
  poolGlow.position.set(1.1, 1.35, -3.5);
  scene.add(poolGlow);

  const northFill = new T.PointLight(0x9bc4d4, 1.25, 15);
  northFill.position.set(0, 3.8, -8.2);
  scene.add(northFill);

  const rockTex = tex.concrete('#54606b', 0.24, 'cave_limestone');
  rockTex.repeat.set(3, 8);
  const rockMat = createMaterial({
    map: rockTex,
    roughness: 0.9,
    metalness: 0.06,
  });
  const wetRockMat = createMaterial({
    map: tex.concrete('#465460', 0.2, 'cave_wet'),
    roughness: 0.42,
    metalness: 0.14,
  });
  const shelfRockMat = createMaterial({
    color: 0x5c6973,
    roughness: 0.85,
  });
  const floorTex = tex.concrete('#4d575f', 0.22, 'cave_fl');
  floorTex.repeat.set(2, 9);
  const floorMat = createMaterial({
    map: floorTex,
    roughness: 0.62,
    metalness: 0.08,
  });

  addBox(8.0, 0.4, 30.0, floorMat, 0, -0.2, 2.0, true, false, true);
  addBox(8.4, 0.6, 30.0, rockMat, 0, 5.9, 2.0, false, false, false);

  addBox(1.2, 6.2, 30.0, rockMat, -3.4, 3.0, 2.0, true, false, true);
  addBox(1.2, 6.2, 30.0, rockMat, 3.4, 3.0, 2.0, true, false, true);
  addBox(8.2, 6.2, 1.4, rockMat, 0, 3.0, 15.8, true, false, true);
  addBox(2.5, 6.2, 1.2, rockMat, -2.55, 3.0, -11.4, true, false, true);
  addBox(2.5, 6.2, 1.2, rockMat, 2.55, 3.0, -11.4, true, false, true);
  addBox(2.9, 3.1, 1.2, rockMat, 0, 4.6, -11.4, true, false, true);

  const ribGeo = track(new T.BoxGeometry(0.95, 5.8, 1.8));
  const archGeo = track(new T.BoxGeometry(6.6, 0.85, 1.1));
  const stalactiteGeo = track(new T.ConeGeometry(0.22, 1.45, 6));
  const stalagmiteGeo = track(new T.ConeGeometry(0.24, 1.1, 6));
  const crystalGeo = track(new T.OctahedronGeometry(0.26, 0));
  const crystalMat = createMaterial({
    color: 0x7bdcf0,
    emissive: 0x2f8fa3,
    emissiveIntensity: 0.62,
    roughness: 0.22,
    metalness: 0.2,
  });

  for (let i = 0; i < 12; i++) {
    const rz = -9.5 + i * 2.2;
    const bulgeL = (i % 3 === 0 ? 0.35 : 0.12) + Math.sin(i * 1.7) * 0.12;
    const bulgeR = (i % 2 === 0 ? 0.32 : 0.1) + Math.cos(i * 1.3) * 0.12;

    const ribL = new T.Mesh(ribGeo, i % 2 === 0 ? rockMat : wetRockMat);
    ribL.position.set(-2.95 + bulgeL, 2.9, rz);
    ribL.rotation.y = Math.sin(i) * 0.14;
    ribL.receiveShadow = true;
    scene.add(ribL);

    const ribR = new T.Mesh(ribGeo, i % 2 === 1 ? rockMat : wetRockMat);
    ribR.position.set(2.95 - bulgeR, 2.9, rz);
    ribR.rotation.y = -Math.cos(i) * 0.14;
    ribR.receiveShadow = true;
    scene.add(ribR);

    if (i % 2 === 0) {
      const arch = new T.Mesh(archGeo, rockMat);
      arch.position.set(0, 5.45 - (i % 4 === 0 ? 0.25 : 0), rz);
      arch.rotation.z = Math.sin(i * 2.1) * 0.04;
      scene.add(arch);
    }

    for (const side of [-1, 1] as const) {
      const st = new T.Mesh(stalactiteGeo, shelfRockMat);
      const scaleY = 0.65 + ((i * 7 + (side > 0 ? 3 : 0)) % 5) * 0.2;
      st.scale.set(0.85, scaleY, 0.85);
      st.position.set(side * (1.75 + (i % 2) * 0.45), 5.65 - (1.45 * scaleY) / 2, rz + 0.35 * side);
      st.rotation.x = Math.PI;
      scene.add(st);
    }

    if (i % 3 === 1) {
      const sm = new T.Mesh(stalagmiteGeo, wetRockMat);
      sm.position.set(-2.35, 0.55, rz);
      scene.add(sm);
    }
    if (i % 4 === 2 && rz > 2.5) {
      const smR = new T.Mesh(stalagmiteGeo, wetRockMat);
      smR.scale.set(0.9, 1.25, 0.9);
      smR.position.set(2.35, 0.68, rz);
      scene.add(smR);
    }
  }

  const guideGlowMat = createMaterial({
    color: 0xffe0a8,
    emissive: 0xffa84c,
    emissiveIntensity: 0.95,
  });
  for (const gz of [11.0, 5.8, -1.2, -7.2]) {
    addBox(0.18, 0.26, 0.18, createMaterial({ color: 0x3b352d }), -2.35, 0.22, gz, false, false, false);
    addMesh(new T.SphereGeometry(0.065, 8, 8), guideGlowMat, -2.35, 0.38, gz, false, false);
  }

  addBox(1.85, 0.14, 9.2, wetRockMat, 1.65, 0.05, -3.0, false, false, true);
  const poolSurface = addMesh(
    new T.PlaneGeometry(1.55, 8.6),
    createMaterial({
      color: 0x2e8fa3,
      emissive: 0x1a5f70,
      emissiveIntensity: 0.68,
      roughness: 0.12,
      metalness: 0.18,
    }),
    1.65,
    0.135,
    -3.0,
    false,
    false,
  );
  poolSurface.rotation.x = -Math.PI / 2;

  for (const [cx, cy, cz, sc] of [
    [2.1, 0.35, -5.8, 1.15],
    [2.28, 0.26, -5.45, 0.72],
    [1.88, 0.24, -6.05, 0.65],
    [-2.15, 0.32, -4.4, 0.85],
  ] as [number, number, number, number][]) {
    const cr = new T.Mesh(crystalGeo, crystalMat);
    cr.scale.setScalar(sc);
    cr.position.set(cx, cy, cz);
    cr.rotation.set(0.2, cx * 2, 0.15);
    scene.add(cr);
  }

  addBox(0.68, 0.36, 0.68, shelfRockMat, -1.65, 0.18, 2.5, true, false, true);
  addCylinder(
    0.13,
    0.16,
    0.3,
    10,
    createMaterial({
      color: 0xe3a84f,
      emissive: 0xff9230,
      emissiveIntensity: 0.9,
    }),
    -1.65,
    0.51,
    2.5,
    false,
    false,
  );

  const brassMat = createMaterial({
    color: 0xc29e58,
    metalness: 0.72,
    roughness: 0.3,
  });
  const stoneFrameMat = createMaterial({
    color: 0x6f797e,
    roughness: 0.85,
  });
  const elevDoorZ = -11.1;
  addBox(0.22, 3.2, 0.22, brassMat, -1.35, 1.6, elevDoorZ, false, false, false);
  addBox(0.22, 3.2, 0.22, brassMat, 1.35, 1.6, elevDoorZ, false, false, false);
  addBox(2.92, 0.24, 0.24, brassMat, 0, 3.1, elevDoorZ, false, false, false);
  addBox(0.16, 3.2, 2.5, stoneFrameMat, -1.35, 1.6, elevDoorZ - 1.25, true, false, true);
  addBox(0.16, 3.2, 2.5, stoneFrameMat, 1.35, 1.6, elevDoorZ - 1.25, true, false, true);
  addBox(2.8, 3.2, 0.16, stoneFrameMat, 0, 1.6, elevDoorZ - 2.45, true, false, true);

  addBox(0.2, 0.36, 0.08, brassMat, 1.68, 1.25, elevDoorZ + 0.08, false, false, false);
  addBox(1.06, 0.5, 0.05, stoneFrameMat, 2.02, 1.9, elevDoorZ + 0.06, false, false, false);
  addSign(
    1.0,
    0.44,
    tex.sign('B4 · 电梯间', '#c8a45b', '#221a0f', '1F 后院 / B2 车库'),
    2.02,
    1.9,
    elevDoorZ + 0.1,
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
  const cWallMat = createMaterial({ color: 0xc2cbc6, roughness: 0.65 });
  const cBack = mkMesh(new T.BoxGeometry(2.4, 2.9, 0.14), cWallMat, 0, 1.48, -1.15, false, false);
  const cLeft = mkMesh(new T.BoxGeometry(0.14, 2.9, 2.3), cWallMat, -1.18, 1.48, 0, false, false);
  const cRight = mkMesh(new T.BoxGeometry(0.14, 2.9, 2.3), cWallMat, 1.18, 1.48, 0, false, false);
  const cDoor = mkMesh(
    new T.BoxGeometry(2.15, 2.72, 0.1),
    createMaterial({
      color: 0xdce6e4,
      transparent: true,
      opacity: 0.64,
      roughness: 0.32,
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
      emissiveIntensity: 0.72,
    }),
    0,
    2.78,
    0,
    false,
    false,
  );
  const elevLight = new T.PointLight(0xffdfb0, 0.95, 8);
  elevLight.position.set(0, 2.65, 0);
  elevCabin.add(cFloor, cCeil, cBack, cLeft, cRight, cDoor, cBulb, elevLight);
  elevCabin.position.set(0, 0, elevDoorZ - 1.2);
  scene.add(elevCabin);

  const doorColBottom = {
    minX: -1.15,
    maxX: 1.15,
    minZ: elevDoorZ - 0.08,
    maxZ: elevDoorZ + 0.08,
    minY: 0,
    maxY: 2.85,
    active: true,
  };
  colliders.push(doorColBottom);

  const spawnedInElev = !!state.pendingSpawn && state.pendingSpawn.pos.z < elevDoorZ - 0.1;
  let lanternHigh = true;
  let elevOpen = spawnedInElev;
  let elevPending = false;

  let wasOutsideCabin = !spawnedInElev;
  let autoClosedInCabin = false;

  if (spawnedInElev) {
    cDoor.position.x = 2.1;
    doorColBottom.active = false;
  }

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
        ? '磨砂玻璃门轻咔合上，小电梯稳稳升向清晨后院……'
        : '磨砂玻璃门轻咔合上，小电梯稳稳升往 B2 地下车库……',
    );
    addTimedRedirect(() => {
      elevPending = false;
      const idx = sceneIdxById(target);
      if (idx !== -1) {
        if (target === 'backyard') {
          state.pendingSpawn = { pos: V(0, 1.75, -7.8), yaw: Math.PI };
          loadScene(idx);
          showWhisper('磨砂玻璃门轻咔滑开，阳光照着的清晨后院和露水花草正迎面扑来。');
        } else {
          state.pendingSpawn = { pos: V(8.4, 1.75, 12.8), yaw: 0 };
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
      '黄铜面板亮着去往另外两层的按键，也可以直接打开电梯门走回溶洞：',
      [
        { label: '前往 1F · 博物馆清晨后院', fn: () => rideToFloor('backyard') },
        { label: '前往 B2 · 地下车库', fn: () => rideToFloor('garage') },
        {
          label: elevOpen ? '关闭电梯门' : '打开电梯门',
          fn: () => {
            elevOpen = !elevOpen;
            if (elevOpen) {
              autoClosedInCabin = true;
            }
            sfx.play('click');
            closeModal();
            showWhisper(elevOpen ? '磨砂玻璃门轻咔滑开。' : '玻璃门轻轻合拢。');
          },
        },
      ],
      { meta: '洞窟北侧小电梯' },
    );
  }

  updaters.push((dt, t) => {
    lantern.intensity = (lanternHigh ? 2.3 : 0.65) + Math.sin(t * 7) * 0.1;
    const insideCabin = Math.abs(player.pos.x) < 1.15 && player.pos.z < elevDoorZ - 0.45;
    if (!insideCabin) {
      wasOutsideCabin = true;
      autoClosedInCabin = false;
    } else if (wasOutsideCabin && elevOpen && !autoClosedInCabin && !elevPending) {

      elevOpen = false;
      autoClosedInCabin = true;
      sfx.play('click');
      showWhisper('走进轿厢后，磨砂玻璃门轻轻自动合上。按 [E] 选择楼层或开门。');
    }
    cDoor.position.x += ((elevOpen ? 2.1 : 0) - cDoor.position.x) * Math.min(1, dt * 4.5);
    doorColBottom.active = cDoor.position.x <= 1.1;
  });

  addInteract('cave_lantern', V(-1.65, 0.65, 2.5), '拧动露营煤油灯旋钮', '调亮或压暗洞内火光', () => {
    lanternHigh = !lanternHigh;
    sfx.play('switch');
    showWhisper(
      lanternHigh
        ? '暖黄灯光照亮两侧潮湿的岩壁和钟乳石，整条洞窟通道清清楚楚。'
        : '灯光压暗，右侧地下暗河泛出幽幽的蓝绿微光。',
    );
  });

  addInteract('cave_pool', V(1.4, 0.4, -3.0), '朝地下暗河投一颗小石子', '听回声在狭长洞壁荡开', () => {
    const stone = mkMesh(
      new T.SphereGeometry(0.04, 6, 6),
      createMaterial({ color: 0x9aa3ab }),
      player.pos.x,
      1.5,
      player.pos.z,
      false,
      false,
    );
    scene.add(stone);
    const sx = player.pos.x;
    const sz = player.pos.z;
    const t0 = performance.now();
    const iv = window.setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / 600);
      stone.position.set(
        sx + (1.6 - sx) * p,
        1.5 + (0.2 - 1.5) * p + Math.sin(p * Math.PI) * 0.9,
        sz + (-3.0 - sz) * p,
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
        showWhisper('咚——水声在狭长的石壁间来回荡了三四次才慢慢散掉。');
      }
    }, 16);
    activeIntervals.push(iv);
  });

  addInteract(
    'cave_elev_btn',
    V(1.68, 1.25, elevDoorZ + 0.35),
    '按小电梯门外按钮',
    '打开磨砂玻璃门',
    () => {
      if (elevPending) {
        return;
      }
      if (!elevOpen) {
        elevOpen = true;
        sfx.play('click');
        showWhisper('磨砂玻璃门轻咔滑开，走进去门会自动合上。');
      } else {
        showWhisper('电梯门已经开着，直接走进去即可。');
      }
    },
    { radius: 0.85 },
  );
  addInteract(
    'cave_elev_in',
    V(0, 1.55, elevDoorZ - 0.7),
    '按下电梯楼层按键',
    '选择前往 1F 清晨后院、B2 地下车库或开门',
    openFloorChoices,
    { radius: 1.05 },
  );

  addCollectible('cave', 1.85, 0.95, -5.8, 0xe6be9c);
  setBounds({ minX: -2.4, maxX: 2.4, minZ: -13.1, maxZ: 14.2 });
  setHeightFn((x, z) => (Math.abs(x) < 1.25 && z < elevDoorZ && z > elevDoorZ - 2.4 ? 0.12 : 0));
  setSurfaceFn((x, z) => {
    if (Math.abs(x) < 1.25 && z < elevDoorZ) {
      return 'marble';
    }
    if (x >= 0.8 && x <= 2.4 && z <= 1.5 && z >= -7.5) {
      return 'water';
    }
    return 'stone';
  });

  return {
    pos: V(-0.2, 1.65, 11.8),
    yaw: 0,
    whisper: '这是一条四人宽的狭长石灰岩洞窟，右侧暗河泛着微光，尽头嵌着一部黄铜小电梯。',
  };
}

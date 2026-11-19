import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';

export function buildGarageScene(ctx: SceneContext): SceneInitResult {
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
    syncColX,
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

  scene.background = new T.Color(0x343c45);
  scene.fog = new T.FogExp2(0x343c45, 0.012);
  scene.add(new T.HemisphereLight(0xd8e5f0, 0x67707a, 1.25));
  scene.add(new T.AmbientLight(0x9caab8, 1.1));
  const tube1 = new T.PointLight(0xeef6fa, 1.65, 28);
  tube1.position.set(0, 3.2, -4);
  scene.add(tube1);
  const tube2 = new T.PointLight(0xf2d7a4, 1.45, 26);
  tube2.position.set(-6, 3.2, 5);
  scene.add(tube2);
  const tube3 = new T.PointLight(0xeef6fa, 1.45, 26);
  tube3.position.set(6, 3.2, 5);
  scene.add(tube3);
  const tube4 = new T.PointLight(0xffe7b8, 1.5, 24);
  tube4.position.set(0, 3.8, -12.5);
  scene.add(tube4);
  const tube5 = new T.PointLight(0xeef6fa, 1.35, 24);
  tube5.position.set(-6, 3.2, -5);
  scene.add(tube5);
  const tube6 = new T.PointLight(0xeef6fa, 1.35, 24);
  tube6.position.set(6, 3.2, -5);
  scene.add(tube6);
  const lampMat = createMaterial({
    color: 0xffffff,
    emissive: 0xeaf4fa,
    emissiveIntensity: 1.45,
  });
  for (const [lx, lz] of [
    [0, -4],
    [-6, 5],
    [6, 5],
    [-6, -5],
    [6, -5],
    [0, -11.5],
  ]) {
    addBox(2.4, 0.08, 0.24, lampMat, lx, 3.55, lz, false, false, false);
  }
  const gTex = tex.concrete('#6f747b', 0.16, 'gar');
  gTex.repeat.set(6, 6);
  addBox(
    24,
    0.2,
    24,
    createMaterial({ map: gTex, roughness: 0.52, metalness: 0.08 }),
    0,
    -0.1,
    0,
    true,
    false,
    true,
  );
  addBox(
    24,
    0.3,
    24,
    createMaterial({ color: 0x5c626a, roughness: 0.92 }),
    0,
    3.7,
    0,
    false,
  );
  const wallMat = createMaterial({ color: 0x767c84, roughness: 0.88 });
  addBox(9.6, 3.8, 0.3, wallMat, -7.2, 1.9, -12, true);
  addBox(9.6, 3.8, 0.3, wallMat, 7.2, 1.9, -12, true);
  addBox(0.3, 3.8, 24, wallMat, -12, 1.9, 0, true);
  addBox(0.3, 3.8, 24, wallMat, 12, 1.9, 0, true);
  addBox(19.2, 3.8, 0.3, wallMat, -2.4, 1.9, 12, true);
  addBox(2.4, 3.8, 0.3, wallMat, 10.8, 1.9, 12, true);
  addBox(2.6, 0.9, 0.3, wallMat, 8.4, 3.35, 12, true);

  const steelMat = createMaterial({
    color: 0x535a61,
    metalness: 0.6,
    roughness: 0.5,
  });
  addBox(2.6, 0.12, 2.2, steelMat, 8.4, 0.04, 13.0, false, true, true);
  addBox(2.6, 0.16, 2.2, steelMat, 8.4, 2.95, 13.0, false);
  addBox(2.6, 3.0, 0.2, steelMat, 8.4, 1.5, 14.1, true);
  addBox(0.2, 3.0, 2.2, steelMat, 7.2, 1.5, 13.0, true);
  addBox(0.2, 3.0, 2.2, steelMat, 9.6, 1.5, 13.0, true);
  const garElevL = addBox(
    1.12,
    2.8,
    0.12,
    createMaterial({ color: 0x6c747d, metalness: 0.55, roughness: 0.45 }),
    7.84,
    1.4,
    11.95,
    true,
  );
  const garElevR = addBox(
    1.12,
    2.8,
    0.12,
    createMaterial({ color: 0x6c747d, metalness: 0.55, roughness: 0.45 }),
    8.96,
    1.4,
    11.95,
    true,
  );
  const garElevLamp = new T.PointLight(0xffcb78, 0.9, 7);
  garElevLamp.position.set(8.4, 2.65, 13.0);
  scene.add(garElevLamp);
  const garElevBulb = addMesh(
    new T.SphereGeometry(0.1, 8, 8),
    createMaterial({
      color: 0xffc86b,
      emissive: 0xff9b24,
      emissiveIntensity: 0.6,
    }),
    8.4,
    2.95,
    11.82,
    false,
    false,
  );
  addSign(
    1.55,
    0.58,
    tex.sign('B2 · 电梯间', '#3b3024', '#e8b658', '1F 后院 / B4 溶洞'),
    8.4,
    3.25,
    11.82,
    Math.PI,
  );
  addBox(
    0.26,
    0.4,
    0.1,
    createMaterial({ color: 0x3b4046 }),
    6.85,
    1.25,
    11.82,
    false,
  );
  const callBtnLed = addMesh(
    new T.SphereGeometry(0.045, 8, 8),
    createMaterial({
      color: 0xff9933,
      emissive: 0xff6600,
      emissiveIntensity: 0.25,
    }),
    6.85,
    1.25,
    11.75,
    false,
    false,
  );
  addBox(
    0.22,
    0.35,
    0.1,
    createMaterial({ color: 0x3b4046 }),
    7.36,
    1.25,
    13.0,
    false,
  );

  const haz = tex.hazard();
  const rampMat = createMaterial({ color: 0x62676d, roughness: 0.85 });
  addBox(0.35, 4.4, 6.4, wallMat, -2.55, 2.2, -13.2, true);
  addBox(0.35, 4.4, 6.4, wallMat, 2.55, 2.2, -13.2, true);
  addBox(5.45, 0.35, 6.6, rampMat, 0, 4.6, -13.2, false).rotation.x = 0.28;
  const rampFloor = addBox(
    4.75,
    0.22,
    6.6,
    createMaterial({ map: tex.concrete('#676b70', 0.2, 'ramp_f') }),
    0,
    0.85,
    -13.2,
    false,
    true,
    true,
  );
  rampFloor.rotation.x = 0.28;
  for (let r = 0; r < 9; r++) {
    const rz = -10.5 - r * 0.62;
    const ry = 0.08 + r * 0.18;
    addBox(
      4.2,
      0.04,
      0.14,
      createMaterial({ color: 0xd9ba43 }),
      0,
      ry,
      rz,
      false,
    );
  }
  addBox(
    0.22,
    0.45,
    6.2,
    createMaterial({ map: haz }),
    -2.25,
    1.15,
    -13.2,
    false,
  ).rotation.x = 0.28;
  addBox(
    0.22,
    0.45,
    6.2,
    createMaterial({ map: haz }),
    2.25,
    1.15,
    -13.2,
    false,
  ).rotation.x = 0.28;
  addBox(
    4.8,
    3.6,
    0.25,
    createMaterial({
      color: 0xb8ccd6,
      emissive: 0x69828f,
      emissiveIntensity: 0.55,
    }),
    0,
    2.6,
    -16.4,
    false,
  );
  addSign(
    3.2,
    0.72,
    tex.sign(
      '↑ 地面出口 往小区停车场',
      '#d8c892',
      '#1e2022',
      '顺坡道走上去直达地面',
    ),
    0,
    3.15,
    -11.82,
  );

  for (const [cx, cz] of [
    [-5, -4],
    [5, -4],
    [-5, 4],
    [5, 4],
  ]) {
    addBox(
      0.75,
      2.6,
      0.75,
      createMaterial({ color: 0x72767a, roughness: 0.9 }),
      cx,
      2.3,
      cz,
      true,
    );
    addBox(
      0.77,
      1.0,
      0.77,
      createMaterial({ map: haz, roughness: 0.75 }),
      cx,
      0.5,
      cz,
      false,
    );
  }
  addSign(
    0.7,
    0.7,
    tex.sign('B2 08', '#d4ad33', '#1a1a18', '消防通道勿停'),
    -5,
    1.8,
    -3.6,
  );
  addBox(5.5, 0.08, 0.35, createMaterial({ map: haz }), 0, 0.04, 0, false);
  addCylinder(
    0.14,
    0.14,
    22,
    8,
    createMaterial({ color: 0x6c737a, metalness: 0.4 }),
    -3,
    3.35,
    0,
  ).rotation.x = Math.PI / 2;
  addCylinder(
    0.1,
    0.1,
    22,
    8,
    createMaterial({ color: 0x9c4232, metalness: 0.3 }),
    3,
    3.4,
    0,
  ).rotation.x = Math.PI / 2;
  addBox(
    0.65,
    0.9,
    0.22,
    createMaterial({ color: 0xa82e24 }),
    5.4,
    1.35,
    -4,
    false,
  );
  const carMat = createMaterial({
    color: 0x3b4d5c,
    roughness: 0.35,
    metalness: 0.5,
  });
  addBox(1.85, 0.7, 4.2, carMat, 8.2, 0.55, -5.5, true);
  addBox(1.6, 0.55, 2.1, carMat, 8.2, 1.15, -5.3, true);
  const carLight = new T.SpotLight(0xfff2cf, 0, 18, 0.5, 0.6);
  carLight.position.set(8.2, 0.65, -3.3);
  carLight.target.position.set(8.2, 0.2, 6);
  scene.add(carLight);
  scene.add(carLight.target);
  const gateGeo = new T.BoxGeometry(3.8, 0.1, 0.1);
  gateGeo.translate(1.8, 0, 0);
  const gateArm = addMesh(
    gateGeo,
    createMaterial({ map: haz }),
    -8.5,
    1.0,
    2,
    true,
    false,
  );
  const gateCol = {
    minX: -8.5,
    maxX: -4.9,
    minZ: 1.85,
    maxZ: 2.15,
    minY: 0.2,
    maxY: 1.8,
    mesh: gateArm,
    active: true,
  };
  colliders.push(gateCol);
  addBox(
    0.4,
    1.2,
    0.4,
    createMaterial({ color: 0xc98b2c }),
    -8.7,
    0.6,
    2,
    true,
  );
  const spawnedInElev = !!state.pendingSpawn && state.pendingSpawn.pos.z > 11.5;
  let gateUp = false;
  let flicker = false;
  let carOn = false;
  let exitedToPark = false;
  let freightOpen = spawnedInElev;
  let freightRiding = false;
  let wasOutsideCabin = !spawnedInElev;
  if (spawnedInElev) {
    garElevL.position.x = 6.8;
    garElevR.position.x = 10.0;
    syncColX(garElevL, 0.56);
    syncColX(garElevR, 0.56);
  }
  updaters.push((dt, t) => {
    const inCabin = player.pos.x > 7.25 && player.pos.x < 9.55 && player.pos.z > 12.15;
    if (!inCabin && player.pos.z < 11.6) {
      wasOutsideCabin = true;
    }
    if (inCabin && wasOutsideCabin && freightOpen && !freightRiding) {
      freightOpen = false;
      wasOutsideCabin = false;
      sfx.play('door');
      showWhisper('走进轿厢后，电梯门自动合拢；按 [E] 选择楼层或重新开门。');
    }
    gateArm.rotation.z +=
      ((gateUp ? 1.15 : 0) - gateArm.rotation.z) * Math.min(1, dt * 5);
    gateCol.active = gateArm.rotation.z < 0.55;
    if (flicker) {
      tube1.intensity = Math.sin(t * 37) > 0.86 ? 0.4 : 1.25;
    }
    const targetLx = freightOpen ? 6.8 : 7.84;
    const targetRx = freightOpen ? 10.0 : 8.96;
    garElevL.position.x +=
      (targetLx - garElevL.position.x) * Math.min(1, dt * 4.5);
    garElevR.position.x +=
      (targetRx - garElevR.position.x) * Math.min(1, dt * 4.5);
    syncColX(garElevL, 0.56);
    syncColX(garElevR, 0.56);
    (
      garElevBulb.material as InstanceType<typeof T.MeshStandardMaterial>
    ).emissiveIntensity = freightOpen ? 1.3 : 0.5 + Math.sin(t * 14) * 0.2;
    if (
      !exitedToPark &&
      Math.abs(player.pos.x) < 2.2 &&
      player.pos.z <= -14.8
    ) {
      exitedToPark = true;
      const pi = sceneIdxById('park_lot');
      if (pi !== -1) {
        state.pendingSpawn = { pos: V(0, 1.71, -8.8), yaw: Math.PI };
        sfx.play('door');
        loadScene(pi);
        showWhisper('顺着坡道走出了地下车库，外面满眼都是大花和树荫。');
      }
    }
  });
  setHeightFn((x, z) => {
    if (Math.abs(x) < 2.35 && z < -10.0) {
      return Math.min(1.8, Math.max(0, (-10.0 - z) * 0.285));
    }
    if (x > 7.2 && x < 9.6 && z > 11.8) {
      return 0.1;
    }
    return 0;
  });
  addInteract(
    'gar_elev_call',
    V(6.85, 1.25, 11.6),
    '打开电梯门',
    '打开电梯门进入轿厢',
    () => {
      if (freightRiding) {
        return;
      }
      freightOpen = !freightOpen;
      (
        callBtnLed.material as InstanceType<typeof T.MeshStandardMaterial>
      ).emissiveIntensity = freightOpen ? 1.5 : 0.25;
      sfx.play('door');
      showWhisper(
        freightOpen
          ? '电梯门沿着滑轨滑开，走进去后门会自动关上。'
          : '电梯门合拢了。',
      );
    },
    {
      radius: 0.9,
      getLabel: () => (freightOpen ? '关闭电梯门' : '打开电梯门'),
    },
  );
  const rideGarageElevator = (target: 'backyard' | 'cave') => {
    if (freightRiding) {
      return;
    }
    freightRiding = true;
    closeModal();
    freightOpen = false;
    sfx.play('door');
    showWhisper(
      target === 'backyard'
        ? '电梯门合上，轿厢稳稳升向 1F 博物馆后院……'
        : '电梯门合上，轿厢往 B4 洞窟沉了下去……',
    );
    addTimedRedirect(() => {
      freightRiding = false;
      const idx = sceneIdxById(target);
      if (idx !== -1) {
        if (target === 'backyard') {
          state.pendingSpawn = { pos: V(0, 1.75, -7.8), yaw: Math.PI };
          loadScene(idx);
          showWhisper('磨砂玻璃门轻咔滑开，清晨后院的冷亮空气与青草味扑面而来。');
        } else {
          state.pendingSpawn = { pos: V(0, 1.77, -12.1), yaw: Math.PI };
          loadScene(idx);
          showWhisper('停稳在 B4 幽深洞穴北端的黄铜小电梯里，前方就是狭长洞道。');
        }
      }
    }, 700);
  };
  addInteract(
    'gar_elev_go',
    V(8.4, 1.45, 12.45),
    '按下轿厢楼层按键',
    '选择前往 1F 清晨后院、B4 幽深洞穴或开关门',
    () => {
      if (freightRiding) {
        return;
      }
      sfx.play('click');
      openModal(
        'B2 · 电梯楼层选择',
        '这部电梯上行直达阳光清爽的博物馆后院，下行直达湿冷的 B4 幽深洞穴。请选择楼层或开关电梯门：',
        [
          { label: '前往 1F · 博物馆清晨后院', fn: () => rideGarageElevator('backyard') },
          { label: '前往 B4 · 幽深洞穴', fn: () => rideGarageElevator('cave') },
          {
            label: freightOpen ? '关闭电梯门' : '打开电梯门',
            fn: () => {
              freightOpen = !freightOpen;
              wasOutsideCabin = false;
              sfx.play('door');
              closeModal();
            },
          },
        ],
        { meta: 'B2 地下车库电梯' },
      );
    },
    { radius: 1.4 },
  );
  addInteract(
    'gar_gate',
    V(-8.5, 1.0, 2.3),
    '刷卡抬起车库道闸',
    '道闸升起后可直接穿行',
    () => {
      gateUp = !gateUp;
      sfx.play('door');
      showWhisper(
        gateUp ? '道闸缓缓抬起，下面现在可以直接走过去。' : '道闸落下，红灯慢吞吞地闪着。',
      );
    },
    {
      getLabel: () => (gateUp ? '刷卡落下车库道闸' : '刷卡抬起车库道闸'),
    },
  );
  addInteract('gar_car', V(7.1, 0.9, -4.5), '敲敲停着的旧轿车', '闪一下车大灯', () => {
    carOn = !carOn;
    carLight.intensity = carOn ? 2.4 : 0;
    sfx.play('chime');
    showWhisper(
      carOn ? '大灯啪地照亮潮湿的地面，水洼反着光。' : '车灯熄灭，水泥墙面退回阴影里。',
    );
  });
  addInteract(
    'gar_light',
    V(-4.5, 1.5, -3.8),
    '按墙柱上的照明开关',
    '切换头顶灯管接触模式',
    () => {
      flicker = !flicker;
      tube1.intensity = 1.25;
      sfx.play('switch');
      showWhisper(
        flicker ? '灯管接触不良，又开始吱吱地跳闪。' : '白光稳稳亮着，整个地下车库亮堂了不少。',
      );
    },
  );
  addCollectible('garage', -8.2, 0.3, 1.5, 0xc7b588);
  setBounds({ minX: -11, maxX: 11, minZ: -15.6, maxZ: 13.6 });
  setSurfaceFn((x, z) => (x > 7.2 && z > 11.8 ? 'metal' : 'concrete'));
  return {
    pos: V(0, 1.65, 7.5),
    yaw: 0,
    whisper: '亮堂了不少的地下车库里，南墙角落的电梯可以选去清晨后院或 B4 洞穴。',
  };
}

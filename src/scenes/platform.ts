import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';

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
    addSign,
    createMaterial,
    addInteract,
    addCollectible,
    updaters,
    showWhisper,
    openModal,
    setBounds,
    setSurfaceFn,
  } = ctx;

  scene.background = new T.Color(0x9fb3c4);
  scene.fog = new T.FogExp2(0x9fb3c4, 0.017);
  scene.add(new T.HemisphereLight(0xdce9f5, 0x59656f, 0.9));
  const sun = new T.DirectionalLight(0xfff4df, 1.1);
  sun.position.set(18, 28, 14);
  sun.castShadow = true;
  scene.add(sun);
  const deckTex = tex.concrete('#8c8f91', 0.18, 'plat');
  deckTex.repeat.set(6, 6);
  addBox(
    16,
    1.2,
    16,
    createMaterial({
      map: deckTex,
      roughness: 0.88,
    }),
    0,
    -0.6,
    0,
    true,
    false,
    true,
  );
  addBox(
    16.3,
    0.22,
    16.3,
    createMaterial({
      color: 0x5d6268,
      roughness: 0.7,
      metalness: 0.3,
    }),
    0,
    -0.1,
    0,
    false,
  );
  for (let i = -7.5; i <= 7.5; i += 2.5) {
    addBox(
      0.08,
      1.1,
      0.08,
      createMaterial({ color: 0x4b5156, metalness: 0.5 }),
      i,
      0.55,
      -7.8,
      false,
    );
    addBox(
      0.08,
      1.1,
      0.08,
      createMaterial({ color: 0x4b5156, metalness: 0.5 }),
      i,
      0.55,
      7.8,
      false,
    );
    addBox(
      0.08,
      1.1,
      0.08,
      createMaterial({ color: 0x4b5156, metalness: 0.5 }),
      -7.8,
      0.55,
      i,
      false,
    );
    addBox(
      0.08,
      1.1,
      0.08,
      createMaterial({ color: 0x4b5156, metalness: 0.5 }),
      7.8,
      0.55,
      i,
      false,
    );
  }
  addBox(
    15.8,
    0.06,
    0.06,
    createMaterial({ color: 0x6e757b, metalness: 0.6 }),
    0,
    1.08,
    -7.8,
    true,
  );
  addBox(
    15.8,
    0.06,
    0.06,
    createMaterial({ color: 0x6e757b, metalness: 0.6 }),
    0,
    1.08,
    7.8,
    true,
  );
  addBox(
    0.06,
    0.06,
    15.8,
    createMaterial({ color: 0x6e757b, metalness: 0.6 }),
    -7.8,
    1.08,
    0,
    true,
  );
  addBox(
    0.06,
    0.06,
    15.8,
    createMaterial({ color: 0x6e757b, metalness: 0.6 }),
    7.8,
    1.08,
    0,
    true,
  );
  addBox(
    2.4,
    1.6,
    2.8,
    createMaterial({ map: tex.concrete('#696c6e', 0.2, 'p_shed') }),
    -5.8,
    0.8,
    5.6,
    true,
  );
  addBox(
    1.1,
    2.0,
    0.08,
    createMaterial({ color: 0x435159, metalness: 0.4 }),
    -5.8,
    1.0,
    4.16,
    false,
  );

  addBox(
    1.1,
    0.9,
    0.78,
    createMaterial({ color: 0x9c9e9b, roughness: 0.65 }),
    -5.5,
    0.45,
    -3.35,
    true,
  );
  const shroudMat = createMaterial({
    map: tex.concrete('#bfc3c7', 0.1, 'fan_sh'),
    roughness: 0.55,
    metalness: 0.22,
    side: T.DoubleSide,
  });
  addMesh(
    new T.CylinderGeometry(
      0.46,
      0.46,
      0.74,
      18,
      1,
      true,
      Math.PI * 0.5,
      Math.PI,
    ),
    shroudMat,
    -5.5,
    0.48,
    -3.02,
    true,
    true,
  );
  addMesh(
    new T.CylinderGeometry(
      0.47,
      0.47,
      0.04,
      18,
      1,
      false,
      Math.PI * 0.5,
      Math.PI,
    ),
    shroudMat,
    -5.5,
    0.86,
    -3.02,
    false,
    false,
  );
  addMesh(
    new T.CylinderGeometry(
      0.47,
      0.47,
      0.04,
      18,
      1,
      false,
      Math.PI * 0.5,
      Math.PI,
    ),
    shroudMat,
    -5.5,
    0.1,
    -3.02,
    false,
    false,
  );
  addBox(0.05, 0.74, 0.12, shroudMat, -5.94, 0.48, -3.0, false);
  addBox(0.05, 0.74, 0.12, shroudMat, -5.06, 0.48, -3.0, false);

  const fanRotor = new T.Group();
  fanRotor.position.set(-5.5, 0.48, -3.02);
  const axleMesh = mkMesh(
    new T.CylinderGeometry(0.036, 0.036, 0.66, 8),
    createMaterial({ color: 0x494f57, metalness: 0.65, roughness: 0.35 }),
    0,
    0,
    0,
    false,
    false,
  );
  fanRotor.add(axleMesh);
  const bladeGeo = track(new T.BoxGeometry(0.11, 0.58, 0.015));
  const bladeMat = createMaterial({
    color: 0x626b75,
    metalness: 0.55,
    roughness: 0.32,
  });
  for (let b = 0; b < 6; b++) {
    const ang = (b / 6) * Math.PI * 2;
    const bl = mkMesh(
      bladeGeo,
      bladeMat,
      Math.cos(ang) * 0.24,
      0,
      Math.sin(ang) * 0.24,
      false,
      false,
    );
    bl.rotation.y = -ang + 0.38;
    fanRotor.add(bl);
  }
  scene.add(fanRotor);

  addBox(
    1.5,
    0.45,
    0.48,
    createMaterial({ color: 0x6b5d4e }),
    3.2,
    0.23,
    4.2,
    true,
  );
  addSign(
    1.5,
    0.75,
    tex.sign('高空注意阵风', '#d9c37a', '#24221d', '天台 214m', true),
    -3,
    1.25,
    -7.72,
  );
  for (let i = 0; i < 16; i++) {
    const bh = 8 + Math.random() * 26;
    const bx = (Math.random() - 0.5) * 135;
    const bz = (Math.random() - 0.5) * 135;
    if (Math.abs(bx) < 18 && Math.abs(bz) < 18) {
      continue;
    }
    addBox(
      8 + Math.random() * 7,
      bh,
      8 + Math.random() * 7,
      createMaterial({ color: 0x6d7985, roughness: 0.95 }),
      bx,
      -22 + bh / 2,
      bz,
      false,
      false,
      false,
    );
  }
  addCylinder(
    0.06,
    0.08,
    3.2,
    8,
    createMaterial({ color: 0x82868a, metalness: 0.5 }),
    5.5,
    1.6,
    -5.5,
  );
  const vane = addMesh(
    new T.ConeGeometry(0.18, 0.9, 8),
    createMaterial({ color: 0xc9623b, roughness: 0.7 }),
    5.9,
    3.05,
    -5.5,
  );
  let windFast = false;
  updaters.push((dt, t) => {
    vane.rotation.z =
      -Math.PI / 2 + Math.sin(t * (windFast ? 6.5 : 2.2)) * 0.22 + 0.4;
    fanRotor.rotation.y += dt * (windFast ? 11.5 : 4.2);
  });
  addBox(
    0.14,
    1.3,
    0.14,
    createMaterial({ color: 0x3f4348, metalness: 0.6 }),
    0,
    0.65,
    -7.1,
    true,
  );
  addCylinder(
    0.09,
    0.12,
    0.55,
    10,
    createMaterial({ color: 0x2b2e33, metalness: 0.7, roughness: 0.3 }),
    0,
    1.38,
    -7.1,
  ).rotation.x = Math.PI / 2 - 0.12;
  addInteract(
    'plat_scope',
    V(0, 1.3, -7.1),
    '用观景望远镜远眺',
    '切换远景焦距',
    () => {
      state.zoomActive = !state.zoomActive;
      camera.fov = state.zoomActive ? 30 : state.fov;
      camera.updateProjectionMatrix();
      sfx.play('switch');
      showWhisper(
        state.zoomActive
          ? '远处的楼群和云影被拉近，风声好像轻了些。'
          : '收回视线，脚下水泥地晒出了淡淡的灰白。',
      );
    },
  );
  addBox(
    0.7,
    0.9,
    0.5,
    createMaterial({ color: 0x555d63, roughness: 0.6 }),
    5.5,
    0.45,
    -5.5,
    true,
  );
  function toggleWind() {
    windFast = !windFast;
    sfx.play('chime');
    showWhisper(
      windFast
        ? '风向袋呼啦一下拉直，半圆壳里的风机叶片转得更密了。'
        : '风势落回平缓，风机叶片慢下来，能看清每片叶轮错着闪过去。',
    );
  }
  addInteract(
    'plat_wind',
    V(5.5, 0.9, -5.5),
    '拨动风速风向仪',
    '切换风力挡位',
    toggleWind,
  );
  addInteract(
    'plat_fan',
    V(-5.5, 0.6, -3.0),
    '调整排风机转速挡位',
    '切换风机叶轮快慢',
    toggleWind,
  );
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

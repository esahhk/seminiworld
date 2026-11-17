import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';

export function buildHellstoneScene(ctx: SceneContext): SceneInitResult {
  const {
    T,
    scene,
    tex,
    sfx,
    V,
    track,
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
    setHeightFn,
    setSurfaceFn,
  } = ctx;

  scene.background = new T.Color(0x22100c);
  scene.fog = new T.FogExp2(0x28120e, 0.03);
  scene.add(new T.AmbientLight(0x6e2f23, 1.05));
  scene.add(new T.HemisphereLight(0x8c4c3a, 0x361610, 0.72));
  const lavaLight = new T.PointLight(0xff5a24, 2.4, 32);
  lavaLight.position.set(0, 3.4, 0);
  scene.add(lavaLight);
  const sideGlow = new T.PointLight(0xd94218, 1.35, 20);
  sideGlow.position.set(-8.5, 2.0, 5.5);
  scene.add(sideGlow);
  const springGlow = new T.PointLight(0x94c2b8, 0.85, 14);
  springGlow.position.set(8.2, 1.6, -5.8);
  scene.add(springGlow);
  const frontFill = new T.PointLight(0xd47852, 0.95, 22);
  frontFill.position.set(0, 2.8, 5.2);
  scene.add(frontFill);

  const lavaTex = tex.lava();
  lavaTex.repeat.set(5, 5);
  addBox(
    14,
    1.2,
    14,
    createMaterial({
      map: lavaTex,
      roughness: 0.9,
      emissive: 0x6e1a07,
      emissiveIntensity: 0.45,
    }),
    0,
    -0.6,
    0,
    true,
    false,
    true,
  );
  addMesh(
    new T.PlaneGeometry(90, 90),
    createMaterial({
      color: 0x6a1b08,
      emissive: 0xc93b12,
      emissiveIntensity: 0.65,
      roughness: 0.9,
    }),
    0,
    -1.8,
    0,
    false,
    false,
  ).rotation.x = -Math.PI / 2;

  const lowShelfMat = createMaterial({
    map: tex.concrete('#463230', 0.25, 'hell_low'),
    roughness: 0.9,
  });
  addBox(5.5, 1.0, 16, lowShelfMat, -9.5, -0.85, 0, true, false, true);
  addBox(5.5, 1.0, 16, lowShelfMat, 9.5, -0.85, 0, true, false, true);
  addBox(16, 1.0, 5.5, lowShelfMat, 0, -0.85, -9.5, true, false, true);
  addBox(16, 1.0, 5.5, lowShelfMat, 0, -0.85, 9.5, true, false, true);

  const highShelfMat = createMaterial({ color: 0x3b2825, roughness: 0.9 });
  addBox(5.6, 0.45, 5.6, highShelfMat, -8.5, 0.225, 6.2, false, true, true);
  addBox(2.0, 0.22, 1.8, highShelfMat, -6.2, -0.1, 6.2, false, true, true);

  const crackMats: InstanceType<typeof T.MeshStandardMaterial>[] = [];
  for (const [cx, cz, len, ang] of [
    [-2.2, 1.6, 4.8, 0.4],
    [2.4, -1.2, 5.2, -0.6],
    [-8.8, -3.5, 3.6, 1.1],
    [8.6, 0.4, 4.1, -0.3],
  ]) {
    const cm = createMaterial({
      color: 0xff5e24,
      emissive: 0xff4212,
      emissiveIntensity: 0.95,
    });
    crackMats.push(cm);
    const cr = addBox(len, 0.04, 0.14, cm, cx, 0.01, cz, false, false, false);
    cr.rotation.y = ang;
  }
  addBox(
    1.8,
    0.03,
    1.3,
    createMaterial({ color: 0xc9b458, roughness: 0.95 }),
    3.8,
    0.015,
    -2.5,
    false,
  );
  addBox(
    1.5,
    0.03,
    1.2,
    createMaterial({ color: 0xd4cfc4, roughness: 0.95 }),
    -3.2,
    0.015,
    3.6,
    false,
  );

  const obsMat = createMaterial({
    map: tex.concrete('#5c494b', 0.24, 'hell_obs'),
    roughness: 0.78,
    metalness: 0.06,
  });
  addBox(2.2, 4.5, 2.2, obsMat, -4.5, 2.25, -4.5, true);
  addBox(1.8, 3.6, 1.8, obsMat, 4.8, 1.8, -4.2, true);
  addBox(2.8, 0.45, 2.4, obsMat, 0, 0.22, -4.5, false, true, true);
  addBox(1.4, 0.65, 1.4, obsMat, 0, 0.75, -4.5, true);
  addBox(1.2, 2.2, 1.2, obsMat, -5.2, 1.1, 3.5, true);
  addBox(1.0, 1.5, 1.0, obsMat, 5.2, 0.75, 3.2, true);
  addBox(1.6, 2.8, 1.6, obsMat, -10.4, 1.4, -7.2, true);
  addBox(1.5, 2.4, 1.5, obsMat, 10.2, 1.2, 7.6, true);

  addCylinder(
    1.5,
    1.7,
    0.25,
    14,
    createMaterial({ color: 0x45342d, roughness: 0.9 }),
    8.2,
    -0.28,
    -5.8,
    false,
    true,
  );
  const springWater = addCylinder(
    1.25,
    1.25,
    0.06,
    14,
    createMaterial({
      color: 0x3b7275,
      emissive: 0x2a544f,
      emissiveIntensity: 0.35,
      roughness: 0.15,
    }),
    8.2,
    -0.18,
    -5.8,
    false,
    false,
  );
  const steams: {
    m: ReturnType<typeof addMesh>;
    p: number;
    bx: number;
    bz: number;
    by: number;
  }[] = [];
  const steamGeo = track(new T.DodecahedronGeometry(0.32, 0));
  const steamMat = createMaterial({
    color: 0xe6e0da,
    emissive: 0x6b5a52,
    emissiveIntensity: 0.25,
    transparent: true,
    opacity: 0.28,
    roughness: 1,
  });
  for (let i = 0; i < 12; i++) {
    const isVent = i >= 7;
    steams.push({
      m: addMesh(
        steamGeo,
        steamMat,
        isVent ? -8.2 : 8.2,
        isVent ? 0.0 : -0.1,
        isVent ? 1.2 : -5.8,
        false,
        false,
      ),
      p: Math.random(),
      bx: isVent ? -8.2 : 8.2,
      bz: isVent ? 1.2 : -5.8,
      by: isVent ? -0.2 : -0.15,
    });
  }

  const rustMat = createMaterial({
    color: 0x85684d,
    metalness: 0.35,
    roughness: 0.68,
  });
  addBox(0.98, 0.56, 0.68, rustMat, 8.6, -0.07, 2.6, true);
  addBox(
    1.0,
    0.1,
    0.7,
    createMaterial({ color: 0xd9cfb8, roughness: 0.8 }),
    8.6,
    0.04,
    2.6,
    false,
  );
  addBox(
    0.16,
    0.1,
    0.06,
    createMaterial({ color: 0xd1b36b, metalness: 0.7, roughness: 0.3 }),
    8.6,
    0.16,
    2.24,
    false,
  );
  addCylinder(
    0.045,
    0.045,
    0.2,
    8,
    createMaterial({
      color: 0xa6d8e0,
      emissive: 0x45737d,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.75,
    }),
    8.45,
    0.31,
    2.55,
  );
  addCylinder(
    0.045,
    0.045,
    0.2,
    8,
    createMaterial({
      color: 0xa6d8e0,
      emissive: 0x45737d,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.75,
    }),
    8.72,
    0.31,
    2.62,
  );
  const crateGlow = new T.PointLight(0xffb478, 0.95, 7);
  crateGlow.position.set(8.2, 0.95, 2.6);
  scene.add(crateGlow);
  const leg1 = addCylinder(0.03, 0.03, 1.5, 6, rustMat, -7.8, 0.05, -5.6);
  leg1.rotation.set(1.2, 0.4, 0.8);
  const leg2 = addCylinder(0.03, 0.03, 1.4, 6, rustMat, -8.1, 0.05, -5.9);
  leg2.rotation.set(1.4, -0.5, 0.5);
  addBox(
    0.45,
    0.04,
    0.6,
    createMaterial({ color: 0xc2b69e, roughness: 0.9 }),
    -8.4,
    0.55,
    6.2,
    false,
  ).rotation.x = 0.65;

  addCylinder(
    0.75,
    0.45,
    0.65,
    8,
    createMaterial({ color: 0x523c38, metalness: 0.35, roughness: 0.55 }),
    0,
    1.4,
    -4.5,
  );
  const fireLight = new T.PointLight(0xff7729, 2.4, 16);
  fireLight.position.set(0, 2.4, -4.5);
  scene.add(fireLight);
  const emberCore = addMesh(
    new T.DodecahedronGeometry(0.36, 0),
    createMaterial({
      color: 0xff7022,
      emissive: 0xff4400,
      emissiveIntensity: 1.5,
    }),
    0,
    1.85,
    -4.5,
    false,
    false,
  );
  const embers: { m: ReturnType<typeof addMesh>; s: number }[] = [];
  const eGeo = new T.SphereGeometry(0.045, 6, 4);
  const eMat = createMaterial({
    color: 0xff8b3d,
    emissive: 0xff5500,
    emissiveIntensity: 1.0,
  });
  for (let i = 0; i < 26; i++) {
    embers.push({
      m: addMesh(
        eGeo,
        eMat,
        (Math.random() - 0.5) * 18,
        Math.random() * 6,
        (Math.random() - 0.5) * 18,
        false,
        false,
      ),
      s: 0.4 + Math.random() * 0.9,
    });
  }
  let lit = true;
  updaters.push((dt, t) => {
    fireLight.intensity = lit ? 2.1 + Math.sin(t * 9) * 0.35 : 0.18;
    emberCore.visible = lit;
    emberCore.rotation.y += dt * 1.1;
    crackMats.forEach((cm, idx) => {
      cm.emissiveIntensity = 0.65 + Math.sin(t * 1.8 + idx) * 0.35;
    });
    springWater.position.y = -0.18 + Math.sin(t * 3.5) * 0.015;
    embers.forEach((e) => {
      e.m.position.y += dt * e.s * (lit ? 1.2 : 0.35);
      if (e.m.position.y > 6.5) {
        e.m.position.y = 0.2;
      }
    });
    steams.forEach((s) => {
      s.p += dt * 0.28;
      if (s.p > 1) {
        s.p = 0;
      }
      s.m.position.x = s.bx + Math.sin(s.p * 6) * 0.18;
      s.m.position.y = s.by + s.p * 1.9;
      s.m.position.z = s.bz + Math.cos(s.p * 5) * 0.18;
      const sc = 0.45 + s.p * 1.1;
      s.m.scale.set(sc, sc * 0.7, sc);
    });
  });

  setHeightFn((x, z, standingY = 0) => {
    if (x >= -11.5 && x <= -5.7 && z >= 3.4 && z <= 9.0 && standingY >= 0.1) {
      return 0.45;
    }
    if (x >= -7.2 && x <= -5.2 && z >= 5.3 && z <= 7.1) {
      return 0.01;
    }
    if (Math.abs(x) <= 7.0 && Math.abs(z) <= 7.0) {
      return 0;
    }
    return -0.35;
  });

  addInteract('hell_brazier', V(0, 1.5, -4.5), '拨动地火石盆', '控制余烬明暗', () => {
    lit = !lit;
    sfx.play(lit ? 'sizzle' : 'switch');
    showWhisper(
      lit
        ? '暗红火星轰地窜起，烤得岩面发烫。'
        : '火焰缩回石隙里，只剩裂纹泛着暗光。',
    );
  });
  const steleTex = tex.sign('热岩碎裂带', '#241818', '#e88258', '下层岩浆温度高', true);
  const steleSign = addSign(1.4, 0.8, steleTex, -4.5, 2.2, -3.38);
  const steleMat = steleSign.material as InstanceType<typeof T.MeshStandardMaterial>;
  steleMat.emissive.setHex(0xffffff);
  steleMat.emissiveMap = steleTex;
  steleMat.emissiveIntensity = 0.45;
  addInteract(
    'hell_stele',
    V(-4.5, 1.8, -3.5),
    '触摸黑曜石碑',
    '表面刻着焦痕字迹',
    () => {
      sfx.play('door');
      openModal(
        '石碑刻痕',
        '石面被熏得发黑，能辨认出几行字：\n\n「玄武岩台面 04\n夜间地面偶有微震放气，响声闷，不必惊慌。」',
      );
    },
  );
  addInteract(
    'hell_crate',
    V(8.6, 0.2, 2.6),
    '翻开半埋的锈蚀采样箱',
    '里面还剩两只玻璃管',
    () => {
      sfx.play('door');
      openModal(
        '锈蚀铁皮采样箱',
        '合页已经锈死一半，勉强掰开一条缝：\n\n里面垫着受潮的硬泡沫，放着两支贴着褪色白标签的玻璃样管，字迹只剩「东侧泉眼 78℃」。',
      );
    },
  );
  addInteract(
    'hell_board',
    V(-8.4, 0.75, 6.2),
    '查看翻倒的记录板',
    '边角被热风烤卷了',
    () => {
      sfx.play('paper');
      openModal(
        '值班地热记录板',
        '夹子锈住了三页泛黄的方格纸：\n\n「11月4日：西侧裂隙放气变短，鞋底踩久了发软。\n三脚架被夜风吹倒在北坡，明早带扳手来收，结果好像没人回来拿。」',
      );
    },
  );
  addInteract(
    'hell_spring',
    V(8.2, 0.1, -5.8),
    '在泉眼边伸手试探热气',
    '水面正冒着细小水泡',
    () => {
      sfx.play('sizzle');
      showWhisper('一股带着硫磺味的湿热白气扑在手背上，泉眼边凝了一圈淡黄色薄壳。');
    },
  );
  addCollectible('hellstone', 4.6, 0.3, 4.2, 0xff6b3d);
  setBounds({ minX: -11.2, maxX: 11.2, minZ: -11.2, maxZ: 11.2 });
  setSurfaceFn(() => 'stone');
  return {
    pos: V(0, 1.65, 4.6),
    yaw: 0,
    whisper: '整片焦黑岩台比看着宽阔，远处裂隙正一缕缕往外冒着淡白热气。',
  };
}

import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';

export function buildMallScene(ctx: SceneContext): SceneInitResult {
  const {
    T,
    scene,
    state,
    tex,
    sfx,
    V,
    addBox,
    addCylinder,
    addMesh,
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
    setBounds,
    setHeightFn,
    setSurfaceFn,
  } = ctx;

  scene.background = new T.Color(0xe6dfd3);
  scene.fog = new T.Fog(0xe6dfd3, 20, 65);
  scene.add(new T.HemisphereLight(0xfffaf0, 0x998c7a, 0.9));
  const warmSpot = new T.PointLight(0xffcb85, 1.5, 20);
  warmSpot.position.set(0, 3.8, -5);
  scene.add(warmSpot);
  const counterBackLightL = new T.PointLight(0xffe1b0, 1.15, 14);
  counterBackLightL.position.set(-3.2, 3.8, -6.8);
  scene.add(counterBackLightL);
  const counterBackLightR = new T.PointLight(0xffe1b0, 1.15, 14);
  counterBackLightR.position.set(3.2, 3.8, -6.8);
  scene.add(counterBackLightR);
  const stairLight = new T.PointLight(0xdcebf7, 0.95, 14);
  stairLight.position.set(10.7, 6.2, -3.5);
  scene.add(stairLight);

  const flTex = tex.tiles('#e0d9cc', '#d2cabd', '#b6ae9f', 4, 'mall_fl');
  flTex.repeat.set(8, 8);
  addBox(
    26,
    0.2,
    24,
    createMaterial({ map: flTex, roughness: 0.35, metalness: 0.05 }),
    0,
    -0.1,
    0,
    true,
    false,
    true,
  );
  addBox(
    26,
    0.3,
    24,
    createMaterial({ color: 0xf2eee6, roughness: 0.8 }),
    0,
    8.5,
    0,
    false,
  );

  const upperConc = createMaterial({
    map: tex.concrete('#9ea2a6', 0.14, 'mall_up'),
  });
  const glassRailMat = createMaterial({
    color: 0x88a8b5,
    transparent: true,
    opacity: 0.44,
    roughness: 0.15,
  });
  const railMetalMat = createMaterial({
    color: 0x5c636b,
    metalness: 0.6,
    roughness: 0.35,
  });

  // Main upper mezzanine floor + full glass railing with top metal rail over plants & atrium
  addBox(21.7, 0.28, 8.5, upperConc, -2.05, 4.88, -7.75, false, true, true);
  addBox(21.7, 1.05, 0.1, glassRailMat, -2.05, 5.52, -3.55, true);
  addBox(21.7, 0.06, 0.12, railMetalMat, -2.05, 6.06, -3.55, false);

  // Upper stairwell landing + side/front railings (leaving x=10.75..12.6 open for the upper stair flight)
  addBox(3.8, 0.28, 4.0, upperConc, 10.7, 4.88, -3.85, false, true, true);
  addBox(0.1, 1.05, 1.75, glassRailMat, 8.85, 5.52, -2.72, true);
  addBox(0.12, 0.06, 1.75, railMetalMat, 8.85, 6.06, -2.72, false);
  addBox(1.9, 1.05, 0.1, glassRailMat, 9.8, 5.52, -1.85, true);
  addBox(1.9, 0.06, 0.12, railMetalMat, 9.8, 6.06, -1.85, false);

  // Mid landing ONLY at z=2.85..5.25 (clear of lower flight!) + solid support base + mid-landing guardrail & collider
  addBox(3.6, 0.32, 2.4, upperConc, 10.8, 2.34, 4.05, false, true, true);
  addBox(3.6, 2.2, 0.45, createMaterial({ color: 0xbec2c6, roughness: 0.9 }), 10.8, 1.1, 5.05, true);
  addBox(3.6, 1.05, 0.14, glassRailMat, 10.8, 3.02, 5.2, true);
  addBox(3.6, 0.07, 0.16, railMetalMat, 10.8, 3.56, 5.2, false);

  // Stairwell outer walls & thick central spine wall
  addBox(0.22, 6.0, 11.2, createMaterial({ color: 0xd0cec8 }), 12.6, 3.0, -0.3, true);
  addBox(0.22, 4.9, 7.3, createMaterial({ color: 0xd0cec8 }), 9.0, 2.45, 1.75, true);
  addBox(0.22, 5.4, 5.1, createMaterial({ color: 0x868b91 }), 10.75, 2.7, 0.4, true);

  // Substantial stepped stair flights with solid under-step risers/carriages
  for (let i = 0; i < 10; i++) {
    const lh = 0.25 + i * 0.25;
    addBox(
      1.6,
      lh,
      0.52,
      upperConc,
      9.92,
      lh / 2,
      -1.6 + i * 0.5,
      false,
      true,
      true,
    );
    const uh = 0.38;
    addBox(
      1.65,
      uh,
      0.56,
      upperConc,
      11.68,
      2.62 + i * 0.25 - 0.07,
      2.65 - i * 0.5,
      false,
      true,
      true,
    );
  }
  // Sloped handrails along lower & upper flights
  const railLower = addBox(0.06, 0.08, 5.2, railMetalMat, 10.64, 2.15, 0.65, false);
  railLower.rotation.x = -0.46;
  const railUpper = addBox(0.06, 0.08, 5.2, railMetalMat, 10.88, 4.65, 0.4, false);
  railUpper.rotation.x = 0.46;
  addBox(
    3.8,
    3.2,
    0.2,
    createMaterial({ color: 0xc2c5c9 }),
    10.7,
    6.4,
    -5.8,
    true,
  );
  addBox(
    1.5,
    2.4,
    0.14,
    createMaterial({ color: 0x6e757c, metalness: 0.3 }),
    10.7,
    6.2,
    -5.68,
    false,
  );
  addSign(
    1.8,
    0.72,
    tex.sign('写字楼 · 楼上', '#eef2f5', '#2c343d', '会议室 / 茶水间在里'),
    10.7,
    7.75,
    -5.66,
  );
  addBox(
    1.1,
    0.85,
    1.1,
    createMaterial({ color: 0x9c7248 }),
    11.6,
    0.425,
    1.8,
    true,
  );
  addBox(
    0.85,
    0.65,
    0.85,
    createMaterial({ color: 0x8a643d }),
    11.6,
    1.15,
    1.8,
    false,
  );
  addCylinder(
    0.24,
    0.2,
    0.42,
    8,
    createMaterial({ color: 0x4b7ea8 }),
    11.6,
    0.21,
    -0.2,
  );

  addBox(
    8.5,
    1.05,
    1.2,
    createMaterial({ color: 0xc94f35, roughness: 0.55 }),
    0,
    0.52,
    -5.5,
    true,
  );
  addBox(
    8.7,
    0.1,
    1.35,
    createMaterial({ color: 0xf2ebe0, roughness: 0.3 }),
    0,
    1.08,
    -5.5,
    false,
  );
  const shopWallTex = tex.tiles('#e2d9cb', '#d8cebe', '#bfb3a0', 4, 'mall_bw');
  shopWallTex.repeat.set(4, 2);
  addBox(
    8.5,
    4.2,
    0.3,
    createMaterial({ map: shopWallTex, roughness: 0.65 }),
    0,
    2.1,
    -8.2,
    true,
  );
  addBox(
    8.5,
    1.05,
    0.34,
    createMaterial({ map: tex.wood('#8c5d3a', '#664023', 'mall_wain'), roughness: 0.7 }),
    0,
    0.525,
    -8.18,
    false,
  );
  addSign(
    5.2,
    1.35,
    tex.sign(
      '炙烤牛肉汉堡站',
      '#29201c',
      '#f2c166',
      '双层芝士 ¥28 · 脆薯条 ¥12 · 黄金薯饼 ¥8',
    ),
    0,
    3.1,
    -7.98,
  );
  addBox(
    2.2,
    0.85,
    1.0,
    createMaterial({ color: 0x8c9296, metalness: 0.65, roughness: 0.35 }),
    -1.6,
    0.45,
    -7.2,
    true,
  );
  addBox(
    1.1,
    1.35,
    0.8,
    createMaterial({ color: 0x4b5157, metalness: 0.5 }),
    3.1,
    0.68,
    -7.1,
    true,
  );
  addBox(
    0.55,
    0.08,
    0.48,
    createMaterial({ color: 0xf2f0e8 }),
    -2.75,
    1.16,
    -5.3,
    false,
  );
  addBox(
    0.32,
    0.03,
    0.08,
    createMaterial({ color: 0x9aa1a6, metalness: 0.7 }),
    -2.4,
    1.15,
    -5.3,
    false,
  );
  addBox(
    0.52,
    0.9,
    0.06,
    createMaterial({ color: 0xd9dde0 }),
    2.9,
    1.25,
    -5.4,
    false,
  );
  const patty = addCylinder(
    0.18,
    0.18,
    0.06,
    12,
    createMaterial({ color: 0x5a2e1c, roughness: 0.85 }),
    -1.6,
    0.92,
    -7.2,
  );
  let sizzleOn = false;
  addCylinder(
    0.11,
    0.14,
    0.08,
    12,
    createMaterial({ color: 0xe0c170, metalness: 0.8, roughness: 0.2 }),
    1.8,
    1.17,
    -5.2,
  );
  addBox(
    0.66,
    0.04,
    0.4,
    createMaterial({ color: 0xb8482f }),
    0.6,
    1.15,
    -5.3,
    false,
  );
  addCylinder(
    0.13,
    0.12,
    0.12,
    12,
    createMaterial({ color: 0xd99c52 }),
    0.46,
    1.22,
    -5.3,
  );
  addBox(
    0.14,
    0.14,
    0.08,
    createMaterial({ color: 0xc93b2b }),
    0.72,
    1.23,
    -5.3,
    false,
  );
  const fryMat = createMaterial({ color: 0xf0c246, roughness: 0.75 });
  for (let f = 0; f < 5; f++) {
    const fr = addBox(
      0.022,
      0.14,
      0.022,
      fryMat,
      0.67 + f * 0.024,
      1.33,
      -5.3 + (f % 2) * 0.015,
      false,
    );
    fr.rotation.z = (f - 2) * 0.08;
  }
  const hashMat = createMaterial({ color: 0xd99938, roughness: 0.88 });
  addBox(0.16, 0.04, 0.1, hashMat, 0.8, 1.19, -5.2, false);
  addBox(0.16, 0.04, 0.1, hashMat, 0.82, 1.23, -5.2, false).rotation.y = 0.2;
  addBox(
    0.85,
    0.12,
    0.52,
    createMaterial({ color: 0xcfd4d8, metalness: 0.6 }),
    -0.65,
    1.19,
    -5.35,
    false,
  );
  for (let i = 0; i < 4; i++) {
    addBox(0.18, 0.045, 0.11, hashMat, -0.88 + i * 0.16, 1.27, -5.28, false);
  }
  const eggTray = addBox(
    0.14,
    0.16,
    0.09,
    createMaterial({ color: 0xd13e2c }),
    -0.45,
    1.33,
    -5.45,
    false,
  );
  const eggFries: ReturnType<typeof addBox>[] = [];
  for (let f = 0; f < 6; f++) {
    eggFries.push(
      addBox(0.024, 0.16, 0.024, fryMat, -0.5 + f * 0.02, 1.44, -5.45, false),
    );
  }
  const eggHash = addBox(
    0.24,
    0.06,
    0.15,
    createMaterial({
      color: 0xe6ad3e,
      emissive: 0x5c3b08,
      emissiveIntensity: 0.25,
      roughness: 0.8,
    }),
    -0.68,
    1.28,
    -5.46,
    false,
  );

  for (const x of [-7, 7]) {
    addBox(
      1.5,
      0.75,
      1.2,
      createMaterial({ map: tex.wood('#a67c52', '#7c5935') }),
      x,
      0.38,
      2.5,
      true,
    );
    addBox(
      0.55,
      0.45,
      1.1,
      createMaterial({ color: 0xbd563d }),
      x - 1.2,
      0.23,
      2.5,
      true,
    );
    addBox(
      0.55,
      0.45,
      1.1,
      createMaterial({ color: 0xbd563d }),
      x + 1.2,
      0.23,
      2.5,
      true,
    );
    addBox(
      0.45,
      0.03,
      0.32,
      createMaterial({ color: 0xb8482f }),
      x,
      0.77,
      2.5,
      false,
    );
    addBox(
      0.14,
      0.13,
      0.07,
      createMaterial({ color: 0xc93b2b }),
      x - 0.1,
      0.84,
      2.5,
      false,
    );
    addBox(0.15, 0.04, 0.09, hashMat, x + 0.1, 0.81, 2.48, false);
  }
  addBox(
    0.65,
    1.05,
    0.65,
    createMaterial({ color: 0x7c7468 }),
    5.2,
    0.52,
    -3.8,
    true,
  );
  for (const px of [-8, 8]) {
    addCylinder(
      0.45,
      0.35,
      0.65,
      10,
      createMaterial({ color: 0x857869 }),
      px,
      0.32,
      -3,
    );
    addMesh(
      new T.DodecahedronGeometry(0.95, 1),
      createMaterial({ color: 0x4b7043, roughness: 0.85 }),
      px,
      1.5,
      -3,
    );
  }
  let orderCount = 83;
  let eggStep = 0;
  let eggSpin = 0;
  updaters.push((dt, t) => {
    if (sizzleOn) {
      patty.position.y = 0.92 + Math.abs(Math.sin(t * 18)) * 0.015;
    }
    if (eggSpin > 0) {
      eggSpin = Math.max(0, eggSpin - dt);
      eggHash.rotation.y += dt * 9;
      eggHash.position.y = 1.28 + Math.sin(eggSpin * 8) * 0.14;
      eggTray.position.y = 1.33 + Math.abs(Math.sin(eggSpin * 6)) * 0.1;
    } else {
      eggHash.position.y = 1.28;
      eggTray.position.y = 1.33;
    }
  });
  setHeightFn((x, z, standingY = 0) => {
    if (x >= 8.8 && x <= 12.6 && z >= -5.6 && z <= -1.85 && standingY >= 4.4) {
      return 5.0;
    }
    if (
      x >= 10.75 &&
      x <= 12.55 &&
      z >= -1.85 &&
      z <= 2.95 &&
      standingY >= 2.0
    ) {
      const st = Math.floor((2.9 - z) / 0.5);
      const h = 2.75 + Math.min(9, Math.max(0, st)) * 0.25;
      if (h <= standingY + 0.55) {
        return h;
      }
    }
    if (x >= 9.0 && x <= 12.6 && z > 2.95 && z <= 5.2 && standingY >= 1.9) {
      return 2.5;
    }
    if (
      x >= 9.15 &&
      x <= 10.85 &&
      z >= -1.9 &&
      z <= 2.95 &&
      standingY < 2.7
    ) {
      const st = Math.floor((z + 1.85) / 0.5);
      const h = 0.25 + Math.min(9, Math.max(0, st)) * 0.25;
      if (h <= standingY + 0.55) {
        return h;
      }
    }
    return 0;
  });
  addInteract('mall_bell', V(1.8, 1.2, -5.2), '按响取餐铃', '呼叫柜台出餐', () => {
    orderCount++;
    sizzleOn = true;
    sfx.play('bell');
    addTimedRedirect(() => sfx.play('sizzle'), 220);
    showWhisper(
      '「叮——」' + orderCount + '号顾客，现煎双层牛肉堡带脆薯饼正在装盘。',
    );
  });
  addInteract(
    'mall_fries',
    V(-0.6, 1.3, -5.35),
    '翻看保温槽与薯条薯饼',
    '底下贴着一张手写纸条',
    () => {
      eggStep++;
      eggSpin = 0.9;
      sfx.play('sizzle');
      if (eggStep === 1) {
        showWhisper(
          '捏了一根刚出锅的细盐薯条，底下露出一张折起来的油渍小纸条，上面写着「如果客人皱眉就立刻换回原版面包胚」。',
        );
      } else if (eggStep === 2) {
        showWhisper(
          '又夹起半块金黄薯饼！旁边的纸条写着：「试了把薯条直接塞进牛肉饼上面压紧，不撒碎就行。」',
        );
      } else {
        eggHash.scale.setScalar(1.3);
        eggFries.forEach((f) => f.scale.setScalar(1.2));
        sfx.play('collect');
        openModal(
          '保温盘底下的便签',
          '便签边缘被热气熏得发黄，字写得飞快：\n\n「实验七号：两块刚炸透的黄金薯饼当面包胚，中间夹一把粗薯条和两片融化切达芝士，刷一点稀释过的可乐糖浆。\n备注：后厨自己试吃可以，出餐给熟客前记得问清楚人家是不是赶时间。」',
        );
      }
    },
  );
  addInteract(
    'mall_chef_fridge',
    V(2.9, 1.25, -5.4),
    '看收银机背面的清单与排班',
    '贴在冷柜侧门上的手写纸',
    () => {
      sfx.play('paper');
      openModal(
        '冰柜门上的「本周不要做的事」',
        '清单划掉又重写过好几轮，底下压着对调过名字的排班表：\n\n「一、不要再拿可乐糖浆直接往高温煎板上浇，刷子会粘住。\n二、跟小周换了周六晚班，新到的炸篮今晚我留下来试两锅。\n三、当天剩下的边角料做员工餐，今天那锅叫『双倍边角脆拌饭』，谁晚走谁端走。\n四、最后一行用红水笔圈了三遍：不要再往酸黄瓜罐里加东西。」',
      );
    },
  );
  addInteract(
    'mall_chef_apron',
    V(-2.75, 1.2, -5.3),
    '看看挂在台角的围裙和钢铲',
    '口袋里露出一截废小票',
    () => {
      sfx.play('paper');
      openModal(
        '围裙口袋里的投诉记录',
        '半卷热敏纸背面拿圆珠笔写着几行字：\n\n「下午三点 42号桌客人说汉堡吃着不对。\n过去没先道歉，先问了一句：『你是觉得太咸、太干，还是吃起来有点无聊？』\n对方说嫌太干。回去重新烤了一只面包胚，多抹了半勺黄油和两片生菜，端过去那人没再说话，吃完把托盘端去了回收台。」',
      );
    },
  );
  addInteract(
    'mall_menu',
    V(-1.4, 1.2, -5.3),
    '拨动煎台开关',
    '看一眼铁板与灯箱',
    () => {
      sizzleOn = !sizzleOn;
      sfx.play('switch');
      showWhisper(
        sizzleOn
          ? '铁板滋滋作响，黄油面包和薯饼同时冒出焦香。'
          : '煎台暂时空着，台边那把宽钢铲还带着余温。',
      );
    },
  );
  addInteract(
    'mall_to_office',
    V(10.7, 6.2, -5.4),
    '推门进写字楼',
    '去二楼写字楼办公区',
    () => {
      const oi = sceneIdxById('office');
      if (oi !== -1) {
        sfx.play('door');
        addTimedRedirect(() => {
          state.pendingSpawn = { pos: V(-4.2, 1.65, 4.8), yaw: 0 };
          loadScene(oi);
          showWhisper('楼上那层还亮着灯，隔着门板能听见写字楼通风管的低响。');
        }, 280);
      }
    },
  );
  addCollectible('mall', 7.2, 0.85, 2.6, 0xe8c47a);
  setBounds({ minX: -11.8, maxX: 12.2, minZ: -5.2, maxZ: 10.5 });
  setSurfaceFn((_x, _z, standingY = 0) =>
    standingY >= 0.2 ? 'concrete' : 'stone',
  );
  return {
    pos: V(0, 1.65, 6.5),
    yaw: 0,
    whisper: '汉堡店头顶就是二楼写字楼，右边的混凝土楼梯能直接绕上去。',
  };
}

import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';

export function buildOfficeScene(ctx: SceneContext): SceneInitResult {
  const {
    T,
    scene,
    state,
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
    addTimedRedirect,
    sceneIdxById,
    loadScene,
    showWhisper,
    openModal,
    updateModalText,
    closeModal,
    openBook,
    setBounds,
    setSurfaceFn,
  } = ctx;

  scene.background = new T.Color(0xc2d0dc);
  scene.fog = new T.Fog(0xc2d0dc, 18, 68);
  scene.add(new T.HemisphereLight(0xeef4fa, 0x737980, 0.9));
  const flLight = new T.PointLight(0xeef6ff, 0.9, 22);
  flLight.position.set(0, 3.6, 0);
  scene.add(flLight);
  const deskLamp = new T.PointLight(0xffd296, 0.95, 7);
  deskLamp.position.set(-3.2, 1.6, -2.5);
  scene.add(deskLamp);
  const winSun = new T.DirectionalLight(0xfff5e4, 0.35);
  winSun.position.set(16, 9, 2);
  scene.add(winSun);
  const carpetTex = tex.tiles('#525c66', '#4b555f', '#3f4852', 6, 'off_fl');
  carpetTex.repeat.set(3, 3);
  addBox(
    14,
    0.2,
    12,
    createMaterial({ map: carpetTex, roughness: 0.95 }),
    0,
    -0.1,
    0,
    true,
    false,
    true,
  );
  addBox(
    14,
    0.2,
    12,
    createMaterial({ color: 0xe5e6e2, roughness: 0.9 }),
    0,
    4.1,
    0,
    false,
  );
  const wallMat = createMaterial({ color: 0xd8d6cf, roughness: 0.9 });
  addBox(14, 4, 0.25, wallMat, 0, 2, -6, true);
  addBox(
    0.25,
    4,
    12,
    createMaterial({ color: 0xd0cec6, roughness: 0.9 }),
    -7,
    2,
    0,
    true,
  );
  addBox(14, 4, 0.25, wallMat, 0, 2, 6, true);
  addBox(0.3, 0.85, 12, wallMat, 7, 0.425, 0, true);
  addBox(0.3, 0.65, 12, wallMat, 7, 3.675, 0, true);
  addBox(0.3, 2.5, 2.2, wallMat, 7, 2.1, -4.9, true);
  addBox(0.3, 2.5, 2.2, wallMat, 7, 2.1, 4.9, true);
  addBox(
    0.42,
    0.08,
    7.8,
    createMaterial({ color: 0xc2bcb0, roughness: 0.5 }),
    6.95,
    0.88,
    0,
    false,
  );
  addBox(
    0.04,
    2.5,
    7.6,
    createMaterial({
      color: 0x9ec4d6,
      transparent: true,
      opacity: 0.26,
      roughness: 0.1,
    }),
    7.06,
    2.1,
    0,
    true,
  );
  for (const mz of [-3.8, -1.26, 1.26, 3.8]) {
    addBox(
      0.08,
      2.5,
      0.06,
      createMaterial({ color: 0x454a50, metalness: 0.4 }),
      7.02,
      2.1,
      mz,
      false,
    );
  }
  addBox(
    40,
    0.2,
    60,
    createMaterial({ color: 0x7c8791, roughness: 0.95 }),
    27,
    -14,
    0,
    false,
    false,
    false,
  );
  for (const [bx, bz, bh, col] of [
    [24, -10, 24, 0x87939e],
    [26, 4, 28, 0x77838e],
    [32, -3, 32, 0x95a1ab],
    [22, 14, 20, 0x808c96],
  ]) {
    addBox(
      7,
      bh,
      8,
      createMaterial({ color: col, roughness: 0.9 }),
      bx,
      -8 + bh / 2,
      bz,
      false,
      false,
      false,
    );
    for (let wy = 0; wy < 6; wy++) {
      addBox(
        0.1,
        0.7,
        5.2,
        createMaterial({
          color: 0xaed0e2,
          emissive: 0x486275,
          emissiveIntensity: 0.25,
        }),
        bx - 3.52,
        0.5 + wy * 1.9,
        bz,
        false,
        false,
        false,
      );
    }
  }
  const blinds: ReturnType<typeof addMesh>[] = [];
  const slatMat = createMaterial({ color: 0xeceae0, roughness: 0.65 });
  const slatGeo = track(new T.BoxGeometry(0.085, 0.012, 2.42));
  for (const bz of [-2.53, 0, 2.53]) {
    addBox(
      0.06,
      0.06,
      2.46,
      createMaterial({ color: 0xd0cec4 }),
      6.82,
      3.3,
      bz,
      false,
    );
    for (let r = 0; r < 18; r++) {
      const sl = addMesh(
        slatGeo,
        slatMat,
        6.82,
        0.98 + r * 0.13,
        bz,
        false,
        false,
      );
      sl.rotation.z = 1.32;
      blinds.push(sl);
    }
  }
  addCylinder(
    0.012,
    0.012,
    1.5,
    6,
    createMaterial({ color: 0xe6e4dc }),
    6.72,
    2.35,
    3.7,
    false,
    false,
  );
  let blindOpen = false;

  addBox(
    1.5,
    2.7,
    0.14,
    createMaterial({ color: 0x6b7075, metalness: 0.35 }),
    -4.2,
    1.35,
    5.84,
    true,
  );
  addSign(
    1.4,
    0.65,
    tex.sign('下楼 · 汉堡店', '#eae4d6', '#42372c', '一层商场中庭'),
    -4.2,
    2.95,
    5.82,
    Math.PI,
  );

  addBox(
    1.1,
    1.15,
    0.65,
    createMaterial({ map: tex.wood('#7b5838', '#573b22') }),
    0,
    0.58,
    -2.8,
    true,
  );
  addCylinder(
    0.02,
    0.02,
    0.35,
    8,
    createMaterial({ color: 0x2c2c2c, metalness: 0.7 }),
    0,
    1.32,
    -2.65,
  );
  addMesh(
    new T.SphereGeometry(0.05, 10, 10),
    createMaterial({ color: 0x3a3d42, metalness: 0.5 }),
    0,
    1.5,
    -2.65,
  );
  addSign(
    0.45,
    0.34,
    tex.sign('发言稿：第三段', '#fbf8ef', '#2b2926', '放慢语速 · 别低头', true),
    0,
    1.19,
    -2.8,
    0,
    -Math.PI / 2 - 0.32,
  );
  addBox(
    2.2,
    0.75,
    1.0,
    createMaterial({ map: tex.wood('#9c7852', '#735535') }),
    -3.6,
    0.38,
    -2.5,
    true,
  );
  addCylinder(
    0.05,
    0.06,
    0.12,
    10,
    createMaterial({ color: 0xc96f4a }),
    -3.1,
    0.82,
    -2.3,
  );
  addBox(
    0.46,
    0.3,
    0.04,
    createMaterial({ color: 0x2b2e34 }),
    -3.9,
    0.92,
    -2.65,
    false,
  );
  addBox(
    0.32,
    0.05,
    0.42,
    createMaterial({ color: 0xe8dcc2, roughness: 0.8 }),
    -2.9,
    0.78,
    -2.2,
    false,
  );
  addBox(
    0.95,
    1.05,
    0.75,
    createMaterial({ color: 0xd8d8d4, roughness: 0.5 }),
    4.8,
    0.52,
    -4.6,
    true,
  );
  addCylinder(
    0.2,
    0.2,
    0.45,
    10,
    createMaterial({ color: 0x78b2d4, transparent: true, opacity: 0.7 }),
    -5.8,
    1.25,
    -4.8,
  );
  addBox(
    0.55,
    1.0,
    0.55,
    createMaterial({ color: 0xe6e6e2 }),
    -5.8,
    0.5,
    -4.8,
    true,
  );
  addSign(
    2.4,
    1.2,
    tex.sign('周四前借投影线', '#f4f6f8', '#2f4354', '白板便签（擦一半）', true),
    -6.85,
    2.0,
    -1.5,
    Math.PI / 2,
  );
  for (let x = -2.5; x <= 2.5; x += 1.6) {
    addBox(
      0.55,
      0.45,
      0.55,
      createMaterial({ color: 0x39434d, roughness: 0.85 }),
      x,
      0.23,
      1.8,
      true,
    );
    addBox(
      0.55,
      0.55,
      0.08,
      createMaterial({ color: 0x39434d, roughness: 0.85 }),
      x,
      0.7,
      2.05,
      true,
    );
  }
  const scripts = [
    '「谢谢各位今天来捧场。前头那张旧PPT我昨晚刚改过一次，字体调大了点……」\n（纸页边角被手指搓毛了）',
    '「……新版本的动线和老版本其实差别不大，最容易卡壳的是交接那十来分钟，大家现场对照手头纸面就行。」\n（旁边拿铅笔画了颗五角星）',
    '「我讲完了，茶水间冰柜里剩了几盒葡萄乌龙，散场顺路拿走吧。」',
  ];
  addInteract(
    'off_lectern',
    V(0, 1.15, -2.8),
    '翻看讲台上的发言稿',
    '试音并念出下一段',
    () => {
      sfx.play('paper');
      const curTxt = scripts[state.officePage];
      openModal(
        '讲台手稿 · 第' + (state.officePage + 1) + '/3页',
        curTxt,
        [
          {
            label: '翻下一段',
            fn: () => {
              state.officePage = (state.officePage + 1) % scripts.length;
              sfx.play('paper');
              const nextTxt = scripts[state.officePage];
              updateModalText(
                '讲台手稿 · 第' + (state.officePage + 1) + '/3页',
                nextTxt,
                '讲台夹页手稿 · ' + nextTxt.replace(/\s+/g, '').length + ' 字',
                '第 ' + (state.officePage + 1) + ' / ' + scripts.length + ' 段',
              );
            },
          },
          { label: '合上稿子', fn: closeModal },
        ],
        {
          meta: '讲台夹页手稿 · ' + curTxt.replace(/\s+/g, '').length + ' 字',
          prog: '第 ' + (state.officePage + 1) + ' / ' + scripts.length + ' 段',
        },
      );
    },
  );
  addInteract(
    'off_book',
    V(-2.9, 0.85, -2.2),
    '翻阅桌角钉着的小册子',
    '《凌晨两点半的空白提示词》（长篇同人）',
    () => openBook('office'),
  );
  addInteract(
    'off_blinds',
    V(6.4, 1.6, 2.8),
    '转动百叶窗拉杆',
    '水平翻转窗叶透出窗外楼群',
    () => {
      blindOpen = !blindOpen;
      blinds.forEach((b) => {
        b.rotation.z = blindOpen ? 0.05 : 1.32;
      });
      flLight.intensity = blindOpen ? 1.25 : 0.9;
      winSun.intensity = blindOpen ? 1.05 : 0.35;
      sfx.play('switch');
      showWhisper(
        blindOpen
          ? '横叶齐刷刷转平，窗玻璃外头的阴天楼群和光一下涌进屋来。'
          : '叶片垂落挡住窗外，室内只剩顶灯和台灯的暖黄。',
      );
    },
  );
  addInteract('off_lamp', V(-3.2, 0.9, -2.5), '开关办公桌台灯', '冷暖光切换', () => {
    deskLamp.intensity = deskLamp.intensity > 0 ? 0 : 0.95;
    sfx.play('switch');
    showWhisper(
      deskLamp.intensity > 0
        ? '暖色台灯亮起，咖啡杯沿泛起一点微光。'
        : '台灯灭了，屋里只剩主机风扇轻响。',
    );
  });
  addInteract(
    'off_mall',
    V(-4.2, 1.3, 5.4),
    '推门下楼去汉堡店',
    '顺着楼梯回一层汉堡店',
    () => {
      const mi = sceneIdxById('mall');
      if (mi !== -1) {
        sfx.play('door');
        addTimedRedirect(() => {
          state.pendingSpawn = { pos: V(10.7, 5.0 + 1.65, -4.6), yaw: Math.PI };
          loadScene(mi);
          showWhisper('楼下就是汉堡店，油烟气顺着楼梯往上飘了一点。');
        }, 280);
      }
    },
  );
  addCollectible('office', -4.3, 0.9, -2.5, 0xe6dfc8);
  setBounds({ minX: -6.2, maxX: 6.2, minZ: -5.2, maxZ: 5.2 });
  setSurfaceFn(() => 'carpet');
  return {
    pos: V(0, 1.65, 4),
    yaw: 0,
    whisper: '楼下隔着楼板传来的煎肉声被关在南墙那扇安全门外，屋里只有打印纸味。',
  };
}

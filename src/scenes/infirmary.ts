import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';

export function buildInfirmaryScene(ctx: SceneContext): SceneInitResult {
  const {
    T,
    scene,
    state,
    tex,
    sfx,
    V,
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
    setBounds,
    setSurfaceFn,
  } = ctx;

  scene.background = new T.Color(0xdbe8df);
  scene.fog = new T.Fog(0xdbe8df, 16, 48);
  scene.add(new T.HemisphereLight(0xf6fbf7, 0x8ea396, 1.0));
  const sun = new T.DirectionalLight(0xfff4d9, 0.9);
  sun.position.set(10, 12, 4);
  sun.castShadow = true;
  scene.add(sun);
  const l1 = new T.PointLight(0xffffff, 0.75, 14);
  l1.position.set(0, 3.2, 4);
  scene.add(l1);
  const l2 = new T.PointLight(0xffffff, 0.75, 14);
  l2.position.set(4.5, 3.2, -0.5);
  scene.add(l2);
  const l3 = new T.PointLight(0xffffff, 0.75, 14);
  l3.position.set(4.5, 3.2, -7.8);
  scene.add(l3);

  const flMat = createMaterial({
    map: tex.tiles('#dde5df', '#d2dcd5', '#b7c4bb', 5, 'inf_f'),
    roughness: 0.5,
  });
  const wMat = createMaterial({
    color: 0xeef3ef,
    roughness: 0.9,
  });
  const wMint = createMaterial({
    color: 0xd8e5dc,
    roughness: 0.9,
  });
  addBox(4, 0.2, 20, flMat, 0, -0.1, 0, true, false, true);
  addBox(6, 0.2, 4, flMat, 5, -0.1, -0.5, true, false, true);
  addBox(6, 0.2, 4.5, flMat, 5, -0.1, -7.75, true, false, true);
  addBox(4, 0.2, 20, wMat, 0, 3.6, 0, false);
  addBox(6, 0.2, 4, wMat, 5, 3.6, -0.5, false);
  addBox(6, 0.2, 4.5, wMat, 5, 3.6, -7.75, false);
  addBox(0.2, 3.6, 20, wMint, -2.0, 1.8, 0, true);
  addBox(4.2, 3.6, 0.2, wMat, 0, 1.8, 10, true);
  addBox(10.2, 3.6, 0.2, wMat, 3.0, 1.8, -10, true);
  addBox(0.2, 3.6, 8.5, wMat, 2.0, 1.8, 5.75, true);
  addBox(0.2, 3.6, 3.0, wMat, 2.0, 1.8, -4.0, true);
  addBox(0.2, 3.6, 0.6, wMat, 2.0, 1.8, -2.2, true);
  addBox(0.2, 3.6, 0.7, wMat, 2.0, 1.8, 1.15, true);
  addBox(0.2, 3.6, 0.8, wMat, 2.0, 1.8, -9.6, true);
  addBox(0.2, 3.6, 0.8, wMat, 2.0, 1.8, -5.9, true);
  addBox(6.2, 3.6, 0.2, wMint, 5.0, 1.8, 1.5, true);
  addBox(6.2, 3.6, 0.2, wMint, 5.0, 1.8, -2.5, true);
  addBox(6.2, 3.6, 0.2, wMint, 5.0, 1.8, -5.5, true);
  addBox(0.2, 3.6, 4.2, wMat, 8.0, 1.8, -0.5, true);
  addBox(0.2, 3.6, 4.7, wMat, 8.0, 1.8, -7.75, true);

  addBox(
    1.5,
    2.5,
    0.14,
    createMaterial({
      map: tex.wood('#8c623d', '#634224'),
    }),
    0,
    1.25,
    9.84,
    true,
  );
  addSign(
    1.5,
    0.72,
    tex.sign('学校教室 · 出门左转', '#f7f3e8', '#354a3a', '回教学楼门厅', true),
    0,
    2.85,
    9.8,
    Math.PI,
  );

  addBox(
    0.55,
    0.45,
    2.4,
    createMaterial({
      map: tex.wood('#c4a47c', '#9d7e58'),
    }),
    -1.45,
    0.23,
    4.2,
    true,
  );
  addSign(
    1.8,
    0.9,
    tex.sign('校医室走廊', '#eef4ef', '#2f5440', '前间：登记体检 · 尽头间：休息观察'),
    -1.88,
    1.85,
    5.5,
    Math.PI / 2,
  );
  addBox(
    1.5,
    0.75,
    0.8,
    createMaterial({
      map: tex.wood('#c4a47c', '#9d7e58'),
    }),
    5.6,
    0.38,
    -1.6,
    true,
  );
  addCylinder(
    0.06,
    0.06,
    0.14,
    10,
    createMaterial({
      color: 0xe6ecea,
      transparent: true,
      opacity: 0.7,
    }),
    5.2,
    0.82,
    -1.4,
  );
  addBox(
    1.1,
    1.7,
    0.45,
    createMaterial({
      color: 0xeaf0ec,
      roughness: 0.4,
    }),
    7.3,
    0.85,
    -1.9,
    true,
  );
  addSign(
    0.7,
    1.15,
    tex.sign('E Ǝ Ш M', '#f9faf7', '#202220', '五米视力表'),
    3.6,
    1.85,
    -2.38,
  );
  addBox(
    0.18,
    1.9,
    0.25,
    createMaterial({
      color: 0xf3efe4,
    }),
    7.82,
    0.95,
    0.4,
    true,
  );
  addSign(
    0.22,
    1.6,
    tex.sign('150cm', '#f7f3e8', '#3a5c4a', '130cm  110cm'),
    7.72,
    1.1,
    0.4,
    -Math.PI / 2,
  );
  addCylinder(
    0.14,
    0.11,
    0.18,
    8,
    createMaterial({
      color: 0x8a5b3e,
    }),
    7.4,
    0.9,
    -0.5,
  );
  addMesh(
    new T.ConeGeometry(0.12, 0.32, 6),
    createMaterial({
      color: 0x4e8a4c,
    }),
    7.4,
    1.1,
    -0.5,
  );
  addBox(
    2.0,
    0.55,
    1.05,
    createMaterial({
      color: 0xf4f4f0,
      roughness: 0.8,
    }),
    6.2,
    0.28,
    -8.8,
    true,
  );
  addBox(
    0.45,
    0.16,
    0.75,
    createMaterial({
      color: 0xffffff,
    }),
    6.9,
    0.62,
    -8.8,
    false,
  );
  addBox(
    2.0,
    0.55,
    1.05,
    createMaterial({
      color: 0xf4f4f0,
      roughness: 0.8,
    }),
    6.2,
    0.28,
    -6.7,
    true,
  );
  addBox(
    0.45,
    0.16,
    0.75,
    createMaterial({
      color: 0xffffff,
    }),
    6.9,
    0.62,
    -6.7,
    false,
  );
  const curtain = addBox(
    0.05,
    2.2,
    3.6,
    createMaterial({
      color: 0xa8cbb9,
      roughness: 0.95,
    }),
    4.6,
    1.35,
    -7.75,
    false,
  );
  let curtOpen = false;

  addInteract('inf_to_bbq', V(0, 1.4, 9.4), '推门回学校教室', '走出医务室回教学楼大厅', () => {
    const si = sceneIdxById('school_bbq');
    if (si !== -1) {
      sfx.play('door');
      addTimedRedirect(() => {
        state.pendingSpawn = {
          pos: V(-5.8, 1.76, 7.0),
          yaw: -Math.PI * 0.5,
        };
        loadScene(si);
        showWhisper('推门回到教学楼大厅，放学后的烤肉烟味又飘了过来。');
      }, 260);
    }
  });
  addInteract('inf_curtain', V(4.6, 1.2, -7.75), '拉动病床隔帘', '切换遮挡/敞开', () => {
    curtOpen = !curtOpen;
    curtain.scale.z = curtOpen ? 0.22 : 1;
    curtain.position.z = curtOpen ? -9.1 : -7.75;
    sfx.play('paper');
    showWhisper(
      curtOpen
        ? '布帘哗啦收拢，尽头屋里两张白床单亮堂堂的。'
        : '拉上浅绿布帘，尽头的病床间安静下来。',
    );
  });
  addInteract('inf_eye', V(3.6, 1.6, -2.2), '看视力表与登记本', '翻看登记小本子', () => {
    sfx.play('paper');
    openModal(
      '登记簿最后一页',
      '「周三第三节体育课\n两个小孩跑完两圈捂着肚子进来，问了才知早饭喝了冰牛奶。\n给兑了点温糖水躺二十分钟，自己活蹦乱跳回班里去了。」',
    );
  });
  addInteract('inf_desk', V(5.6, 0.85, -1.6), '打开药箱抽屉', '拿一粒薄荷糖', () => {
    sfx.play('chime');
    showWhisper('一股淡淡的碘伏和薄荷味，桌面擦得干干净净。');
  });

  addCollectible('infirmary', 6.2, 0.72, -6.7, 0x99cbb2);
  setBounds({ minX: -1.7, maxX: 7.7, minZ: -9.7, maxZ: 9.4 });
  setSurfaceFn(() => 'stone');

  return {
    pos: V(0, 1.65, 8.2),
    yaw: 0,
    whisper: '这条F字形的长走廊南门连着教学楼，尽头那间摆着病床和绿隔帘。',
  };
}

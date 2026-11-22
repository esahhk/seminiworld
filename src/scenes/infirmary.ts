import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';
import {
  addInstancedMeshes,
  buildHospitalBed,
  buildOfficeChair,
  buildParkBench,
  buildPottedPlant,
} from '../engine/propKit';
import type { InstanceTransform } from '../engine/propKit';

export function buildInfirmaryScene(ctx: SceneContext): SceneInitResult {
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
  const l1 = new T.PointLight(0xffffff, 0.78, 14);
  l1.position.set(0, 3.2, 4);
  scene.add(l1);
  const l2 = new T.PointLight(0xffffff, 0.78, 14);
  l2.position.set(4.5, 3.2, -0.5);
  scene.add(l2);
  const l3 = new T.PointLight(0xffffff, 0.78, 14);
  l3.position.set(4.5, 3.2, -7.8);
  scene.add(l3);

  const bump = tex.bumpNoise('inf_b', 20);
  const flMat = createMaterial({
    map: tex.tiles('#dde5df', '#d2dcd5', '#b7c4bb', 5, 'inf_f'),
    bumpMap: bump,
    bumpScale: 0.005,
    roughness: 0.48,
  });
  const wMat = createMaterial({ color: 0xeef3ef, roughness: 0.88 });
  const wMint = createMaterial({ color: 0xd8e5dc, roughness: 0.88 });
  const dadoRailMat = createMaterial({ color: 0x9bb8a7, roughness: 0.55 });
  const ledStripMat = createMaterial({ color: 0xffffff, emissive: 0xe8f5ed, emissiveIntensity: 0.95 });

  addBox(4, 0.2, 20, flMat, 0, -0.1, 0, true, false, true);
  addBox(6, 0.2, 4, flMat, 5, -0.1, -0.5, true, false, true);
  addBox(6, 0.2, 4.5, flMat, 5, -0.1, -7.75, true, false, true);
  addBox(4, 0.2, 20, wMat, 0, 3.6, 0, false);
  addBox(6, 0.2, 4, wMat, 5, 3.6, -0.5, false);
  addBox(6, 0.2, 4.5, wMat, 5, 3.6, -7.75, false);
  for (const lz of [6.5, 1.0, -4.5, -8.5]) {
    addBox(1.4, 0.04, 0.32, ledStripMat, 0, 3.49, lz, false, false, false);
  }
  addBox(1.8, 0.04, 0.36, ledStripMat, 5.0, 3.49, -0.5, false, false, false);
  addBox(1.8, 0.04, 0.36, ledStripMat, 5.0, 3.49, -7.75, false, false, false);

  addBox(0.2, 3.6, 20, wMint, -2.0, 1.8, 0, true);
  addBox(0.06, 0.14, 19.6, dadoRailMat, -1.87, 1.08, 0, false);
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

  addBox(1.64, 2.6, 0.22, createMaterial({ color: 0x5c4734 }), 0, 1.3, 9.88, false);
  addBox(
    1.5,
    2.5,
    0.14,
    createMaterial({ map: tex.wood('#8c623d', '#634224') }),
    0,
    1.25,
    9.84,
    true,
  );
  addBox(0.18, 0.04, 0.06, createMaterial({ color: 0xc2b698, metalness: 0.75 }), 0.45, 1.16, 9.75, false);
  addSign(
    1.5,
    0.72,
    tex.sign('学校教室 · 出门左转', '#f7f3e8', '#354a3a', '回教学楼门厅', true, 1.5 / 0.72),
    0,
    2.85,
    9.8,
    Math.PI,
  );

  buildParkBench(ctx, -1.45, 0, 4.2, Math.PI / 2, true);
  addSign(
    1.8,
    0.9,
    tex.sign('校医室走廊', '#eef4ef', '#2f5440', '前间：登记体检 · 尽头间：休息观察', false, 2),
    -1.88,
    1.85,
    5.5,
    Math.PI / 2,
  );

  const deskWood = createMaterial({ map: tex.wood('#c4a47c', '#9d7e58') });
  const steelMat = createMaterial({ color: 0xbcc4c8, metalness: 0.65, roughness: 0.3 });
  addBox(1.56, 0.06, 0.84, deskWood, 5.6, 0.74, -1.6, true);
  addBox(0.48, 0.68, 0.74, deskWood, 6.1, 0.36, -1.6, true);
  for (const [lx, lz] of [[4.9, -1.94], [4.9, -1.26]]) {
    addBox(0.05, 0.7, 0.05, steelMat, lx, 0.35, lz, false);
  }
  addBox(0.32, 0.03, 0.4, createMaterial({ color: 0x3b6e56 }), 5.55, 0.78, -1.55, false);
  addCylinder(0.055, 0.055, 0.14, 10, createMaterial({ color: 0xe6ecea, transparent: true, opacity: 0.7 }), 5.2, 0.84, -1.4);
  buildOfficeChair(ctx, 5.45, 0, -0.82, 0.25, 0x456e5c, true);
  buildPottedPlant(ctx, 6.08, 0.76, -1.7, 0.65, 0x8a5b3e);

  addBox(1.16, 1.78, 0.46, createMaterial({ color: 0xeaf0ec, roughness: 0.38 }), 7.3, 0.89, -1.9, true);
  addBox(
    0.98,
    0.84,
    0.04,
    createMaterial({ color: 0xaad4dc, transparent: true, opacity: 0.38 }),
    7.3,
    1.28,
    -1.66,
    false,
  );
  const pillCols = [0xd46a4e, 0x5299c2, 0xf0c954, 0x5aa878, 0xe8e4d8];
  const pillMats = pillCols.map((c) => createMaterial({ color: c, roughness: 0.45 }));
  const pillGeo = track(new T.CylinderGeometry(0.04, 0.04, 0.13, 8));
  const pillCapItems: InstanceTransform[] = [];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 5; col++) {
      const bx = 6.92 + col * 0.18;
      const by = 1.0 + row * 0.35;
      addMesh(pillGeo, pillMats[(row + col) % pillMats.length], bx, by, -1.82, false, false);
      pillCapItems.push({ x: bx, y: by + 0.075, z: -1.82 });
    }
  }
  addInstancedMeshes(
    ctx,
    new T.CylinderGeometry(0.032, 0.032, 0.025, 8),
    createMaterial({ color: 0xf4f4ee, roughness: 0.35 }),
    pillCapItems,
    false,
    false,
  );
  addBox(0.75, 0.04, 0.46, steelMat, 3.6, 0.84, -1.2, false);
  for (const [cx, cz] of [[3.28, -1.38], [3.92, -1.38], [3.28, -1.02], [3.92, -1.02]]) {
    addCylinder(0.02, 0.02, 0.82, 6, steelMat, cx, 0.42, cz, false);
  }
  addBox(0.28, 0.04, 0.18, steelMat, 3.55, 0.88, -1.2, false);

  addBox(0.76, 1.22, 0.05, createMaterial({ color: 0x3b4440 }), 3.6, 1.85, -2.4, false);
  addSign(
    0.7,
    1.15,
    tex.sign('E Ǝ Ш M', '#f9faf7', '#202220', '五米视力表', false, 0.7 / 1.15),
    3.6,
    1.85,
    -2.36,
  );

  addBox(0.46, 0.08, 0.56, steelMat, 7.66, 0.04, 0.4, false);
  addBox(0.18, 1.9, 0.25, createMaterial({ color: 0xf3efe4 }), 7.82, 0.95, 0.4, true);
  addSign(0.22, 1.6, tex.heightChart(), 7.72, 1.1, 0.4, -Math.PI / 2);

  buildHospitalBed(ctx, 6.2, 0, -8.8, 0, true);
  buildHospitalBed(ctx, 6.2, 0, -6.7, 0, true);

  addBox(0.46, 0.66, 0.44, createMaterial({ color: 0xebf0ed }), 7.45, 0.33, -7.75, true);
  addCylinder(0.06, 0.07, 0.18, 10, createMaterial({ color: 0xd0e6ec, transparent: true, opacity: 0.65 }), 7.45, 0.76, -7.75);

  addCylinder(0.22, 0.24, 0.04, 12, steelMat, 7.25, 0.02, -9.55, false);
  addCylinder(0.018, 0.018, 1.85, 8, steelMat, 7.25, 0.95, -9.55, false);
  addBox(0.24, 0.03, 0.03, steelMat, 7.15, 1.86, -9.55, false);
  addCylinder(0.045, 0.045, 0.16, 8, createMaterial({ color: 0xd9f0f7, transparent: true, opacity: 0.7 }), 7.05, 1.72, -9.55, false);

  addCylinder(0.03, 0.03, 3.8, 8, steelMat, 4.6, 2.52, -7.75, false).rotation.x = Math.PI / 2;
  const curtain = addBox(
    0.05,
    2.2,
    3.6,
    createMaterial({ color: 0xa8cbb9, roughness: 0.95 }),
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

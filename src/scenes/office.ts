import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';
import { addInstancedMeshes, buildOfficeChair, buildPottedPlant } from '../engine/propKit';
import type { InstanceTransform } from '../engine/propKit';

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
  scene.fog = new T.Fog(0xc2d0dc, 18, 74);
  scene.add(new T.HemisphereLight(0xeef4fa, 0x737980, 0.92));

  const flLight = new T.PointLight(0xeef6ff, 0.95, 22);
  flLight.position.set(0, 3.55, 0);
  scene.add(flLight);

  const deskLamp = new T.PointLight(0xffd296, 1.0, 7);
  deskLamp.position.set(-3.15, 1.55, -2.55);
  scene.add(deskLamp);

  const winSun = new T.DirectionalLight(0xfff5e4, 0.55);
  winSun.position.set(16, 10, 3);
  winSun.castShadow = true;
  scene.add(winSun);

  const bump = tex.bumpNoise('off_b', 28);
  const carpetTex = tex.tiles('#525c66', '#4b555f', '#3f4852', 6, 'off_fl');
  carpetTex.repeat.set(3, 3);
  addBox(
    14,
    0.2,
    12,
    createMaterial({ map: carpetTex, bumpMap: bump, bumpScale: 0.012, roughness: 0.94 }),
    0,
    -0.1,
    0,
    true,
    false,
    true,
  );
  addBox(14, 0.2, 12, createMaterial({ color: 0xe5e6e2, roughness: 0.88 }), 0, 4.1, 0, false);

  const trofferFrameMat = createMaterial({ color: 0xc8ccd0, metalness: 0.4, roughness: 0.45 });
  const trofferGlowMat = createMaterial({
    color: 0xf7fbff,
    emissive: 0xdeeeff,
    emissiveIntensity: 0.85,
  });
  for (const tx of [-3.5, 3.5]) {
    for (const tz of [-3.2, 0, 3.2]) {
      addBox(1.5, 0.05, 0.72, trofferFrameMat, tx, 3.98, tz, false, false, false);
      addBox(1.36, 0.03, 0.58, trofferGlowMat, tx, 3.96, tz, false, false, false);
    }
  }

  const wallMat = createMaterial({
    color: 0xd8d6cf,
    normalMap: tex.concreteNormal('off_wn', 0.85),
    roughness: 0.9,
  });
  const dadoMat = createMaterial({ map: tex.wood('#8e6e4c', '#694f34', 'off_dado'), roughness: 0.72 });
  const baseTrimMat = createMaterial({ color: 0x3b4046, roughness: 0.65 });

  addBox(14, 4, 0.25, wallMat, 0, 2, -6, true);
  addBox(0.25, 4, 12, createMaterial({ color: 0xd0cec6, roughness: 0.9 }), -7, 2, 0, true);
  addBox(14, 4, 0.25, wallMat, 0, 2, 6, true);
  addBox(13.8, 0.14, 0.04, baseTrimMat, 0, 0.07, -5.86, false);
  addBox(13.8, 0.14, 0.04, baseTrimMat, 0, 0.07, 5.86, false);
  addBox(0.04, 0.14, 11.8, baseTrimMat, -6.86, 0.07, 0, false);
  addBox(13.8, 0.06, 0.06, dadoMat, 0, 1.05, -5.85, false);

  const acousticMat = createMaterial({ color: 0x9aa4ad, roughness: 0.95 });
  for (const ax of [-4.2, -1.6, 1.6, 4.2]) {
    addBox(1.9, 1.4, 0.05, acousticMat, ax, 2.25, -5.85, false);
  }

  addBox(0.3, 0.85, 12, wallMat, 7, 0.425, 0, true);
  addBox(0.3, 0.65, 12, wallMat, 7, 3.675, 0, true);
  addBox(0.3, 2.5, 2.2, wallMat, 7, 2.1, -4.9, true);
  addBox(0.3, 2.5, 2.2, wallMat, 7, 2.1, 4.9, true);
  addBox(0.46, 0.08, 7.8, createMaterial({ color: 0xc2bcb0, roughness: 0.45 }), 6.95, 0.88, 0, false);
  addBox(
    0.04,
    2.5,
    7.6,
    createMaterial({ color: 0x9ec4d6, transparent: true, opacity: 0.26, roughness: 0.08 }),
    7.06,
    2.1,
    0,
    true,
  );
  for (const mz of [-3.8, -1.26, 1.26, 3.8]) {
    addBox(0.1, 2.5, 0.07, createMaterial({ color: 0x454a50, metalness: 0.45 }), 7.02, 2.1, mz, false);
  }

  addBox(1.2, 0.34, 0.24, createMaterial({ color: 0xedece6, roughness: 0.4 }), -2.6, 3.55, -5.76, false);
  addBox(1.1, 0.04, 0.08, createMaterial({ color: 0x2c3035 }), -2.6, 3.41, -5.7, false);

  addBox(
    44,
    0.2,
    64,
    createMaterial({ color: 0x7c8791, roughness: 0.95 }),
    27,
    -14,
    0,
    false,
    false,
    false,
  );
  const skyTexA = tex.facadeWindows('#727f8a', '#f0d89e', 'off_sky_a');
  skyTexA.repeat.set(2, 4);
  const skyTexB = tex.facadeWindows('#65717d', '#dceeff', 'off_sky_b');
  skyTexB.repeat.set(2, 4);
  const skyMatA = createMaterial({ color: 0x8a97a2, map: skyTexA, roughness: 0.6 });
  const skyMatB = createMaterial({ color: 0x7b8894, map: skyTexB, roughness: 0.6 });
  const skyRoofMat = createMaterial({ color: 0x5c646c });
  const skySpecs: [number, number, number, number][] = [
    [24, -10, 26, 0],
    [26, 4, 30, 1],
    [33, -3, 34, 0],
    [23, 14, 22, 1],
    [36, 13, 28, 0],
  ];
  for (const [bx, bz, bh, mIdx] of skySpecs) {
    addBox(7.4, bh, 8.2, mIdx === 0 ? skyMatA : skyMatB, bx, -8 + bh / 2, bz, false, false, false);
    addBox(7.8, 0.35, 8.6, skyRoofMat, bx, -8 + bh + 0.17, bz, false, false, false);
  }

  const blindPos: { x: number; y: number; z: number }[] = [];
  const blindHeaderMat = createMaterial({ color: 0xd0cec4 });
  for (const bz of [-2.53, 0, 2.53]) {
    addBox(0.07, 0.07, 2.46, blindHeaderMat, 6.82, 3.3, bz, false);
    for (let r = 0; r < 18; r++) {
      blindPos.push({ x: 6.82, y: 0.98 + r * 0.13, z: bz });
    }
  }
  const blindInst = addInstancedMeshes(
    ctx,
    new T.BoxGeometry(0.085, 0.012, 2.42),
    createMaterial({ color: 0xeceae0, roughness: 0.6 }),
    blindPos.map((b) => ({ x: b.x, y: b.y, z: b.z, rz: 1.32 })),
    false,
    false,
  );
  const _blindDummy = new T.Object3D();
  addCylinder(0.012, 0.012, 1.5, 6, createMaterial({ color: 0xe6e4dc }), 6.72, 2.35, 3.7, false, false);
  let blindOpen = false;

  const doorFrameMat = createMaterial({ color: 0x454a50, metalness: 0.5, roughness: 0.4 });
  addBox(1.7, 2.84, 0.28, doorFrameMat, -4.2, 1.42, 5.88, false);
  addBox(1.5, 2.7, 0.14, createMaterial({ color: 0x6b7075, metalness: 0.35 }), -4.2, 1.35, 5.84, true);
  addBox(0.32, 0.14, 0.06, createMaterial({ color: 0x89b3c4, emissive: 0x355b6b, emissiveIntensity: 0.4 }), -4.2, 2.15, 5.76, false);
  addBox(0.18, 0.04, 0.06, createMaterial({ color: 0xc8cdd1, metalness: 0.75 }), -3.65, 1.24, 5.76, false);
  addSign(
    1.4,
    0.65,
    tex.sign('下楼 · 汉堡店', '#eae4d6', '#42372c', '一层商场中庭', false, 1.4 / 0.65),
    -4.2,
    3.08,
    5.82,
    Math.PI,
  );

  const lecWood = createMaterial({ map: tex.wood('#7b5838', '#573b22'), roughness: 0.72 });
  addBox(1.16, 0.08, 0.72, lecWood, 0, 0.04, -2.8, false);
  addBox(1.06, 1.1, 0.62, lecWood, 0, 0.59, -2.8, true);
  const lecTop = addBox(1.18, 0.06, 0.74, lecWood, 0, 1.16, -2.8, false);
  lecTop.rotation.x = 0.18;
  addBox(1.18, 0.04, 0.04, lecWood, 0, 1.12, -2.44, false);
  addBox(0.75, 0.35, 0.04, createMaterial({ color: 0x26292d, roughness: 0.85 }), 0, 0.85, -2.48, false);
  const micMat = createMaterial({ color: 0x26292e, metalness: 0.72, roughness: 0.32 });
  addCylinder(0.055, 0.065, 0.025, 10, micMat, 0.24, 1.18, -2.66);
  const mStem1 = addCylinder(0.012, 0.014, 0.22, 8, micMat, 0.24, 1.28, -2.66);
  mStem1.rotation.z = 0.28;
  const mStem2 = addCylinder(0.01, 0.012, 0.22, 8, micMat, 0.14, 1.44, -2.62);
  mStem2.rotation.set(0.42, 0, 0.62);
  addMesh(new T.SphereGeometry(0.038, 10, 10), createMaterial({ color: 0x3a3d42, metalness: 0.55 }), 0.04, 1.51, -2.56);
  addSign(
    0.45,
    0.34,
    tex.sign('发言稿：第三段', '#fbf8ef', '#2b2926', '放慢语速 · 别低头', true, 0.45 / 0.34),
    0,
    1.2,
    -2.8,
    0,
    -Math.PI / 2 + 0.18,
  );

  const deskWood = createMaterial({ map: tex.wood('#9c7852', '#735535'), roughness: 0.62 });
  const deskSteel = createMaterial({ color: 0x282d33, metalness: 0.55, roughness: 0.4 });
  addBox(2.24, 0.06, 1.04, deskWood, -3.6, 0.73, -2.5, true);
  for (const [lx, lz] of [[-4.6, -2.92], [-2.6, -2.92], [-4.6, -2.08], [-2.6, -2.08]]) {
    addBox(0.06, 0.7, 0.06, deskSteel, lx, 0.35, lz, false);
  }
  addBox(0.45, 0.66, 0.88, deskWood, -2.74, 0.35, -2.5, true);
  addBox(0.76, 0.01, 0.36, createMaterial({ color: 0x22262b, roughness: 0.9 }), -3.9, 0.765, -2.35, false);

  addBox(0.22, 0.02, 0.16, deskSteel, -3.9, 0.77, -2.72, false);
  addBox(0.05, 0.2, 0.03, deskSteel, -3.9, 0.86, -2.74, false);
  addBox(0.6, 0.34, 0.03, createMaterial({ color: 0x1e2226 }), -3.9, 1.02, -2.7, false);
  addBox(
    0.56,
    0.3,
    0.015,
    createMaterial({ color: 0x263f54, emissive: 0x3b6c8f, emissiveIntensity: 0.45 }),
    -3.9,
    1.02,
    -2.68,
    false,
  );
  addBox(0.36, 0.018, 0.13, deskSteel, -3.9, 0.77, -2.35, false);
  addBox(0.06, 0.022, 0.1, deskSteel, -3.62, 0.775, -2.34, false);

  addCylinder(0.09, 0.11, 0.025, 12, deskSteel, -3.22, 0.77, -2.74);
  addCylinder(0.014, 0.014, 0.36, 8, deskSteel, -3.22, 0.95, -2.76);
  const lampShade = addCylinder(0.07, 0.13, 0.14, 12, createMaterial({ color: 0x3b5848, metalness: 0.3 }), -3.2, 1.15, -2.62);
  lampShade.rotation.x = 0.4;

  addCylinder(0.05, 0.055, 0.12, 12, createMaterial({ color: 0xc96f4a }), -3.12, 0.82, -2.26);
  addCylinder(0.044, 0.044, 0.01, 10, createMaterial({ color: 0x3d2415 }), -3.12, 0.88, -2.26);
  addBox(0.32, 0.05, 0.42, createMaterial({ color: 0xe8dcc2, roughness: 0.8 }), -2.9, 0.785, -2.2, false);
  addBox(0.28, 0.04, 0.36, createMaterial({ color: 0xc8d2d9 }), -4.3, 0.78, -2.6, false);
  addBox(0.26, 0.04, 0.34, createMaterial({ color: 0xd9c29c }), -4.3, 0.82, -2.58, false).rotation.y = 0.12;
  buildOfficeChair(ctx, -3.6, 0, -1.65, 0.15, 0x262d35, true);

  addBox(0.95, 0.82, 0.75, createMaterial({ color: 0xd8d8d4, roughness: 0.5 }), 4.8, 0.41, -4.6, true);
  addBox(0.86, 0.24, 0.64, createMaterial({ color: 0xe4e6e8, roughness: 0.42 }), 4.8, 0.94, -4.6, false);
  addBox(0.88, 0.05, 0.66, createMaterial({ color: 0x3a4046 }), 4.8, 1.09, -4.6, false);
  addBox(0.22, 0.04, 0.14, createMaterial({ color: 0x2a2f34 }), 4.46, 0.98, -4.25, false);
  addBox(0.04, 0.02, 0.04, createMaterial({ color: 0x54d17a, emissive: 0x28994c, emissiveIntensity: 0.9 }), 4.55, 1.0, -4.22, false);

  addBox(0.55, 1.0, 0.55, createMaterial({ color: 0xe6e6e2, roughness: 0.4 }), -5.8, 0.5, -4.8, true);
  addCylinder(0.2, 0.2, 0.48, 12, createMaterial({ color: 0x78b2d4, transparent: true, opacity: 0.65 }), -5.8, 1.26, -4.8);
  addBox(0.04, 0.08, 0.04, createMaterial({ color: 0x386bb0 }), -5.72, 0.94, -4.5, false);
  addBox(0.04, 0.08, 0.04, createMaterial({ color: 0xc94238 }), -5.88, 0.94, -4.5, false);

  addBox(0.06, 1.32, 2.52, createMaterial({ color: 0x8c969e, metalness: 0.5 }), -6.86, 2.0, -1.5, false);
  addBox(0.12, 0.04, 2.4, createMaterial({ color: 0x8c969e, metalness: 0.5 }), -6.8, 1.34, -1.5, false);
  addSign(
    2.4,
    1.2,
    tex.sign('周四前借投影线', '#f4f6f8', '#2f4354', '白板便签（擦一半）', true, 2),
    -6.82,
    2.0,
    -1.5,
    Math.PI / 2,
  );

  for (let x = -2.5; x <= 2.5; x += 1.6) {
    buildOfficeChair(ctx, x, 0, 1.85, Math.PI, 0x35404b, true);
  }
  const cupItems: InstanceTransform[] = [
    { x: -5.8, y: 0.85, z: -4.45, color: 0xf4f4ee },
    { x: -5.8, y: 0.89, z: -4.45, color: 0xf4f4ee },
  ];
  addInstancedMeshes(ctx, new T.CylinderGeometry(0.032, 0.026, 0.08, 8), createMaterial({ roughness: 0.5 }), cupItems, false, false);

  buildPottedPlant(ctx, -6.1, 0, 4.9, 1.1, 0x8c563a);
  buildPottedPlant(ctx, 6.0, 0, -5.0, 1.05, 0x6e7378);

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
      if (blindInst) {
        const rz = blindOpen ? 0.05 : 1.32;
        for (let i = 0; i < blindPos.length; i++) {
          const b = blindPos[i];
          _blindDummy.position.set(b.x, b.y, b.z);
          _blindDummy.rotation.set(0, 0, rz);
          _blindDummy.updateMatrix();
          blindInst.setMatrixAt(i, _blindDummy.matrix);
        }
        blindInst.instanceMatrix.needsUpdate = true;
      }
      flLight.intensity = blindOpen ? 1.25 : 0.95;
      winSun.intensity = blindOpen ? 1.1 : 0.55;
      sfx.play('switch');
      showWhisper(
        blindOpen
          ? '横叶齐刷刷转平，窗玻璃外头的阴天楼群和光一下涌进屋来。'
          : '叶片垂落挡住窗外，室内只剩顶灯和台灯的暖黄。',
      );
    },
  );
  addInteract('off_lamp', V(-3.2, 0.9, -2.5), '开关办公桌台灯', '冷暖光切换', () => {
    deskLamp.intensity = deskLamp.intensity > 0 ? 0 : 1.0;
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

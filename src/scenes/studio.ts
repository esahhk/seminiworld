import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';

export function buildStudioScene(ctx: SceneContext): SceneInitResult {
  const {
    T,
    scene,
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
    sceneIdxById,
    loadScene,
    showWhisper,
    openBook,
    setBounds,
    setSurfaceFn,
  } = ctx;

  scene.background = new T.Color(0xcfd4d8);
  scene.fog = new T.Fog(0xcfd4d8, 18, 52);
  scene.add(new T.HemisphereLight(0xfcfaf2, 0x857869, 1.0));
  const sky = new T.DirectionalLight(0xfffdf5, 0.95);
  sky.position.set(-4, 10, 4);
  sky.castShadow = true;
  scene.add(sky);
  const subLight = new T.PointLight(0xdcebf7, 0.95, 24);
  subLight.position.set(11, 2.5, 0);
  scene.add(subLight);

  const bump = tex.bumpNoise('stu_b', 20);
  addBox(
    9,
    0.2,
    9,
    createMaterial({
      map: tex.wood('#9c7853', '#705134', 'stu_f'),
      bumpMap: bump,
      bumpScale: 0.008,
      roughness: 0.72,
    }),
    0,
    -0.1,
    0,
    true,
    false,
    true,
  );
  const wallMat = createMaterial({ color: 0xebe5d8, bumpMap: bump, bumpScale: 0.005, roughness: 0.92 });
  const trimMat = createMaterial({ color: 0x6b5038, roughness: 0.7 });
  addBox(9, 3.8, 0.2, wallMat, 0, 1.9, -4.5, true);
  addBox(0.2, 3.8, 9, createMaterial({ color: 0xe3dcd0, roughness: 0.92 }), -4.5, 1.9, 0, true);
  addBox(9, 3.8, 0.2, createMaterial({ color: 0xe3dcd0, roughness: 0.92 }), 0, 1.9, 4.5, true);
  addBox(8.8, 0.14, 0.04, trimMat, 0, 0.07, -4.38, false);
  addBox(0.04, 0.14, 8.8, trimMat, -4.38, 0.07, 0, false);
  addBox(8.8, 0.14, 0.04, trimMat, 0, 0.07, 4.38, false);
  addBox(9, 0.2, 9, createMaterial({ color: 0xebe5d8 }), 0, 3.8, 0, false);

  addBox(1.8, 0.05, 0.05, createMaterial({ color: 0x2b2e33, metalness: 0.6 }), 0, 3.65, -0.6, false);
  for (const lx of [-0.6, 0.6]) {
    addCylinder(0.06, 0.08, 0.16, 10, createMaterial({ color: 0x222529 }), lx, 3.55, -0.6, false).rotation.x = 0.6;
  }

  addBox(0.2, 0.85, 7.1, createMaterial({ color: 0xe8e2d6 }), 4.5, 0.425, -0.95, true);
  addBox(0.2, 3.8, 0.5, createMaterial({ color: 0xe8e2d6 }), 4.5, 1.9, 4.25, true);
  addBox(0.2, 1.25, 1.4, createMaterial({ color: 0xe8e2d6 }), 4.5, 3.175, 3.3, true);
  addBox(0.2, 0.7, 7.1, createMaterial({ color: 0xe8e2d6 }), 4.5, 3.45, -0.95, true);
  addBox(0.2, 2.4, 1.5, createMaterial({ color: 0xe8e2d6 }), 4.5, 2.0, -3.75, true);
  addBox(0.2, 2.4, 0.3, createMaterial({ color: 0xe8e2d6 }), 4.5, 2.0, 2.45, true);
  addBox(
    0.06,
    2.4,
    5.3,
    createMaterial({ color: 0x9ec3d6, transparent: true, opacity: 0.24, roughness: 0.08 }),
    4.5,
    2.0,
    -0.35,
    true,
  );
  for (const wz of [-2.2, -0.35, 1.5]) {
    addBox(0.12, 2.4, 0.06, createMaterial({ color: 0x5c646c }), 4.46, 2.0, wz, false);
  }
  const doorFrameMat = createMaterial({ color: 0x5c646c, metalness: 0.55, roughness: 0.4 });
  addBox(0.24, 2.56, 0.08, doorFrameMat, 4.5, 1.28, 2.6, true);
  addBox(0.24, 2.56, 0.08, doorFrameMat, 4.5, 1.28, 4.0, true);
  addBox(0.24, 0.08, 1.48, doorFrameMat, 4.5, 2.56, 3.3, false);
  addBox(
    0.08,
    2.5,
    1.32,
    createMaterial({ color: 0x7aa4ba, transparent: true, opacity: 0.45, roughness: 0.15 }),
    4.5,
    1.25,
    3.3,
    true,
  );
  addBox(0.05, 0.18, 0.36, createMaterial({ color: 0xc9b484, metalness: 0.75 }), 4.43, 1.15, 2.85, false);
  addSign(
    1.4,
    0.65,
    tex.sign('下楼 → 地铁站', '#1f3c5c', '#f0f2f4', '1/4/7号线站台', false, 1.4 / 0.65),
    4.34,
    3.05,
    3.3,
    -Math.PI / 2,
  );

  addBox(
    15,
    0.3,
    44,
    createMaterial({ map: tex.tiles('#b8bcbf', '#adb2b5', '#8c9194', 6, 'sub_p') }),
    12.5,
    -1.6,
    0,
    false,
    false,
    true,
  );
  addBox(0.2, 0.04, 44, createMaterial({ color: 0xd9b334 }), 8.2, -1.42, 0, false);
  addBox(0.2, 0.04, 44, createMaterial({ color: 0xd9b334 }), 16.8, -1.42, 0, false);
  addBox(20, 0.4, 44, createMaterial({ color: 0x262b30 }), 13.5, 3.6, 0, false);
  for (const pz of [-10, -2, 6]) {
    addBox(0.65, 5.0, 0.65, createMaterial({ color: 0xd8ddd8 }), 11.2, 1.0, pz, false);
  }

  function makeViewTrain(col: number, tx: number) {
    const g = new T.Group();
    const b = mkMesh(new T.BoxGeometry(2.4, 2.6, 15), createMaterial({ color: 0xd8dce0 }), 0, 1.3, 0);
    const s = mkMesh(new T.BoxGeometry(2.45, 0.4, 15.02), createMaterial({ color: col }), 0, 1.25, 0);
    const w = mkMesh(
      new T.BoxGeometry(2.44, 0.7, 13),
      createMaterial({ color: 0x2c3f4f, emissive: 0x7ba4bd, emissiveIntensity: 0.4 }),
      0,
      1.85,
      0,
    );
    const hl = mkMesh(new T.BoxGeometry(1.6, 0.16, 0.1), createMaterial({ color: 0xfff5d6, emissive: 0xffd98a, emissiveIntensity: 1.2 }), 0, 1.0, 7.52);
    g.add(b, s, w, hl);
    g.position.set(tx, -1.6, 0);
    scene.add(g);
    return g;
  }

  const vt1 = makeViewTrain(0xc94238, 6.6);
  const vt2 = makeViewTrain(0x2f78b8, 18.4);
  updaters.push((_dt, t) => {
    vt1.position.z = ((t * 6.5) % 56) - 28;
    vt2.position.z = 28 - ((t * 5.8 + 14) % 56);
  });

  const easelWood = createMaterial({ map: tex.wood('#785233', '#52351e') });
  const legL = addBox(0.07, 1.82, 0.07, easelWood, -0.34, 0.9, -1.78, false);
  legL.rotation.z = -0.14;
  legL.rotation.x = -0.1;
  const legR = addBox(0.07, 1.82, 0.07, easelWood, 0.34, 0.9, -1.78, false);
  legR.rotation.z = 0.14;
  legR.rotation.x = -0.1;
  const legB = addBox(0.07, 1.78, 0.07, easelWood, 0, 0.85, -2.18, false);
  legB.rotation.x = 0.25;
  addBox(1.16, 0.06, 0.14, easelWood, 0, 0.79, -1.65, false);
  addBox(0.09, 1.75, 0.09, easelWood, 0, 1.15, -1.76, true);

  const paintCanvas = document.createElement('canvas');
  paintCanvas.width = 256;
  paintCanvas.height = 256;
  const pg = paintCanvas.getContext('2d');
  if (pg) {
    pg.fillStyle = '#f5f0e4';
    pg.fillRect(0, 0, 256, 256);
    pg.fillStyle = '#c9c2b2';
    pg.fillRect(20, 160, 216, 76);
    pg.fillStyle = '#5d7e91';
    pg.beginPath();
    pg.arc(110, 120, 48, 0, Math.PI * 2);
    pg.fill();
  }
  const paintTex = track(new T.CanvasTexture(paintCanvas));
  paintTex.colorSpace = T.SRGBColorSpace;
  if (state.studioImg && pg) {
    const img = new Image();
    img.onload = () => {
      pg.drawImage(img, 0, 0);
      paintTex.needsUpdate = true;
    };
    img.src = state.studioImg;
  }

  addMesh(
    new T.BoxGeometry(1.1, 1.3, 0.06),
    createMaterial({ map: paintTex, roughness: 0.8 }),
    0,
    1.46,
    -1.66,
  ).rotation.x = -0.12;

  const tblWood = createMaterial({ map: tex.wood('#876342', '#614328') });
  addBox(1.86, 0.06, 0.9, tblWood, -2.8, 0.72, -2.5, true);
  for (const [lx, lz] of [[-3.62, -2.88], [-1.98, -2.88], [-3.62, -2.12], [-1.98, -2.12]]) {
    addBox(0.06, 0.7, 0.06, tblWood, lx, 0.35, lz, false);
  }
  const paletteCols = ['#c94c38', '#386b9c', '#e0ae3a', '#4d804c', '#2d2a28'];
  let colIdx = 0;
  paletteCols.forEach((c, i) => {
    addCylinder(0.028, 0.028, 0.16, 8, createMaterial({ color: c }), -3.3 + i * 0.18, 0.79, -2.4).rotation.z = Math.PI / 2;
  });
  addCylinder(0.08, 0.08, 0.18, 10, createMaterial({ color: 0xdde6ea, transparent: true, opacity: 0.65 }), -2.2, 0.84, -2.6);
  for (const [bx, rz] of [[-2.23, 0.25], [-2.18, -0.22]]) {
    addCylinder(0.008, 0.006, 0.26, 6, tblWood, bx, 0.9, -2.6, false).rotation.z = rz;
  }
  addBox(0.36, 0.05, 0.48, createMaterial({ color: 0xf4efe2, roughness: 0.9 }), -2.2, 0.77, -2.18, false);

  addBox(0.9, 1.1, 0.08, createMaterial({ color: 0xd8ccb8 }), 3.8, 0.55, -3.6, true);
  addBox(0.82, 1.02, 0.05, easelWood, 3.8, 0.55, -3.57, false);
  addBox(1.1, 1.3, 0.08, createMaterial({ color: 0xc9d3d6 }), 3.6, 0.65, -3.4, true);

  addSign(
    1.1,
    1.4,
    tex.sign('城市写生草图', '#d4d0c5', '#36454f', '炭笔 · 站台光线', false, 1.1 / 1.4),
    -4.36,
    1.85,
    -1.2,
    Math.PI / 2,
  );

  addCylinder(0.22, 0.22, 0.06, 12, easelWood, 0.9, 0.46, -0.6);
  for (let l = 0; l < 3; l++) {
    const a = (l * Math.PI * 2) / 3;
    addCylinder(0.022, 0.02, 0.45, 6, easelWood, 0.9 + Math.cos(a) * 0.14, 0.225, -0.6 + Math.sin(a) * 0.14);
  }

  addInteract('stu_easel', V(0, 1.4, -1.6), '往画架画布上添一笔颜料', '叠加色块与笔触', () => {
    if (pg) {
      pg.fillStyle = paletteCols[colIdx];
      pg.globalAlpha = 0.78;
      pg.beginPath();
      pg.ellipse(
        40 + Math.random() * 176,
        40 + Math.random() * 176,
        14 + Math.random() * 28,
        8 + Math.random() * 18,
        Math.random() * 3,
        0,
        Math.PI * 2,
      );
      pg.fill();
      pg.globalAlpha = 1;
      paintTex.needsUpdate = true;
      state.studioImg = paintCanvas.toDataURL();
    }
    sfx.play('paint');
    showWhisper(
      '刮刀抹上去一笔厚实的' +
        ['朱红', '群青', '藤黄', '橄榄绿', '煤黑'][colIdx] +
        '，窗外刚好一列地铁滑过去。',
    );
  });
  addInteract(
    'stu_paper',
    V(-2.2, 0.85, -2.18),
    '翻看桌上自印小论文',
    '《南方梅雨季廉价丙烯的起皮动力学》（长文六节）',
    () => openBook('studio'),
  );
  addInteract('stu_table', V(-3.0, 0.9, -2.5), '换一种桌面颜料管颜色', '切换下一管颜料', () => {
    colIdx = (colIdx + 1) % paletteCols.length;
    sfx.play('switch');
    showWhisper('挑出了一管' + ['朱红', '群青', '藤黄', '橄榄绿', '煤黑'][colIdx] + '颜料。');
  });
  addInteract('stu_subway', V(4.1, 1.4, 3.3), '推门下楼去地铁站', '回到多线地铁站台', () => {
    const mi = sceneIdxById('subway');
    if (mi !== -1) {
      sfx.play('door');
      loadScene(mi);
      showWhisper('顺着画室旁边的楼梯走下了地铁站台。');
    }
  });

  addCollectible('studio', -2.3, 0.85, -2.4, 0x3f6fa3);
  setBounds({ minX: -3.8, maxX: 3.9, minZ: -3.8, maxZ: 3.8 });
  setSurfaceFn(() => 'wood');

  return {
    pos: V(0, 1.65, 2.8),
    yaw: 0,
    whisper: '画室东边一整面玻璃外就是地铁站台，时不时有彩色列车从窗底下穿过。',
  };
}

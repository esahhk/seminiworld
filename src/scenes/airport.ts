import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';

export function buildAirportScene(ctx: SceneContext): SceneInitResult {
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
    syncColX,
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

  scene.background = new T.Color(0xb8cee0);
  scene.fog = new T.Fog(0xb8cee0, 34, 120);
  scene.add(new T.HemisphereLight(0xf2f7fc, 0x7d858c, 1.05));
  const sun = new T.DirectionalLight(0xfff7e6, 1.2);
  sun.position.set(-14, 22, -25);
  sun.castShadow = true;
  scene.add(sun);

  addBox(
    27,
    0.2,
    21,
    createMaterial({
      map: tex.tiles('#cfd3d6', '#c5cacd', '#9fa5a8', 6, 'air_f'),
      roughness: 0.3,
    }),
    0,
    -0.1,
    1.5,
    true,
    false,
    true,
  );
  addBox(
    27,
    0.3,
    21,
    createMaterial({ color: 0xdfe5ea, roughness: 0.75 }),
    0,
    11.5,
    1.5,
    false,
  );
  for (let x = -12; x <= 12; x += 6) {
    addBox(
      0.28,
      0.45,
      21,
      createMaterial({ color: 0xb5bec4, metalness: 0.4 }),
      x,
      10.8,
      1.5,
      false,
    );
  }

  const frameMat = createMaterial({ color: 0x464e57, metalness: 0.55, roughness: 0.4 });
  const glassMat = createMaterial({
    color: 0x8fb9cf,
    transparent: true,
    opacity: 0.3,
    roughness: 0.08,
  });
  const kickMat = createMaterial({ color: 0x2b3238, roughness: 0.7 });

  addBox(27, 0.24, 0.26, frameMat, 0, 11.38, -9.0, false);
  addBox(27, 0.28, 0.28, kickMat, 0, 0.14, -9.0, false);
  for (const mx of [-13.4, -9.5, -5.7, -1.9, 1.9, 5.7, 9.5, 13.4]) {
    addBox(0.24, 11.5, 0.28, frameMat, mx, 5.75, -9.0, true);
  }
  for (const transY of [3.35, 7.4]) {
    addBox(27, 0.16, 0.22, frameMat, 0, transY, -9.0, false);
  }
  for (const [cx, w] of [
    [-11.45, 3.66],
    [-7.6, 3.56],
    [-3.8, 3.56],
    [3.8, 3.56],
    [7.6, 3.56],
    [11.45, 3.66],
  ]) {
    addBox(w, 11.2, 0.1, glassMat, cx, 5.75, -9.0, true);
  }
  addBox(3.6, 7.9, 0.1, glassMat, 0, 7.4, -9.0, true);
  const gateL = addBox(
    1.8,
    3.2,
    0.14,
    createMaterial({ color: 0x7eb0c9, transparent: true, opacity: 0.5 }),
    -0.95,
    1.6,
    -8.95,
    true,
  );
  const gateR = addBox(
    1.8,
    3.2,
    0.14,
    createMaterial({ color: 0x7eb0c9, transparent: true, opacity: 0.5 }),
    0.95,
    1.6,
    -8.95,
    true,
  );
  addSign(
    1.4,
    0.55,
    tex.sign('03 登机口', '#1e2833', '#e8c366', '请勿靠近玻璃'),
    -3.8,
    1.6,
    -8.86,
  );
  addSign(
    1.4,
    0.55,
    tex.sign('03 登机口', '#1e2833', '#e8c366', '请勿靠近玻璃'),
    3.8,
    1.6,
    -8.86,
  );

  for (const sx of [-13.5, 13.5]) {
    addBox(0.26, 0.28, 21, kickMat, sx, 0.14, 1.5, false);
    addBox(0.26, 0.24, 21, frameMat, sx, 11.38, 1.5, false);
    for (const mz of [-4.8, -0.6, 3.6, 7.8, 12.0]) {
      addBox(0.28, 11.5, 0.24, frameMat, sx, 5.75, mz, true);
    }
    addBox(0.1, 11.2, 20.8, glassMat, sx, 5.75, 1.5, true);
  }
  addBox(
    27,
    11.5,
    0.28,
    createMaterial({ color: 0xd8dee3, roughness: 0.85 }),
    0,
    5.75,
    12.0,
    true,
  );

  const boardCanvas = document.createElement('canvas');
  boardCanvas.width = 512;
  boardCanvas.height = 256;
  const bg = boardCanvas.getContext('2d');
  const boardTex = track(new T.CanvasTexture(boardCanvas));
  boardTex.colorSpace = T.SRGBColorSpace;
  let lastBoardMin = -1;

  function drawBoard(minNow: number) {
    lastBoardMin = minNow;
    if (!bg) {
      return;
    }
    const d = new Date(Date.now() + 20 * 60000);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    bg.fillStyle = '#1d2732';
    bg.fillRect(0, 0, 512, 256);
    bg.strokeStyle = '#4f6578';
    bg.lineWidth = 6;
    bg.strokeRect(8, 8, 496, 240);
    bg.fillStyle = '#e8c366';
    bg.textAlign = 'center';
    bg.font = 'bold 40px sans-serif';
    bg.fillText('GATE 03  登机口', 256, 78);
    bg.fillStyle = '#d9e6f0';
    bg.font = 'bold 34px sans-serif';
    bg.fillText('CA1408  ·  登机时间 ' + hh + ':' + mm, 256, 158);
    bg.fillStyle = '#8ea6ba';
    bg.font = '22px sans-serif';
    bg.fillText('当前候机开放中', 256, 212);
    boardTex.needsUpdate = true;
  }

  drawBoard(Math.floor(Date.now() / 60000));
  addBox(2.8, 1.05, 0.9, createMaterial({ color: 0x424d57, roughness: 0.5 }), -4.2, 0.52, -5.5, true);
  addMesh(
    new T.PlaneGeometry(2.4, 1.2),
    createMaterial({ map: boardTex, side: T.DoubleSide }),
    -4.2,
    2.6,
    -5.8,
    false,
    false,
  );

  const postMat = createMaterial({ color: 0x9aa3ab, metalness: 0.7, roughness: 0.28 });
  const beltMat = createMaterial({ color: 0x2b4e6e, roughness: 0.7 });
  for (const [px, pz] of [
    [5.8, -5.2],
    [5.8, -2.8],
    [5.8, -0.4],
    [8.0, -5.2],
    [8.0, -2.8],
    [8.0, -0.4],
    [10.2, -5.2],
    [10.2, -2.8],
    [10.2, -0.4],
  ]) {
    addCylinder(0.04, 0.04, 0.95, 8, postMat, px, 0.48, pz);
    addCylinder(0.14, 0.14, 0.04, 10, postMat, px, 0.02, pz);
  }
  addBox(0.04, 0.07, 4.8, beltMat, 5.8, 0.85, -2.8, true);
  addBox(0.04, 0.07, 4.8, beltMat, 8.0, 0.85, -2.8, true);
  addBox(0.04, 0.07, 4.8, beltMat, 10.2, 0.85, -2.8, true);
  addBox(2.2, 0.07, 0.04, beltMat, 6.9, 0.85, -5.2, true);
  addBox(2.2, 0.07, 0.04, beltMat, 9.1, 0.85, -0.4, true);
  addSign(0.9, 0.5, tex.sign('请在此排队', '#eef3f6', '#233342', '1米线'), 5.8, 1.25, -5.2);

  for (const x of [1.8, 3.4]) {
    for (const z of [1.5, 4.5]) {
      addBox(1.8, 0.45, 0.75, createMaterial({ color: 0x364452 }), x, 0.35, z, true);
    }
  }

  addBox(
    60,
    0.2,
    40,
    createMaterial({ map: tex.concrete('#6b7075', 0.15, 'tarmac') }),
    0,
    -0.2,
    -30,
    false,
  );

  const bodyMat = createMaterial({ color: 0xf4f6f8, roughness: 0.28, metalness: 0.32 });
  const wingMat = createMaterial({ color: 0xd9dfe5, roughness: 0.25, metalness: 0.45 });
  const darkMetal = createMaterial({ color: 0x2b323a, metalness: 0.6, roughness: 0.35 });
  const liveryBlue = createMaterial({ color: 0x2b5f8c, roughness: 0.35 });

  addCylinder(1.9, 1.9, 14.5, 22, bodyMat, 0, 3.25, -24.5).rotation.x = Math.PI / 2;
  addCylinder(0.95, 1.9, 3.2, 22, bodyMat, 0, 3.05, -15.65).rotation.x = Math.PI / 2;
  addMesh(new T.SphereGeometry(0.95, 16, 12), bodyMat, 0, 2.95, -14.1);
  const tailCone = addCylinder(0.45, 1.9, 4.5, 20, bodyMat, 0, 3.45, -34.0);
  tailCone.rotation.x = Math.PI / 2 - 0.08;
  addBox(0.14, 0.32, 13.8, liveryBlue, 1.88, 3.05, -24.5, false);
  addBox(0.14, 0.32, 13.8, liveryBlue, -1.88, 3.05, -24.5, false);
  for (let w = 0; w < 14; w++) {
    const wz = -18.5 - w * 0.9;
    addBox(0.06, 0.26, 0.32, darkMetal, 1.9, 3.45, wz, false);
    addBox(0.06, 0.26, 0.32, darkMetal, -1.9, 3.45, wz, false);
  }
  addBox(0.08, 1.5, 0.85, createMaterial({ color: 0xd4dade }), 1.9, 3.3, -17.4, false);
  addBox(0.08, 1.5, 0.85, createMaterial({ color: 0xd4dade }), -1.9, 3.3, -17.4, false);
  addBox(0.85, 0.55, 0.55, darkMetal, -0.52, 3.58, -15.6, false).rotation.set(0.28, -0.35, 0);
  addBox(0.85, 0.55, 0.55, darkMetal, 0.52, 3.58, -15.6, false).rotation.set(0.28, 0.35, 0);
  addBox(0.7, 0.55, 0.4, darkMetal, 0, 3.6, -15.5, false).rotation.x = 0.28;

  const wingL = addBox(12.5, 0.22, 3.2, wingMat, -7.2, 2.55, -24.8, true);
  wingL.rotation.set(0, 0.36, -0.06);
  const wingR = addBox(12.5, 0.22, 3.2, wingMat, 7.2, 2.55, -24.8, true);
  wingR.rotation.set(0, -0.36, 0.06);
  addBox(0.14, 1.25, 0.75, liveryBlue, -13.0, 3.45, -27.3, false).rotation.z = 0.24;
  addBox(0.14, 1.25, 0.75, liveryBlue, 13.0, 3.45, -27.3, false).rotation.z = -0.24;

  addBox(0.26, 4.6, 3.1, liveryBlue, 0, 6.2, -33.2, false).rotation.x = -0.45;
  addBox(8.4, 0.16, 1.8, wingMat, 0, 3.85, -34.2, false);

  for (const ex of [-5.4, 5.4]) {
    addCylinder(0.82, 0.78, 2.7, 16, wingMat, ex, 1.72, -21.8).rotation.x = Math.PI / 2;
    addCylinder(0.68, 0.68, 0.14, 14, darkMetal, ex, 1.72, -20.42).rotation.x = Math.PI / 2;
    addCylinder(0.55, 0.7, 0.65, 12, darkMetal, ex, 1.72, -23.3).rotation.x = Math.PI / 2;
    addBox(0.22, 0.85, 1.6, wingMat, ex, 2.35, -22.2, false);
  }

  addCylinder(0.11, 0.11, 1.8, 8, darkMetal, 0, 0.9, -15.4);
  addCylinder(0.32, 0.32, 0.18, 12, darkMetal, -0.22, 0.22, -15.4).rotation.z = Math.PI / 2;
  addCylinder(0.32, 0.32, 0.18, 12, darkMetal, 0.22, 0.22, -15.4).rotation.z = Math.PI / 2;
  addBox(0.65, 0.18, 0.55, createMaterial({ color: 0xe3b12c }), 0, 0.0, -15.4, false);
  for (const gx of [-2.4, 2.4]) {
    addCylinder(0.13, 0.13, 2.1, 8, darkMetal, gx, 0.95, -24.5);
    addCylinder(0.45, 0.45, 0.22, 12, darkMetal, gx - 0.24, 0.35, -24.5).rotation.z = Math.PI / 2;
    addCylinder(0.45, 0.45, 0.22, 12, darkMetal, gx + 0.24, 0.35, -24.5).rotation.z = Math.PI / 2;
  }
  addBox(3.8, 3.4, 16, createMaterial({ visible: false }), 0, 1.7, -23.0, true, false, false);

  let gateOpen = false;
  updaters.push((dt) => {
    const off = gateOpen ? 2.3 : 0.95;
    gateL.position.x += (-off - gateL.position.x) * Math.min(1, dt * 5);
    gateR.position.x += (off - gateR.position.x) * Math.min(1, dt * 5);
    syncColX(gateL, 0.9);
    syncColX(gateR, 0.9);
    const curMin = Math.floor(Date.now() / 60000);
    if (curMin !== lastBoardMin) {
      drawBoard(curMin);
    }
  });

  addInteract('air_desk', V(-4.2, 1.1, -5.0), '打开飞机前玻璃登机门', '滑开两侧玻璃出去看看机头', () => {
    gateOpen = !gateOpen;
    sfx.play('chime');
    showWhisper(
      gateOpen
        ? '玻璃感应门向两侧滑开，可以走到机坪上看机头了。'
        : '玻璃门闭合，高高的钢架吊顶下重归凉爽。',
    );
  });
  addInteract('air_board', V(-4.2, 1.6, -5.4), '看一眼登机显示屏', '查看实时更新的登机时间', () => {
    sfx.play('chime');
    showWhisper('屏幕上那行登机时间还在往后跳，像是催人又不像催人。');
  });
  addInteract(
    'air_nose',
    V(0, 1.6, -13.6),
    '近距离看看飞机机头',
    '看看停机坪上的这架窄体客机',
    () => {
      sfx.play('paper');
      openModal(
        '3号登机口外',
        '走到停机坪上离机鼻只有两步远。\n驾驶舱挡风玻璃里头能看见副驾正在低头翻文件夹，底下前轮边垫着两个亮黄色轮挡，发动机进气叶片在风里轻轻晃。',
      );
    },
    { radius: 3.8 },
  );

  addCollectible('airport', 3.2, 0.75, 2.8, 0xa4cde8);
  setBounds({ minX: -12.6, maxX: 12.6, minZ: -21.0, maxZ: 11.2 });
  setHeightFn((_x, z) => (z < -9.0 ? -0.1 : 0));
  setSurfaceFn(() => 'stone');

  return {
    pos: V(0, 1.65, 7.5),
    yaw: 0,
    whisper: '高挑的钢架吊顶下面围着一圈玻璃幕墙，墙外就停着一架待发的客机。',
  };
}

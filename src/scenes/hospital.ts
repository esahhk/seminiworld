import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';
import { buildParkBench } from '../engine/propKit';

export function buildHospitalScene(ctx: SceneContext): SceneInitResult {
  const {
    T,
    scene,
    player,
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
    addTimedRedirect,
    colliders,
    updaters,
    sceneIdxById,
    loadScene,
    showWhisper,
    openModal,
    closeModal,
    setBounds,
    setSurfaceFn,
  } = ctx;

  scene.background = new T.Color(0xd7e1e2);
  scene.fog = new T.Fog(0xd7e1e2, 16, 48);
  scene.add(new T.HemisphereLight(0xf2f8fa, 0x829194, 0.85));
  const c1 = new T.PointLight(0xffffff, 0.55, 18);
  c1.position.set(0, 3.8, 7);
  scene.add(c1);
  const c2 = new T.PointLight(0xeef7f9, 0.6, 18);
  c2.position.set(-4.5, 3.8, -4);
  scene.add(c2);
  const c3 = new T.PointLight(0xd9ecf2, 0.55, 18);
  c3.position.set(4.7, 3.8, -4);
  scene.add(c3);

  const bump = tex.bumpNoise('hosp_b', 18);
  const flTex = tex.tiles('#dde2e1', '#d3d9d8', '#b9c0bf', 6, 'hosp_f');
  flTex.repeat.set(3, 5);
  const flMat = createMaterial({
    map: flTex,
    bumpMap: bump,
    bumpScale: 0.004,
    roughness: 0.34,
  });
  const wMat = createMaterial({ color: 0xe5eceb, roughness: 0.88 });
  const ceilMat = createMaterial({ color: 0xf3f5f5, roughness: 0.9 });
  const crashRailMat = createMaterial({ color: 0x7a9ea8, roughness: 0.45 });
  const ceilLightMat = createMaterial({ color: 0xf7fcfc, emissive: 0xdff2f5, emissiveIntensity: 0.92 });

  addBox(14.4, 0.2, 26.2, flMat, -0.3, -0.1, -1.6, true, false, true);
  addBox(16.0, 0.2, 28.0, ceilMat, 0, 4.2, -1.5, false);

  for (const [lx, lz] of [[0, 7.5], [-4.5, -1.0], [-4.5, -7.5], [4.7, -1.0], [4.7, -7.5], [4.7, -12.0]]) {
    addBox(1.2, 0.04, 2.4, ceilLightMat, lx, 4.08, lz, false, false, false);
  }

  addBox(5.2, 4.2, 0.2, wMat, 0, 2.1, 11.2, true);
  addBox(0.2, 4.2, 6.8, wMat, -2.5, 2.1, 7.8, true);
  addBox(0.2, 4.2, 6.8, wMat, 2.5, 2.1, 7.8, true);

  addBox(5.2, 4.2, 0.22, wMat, 0.5, 2.1, 1.1, true);
  addBox(5.2, 4.2, 0.22, wMat, 0.5, 2.1, -11.5, true);
  addBox(0.22, 4.2, 12.8, wMat, -2.0, 2.1, -5.2, true);
  addBox(0.22, 4.2, 15.8, wMat, 3.0, 2.1, -6.7, true);
  for (const pz of [-2.0, -6.2, -10.2]) {
    addBox(0.36, 4.2, 0.45, createMaterial({ color: 0xd5dfe0 }), -1.96, 2.1, pz, false);
    addBox(0.36, 4.2, 0.45, createMaterial({ color: 0xd5dfe0 }), 3.04, 2.1, pz, false);
  }
  addBox(4.6, 4.2, 0.2, wMat, -4.7, 2.1, 4.6, true);
  addBox(3.6, 4.2, 0.2, wMat, 4.7, 2.1, 4.6, true);
  addBox(0.2, 4.2, 16.2, wMat, -7.0, 2.1, -3.5, true);
  addBox(0.2, 4.2, 19.2, wMat, 6.4, 2.1, -5.0, true);
  addBox(5.2, 4.2, 0.2, wMat, -4.5, 2.1, -11.5, true);
  addBox(3.4, 4.2, 0.2, wMat, 4.7, 2.1, -14.5, true);

  const baseMat = createMaterial({ color: 0x4f6870, roughness: 0.62 });
  addBox(0.06, 0.14, 15.6, crashRailMat, -6.88, 0.98, -3.5, false);
  addBox(0.06, 0.14, 18.6, crashRailMat, 6.28, 0.98, -5.0, false);
  addBox(0.06, 0.14, 6.4, crashRailMat, -2.38, 0.98, 7.8, false);
  addBox(0.06, 0.14, 6.4, crashRailMat, 2.38, 0.98, 7.8, false);
  addBox(5.2, 0.14, 0.06, crashRailMat, 0.5, 0.98, 1.23, false);

  addBox(0.06, 0.16, 15.8, baseMat, -6.88, 0.08, -3.5, false);
  addBox(0.06, 0.16, 18.8, baseMat, 6.28, 0.08, -5.0, false);
  addBox(0.06, 0.16, 6.6, baseMat, -2.38, 0.08, 7.8, false);
  addBox(0.06, 0.16, 6.6, baseMat, 2.38, 0.08, 7.8, false);
  addBox(5.26, 0.16, 0.06, baseMat, 0.5, 0.08, 1.23, false);
  addBox(0.28, 4.2, 0.28, createMaterial({ color: 0xd0dbdc, roughness: 0.78 }), -2.04, 2.1, 1.1, false);
  addBox(0.28, 4.2, 0.28, createMaterial({ color: 0xd0dbdc, roughness: 0.78 }), 3.04, 2.1, 1.1, false);

  addBox(0.14, 0.24, 0.1, createMaterial({ color: 0xf4f6f6 }), -2.35, 1.25, 4.2, false);
  addBox(0.08, 0.08, 0.06, createMaterial({ color: 0x7cb8cf, transparent: true, opacity: 0.7 }), -2.32, 1.15, 4.2, false);

  addBox(2.5, 0.94, 0.05, createMaterial({ color: 0x8ea1a8, metalness: 0.55, roughness: 0.35 }), 0.5, 2.25, 1.22, false);
  addSign(
    2.4,
    0.85,
    tex.sign('← 隔离屏蔽门（左拐再右拐）', '#1c3542', '#eef6f7', '候机连廊（右拐再左拐） →'),
    0.5,
    2.25,
    1.26,
  );

  const lineMatB = createMaterial({
    color: 0x3684a8,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const lineMatG = createMaterial({
    color: 0x4b996b,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const lineMatO = createMaterial({
    color: 0xd1823b,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  addBox(0.26, 0.012, 7.34, lineMatB, -0.45, 0.015, 6.8, false);
  addBox(0.26, 0.012, 7.87, lineMatG, 0.0, 0.015, 6.665, false);
  addBox(0.26, 0.012, 7.6, lineMatO, 0.45, 0.015, 6.8, false);
  addBox(4.31, 0.012, 0.26, lineMatB, -2.475, 0.015, 3.0, false);
  addBox(0.26, 0.012, 11.87, lineMatB, -4.5, 0.015, -3.065, false);
  addBox(4.96, 0.012, 0.26, lineMatG, 2.35, 0.015, 2.6, false);
  addBox(0.26, 0.012, 16.41, lineMatG, 4.7, 0.015, -5.735, false);
  addSign(
    2.2,
    0.9,
    tex.sign('蓝线:隔离屏蔽门  绿线:候机连廊', '#1c3542', '#eef6f7', '请沿地面标志线通行'),
    0,
    0.032,
    7.2,
    0,
    -Math.PI / 2,
  );

  const radTex = tex.radiation();
  const radMat = createMaterial({
    map: radTex,
    side: T.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  addMesh(new T.PlaneGeometry(1.5, 1.5), radMat, -4.5, 0.036, -1.6, false, false).rotation.x =
    -Math.PI / 2;
  addMesh(new T.PlaneGeometry(1.5, 1.5), radMat, -4.5, 0.036, -5.4, false, false).rotation.x =
    -Math.PI / 2;

  const doorFrameMat = createMaterial({ color: 0xbcc7ca, metalness: 0.45, roughness: 0.42 });
  const brushedSteelMat = createMaterial({ color: 0x9aa9b0, metalness: 0.72, roughness: 0.28 });
  const doorBodyMat = createMaterial({ color: 0x6f858d, metalness: 0.38, roughness: 0.46 });
  const rubberSealMat = createMaterial({ color: 0x202529, roughness: 0.9, metalness: 0.05 });
  const leadGlassMat = createMaterial({
    color: 0x7cb0ba,
    transparent: true,
    opacity: 0.36,
    roughness: 0.12,
    metalness: 0.18,
  });

  addBox(1.2, 4.2, 0.56, doorFrameMat, -6.3, 2.1, -3.5, true);
  addBox(1.2, 4.2, 0.56, doorFrameMat, -2.7, 2.1, -3.5, true);
  addBox(3.4, 0.85, 0.56, doorFrameMat, -4.5, 3.78, -3.5, true);
  addBox(2.45, 0.025, 0.62, brushedSteelMat, -4.5, 0.014, -3.5, false);

  addBox(4.85, 0.16, 0.22, brushedSteelMat, -3.6, 3.44, -3.18, false);
  addBox(4.85, 0.05, 0.06, rubberSealMat, -3.6, 3.36, -3.12, false);

  const doorGroup = new T.Group();
  doorGroup.position.set(-4.5, 0, -3.5);
  scene.add(doorGroup);

  doorGroup.add(
    mkMesh(new T.BoxGeometry(3.4, 1.62, 0.36), doorBodyMat, 0, 0.81, 0, true, true),
    mkMesh(new T.BoxGeometry(3.4, 0.86, 0.36), doorBodyMat, 0, 2.87, 0, true, true),
    mkMesh(new T.BoxGeometry(1.16, 0.82, 0.36), doorBodyMat, -1.12, 2.03, 0, true, true),
    mkMesh(new T.BoxGeometry(1.16, 0.82, 0.36), doorBodyMat, 1.12, 2.03, 0, true, true),

    mkMesh(new T.BoxGeometry(1.08, 0.78, 0.08), leadGlassMat, 0, 2.03, 0, false, false),
    mkMesh(new T.BoxGeometry(1.14, 0.06, 0.4), rubberSealMat, 0, 2.43, 0, false, false),
    mkMesh(new T.BoxGeometry(1.14, 0.06, 0.4), rubberSealMat, 0, 1.63, 0, false, false),
    mkMesh(new T.BoxGeometry(0.06, 0.84, 0.4), rubberSealMat, -0.55, 2.03, 0, false, false),
    mkMesh(new T.BoxGeometry(0.06, 0.84, 0.4), rubberSealMat, 0.55, 2.03, 0, false, false),

    mkMesh(new T.BoxGeometry(3.44, 0.42, 0.38), brushedSteelMat, 0, 0.21, 0, false, true),
    mkMesh(new T.BoxGeometry(3.44, 0.08, 0.39), brushedSteelMat, 0, 3.28, 0, false, false),

    mkMesh(new T.BoxGeometry(0.07, 3.3, 0.38), rubberSealMat, -1.72, 1.65, 0, false, false),
    mkMesh(new T.BoxGeometry(0.07, 3.3, 0.38), rubberSealMat, 1.72, 1.65, 0, false, false),

    mkMesh(new T.BoxGeometry(0.24, 0.22, 0.14), brushedSteelMat, -0.95, 3.36, 0.26, false, false),
    mkMesh(new T.BoxGeometry(0.24, 0.22, 0.14), brushedSteelMat, 0.95, 3.36, 0.26, false, false),

    mkMesh(
      new T.BoxGeometry(3.2, 0.12, 0.39),
      createMaterial({ map: tex.hazard(), roughness: 0.6 }),
      0,
      0.52,
      0,
      false,
      false,
    ),
  );

  for (const sideZ of [0.24, -0.24]) {
    doorGroup.add(
      mkMesh(new T.CylinderGeometry(0.028, 0.028, 0.72, 10), brushedSteelMat, -0.82, 1.25, sideZ),
      mkMesh(new T.BoxGeometry(0.06, 0.06, 0.1), brushedSteelMat, -0.82, 1.56, sideZ * 0.82),
      mkMesh(new T.BoxGeometry(0.06, 0.06, 0.1), brushedSteelMat, -0.82, 0.94, sideZ * 0.82),
    );
  }

  const doorSignPlane = mkMesh(
    new T.PlaneGeometry(1.42, 0.42),
    createMaterial({
      map: tex.sign('隔离屏蔽铁门', '#d68536', '#1b1a18', '电动气密 · 请勿倚靠'),
      roughness: 0.55,
    }),
    0,
    1.26,
    0.195,
    false,
    false,
  );
  doorGroup.add(doorSignPlane);

  const doorCol = {
    minX: -6.2,
    maxX: -2.8,
    minZ: -3.72,
    maxZ: -3.28,
    minY: 0,
    maxY: 3.3,
    active: true,
  };
  colliders.push(doorCol);

  const beacon = addMesh(
    new T.SphereGeometry(0.14, 10, 10),
    createMaterial({
      color: 0xc93a2b,
      emissive: 0xaa2218,
      emissiveIntensity: 0.8,
    }),
    -2.9,
    3.62,
    -3.16,
  );
  const btnMat = createMaterial({
    color: 0x5ab885,
    emissive: 0x266e46,
    emissiveIntensity: 0.5,
  });
  addBox(0.32, 0.46, 0.08, createMaterial({ color: 0xdfe4e5 }), -2.35, 1.35, -3.2, false);
  addBox(0.16, 0.16, 0.04, btnMat, -2.35, 1.35, -3.15, false);
  addBox(0.32, 0.46, 0.08, createMaterial({ color: 0xdfe4e5 }), -2.35, 1.35, -3.8, false);
  addBox(0.16, 0.16, 0.04, btnMat, -2.35, 1.35, -3.85, false);

  addBox(0.55, 1.0, 1.1, createMaterial({ color: 0xc8cfd1, metalness: 0.5 }), -6.4, 0.5, -7.2, true);
  addBox(0.58, 0.04, 1.14, brushedSteelMat, -6.4, 1.02, -7.2, false);
  addCylinder(0.11, 0.11, 0.92, 10, createMaterial({ color: 0x386694 }), -6.58, 0.46, -6.15);
  addCylinder(0.04, 0.04, 0.12, 8, brushedSteelMat, -6.58, 0.96, -6.15);
  buildParkBench(ctx, -2.9, 0, -7.6, -Math.PI / 2, true);

  const deskGroup = new T.Group();
  deskGroup.position.set(-4.5, 0, -10.58);
  scene.add(deskGroup);

  const deskTopMat = createMaterial({
    map: tex.wood('#3a3e44', '#2b2e33', 'hosp_desk'),
    roughness: 0.58,
    metalness: 0.1,
  });
  const blackSteelMat = createMaterial({ color: 0x1a1d22, metalness: 0.45, roughness: 0.42 });
  const pcChassisMat = createMaterial({ color: 0x13161a, metalness: 0.38, roughness: 0.44 });
  const pcMatteBlack = createMaterial({ color: 0x1e2228, metalness: 0.2, roughness: 0.68 });
  const pcGlassMat = createMaterial({
    color: 0x1e2832,
    transparent: true,
    opacity: 0.48,
    roughness: 0.08,
    metalness: 0.25,
  });
  const cyanLedMat = createMaterial({
    color: 0x8ef2ea,
    emissive: 0x3ec8be,
    emissiveIntensity: 1.15,
  });
  const deskMatFabric = createMaterial({ color: 0x181b20, roughness: 0.92 });

  deskGroup.add(
    mkMesh(new T.BoxGeometry(1.72, 0.06, 0.8), deskTopMat, 0, 0.75, 0, true, true),
    mkMesh(new T.BoxGeometry(0.05, 0.72, 0.05), blackSteelMat, -0.8, 0.36, -0.34, true, false),
    mkMesh(new T.BoxGeometry(0.05, 0.72, 0.05), blackSteelMat, -0.8, 0.36, 0.34, true, false),
    mkMesh(new T.BoxGeometry(0.05, 0.04, 0.72), blackSteelMat, -0.8, 0.02, 0, false, false),
    mkMesh(new T.BoxGeometry(0.05, 0.72, 0.05), blackSteelMat, 0.8, 0.36, -0.34, true, false),
    mkMesh(new T.BoxGeometry(0.05, 0.72, 0.05), blackSteelMat, 0.8, 0.36, 0.34, true, false),
    mkMesh(new T.BoxGeometry(0.05, 0.04, 0.72), blackSteelMat, 0.8, 0.02, 0, false, false),
    mkMesh(new T.BoxGeometry(1.58, 0.14, 0.03), blackSteelMat, 0, 0.62, -0.34, false, false),
    mkMesh(new T.BoxGeometry(0.42, 0.66, 0.68), pcChassisMat, 0.55, 0.35, 0.01, true, true),
    mkMesh(new T.BoxGeometry(0.16, 0.02, 0.025), brushedSteelMat, 0.55, 0.58, 0.36, false, false),
    mkMesh(new T.BoxGeometry(0.16, 0.02, 0.025), brushedSteelMat, 0.55, 0.37, 0.36, false, false),
    mkMesh(new T.BoxGeometry(0.16, 0.02, 0.025), brushedSteelMat, 0.55, 0.16, 0.36, false, false),
    mkMesh(new T.BoxGeometry(0.84, 0.006, 0.36), deskMatFabric, -0.14, 0.783, 0.14, false, true),
    mkMesh(new T.CylinderGeometry(0.038, 0.038, 0.095, 10), createMaterial({ color: 0x332b42 }), -0.68, 0.825, 0.15, false, false),
    mkMesh(new T.BoxGeometry(0.03, 0.22, 0.03), blackSteelMat, -0.68, 0.89, -0.18, false, false),
    mkMesh(new T.TorusGeometry(0.075, 0.018, 6, 16, Math.PI), blackSteelMat, -0.68, 1.0, -0.18, false, false),
  );

  const towerX = 0.58;
  const towerZ = -0.05;
  deskGroup.add(
    mkMesh(new T.BoxGeometry(0.04, 0.02, 0.04), rubberSealMat, towerX - 0.08, 0.79, towerZ - 0.17),
    mkMesh(new T.BoxGeometry(0.04, 0.02, 0.04), rubberSealMat, towerX + 0.08, 0.79, towerZ - 0.17),
    mkMesh(new T.BoxGeometry(0.04, 0.02, 0.04), rubberSealMat, towerX - 0.08, 0.79, towerZ + 0.17),
    mkMesh(new T.BoxGeometry(0.04, 0.02, 0.04), rubberSealMat, towerX + 0.08, 0.79, towerZ + 0.17),
    mkMesh(new T.BoxGeometry(0.22, 0.45, 0.44), pcChassisMat, towerX, 1.025, towerZ, true, true),
    mkMesh(new T.BoxGeometry(0.2, 0.41, 0.02), pcMatteBlack, towerX, 1.025, towerZ + 0.225),
    mkMesh(
      new T.TorusGeometry(0.048, 0.006, 8, 18),
      cyanLedMat,
      towerX,
      1.11,
      towerZ + 0.236,
      false,
      false,
    ),
    mkMesh(
      new T.TorusGeometry(0.048, 0.006, 8, 18),
      cyanLedMat,
      towerX,
      0.95,
      towerZ + 0.236,
      false,
      false,
    ),
    mkMesh(new T.BoxGeometry(0.032, 0.008, 0.012), cyanLedMat, towerX - 0.05, 1.254, towerZ + 0.18),
    mkMesh(new T.BoxGeometry(0.012, 0.37, 0.36), pcGlassMat, towerX - 0.112, 1.03, towerZ),
    mkMesh(new T.BoxGeometry(0.02, 0.024, 0.22), cyanLedMat, towerX - 0.095, 0.99, towerZ - 0.02),
  );

  const screenTex = track(new T.TextureLoader().load('/assets/aistudio/IMG_9951_6079adba.jpeg'));
  screenTex.colorSpace = T.SRGBColorSpace;
  screenTex.minFilter = T.LinearFilter;
  const screenMat = createMaterial({
    map: screenTex,
    emissive: 0xffffff,
    emissiveMap: screenTex,
    emissiveIntensity: 0.72,
    roughness: 0.16,
  });

  const noteCanvas = document.createElement('canvas');
  noteCanvas.width = 360;
  noteCanvas.height = 156;
  const nctx = noteCanvas.getContext('2d');
  if (nctx) {
    nctx.fillStyle = '#fff2a6';
    nctx.fillRect(0, 0, 360, 156);
    nctx.fillStyle = '#f3df82';
    nctx.fillRect(0, 0, 360, 26);
    nctx.strokeStyle = '#d4bd62';
    nctx.lineWidth = 4;
    nctx.strokeRect(2, 2, 356, 152);
    nctx.fillStyle = '#6c54a8';
    nctx.beginPath();
    nctx.arc(32, 63, 8, 0, Math.PI * 2);
    nctx.fill();
    nctx.fillStyle = '#261e36';
    nctx.font =
      'bold 24px "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", "PingFang SC", "Microsoft YaHei", sans-serif';
    nctx.fillText('25時、ナイトコードで。', 48, 72);
    nctx.strokeStyle = 'rgba(108, 84, 168, 0.35)';
    nctx.lineWidth = 2;
    nctx.beginPath();
    nctx.moveTo(24, 92);
    nctx.lineTo(336, 92);
    nctx.stroke();
    nctx.fillStyle = '#4e3d70';
    nctx.font = '20px "PingFang SC", "Microsoft YaHei", sans-serif';
    nctx.textAlign = 'center';
    nctx.fillText('按 E 传送到 Nightcord', 180, 128);
  }
  const noteTex = track(new T.CanvasTexture(noteCanvas));
  noteTex.colorSpace = T.SRGBColorSpace;
  const noteMat = createMaterial({
    map: noteTex,
    emissive: 0xfff0a0,
    emissiveMap: noteTex,
    emissiveIntensity: 0.16,
    roughness: 0.72,
  });
  const tapeMat = createMaterial({
    color: 0xe8e4d5,
    transparent: true,
    opacity: 0.58,
    roughness: 0.4,
  });

  const monX = -0.14;
  const monZ = -0.16;
  const stickyNote = mkMesh(
    new T.BoxGeometry(0.24, 0.115, 0.004),
    noteMat,
    monX + 0.11,
    0.875,
    monZ + 0.029,
    false,
    false,
  );
  stickyNote.rotation.z = -0.045;
  const stickyTape = mkMesh(
    new T.PlaneGeometry(0.068, 0.022),
    tapeMat,
    monX + 0.112,
    0.932,
    monZ + 0.032,
    false,
    false,
  );
  stickyTape.rotation.z = 0.05;

  deskGroup.add(
    mkMesh(new T.BoxGeometry(0.26, 0.016, 0.16), blackSteelMat, monX, 0.788, monZ),
    mkMesh(new T.BoxGeometry(0.055, 0.24, 0.035), blackSteelMat, monX, 0.91, monZ - 0.04),
    mkMesh(new T.BoxGeometry(0.68, 0.4, 0.028), pcChassisMat, monX, 1.12, monZ + 0.01, true, false),
    mkMesh(new T.PlaneGeometry(0.64, 0.36), screenMat, monX, 1.125, monZ + 0.026, false, false),
    stickyNote,
    stickyTape,
    mkMesh(new T.BoxGeometry(0.018, 0.008, 0.006), cyanLedMat, monX + 0.28, 0.935, monZ + 0.026),
    mkMesh(new T.BoxGeometry(0.38, 0.018, 0.14), pcChassisMat, monX - 0.06, 0.795, 0.14),
    mkMesh(new T.BoxGeometry(0.35, 0.01, 0.11), pcMatteBlack, monX - 0.06, 0.808, 0.14),
    mkMesh(new T.BoxGeometry(0.34, 0.004, 0.006), cyanLedMat, monX - 0.06, 0.804, 0.205),
    mkMesh(new T.BoxGeometry(0.066, 0.028, 0.11), pcChassisMat, monX + 0.24, 0.8, 0.15),
    mkMesh(new T.BoxGeometry(0.012, 0.008, 0.022), brushedSteelMat, monX + 0.24, 0.816, 0.12),
  );

  const pcGlow = new T.PointLight(0x9c82e8, 0.68, 4.8);
  pcGlow.position.set(-4.64, 1.32, -10.25);
  scene.add(pcGlow);

  const chairGroup = new T.Group();
  chairGroup.position.set(-4.62, 0, -9.62);
  chairGroup.rotation.y = 0.26;
  scene.add(chairGroup);
  const chairFabricMat = createMaterial({ color: 0x22262c, roughness: 0.82 });
  chairGroup.add(
    mkMesh(new T.CylinderGeometry(0.035, 0.035, 0.42, 8), blackSteelMat, 0, 0.24, 0),
    mkMesh(new T.BoxGeometry(0.52, 0.035, 0.045), blackSteelMat, 0, 0.055, 0),
    mkMesh(new T.BoxGeometry(0.045, 0.035, 0.52), blackSteelMat, 0, 0.055, 0),
    mkMesh(new T.BoxGeometry(0.48, 0.07, 0.46), chairFabricMat, 0, 0.46, 0, true, true),
    mkMesh(new T.BoxGeometry(0.46, 0.52, 0.06), chairFabricMat, 0, 0.76, 0.21, true, true),
    mkMesh(new T.BoxGeometry(0.05, 0.2, 0.3), blackSteelMat, -0.25, 0.58, 0.02),
    mkMesh(new T.BoxGeometry(0.05, 0.2, 0.3), blackSteelMat, 0.25, 0.58, 0.02),
  );

  colliders.push({
    minX: -5.42,
    maxX: -3.58,
    minZ: -11.02,
    maxZ: -9.85,
    minY: 0,
    maxY: 1.5,
    active: true,
  });

  addBox(2.42, 3.16, 0.22, doorFrameMat, 4.7, 1.58, -14.34, false);
  addBox(
    2.2,
    3.0,
    0.14,
    createMaterial({ color: 0x99bdcc, transparent: true, opacity: 0.45 }),
    4.7,
    1.5,
    -14.3,
    true,
  );
  addBox(0.24, 0.05, 0.08, brushedSteelMat, 3.9, 1.25, -14.2, false);
  addSign(
    2.0,
    0.85,
    tex.sign('候机连廊 · 通往机场', '#e4edf0', '#22343d', '往前出航站楼'),
    4.7,
    3.24,
    -14.22,
  );

  let doorOpen = false;
  const hospDoorInter = addInteract(
    'hosp_door',
    V(-4.5, 1.4, -3.15),
    '开启隔离屏蔽铁门',
    '打开后可直接穿过门洞',
    () => {
      doorOpen = !doorOpen;
      sfx.play('door');
      showWhisper(
        doorOpen
          ? '气压阀轻嗤一声，这扇半米厚的隔离铁门顺着滑轨缓缓滑开了。'
          : '厚重铁门沿着滑轨合拢，发出一声低沉闷响。',
      );
    },
    {
      radius: 3.8,
      getLabel: () => (doorOpen ? '关闭隔离屏蔽铁门' : '开启隔离屏蔽铁门'),
    },
  );
  updaters.push((dt, t) => {
    doorGroup.position.x += ((doorOpen ? -1.4 : -4.5) - doorGroup.position.x) * Math.min(1, dt * 2.4);
    doorCol.minX = doorGroup.position.x - 1.7;
    doorCol.maxX = doorGroup.position.x + 1.7;
    (beacon.material as InstanceType<typeof T.MeshStandardMaterial>).emissiveIntensity = doorOpen
      ? 0.2
      : 1.1;
    pcGlow.intensity = 0.58 + Math.sin(t * 2.6) * 0.08;
    hospDoorInter.pos.z = player.pos.z > -3.5 ? -3.15 : -3.85;
    hospDoorInter.pos.x = doorGroup.position.x > -3.0 ? -2.4 : -4.5;
  });

  addInteract(
    'hosp_pc',
    V(-4.5, 1.15, -10.2),
    '操作黑色台式电脑',
    '传送到 Nightcord',
    () => {
      sfx.play('click');
      openModal(
        '隔离区终端 · Nightcord',
        '黑色主机风扇低声运转，屏幕停留在 25 时的聊天界面。\n\n显示器下沿贴着一张手写便签：「25時、ナイトコードで。」。\n\n这台电脑连接着一处不出现在“切换世界”里的隐藏去处，是否现在传送？',
        [
          {
            label: '传送到 Nightcord',
            href: 'https://nightcord.esahhk.xyz',
            fn: () => {
              sfx.play('chime');
              closeModal();
            },
          },
          { label: '离开电脑', fn: closeModal },
        ],
        { meta: '隐藏传送点 · Nightcord' },
      );
    },
    { radius: 2.6 },
  );

  addInteract('hosp_floor', V(0, 0.2, 7.2), '低头看地面彩色标志线', '核对分岔方向', () => {
    sfx.play('paper');
    openModal(
      '地面色彩导引',
      '蓝线往左拐再右拐，通向尽头那扇画着防辐射标志的隔离屏蔽铁门；\n绿线和橙线往右拐，顺着灰青色的连廊直通机场候机区。\n\n地面打过蜡，走上去鞋底发出清脆响声。',
    );
  });
  addInteract(
    'hosp_to_air',
    V(4.7, 1.4, -13.8),
    '推门去机场候机区',
    '穿过长连廊去航站楼',
    () => {
      const ai = sceneIdxById('airport');
      if (ai !== -1) {
        sfx.play('door');
        addTimedRedirect(() => {
          state.pendingSpawn = {
            pos: V(10.5, 1.65, 5.5),
            yaw: Math.PI * 0.25,
          };
          loadScene(ai);
          showWhisper('走出连廊玻璃门，眼前突然挑高成一片宽敞的机场候机大厅。');
        }, 300);
      }
    },
  );

  addCollectible('hospital', -6.4, 1.1, -7.2, 0x77b8d4);
  setBounds({ minX: -6.8, maxX: 6.2, minZ: -14.2, maxZ: 10.9 });
  setSurfaceFn(() => 'stone');

  return {
    pos: V(0, 1.65, 9.4),
    yaw: 0,
    whisper: '左边那扇厚重的隔离铁门后似乎亮着一点冷青色微光，右边连廊一直通到候机区。',
  };
}

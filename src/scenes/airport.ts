import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';
import { addInstancedMeshes, buildPottedPlant } from '../engine/propKit';
import type { InstanceTransform } from '../engine/propKit';

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
  const sun = new T.DirectionalLight(0xfff7e6, 1.25);
  sun.position.set(-14, 22, -25);
  sun.castShadow = true;
  scene.add(sun);

  const bump = tex.bumpNoise('air_b', 18);
  addBox(
    27,
    0.2,
    21,
    createMaterial({
      map: tex.tiles('#cfd3d6', '#c5cacd', '#9fa5a8', 6, 'air_f'),
      bumpMap: bump,
      bumpScale: 0.004,
      roughness: 0.28,
    }),
    0,
    -0.1,
    1.5,
    true,
    false,
    true,
  );
  addBox(27, 0.3, 21, createMaterial({ color: 0xdfe5ea, roughness: 0.75 }), 0, 11.5, 1.5, false);
  const ceilTrussMat = createMaterial({ color: 0xb5bec4, metalness: 0.45, roughness: 0.4 });
  for (let x = -12; x <= 12; x += 6) {
    addBox(0.28, 0.45, 21, ceilTrussMat, x, 10.8, 1.5, false);
  }
  const ceilLampMat = createMaterial({ color: 0xf7fbff, emissive: 0xd9ecff, emissiveIntensity: 0.7 });
  for (const lx of [-9, -3, 3, 9]) {
    addBox(2.2, 0.06, 14, ceilLampMat, lx, 11.2, 1.5, false);
  }

  const frameMat = createMaterial({ color: 0x464e57, metalness: 0.58, roughness: 0.38 });
  const glassMat = createMaterial({
    color: 0x8fb9cf,
    transparent: true,
    opacity: 0.28,
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
  addSign(1.4, 0.55, tex.sign('03 登机口', '#1e2833', '#e8c366', '请勿靠近玻璃'), -3.8, 1.6, -8.86);
  addSign(1.4, 0.55, tex.sign('03 登机口', '#1e2833', '#e8c366', '请勿靠近玻璃'), 3.8, 1.6, -8.86);

  for (const sx of [-13.5, 13.5]) {
    addBox(0.26, 0.28, 21, kickMat, sx, 0.14, 1.5, false);
    addBox(0.26, 0.24, 21, frameMat, sx, 11.38, 1.5, false);
    for (const mz of [-4.8, -0.6, 3.6, 7.8, 12.0]) {
      addBox(0.28, 11.5, 0.24, frameMat, sx, 5.75, mz, true);
    }
    addBox(0.1, 11.2, 20.8, glassMat, sx, 5.75, 1.5, true);
  }
  addBox(27, 11.5, 0.28, createMaterial({ color: 0xd8dee3, roughness: 0.85 }), 0, 5.75, 12.0, true);

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
  addBox(2.9, 1.05, 0.92, createMaterial({ color: 0x3b4550, roughness: 0.45 }), -4.2, 0.52, -5.5, true);
  addBox(3.0, 0.08, 1.04, createMaterial({ color: 0xe6e8eb, roughness: 0.25 }), -4.2, 1.08, -5.5, false);
  for (const sx of [-4.9, -3.5]) {
    addBox(0.32, 0.22, 0.06, createMaterial({ color: 0x1c2228 }), sx, 1.24, -5.4, false);
    addBox(0.28, 0.18, 0.02, createMaterial({ color: 0x4ca3d9, emissive: 0x205b82, emissiveIntensity: 0.45 }), sx, 1.24, -5.37, false);
    addBox(0.18, 0.08, 0.22, createMaterial({ color: 0x282d33 }), sx + 0.34, 1.15, -5.25, false);
  }
  addBox(2.52, 1.32, 0.12, createMaterial({ color: 0x1e252d }), -4.2, 2.6, -5.84, false);
  addMesh(
    new T.PlaneGeometry(2.4, 1.2),
    createMaterial({ map: boardTex, side: T.DoubleSide }),
    -4.2,
    2.6,
    -5.76,
    false,
    false,
  );

  const postMat = createMaterial({ color: 0x9aa3ab, metalness: 0.72, roughness: 0.26 });
  const beltMat = createMaterial({ color: 0x2b4e6e, roughness: 0.7 });
  const postItems: InstanceTransform[] = [];
  const baseItems: InstanceTransform[] = [];
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
    postItems.push({ x: px, y: 0.48, z: pz });
    baseItems.push({ x: px, y: 0.02, z: pz });
  }
  addInstancedMeshes(ctx, new T.CylinderGeometry(0.04, 0.04, 0.95, 8), postMat, postItems, true, false);
  addInstancedMeshes(ctx, new T.CylinderGeometry(0.14, 0.14, 0.04, 10), postMat, baseItems, false, true);

  addBox(0.04, 0.07, 4.8, beltMat, 5.8, 0.85, -2.8, true);
  addBox(0.04, 0.07, 4.8, beltMat, 8.0, 0.85, -2.8, true);
  addBox(0.04, 0.07, 4.8, beltMat, 10.2, 0.85, -2.8, true);
  addBox(2.2, 0.07, 0.04, beltMat, 6.9, 0.85, -5.2, true);
  addBox(2.2, 0.07, 0.04, beltMat, 9.1, 0.85, -0.4, true);
  addSign(0.9, 0.5, tex.sign('请在此排队', '#eef3f6', '#233342', '1米线'), 5.8, 1.25, -5.2);

  const seatMat = createMaterial({ color: 0x364452, roughness: 0.75 });
  const chromeMat = createMaterial({ color: 0xbac2ca, metalness: 0.78, roughness: 0.24 });
  for (const x of [1.8, 3.4]) {
    for (const z of [1.5, 4.5]) {
      addBox(1.85, 0.08, 0.08, chromeMat, x, 0.34, z, false);
      addCylinder(0.04, 0.06, 0.34, 8, chromeMat, x - 0.75, 0.17, z, false);
      addCylinder(0.04, 0.06, 0.34, 8, chromeMat, x + 0.75, 0.17, z, false);
      for (const sx of [-0.58, 0, 0.58]) {
        addBox(0.5, 0.08, 0.54, seatMat, x + sx, 0.42, z, false);
        addBox(0.5, 0.46, 0.07, seatMat, x + sx, 0.68, z + 0.24, false);
      }
      for (const ax of [-0.88, -0.29, 0.29, 0.88]) {
        addBox(0.04, 0.18, 0.46, chromeMat, x + ax, 0.55, z, false);
      }
      addBox(1.85, 0.78, 0.65, createMaterial({ visible: false }), x, 0.4, z, true, false, false);
    }
  }

  addBox(0.85, 0.06, 1.25, chromeMat, -7.8, 0.16, 1.2, true);
  addBox(0.05, 0.85, 0.05, chromeMat, -8.18, 0.58, 1.78, false);
  addBox(0.05, 0.85, 0.05, chromeMat, -7.42, 0.58, 1.78, false);
  addBox(0.82, 0.05, 0.05, chromeMat, -7.8, 0.98, 1.78, false);
  addBox(0.56, 0.68, 0.34, createMaterial({ color: 0x3b6e8c, roughness: 0.32 }), -7.8, 0.54, 1.0, false);
  addBox(0.46, 0.52, 0.28, createMaterial({ color: 0xc29346, roughness: 0.38 }), -7.8, 0.46, 1.46, false);

  buildPottedPlant(ctx, -11.5, 0, 8.8, 1.4, 0x5d666e);
  buildPottedPlant(ctx, 11.5, 0, 8.8, 1.4, 0x5d666e);

  addBox(
    60,
    0.2,
    40,
    createMaterial({ map: tex.concrete('#6b7075', 0.15, 'tarmac'), bumpMap: bump, bumpScale: 0.015 }),
    0,
    -0.2,
    -30,
    false,
  );
  addBox(0.24, 0.015, 22, createMaterial({ color: 0xe6b835 }), 0, -0.09, -22, false);

  addBox(0.24, 1.12, 0.24, frameMat, 2.15, 0.56, -8.42, true);
  addBox(
    0.16,
    0.18,
    0.04,
    createMaterial({ color: 0x3ec47d, emissive: 0x1d7a47, emissiveIntensity: 0.9 }),
    2.15,
    1.05,
    -8.29,
    false,
  );

  const aircraft = new T.Group();
  aircraft.position.set(0, 0, -24.5);
  scene.add(aircraft);

  const bodyMat = createMaterial({ color: 0xf4f6f8, roughness: 0.26, metalness: 0.35 });
  const wingMat = createMaterial({ color: 0xd9dfe5, roughness: 0.24, metalness: 0.48 });
  const darkMetal = createMaterial({ color: 0x2b323a, metalness: 0.65, roughness: 0.32 });
  const liveryBlue = createMaterial({ color: 0x245682, roughness: 0.32 });
  const liveryRed = createMaterial({ color: 0xc24938, roughness: 0.36 });
  const cockpitGlassMat = createMaterial({
    color: 0x182b3b,
    transparent: true,
    opacity: 0.62,
    roughness: 0.1,
    metalness: 0.65,
  });

  function addLocal(mesh: InstanceType<typeof T.Mesh>, x: number, y: number, z: number, cast = true) {
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    aircraft.add(mesh);
    return mesh;
  }

  const cabin = new T.Mesh(new T.CylinderGeometry(1.9, 1.9, 14.5, 24), bodyMat);
  cabin.rotation.x = Math.PI / 2;
  addLocal(cabin, 0, 3.25, 0);

  const noseCone = new T.Mesh(new T.CylinderGeometry(1.02, 1.9, 2.75, 24), bodyMat);
  noseCone.rotation.x = Math.PI / 2;
  addLocal(noseCone, 0, 3.25, 8.625);

  const radome = new T.Mesh(new T.SphereGeometry(1.02, 22, 14), bodyMat);
  radome.scale.set(1, 0.96, 1.45);
  addLocal(radome, 0, 3.25, 10.0);

  const tailCone = new T.Mesh(new T.CylinderGeometry(1.9, 0.4, 4.9, 24), bodyMat);
  tailCone.rotation.x = Math.PI / 2 + 0.055;
  addLocal(tailCone, 0, 3.385, -9.68);
  const apuCap = new T.Mesh(new T.SphereGeometry(0.4, 16, 12), bodyMat);
  addLocal(apuCap, 0, 3.52, -12.1);
  const apuNozzle = new T.Mesh(new T.CylinderGeometry(0.18, 0.24, 0.35, 12), darkMetal);
  apuNozzle.rotation.x = Math.PI / 2;
  addLocal(apuNozzle, 0, 3.52, -12.42, false);

  addLocal(new T.Mesh(new T.BoxGeometry(1.24, 0.36, 0.78), createMaterial({ color: 0x262e36 })), 0, 4.32, 7.9, false);
  addLocal(
    new T.Mesh(
      new T.BoxGeometry(1.06, 0.08, 0.12),
      createMaterial({ color: 0x62d68d, emissive: 0x3da867, emissiveIntensity: 0.9 }),
    ),
    0,
    4.34,
    8.24,
    false,
  );
  addLocal(new T.Mesh(new T.BoxGeometry(0.24, 0.28, 0.12), darkMetal), -0.32, 4.46, 7.72, false);
  addLocal(new T.Mesh(new T.BoxGeometry(0.24, 0.28, 0.12), darkMetal), 0.32, 4.46, 7.72, false);

  for (const [wx, wy, wz, ry, rx, w] of [
    [-0.36, 4.46, 8.26, -0.22, -0.58, 0.62],
    [0.36, 4.46, 8.26, 0.22, -0.58, 0.62],
    [-0.86, 4.3, 7.88, -0.8, -0.36, 0.58],
    [0.86, 4.3, 7.88, 0.8, -0.36, 0.58],
  ] as [number, number, number, number, number, number][]) {
    const frame = new T.Mesh(new T.BoxGeometry(w + 0.06, 0.42, 0.08), bodyMat);
    frame.position.set(wx, wy, wz);
    frame.rotation.set(rx, ry, 0, 'YXZ');
    aircraft.add(frame);
    const pane = new T.Mesh(new T.BoxGeometry(w, 0.35, 0.1), cockpitGlassMat);
    pane.position.set(wx, wy, wz);
    pane.rotation.set(rx, ry, 0, 'YXZ');
    aircraft.add(pane);
  }
  const centerPost = new T.Mesh(new T.BoxGeometry(0.07, 0.44, 0.11), bodyMat);
  centerPost.position.set(0, 4.47, 8.3);
  centerPost.rotation.x = -0.58;
  aircraft.add(centerPost);

  addLocal(new T.Mesh(new T.BoxGeometry(0.14, 0.32, 13.8), liveryBlue), 1.88, 3.05, 0, false);
  addLocal(new T.Mesh(new T.BoxGeometry(0.14, 0.32, 13.8), liveryBlue), -1.88, 3.05, 0, false);
  addLocal(new T.Mesh(new T.BoxGeometry(0.14, 0.1, 13.8), liveryRed), 1.88, 2.82, 0, false);
  addLocal(new T.Mesh(new T.BoxGeometry(0.14, 0.1, 13.8), liveryRed), -1.88, 2.82, 0, false);
  for (let w = 0; w < 14; w++) {
    const wz = 6.0 - w * 0.9;
    addLocal(new T.Mesh(new T.BoxGeometry(0.06, 0.26, 0.32), darkMetal), 1.9, 3.45, wz, false);
    addLocal(new T.Mesh(new T.BoxGeometry(0.06, 0.26, 0.32), darkMetal), -1.9, 3.45, wz, false);
  }
  addLocal(new T.Mesh(new T.BoxGeometry(0.08, 1.5, 0.85), createMaterial({ color: 0xd4dade })), 1.9, 3.3, 7.1, false);
  addLocal(new T.Mesh(new T.BoxGeometry(0.08, 1.5, 0.85), createMaterial({ color: 0xd4dade })), -1.9, 3.3, 7.1, false);

  for (const side of [-1, 1] as const) {
    const wingGrp = new T.Group();
    wingGrp.position.set(side * 1.5, 2.58, 0.4);
    wingGrp.rotation.z = side * 0.065;

    const wingShape = new T.Shape();
    wingShape.moveTo(0, -1.65);
    wingShape.lineTo(0, 1.75);
    wingShape.lineTo(side * 11.4, 3.55);
    wingShape.lineTo(side * 11.4, 2.35);
    wingShape.closePath();

    const wingGeo = track(
      new T.ExtrudeGeometry(wingShape, {
        depth: 0.2,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.04,
        bevelSegments: 2,
      }),
    );
    const wingMesh = new T.Mesh(wingGeo, wingMat);
    wingMesh.rotation.x = -Math.PI / 2;
    wingMesh.position.y = -0.1;
    wingMesh.castShadow = true;
    wingMesh.receiveShadow = true;
    wingGrp.add(wingMesh);

    const wlShape = new T.Shape();
    wlShape.moveTo(0, 0);
    wlShape.lineTo(1.2, 0);
    wlShape.lineTo(1.85, 1.38);
    wlShape.lineTo(1.22, 1.38);
    wlShape.closePath();
    const wlGeo = track(
      new T.ExtrudeGeometry(wlShape, {
        depth: 0.09,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 1,
      }),
    );
    const wlPivot = new T.Group();
    wlPivot.position.set(side * 11.34, -0.02, -2.35);
    wlPivot.rotation.z = -side * 0.22;
    const wlMesh = new T.Mesh(wlGeo, liveryBlue);
    wlMesh.rotation.y = Math.PI / 2;
    wlMesh.position.set(-0.045, -0.06, 0);
    wlMesh.castShadow = true;
    const cuff = new T.Mesh(new T.BoxGeometry(0.24, 0.22, 1.24), wingMat);
    cuff.position.set(0, 0.02, -0.6);
    wlPivot.add(wlMesh, cuff);
    wingGrp.add(wlPivot);

    aircraft.add(wingGrp);
  }

  const finShape = new T.Shape();
  finShape.moveTo(0, 4.75);
  finShape.lineTo(1.5, 5.15);
  finShape.lineTo(4.35, 9.45);
  finShape.lineTo(5.7, 9.45);
  finShape.lineTo(4.85, 3.45);
  finShape.lineTo(1.1, 4.2);
  finShape.closePath();
  const finGeo = track(
    new T.ExtrudeGeometry(finShape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 2,
    }),
  );
  const vTail = new T.Mesh(finGeo, liveryBlue);
  vTail.rotation.y = Math.PI / 2;
  vTail.position.set(-0.11, 0, -6.1);
  vTail.castShadow = true;
  aircraft.add(vTail);

  const finStripe = new T.Shape();
  finStripe.moveTo(3.4, 8.0);
  finStripe.lineTo(4.15, 9.15);
  finStripe.lineTo(5.62, 9.15);
  finStripe.lineTo(5.4, 8.0);
  finStripe.closePath();
  const stripeGeo = track(new T.ExtrudeGeometry(finStripe, { depth: 0.25, bevelEnabled: false }));
  const stripeMesh = new T.Mesh(stripeGeo, liveryRed);
  stripeMesh.rotation.y = Math.PI / 2;
  stripeMesh.position.set(-0.125, 0, -6.1);
  aircraft.add(stripeMesh);

  for (const side of [-1, 1] as const) {
    const hShape = new T.Shape();
    hShape.moveTo(0, -0.85);
    hShape.lineTo(0, 1.05);
    hShape.lineTo(side * 4.35, 1.65);
    hShape.lineTo(side * 4.35, 0.9);
    hShape.closePath();
    const hGeo = track(
      new T.ExtrudeGeometry(hShape, {
        depth: 0.14,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.025,
        bevelSegments: 1,
      }),
    );
    const hMesh = new T.Mesh(hGeo, wingMat);
    hMesh.rotation.x = -Math.PI / 2;
    hMesh.rotation.z = side * 0.07;
    hMesh.position.set(side * 0.45, 3.55, -10.2);
    hMesh.castShadow = true;
    aircraft.add(hMesh);
  }

  const fanRotors: InstanceType<typeof T.Group>[] = [];
  for (const ex of [-5.1, 5.1]) {
    const engZ = 0.05;
    const cowl = new T.Mesh(new T.CylinderGeometry(0.82, 0.78, 2.7, 18), wingMat);
    cowl.rotation.x = Math.PI / 2;
    addLocal(cowl, ex, 1.72, engZ + 0.6);
    const intake = new T.Mesh(new T.CylinderGeometry(0.68, 0.68, 0.14, 16), darkMetal);
    intake.rotation.x = Math.PI / 2;
    addLocal(intake, ex, 1.72, engZ + 1.98, false);
    const rotor = new T.Group();
    rotor.position.set(ex, 1.72, engZ + 1.88);
    const spinner = new T.Mesh(new T.ConeGeometry(0.18, 0.36, 12), chromeMat);
    spinner.rotation.x = Math.PI / 2;
    rotor.add(spinner);
    for (let b = 0; b < 8; b++) {
      const bl = new T.Mesh(new T.BoxGeometry(0.1, 0.56, 0.02), darkMetal);
      const ang = (b * Math.PI * 2) / 8;
      bl.position.set(Math.cos(ang) * 0.32, Math.sin(ang) * 0.32, -0.05);
      bl.rotation.z = ang + 0.5;
      rotor.add(bl);
    }
    aircraft.add(rotor);
    fanRotors.push(rotor);

    const exhaust = new T.Mesh(new T.CylinderGeometry(0.68, 0.54, 0.65, 14), darkMetal);
    exhaust.rotation.x = Math.PI / 2;
    addLocal(exhaust, ex, 1.72, engZ - 0.9, false);
    addLocal(new T.Mesh(new T.BoxGeometry(0.22, 1.0, 1.7), wingMat), ex, 2.38, engZ + 0.1, false);
  }

  addLocal(new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 2.0, 8), darkMetal), 0, 1.0, 8.9);
  for (const wx of [-0.22, 0.22]) {
    const nw = new T.Mesh(new T.CylinderGeometry(0.32, 0.32, 0.18, 12), darkMetal);
    nw.rotation.z = Math.PI / 2;
    addLocal(nw, wx, 0.22, 8.9);
  }
  addLocal(new T.Mesh(new T.BoxGeometry(0.65, 0.18, 0.55), createMaterial({ color: 0xe3b12c })), 0, 0.0, 8.9, false);
  for (const gx of [-2.4, 2.4]) {
    addLocal(new T.Mesh(new T.CylinderGeometry(0.13, 0.13, 2.1, 8), darkMetal), gx, 1.0, 0);
    for (const off of [-0.24, 0.24]) {
      const mw = new T.Mesh(new T.CylinderGeometry(0.45, 0.45, 0.22, 12), darkMetal);
      mw.rotation.z = Math.PI / 2;
      addLocal(mw, gx + off, 0.35, 0);
    }
  }
  addBox(3.8, 3.4, 16, createMaterial({ visible: false }), 0, 1.7, -23.0, true, false, false);

  let gateOpen = false;
  updaters.push((dt) => {
    const off = gateOpen ? 2.3 : 0.95;
    gateL.position.x += (-off - gateL.position.x) * Math.min(1, dt * 5);
    gateR.position.x += (off - gateR.position.x) * Math.min(1, dt * 5);
    syncColX(gateL, 0.9);
    syncColX(gateR, 0.9);
    for (const r of fanRotors) {
      r.rotation.z += dt * 0.65;
    }
    const curMin = Math.floor(Date.now() / 60000);
    if (curMin !== lastBoardMin) {
      drawBoard(curMin);
    }
  });

  addInteract(
    'air_desk',
    V(0.8, 1.25, -8.3),
    '打开飞机前玻璃登机门',
    '滑开03号登机口玻璃门出去看看机头',
    () => {
      gateOpen = !gateOpen;
      sfx.play('chime');
      showWhisper(
        gateOpen
          ? '玻璃感应门向两侧滑开，可以走到机坪上看机头和驾驶舱了。'
          : '玻璃门闭合，高高的钢架吊顶下重归凉爽。',
      );
    },
    { radius: 3.4 },
  );
  addInteract('air_board', V(-4.2, 1.4, -5.2), '看一眼登机显示屏', '查看实时更新的登机时间', () => {
    sfx.play('chime');
    showWhisper('屏幕上那行登机时间还在往后跳，台面上散着两张盖过红章的登机牌存根。');
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

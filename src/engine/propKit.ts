import * as THREE from 'three/webgpu';
import type { SceneContext } from '../scenes/sceneContext';

export interface InstanceTransform {
  x: number;
  y: number;
  z: number;
  rx?: number;
  ry?: number;
  rz?: number;
  sx?: number;
  sy?: number;
  sz?: number;
  color?: number;
}

export function addInstancedMeshes(
  ctx: SceneContext,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  items: readonly InstanceTransform[],
  cast = true,
  recv = true,
): THREE.InstancedMesh | null {
  if (items.length === 0) {
    return null;
  }
  ctx.track(geo);
  ctx.track(mat);
  const inst = new THREE.InstancedMesh(geo, mat, items.length);
  inst.castShadow = cast;
  inst.receiveShadow = recv;
  const dummy = new THREE.Object3D();
  const c = new THREE.Color();
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    dummy.position.set(it.x, it.y, it.z);
    dummy.rotation.set(it.rx ?? 0, it.ry ?? 0, it.rz ?? 0);
    dummy.scale.set(it.sx ?? 1, it.sy ?? 1, it.sz ?? 1);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
    if (it.color !== undefined) {
      c.setHex(it.color);
      inst.setColorAt(i, c);
    }
  }
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) {
    inst.instanceColor.needsUpdate = true;
  }
  inst.computeBoundingSphere();
  ctx.scene.add(inst);
  return inst;
}

export function buildOfficeChair(
  ctx: SceneContext,
  x: number,
  y: number,
  z: number,
  ry = 0,
  fabricHex = 0x2f3740,
  solid = false,
): THREE.Group {
  const { T, scene, track, createMaterial, colliders } = ctx;
  const g = new T.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  const steelMat = createMaterial({ color: 0x262a30, metalness: 0.6, roughness: 0.35 });
  const fabMat = createMaterial({ color: fabricHex, roughness: 0.85 });

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, px: number, py: number, pz: number, rx = 0, rz = 0) => {
    const m = new T.Mesh(track(geo), mat);
    m.position.set(px, py, pz);
    m.rotation.set(rx, 0, rz);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };

  add(new T.CylinderGeometry(0.03, 0.035, 0.38, 8), steelMat, 0, 0.24, 0);
  for (let i = 0; i < 5; i++) {
    const ang = (i * Math.PI * 2) / 5;
    const arm = add(new T.BoxGeometry(0.038, 0.035, 0.28), steelMat, Math.sin(ang) * 0.14, 0.055, Math.cos(ang) * 0.14);
    arm.rotation.y = ang;
    add(new T.CylinderGeometry(0.025, 0.025, 0.025, 8), steelMat, Math.sin(ang) * 0.25, 0.025, Math.cos(ang) * 0.25, 0, Math.PI / 2);
  }
  add(new T.BoxGeometry(0.46, 0.075, 0.44), fabMat, 0, 0.46, 0);
  add(new T.BoxGeometry(0.44, 0.48, 0.06), fabMat, 0, 0.74, 0.2, -0.08);
  add(new T.BoxGeometry(0.06, 0.28, 0.04), steelMat, 0, 0.56, 0.22);
  for (const sx of [-0.24, 0.24]) {
    add(new T.BoxGeometry(0.04, 0.16, 0.04), steelMat, sx, 0.55, 0.02);
    add(new T.BoxGeometry(0.055, 0.035, 0.28), steelMat, sx, 0.63, 0.02);
  }
  scene.add(g);
  if (solid) {
    colliders.push({
      minX: x - 0.3,
      maxX: x + 0.3,
      minZ: z - 0.3,
      maxZ: z + 0.3,
      minY: y,
      maxY: y + 1.0,
      active: true,
    });
  }
  return g;
}

export function buildWoodChair(
  ctx: SceneContext,
  x: number,
  y: number,
  z: number,
  ry = 0,
  woodColor = '#8f653e',
  cushionHex?: number,
): THREE.Group {
  const { T, scene, tex, track, createMaterial } = ctx;
  const g = new T.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  const wMat = createMaterial({ map: tex.wood(woodColor, '#5e4024'), roughness: 0.75 });
  const cMat = cushionHex !== undefined ? createMaterial({ color: cushionHex, roughness: 0.88 }) : wMat;

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, px: number, py: number, pz: number) => {
    const m = new T.Mesh(track(geo), mat);
    m.position.set(px, py, pz);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };
  for (const [lx, lz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) {
    add(new T.CylinderGeometry(0.02, 0.016, 0.44, 6), wMat, lx, 0.22, lz);
  }
  add(new T.BoxGeometry(0.42, 0.04, 0.42), wMat, 0, 0.44, 0);
  if (cushionHex !== undefined) {
    add(new T.BoxGeometry(0.38, 0.04, 0.38), cMat, 0, 0.48, 0);
  }
  for (const lx of [-0.18, 0.18]) {
    add(new T.BoxGeometry(0.036, 0.48, 0.036), wMat, lx, 0.68, -0.19);
  }
  add(new T.BoxGeometry(0.4, 0.18, 0.03), cMat, 0, 0.82, -0.19);
  scene.add(g);
  return g;
}

export function buildParkBench(
  ctx: SceneContext,
  x: number,
  y: number,
  z: number,
  ry = 0,
  solid = true,
): THREE.Group {
  const { T, scene, tex, track, createMaterial, colliders } = ctx;
  const g = new T.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  const woodMat = createMaterial({ map: tex.wood('#9b6f44', '#6b4929'), roughness: 0.78 });
  const ironMat = createMaterial({ color: 0x262b30, metalness: 0.6, roughness: 0.45 });

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, px: number, py: number, pz: number, rx = 0) => {
    const m = new T.Mesh(track(geo), mat);
    m.position.set(px, py, pz);
    m.rotation.x = rx;
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  };

  for (const lx of [-0.68, 0.68]) {
    add(new T.BoxGeometry(0.07, 0.44, 0.46), ironMat, lx, 0.22, 0);
    add(new T.BoxGeometry(0.07, 0.46, 0.07), ironMat, lx, 0.64, -0.2, -0.18);
    add(new T.BoxGeometry(0.06, 0.04, 0.44), ironMat, lx, 0.56, 0.01);
  }
  for (const sz of [-0.14, 0, 0.14]) {
    add(new T.BoxGeometry(1.62, 0.04, 0.11), woodMat, 0, 0.44, sz);
  }
  for (const by of [0.62, 0.76]) {
    add(new T.BoxGeometry(1.62, 0.1, 0.04), woodMat, 0, by, -0.21, -0.18);
  }
  scene.add(g);
  if (solid) {
    const rot = Math.abs(Math.sin(ry)) > 0.7;
    const hw = rot ? 0.34 : 0.85;
    const hd = rot ? 0.85 : 0.34;
    colliders.push({
      minX: x - hw,
      maxX: x + hw,
      minZ: z - hd,
      maxZ: z + hd,
      minY: y,
      maxY: y + 0.9,
      active: true,
    });
  }
  return g;
}

export function buildPottedPlant(
  ctx: SceneContext,
  x: number,
  y: number,
  z: number,
  scale = 1,
  potHex = 0x9b5a3c,
): THREE.Group {
  const { T, scene, track, createMaterial } = ctx;
  const g = new T.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(scale);
  const potMat = createMaterial({ color: potHex, roughness: 0.75 });
  const soilMat = createMaterial({ color: 0x3b2c20, roughness: 1 });
  const leafMat1 = createMaterial({ color: 0x457840, roughness: 0.82 });
  const leafMat2 = createMaterial({ color: 0x598c4c, roughness: 0.8 });

  const pot = new T.Mesh(track(new T.CylinderGeometry(0.24, 0.18, 0.34, 12)), potMat);
  pot.position.y = 0.17;
  pot.castShadow = true;
  const rim = new T.Mesh(track(new T.TorusGeometry(0.24, 0.025, 6, 16)), potMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.34;
  const soil = new T.Mesh(track(new T.CylinderGeometry(0.22, 0.22, 0.03, 12)), soilMat);
  soil.position.y = 0.33;
  g.add(pot, rim, soil);

  const lGeo = track(new T.IcosahedronGeometry(0.18, 2));
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI * 2) / 6;
    const leaf = new T.Mesh(lGeo, i % 2 ? leafMat1 : leafMat2);
    leaf.position.set(Math.cos(a) * 0.14, 0.48 + (i % 2) * 0.1, Math.sin(a) * 0.14);
    leaf.scale.set(0.95, 1.3, 0.95);
    leaf.castShadow = true;
    g.add(leaf);
  }
  const topLeaf = new T.Mesh(lGeo, leafMat2);
  topLeaf.position.set(0, 0.65, 0);
  topLeaf.scale.set(1.1, 1.25, 1.1);
  g.add(topLeaf);
  scene.add(g);
  return g;
}

export function buildCamphorTree(
  ctx: SceneContext,
  x: number,
  y: number,
  z: number,
  scale = 1,
  solid = false,
): THREE.Group {
  const { T, scene, tex, track, createMaterial, colliders } = ctx;
  const g = new T.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(scale);

  const barkMat = createMaterial({ map: tex.wood('#5e4835', '#3d2e20', 'bark'), roughness: 0.92 });
  const leafMatA = createMaterial({ color: 0x45753d, roughness: 0.88 });
  const leafMatB = createMaterial({ color: 0x568846, roughness: 0.86 });

  const trunk = new T.Mesh(track(new T.CylinderGeometry(0.2, 0.34, 2.8, 10)), barkMat);
  trunk.position.y = 1.4;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  g.add(trunk);

  for (const [bx, by, bz, rx, rz] of [
    [-0.4, 2.9, 0.25, 0.4, 0.5],
    [0.45, 3.0, -0.2, -0.35, -0.5],
    [0.1, 3.1, 0.42, 0.5, -0.15],
  ]) {
    const bough = new T.Mesh(track(new T.CylinderGeometry(0.08, 0.15, 1.4, 8)), barkMat);
    bough.position.set(bx, by, bz);
    bough.rotation.set(rx, 0, rz);
    bough.castShadow = true;
    g.add(bough);
  }

  const foliageGeo = track(new T.SphereGeometry(1.42, 16, 12));
  for (const [fx, fy, fz, fs, m] of [
    [0, 4.35, 0, 1.15, leafMatA],
    [-1.05, 3.65, 0.55, 0.86, leafMatB],
    [1.08, 3.7, -0.45, 0.88, leafMatA],
    [0.2, 3.85, 1.0, 0.82, leafMatB],
    [-0.25, 3.75, -0.95, 0.8, leafMatA],
  ] as [number, number, number, number, THREE.MeshStandardMaterial][]) {
    const crown = new T.Mesh(foliageGeo, m);
    crown.position.set(fx, fy, fz);
    crown.scale.set(fs * 1.1, fs * 0.82, fs * 1.1);
    crown.castShadow = true;
    crown.receiveShadow = true;
    g.add(crown);
  }

  scene.add(g);
  if (solid) {
    colliders.push({
      minX: x - 0.36 * scale,
      maxX: x + 0.36 * scale,
      minZ: z - 0.36 * scale,
      maxZ: z + 0.36 * scale,
      minY: y,
      maxY: y + 3.0 * scale,
      active: true,
    });
  }
  return g;
}

export function buildAcCondenser(
  ctx: SceneContext,
  x: number,
  y: number,
  z: number,
  ry = 0,
): THREE.Group {
  const { T, scene, track, createMaterial } = ctx;
  const g = new T.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  const bodyMat = createMaterial({ color: 0xd6dad8, roughness: 0.55, metalness: 0.25 });
  const darkMat = createMaterial({ color: 0x262c32, roughness: 0.7 });
  const fanMat = createMaterial({ color: 0x5c6670, metalness: 0.5, roughness: 0.35 });

  const box = new T.Mesh(track(new T.BoxGeometry(0.92, 0.68, 0.34)), bodyMat);
  box.position.y = 0.36;
  box.castShadow = true;
  const topCap = new T.Mesh(track(new T.BoxGeometry(0.95, 0.04, 0.36)), bodyMat);
  topCap.position.y = 0.71;
  const grilleRing = new T.Mesh(track(new T.TorusGeometry(0.24, 0.025, 8, 20)), darkMat);
  grilleRing.position.set(-0.14, 0.37, 0.175);
  const recess = new T.Mesh(track(new T.CylinderGeometry(0.22, 0.22, 0.04, 16)), darkMat);
  recess.rotation.x = Math.PI / 2;
  recess.position.set(-0.14, 0.37, 0.155);
  const louver = new T.Mesh(track(new T.BoxGeometry(0.24, 0.44, 0.03)), darkMat);
  louver.position.set(0.28, 0.37, 0.16);
  g.add(box, topCap, grilleRing, recess, louver);

  const rotor = new T.Group();
  rotor.position.set(-0.14, 0.37, 0.17);
  for (let i = 0; i < 3; i++) {
    const bl = new T.Mesh(track(new T.BoxGeometry(0.08, 0.19, 0.012)), fanMat);
    const a = (i * Math.PI * 2) / 3;
    bl.position.set(Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0);
    bl.rotation.z = a + 1.2;
    rotor.add(bl);
  }
  g.add(rotor);
  for (const fx of [-0.36, 0.36]) {
    const foot = new T.Mesh(track(new T.BoxGeometry(0.08, 0.04, 0.38)), darkMat);
    foot.position.set(fx, 0.02, 0);
    g.add(foot);
  }
  scene.add(g);
  return g;
}

export function buildVendingMachine(
  ctx: SceneContext,
  x: number,
  y: number,
  z: number,
  ry = 0,
  accentHex = 0x2b6cb0,
  solid = true,
): THREE.Group {
  const { T, scene, track, createMaterial, colliders } = ctx;
  const g = new T.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  const bodyMat = createMaterial({ color: accentHex, roughness: 0.4, metalness: 0.25 });
  const trimMat = createMaterial({ color: 0x23282e, metalness: 0.5, roughness: 0.4 });
  const glowMat = createMaterial({
    color: 0xeaf6ff,
    emissive: 0xc2e6ff,
    emissiveIntensity: 0.72,
    roughness: 0.2,
  });

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, px: number, py: number, pz: number) => {
    const m = new T.Mesh(track(geo), mat);
    m.position.set(px, py, pz);
    m.castShadow = true;
    g.add(m);
    return m;
  };
  add(new T.BoxGeometry(1.04, 1.92, 0.78), bodyMat, 0, 0.96, 0);
  add(new T.BoxGeometry(0.68, 1.05, 0.04), glowMat, -0.1, 1.24, 0.38);
  const canCols = [0xd9483b, 0x3b8c5e, 0xe8b538, 0x3a72b8];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      const canMat = createMaterial({ color: canCols[(row + col) % 4], roughness: 0.3 });
      add(new T.CylinderGeometry(0.03, 0.03, 0.1, 8), canMat, -0.34 + col * 0.12, 0.85 + row * 0.24, 0.39);
    }
  }
  add(new T.BoxGeometry(0.18, 0.48, 0.05), trimMat, 0.35, 1.24, 0.38);
  add(new T.BoxGeometry(0.66, 0.24, 0.06), trimMat, -0.1, 0.36, 0.39);
  scene.add(g);
  if (solid) {
    colliders.push({
      minX: x - 0.56,
      maxX: x + 0.56,
      minZ: z - 0.44,
      maxZ: z + 0.44,
      minY: y,
      maxY: y + 1.95,
      active: true,
    });
  }
  return g;
}

export function buildSedanCar(
  ctx: SceneContext,
  x: number,
  y: number,
  z: number,
  ry = 0,
  colorHex = 0x3b4d5c,
  solid = true,
): { group: THREE.Group; headLightMat: THREE.MeshStandardMaterial } {
  const { T, scene, track, createMaterial, colliders } = ctx;
  const g = new T.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;

  const paintMat = track(
    new T.MeshPhysicalMaterial({
      color: colorHex,
      metalness: 0.48,
      roughness: 0.22,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
    }),
  );
  const darkMat = createMaterial({ color: 0x1a1d21, roughness: 0.85, metalness: 0.15 });
  const alloyMat = createMaterial({ color: 0xc2c9cf, metalness: 0.78, roughness: 0.24 });
  const glassMat = track(
    new T.MeshPhysicalMaterial({
      color: 0x1a2c38,
      transparent: true,
      opacity: 0.58,
      metalness: 0.15,
      roughness: 0.06,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      ior: 1.52,
    }),
  );
  const headLightMat = createMaterial({ color: 0xfff4d4, emissive: 0xffe4a0, emissiveIntensity: 0.05 });
  const tailMat = createMaterial({ color: 0xb8241e, emissive: 0x70100c, emissiveIntensity: 0.35 });

  const shape = new THREE.Shape();
  shape.moveTo(-2.15, 0.28);
  shape.lineTo(2.1, 0.28);
  shape.lineTo(2.14, 0.62);
  shape.lineTo(1.96, 0.84);
  shape.lineTo(1.08, 0.92);
  shape.lineTo(0.45, 1.38);
  shape.lineTo(-0.88, 1.38);
  shape.lineTo(-1.55, 0.92);
  shape.lineTo(-2.12, 0.82);
  shape.closePath();

  const bodyGeo = track(
    new THREE.ExtrudeGeometry(shape, {
      depth: 1.72,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.05,
      bevelSegments: 2,
    }),
  );
  const body = new THREE.Mesh(bodyGeo, paintMat);
  body.rotation.y = Math.PI / 2;
  body.position.set(-0.86, 0, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  const windFront = new THREE.Mesh(track(new THREE.BoxGeometry(1.48, 0.56, 0.04)), glassMat);
  windFront.position.set(0, 1.12, 0.74);
  windFront.rotation.x = 0.78;
  const windRear = new THREE.Mesh(track(new THREE.BoxGeometry(1.46, 0.54, 0.04)), glassMat);
  windRear.position.set(0, 1.13, -1.18);
  windRear.rotation.x = -0.82;
  const sideGlass = new THREE.Mesh(track(new THREE.BoxGeometry(1.66, 0.38, 1.35)), glassMat);
  sideGlass.position.set(0, 1.12, -0.22);
  const grille = new THREE.Mesh(track(new THREE.BoxGeometry(1.1, 0.22, 0.06)), darkMat);
  grille.position.set(0, 0.58, 2.16);
  const bumpF = new THREE.Mesh(track(new THREE.BoxGeometry(1.8, 0.16, 0.14)), darkMat);
  bumpF.position.set(0, 0.34, 2.14);
  const bumpR = new THREE.Mesh(track(new THREE.BoxGeometry(1.8, 0.16, 0.14)), darkMat);
  bumpR.position.set(0, 0.34, -2.14);
  g.add(windFront, windRear, sideGlass, grille, bumpF, bumpR);

  for (const sx of [-0.68, 0.68]) {
    const hl = new THREE.Mesh(track(new THREE.BoxGeometry(0.28, 0.12, 0.05)), headLightMat);
    hl.position.set(sx, 0.68, 2.15);
    const tl = new THREE.Mesh(track(new THREE.BoxGeometry(0.28, 0.11, 0.05)), tailMat);
    tl.position.set(sx, 0.72, -2.14);
    const mirror = new THREE.Mesh(track(new THREE.BoxGeometry(0.16, 0.09, 0.1)), paintMat);
    mirror.position.set(sx * 1.38, 0.96, 0.52);
    g.add(hl, tl, mirror);
  }

  const tGeo = track(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 24));
  tGeo.rotateZ(Math.PI / 2);
  const rGeo = track(new THREE.CylinderGeometry(0.2, 0.2, 0.235, 16));
  rGeo.rotateZ(Math.PI / 2);
  for (const [wx, wz] of [[-0.84, 1.34], [0.84, 1.34], [-0.84, -1.34], [0.84, -1.34]]) {
    const tire = new THREE.Mesh(tGeo, darkMat);
    tire.position.set(wx, 0.32, wz);
    tire.castShadow = true;
    const rim = new THREE.Mesh(rGeo, alloyMat);
    rim.position.set(wx, 0.32, wz);
    g.add(tire, rim);
  }

  scene.add(g);
  if (solid) {
    const swapped = Math.abs(Math.sin(ry)) > 0.7;
    const hw = swapped ? 2.15 : 0.95;
    const hd = swapped ? 0.95 : 2.15;
    colliders.push({
      minX: x - hw,
      maxX: x + hw,
      minZ: z - hd,
      maxZ: z + hd,
      minY: y,
      maxY: y + 1.45,
      active: true,
    });
  }
  return { group: g, headLightMat };
}

export function buildHospitalBed(
  ctx: SceneContext,
  x: number,
  y: number,
  z: number,
  ry = 0,
  solid = true,
): THREE.Group {
  const { T, scene, track, createMaterial, colliders } = ctx;
  const g = new T.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  const steelMat = createMaterial({ color: 0xc2cad0, metalness: 0.65, roughness: 0.3 });
  const sheetMat = createMaterial({ color: 0xf4f5f0, roughness: 0.85 });
  const blanketMat = createMaterial({ color: 0xa4c8ba, roughness: 0.9 });

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, px: number, py: number, pz: number) => {
    const m = new T.Mesh(track(geo), mat);
    m.position.set(px, py, pz);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  };
  for (const [lx, lz] of [[-0.92, -0.46], [0.92, -0.46], [-0.92, 0.46], [0.92, 0.46]]) {
    add(new T.CylinderGeometry(0.025, 0.025, 0.44, 8), steelMat, lx, 0.22, lz);
  }
  add(new T.BoxGeometry(1.94, 0.06, 0.98), steelMat, 0, 0.42, 0);
  add(new T.BoxGeometry(1.88, 0.16, 0.92), sheetMat, 0, 0.52, 0);
  add(new T.BoxGeometry(1.15, 0.175, 0.94), blanketMat, -0.34, 0.525, 0);
  add(new T.BoxGeometry(0.36, 0.11, 0.64), sheetMat, 0.72, 0.64, 0);
  add(new T.BoxGeometry(0.05, 0.58, 0.96), steelMat, 0.96, 0.68, 0);
  add(new T.BoxGeometry(0.05, 0.44, 0.96), steelMat, -0.96, 0.6, 0);
  scene.add(g);
  if (solid) {
    const swapped = Math.abs(Math.sin(ry)) > 0.7;
    const hw = swapped ? 0.52 : 1.0;
    const hd = swapped ? 1.0 : 0.52;
    colliders.push({
      minX: x - hw,
      maxX: x + hw,
      minZ: z - hd,
      maxZ: z + hd,
      minY: y,
      maxY: y + 0.9,
      active: true,
    });
  }
  return g;
}

export function buildStreetLamp(
  ctx: SceneContext,
  x: number,
  y: number,
  z: number,
  ry = 0,
  lit = true,
): THREE.Group {
  const { T, scene, track, createMaterial } = ctx;
  const g = new T.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  const poleMat = createMaterial({ color: 0x31373e, metalness: 0.65, roughness: 0.35 });
  const bulbMat = createMaterial({
    color: 0xfff5d6,
    emissive: 0xffc66e,
    emissiveIntensity: lit ? 1.4 : 0.1,
  });

  const base = new T.Mesh(track(new T.CylinderGeometry(0.12, 0.18, 0.45, 10)), poleMat);
  base.position.y = 0.225;
  const pole = new T.Mesh(track(new T.CylinderGeometry(0.055, 0.09, 4.3, 10)), poleMat);
  pole.position.y = 2.4;
  pole.castShadow = true;
  const arm = new T.Mesh(track(new T.BoxGeometry(1.05, 0.06, 0.06)), poleMat);
  arm.position.set(0.48, 4.48, 0);
  const head = new T.Mesh(track(new T.BoxGeometry(0.42, 0.08, 0.22)), poleMat);
  head.position.set(0.95, 4.45, 0);
  const lens = new T.Mesh(track(new T.BoxGeometry(0.34, 0.04, 0.16)), bulbMat);
  lens.position.set(0.95, 4.4, 0);
  g.add(base, pole, arm, head, lens);
  scene.add(g);
  return g;
}

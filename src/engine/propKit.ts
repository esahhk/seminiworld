import * as THREE from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
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

export interface GeoPartSpec {
  geo: THREE.BufferGeometry;
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  sx?: number;
  sy?: number;
  sz?: number;
}

const _mObj = new THREE.Object3D();

export function mergePartsToGeometry(parts: readonly GeoPartSpec[]): THREE.BufferGeometry {
  if (parts.length === 0) {
    return new THREE.BoxGeometry(0.01, 0.01, 0.01);
  }
  const normalized: THREE.BufferGeometry[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const cloned = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone();
    p.geo.dispose();
    if (!cloned.getAttribute('normal')) {
      cloned.computeVertexNormals();
    }
    if (!cloned.getAttribute('uv')) {
      const count = cloned.getAttribute('position').count;
      cloned.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    }
    for (const key of Object.keys(cloned.attributes)) {
      if (key !== 'position' && key !== 'normal' && key !== 'uv') {
        cloned.deleteAttribute(key);
      }
    }
    _mObj.position.set(p.x ?? 0, p.y ?? 0, p.z ?? 0);
    _mObj.rotation.set(p.rx ?? 0, p.ry ?? 0, p.rz ?? 0);
    _mObj.scale.set(p.sx ?? 1, p.sy ?? 1, p.sz ?? 1);
    _mObj.updateMatrix();
    cloned.applyMatrix4(_mObj.matrix);
    normalized.push(cloned);
  }
  const merged = mergeGeometries(normalized, false);
  for (let i = 0; i < normalized.length; i++) {
    normalized[i].dispose();
  }
  return merged ?? new THREE.BoxGeometry(0.01, 0.01, 0.01);
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
  const steelMat = createMaterial({ color: 0x262a30, metalness: 0.65, roughness: 0.32 });
  const fabMat = createMaterial({ color: fabricHex, roughness: 0.86 });

  const steelParts: GeoPartSpec[] = [
    { geo: new T.CylinderGeometry(0.03, 0.035, 0.38, 10), y: 0.24 },
    { geo: new T.BoxGeometry(0.06, 0.28, 0.04), y: 0.56, z: 0.22 },
  ];
  for (let i = 0; i < 5; i++) {
    const ang = (i * Math.PI * 2) / 5;
    steelParts.push({
      geo: new T.BoxGeometry(0.038, 0.035, 0.28),
      x: Math.sin(ang) * 0.14,
      y: 0.055,
      z: Math.cos(ang) * 0.14,
      ry: ang,
    });
    steelParts.push({
      geo: new T.CylinderGeometry(0.026, 0.026, 0.026, 10),
      x: Math.sin(ang) * 0.25,
      y: 0.026,
      z: Math.cos(ang) * 0.25,
      rz: Math.PI / 2,
    });
  }
  for (const sx of [-0.24, 0.24]) {
    steelParts.push({ geo: new T.BoxGeometry(0.04, 0.16, 0.04), x: sx, y: 0.55, z: 0.02 });
    steelParts.push({ geo: new T.BoxGeometry(0.055, 0.035, 0.28), x: sx, y: 0.63, z: 0.02 });
  }
  const fabParts: GeoPartSpec[] = [
    { geo: new T.BoxGeometry(0.46, 0.075, 0.44), y: 0.46 },
    { geo: new T.BoxGeometry(0.44, 0.48, 0.06), y: 0.74, z: 0.2, rx: -0.08 },
    { geo: new T.BoxGeometry(0.28, 0.13, 0.055), y: 1.04, z: 0.22 },
  ];

  const steelMesh = new T.Mesh(track(mergePartsToGeometry(steelParts)), steelMat);
  steelMesh.castShadow = true;
  steelMesh.receiveShadow = true;
  const fabMesh = new T.Mesh(track(mergePartsToGeometry(fabParts)), fabMat);
  fabMesh.castShadow = true;
  fabMesh.receiveShadow = true;
  g.add(steelMesh, fabMesh);
  scene.add(g);

  if (solid) {
    colliders.push({
      minX: x - 0.3,
      maxX: x + 0.3,
      minZ: z - 0.3,
      maxZ: z + 0.3,
      minY: y,
      maxY: y + 1.1,
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
  const wMat = createMaterial({ map: tex.wood(woodColor, '#5e4024'), roughness: 0.72 });
  const cMat = cushionHex !== undefined ? createMaterial({ color: cushionHex, roughness: 0.88 }) : wMat;

  const woodParts: GeoPartSpec[] = [
    { geo: new T.BoxGeometry(0.42, 0.04, 0.42), y: 0.44 },
    { geo: new T.BoxGeometry(0.036, 0.48, 0.036), x: -0.18, y: 0.68, z: -0.19 },
    { geo: new T.BoxGeometry(0.036, 0.48, 0.036), x: 0.18, y: 0.68, z: -0.19 },
  ];
  for (const [lx, lz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) {
    woodParts.push({ geo: new T.CylinderGeometry(0.02, 0.016, 0.44, 8), x: lx, y: 0.22, z: lz });
  }
  const wMesh = new T.Mesh(track(mergePartsToGeometry(woodParts)), wMat);
  wMesh.castShadow = true;
  wMesh.receiveShadow = true;
  g.add(wMesh);

  const cushParts: GeoPartSpec[] = [
    { geo: new T.BoxGeometry(0.4, 0.18, 0.03), y: 0.82, z: -0.19 },
  ];
  if (cushionHex !== undefined) {
    cushParts.push({ geo: new T.BoxGeometry(0.38, 0.045, 0.38), y: 0.48 });
  }
  const cMesh = new T.Mesh(track(mergePartsToGeometry(cushParts)), cMat);
  cMesh.castShadow = true;
  cMesh.receiveShadow = true;
  g.add(cMesh);

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
  const woodMat = createMaterial({ map: tex.wood('#9b6f44', '#6b4929'), roughness: 0.76 });
  const ironMat = createMaterial({ color: 0x262b30, metalness: 0.65, roughness: 0.4 });

  const ironParts: GeoPartSpec[] = [];
  for (const lx of [-0.68, 0.68]) {
    ironParts.push({ geo: new T.BoxGeometry(0.07, 0.44, 0.46), x: lx, y: 0.22 });
    ironParts.push({ geo: new T.BoxGeometry(0.07, 0.46, 0.07), x: lx, y: 0.64, z: -0.2, rx: -0.18 });
    ironParts.push({ geo: new T.BoxGeometry(0.06, 0.04, 0.44), x: lx, y: 0.56, z: 0.01 });
  }
  const woodParts: GeoPartSpec[] = [];
  for (const sz of [-0.14, 0, 0.14]) {
    woodParts.push({ geo: new T.BoxGeometry(1.64, 0.042, 0.11), y: 0.44, z: sz });
  }
  for (const by of [0.62, 0.76]) {
    woodParts.push({ geo: new T.BoxGeometry(1.64, 0.1, 0.042), y: by, z: -0.21, rx: -0.18 });
  }
  const iMesh = new T.Mesh(track(mergePartsToGeometry(ironParts)), ironMat);
  iMesh.castShadow = true;
  iMesh.receiveShadow = true;
  const wMesh = new T.Mesh(track(mergePartsToGeometry(woodParts)), woodMat);
  wMesh.castShadow = true;
  wMesh.receiveShadow = true;
  g.add(iMesh, wMesh);
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
  const potMat = createMaterial({ color: potHex, roughness: 0.74 });
  const soilMat = createMaterial({ color: 0x3b2c20, roughness: 1 });
  const leafMat = createMaterial({ color: 0x4b7e42, roughness: 0.8 });

  const potParts: GeoPartSpec[] = [
    { geo: new T.CylinderGeometry(0.24, 0.18, 0.34, 14), y: 0.17 },
    { geo: new T.TorusGeometry(0.24, 0.025, 8, 18), y: 0.34, rx: Math.PI / 2 },
  ];
  const potMesh = new T.Mesh(track(mergePartsToGeometry(potParts)), potMat);
  potMesh.castShadow = true;
  potMesh.receiveShadow = true;

  const soil = new T.Mesh(track(new T.CylinderGeometry(0.22, 0.22, 0.03, 12)), soilMat);
  soil.position.y = 0.33;

  const leafParts: GeoPartSpec[] = [
    { geo: new T.IcosahedronGeometry(0.19, 1), y: 0.65, sx: 1.15, sy: 1.3, sz: 1.15 },
  ];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI * 2) / 6;
    leafParts.push({
      geo: new T.IcosahedronGeometry(0.18, 1),
      x: Math.cos(a) * 0.14,
      y: 0.48 + (i % 2) * 0.1,
      z: Math.sin(a) * 0.14,
      sx: 0.95,
      sy: 1.3,
      sz: 0.95,
    });
  }
  const leafMesh = new T.Mesh(track(mergePartsToGeometry(leafParts)), leafMat);
  leafMesh.castShadow = true;

  g.add(potMesh, soil, leafMesh);
  scene.add(g);
  return g;
}

export interface CamphorGroveSpec {
  x: number;
  y: number;
  z: number;
  scale?: number;
  solid?: boolean;
  ry?: number;
}

export interface CamphorGroveResult {
  trunkInst: THREE.InstancedMesh | null;
  boughInst: THREE.InstancedMesh | null;
  crownInst: THREE.InstancedMesh | null;
  swayCrowns: (t: number, windBoost?: number) => void;
}

export function buildCamphorGrove(
  ctx: SceneContext,
  specs: readonly CamphorGroveSpec[],
  cast = true,
): CamphorGroveResult {
  if (specs.length === 0) {
    return {
      trunkInst: null,
      boughInst: null,
      crownInst: null,
      swayCrowns: () => {},
    };
  }
  const { T, scene, tex, track, createMaterial, colliders } = ctx;
  const barkMat = createMaterial({
    map: tex.wood('#5e4835', '#3d2e20', 'bark'),
    normalMap: tex.concreteNormal('bark_n', 2.4),
    roughness: 0.92,
  });
  const leafMat = createMaterial({ color: 0xffffff, roughness: 0.84 });

  const treeTrunkParts: GeoPartSpec[] = [
    { geo: new T.CylinderGeometry(0.19, 0.36, 2.8, 10), y: 1.4 },
    { geo: new T.CylinderGeometry(0.08, 0.15, 1.4, 8), x: -0.4, y: 2.9, z: 0.25, rx: 0.4, rz: 0.5 },
    { geo: new T.CylinderGeometry(0.08, 0.15, 1.4, 8), x: 0.45, y: 3.0, z: -0.2, rx: -0.35, rz: -0.5 },
    { geo: new T.CylinderGeometry(0.08, 0.15, 1.4, 8), x: 0.1, y: 3.1, z: 0.42, rx: 0.5, rz: -0.15 },
  ];
  const trunkGeo = track(mergePartsToGeometry(treeTrunkParts));
  const crownGeo = track(new T.IcosahedronGeometry(1.42, 2));

  const trunkInst = new T.InstancedMesh(trunkGeo, barkMat, specs.length);
  const crownInst = new T.InstancedMesh(crownGeo, leafMat, specs.length * 5);
  trunkInst.castShadow = cast;
  trunkInst.receiveShadow = true;
  crownInst.castShadow = cast;
  crownInst.receiveShadow = true;

  const crownDefs: [number, number, number, number, number][] = [
    [0, 4.35, 0, 1.15, 0x45753d],
    [-1.05, 3.65, 0.55, 0.86, 0x568846],
    [1.08, 3.7, -0.45, 0.88, 0x487a3f],
    [0.2, 3.85, 1.0, 0.82, 0x5c8f4b],
    [-0.25, 3.75, -0.95, 0.8, 0x3f6d38],
  ];

  const rootObj = new T.Object3D();
  const partObj = new T.Object3D();
  const matWorld = new T.Matrix4();
  const tintColor = new T.Color();
  const crownMeta: {
    baseX: number;
    baseY: number;
    baseZ: number;
    sc: number;
    treeRy: number;
    lx: number;
    ly: number;
    lz: number;
    fs: number;
    phase: number;
  }[] = [];

  let cIdx = 0;

  for (let i = 0; i < specs.length; i++) {
    const sp = specs[i];
    const sc = sp.scale ?? 1;
    const ry = sp.ry ?? ((i * 2.17) % (Math.PI * 2));
    rootObj.position.set(sp.x, sp.y, sp.z);
    rootObj.rotation.set(0, ry, 0);
    rootObj.scale.setScalar(sc);
    rootObj.updateMatrix();
    trunkInst.setMatrixAt(i, rootObj.matrix);

    for (let l = 0; l < crownDefs.length; l++) {
      const [fx, fy, fz, fs, hex] = crownDefs[l];
      partObj.position.set(fx, fy, fz);
      partObj.rotation.set(0, l * 0.7, 0);
      partObj.scale.set(fs * 1.12, fs * 0.82, fs * 1.12);
      partObj.updateMatrix();
      matWorld.multiplyMatrices(rootObj.matrix, partObj.matrix);
      crownInst.setMatrixAt(cIdx, matWorld);
      tintColor.setHex(hex);
      crownInst.setColorAt(cIdx, tintColor);
      crownMeta.push({
        baseX: sp.x,
        baseY: sp.y,
        baseZ: sp.z,
        sc,
        treeRy: ry,
        lx: fx,
        ly: fy,
        lz: fz,
        fs,
        phase: i * 1.1 + l * 0.25,
      });
      cIdx++;
    }

    if (sp.solid) {
      colliders.push({
        minX: sp.x - 0.36 * sc,
        maxX: sp.x + 0.36 * sc,
        minZ: sp.z - 0.36 * sc,
        maxZ: sp.z + 0.36 * sc,
        minY: sp.y,
        maxY: sp.y + 3.0 * sc,
        active: true,
      });
    }
  }

  trunkInst.instanceMatrix.needsUpdate = true;
  crownInst.instanceMatrix.needsUpdate = true;
  if (crownInst.instanceColor) {
    crownInst.instanceColor.needsUpdate = true;
  }
  trunkInst.computeBoundingSphere();
  crownInst.computeBoundingSphere();
  scene.add(trunkInst, crownInst);

  const swayCrowns = (t: number, windBoost = 0) => {
    const amp = 0.018 + windBoost * 0.045;
    for (let k = 0; k < crownMeta.length; k++) {
      const m = crownMeta[k];
      rootObj.position.set(m.baseX, m.baseY, m.baseZ);
      rootObj.rotation.set(0, m.treeRy, Math.sin(t * 1.2 + m.phase) * amp);
      rootObj.scale.setScalar(m.sc);
      rootObj.updateMatrix();
      partObj.position.set(m.lx, m.ly, m.lz);
      partObj.rotation.set(0, 0, 0);
      partObj.scale.set(m.fs * 1.12, m.fs * 0.82, m.fs * 1.12);
      partObj.updateMatrix();
      matWorld.multiplyMatrices(rootObj.matrix, partObj.matrix);
      crownInst.setMatrixAt(k, matWorld);
    }
    crownInst.instanceMatrix.needsUpdate = true;
  };

  return { trunkInst, boughInst: null, crownInst, swayCrowns };
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

  const barkMat = createMaterial({
    map: tex.wood('#5e4835', '#3d2e20', 'bark'),
    normalMap: tex.concreteNormal('bark_n', 2.4),
    roughness: 0.92,
  });
  const leafMatA = createMaterial({ color: 0x45753d, roughness: 0.85 });
  const leafMatB = createMaterial({ color: 0x568846, roughness: 0.83 });

  const trunkMesh = new T.Mesh(
    track(
      mergePartsToGeometry([
        { geo: new T.CylinderGeometry(0.19, 0.36, 2.8, 10), y: 1.4 },
        { geo: new T.CylinderGeometry(0.08, 0.15, 1.4, 8), x: -0.4, y: 2.9, z: 0.25, rx: 0.4, rz: 0.5 },
        { geo: new T.CylinderGeometry(0.08, 0.15, 1.4, 8), x: 0.45, y: 3.0, z: -0.2, rx: -0.35, rz: -0.5 },
        { geo: new T.CylinderGeometry(0.08, 0.15, 1.4, 8), x: 0.1, y: 3.1, z: 0.42, rx: 0.5, rz: -0.15 },
      ]),
    ),
    barkMat,
  );
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;
  g.add(trunkMesh);

  const foliageGeo = track(new T.IcosahedronGeometry(1.42, 2));
  for (const [fx, fy, fz, fs, m] of [
    [0, 4.35, 0, 1.15, leafMatA],
    [-1.05, 3.65, 0.55, 0.86, leafMatB],
    [1.08, 3.7, -0.45, 0.88, leafMatA],
    [0.2, 3.85, 1.0, 0.82, leafMatB],
    [-0.25, 3.75, -0.95, 0.8, leafMatA],
  ] as [number, number, number, number, THREE.MeshStandardMaterial][]) {
    const crown = new T.Mesh(foliageGeo, m);
    crown.position.set(fx, fy, fz);
    crown.scale.set(fs * 1.12, fs * 0.82, fs * 1.12);
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
  const bodyMat = createMaterial({ color: 0xd6dad8, roughness: 0.52, metalness: 0.28 });
  const darkMat = createMaterial({ color: 0x262c32, roughness: 0.68 });
  const fanMat = createMaterial({ color: 0x5c6670, metalness: 0.55, roughness: 0.32 });

  const bodyMesh = new T.Mesh(
    track(
      mergePartsToGeometry([
        { geo: new T.BoxGeometry(0.92, 0.68, 0.34), y: 0.36 },
        { geo: new T.BoxGeometry(0.95, 0.04, 0.36), y: 0.71 },
      ]),
    ),
    bodyMat,
  );
  bodyMesh.castShadow = true;

  const darkMesh = new T.Mesh(
    track(
      mergePartsToGeometry([
        { geo: new T.TorusGeometry(0.24, 0.025, 8, 20), x: -0.14, y: 0.37, z: 0.175 },
        { geo: new T.CylinderGeometry(0.22, 0.22, 0.04, 16), x: -0.14, y: 0.37, z: 0.155, rx: Math.PI / 2 },
        { geo: new T.BoxGeometry(0.24, 0.44, 0.03), x: 0.28, y: 0.37, z: 0.16 },
        { geo: new T.BoxGeometry(0.08, 0.04, 0.38), x: -0.36, y: 0.02 },
        { geo: new T.BoxGeometry(0.08, 0.04, 0.38), x: 0.36, y: 0.02 },
      ]),
    ),
    darkMat,
  );

  const rotorParts: GeoPartSpec[] = [];
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    rotorParts.push({
      geo: new T.BoxGeometry(0.08, 0.19, 0.012),
      x: -0.14 + Math.cos(a) * 0.1,
      y: 0.37 + Math.sin(a) * 0.1,
      z: 0.17,
      rz: a + 1.2,
    });
  }
  const rotorMesh = new T.Mesh(track(mergePartsToGeometry(rotorParts)), fanMat);
  g.add(bodyMesh, darkMesh, rotorMesh);
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
  const bodyMat = createMaterial({ color: accentHex, roughness: 0.36, metalness: 0.3 });
  const trimMat = createMaterial({ color: 0x23282e, metalness: 0.55, roughness: 0.38 });
  const glowMat = createMaterial({
    color: 0xeaf6ff,
    emissive: 0xc2e6ff,
    emissiveIntensity: 0.72,
    roughness: 0.2,
  });

  const bodyMesh = new T.Mesh(track(new T.BoxGeometry(1.04, 1.92, 0.78)), bodyMat);
  bodyMesh.position.set(0, 0.96, 0);
  bodyMesh.castShadow = true;
  const trimMesh = new T.Mesh(
    track(
      mergePartsToGeometry([
        { geo: new T.BoxGeometry(0.18, 0.48, 0.05), x: 0.35, y: 1.24, z: 0.38 },
        { geo: new T.BoxGeometry(0.66, 0.24, 0.06), x: -0.1, y: 0.36, z: 0.39 },
      ]),
    ),
    trimMat,
  );
  const glowMesh = new T.Mesh(track(new T.BoxGeometry(0.68, 1.05, 0.04)), glowMat);
  glowMesh.position.set(-0.1, 1.24, 0.38);
  g.add(bodyMesh, trimMesh, glowMesh);

  const canMats = [0xd9483b, 0x3b8c5e, 0xe8b538, 0x3a72b8].map((col) =>
    createMaterial({ color: col, roughness: 0.28, metalness: 0.25 }),
  );
  for (let colorIdx = 0; colorIdx < 4; colorIdx++) {
    const canParts: GeoPartSpec[] = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        if ((row + col) % 4 === colorIdx) {
          canParts.push({
            geo: new T.CylinderGeometry(0.03, 0.03, 0.1, 8),
            x: -0.34 + col * 0.12,
            y: 0.85 + row * 0.24,
            z: 0.39,
          });
        }
      }
    }
    if (canParts.length > 0) {
      g.add(new T.Mesh(track(mergePartsToGeometry(canParts)), canMats[colorIdx]));
    }
  }

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
      metalness: 0.5,
      roughness: 0.2,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
    }),
  );
  const darkMat = createMaterial({ color: 0x181b1f, roughness: 0.82, metalness: 0.18 });
  const alloyMat = createMaterial({ color: 0xc5ccd4, metalness: 0.82, roughness: 0.22 });
  const glassMat = track(
    new T.MeshPhysicalMaterial({
      color: 0x162632,
      transparent: true,
      opacity: 0.58,
      metalness: 0.18,
      roughness: 0.06,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      ior: 1.52,
    }),
  );
  const headLightMat = createMaterial({ color: 0xfff4d4, emissive: 0xffe4a0, emissiveIntensity: 0.08 });
  const tailMat = createMaterial({ color: 0xb8241e, emissive: 0x7a120d, emissiveIntensity: 0.42 });

  const shape = new THREE.Shape();
  shape.moveTo(-2.18, 0.26);
  shape.lineTo(2.12, 0.26);
  shape.lineTo(2.16, 0.62);
  shape.lineTo(1.98, 0.85);
  shape.lineTo(1.06, 0.93);
  shape.lineTo(0.46, 1.4);
  shape.lineTo(-0.88, 1.4);
  shape.lineTo(-1.58, 0.93);
  shape.lineTo(-2.14, 0.83);
  shape.closePath();

  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 1.72,
    bevelEnabled: true,
    bevelThickness: 0.065,
    bevelSize: 0.05,
    bevelSegments: 2,
  });
  const paintParts: GeoPartSpec[] = [
    { geo: bodyGeo, x: -0.86, ry: Math.PI / 2 },
    { geo: new T.BoxGeometry(0.16, 0.09, 0.1), x: -0.94, y: 0.96, z: 0.52 },
    { geo: new T.BoxGeometry(0.16, 0.09, 0.1), x: 0.94, y: 0.96, z: 0.52 },
    { geo: new T.BoxGeometry(1.52, 0.05, 0.22), x: 0, y: 0.95, z: -1.96 },
  ];
  const body = new T.Mesh(track(mergePartsToGeometry(paintParts)), paintMat);
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  const glassMesh = new T.Mesh(
    track(
      mergePartsToGeometry([
        { geo: new T.BoxGeometry(1.48, 0.56, 0.04), y: 1.12, z: 0.74, rx: 0.78 },
        { geo: new T.BoxGeometry(1.46, 0.54, 0.04), y: 1.13, z: -1.18, rx: -0.82 },
        { geo: new T.BoxGeometry(1.66, 0.38, 1.35), y: 1.12, z: -0.22 },
      ]),
    ),
    glassMat,
  );

  const trimParts: GeoPartSpec[] = [
    { geo: new T.BoxGeometry(1.16, 0.24, 0.06), y: 0.58, z: 2.17 },
    { geo: new T.BoxGeometry(1.82, 0.16, 0.15), y: 0.33, z: 2.14 },
    { geo: new T.BoxGeometry(1.82, 0.16, 0.15), y: 0.33, z: -2.14 },
    { geo: new T.BoxGeometry(1.66, 0.08, 4.02), y: 0.24, z: 0 },
  ];
  for (const [wx, wz] of [[-0.84, 1.34], [0.84, 1.34], [-0.84, -1.34], [0.84, -1.34]]) {
    trimParts.push({ geo: new T.CylinderGeometry(0.32, 0.32, 0.22, 22), x: wx, y: 0.32, z: wz, rz: Math.PI / 2 });
  }
  const trimMesh = new T.Mesh(track(mergePartsToGeometry(trimParts)), darkMat);
  trimMesh.castShadow = true;

  const rimParts: GeoPartSpec[] = [
    { geo: new T.BoxGeometry(1.12, 0.03, 0.07), y: 0.58, z: 2.18 },
  ];
  for (const [wx, wz] of [[-0.84, 1.34], [0.84, 1.34], [-0.84, -1.34], [0.84, -1.34]]) {
    rimParts.push({ geo: new T.CylinderGeometry(0.2, 0.2, 0.235, 16), x: wx, y: 0.32, z: wz, rz: Math.PI / 2 });
  }
  const rimMesh = new T.Mesh(track(mergePartsToGeometry(rimParts)), alloyMat);

  const hlMesh = new T.Mesh(
    track(
      mergePartsToGeometry([
        { geo: new T.BoxGeometry(0.3, 0.12, 0.05), x: -0.68, y: 0.68, z: 2.16 },
        { geo: new T.BoxGeometry(0.3, 0.12, 0.05), x: 0.68, y: 0.68, z: 2.16 },
      ]),
    ),
    headLightMat,
  );
  const tlMesh = new T.Mesh(
    track(
      mergePartsToGeometry([
        { geo: new T.BoxGeometry(0.32, 0.11, 0.05), x: -0.68, y: 0.72, z: -2.15 },
        { geo: new T.BoxGeometry(0.32, 0.11, 0.05), x: 0.68, y: 0.72, z: -2.15 },
      ]),
    ),
    tailMat,
  );

  g.add(glassMesh, trimMesh, rimMesh, hlMesh, tlMesh);
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
  const steelMat = createMaterial({ color: 0xc2cad0, metalness: 0.68, roughness: 0.28 });
  const sheetMat = createMaterial({ color: 0xf4f5f0, roughness: 0.85 });
  const blanketMat = createMaterial({ color: 0xa4c8ba, roughness: 0.9 });

  const steelParts: GeoPartSpec[] = [
    { geo: new T.BoxGeometry(1.94, 0.06, 0.98), y: 0.42 },
    { geo: new T.BoxGeometry(0.05, 0.58, 0.96), x: 0.96, y: 0.68 },
    { geo: new T.BoxGeometry(0.05, 0.44, 0.96), x: -0.96, y: 0.6 },
  ];
  for (const [lx, lz] of [[-0.92, -0.46], [0.92, -0.46], [-0.92, 0.46], [0.92, 0.46]]) {
    steelParts.push({ geo: new T.CylinderGeometry(0.025, 0.025, 0.44, 8), x: lx, y: 0.22, z: lz });
  }
  const sheetParts: GeoPartSpec[] = [
    { geo: new T.BoxGeometry(1.88, 0.16, 0.92), y: 0.52 },
    { geo: new T.BoxGeometry(0.36, 0.11, 0.64), x: 0.72, y: 0.64 },
  ];
  const steelMesh = new T.Mesh(track(mergePartsToGeometry(steelParts)), steelMat);
  steelMesh.castShadow = true;
  const sheetMesh = new T.Mesh(track(mergePartsToGeometry(sheetParts)), sheetMat);
  sheetMesh.castShadow = true;
  const blanketMesh = new T.Mesh(track(new T.BoxGeometry(1.15, 0.175, 0.94)), blanketMat);
  blanketMesh.position.set(-0.34, 0.525, 0);
  g.add(steelMesh, sheetMesh, blanketMesh);
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
  const poleMat = createMaterial({ color: 0x31373e, metalness: 0.68, roughness: 0.34 });
  const bulbMat = createMaterial({
    color: 0xfff5d6,
    emissive: 0xffc66e,
    emissiveIntensity: lit ? 1.4 : 0.1,
  });

  const poleMesh = new T.Mesh(
    track(
      mergePartsToGeometry([
        { geo: new T.CylinderGeometry(0.12, 0.18, 0.45, 10), y: 0.225 },
        { geo: new T.CylinderGeometry(0.055, 0.09, 4.3, 10), y: 2.4 },
        { geo: new T.BoxGeometry(1.05, 0.06, 0.06), x: 0.48, y: 4.48 },
        { geo: new T.BoxGeometry(0.42, 0.08, 0.22), x: 0.95, y: 4.45 },
      ]),
    ),
    poleMat,
  );
  poleMesh.castShadow = true;

  const lens = new T.Mesh(track(new T.BoxGeometry(0.34, 0.04, 0.16)), bulbMat);
  lens.position.set(0.95, 4.4, 0);
  g.add(poleMesh, lens);
  scene.add(g);
  return g;
}

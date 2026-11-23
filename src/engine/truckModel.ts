import * as THREE from 'three/webgpu';
import { mergePartsToGeometry, type GeoPartSpec } from './propKit';
import type { TexCache } from './texCache';

export interface BoxTruckRig {
  group: THREE.Group;
  cabPivot: THREE.Group;
  frontSteerL: THREE.Group;
  frontSteerR: THREE.Group;
  wheelSpins: THREE.Group[];
  brakeMats: THREE.MeshStandardMaterial[];
  reverseMats: THREE.MeshStandardMaterial[];
  headLampMat: THREE.MeshStandardMaterial;
  turboGlowMat: THREE.MeshStandardMaterial;
  headSpot: THREE.SpotLight;
  headTarget: THREE.Object3D;
}

function buildDeepRimGeo(): THREE.BufferGeometry {
  const pts = [
    new THREE.Vector2(0.0, -0.155),
    new THREE.Vector2(0.11, -0.155),
    new THREE.Vector2(0.13, -0.06),
    new THREE.Vector2(0.24, -0.06),
    new THREE.Vector2(0.275, -0.15),
    new THREE.Vector2(0.295, -0.15),
    new THREE.Vector2(0.295, 0.15),
    new THREE.Vector2(0.26, 0.15),
    new THREE.Vector2(0.23, 0.05),
    new THREE.Vector2(0.12, 0.05),
    new THREE.Vector2(0.1, 0.155),
    new THREE.Vector2(0.0, 0.155),
  ];
  const g = new THREE.LatheGeometry(pts, 22);
  g.rotateZ(Math.PI / 2);
  return g;
}

function buildSteppedTankGeo(): THREE.BufferGeometry {
  const pts = [
    new THREE.Vector2(0.0, -0.52),
    new THREE.Vector2(0.19, -0.52),
    new THREE.Vector2(0.225, -0.46),
    new THREE.Vector2(0.225, 0.46),
    new THREE.Vector2(0.19, 0.52),
    new THREE.Vector2(0.0, 0.52),
  ];
  const g = new THREE.LatheGeometry(pts, 18);
  g.rotateX(Math.PI / 2);
  return g;
}

function buildExhaustStackGeo(): THREE.BufferGeometry {
  const pts = [
    new THREE.Vector2(0.04, 0.0),
    new THREE.Vector2(0.048, 0.08),
    new THREE.Vector2(0.088, 0.14),
    new THREE.Vector2(0.088, 0.72),
    new THREE.Vector2(0.052, 0.78),
    new THREE.Vector2(0.052, 1.72),
    new THREE.Vector2(0.072, 1.88),
    new THREE.Vector2(0.062, 1.9),
  ];
  return new THREE.LatheGeometry(pts, 14);
}

export function buildBoxTruckModel(
  track: <G extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(obj: G) => G,
  tex: TexCache,
): BoxTruckRig {
  const group = new THREE.Group();
  const cabPivot = new THREE.Group();
  group.add(cabPivot);

  const frameMat = track(
    new THREE.MeshStandardMaterial({ color: 0x1d2126, metalness: 0.68, roughness: 0.42 }),
  );
  const darkSteelMat = track(
    new THREE.MeshStandardMaterial({ color: 0x14171b, metalness: 0.45, roughness: 0.58 }),
  );
  const chromeMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xdce2e8,
      metalness: 0.92,
      roughness: 0.14,
      clearcoat: 0.7,
    }),
  );
  const alloyMat = track(
    new THREE.MeshStandardMaterial({ color: 0xbac2c9, metalness: 0.78, roughness: 0.24 }),
  );
  const cabPaintMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x1e4a78,
      metalness: 0.46,
      roughness: 0.2,
      clearcoat: 0.92,
      clearcoatRoughness: 0.09,
    }),
  );
  const cabTrimMat = track(
    new THREE.MeshStandardMaterial({ color: 0x1b1f25, metalness: 0.28, roughness: 0.6 }),
  );
  const cargoWallMat = track(
    new THREE.MeshPhysicalMaterial({
      map: tex.truckLivery(),
      normalMap: tex.corrugatedNormal('trk_n', 1.5),
      metalness: 0.22,
      roughness: 0.34,
      clearcoat: 0.45,
      clearcoatRoughness: 0.22,
    }),
  );
  const cargoRoofMat = track(
    new THREE.MeshStandardMaterial({
      map: tex.corrugated('#eef2f5', 'trk_roof'),
      normalMap: tex.corrugatedNormal('trk_rn', 1.8),
      metalness: 0.3,
      roughness: 0.44,
    }),
  );
  const glassMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x182b3a,
      transparent: true,
      opacity: 0.52,
      metalness: 0.18,
      roughness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      ior: 1.52,
    }),
  );
  const tireMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x191b1e,
      roughness: 0.88,
      metalness: 0.08,
      bumpMap: tex.bumpNoise('tire_b', 28),
      bumpScale: 0.008,
    }),
  );
  const headLampMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xfff8e6,
      emissive: 0xffe6a8,
      emissiveIntensity: 1.2,
      roughness: 0.18,
    }),
  );
  const amberMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xf09224,
      emissive: 0xe67212,
      emissiveIntensity: 0.85,
      roughness: 0.24,
    }),
  );
  const tailBrakeMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xc9261e,
      emissive: 0x99120c,
      emissiveIntensity: 0.38,
      roughness: 0.24,
    }),
  );
  const reverseMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xd8dfe3,
      emissive: 0xffffff,
      emissiveIntensity: 0.08,
      roughness: 0.24,
    }),
  );
  const turboGlowMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x5cc8ff,
      emissive: 0x38a6ff,
      emissiveIntensity: 0.0,
      roughness: 0.2,
    }),
  );
  const interiorMat = track(
    new THREE.MeshStandardMaterial({ color: 0x2a2e34, roughness: 0.84 }),
  );

  const frameParts: GeoPartSpec[] = [
    { geo: new THREE.BoxGeometry(0.11, 0.18, 5.95), x: -0.42, y: 0.56, z: 0.08 },
    { geo: new THREE.BoxGeometry(0.11, 0.18, 5.95), x: 0.42, y: 0.56, z: 0.08 },
    { geo: new THREE.BoxGeometry(1.78, 0.11, 0.12), y: 0.44, z: -1.75 },
    { geo: new THREE.BoxGeometry(1.78, 0.14, 0.14), y: 0.44, z: 1.8 },
    { geo: new THREE.CylinderGeometry(0.15, 0.15, 0.34, 14), y: 0.44, z: 1.8, rz: Math.PI / 2 },
    { geo: new THREE.BoxGeometry(0.38, 0.28, 0.56), x: 0.76, y: 0.52, z: -0.18 },
    { geo: new THREE.BoxGeometry(2.2, 0.18, 0.14), y: 0.46, z: 3.04 },
    { geo: new THREE.TorusGeometry(0.23, 0.015, 6, 18), x: -0.78, y: 0.5, z: -0.38 },
    { geo: new THREE.TorusGeometry(0.23, 0.015, 6, 18), x: -0.78, y: 0.5, z: 0.2 },
    { geo: new THREE.BoxGeometry(2.26, 0.14, 4.06), y: 0.72, z: 0.96 },
  ];
  for (const cz of [-2.4, -1.1, 0.3, 1.7, 2.75]) {
    frameParts.push({ geo: new THREE.BoxGeometry(0.92, 0.12, 0.12), y: 0.56, z: cz });
  }
  const frameMesh = new THREE.Mesh(track(mergePartsToGeometry(frameParts)), frameMat);
  frameMesh.castShadow = true;
  frameMesh.receiveShadow = true;
  group.add(frameMesh);

  const alloyStaticParts: GeoPartSpec[] = [
    { geo: buildSteppedTankGeo(), x: -0.78, y: 0.5, z: -0.09 },
    { geo: buildSteppedTankGeo(), x: 0.78, y: 0.5, z: 0.52, sz: 0.75 },
  ];
  const alloyStaticMesh = new THREE.Mesh(track(mergePartsToGeometry(alloyStaticParts)), alloyMat);
  alloyStaticMesh.castShadow = true;
  group.add(alloyStaticMesh);

  const exhaustParts: GeoPartSpec[] = [
    { geo: buildExhaustStackGeo(), x: 1.0, y: 0.58, z: -0.96 },
    { geo: buildExhaustStackGeo(), x: -1.0, y: 0.58, z: -0.96 },
  ];
  const exhaustMesh = new THREE.Mesh(track(mergePartsToGeometry(exhaustParts)), chromeMat);
  exhaustMesh.castShadow = true;
  group.add(exhaustMesh);

  const exhaustTipGlow = new THREE.Mesh(
    track(
      mergePartsToGeometry([
        { geo: new THREE.CylinderGeometry(0.045, 0.055, 0.14, 12), x: 1.0, y: 2.52, z: -0.96 },
        { geo: new THREE.CylinderGeometry(0.045, 0.055, 0.14, 12), x: -1.0, y: 2.52, z: -0.96 },
      ]),
    ),
    turboGlowMat,
  );
  group.add(exhaustTipGlow);

  const mudflapMesh = new THREE.Mesh(
    track(
      mergePartsToGeometry([
        { geo: new THREE.BoxGeometry(0.36, 0.44, 0.03), x: -0.94, y: 0.32, z: 2.54 },
        { geo: new THREE.BoxGeometry(0.36, 0.44, 0.03), x: 0.94, y: 0.32, z: 2.54 },
      ]),
    ),
    darkSteelMat,
  );
  group.add(mudflapMesh);

  const rearHaz = new THREE.Mesh(
    track(new THREE.BoxGeometry(2.08, 0.06, 0.02)),
    track(new THREE.MeshStandardMaterial({ map: tex.hazard('trk_haz') })),
  );
  rearHaz.position.set(0, 0.46, 3.12);
  group.add(rearHaz);

  const cabShape = new THREE.Shape();
  cabShape.moveTo(0, 0.66);
  cabShape.lineTo(1.78, 0.66);
  cabShape.lineTo(1.78, 2.4);
  cabShape.lineTo(0.64, 2.4);
  cabShape.lineTo(0.22, 1.48);
  cabShape.lineTo(0.02, 1.28);
  cabShape.lineTo(0, 0.66);
  cabShape.closePath();
  const cabGeo = new THREE.ExtrudeGeometry(cabShape, {
    depth: 2.04,
    bevelEnabled: true,
    bevelThickness: 0.055,
    bevelSize: 0.045,
    bevelSegments: 2,
  });

  const cowlShape = new THREE.Shape();
  cowlShape.moveTo(0, 0.66);
  cowlShape.lineTo(0.64, 0.66);
  cowlShape.lineTo(0.64, 1.48);
  cowlShape.lineTo(0.18, 1.42);
  cowlShape.lineTo(0, 1.24);
  cowlShape.closePath();
  const cowlGeo = new THREE.ExtrudeGeometry(cowlShape, {
    depth: 2.1,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.03,
    bevelSegments: 2,
  });

  const deflectorShape = new THREE.Shape();
  deflectorShape.moveTo(0, 2.39);
  deflectorShape.lineTo(1.02, 2.39);
  deflectorShape.lineTo(1.02, 3.02);
  deflectorShape.lineTo(0.28, 2.7);
  deflectorShape.closePath();
  const defGeo = new THREE.ExtrudeGeometry(deflectorShape, {
    depth: 1.96,
    bevelEnabled: true,
    bevelThickness: 0.045,
    bevelSize: 0.035,
    bevelSegments: 2,
  });

  const paintMesh = new THREE.Mesh(
    track(
      mergePartsToGeometry([
        { geo: cabGeo, x: 1.02, z: -2.92, ry: -Math.PI / 2 },
        { geo: cowlGeo, x: 1.05, z: -2.96, ry: -Math.PI / 2 },
        { geo: defGeo, x: 0.98, z: -2.14, ry: -Math.PI / 2 },
        { geo: new THREE.BoxGeometry(1.94, 0.08, 0.26), y: 2.36, z: -2.74, rx: -0.16 },
        { geo: new THREE.BoxGeometry(0.1, 0.22, 1.22), x: -1.04, y: 0.56, z: 0.25 },
        { geo: new THREE.BoxGeometry(0.1, 0.22, 1.22), x: 1.04, y: 0.56, z: 0.25 },
      ]),
    ),
    cabPaintMat,
  );
  paintMesh.castShadow = true;
  paintMesh.receiveShadow = true;
  cabPivot.add(paintMesh);

  const glassMesh = new THREE.Mesh(
    track(
      mergePartsToGeometry([
        { geo: new THREE.BoxGeometry(1.88, 0.86, 0.05), y: 1.91, z: -2.47, rx: 0.42 },
        { geo: new THREE.BoxGeometry(0.06, 0.68, 0.88), x: -0.99, y: 1.88, z: -1.78 },
        { geo: new THREE.BoxGeometry(0.06, 0.68, 0.88), x: 0.99, y: 1.88, z: -1.78 },
      ]),
    ),
    glassMat,
  );
  cabPivot.add(glassMesh);

  const interiorParts: GeoPartSpec[] = [
    { geo: new THREE.BoxGeometry(1.72, 0.24, 0.42), y: 1.48, z: -2.26 },
    { geo: new THREE.TorusGeometry(0.16, 0.022, 6, 16), x: -0.45, y: 1.56, z: -2.02, rx: -0.7 },
    { geo: new THREE.BoxGeometry(0.44, 0.62, 0.36), x: -0.45, y: 1.38, z: -1.56 },
    { geo: new THREE.BoxGeometry(0.44, 0.62, 0.36), x: 0.45, y: 1.38, z: -1.56 },
  ];
  cabPivot.add(new THREE.Mesh(track(mergePartsToGeometry(interiorParts)), interiorMat));

  const bullCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.78, 0.72, -3.02),
    new THREE.Vector3(-0.76, 1.08, -3.14),
    new THREE.Vector3(0.0, 1.12, -3.16),
    new THREE.Vector3(0.76, 1.08, -3.14),
    new THREE.Vector3(0.78, 0.72, -3.02),
  ]);
  const mirrorL = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.02, 2.02, -2.26),
    new THREE.Vector3(-1.22, 1.98, -2.2),
    new THREE.Vector3(-1.22, 1.62, -2.2),
    new THREE.Vector3(-1.02, 1.58, -2.26),
  ]);
  const mirrorR = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.02, 2.02, -2.26),
    new THREE.Vector3(1.22, 1.98, -2.2),
    new THREE.Vector3(1.22, 1.62, -2.2),
    new THREE.Vector3(1.02, 1.58, -2.26),
  ]);

  const chromeTrimParts: GeoPartSpec[] = [
    { geo: new THREE.TubeGeometry(bullCurve, 20, 0.028, 8, false) },
    { geo: new THREE.BoxGeometry(1.46, 0.032, 0.04), y: 0.9, z: -3.14 },
    { geo: new THREE.BoxGeometry(0.28, 0.08, 0.04), y: 1.13, z: -3.03 },
    { geo: new THREE.CylinderGeometry(0.036, 0.02, 0.28, 10), x: -0.58, y: 2.48, z: -2.18, rx: Math.PI / 2 },
    { geo: new THREE.CylinderGeometry(0.036, 0.02, 0.28, 10), x: 0.58, y: 2.48, z: -2.18, rx: Math.PI / 2 },
    { geo: new THREE.BoxGeometry(0.02, 0.36, 0.11), x: -1.19, y: 1.8, z: -2.17 },
    { geo: new THREE.BoxGeometry(0.02, 0.36, 0.11), x: 1.19, y: 1.8, z: -2.17 },
    { geo: new THREE.CylinderGeometry(0.022, 0.022, 2.08, 8), x: -0.52, y: 1.86, z: 3.01 },
    { geo: new THREE.CylinderGeometry(0.022, 0.022, 2.08, 8), x: 0.52, y: 1.86, z: 3.01 },
  ];
  for (const gy of [0.97, 1.07, 1.17, 1.27]) {
    chromeTrimParts.push({ geo: new THREE.BoxGeometry(1.36, 0.028, 0.085), y: gy, z: -2.99 });
  }
  const chromeTrimMesh = new THREE.Mesh(track(mergePartsToGeometry(chromeTrimParts)), chromeMat);
  cabPivot.add(chromeTrimMesh);

  const trimParts: GeoPartSpec[] = [
    { geo: new THREE.BoxGeometry(2.16, 0.26, 0.22), y: 0.72, z: -2.98 },
    { geo: new THREE.BoxGeometry(1.44, 0.44, 0.08), y: 1.12, z: -2.97 },
    { geo: new THREE.TubeGeometry(mirrorL, 14, 0.018, 6, false) },
    { geo: new THREE.TubeGeometry(mirrorR, 14, 0.018, 6, false) },
    { geo: new THREE.BoxGeometry(0.06, 0.42, 0.15), x: -1.21, y: 1.8, z: -2.2 },
    { geo: new THREE.BoxGeometry(0.06, 0.42, 0.15), x: 1.21, y: 1.8, z: -2.2 },
    { geo: new THREE.BoxGeometry(0.46, 0.025, 0.025), x: -0.42, y: 1.56, z: -2.64, rz: 0.14 },
    { geo: new THREE.BoxGeometry(0.46, 0.025, 0.025), x: 0.42, y: 1.56, z: -2.64, rz: 0.14 },
    { geo: new THREE.BoxGeometry(0.46, 0.16, 0.05), x: -0.78, y: 0.72, z: 2.99 },
    { geo: new THREE.BoxGeometry(0.46, 0.16, 0.05), x: 0.78, y: 0.72, z: 2.99 },
    { geo: new THREE.BoxGeometry(0.07, 0.24, 0.04), x: -1.06, y: 1.5, z: -1.48 },
    { geo: new THREE.BoxGeometry(0.07, 0.24, 0.04), x: 1.06, y: 1.5, z: -1.48 },
    { geo: new THREE.BoxGeometry(0.08, 0.06, 0.42), x: -1.02, y: 0.65, z: -1.78 },
    { geo: new THREE.BoxGeometry(0.08, 0.06, 0.42), x: 1.02, y: 0.65, z: -1.78 },
  ];
  const cabTrimMesh = new THREE.Mesh(track(mergePartsToGeometry(trimParts)), cabTrimMat);
  cabTrimMesh.castShadow = true;
  cabPivot.add(cabTrimMesh);

  const plate = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.46, 0.14, 0.02)),
    track(
      new THREE.MeshStandardMaterial({
        map: tex.sign('沪A·8025M', '#224c8a', '#ffffff', '', false, 0.46 / 0.14),
      }),
    ),
  );
  plate.position.set(0, 0.72, -3.1);
  cabPivot.add(plate);

  const headLampMesh = new THREE.Mesh(
    track(
      mergePartsToGeometry([
        { geo: new THREE.BoxGeometry(0.25, 0.15, 0.08), x: -0.84, y: 1.04, z: -2.99 },
        { geo: new THREE.BoxGeometry(0.25, 0.15, 0.08), x: 0.84, y: 1.04, z: -2.99 },
        { geo: new THREE.BoxGeometry(0.16, 0.08, 0.06), x: -0.84, y: 0.73, z: -3.08 },
        { geo: new THREE.BoxGeometry(0.16, 0.08, 0.06), x: 0.84, y: 0.73, z: -3.08 },
      ]),
    ),
    headLampMat,
  );
  cabPivot.add(headLampMesh);

  const amberParts: GeoPartSpec[] = [
    { geo: new THREE.BoxGeometry(0.25, 0.06, 0.08), x: -0.84, y: 1.15, z: -2.99 },
    { geo: new THREE.BoxGeometry(0.25, 0.06, 0.08), x: 0.84, y: 1.15, z: -2.99 },
    { geo: new THREE.BoxGeometry(0.11, 0.11, 0.06), x: -0.9, y: 0.72, z: 3.01 },
    { geo: new THREE.BoxGeometry(0.11, 0.11, 0.06), x: 0.9, y: 0.72, z: 3.01 },
  ];
  for (const cx of [-0.55, 0, 0.55]) {
    amberParts.push({ geo: new THREE.BoxGeometry(0.12, 0.05, 0.06), x: cx, y: 2.43, z: -2.26 });
  }
  for (const sx of [-1.12, 1.12]) {
    for (const mz of [-0.6, 0.96, 2.5]) {
      amberParts.push({ geo: new THREE.BoxGeometry(0.04, 0.05, 0.12), x: sx, y: 0.72, z: mz });
    }
  }
  cabPivot.add(new THREE.Mesh(track(mergePartsToGeometry(amberParts)), amberMat));

  const cargoBox = new THREE.Mesh(track(new THREE.BoxGeometry(2.22, 2.18, 4.02)), cargoWallMat);
  cargoBox.position.set(0, 1.84, 0.96);
  cargoBox.castShadow = true;
  cargoBox.receiveShadow = true;
  cabPivot.add(cargoBox);

  const roofParts: GeoPartSpec[] = [
    { geo: new THREE.BoxGeometry(2.24, 0.12, 4.04), y: 2.94, z: 0.96 },
    { geo: new THREE.BoxGeometry(1.94, 2.02, 0.04), y: 1.86, z: 2.98 },
  ];
  const cargoRoofMesh = new THREE.Mesh(track(mergePartsToGeometry(roofParts)), cargoRoofMat);
  cargoRoofMesh.castShadow = true;
  cargoRoofMesh.receiveShadow = true;
  cabPivot.add(cargoRoofMesh);

  const alloyBodyParts: GeoPartSpec[] = [];
  for (const sx of [-1.11, 1.11]) {
    alloyBodyParts.push({ geo: new THREE.BoxGeometry(0.06, 2.26, 0.08), x: sx, y: 1.84, z: -1.03 });
    alloyBodyParts.push({ geo: new THREE.BoxGeometry(0.06, 2.26, 0.08), x: sx, y: 1.84, z: 2.95 });
    alloyBodyParts.push({ geo: new THREE.BoxGeometry(0.05, 0.08, 4.04), x: sx, y: 2.92, z: 0.96 });
    alloyBodyParts.push({ geo: new THREE.BoxGeometry(0.04, 0.06, 1.5), x: sx * 0.96, y: 0.44, z: 0.65 });
  }
  for (let sy = 0.96; sy <= 2.74; sy += 0.22) {
    alloyBodyParts.push({ geo: new THREE.BoxGeometry(1.92, 0.02, 0.05), y: sy, z: 2.98 });
  }
  cabPivot.add(new THREE.Mesh(track(mergePartsToGeometry(alloyBodyParts)), alloyMat));

  const brakeMats: THREE.MeshStandardMaterial[] = [];
  const reverseMats: THREE.MeshStandardMaterial[] = [];
  for (const tx of [-0.78, 0.78]) {
    const bm = track(tailBrakeMat.clone());
    const rm = track(reverseMat.clone());
    brakeMats.push(bm);
    reverseMats.push(rm);
    const bmMesh = new THREE.Mesh(track(new THREE.BoxGeometry(0.18, 0.11, 0.06)), bm);
    bmMesh.position.set(tx - Math.sign(tx) * 0.1, 0.72, 3.0);
    const rmMesh = new THREE.Mesh(track(new THREE.BoxGeometry(0.08, 0.11, 0.06)), rm);
    rmMesh.position.set(tx, 0.72, 3.0);
    cabPivot.add(bmMesh, rmMesh);
  }

  const headTarget = new THREE.Object3D();
  headTarget.position.set(0, 0.35, -24);
  cabPivot.add(headTarget);
  const headSpot = new THREE.SpotLight(0xfff1cf, 1.8, 42, 0.54, 0.65);
  headSpot.position.set(0, 1.18, -3.05);
  headSpot.target = headTarget;
  cabPivot.add(headSpot);

  const tireGeo = track(new THREE.CylinderGeometry(0.44, 0.44, 0.28, 28));
  tireGeo.rotateZ(Math.PI / 2);
  const rimGeo = track(buildDeepRimGeo());
  const hubLugParts: GeoPartSpec[] = [
    { geo: new THREE.CylinderGeometry(0.095, 0.095, 0.33, 12), rz: Math.PI / 2 },
  ];
  for (let b = 0; b < 8; b++) {
    const ang = (b / 8) * Math.PI * 2;
    hubLugParts.push({
      geo: new THREE.CylinderGeometry(0.017, 0.017, 0.32, 6),
      y: Math.sin(ang) * 0.175,
      z: Math.cos(ang) * 0.175,
      rz: Math.PI / 2,
    });
  }
  const hubLugGeo = track(mergePartsToGeometry(hubLugParts));

  const wheelSpins: THREE.Group[] = [];
  function createWheel(x: number, z: number, dual: boolean): THREE.Group {
    const steerPivot = new THREE.Group();
    steerPivot.position.set(x, 0.44, z);
    const spin = new THREE.Group();
    steerPivot.add(spin);
    wheelSpins.push(spin);

    const offsets = dual ? [0, -Math.sign(x) * 0.26] : [0];
    offsets.forEach((ox, idx) => {
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.position.x = ox;
      tire.castShadow = true;
      spin.add(tire);
      if (idx === 0) {
        const rim = new THREE.Mesh(rimGeo, alloyMat);
        rim.position.x = ox;
        const hub = new THREE.Mesh(hubLugGeo, chromeMat);
        hub.position.x = ox;
        spin.add(rim, hub);
      }
    });
    group.add(steerPivot);
    return steerPivot;
  }

  const frontSteerL = createWheel(-0.98, -1.75, false);
  const frontSteerR = createWheel(0.98, -1.75, false);
  createWheel(-0.92, 1.8, true);
  createWheel(0.92, 1.8, true);

  return {
    group,
    cabPivot,
    frontSteerL,
    frontSteerR,
    wheelSpins,
    brakeMats,
    reverseMats,
    headLampMat,
    turboGlowMat,
    headSpot,
    headTarget,
  };
}

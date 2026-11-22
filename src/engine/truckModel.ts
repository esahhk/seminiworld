import * as THREE from 'three/webgpu';
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
  headSpot: THREE.SpotLight;
  headTarget: THREE.Object3D;
}

export function buildBoxTruckModel(
  track: <G extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(obj: G) => G,
  tex: TexCache,
): BoxTruckRig {
  const group = new THREE.Group();
  const cabPivot = new THREE.Group();
  group.add(cabPivot);

  const frameMat = track(
    new THREE.MeshStandardMaterial({ color: 0x202429, metalness: 0.65, roughness: 0.45 }),
  );
  const darkSteelMat = track(
    new THREE.MeshStandardMaterial({ color: 0x16191d, metalness: 0.5, roughness: 0.55 }),
  );
  const chromeMat = track(
    new THREE.MeshStandardMaterial({ color: 0xd4dbe0, metalness: 0.85, roughness: 0.2 }),
  );
  const alloyMat = track(
    new THREE.MeshStandardMaterial({ color: 0xb4bcc2, metalness: 0.72, roughness: 0.3 }),
  );
  const cabPaintMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x224c78,
      metalness: 0.42,
      roughness: 0.24,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
    }),
  );
  const cabTrimMat = track(
    new THREE.MeshStandardMaterial({ color: 0x1e2228, metalness: 0.25, roughness: 0.62 }),
  );
  const cargoWallMat = track(
    new THREE.MeshStandardMaterial({
      map: tex.truckLivery(),
      bumpMap: tex.bumpNoise('trk_b', 14),
      bumpScale: 0.006,
      metalness: 0.18,
      roughness: 0.38,
    }),
  );
  const cargoRoofMat = track(
    new THREE.MeshStandardMaterial({
      map: tex.corrugated('#eef2f5', 'trk_roof'),
      metalness: 0.28,
      roughness: 0.45,
    }),
  );
  const glassMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x1c2f3d,
      transparent: true,
      opacity: 0.52,
      metalness: 0.15,
      roughness: 0.06,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      ior: 1.52,
    }),
  );
  const tireMat = track(
    new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.88, metalness: 0.08 }),
  );
  const headLampMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xfff8e6,
      emissive: 0xffe6a8,
      emissiveIntensity: 1.15,
      roughness: 0.2,
    }),
  );
  const amberMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xf09224,
      emissive: 0xd96b10,
      emissiveIntensity: 0.75,
      roughness: 0.25,
    }),
  );
  const tailBrakeMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xc9261e,
      emissive: 0x99120c,
      emissiveIntensity: 0.35,
      roughness: 0.25,
    }),
  );
  const reverseMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xd8dfe3,
      emissive: 0xffffff,
      emissiveIntensity: 0.08,
      roughness: 0.25,
    }),
  );
  const interiorMat = track(
    new THREE.MeshStandardMaterial({ color: 0x2c3036, roughness: 0.85 }),
  );

  function addPart(
    parent: THREE.Object3D,
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    cast = true,
    recv = true,
  ) {
    const m = new THREE.Mesh(track(geo), mat);
    m.position.set(x, y, z);
    m.castShadow = cast;
    m.receiveShadow = recv;
    parent.add(m);
    return m;
  }

  for (const sx of [-0.42, 0.42]) {
    addPart(group, new THREE.BoxGeometry(0.11, 0.18, 5.85), frameMat, sx, 0.56, 0.1, true, true);
  }
  for (const cz of [-2.4, -1.1, 0.3, 1.7, 2.75]) {
    addPart(group, new THREE.BoxGeometry(0.92, 0.12, 0.12), frameMat, 0, 0.56, cz, false, false);
  }
  addPart(group, new THREE.BoxGeometry(1.75, 0.11, 0.12), frameMat, 0, 0.44, -1.75, false, false);
  addPart(group, new THREE.BoxGeometry(1.75, 0.14, 0.14), frameMat, 0, 0.44, 1.8, false, false);
  addPart(group, new THREE.CylinderGeometry(0.14, 0.14, 0.32, 12), frameMat, 0, 0.44, 1.8, false, false).rotation.z =
    Math.PI / 2;

  const tank = addPart(group, new THREE.CylinderGeometry(0.21, 0.21, 0.92, 14), alloyMat, -0.78, 0.5, -0.08);
  tank.rotation.x = Math.PI / 2;
  for (const tz of [-0.36, 0.2]) {
    const band = addPart(group, new THREE.TorusGeometry(0.22, 0.015, 6, 16), frameMat, -0.78, 0.5, tz, false, false);
    band.rotation.y = 0;
  }
  addPart(group, new THREE.BoxGeometry(0.38, 0.28, 0.52), frameMat, 0.76, 0.52, -0.15);
  const exhaust = addPart(group, new THREE.CylinderGeometry(0.045, 0.045, 1.65, 10), chromeMat, 0.96, 1.48, -0.95);
  exhaust.rotation.x = 0.04;
  addPart(group, new THREE.CylinderGeometry(0.09, 0.09, 0.65, 10), darkSteelMat, 0.96, 0.95, -0.95);

  const rearBumper = addPart(group, new THREE.BoxGeometry(2.18, 0.18, 0.14), frameMat, 0, 0.46, 3.04);
  rearBumper.castShadow = true;
  addPart(group, new THREE.BoxGeometry(2.08, 0.06, 0.02), track(new THREE.MeshStandardMaterial({ map: tex.hazard('trk_haz') })), 0, 0.46, 3.12, false, false);

  for (const sx of [-0.94, 0.94]) {
    addPart(group, new THREE.BoxGeometry(0.32, 0.42, 0.03), darkSteelMat, sx, 0.32, 2.52, false, false);
  }

  const cabShape = new THREE.Shape();
  cabShape.moveTo(0, 0.66);
  cabShape.lineTo(1.78, 0.66);
  cabShape.lineTo(1.78, 2.38);
  cabShape.lineTo(0.64, 2.38);
  cabShape.lineTo(0.24, 1.48);
  cabShape.lineTo(0.02, 1.28);
  cabShape.lineTo(0, 0.66);
  cabShape.closePath();

  const cabGeo = track(
    new THREE.ExtrudeGeometry(cabShape, {
      depth: 2.04,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.04,
      bevelSegments: 2,
    }),
  );
  const cabShell = addPart(cabPivot, cabGeo, cabPaintMat, 1.02, 0, -2.92, true, true);
  cabShell.rotation.y = -Math.PI / 2;

  const cowlShape = new THREE.Shape();
  cowlShape.moveTo(0, 0.66);
  cowlShape.lineTo(0.62, 0.66);
  cowlShape.lineTo(0.62, 1.48);
  cowlShape.lineTo(0.18, 1.42);
  cowlShape.lineTo(0, 1.24);
  cowlShape.closePath();
  const cowlGeo = track(
    new THREE.ExtrudeGeometry(cowlShape, {
      depth: 2.1,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 1,
    }),
  );
  const cowlMesh = addPart(cabPivot, cowlGeo, cabPaintMat, 1.05, 0, -2.96, false, true);
  cowlMesh.rotation.y = -Math.PI / 2;

  const deflectorShape = new THREE.Shape();
  deflectorShape.moveTo(0, 2.38);
  deflectorShape.lineTo(1.0, 2.38);
  deflectorShape.lineTo(1.0, 2.94);
  deflectorShape.lineTo(0.32, 2.66);
  deflectorShape.closePath();
  const defGeo = track(
    new THREE.ExtrudeGeometry(deflectorShape, {
      depth: 1.94,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 1,
    }),
  );
  const defMesh = addPart(cabPivot, defGeo, cabPaintMat, 0.97, 0, -2.14, true, false);
  defMesh.rotation.y = -Math.PI / 2;

  const windshield = addPart(cabPivot, new THREE.BoxGeometry(1.88, 0.86, 0.06), glassMat, 0, 1.91, -2.47, false, false);
  windshield.rotation.x = 0.42;
  for (const sx of [-0.99, 0.99]) {
    addPart(cabPivot, new THREE.BoxGeometry(0.06, 0.68, 0.88), glassMat, sx, 1.88, -1.78, false, false);
  }
  for (const wx of [-0.42, 0.42]) {
    const wiper = addPart(cabPivot, new THREE.BoxGeometry(0.46, 0.025, 0.025), darkSteelMat, wx, 1.56, -2.64, false, false);
    wiper.rotation.z = 0.14;
  }

  addPart(cabPivot, new THREE.BoxGeometry(1.72, 0.24, 0.42), interiorMat, 0, 1.48, -2.26, false, false);
  const steeringWheel = addPart(cabPivot, new THREE.TorusGeometry(0.16, 0.022, 6, 16), darkSteelMat, -0.45, 1.56, -2.02, false, false);
  steeringWheel.rotation.x = -0.7;
  for (const sx of [-0.45, 0.45]) {
    addPart(cabPivot, new THREE.BoxGeometry(0.44, 0.62, 0.36), interiorMat, sx, 1.38, -1.56, false, false);
  }

  addPart(cabPivot, new THREE.BoxGeometry(2.14, 0.26, 0.22), cabTrimMat, 0, 0.72, -2.97, true, false);
  addPart(cabPivot, new THREE.BoxGeometry(0.44, 0.14, 0.02), track(new THREE.MeshStandardMaterial({ map: tex.sign('沪A·8025M', '#224c8a', '#ffffff', '', false, 0.44 / 0.14) })), 0, 0.72, -3.09, false, false);
  addPart(cabPivot, new THREE.BoxGeometry(1.42, 0.44, 0.08), darkSteelMat, 0, 1.12, -2.97, false, false);
  for (const gy of [0.98, 1.12, 1.26]) {
    addPart(cabPivot, new THREE.BoxGeometry(1.34, 0.035, 0.09), chromeMat, 0, gy, -2.98, false, false);
  }
  addPart(cabPivot, new THREE.BoxGeometry(0.24, 0.08, 0.04), chromeMat, 0, 1.12, -3.02, false, false);

  for (const sx of [-0.84, 0.84]) {
    addPart(cabPivot, new THREE.BoxGeometry(0.24, 0.16, 0.08), headLampMat, sx, 1.04, -2.98, false, false);
    addPart(cabPivot, new THREE.BoxGeometry(0.24, 0.07, 0.08), amberMat, sx, 1.16, -2.98, false, false);
    addPart(cabPivot, new THREE.BoxGeometry(0.16, 0.08, 0.06), headLampMat, sx, 0.73, -3.07, false, false);
    addPart(cabPivot, new THREE.BoxGeometry(0.05, 0.22, 0.04), darkSteelMat, sx * 1.26, 1.5, -1.48, false, false);
    addPart(cabPivot, new THREE.BoxGeometry(0.06, 0.06, 0.42), cabTrimMat, sx * 1.22, 0.65, -1.78, false, false);

    const armX = sx > 0 ? 1.18 : -1.18;
    addPart(cabPivot, new THREE.BoxGeometry(0.28, 0.03, 0.03), darkSteelMat, sx > 0 ? 1.08 : -1.08, 1.98, -2.18, false, false);
    addPart(cabPivot, new THREE.BoxGeometry(0.28, 0.03, 0.03), darkSteelMat, sx > 0 ? 1.08 : -1.08, 1.62, -2.18, false, false);
    addPart(cabPivot, new THREE.BoxGeometry(0.06, 0.38, 0.14), cabTrimMat, armX, 1.8, -2.18, true, false);
    addPart(cabPivot, new THREE.BoxGeometry(0.02, 0.34, 0.11), chromeMat, armX - Math.sign(sx) * 0.025, 1.8, -2.15, false, false);
  }

  for (const cx of [-0.55, 0, 0.55]) {
    addPart(cabPivot, new THREE.BoxGeometry(0.11, 0.05, 0.06), amberMat, cx, 2.43, -2.26, false, false);
  }

  addPart(cabPivot, new THREE.BoxGeometry(2.22, 2.18, 4.02), cargoWallMat, 0, 1.84, 0.96, true, true);
  addPart(cabPivot, new THREE.BoxGeometry(2.24, 0.12, 4.04), cargoRoofMat, 0, 2.94, 0.96, true, true);
  addPart(cabPivot, new THREE.BoxGeometry(2.26, 0.14, 4.06), frameMat, 0, 0.72, 0.96, true, true);

  for (const sx of [-1.11, 1.11]) {
    addPart(cabPivot, new THREE.BoxGeometry(0.06, 2.26, 0.08), alloyMat, sx, 1.84, -1.03, false, false);
    addPart(cabPivot, new THREE.BoxGeometry(0.06, 2.26, 0.08), alloyMat, sx, 1.84, 2.95, false, false);
    addPart(cabPivot, new THREE.BoxGeometry(0.05, 0.08, 4.04), alloyMat, sx, 2.92, 0.96, false, false);
    for (const mz of [-0.6, 0.96, 2.5]) {
      addPart(cabPivot, new THREE.BoxGeometry(0.04, 0.05, 0.12), amberMat, sx * 1.01, 0.72, mz, false, false);
    }
    addPart(cabPivot, new THREE.BoxGeometry(0.04, 0.05, 1.4), alloyMat, sx * 0.96, 0.44, 0.65, false, false);
  }

  addPart(cabPivot, new THREE.BoxGeometry(1.94, 2.02, 0.04), cargoRoofMat, 0, 1.86, 2.98, false, true);
  for (let sy = 0.96; sy <= 2.74; sy += 0.22) {
    addPart(cabPivot, new THREE.BoxGeometry(1.92, 0.02, 0.05), alloyMat, 0, sy, 2.98, false, false);
  }
  for (const rx of [-0.52, 0.52]) {
    addPart(cabPivot, new THREE.CylinderGeometry(0.022, 0.022, 2.06, 8), chromeMat, rx, 1.86, 3.01, false, false);
  }

  const brakeMats: THREE.MeshStandardMaterial[] = [];
  const reverseMats: THREE.MeshStandardMaterial[] = [];
  for (const tx of [-0.78, 0.78]) {
    addPart(cabPivot, new THREE.BoxGeometry(0.46, 0.16, 0.05), darkSteelMat, tx, 0.72, 2.99, false, false);
    const bm = track(tailBrakeMat.clone());
    const rm = track(reverseMat.clone());
    brakeMats.push(bm);
    reverseMats.push(rm);
    addPart(cabPivot, new THREE.BoxGeometry(0.18, 0.11, 0.06), bm, tx - Math.sign(tx) * 0.1, 0.72, 3.0, false, false);
    addPart(cabPivot, new THREE.BoxGeometry(0.11, 0.11, 0.06), amberMat, tx + Math.sign(tx) * 0.12, 0.72, 3.0, false, false);
    addPart(cabPivot, new THREE.BoxGeometry(0.08, 0.11, 0.06), rm, tx, 0.72, 3.0, false, false);
  }

  const headTarget = new THREE.Object3D();
  headTarget.position.set(0, 0.4, -18);
  cabPivot.add(headTarget);
  const headSpot = new THREE.SpotLight(0xfff1cf, 1.6, 34, 0.52, 0.65);
  headSpot.position.set(0, 1.15, -3.0);
  headSpot.target = headTarget;
  cabPivot.add(headSpot);

  const tireGeo = track(new THREE.CylinderGeometry(0.44, 0.44, 0.28, 26));
  tireGeo.rotateZ(Math.PI / 2);
  const rimGeo = track(new THREE.CylinderGeometry(0.26, 0.26, 0.3, 20));
  rimGeo.rotateZ(Math.PI / 2);
  const hubGeo = track(new THREE.CylinderGeometry(0.1, 0.1, 0.33, 10));
  hubGeo.rotateZ(Math.PI / 2);
  const lugGeo = track(new THREE.CylinderGeometry(0.018, 0.018, 0.32, 6));
  lugGeo.rotateZ(Math.PI / 2);

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
        const hub = new THREE.Mesh(hubGeo, frameMat);
        hub.position.x = ox;
        spin.add(rim, hub);
        for (let b = 0; b < 6; b++) {
          const ang = (b / 6) * Math.PI * 2;
          const lug = new THREE.Mesh(lugGeo, chromeMat);
          lug.position.set(ox, Math.sin(ang) * 0.17, Math.cos(ang) * 0.17);
          spin.add(lug);
        }
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
    headSpot,
    headTarget,
  };
}

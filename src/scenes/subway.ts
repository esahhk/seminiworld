import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';
import { addInstancedMeshes, buildParkBench } from '../engine/propKit';
import type { InstanceTransform } from '../engine/propKit';

export function buildSubwayScene(ctx: SceneContext): SceneInitResult {
  const {
    T,
    scene,
    tex,
    sfx,
    V,
    mkMesh,
    addBox,
    addSign,
    addDoubleSign,
    createMaterial,
    addInteract,
    addCollectible,
    updaters,
    sceneIdxById,
    loadScene,
    showWhisper,
    openModal,
    setBounds,
    setHeightFn,
    setSurfaceFn,
  } = ctx;

  scene.background = new T.Color(0x101318);
  scene.fog = new T.Fog(0x101318, 18, 46);
  scene.add(new T.HemisphereLight(0xd2e1eb, 0x3c424a, 0.98));

  const subStripMat = createMaterial({
    color: 0xf4f8fc,
    emissive: 0xdcebf5,
    emissiveIntensity: 1.1,
  });
  for (const pz of [-8, 0, 8]) {
    const l = new T.PointLight(0xeef6fa, 1.0, 20);
    l.position.set(0, 4.0, pz);
    scene.add(l);
    addBox(3.6, 0.08, 0.22, subStripMat, 0, 4.62, pz, false, false, false);
  }
  const exitGlow = new T.PointLight(0xffe7b8, 1.15, 10);
  exitGlow.position.set(0, 2.8, -12.5);
  scene.add(exitGlow);

  const bump = tex.bumpNoise('sub_b', 18);
  addBox(
    9,
    0.4,
    32,
    createMaterial({
      map: tex.tiles('#b8bcbf', '#adb2b5', '#8c9194', 6, 'sub_p'),
      bumpMap: bump,
      bumpScale: 0.005,
      roughness: 0.42,
    }),
    0,
    0,
    0,
    true,
    false,
    true,
  );
  addBox(0.18, 0.04, 32, createMaterial({ color: 0xd9b334 }), -4.2, 0.21, 0, false);
  addBox(0.18, 0.04, 32, createMaterial({ color: 0xd9b334 }), 4.2, 0.21, 0, false);
  addBox(6, 0.4, 32, createMaterial({ color: 0x7c8185 }), -11, 0, 0, false);
  addBox(6, 0.4, 32, createMaterial({ color: 0x7c8185 }), 11, 0, 0, false);

  const railMat = createMaterial({ color: 0x626970, metalness: 0.72, roughness: 0.3 });
  const tieMat = createMaterial({ color: 0x3b3834, roughness: 0.9 });
  const tieItems: InstanceTransform[] = [];
  for (let z = -15; z <= 15; z += 1.2) {
    tieItems.push({ x: -11, y: 0.21, z });
    tieItems.push({ x: 11, y: 0.21, z });
  }
  addInstancedMeshes(ctx, new T.BoxGeometry(2.1, 0.08, 0.28), tieMat, tieItems, false, false);
  for (const rx of [-11.75, -10.25, 10.25, 11.75]) {
    addBox(0.08, 0.12, 32, railMat, rx, 0.26, 0, false, false, false);
  }

  addBox(38, 0.3, 34, createMaterial({ color: 0x2b3036 }), 0, 4.8, 0, false);
  const baffleItems: InstanceTransform[] = [];
  for (let bz = -14; bz <= 14; bz += 1.4) {
    baffleItems.push({ x: 0, y: 4.55, z: bz });
  }
  addInstancedMeshes(
    ctx,
    new T.BoxGeometry(8.6, 0.22, 0.08),
    createMaterial({ color: 0x454c54, metalness: 0.4, roughness: 0.5 }),
    baffleItems,
    false,
    false,
  );

  const tunnelMat = createMaterial({ color: 0x090b0e });
  addBox(42, 6, 14, tunnelMat, 0, 2.5, -24, false, false, false);
  addBox(42, 6, 14, tunnelMat, 0, 2.5, 24, false, false, false);
  for (const pz of [-10, -2, 6]) {
    addBox(0.68, 4.8, 0.68, createMaterial({ color: 0xd8ddd8 }), -2.2, 2.4, pz, true);
    addBox(0.76, 0.35, 0.76, createMaterial({ color: 0x525860 }), -2.2, 0.38, pz, false);
    addBox(0.68, 4.8, 0.68, createMaterial({ color: 0xd8ddd8 }), 2.2, 2.4, pz, true);
    addBox(0.76, 0.35, 0.76, createMaterial({ color: 0x525860 }), 2.2, 0.38, pz, false);
  }

  buildParkBench(ctx, 0, 0.2, 3.0, Math.PI / 2, true);
  buildParkBench(ctx, 0, 0.2, 10.5, -Math.PI / 2, true);

  for (const gx of [-1.2, 0.0, 1.2]) {
    addBox(0.18, 0.96, 1.35, createMaterial({ color: 0xc2c8ce, metalness: 0.68, roughness: 0.3 }), gx, 0.68, 12.2, true);
    addBox(0.1, 0.04, 0.24, createMaterial({ color: 0x54c77a, emissive: 0x267540, emissiveIntensity: 0.7 }), gx, 1.18, 12.6, false);
  }

  const hangerMat = createMaterial({ color: 0x7b848c, metalness: 0.65, roughness: 0.38 });
  addBox(0.06, 0.72, 0.06, hangerMat, -0.95, 4.44, -2.0, false);
  addBox(0.06, 0.72, 0.06, hangerMat, 0.95, 4.44, -2.0, false);
  addDoubleSign(
    2.7,
    0.96,
    tex.sign('换乘站 · 1 / 4 / 7 号线', '#1f3c5c', '#f0f2f4', '四线同层穿行', false, 2.7 / 0.96),
    0,
    3.65,
    -2.0,
    0,
    0x162b42,
  );
  addBox(3.4, 3.4, 1.4, createMaterial({ color: 0xdfd8c8 }), 0, 1.7, -14.2, true);
  addBox(
    1.9,
    2.8,
    0.2,
    createMaterial({ color: 0xebdcc2, emissive: 0x6b5839, emissiveIntensity: 0.48 }),
    0,
    1.4,
    -13.45,
    false,
  );
  addBox(0.16, 2.9, 0.26, hangerMat, -1.0, 1.45, -13.42, false);
  addBox(0.16, 2.9, 0.26, hangerMat, 1.0, 1.45, -13.42, false);
  addSign(
    2.2,
    0.9,
    tex.sign('B出口 ↑ 小画室', '#f4ebd8', '#3a2e22', '顺台阶上去就是画室窗边', false, 2.2 / 0.9),
    0,
    3.1,
    -13.35,
  );

  function makeTrain(color: number, x: number, zStart: number) {
    const g = new T.Group();
    const bodyMat = createMaterial({ color: 0xd8dce0, roughness: 0.32, metalness: 0.42 });
    const stripeMat = createMaterial({ color, roughness: 0.4 });
    const darkMat = createMaterial({ color: 0x22262b, metalness: 0.5, roughness: 0.5 });
    const winMat = createMaterial({
      color: 0x2a3c4a,
      emissive: 0x6e8fa3,
      emissiveIntensity: 0.42,
    });
    const hlMat = createMaterial({ color: 0xfff5d6, emissive: 0xffdf99, emissiveIntensity: 1.5 });
    const tlMat = createMaterial({ color: 0xd93a2b, emissive: 0xa81f14, emissiveIntensity: 1.1 });

    const body = mkMesh(new T.BoxGeometry(2.6, 2.75, 16.0), bodyMat, 0, 1.55, 0);
    const roof = mkMesh(new T.CylinderGeometry(1.18, 1.3, 15.8, 12, 1, false, 0, Math.PI), bodyMat, 0, 2.92, 0);
    roof.rotation.z = Math.PI / 2;
    roof.rotation.y = Math.PI / 2;
    const stripe = mkMesh(new T.BoxGeometry(2.65, 0.42, 16.04), stripeMat, 0, 1.35, 0);
    const win = mkMesh(new T.BoxGeometry(2.63, 0.78, 13.8), winMat, 0, 2.02, 0);
    const chassis = mkMesh(new T.BoxGeometry(2.4, 0.38, 15.6), darkMat, 0, 0.25, 0);
    g.add(body, roof, stripe, win, chassis);

    for (const endZ of [-8.0, 8.0]) {
      const cap = mkMesh(new T.BoxGeometry(2.48, 2.45, 0.42), bodyMat, 0, 1.5, endZ);
      const shield = mkMesh(new T.BoxGeometry(1.85, 0.95, 0.08), winMat, 0, 2.0, endZ + Math.sign(endZ) * 0.22);
      const lMat = endZ > 0 ? hlMat : tlMat;
      const l1 = mkMesh(new T.BoxGeometry(0.32, 0.16, 0.08), lMat, -0.75, 1.15, endZ + Math.sign(endZ) * 0.22);
      const l2 = mkMesh(new T.BoxGeometry(0.32, 0.16, 0.08), lMat, 0.75, 1.15, endZ + Math.sign(endZ) * 0.22);
      g.add(cap, shield, l1, l2);
    }
    for (const hz of [-4.2, 4.2]) {
      g.add(mkMesh(new T.BoxGeometry(1.4, 0.24, 2.2), darkMat, 0, 3.05, hz));
    }
    g.position.set(x, -0.35, zStart);
    scene.add(g);
    return g;
  }

  const trains = [
    { m: makeTrain(0xc94238, -11, -26), dir: 1, spd: 5.8 },
    { m: makeTrain(0x2f78b8, 11, 22), dir: -1, spd: 6.4 },
    { m: makeTrain(0x459457, -15.5, -10), dir: 1, spd: 7.9 },
    { m: makeTrain(0xd1902e, 15.5, 8), dir: -1, spd: 7.2 },
  ];
  let dispatchBoost = false;

  updaters.push((dt) => {
    const k = dispatchBoost ? 1.95 : 1.0;
    trains.forEach((tr) => {
      tr.m.position.z += tr.dir * tr.spd * k * dt;
      if (tr.dir > 0 && tr.m.position.z > 31) {
        tr.m.position.z = -31;
      }
      if (tr.dir < 0 && tr.m.position.z < -31) {
        tr.m.position.z = 31;
      }
      tr.m.visible = Math.abs(tr.m.position.z) < 29;
    });
  });

  addBox(0.6, 1.3, 0.6, createMaterial({ color: 0x3f4852 }), 0, 0.65, -6, true);
  addBox(0.46, 0.1, 0.46, createMaterial({ color: 0x262a2e }), 0, 1.33, -6, false);
  addBox(0.06, 0.34, 0.06, createMaterial({ color: 0xc94238 }), 0, 1.48, -6, false);
  addInteract('sub_panel', V(0, 1.1, -6), '扳动站台调度杆', '加快或放慢四条轨道发车间隔', () => {
    dispatchBoost = !dispatchBoost;
    sfx.play('train');
    showWhisper(
      dispatchBoost
        ? '四条股道上的地铁接连从黑隧道口钻出来！'
        : '恢复平峰间隔，列车缓缓滑进黑洞口。',
    );
  });
  addInteract('sub_map', V(0, 2.5, -2.0), '抬头看悬吊线路牌', '核对四条地铁方向', () => {
    sfx.play('paper');
    openModal(
      '多线同台换乘站',
      '左股道：红线与绿线（开往西城）\n右股道：蓝线与橙线（开往东站）\n\n北头台阶B出口连着上面一间小画室，透下来一点暖黄光。',
    );
  });
  addInteract('sub_studio', V(0, 1.5, -13.1), '顺着B出口台阶去小画室', '推门上楼到画室', () => {
    const si = sceneIdxById('studio');
    if (si !== -1) {
      sfx.play('door');
      loadScene(si);
      showWhisper('走出B出口通道，推门进了紧挨着地铁站的小画室。');
    }
  });

  addCollectible('subway', 2.8, 0.55, 6.2, 0x7ab4e0);
  setBounds({ minX: -3.5, maxX: 3.5, minZ: -13.2, maxZ: 14 });
  setSurfaceFn(() => 'stone');
  setHeightFn(() => 0.2);

  return {
    pos: V(0, 1.85, 9),
    yaw: 0,
    whisper: '四条轨道并排钻进黑隧道，站台尽头B出口写着通往小画室。',
  };
}

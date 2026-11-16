import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';

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
  scene.add(new T.HemisphereLight(0xd2e1eb, 0x3c424a, 0.75));
  for (const pz of [-8, 0, 8]) {
    const l = new T.PointLight(0xeef6fa, 0.85, 18);
    l.position.set(0, 4.0, pz);
    scene.add(l);
  }
  const exitGlow = new T.PointLight(0xffe7b8, 1.1, 10);
  exitGlow.position.set(0, 2.8, -12.5);
  scene.add(exitGlow);

  addBox(
    9,
    0.4,
    32,
    createMaterial({
      map: tex.tiles('#b8bcbf', '#adb2b5', '#8c9194', 6, 'sub_p'),
      roughness: 0.45,
    }),
    0,
    0,
    0,
    true,
    false,
    true,
  );
  addBox(0.15, 0.04, 32, createMaterial({ color: 0xd9b334 }), -4.2, 0.21, 0, false);
  addBox(0.15, 0.04, 32, createMaterial({ color: 0xd9b334 }), 4.2, 0.21, 0, false);
  addBox(6, 0.4, 32, createMaterial({ color: 0x7c8185 }), -11, 0, 0, false);
  addBox(6, 0.4, 32, createMaterial({ color: 0x7c8185 }), 11, 0, 0, false);
  addBox(38, 0.3, 34, createMaterial({ color: 0x2b3036 }), 0, 4.8, 0, false);
  const tunnelMat = createMaterial({ color: 0x090b0e });
  addBox(42, 6, 14, tunnelMat, 0, 2.5, -24, false, false, false);
  addBox(42, 6, 14, tunnelMat, 0, 2.5, 24, false, false, false);
  for (const pz of [-10, -2, 6]) {
    addBox(0.65, 4.8, 0.65, createMaterial({ color: 0xd8ddd8 }), -2.2, 2.4, pz, true);
    addBox(0.65, 4.8, 0.65, createMaterial({ color: 0xd8ddd8 }), 2.2, 2.4, pz, true);
  }
  addSign(
    2.6,
    0.9,
    tex.sign('换乘站 · 1 / 4 / 7 号线', '#1f3c5c', '#f0f2f4', '四线同层穿行'),
    -2.2,
    3.1,
    -1.65,
  );
  addBox(3.4, 3.4, 1.4, createMaterial({ color: 0xdfd8c8 }), 0, 1.7, -14.2, true);
  addBox(
    1.9,
    2.8,
    0.2,
    createMaterial({
      color: 0xebdcc2,
      emissive: 0x6b5839,
      emissiveIntensity: 0.45,
    }),
    0,
    1.4,
    -13.45,
    false,
  );
  addSign(
    2.2,
    0.9,
    tex.sign('B出口 ↑ 小画室', '#f4ebd8', '#3a2e22', '顺台阶上去就是画室窗边'),
    0,
    3.1,
    -13.35,
  );

  function makeTrain(color: number, x: number, zStart: number) {
    const g = new T.Group();
    const body = mkMesh(
      new T.BoxGeometry(2.6, 2.8, 16),
      createMaterial({ color: 0xd8dce0, roughness: 0.35, metalness: 0.35 }),
      0,
      1.4,
      0,
    );
    const stripe = mkMesh(
      new T.BoxGeometry(2.65, 0.42, 16.02),
      createMaterial({ color }),
      0,
      1.35,
      0,
    );
    const win = mkMesh(
      new T.BoxGeometry(2.63, 0.75, 13.5),
      createMaterial({
        color: 0x2a3c4a,
        emissive: 0x6e8fa3,
        emissiveIntensity: 0.35,
      }),
      0,
      2.0,
      0,
    );
    g.add(body, stripe, win);
    g.position.set(x, -0.4, zStart);
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
  addInteract('sub_panel', V(0, 1.1, -6), '扳动站台调度杆', '加快或放慢四条轨道发车间隔', () => {
    dispatchBoost = !dispatchBoost;
    sfx.play('train');
    showWhisper(
      dispatchBoost
        ? '四条股道上的地铁接连从黑隧道口钻出来！'
        : '恢复平峰间隔，列车缓缓滑进黑洞口。',
    );
  });
  addInteract('sub_map', V(-2.2, 2.0, -1.8), '抬头看柱子上的线路图', '核对四条地铁方向', () => {
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

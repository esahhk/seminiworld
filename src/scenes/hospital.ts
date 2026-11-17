import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';

export function buildHospitalScene(ctx: SceneContext): SceneInitResult {
  const {
    T,
    scene,
    player,
    state,
    tex,
    sfx,
    V,
    addMesh,
    addBox,
    addSign,
    syncColX,
    createMaterial,
    addInteract,
    addCollectible,
    addTimedRedirect,
    updaters,
    sceneIdxById,
    loadScene,
    showWhisper,
    openModal,
    setBounds,
    setSurfaceFn,
  } = ctx;

  scene.background = new T.Color(0xd7e1e2);
  scene.fog = new T.Fog(0xd7e1e2, 16, 48);
  scene.add(new T.HemisphereLight(0xf5fbfc, 0x909fa1, 0.95));
  const c1 = new T.PointLight(0xffffff, 0.9, 18);
  c1.position.set(0, 3.8, 7);
  scene.add(c1);
  const c2 = new T.PointLight(0xeef7f9, 0.9, 18);
  c2.position.set(-4.5, 3.8, -4);
  scene.add(c2);
  const c3 = new T.PointLight(0xd9ecf2, 0.85, 18);
  c3.position.set(4.7, 3.8, -4);
  scene.add(c3);

  const flMat = createMaterial({
    map: tex.tiles('#dde2e1', '#d3d9d8', '#b9c0bf', 6, 'hosp_f'),
    roughness: 0.35,
  });
  const wMat = createMaterial({ color: 0xe5eceb });
  const ceilMat = createMaterial({ color: 0xf3f5f5 });
  addBox(5.2, 0.2, 7.6, flMat, 0, -0.1, 7.4, true, false, true);
  addBox(14.0, 0.2, 3.6, flMat, 0, -0.1, 2.8, true, false, true);
  addBox(5.0, 0.2, 13.0, flMat, -4.5, -0.1, -5.0, true, false, true);
  addBox(3.4, 0.2, 16.0, flMat, 4.7, -0.1, -6.5, true, false, true);
  addBox(5.4, 0.2, 15.0, flMat, 0.5, -0.1, -5.0, false, false, true);
  addBox(16.0, 0.2, 28.0, ceilMat, 0, 4.2, -1.5, false);

  addBox(5.2, 4.2, 0.2, wMat, 0, 2.1, 11.2, true);
  addBox(0.2, 4.2, 6.8, wMat, -2.5, 2.1, 7.8, true);
  addBox(0.2, 4.2, 6.8, wMat, 2.5, 2.1, 7.8, true);
  // Sealed solid central core between left (-2.0) and right (+3.0) corridors
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

  addSign(
    2.4,
    0.85,
    tex.sign('← 屏蔽重门（左拐再右拐）', '#f4f7f6', '#273336', '候机连廊（右拐再左拐） →'),
    0.5,
    2.25,
    1.23,
  );

  const lineMatB = createMaterial({
    color: 0x3684a8,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const lineMatG = createMaterial({
    color: 0x4b996b,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const lineMatO = createMaterial({
    color: 0xd1823b,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  addBox(0.26, 0.012, 7.6, lineMatB, -0.45, 0.008, 6.8, false);
  addBox(0.26, 0.012, 7.6, lineMatG, 0.0, 0.008, 6.8, false);
  addBox(0.26, 0.012, 7.6, lineMatO, 0.45, 0.008, 6.8, false);
  addBox(4.3, 0.012, 0.26, lineMatB, -2.5, 0.008, 3.0, false);
  addBox(0.26, 0.012, 12.0, lineMatB, -4.5, 0.008, -3.0, false);
  addBox(4.5, 0.012, 0.26, lineMatG, 2.6, 0.008, 2.6, false);
  addBox(0.26, 0.012, 15.5, lineMatG, 4.7, 0.008, -5.2, false);
  addSign(
    2.2,
    0.9,
    tex.sign('蓝线:屏蔽重门  绿线:候机连廊', '#f4f7f6', '#273336', '请沿地面标志线通行'),
    0,
    0.025,
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
  addMesh(new T.PlaneGeometry(1.5, 1.5), radMat, -4.5, 0.032, -1.6, false, false).rotation.x =
    -Math.PI / 2;
  addMesh(new T.PlaneGeometry(1.5, 1.5), radMat, -4.5, 0.032, -5.4, false, false).rotation.x =
    -Math.PI / 2;

  addBox(1.2, 4.2, 0.5, createMaterial({ color: 0xd2dcdd }), -6.3, 2.1, -3.5, true);
  addBox(1.2, 4.2, 0.5, createMaterial({ color: 0xd2dcdd }), -2.7, 2.1, -3.5, true);
  addBox(3.4, 0.85, 0.5, createMaterial({ color: 0xd2dcdd }), -4.5, 3.78, -3.5, true);
  const bigDoor = addBox(
    3.4,
    3.3,
    0.42,
    createMaterial({ color: 0x7d9299, metalness: 0.35, roughness: 0.45 }),
    -4.5,
    1.65,
    -3.5,
    true,
  );
  addSign(
    1.8,
    0.85,
    tex.sign('屏蔽重门', '#d68536', '#1b1a18', '请勿倚靠 · 电动缓缓开启'),
    -4.5,
    2.1,
    -3.27,
  );
  const beacon = addMesh(
    new T.SphereGeometry(0.14, 10, 10),
    createMaterial({
      color: 0xc93a2b,
      emissive: 0xaa2218,
      emissiveIntensity: 0.8,
    }),
    -2.9,
    3.55,
    -3.22,
  );
  const btnMat = createMaterial({
    color: 0x5ab885,
    emissive: 0x266e46,
    emissiveIntensity: 0.5,
  });
  addBox(0.32, 0.46, 0.08, createMaterial({ color: 0xdfe4e5 }), -2.35, 1.35, -3.22, false);
  addBox(0.16, 0.16, 0.04, btnMat, -2.35, 1.35, -3.17, false);
  addBox(0.32, 0.46, 0.08, createMaterial({ color: 0xdfe4e5 }), -2.35, 1.35, -3.78, false);
  addBox(0.16, 0.16, 0.04, btnMat, -2.35, 1.35, -3.83, false);
  addBox(
    0.55,
    1.0,
    1.1,
    createMaterial({ color: 0xc8cfd1, metalness: 0.5 }),
    -6.4,
    0.5,
    -7.2,
    true,
  );
  addBox(1.8, 0.45, 0.55, createMaterial({ color: 0x7aa6b8 }), -3.2, 0.35, -7.6, true);

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
  addSign(
    2.0,
    0.85,
    tex.sign('候机连廊 · 通往机场', '#e4edf0', '#22343d', '往前出航站楼'),
    4.7,
    3.15,
    -14.22,
  );

  let doorOpen = false;
  const hospDoorInter = addInteract(
    'hosp_door',
    V(-3.8, 1.4, -3.15),
    '开启厚重铅门',
    '打开后可直接穿过门洞',
    () => {
      doorOpen = !doorOpen;
      sfx.play('door');
      showWhisper(
        doorOpen
          ? '气压阀轻嗤一声，这扇半米厚的屏蔽门笨重地滑开了。'
          : '厚门缓缓合拢，发出一声低沉闷响。',
      );
    },
    {
      radius: 3.8,
      getLabel: () => (doorOpen ? '关闭厚重铅门' : '开启厚重铅门'),
    },
  );
  updaters.push((dt) => {
    bigDoor.position.x += ((doorOpen ? -1.4 : -4.5) - bigDoor.position.x) * Math.min(1, dt * 2.4);
    syncColX(bigDoor, 1.7);
    (beacon.material as InstanceType<typeof T.MeshStandardMaterial>).emissiveIntensity = doorOpen
      ? 0.2
      : 1.1;
    hospDoorInter.pos.z = player.pos.z > -3.5 ? -3.15 : -3.85;
    hospDoorInter.pos.x = bigDoor.position.x > -3.0 ? -2.4 : -3.8;
  });

  addInteract('hosp_floor', V(0, 0.2, 7.2), '低头看地面彩色标志线', '核对分岔方向', () => {
    sfx.play('paper');
    openModal(
      '地面色彩导引',
      '蓝线往左拐再右拐，通向尽头那扇画着防辐射标志的厚重铅门；\n绿线和橙线往右拐，顺着灰青色的连廊直通机场候机区。\n\n地面打过蜡，走上去鞋底发出清脆响声。',
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
    whisper: '左边那扇厚门还在等刷卡，右边这条连廊一直通到候机区。',
  };
}

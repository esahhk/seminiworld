import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';
import { addInstancedMeshes, buildWoodChair } from '../engine/propKit';

export function buildSchoolBbqScene(ctx: SceneContext): SceneInitResult {
  const {
    T,
    scene,
    state,
    tex,
    sfx,
    V,
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
    setBounds,
    setHeightFn,
    setSurfaceFn,
  } = ctx;

  scene.background = new T.Color(0xdcc2a0);
  scene.fog = new T.Fog(0xdcc2a0, 16, 52);
  scene.add(new T.HemisphereLight(0xffe7c4, 0x7d6b57, 0.95));
  const sun = new T.DirectionalLight(0xffcf8f, 1.05);
  sun.position.set(12, 14, 10);
  sun.castShadow = true;
  scene.add(sun);
  const clsLight = new T.PointLight(0xfff5e4, 0.95, 18);
  clsLight.position.set(-3, 3.4, -3.5);
  scene.add(clsLight);

  addBox(
    26,
    0.2,
    20,
    createMaterial({ map: tex.concrete('#8f8a81', 0.18, 'bbq_g'), roughness: 0.9 }),
    0,
    -0.1,
    0,
    true,
    false,
    true,
  );
  addBox(
    12,
    0.22,
    12,
    createMaterial({ map: tex.tiles('#d8d3c8', '#cbc5b8', '#a49e91', 6, 'cls_f'), roughness: 0.7 }),
    -3,
    0.02,
    -2,
    false,
    false,
    true,
  );

  const wallMat = createMaterial({ color: 0xeae5d9, roughness: 0.9 });
  const dadoMat = createMaterial({ color: 0xb0c4b3, roughness: 0.78 });
  addBox(0.25, 3.8, 12, wallMat, -9, 1.9, -2, true);
  addBox(0.06, 1.15, 11.8, dadoMat, -8.85, 0.65, -2, false);
  addBox(12, 3.8, 0.25, wallMat, -3, 1.9, -8, true);
  addBox(11.8, 1.15, 0.06, dadoMat, -3, 0.65, -7.85, false);
  addBox(12, 0.2, 12, createMaterial({ color: 0xded8cc }), -3, 3.8, -2, false);
  for (const lz of [-5.2, 0.2]) {
    addBox(1.8, 0.08, 0.22, createMaterial({ color: 0xf4f9ff, emissive: 0xe8f3ff, emissiveIntensity: 0.85 }), -3, 3.66, lz, false);
  }

  addBox(0.25, 3.8, 4.2, wallMat, 3, 1.9, -5.9, true);
  addBox(0.25, 3.8, 4.2, wallMat, 3, 1.9, 1.9, true);
  addBox(0.25, 0.72, 3.6, wallMat, 3, 0.36, -2, true);
  addBox(0.25, 0.7, 3.6, wallMat, 3, 3.45, -2, true);
  addBox(0.32, 0.06, 3.7, createMaterial({ color: 0xc2b9ab }), 3, 0.73, -2, false);
  addBox(0.06, 2.38, 1.8, createMaterial({ color: 0xa9c5cf, transparent: true, opacity: 0.38 }), 3.03, 1.91, -1.1, true);
  const winPane = addBox(0.08, 2.38, 1.8, createMaterial({ color: 0xa9c5cf, transparent: true, opacity: 0.48 }), 2.95, 1.91, -2.9, true);
  const winCol = winPane.userData.col;
  if (winCol) {
    winCol.active = false;
  }
  winPane.position.z = -1.15;

  addBox(4.5, 3.8, 0.25, wallMat, -6.7, 1.9, 4, true);
  addBox(4.5, 3.8, 0.25, wallMat, 0.8, 1.9, 4, true);
  const doorGeo = new T.BoxGeometry(2.9, 2.8, 0.14);
  doorGeo.translate(1.45, 0, 0);
  const hallDoor = addMesh(doorGeo, createMaterial({ map: tex.wood('#8c5e3a', '#633e22') }), -4.4, 1.4, 4, true, true);
  const doorCol = { minX: -4.4, maxX: -1.5, minZ: 3.93, maxZ: 4.07, minY: 0, maxY: 2.8, mesh: hallDoor, active: true };
  colliders.push(doorCol);

  addBox(8.5, 0.2, 6, createMaterial({ map: tex.tiles('#cfd4d1', '#c0c5c2', '#969b98', 4, 'hall_f') }), -3, 0.01, 7, false, false, true);
  addSign(2.2, 1.1, tex.sign('教学楼一层大厅', '#e6dfd0', '#384a3c', '楼梯口 · 右转校医室', true), -7, 1.8, 4.15);
  addBox(0.2, 3.8, 6.2, createMaterial({ color: 0xe5dfd3 }), -7.25, 1.9, 7, true);
  addBox(0.14, 2.5, 1.4, createMaterial({ color: 0x9dc2ae }), -7.12, 1.25, 7.0, true);
  addSign(1.6, 0.72, tex.sign('校医室 · 走廊尽头右转', '#eef4ef', '#2f5440', '推门进走廊', true), -7.08, 2.8, 7.0, Math.PI / 2);

  addBox(4.3, 1.56, 0.12, createMaterial({ color: 0x5c422a, roughness: 0.7 }), -3, 2.0, -7.83, false);
  addBox(4.15, 1.42, 0.1, createMaterial({ color: 0x2b4a36, roughness: 0.9 }), -3, 2.0, -7.78, true);
  addBox(4.15, 0.06, 0.16, createMaterial({ color: 0x8f6642 }), -3, 1.28, -7.72, false);
  const bbTex = tex.sign('值日生：林小宇  周敏', '#2b4a36', '#eae6d8', '放学记得关东边窗户', true);
  addMesh(
    new T.PlaneGeometry(3.8, 1.3),
    createMaterial({
      map: bbTex,
      emissive: 0xffffff,
      emissiveMap: bbTex,
      emissiveIntensity: 0.22,
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    }),
    -3,
    2.0,
    -7.7,
    false,
    false,
  );
  addCylinder(0.22, 0.22, 0.05, 14, createMaterial({ color: 0xf4f4ec }), -3, 3.25, -7.82).rotation.x = Math.PI / 2;

  const deskWood = createMaterial({ map: tex.wood('#b88d5c', '#8a653c'), roughness: 0.72 });
  const deskSteel = createMaterial({ color: 0x454c54, metalness: 0.55, roughness: 0.4 });
  for (const dx of [-5.5, -3, -0.5]) {
    for (const dz of [-4.5, -1.5]) {
      addBox(0.95, 0.05, 0.56, deskWood, dx, 0.72, dz, true);
      addBox(0.86, 0.14, 0.46, deskSteel, dx, 0.6, dz, false);
      for (const [lx, lz] of [[-0.4, -0.22], [0.4, -0.22], [-0.4, 0.22], [0.4, 0.22]]) {
        addCylinder(0.02, 0.02, 0.68, 6, deskSteel, dx + lx, 0.36, dz + lz, true);
      }
      buildWoodChair(ctx, dx, 0.13, dz + 0.52, Math.PI, '#9e7246');
    }
  }
  addBox(0.32, 0.05, 0.24, createMaterial({ color: 0x628099 }), -3.1, 0.77, -4.45, false);

  const grillMetal = createMaterial({ color: 0x35373a, metalness: 0.65, roughness: 0.42 });
  const inoxMat = createMaterial({ color: 0xbcc4c9, metalness: 0.75, roughness: 0.28 });
  addBox(1.85, 0.34, 0.72, grillMetal, 6.5, 0.72, -2, true);
  for (const [lx, lz] of [[-0.84, -0.3], [0.84, -0.3], [-0.84, 0.3], [0.84, 0.3]]) {
    addCylinder(0.028, 0.028, 0.62, 6, grillMetal, 6.5 + lx, 0.31, -2 + lz);
  }
  addBox(0.46, 0.04, 0.66, inoxMat, 7.64, 0.78, -2, false);
  addBox(1.65, 0.08, 0.56, createMaterial({ color: 0xc94218, emissive: 0x9e2508, emissiveIntensity: 0.95 }), 6.5, 0.88, -2, false);
  for (let sk = -0.65; sk <= 0.65; sk += 0.26) {
    addBox(0.05, 0.04, 0.44, createMaterial({ color: 0x9c4c26 }), 6.5 + sk, 0.95, -2, false);
  }
  for (const jx of [7.55, 7.68, 7.8]) {
    addCylinder(0.035, 0.035, 0.12, 8, inoxMat, jx, 0.86, -2.05);
  }
  addCylinder(0.015, 0.015, 0.9, 6, grillMetal, 5.75, 1.25, -2.35);
  addSign(1.7, 0.8, tex.sign('炭火烧烤', '#f4e6c3', '#a82c1a', '羊肉串 3元 · 烤面筋 2元', true), 6.5, 1.5, -2.4);

  for (const [sx, sz, col] of [[8.0, -0.8, 0x3a6fa8], [8.6, -2.2, 0xc94c38], [5.8, -0.35, 0xd48e3a]] as [number, number, number][]) {
    const stoolMat = createMaterial({ color: col, roughness: 0.55 });
    addBox(0.36, 0.05, 0.36, stoolMat, sx, 0.42, sz, true);
    for (const [lx, lz] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]]) {
      addBox(0.05, 0.4, 0.05, stoolMat, sx + lx, 0.2, sz + lz, false);
    }
  }

  const smokeList: { x: number; y: number; z: number; p: number; s: number }[] = [];
  const sGeo = new T.DodecahedronGeometry(0.45, 0);
  const sMat = createMaterial({ color: 0xdcdad4, transparent: true, opacity: 0.3, roughness: 1 });
  for (let i = 0; i < 20; i++) {
    smokeList.push({ x: 6.5, y: 1.1 + Math.random() * 1.8, z: -2 + (Math.random() - 0.5) * 1.2, p: Math.random(), s: 0.6 });
  }
  const smokeInst = addInstancedMeshes(ctx, sGeo, sMat, smokeList, false, false);
  if (smokeInst) {
    smokeInst.frustumCulled = false;
  }
  const _sdummy = new T.Object3D();

  let winClosed = false;
  let doorOpen = false;
  let fanOn = false;

  const fanMetalMat = createMaterial({ color: 0xd2d8dc, metalness: 0.45, roughness: 0.4 });
  addCylinder(0.24, 0.28, 0.06, 14, fanMetalMat, -3.0, 0.16, -7.4, false);
  addCylinder(0.03, 0.035, 1.05, 8, fanMetalMat, -3.0, 0.7, -7.4, false);
  addMesh(new T.TorusGeometry(0.24, 0.018, 8, 20), fanMetalMat, -3.0, 1.26, -7.32, false, false);
  const fanBlades = new T.Group();
  fanBlades.position.set(-3.0, 1.26, -7.32);
  const bladeMat = createMaterial({ color: 0x7ea5bd, roughness: 0.35 });
  for (let bi = 0; bi < 3; bi++) {
    const b = new T.Mesh(new T.BoxGeometry(0.07, 0.2, 0.015), bladeMat);
    const ang = (bi * Math.PI * 2) / 3;
    b.position.set(Math.cos(ang) * 0.1, Math.sin(ang) * 0.1, 0);
    b.rotation.z = ang + Math.PI / 2;
    fanBlades.add(b);
  }
  scene.add(fanBlades);

  updaters.push((dt) => {
    if (fanOn) {
      fanBlades.rotation.z += dt * 14;
    }
    if (smokeInst) {
      const drift = winClosed ? 1.5 : fanOn ? 0.5 : -10.5;
      for (let i = 0; i < smokeList.length; i++) {
        const s = smokeList[i];
        s.p += dt * 0.24;
        if (s.p > 1) {
          s.p = 0;
        }
        const sx = 6.5 + s.p * drift;
        const sy = 1.0 + Math.sin(s.p * 3.14) * 1.3 + s.p * 0.7;
        const sz = -2 + Math.sin(s.p * 7) * 0.45;
        const sc = 0.5 + s.p * 1.4;
        _sdummy.position.set(sx, sy, sz);
        _sdummy.scale.set(sc, sc * 0.8, sc);
        _sdummy.updateMatrix();
        smokeInst.setMatrixAt(i, _sdummy.matrix);
      }
      smokeInst.instanceMatrix.needsUpdate = true;
    }
    hallDoor.rotation.y += ((doorOpen ? -Math.PI / 2 : 0) - hallDoor.rotation.y) * Math.min(1, dt * 6);
    if (hallDoor.rotation.y < -0.8) {
      doorCol.minX = -4.47;
      doorCol.maxX = -4.33;
      doorCol.minZ = 4.0;
      doorCol.maxZ = 6.9;
    } else {
      doorCol.minX = -4.4;
      doorCol.maxX = -1.5;
      doorCol.minZ = 3.93;
      doorCol.maxZ = 4.07;
    }
  });

  addInteract('bbq_stall', V(6.5, 1.0, -2), '翻动烤架上的肉串', '撒孜然并观察飘烟', () => {
    sfx.play('sizzle');
    showWhisper(
      winClosed
        ? '肉串滋滋冒油，因为关了窗，烟只得顺着外头风向散去。'
        : '孜然味混着木炭烟，一股脑儿顺着风钻进了教室东窗！',
    );
  });
  addInteract(
    'bbq_win',
    V(3.0, 1.4, -2),
    '推拉教室东侧窗户',
    '开窗时可从半扇窗洞翻跃穿行',
    () => {
      winClosed = !winClosed;
      winPane.position.z = winClosed ? -2.9 : -1.15;
      if (winCol) {
        winCol.active = winClosed;
      }
      sfx.play('door');
      showWhisper(
        winClosed ? '窗户咔哒扣紧，教室里飘着的烤串味慢慢散了。' : '窗扇滑开叠在一起，留出半扇窗洞刚好能翻过去。',
      );
    },
    { getLabel: () => (winClosed ? '推开教室东侧窗户' : '关紧教室东侧窗户') },
  );
  addInteract('bbq_door', V(-2.95, 1.4, 4), '开关教室与大厅的门', '出入教室与门厅', () => {
    doorOpen = !doorOpen;
    sfx.play('door');
    showWhisper(
      doorOpen ? '推门走出教室，门厅右手边挂着校医室的小牌子。' : '带上门，教室里又只剩粉笔灰和隐约的孜然香。',
    );
  });
  addInteract('bbq_to_inf', V(-6.8, 1.4, 7.0), '推门去校医室', '进入小学医务室走廊', () => {
    const ii = sceneIdxById('infirmary');
    if (ii !== -1) {
      sfx.play('door');
      addTimedRedirect(() => {
        state.pendingSpawn = { pos: V(0, 1.65, 8.6), yaw: 0 };
        loadScene(ii);
        showWhisper('推门走进校医室走廊，空气里立刻闻见一股清凉的消毒水味。');
      }, 260);
    }
  });
  addInteract('bbq_fan', V(-3.0, 0.8, -7.4), '开启讲台边的立式风扇', '把烟往窗外吹', () => {
    fanOn = !fanOn;
    sfx.play('switch');
    showWhisper(
      fanOn ? '风扇嗡嗡转起来，把滞留的青烟往窗外推回去。' : '风扇停了，夕阳斜照进飘着灰尘的教室。',
    );
  });

  addCollectible('school_bbq', -3.2, 0.78, -4.5, 0xf2efe4);
  setBounds({ minX: -8.5, maxX: 10.5, minZ: -7.4, maxZ: 9.5 });
  setSurfaceFn((x, z) => (x >= -9 && x <= 3 && z >= -8 && z <= 4 ? 'wood' : 'concrete'));
  setHeightFn((x, z) => {
    if (x >= -9 && x <= 3 && z >= -8 && z <= 4) {
      return 0.13;
    }
    if (x >= -7.25 && x <= 1.25 && z > 4 && z <= 10) {
      return 0.11;
    }
    return 0;
  });

  return {
    pos: V(6.2, 1.65, 3.2),
    yaw: 0.45,
    whisper: '校门外支着炭火烤摊，教室门厅右手边那扇浅绿门通往校医室。',
  };
}

import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';

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
  const sun = new T.DirectionalLight(0xffcf8f, 1.0);
  sun.position.set(12, 14, 10);
  sun.castShadow = true;
  scene.add(sun);
  const clsLight = new T.PointLight(0xfff5e4, 0.9, 18);
  clsLight.position.set(-3, 3.4, -3.5);
  scene.add(clsLight);

  addBox(
    26,
    0.2,
    20,
    createMaterial({
      map: tex.concrete('#8f8a81', 0.18, 'bbq_g'),
      roughness: 0.9,
    }),
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
    createMaterial({
      map: tex.tiles('#d8d3c8', '#cbc5b8', '#a49e91', 6, 'cls_f'),
      roughness: 0.7,
    }),
    -3,
    0.02,
    -2,
    false,
    false,
    true,
  );
  addBox(
    0.25,
    3.8,
    12,
    createMaterial({ color: 0xeae5d9, roughness: 0.9 }),
    -9,
    1.9,
    -2,
    true,
  );
  addBox(
    12,
    3.8,
    0.25,
    createMaterial({ color: 0xeae5d9, roughness: 0.9 }),
    -3,
    1.9,
    -8,
    true,
  );
  addBox(12, 0.2, 12, createMaterial({ color: 0xded8cc }), -3, 3.8, -2, false);
  addBox(0.25, 3.8, 4.2, createMaterial({ color: 0xeae5d9 }), 3, 1.9, -5.9, true);
  addBox(0.25, 3.8, 4.2, createMaterial({ color: 0xeae5d9 }), 3, 1.9, 1.9, true);
  addBox(0.25, 0.72, 3.6, createMaterial({ color: 0xeae5d9 }), 3, 0.36, -2, true);
  addBox(0.25, 0.7, 3.6, createMaterial({ color: 0xeae5d9 }), 3, 3.45, -2, true);
  addBox(
    0.06,
    2.38,
    1.8,
    createMaterial({ color: 0xa9c5cf, transparent: true, opacity: 0.38 }),
    3.03,
    1.91,
    -1.1,
    true,
  );
  const winPane = addBox(
    0.08,
    2.38,
    1.8,
    createMaterial({ color: 0xa9c5cf, transparent: true, opacity: 0.48 }),
    2.95,
    1.91,
    -2.9,
    true,
  );
  const winCol = winPane.userData.col;
  if (winCol) {
    winCol.active = false;
  }
  winPane.position.z = -1.15;

  addBox(4.5, 3.8, 0.25, createMaterial({ color: 0xeae5d9 }), -6.7, 1.9, 4, true);
  addBox(4.5, 3.8, 0.25, createMaterial({ color: 0xeae5d9 }), 0.8, 1.9, 4, true);
  const doorGeo = new T.BoxGeometry(2.9, 2.8, 0.14);
  doorGeo.translate(1.45, 0, 0);
  const hallDoor = addMesh(
    doorGeo,
    createMaterial({
      map: tex.wood('#8c5e3a', '#633e22'),
    }),
    -4.4,
    1.4,
    4,
    true,
    true,
  );
  const doorCol = {
    minX: -4.4,
    maxX: -1.5,
    minZ: 3.93,
    maxZ: 4.07,
    minY: 0,
    maxY: 2.8,
    mesh: hallDoor,
    active: true,
  };
  colliders.push(doorCol);
  addBox(
    8.5,
    0.2,
    6,
    createMaterial({
      map: tex.tiles('#cfd4d1', '#c0c5c2', '#969b98', 4, 'hall_f'),
    }),
    -3,
    0.01,
    7,
    false,
    false,
    true,
  );
  addSign(
    2.2,
    1.1,
    tex.sign('教学楼一层大厅', '#e6dfd0', '#384a3c', '楼梯口 · 右转校医室', true),
    -7,
    1.8,
    4.15,
  );
  addBox(0.2, 3.8, 6.2, createMaterial({ color: 0xe5dfd3 }), -7.25, 1.9, 7, true);
  addBox(0.14, 2.5, 1.4, createMaterial({ color: 0x9dc2ae }), -7.12, 1.25, 7.0, true);
  addSign(
    1.6,
    0.72,
    tex.sign('校医室 · 走廊尽头右转', '#eef4ef', '#2f5440', '推门进走廊', true),
    -7.08,
    2.8,
    7.0,
    Math.PI / 2,
  );

  // Blackboard frame + crisp self-lit chalk writing surface so text reads cleanly
  addBox(
    4.2,
    1.5,
    0.12,
    createMaterial({
      color: 0x2b4a36,
      emissive: 0x14261a,
      emissiveIntensity: 0.35,
      roughness: 0.9,
    }),
    -3,
    2.0,
    -7.82,
    true,
    false,
    false,
  );
  const bbTex = tex.sign(
    '值日生：林小宇  周敏',
    '#2b4a36',
    '#eae6d8',
    '放学记得关东边窗户',
    true,
  );
  addMesh(
    new T.PlaneGeometry(3.8, 1.3),
    createMaterial({
      map: bbTex,
      emissive: 0xffffff,
      emissiveMap: bbTex,
      emissiveIntensity: 0.24,
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

  for (const dx of [-5.5, -3, -0.5]) {
    for (const dz of [-4.5, -1.5]) {
      addBox(
        0.95,
        0.72,
        0.55,
        createMaterial({
          map: tex.wood('#b88d5c', '#8a653c'),
        }),
        dx,
        0.36,
        dz,
        true,
      );
    }
  }
  addBox(
    1.8,
    0.85,
    0.7,
    createMaterial({ color: 0x3f3c3a, metalness: 0.5 }),
    6.5,
    0.43,
    -2,
    true,
  );
  addBox(
    1.5,
    0.08,
    0.5,
    createMaterial({
      color: 0xc94218,
      emissive: 0x9e2508,
      emissiveIntensity: 0.9,
    }),
    6.5,
    0.88,
    -2,
    false,
  );
  addSign(
    1.7,
    0.8,
    tex.sign('炭火烧烤', '#f4e6c3', '#a82c1a', '羊肉串 3元 · 烤面筋 2元', true),
    6.5,
    1.45,
    -2.4,
  );
  addBox(0.45, 0.38, 0.45, createMaterial({ color: 0x3a6fa8 }), 8.0, 0.19, -0.8, true);
  addBox(0.45, 0.38, 0.45, createMaterial({ color: 0xc94c38 }), 8.6, 0.19, -2.2, true);

  const smokes: { m: ReturnType<typeof addMesh>; p: number }[] = [];
  const sGeo = new T.DodecahedronGeometry(0.45, 0);
  const sMat = createMaterial({
    color: 0xdcdad4,
    transparent: true,
    opacity: 0.32,
    roughness: 1,
  });
  for (let i = 0; i < 22; i++) {
    smokes.push({
      m: addMesh(
        sGeo,
        sMat,
        6.5,
        1.1 + Math.random() * 1.8,
        -2 + (Math.random() - 0.5) * 1.2,
        false,
        false,
      ),
      p: Math.random(),
    });
  }
  let winClosed = false;
  let doorOpen = false;
  let fanOn = false;

  updaters.push((dt) => {
    smokes.forEach((s) => {
      s.p += dt * 0.24;
      if (s.p > 1) {
        s.p = 0;
      }
      const drift = winClosed ? 1.5 : fanOn ? 0.5 : -10.5;
      s.m.position.x = 6.5 + s.p * drift;
      s.m.position.y = 1.0 + Math.sin(s.p * 3.14) * 1.3 + s.p * 0.7;
      s.m.position.z = -2 + Math.sin(s.p * 7) * 0.45;
      const sc = 0.5 + s.p * 1.4;
      s.m.scale.set(sc, sc * 0.8, sc);
    });
    hallDoor.rotation.y +=
      ((doorOpen ? -Math.PI / 2 : 0) - hallDoor.rotation.y) * Math.min(1, dt * 6);
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
        winClosed
          ? '窗户咔哒扣紧，教室里飘着的烤串味慢慢散了。'
          : '窗扇滑开叠在一起，留出半扇窗洞刚好能翻过去。',
      );
    },
    {
      getLabel: () => (winClosed ? '推开教室东侧窗户' : '关紧教室东侧窗户'),
    },
  );
  addInteract('bbq_door', V(-2.95, 1.4, 4), '开关教室与大厅的门', '出入教室与门厅', () => {
    doorOpen = !doorOpen;
    sfx.play('door');
    showWhisper(
      doorOpen
        ? '推门走出教室，门厅右手边挂着校医室的小牌子。'
        : '带上门，教室里又只剩粉笔灰和隐约的孜然香。',
    );
  });
  addInteract('bbq_to_inf', V(-6.8, 1.4, 7.0), '推门去校医室', '进入小学医务室走廊', () => {
    const ii = sceneIdxById('infirmary');
    if (ii !== -1) {
      sfx.play('door');
      addTimedRedirect(() => {
        state.pendingSpawn = {
          pos: V(0, 1.65, 8.6),
          yaw: 0,
        };
        loadScene(ii);
        showWhisper('推门走进校医室走廊，空气里立刻闻见一股清凉的消毒水味。');
      }, 260);
    }
  });
  addInteract('bbq_fan', V(-3.0, 0.8, -7.4), '开启讲台边的立式风扇', '把烟往窗外吹', () => {
    fanOn = !fanOn;
    sfx.play('switch');
    showWhisper(
      fanOn
        ? '风扇嗡嗡转起来，把滞留的青烟往窗外推回去。'
        : '风扇停了，夕阳斜照进飘着灰尘的教室。',
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

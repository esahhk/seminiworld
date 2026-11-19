import type { SceneContext } from './sceneContext';
import type { SceneInitResult } from '../types/game';

export function buildZigzagScene(ctx: SceneContext): SceneInitResult {
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
    createMaterial,
    addInteract,
    addCollectible,
    updaters,
    showWhisper,
    setBounds,
    setHeightFn,
    setSurfaceFn,
  } = ctx;

  scene.background = new T.Color(0x1b1e23);
  scene.fog = new T.Fog(0x1b1e23, 18, 52);
  scene.add(new T.HemisphereLight(0x8894a0, 0x2b2e33, 0.45));
  scene.add(new T.AmbientLight(0x3a4047, 0.42));

  const skySpot = new T.SpotLight(0xfff9eb, 2.6, 28, 0.46, 0.55);
  skySpot.position.set(0, 14.5, -5.2);
  skySpot.target.position.set(0, 4.2, -5.2);
  skySpot.castShadow = true;
  scene.add(skySpot);
  scene.add(skySpot.target);

  const stepLightLow = new T.PointLight(0xa3b3c2, 0.55, 16);
  stepLightLow.position.set(-4.0, 3.5, 3.0);
  scene.add(stepLightLow);
  const stepLightHigh = new T.PointLight(0xa3b3c2, 0.55, 16);
  stepLightHigh.position.set(4.0, 9.2, 5.5);
  scene.add(stepLightHigh);

  const wallMat = createMaterial({
    map: tex.concrete('#4a4d52', 0.24, 'zig_wall'),
    roughness: 0.96,
  });
  const stoneTex = tex.concrete('#6e6b65', 0.2, 'zig_s');
  const stepMat = createMaterial({
    map: stoneTex,
    roughness: 0.9,
  });
  const edgeMat = createMaterial({
    color: 0x7e8791,
    emissive: 0x3b434d,
    emissiveIntensity: 0.55,
  });

  addBox(
    14.8,
    0.2,
    19.6,
    createMaterial({
      map: tex.concrete('#3a3d42', 0.22, 'zig_fl'),
    }),
    0,
    -0.1,
    1.5,
    true,
    false,
    true,
  );
  addBox(0.3, 14.2, 19.8, wallMat, -7.35, 7.0, 1.5, true);
  addBox(0.3, 14.2, 19.8, wallMat, 7.35, 7.0, 1.5, true);
  addBox(15.0, 14.2, 0.3, wallMat, 0, 7.0, -8.3, true);
  addBox(15.0, 14.2, 0.3, wallMat, 0, 7.0, 11.3, true);

  addBox(15.0, 0.3, 14.5, wallMat, 0, 13.8, 4.05, false);
  addBox(15.0, 0.3, 1.2, wallMat, 0, 13.8, -7.8, false);
  addBox(3.4, 0.3, 4.2, wallMat, -5.8, 13.8, -5.2, false);
  addBox(3.4, 0.3, 4.2, wallMat, 5.8, 13.8, -5.2, false);
  addBox(8.2, 0.35, 0.2, wallMat, 0, 13.9, -3.2, false);
  addBox(8.2, 0.35, 0.2, wallMat, 0, 13.9, -7.2, false);
  addMesh(
    new T.CylinderGeometry(2.5, 4.1, 9.5, 18, 1, true),
    createMaterial({
      color: 0xf6eed8,
      emissive: 0xd9ceb0,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.11,
      depthWrite: false,
      side: T.DoubleSide,
    }),
    0,
    8.95,
    -5.2,
    false,
    false,
  );

  addBox(5, 0.4, 5, stepMat, -4.0, 0.1, 8.0, false, true, true);
  for (let i = 0; i < 14; i++) {
    const sy = 0.15 + i * 0.29;
    const sz = 5.2 - i * 0.62;
    addBox(3.4, 0.3, 0.65, stepMat, -4.0, sy, sz, false, false, true);
    addBox(3.42, 0.03, 0.05, edgeMat, -4.0, sy + 0.16, sz + 0.31, false, false, false);
  }
  addBox(12.4, 4.2, 4.4, stepMat, 0, 2.1, -5.2, false, true, true);

  const railMat = createMaterial({
    color: 0x5c6268,
    metalness: 0.55,
    roughness: 0.5,
  });
  addBox(0.08, 0.9, 8.6, railMat, -2.25, 2.5, 1.0, true).rotation.x = 0.43;
  addBox(0.08, 0.9, 8.6, railMat, 2.25, 6.5, 1.0, true).rotation.x = -0.43;

  addBox(
    6.6,
    0.35,
    1.1,
    createMaterial({ color: 0x8c5a44, roughness: 0.9 }),
    0,
    4.3,
    -6.1,
    true,
  );
  addBox(
    6.3,
    0.15,
    0.9,
    createMaterial({ color: 0x423023, roughness: 1 }),
    0,
    4.48,
    -6.1,
    false,
  );
  addSign(
    1.4,
    0.75,
    tex.sign('一米花田', '#e8dfcc', '#3a5c3a', '之字形台阶 · 请勿踩踏', true),
    0,
    4.85,
    -6.72,
  );
  const flowers: { petal: ReturnType<typeof addMesh>; phase: number }[] = [];
  const fColors = [0xf0cf5b, 0xe87b70, 0xf5f2e6, 0xd685b8];
  const stemGeo = track(new T.CylinderGeometry(0.015, 0.015, 0.28, 5));
  const stemMat = createMaterial({ color: 0x4d7d3a });
  const petalGeo = track(new T.DodecahedronGeometry(0.075, 0));
  const petalMats = fColors.map((c) => createMaterial({ color: c, roughness: 0.7 }));
  for (let i = 0; i < 52; i++) {
    const fx = -3.0 + Math.random() * 6.0;
    const fz = -6.45 + Math.random() * 0.7;
    addMesh(stemGeo, stemMat, fx, 4.64, fz, false, false);
    flowers.push({
      petal: addMesh(petalGeo, petalMats[i % 4], fx, 4.8, fz, false, false),
      phase: Math.random() * 6,
    });
  }
  addBox(6.6, 0.16, 1.1, createMaterial({ color: 0x49535c }), 0, 4.28, -4.4, true);
  const glassTankMat = createMaterial({
    color: 0x8cc2d4,
    transparent: true,
    opacity: 0.28,
    roughness: 0.1,
  });
  addBox(6.6, 0.9, 0.06, glassTankMat, 0, 4.81, -3.88, true);
  addBox(6.6, 0.9, 0.06, glassTankMat, 0, 4.81, -4.92, true);
  addBox(0.06, 0.9, 1.1, glassTankMat, -3.27, 4.81, -4.4, true);
  addBox(0.06, 0.9, 1.1, glassTankMat, 3.27, 4.81, -4.4, true);
  addBox(
    6.46,
    0.72,
    0.96,
    createMaterial({
      color: 0x47b6cf,
      transparent: true,
      opacity: 0.42,
      roughness: 0.12,
    }),
    0,
    4.72,
    -4.4,
    false,
  );
  const tankTop = addMesh(
    new T.PlaneGeometry(6.46, 0.96),
    createMaterial({
      color: 0x72d8ed,
      transparent: true,
      opacity: 0.52,
      roughness: 0.08,
    }),
    0,
    5.09,
    -4.4,
    false,
    false,
  );
  tankTop.rotation.x = -Math.PI / 2;

  for (let i = 0; i < 14; i++) {
    const sy = 4.2 + i * 0.29;
    const sz = -2.86 + i * 0.62;
    addBox(3.4, 0.3, 0.65, stepMat, 4.0, sy, sz, false, false, true);
    addBox(3.42, 0.03, 0.05, edgeMat, 4.0, sy + 0.16, sz - 0.31, false, false, false);
  }
  addBox(5.5, 8.25, 5, stepMat, 4.0, 4.125, 7.8, false, true, true);
  addBox(
    1.5,
    0.45,
    0.6,
    createMaterial({
      map: tex.wood('#8c6540', '#634326'),
    }),
    4.6,
    8.45,
    9.1,
    true,
  );
  addCylinder(0.14, 0.16, 0.3, 8, createMaterial({ color: 0x4c8a62 }), -4.2, 4.35, -5.6);

  let watered = false;
  let ripple = 0;
  updaters.push((dt, t) => {
    flowers.forEach((f) => {
      f.petal.scale.setScalar(watered ? 1.25 : 0.92);
      f.petal.position.x += Math.sin(t * 2 + f.phase) * 0.0006;
    });
    ripple = Math.max(0, ripple - dt * 0.8);
    tankTop.position.y = 5.09 + Math.sin(t * (2.5 + ripple * 10)) * (0.008 + ripple * 0.028);
  });

  const zigHeight = (x: number, z: number, standingY = 0) => {
    if (x >= 1.25 && x <= 6.75 && z >= 5.3 && z <= 10.3 && standingY >= 7.5) {
      return 8.25;
    }
    if (x >= 2.3 && x <= 5.7 && z >= -3.185 && z < 5.3 && standingY >= 3.8) {
      const t = Math.min(1, Math.max(0, (z + 3.185) / 8.485));
      const h = 4.2 + t * 4.05;
      if (h <= standingY + 0.65) {
        return h;
      }
    }
    if (x >= -6.2 && x <= 6.2 && z >= -7.4 && z <= -3.0 && standingY >= 3.5) {
      return 4.2;
    }
    if (x >= -5.7 && x <= -2.3 && z >= -3.185 && z <= 5.525) {
      const t = Math.min(1, Math.max(0, (5.525 - z) / 8.71));
      const h = 0.3 + t * 3.9;
      if (h <= standingY + 0.65) {
        return h;
      }
    }
    if (x >= -6.5 && x <= -1.5 && z > 5.5 && z <= 10.5 && standingY < 1.5) {
      return 0.3;
    }
    return 0;
  };
  setHeightFn(zigHeight);

  addInteract('zig_flower', V(0, 4.7, -6.1), '给一米花田浇水', '天窗光柱正下方的花田', () => {
    watered = true;
    sfx.play('splash');
    showWhisper('水珠滚过花瓣，整条花田正好接住天窗斜照下来的一束光。');
  });
  addInteract(
    'zig_tank',
    V(0, 4.8, -4.4),
    '轻敲等长空水族箱玻璃',
    '里面什么也没有，只有晃动的清水',
    () => {
      ripple = 1;
      sfx.play('splash');
      showWhisper('咚咚两声，天窗光穿进六米长的清水箱里，水面起了层细皱。');
    },
  );
  addInteract(
    'zig_bench',
    V(4.6, 8.5, 9.1),
    '在顶层长椅歇脚',
    '俯瞰幽暗台阶和中央那道光柱',
    () => {
      sfx.play('wood');
      showWhisper('八米多高的顶层反倒背光，只有中层平台的花田和水箱亮得清清楚楚。');
    },
  );

  addCollectible('zigzag', -2.8, 4.72, -6.1, 0xf2e394);
  setBounds({ minX: -6.5, maxX: 6.7, minZ: -7.4, maxZ: 10.3 });
  setSurfaceFn((x, z, standingY = 0) =>
    zigHeight(x, z, standingY) > 0.1 ? 'stone' : 'concrete',
  );

  return {
    pos: V(-4.0, 1.95, 8.8),
    yaw: 0,
    whisper: '整座之字形石阶包在暗灰水泥墙里，只有正中天窗打下一道光柱照着花田和水箱。',
  };
}

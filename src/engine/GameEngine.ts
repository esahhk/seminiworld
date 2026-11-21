import * as THREE from 'three/webgpu';
import { SoundFX } from '../audio/soundFx';
import { SCENES_META, sceneIdxById } from '../data/scenesMeta';
import { SCENE_BUILDERS } from '../scenes';
import { buildMiniatureCityScene } from '../scenes/city';
import type { RoadSpawnCandidate, SceneContext } from '../scenes/sceneContext';
import type {
  Bounds,
  Collider,
  EngineCallbacks,
  GameEngineHandle,
  Interactable,
  PerfMode,
  PlayerState,
  SceneId,
  SharedGameState,
  SurfaceType,
} from '../types/game';
import { computeMovementDelta, resolveMove, selectBestInteractable } from './physics';
import { createTexCache, type TexCache } from './texCache';
import { buildBoxTruckModel, type BoxTruckRig } from './truckModel';
import {
  createTruckState,
  findTruckSummonPose,
  stepTruckPhysics,
  type TruckState,
} from './vehiclePhysics';

export interface GameEngineInitOptions {
  glCanvas: HTMLCanvasElement;
  minimapCanvas: HTMLCanvasElement | null;
  state: SharedGameState;
  callbacksRef: { current: EngineCallbacks };
  isTouchActive: () => boolean;
}

function detectSoftwareWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) {
      return false;
    }
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const name = dbg
      ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '')
      : '';
    const isSoft = /SwiftShader|llvmpipe|Software|ANGLE \(.*SwiftShader/i.test(name);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return isSoft;
  } catch {
    return false;
  }
}

function buildStudioEnvironment(): THREE.Scene {
  const env = new THREE.Scene();
  env.position.y = -3.5;

  const geometry = new THREE.BoxGeometry();
  geometry.deleteAttribute('uv');

  const roomMaterial = new THREE.MeshStandardMaterial({ side: THREE.BackSide });
  const boxMaterial = new THREE.MeshStandardMaterial();

  const mainLight = new THREE.PointLight(0xffffff, 900, 28, 2);
  mainLight.position.set(0.418, 16.199, 0.3);
  env.add(mainLight);

  const room = new THREE.Mesh(geometry, roomMaterial);
  room.position.set(-0.757, 13.219, 0.717);
  room.scale.set(31.713, 28.305, 28.591);
  env.add(room);

  const boxes = new THREE.InstancedMesh(geometry, boxMaterial, 6);
  const transform = new THREE.Object3D();
  const boxSpecs: [number, number, number, number, number, number, number, number, number][] = [
    [-10.906, 2.009, 1.846, 0, -0.195, 0, 2.328, 7.905, 4.651],
    [-5.607, -0.754, -0.758, 0, 0.994, 0, 1.97, 1.534, 3.955],
    [6.167, 0.857, 7.803, 0, 0.561, 0, 3.927, 6.285, 3.687],
    [-2.017, 0.018, 6.124, 0, 0.333, 0, 2.002, 4.566, 2.064],
    [2.291, -0.756, -2.621, 0, -0.286, 0, 1.546, 1.552, 1.496],
    [-2.193, -0.369, -5.547, 0, 0.516, 0, 3.875, 3.487, 2.986],
  ];
  boxSpecs.forEach(([px, py, pz, rx, ry, rz, sx, sy, sz], i) => {
    transform.position.set(px, py, pz);
    transform.rotation.set(rx, ry, rz);
    transform.scale.set(sx, sy, sz);
    transform.updateMatrix();
    boxes.setMatrixAt(i, transform.matrix);
  });
  env.add(boxes);

  const areaSpecs: [number, number, number, number, number, number, number][] = [
    [-16.116, 14.37, 8.208, 0.1, 2.428, 2.739, 50],
    [-16.109, 18.021, -8.207, 0.1, 2.425, 2.751, 50],
    [14.904, 12.198, -1.832, 0.15, 4.265, 6.331, 17],
    [-0.462, 8.89, 14.52, 4.38, 5.441, 0.088, 43],
    [3.235, 11.486, -12.541, 2.5, 2.0, 0.1, 20],
    [0.0, 20.0, 0.0, 1.0, 0.1, 1.0, 100],
  ];
  for (const [px, py, pz, sx, sy, sz, intensity] of areaSpecs) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0xffffff,
      emissiveIntensity: intensity,
      roughness: 1,
    });
    const panel = new THREE.Mesh(geometry, mat);
    panel.position.set(px, py, pz);
    panel.scale.set(sx, sy, sz);
    env.add(panel);
  }
  return env;
}

function disposeEnvScene(env: THREE.Scene): void {
  const resources = new Set<THREE.BufferGeometry | THREE.Material>();
  env.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      resources.add(mesh.geometry);
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => resources.add(m));
      } else if (mesh.material) {
        resources.add(mesh.material);
      }
    }
  });
  resources.forEach((r) => r.dispose());
}

export function createGameEngine(opts: GameEngineInitOptions): GameEngineHandle | null {
  const { glCanvas, minimapCanvas, state, callbacksRef, isTouchActive } = opts;

  const isSoftwareGl = detectSoftwareWebGL();

  function applyRendererConfig(r: THREE.WebGPURenderer): void {
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.02;
    r.shadowMap.enabled = !isSoftwareGl && state.perf === 'high';
    r.shadowMap.type = THREE.PCFShadowMap;
  }

  let renderer: THREE.WebGPURenderer;
  try {
    renderer = new THREE.WebGPURenderer({
      canvas: glCanvas,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    callbacksRef.current.onWebGLFailed('无法初始化 WebGPU/WebGL2 3D 渲染器：' + msg);
    return null;
  }

  applyRendererConfig(renderer);

  const scene = new THREE.Scene();
  scene.environmentIntensity = 0.58;
  let envTex: THREE.Texture | null = null;

  const camera = new THREE.PerspectiveCamera(
    state.fov,
    window.innerWidth / window.innerHeight,
    0.1,
    220,
  );
  const sfx = new SoundFX();
  sfx.setAudioOn(state.audioOn);
  let tex: TexCache | null = null;
  let ready = false;

  const player: PlayerState = {
    pos: new THREE.Vector3(0, 1.65, 5),
    vel: new THREE.Vector3(),
    yaw: 0,
    pitch: 0,
    onGround: true,
    height: 1.65,
  };

  let colliders: Collider[] = [];
  let roadCenters: RoadSpawnCandidate[] = [];
  let interactables: Interactable[] = [];
  let updaters: ((dt: number, t: number) => void)[] = [];
  const trackedResources = new Set<THREE.BufferGeometry | THREE.Material | THREE.Texture>();
  let activeIntervals: number[] = [];
  let activeTimeouts: number[] = [];
  let sitTimer: number | null = null;

  let bounds: Bounds = { minX: -12, maxX: 12, minZ: -12, maxZ: 12 };
  let heightFn: (x: number, z: number, standingY?: number) => number = () => 0;
  let surfaceFn: (x: number, z: number, standingY?: number) => SurfaceType = () => 'concrete';

  let truckState: TruckState | null = null;
  let truckRig: BoxTruckRig | null = null;
  let truckBoardInter: Interactable | null = null;
  let driving = false;
  let chaseYawOff = 0;
  let chasePitchOff = 0.24;
  let lastVehEmitMs = 0;
  let handbrakeHeld = false;

  let targetInter: Interactable | null = null;
  let lastPromptHit = false;
  let lastPromptText = '';
  let lastInteractTime = 0;
  let alive = true;
  let stepAcc = 0;
  let lastMapMs = 0;
  let loaderHidden = false;
  let rafId = 0;
  let pollTimerId = 0;

  const joyVec = { x: 0, y: 0 };
  const keys: Record<string, boolean> = {};
  let pointerLocked = false;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let lookTouchId: number | null = null;
  let lookLX = 0;
  let lookLY = 0;

  const _lookEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  const _lookDir = new THREE.Vector3();
  const _chaseCamPos = new THREE.Vector3();
  const _chaseDesired = new THREE.Vector3();
  const _chaseLookTarget = new THREE.Vector3();

  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

  function track<G extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(obj: G): G {
    trackedResources.add(obj);
    return obj;
  }

  function createMaterial(mOpts: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial {
    return track(new THREE.MeshStandardMaterial(mOpts));
  }

  function mkMesh(
    geo: THREE.BufferGeometry,
    m: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
    cast = true,
    recv = true,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(track(geo), track(m));
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = recv;
    return mesh;
  }

  function addMesh(
    geo: THREE.BufferGeometry,
    m: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
    cast = true,
    recv = true,
  ): THREE.Mesh {
    const mesh = mkMesh(geo, m, x, y, z, cast, recv);
    scene.add(mesh);
    return mesh;
  }

  function addBox(
    w: number,
    h: number,
    d: number,
    m: THREE.Material,
    x: number,
    y: number,
    z: number,
    solid = false,
    cast = true,
    recv = true,
  ): THREE.Mesh {
    const mesh = addMesh(new THREE.BoxGeometry(w, h, d), m, x, y, z, cast, recv);
    if (solid) {
      const col: Collider = {
        minX: x - w / 2,
        maxX: x + w / 2,
        minZ: z - d / 2,
        maxZ: z + d / 2,
        minY: y - h / 2,
        maxY: y + h / 2,
        mesh,
        active: true,
      };
      mesh.userData.col = col;
      colliders.push(col);
    }
    return mesh;
  }

  function addCylinder(
    rt: number,
    rb: number,
    h: number,
    seg: number,
    m: THREE.Material,
    x: number,
    y: number,
    z: number,
    cast = true,
    recv = true,
  ): THREE.Mesh {
    return addMesh(new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y, z, cast, recv);
  }

  function addSign(
    w: number,
    h: number,
    texMap: THREE.Texture,
    x: number,
    y: number,
    z: number,
    ry = 0,
    rx = 0,
  ): THREE.Mesh {
    const m = createMaterial({
      map: texMap,
      roughness: 0.65,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
    const mesh = addMesh(new THREE.PlaneGeometry(w, h), m, x, y, z, false, false);
    mesh.rotation.y = ry;
    if (rx) {
      mesh.rotation.x = rx;
    }
    return mesh;
  }

  function syncColX(mesh: THREE.Mesh, halfW: number): void {
    const c = mesh.userData.col as Collider | undefined;
    if (c) {
      c.minX = mesh.position.x - halfW;
      c.maxX = mesh.position.x + halfW;
    }
  }

  function syncColZ(mesh: THREE.Mesh, halfD: number): void {
    const c = mesh.userData.col as Collider | undefined;
    if (c) {
      c.minZ = mesh.position.z - halfD;
      c.maxZ = mesh.position.z + halfD;
    }
  }

  function addTimedRedirect(fn: () => void, ms: number): number {
    const id = window.setTimeout(() => {
      const idx = activeTimeouts.indexOf(id);
      if (idx !== -1) {
        activeTimeouts.splice(idx, 1);
      }
      fn();
    }, ms);
    activeTimeouts.push(id);
    return id;
  }

  function restoreHover(it: Interactable | null): void {
    if (!it || !it.mesh) {
      return;
    }
    const m = it.mesh.material as THREE.MeshStandardMaterial;
    if (m && 'emissiveIntensity' in m && it.mesh.userData._origEm !== undefined) {
      m.emissiveIntensity = it.mesh.userData._origEm as number;
    }
    if (m && m.emissive && it.mesh.userData._origEmColor !== undefined) {
      m.emissive.setHex(it.mesh.userData._origEmColor as number);
    }
    if (it.mesh.userData._origScale) {
      it.mesh.scale.copy(it.mesh.userData._origScale as THREE.Vector3);
    }
  }

  function emitPrompt(hit: boolean, text: string): void {
    if (hit !== lastPromptHit || text !== lastPromptText) {
      lastPromptHit = hit;
      lastPromptText = text;
      callbacksRef.current.onPromptChange(hit, text);
    }
  }

  function emitVehicleState(force = false): void {
    const now = performance.now();
    if (!force && now - lastVehEmitMs < 110) {
      return;
    }
    lastVehEmitMs = now;
    const speed = truckState ? truckState.speed : 0;
    const speedKmh = Math.round(Math.abs(speed) * 3.6);
    const gear: 'P' | 'D' | 'R' = !driving
      ? 'P'
      : speed < -0.15
        ? 'R'
        : 'D';
    callbacksRef.current.onVehicleState({
      inCity: state.inCity,
      summoned: truckState !== null,
      driving,
      speedKmh,
      gear,
    });
  }

  function clearHover(): void {
    if (targetInter) {
      restoreHover(targetInter);
      targetInter = null;
    }
    emitPrompt(false, '');
  }

  function addInteract(
    id: string,
    pos: THREE.Vector3,
    label: string,
    hint: string,
    onInteract: () => void,
    iOpts: {
      radius?: number;
      mesh?: THREE.Mesh | null;
      getLabel?: (() => string) | null;
      getHint?: (() => string) | null;
    } = {},
  ): Interactable {
    const obj: Interactable = {
      id,
      pos,
      radius: iOpts.radius ?? 2.6,
      label,
      hint,
      getLabel: iOpts.getLabel ?? null,
      getHint: iOpts.getHint ?? null,
      onInteract,
      mesh: iOpts.mesh ?? null,
    };
    interactables.push(obj);
    return obj;
  }

  function addCollectible(
    id: SceneId,
    x: number,
    y: number,
    z: number,
    color = 0xe8d5a8,
  ): Interactable | null {
    if (state.collected.has(id)) {
      return null;
    }
    const meta = SCENES_META.find((m) => m.id === id);
    if (!meta) {
      return null;
    }
    const mesh = addMesh(
      new THREE.OctahedronGeometry(0.18, 0),
      createMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.35,
        roughness: 0.25,
        metalness: 0.3,
      }),
      x,
      y,
      z,
      false,
      false,
    );
    updaters.push((dt, t) => {
      if (mesh.parent) {
        mesh.rotation.y += dt * 1.3;
        mesh.position.y = y + Math.sin(t * 2.2) * 0.06;
      }
    });
    const inter = addInteract(
      'col_' + id,
      V(x, y, z),
      '拾取 · ' + meta.item,
      '旧物拾遗',
      () => {
        if (state.collected.has(id)) {
          return;
        }
        state.collected.add(id);
        scene.remove(mesh);
        const i = interactables.indexOf(inter);
        if (i !== -1) {
          interactables.splice(i, 1);
        }
        if (targetInter === inter) {
          targetInter = null;
        }
        sfx.play('collect');
        callbacksRef.current.onCollect(id, meta.item, meta.desc);
        emitPrompt(false, '');
      },
      { radius: 2.3, mesh },
    );
    return inter;
  }

  function clearSitTimer(): void {
    if (sitTimer !== null) {
      window.clearTimeout(sitTimer);
      sitTimer = null;
    }
  }

  function setSitTimer(cb: () => void, ms: number): void {
    clearSitTimer();
    sitTimer = window.setTimeout(() => {
      sitTimer = null;
      cb();
    }, ms);
  }

  function clearScene(): void {
    clearHover();
    for (let i = scene.children.length - 1; i >= 0; i--) {
      scene.remove(scene.children[i]);
    }
    trackedResources.forEach((r) => {
      try {
        r.dispose();
      } catch {
      }
    });
    trackedResources.clear();
    activeIntervals.forEach((id) => window.clearInterval(id));
    activeIntervals = [];
    activeTimeouts.forEach((id) => window.clearTimeout(id));
    activeTimeouts = [];
    clearSitTimer();
    player.height = 1.65;
    colliders = [];
    roadCenters = [];
    interactables = [];
    updaters = [];
    truckState = null;
    truckRig = null;
    truckBoardInter = null;
    driving = false;
    handbrakeHeld = false;
    state.zoomActive = false;
  }

  function setupShadows(wideCity = false): void {
    if (isSoftwareGl || state.perf === 'fast') {
      return;
    }
    const isSmallScreen = window.innerWidth <= 900;
    const shadowRes = isSmallScreen ? 1024 : 2048;
    scene.traverse((obj) => {
      const light = obj as THREE.DirectionalLight;
      if (light.isDirectionalLight && light.castShadow) {
        light.shadow.mapSize.set(shadowRes, shadowRes);
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = wideCity ? 145 : 65;
        const d = wideCity ? 52 : 16;
        light.shadow.camera.left = -d;
        light.shadow.camera.right = d;
        light.shadow.camera.top = d;
        light.shadow.camera.bottom = -d;
        light.shadow.bias = -0.0004;
        light.shadow.normalBias = 0.025;
      }
      const spot = obj as THREE.SpotLight;
      if (spot.isSpotLight && spot.castShadow) {
        spot.shadow.mapSize.set(1024, 1024);
        spot.shadow.bias = -0.0004;
        spot.shadow.normalBias = 0.02;
      }
    });
  }

  function createSceneContext(activeTex: TexCache): SceneContext {
    return {
      T: THREE,
      scene,
      camera,
      player,
      state,
      tex: activeTex,
      sfx,
      V,
      track,
      mkMesh,
      addMesh,
      addBox,
      addCylinder,
      addSign,
      syncColX,
      syncColZ,
      createMaterial,
      addInteract,
      addCollectible,
      addTimedRedirect,
      activeIntervals,
      updaters,
      colliders,
      roadCenters,
      sceneIdxById,
      loadScene,
      enterCityHub,
      showWhisper: (txt, dur) => callbacksRef.current.onWhisper(txt, dur),
      openModal: (title, body, actions, mOpts) =>
        callbacksRef.current.onOpenModal(title, body, actions, mOpts),
      updateModalText: (title, body, mMeta, prog) =>
        callbacksRef.current.onUpdateModalText(title, body, mMeta, prog),
      closeModal: () => callbacksRef.current.onCloseModal(),
      openBook: (key) => callbacksRef.current.onOpenBook(key),
      setBounds: (b) => {
        bounds = b;
      },
      setHeightFn: (fn) => {
        heightFn = fn;
      },
      getHeight: (x, z, standingY = 0) => heightFn(x, z, standingY),
      setSurfaceFn: (fn) => {
        surfaceFn = fn;
      },
      setSitTimer,
      clearSitTimer,
    };
  }

  function applyTruckVisuals(): void {
    if (!truckState || !truckRig) {
      return;
    }
    truckRig.group.position.set(truckState.x, truckState.y, truckState.z);
    truckRig.group.rotation.y = truckState.yaw;
    truckRig.cabPivot.rotation.x = truckState.pitch;
    truckRig.cabPivot.rotation.z = truckState.roll;
    truckRig.frontSteerL.rotation.y = truckState.steerAngle;
    truckRig.frontSteerR.rotation.y = truckState.steerAngle;
    for (const ws of truckRig.wheelSpins) {
      ws.rotation.x = -truckState.wheelSpin;
    }
    const brakeIntensity = truckState.braking ? 1.8 : 0.35;
    for (const bm of truckRig.brakeMats) {
      bm.emissiveIntensity = brakeIntensity;
    }
    const revIntensity = truckState.reversing ? 1.6 : 0.08;
    for (const rm of truckRig.reverseMats) {
      rm.emissiveIntensity = revIntensity;
    }
    truckRig.headSpot.intensity = driving ? 2.4 : 0.7;
    truckRig.headLampMat.emissiveIntensity = driving ? 1.35 : 0.55;
    if (truckBoardInter) {
      const fx = -Math.sin(truckState.yaw);
      const fz = -Math.cos(truckState.yaw);
      truckBoardInter.pos.set(truckState.x + fx * 1.4, 1.4, truckState.z + fz * 1.4);
    }
  }

  function summonTruck(): void {
    if (!ready || !tex || !alive) {
      return;
    }
    if (!state.inCity) {
      enterCityHub();
    }
    const pose = findTruckSummonPose(
      player.pos.x,
      player.pos.z,
      player.yaw,
      bounds,
      colliders,
      roadCenters,
    );
    if (!truckRig) {
      truckRig = buildBoxTruckModel(track, tex);
      const shMat = createMaterial({
        color: 0x050709,
        transparent: true,
        opacity: 0.42,
        roughness: 1,
        depthWrite: false,
      });
      const shPlane = new THREE.Mesh(track(new THREE.PlaneGeometry(2.9, 6.5)), shMat);
      shPlane.rotation.x = -Math.PI / 2;
      shPlane.position.set(0, 0.025, 0);
      truckRig.group.add(shPlane);
      scene.add(truckRig.group);
    }
    truckState = createTruckState(pose.x, pose.z, pose.yaw);
    if (!truckBoardInter) {
      truckBoardInter = addInteract(
        'city_truck_board',
        V(pose.x, 1.4, pose.z),
        '驾驶厢式卡车',
        '载具代步 · H鸣笛',
        () => {
          toggleDrive();
        },
        { radius: 3.8 },
      );
    }
    applyTruckVisuals();
    sfx.play('ignition');
    callbacksRef.current.onWhisper('厢式卡车已驶抵路旁！靠近车头按 [E] 或点击「上车驾驶」。', 3800);
    emitVehicleState(true);
  }

  function toggleDrive(): void {
    if (!state.inCity) {
      return;
    }
    if (!truckState || !truckRig) {
      summonTruck();
    }
    if (!truckState) {
      return;
    }
    if (!driving) {
      driving = true;
      chaseYawOff = 0;
      chasePitchOff = 0.24;
      _chaseCamPos.set(
        truckState.x + Math.sin(truckState.yaw) * 9.2,
        4.9,
        truckState.z + Math.cos(truckState.yaw) * 9.2,
      );
      clearHover();
      sfx.play('ignition');
      callbacksRef.current.onWhisper(
        '已进入驾驶室：W/S 油门倒车 · A/D 转向 · 空格手刹 · H 鸣笛 · E 下车',
        4200,
      );
    } else {
      driving = false;
      handbrakeHeld = false;
      truckState.speed *= 0.15;
      const sideX = -Math.cos(truckState.yaw) * 2.2;
      const sideZ = Math.sin(truckState.yaw) * 2.2;
      const [ex, ez] = resolveMove(
        truckState.x + sideX,
        truckState.z + sideZ,
        1.65,
        1.65,
        bounds,
        colliders,
      );
      player.pos.set(ex, heightFn(ex, ez, 0) + 1.65, ez);
      player.yaw = truckState.yaw;
      player.pitch = 0;
      player.vel.set(0, 0, 0);
      camera.fov = state.fov;
      camera.updateProjectionMatrix();
      sfx.play('door');
      callbacksRef.current.onWhisper('已下车，走入身旁建筑光环可按 [E] 进入场景。', 3200);
    }
    applyTruckVisuals();
    emitVehicleState(true);
  }

  function honkTruck(): void {
    if (!state.inCity || !truckState) {
      return;
    }
    sfx.resume();
    sfx.play('horn');
  }

  function loadScene(idx: number): void {
    if (!ready || !tex || !alive) {
      return;
    }
    const total = SCENES_META.length;
    state.sceneIdx = ((idx % total) + total) % total;
    state.inCity = false;
    callbacksRef.current.onCloseModal();
    callbacksRef.current.onClosePanels();

    const meta = SCENES_META[state.sceneIdx];
    clearScene();
    const ctx = createSceneContext(tex);

    heightFn = () => 0;
    surfaceFn = () => 'concrete';
    bounds = { minX: -12, maxX: 12, minZ: -12, maxZ: 12 };

    let info;
    try {
      const builder = SCENE_BUILDERS[meta.id];
      info = builder(ctx);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      dispose();
      callbacksRef.current.onWebGLFailed('场景构建失败：' + msg);
      return;
    }

    setupShadows(false);
    if (state.pendingSpawn) {
      player.pos.copy(state.pendingSpawn.pos);
      player.yaw = state.pendingSpawn.yaw;
      state.pendingSpawn = null;
    } else {
      player.pos.copy(info.pos);
      player.yaw = info.yaw || 0;
    }
    player.vel.set(0, 0, 0);
    player.pitch = 0;
    camera.fov = state.fov;
    camera.updateProjectionMatrix();
    if (!isSoftwareGl && renderer.initialized) {
      void renderer.compileAsync(scene, camera).catch(() => {});
    }
    sfx.setAmbient(meta.id);
    callbacksRef.current.onSceneLoaded(state.sceneIdx, meta.name, info.whisper, false);
    emitVehicleState(true);
  }

  function enterCityHub(focusSceneId?: SceneId): void {
    if (!ready || !tex || !alive) {
      return;
    }
    state.inCity = true;
    callbacksRef.current.onCloseModal();
    callbacksRef.current.onClosePanels();
    clearScene();
    const ctx = createSceneContext(tex);

    heightFn = () => 0;
    surfaceFn = () => 'concrete';
    bounds = { minX: -64, maxX: 64, minZ: -64, maxZ: 64 };

    let info;
    try {
      info = buildMiniatureCityScene(ctx);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      dispose();
      callbacksRef.current.onWebGLFailed('微缩城市构建失败：' + msg);
      return;
    }

    setupShadows(true);
    void focusSceneId;
    player.pos.copy(info.pos);
    player.yaw = info.yaw || 0;
    player.vel.set(0, 0, 0);
    player.pitch = 0;
    camera.fov = state.fov;
    camera.updateProjectionMatrix();
    if (!isSoftwareGl && renderer.initialized) {
      void renderer.compileAsync(scene, camera).catch(() => {});
    }
    sfx.setAmbient('city');
    sfx.play('switch');
    callbacksRef.current.onSceneLoaded(state.sceneIdx, '微缩城市', info.whisper, true);
    emitVehicleState(true);
  }

  function resetTouch(): void {
    lookTouchId = null;
    dragging = false;
    handbrakeHeld = false;
    joyVec.x = 0;
    joyVec.y = 0;
  }

  function triggerInteract(): void {
    if (state.paused) {
      return;
    }
    const now = performance.now();
    if (now - lastInteractTime < 300) {
      return;
    }
    lastInteractTime = now;
    if (driving) {
      toggleDrive();
      return;
    }
    if (targetInter) {
      targetInter.onInteract();
    }
  }

  function doJump(): void {
    if (state.paused) {
      return;
    }
    if (driving) {
      handbrakeHeld = true;
      window.setTimeout(() => {
        handbrakeHeld = false;
      }, 280);
      return;
    }
    if (sitTimer !== null) {
      clearSitTimer();
      player.height = 1.65;
      player.pos.y = Math.max(
        player.pos.y,
        heightFn(player.pos.x, player.pos.z, player.pos.y - 1.65) + 1.65,
      );
    }
    if (player.onGround) {
      player.vel.y = 5.4;
      player.onGround = false;
    }
  }

  const onKeyDown = (e: KeyboardEvent) => {
    callbacksRef.current.onTouchDetected(false);
    keys[e.code] = true;
    if (e.code === 'Escape') {
      if (state.paused) {
        callbacksRef.current.onCloseModal();
        callbacksRef.current.onClosePanels();
      } else if (state.immersive) {
        callbacksRef.current.onExitImmersive();
      }
      return;
    }
    if (state.paused) {
      return;
    }
    if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      if (!e.repeat) {
        callbacksRef.current.onToggleImmersive();
      }
      return;
    }
    if ((e.code === 'KeyE' || e.code === 'Enter') && !e.repeat) {
      triggerInteract();
    }
    if (e.code === 'KeyG' && !e.repeat && state.inCity) {
      e.preventDefault();
      summonTruck();
    }
    if (e.code === 'KeyH' && !e.repeat && state.inCity && truckState) {
      e.preventDefault();
      honkTruck();
    }
    if (e.code === 'Space') {
      e.preventDefault();
      if (!e.repeat) {
        const active = document.activeElement as HTMLElement | null;
        if (active && typeof active.blur === 'function') {
          active.blur();
        }
        if (!driving) {
          doJump();
        }
      }
    }
    if (e.code === 'BracketLeft' && !e.repeat) {
      loadScene(state.sceneIdx - 1);
    }
    if (e.code === 'BracketRight' && !e.repeat) {
      loadScene(state.sceneIdx + 1);
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    keys[e.code] = false;
  };

  const onBlur = () => {
    for (const k in keys) {
      keys[k] = false;
    }
    resetTouch();
  };

  const onMouseDown = (e: MouseEvent) => {
    if (state.paused) {
      return;
    }
    callbacksRef.current.onTouchDetected(false);
    sfx.resume();
    if (e.button === 0) {
      if (!pointerLocked) {
        if (glCanvas.requestPointerLock) {
          try {
            const p = glCanvas.requestPointerLock() as unknown as Promise<void> | undefined;
            if (p && typeof p.catch === 'function') {
              p.catch(() => {});
            }
          } catch {
          }
        }
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
      } else {
        triggerInteract();
      }
    }
  };

  const onMouseUp = () => {
    dragging = false;
  };

  const onMouseMove = (e: MouseEvent) => {
    if (state.paused) {
      return;
    }
    let dx = 0;
    let dy = 0;
    if (pointerLocked) {
      dx = e.movementX * 0.0022;
      dy = e.movementY * 0.0022;
    } else if (dragging) {
      dx = (e.clientX - lastX) * 0.004;
      dy = (e.clientY - lastY) * 0.004;
      lastX = e.clientX;
      lastY = e.clientY;
    } else {
      return;
    }
    if (driving) {
      chaseYawOff = Math.max(-2.2, Math.min(2.2, chaseYawOff - dx));
      chasePitchOff = Math.max(-0.2, Math.min(0.7, chasePitchOff + dy * 0.6));
    } else {
      player.yaw -= dx;
      player.pitch = Math.max(-1.35, Math.min(1.35, player.pitch - dy));
    }
  };

  const onPtrChange = () => {
    pointerLocked = document.pointerLockElement === glCanvas;
  };

  const onPtrErr = () => {
    callbacksRef.current.onWhisper('视角锁定被浏览器拒绝，可继续按住鼠标左键拖动环视。');
  };

  const onCTouchStart = (e: TouchEvent) => {
    callbacksRef.current.onTouchDetected(true);
    if (e.target !== glCanvas || state.paused) {
      return;
    }
    sfx.resume();
    if (lookTouchId !== null) {
      let stillAlive = false;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === lookTouchId) {
          stillAlive = true;
          break;
        }
      }
      if (!stillAlive) {
        lookTouchId = null;
      }
    }
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (lookTouchId === null) {
        lookTouchId = t.identifier;
        lookLX = t.clientX;
        lookLY = t.clientY;
      }
    }
  };

  const onCTouchMove = (e: TouchEvent) => {
    if (e.target !== glCanvas || state.paused) {
      return;
    }
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === lookTouchId) {
        const dx = (t.clientX - lookLX) * 0.0055;
        const dy = (t.clientY - lookLY) * 0.0055;
        lookLX = t.clientX;
        lookLY = t.clientY;
        if (driving) {
          chaseYawOff = Math.max(-2.2, Math.min(2.2, chaseYawOff - dx));
          chasePitchOff = Math.max(-0.2, Math.min(0.7, chasePitchOff + dy * 0.6));
        } else {
          player.yaw -= dx;
          player.pitch = Math.max(-1.35, Math.min(1.35, player.pitch - dy));
        }
      }
    }
  };

  const onCTouchEnd = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === lookTouchId) {
        lookTouchId = null;
      }
    }
  };

  function resize(): void {
    const maxDpr = window.innerWidth <= 900 ? 1.5 : 2;
    const pr = isSoftwareGl
      ? 1
      : Math.min(window.devicePixelRatio || 1, maxDpr) * state.resScale;
    renderer.setPixelRatio(pr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  const mq = window.matchMedia
    ? window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    : null;

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  glCanvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('mousemove', onMouseMove);
  document.addEventListener('pointerlockchange', onPtrChange);
  document.addEventListener('pointerlockerror', onPtrErr);
  glCanvas.addEventListener('touchstart', onCTouchStart, { passive: true });
  glCanvas.addEventListener('touchmove', onCTouchMove, { passive: true });
  window.addEventListener('touchend', onCTouchEnd);
  window.addEventListener('touchcancel', onCTouchEnd);
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  mq?.addEventListener('change', resize);
  resize();

  function findInteractable(): void {
    _lookEuler.set(player.pitch, player.yaw, 0, 'YXZ');
    _lookDir.set(0, 0, -1).applyEuler(_lookEuler);

    const best = selectBestInteractable(interactables, player.pos, _lookDir);
    if (targetInter && targetInter !== best) {
      restoreHover(targetInter);
    }
    targetInter = best;

    if (best) {
      if (best.mesh) {
        const m = best.mesh.material as THREE.MeshStandardMaterial;
        if (m && 'emissiveIntensity' in m) {
          if (best.mesh.userData._origEm === undefined) {
            best.mesh.userData._origEm = m.emissiveIntensity;
          }
          if (m.emissive && best.mesh.userData._origEmColor === undefined) {
            best.mesh.userData._origEmColor = m.emissive.getHex();
          }
          if (m.emissive && m.emissive.getHex() === 0) {
            m.emissive.setHex(0x443a28);
          }
          m.emissiveIntensity = Math.max(best.mesh.userData._origEm as number, 0.2) + 0.35;
        }
        if (!best.mesh.userData._origScale) {
          best.mesh.userData._origScale = best.mesh.scale.clone();
        }
        best.mesh.scale.copy(best.mesh.userData._origScale as THREE.Vector3).multiplyScalar(1.1);
      }
      const lbl = best.getLabel ? best.getLabel() : best.label;
      const hnt = best.getHint ? best.getHint() : best.hint;
      const prefix = isTouchActive() ? '点击互动 · ' : '[E] ';
      emitPrompt(true, prefix + lbl + ' · ' + hnt);
    } else {
      emitPrompt(false, '');
    }
  }

  const mmCtx = minimapCanvas ? minimapCanvas.getContext('2d') : null;
  function drawMinimap(now: number): void {
    if (!mmCtx || now - lastMapMs < 42) {
      return;
    }
    lastMapMs = now;
    mmCtx.clearRect(0, 0, 128, 128);
    mmCtx.fillStyle = 'rgba(22,24,28,0.75)';
    mmCtx.fillRect(0, 0, 128, 128);
    const scale = state.inCity ? 1.45 : 3.6;
    const range = state.inCity ? 48 : 12;
    const cx = 64;
    const cy = 64;

    if (state.inCity) {
      mmCtx.fillStyle = 'rgba(72,78,86,0.55)';
      for (const r of [-36, 0, 36]) {
        const w = r === 0 ? 9.4 : 8.4;
        mmCtx.fillRect(cx + (r - w / 2 - player.pos.x) * scale, 0, w * scale, 128);
        mmCtx.fillRect(0, cy + (r - w / 2 - player.pos.z) * scale, 128, w * scale);
      }
    }

    mmCtx.fillStyle = 'rgba(160,165,170,0.28)';
    for (const c of colliders) {
      if (!c.active) {
        continue;
      }
      if (Math.abs(c.minX - player.pos.x) > range || Math.abs(c.minZ - player.pos.z) > range) {
        continue;
      }
      mmCtx.fillRect(
        cx + (c.minX - player.pos.x) * scale,
        cy + (c.minZ - player.pos.z) * scale,
        (c.maxX - c.minX) * scale,
        (c.maxZ - c.minZ) * scale,
      );
    }
    for (const it of interactables) {
      mmCtx.fillStyle = it.id.startsWith('col_')
        ? '#e6c373'
        : it.id === 'city_truck_board'
          ? '#6ed488'
          : '#7ec4cf';
      mmCtx.beginPath();
      mmCtx.arc(
        cx + (it.pos.x - player.pos.x) * scale,
        cy + (it.pos.z - player.pos.z) * scale,
        2.6,
        0,
        Math.PI * 2,
      );
      mmCtx.fill();
    }
    if (truckState) {
      mmCtx.save();
      mmCtx.translate(
        cx + (truckState.x - player.pos.x) * scale,
        cy + (truckState.z - player.pos.z) * scale,
      );
      mmCtx.rotate(-truckState.yaw);
      mmCtx.fillStyle = '#5da8eb';
      mmCtx.fillRect(-3, -6, 6, 12);
      mmCtx.restore();
    }
    mmCtx.save();
    mmCtx.translate(cx, cy);
    mmCtx.rotate(-player.yaw);
    mmCtx.fillStyle = 'rgba(235,220,185,0.28)';
    mmCtx.beginPath();
    mmCtx.moveTo(0, 0);
    mmCtx.lineTo(-10, -22);
    mmCtx.lineTo(10, -22);
    mmCtx.closePath();
    mmCtx.fill();
    mmCtx.fillStyle = '#f2ead8';
    mmCtx.beginPath();
    mmCtx.arc(0, 0, 3.2, 0, Math.PI * 2);
    mmCtx.fill();
    mmCtx.restore();
  }

  function stepSimulation(now: number, dt: number, elapsed: number): void {
    if (!state.paused) {
      for (const u of updaters) {
        u(dt, elapsed);
      }

      if (driving && truckState && truckRig) {
        let th = 0;
        let st = 0;
        if (keys['KeyW'] || keys['ArrowUp']) {
          th += 1;
        }
        if (keys['KeyS'] || keys['ArrowDown']) {
          th -= 1;
        }
        if (keys['KeyA'] || keys['ArrowLeft']) {
          st += 1;
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
          st -= 1;
        }
        th -= joyVec.y;
        st -= joyVec.x;

        truckState = stepTruckPhysics(
          truckState,
          { throttle: th, steer: st, handbrake: Boolean(keys['Space']) || handbrakeHeld },
          bounds,
          colliders,
          dt,
        );
        applyTruckVisuals();

        player.pos.set(truckState.x, truckState.y + 1.85, truckState.z);
        player.yaw = truckState.yaw;

        if (!dragging && Math.abs(truckState.speed) > 1.2) {
          chaseYawOff *= Math.exp(-2.4 * dt);
        }
        const camYaw = truckState.yaw + chaseYawOff;
        const camDist = 9.2 + Math.min(2.0, Math.abs(truckState.speed) * 0.08);
        const camHeight = 3.9 + chasePitchOff * 4.2;
        _chaseDesired.set(
          Math.max(bounds.minX + 1.5, Math.min(bounds.maxX - 1.5, truckState.x + Math.sin(camYaw) * camDist)),
          Math.max(1.4, camHeight),
          Math.max(bounds.minZ + 1.5, Math.min(bounds.maxZ - 1.5, truckState.z + Math.cos(camYaw) * camDist)),
        );
        const damp = 1 - Math.exp(-9.0 * dt);
        _chaseCamPos.lerp(_chaseDesired, damp);
        camera.position.copy(_chaseCamPos);
        _chaseLookTarget.set(
          truckState.x - Math.sin(truckState.yaw) * 4.2,
          truckState.y + 1.5,
          truckState.z - Math.cos(truckState.yaw) * 4.2,
        );
        camera.lookAt(_chaseLookTarget);

        const targetFov = state.fov + Math.min(7.5, Math.abs(truckState.speed) * 0.34);
        if (Math.abs(camera.fov - targetFov) > 0.05) {
          camera.fov += (targetFov - camera.fov) * damp;
          camera.updateProjectionMatrix();
        }
        emitPrompt(false, '');
        emitVehicleState(false);
        drawMinimap(now);
      } else {
        let fwd = 0;
        let str = 0;
        if (keys['KeyW'] || keys['ArrowUp']) {
          fwd += 1;
        }
        if (keys['KeyS'] || keys['ArrowDown']) {
          fwd -= 1;
        }
        if (keys['KeyA'] || keys['ArrowLeft']) {
          str -= 1;
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
          str += 1;
        }
        fwd -= joyVec.y;
        str += joyVec.x;

        const curSurf = surfaceFn(player.pos.x, player.pos.z, player.pos.y - player.height);
        const { dx, dz, inputLen } = computeMovementDelta(
          fwd,
          str,
          player.yaw,
          Boolean(keys['ShiftLeft']),
          curSurf,
          dt,
        );
        const [nx, nz] = resolveMove(
          player.pos.x + dx,
          player.pos.z + dz,
          player.pos.y,
          player.height,
          bounds,
          colliders,
        );
        const moved = Math.hypot(nx - player.pos.x, nz - player.pos.z);
        player.pos.x = nx;
        player.pos.z = nz;

        if (sitTimer !== null && (moved > 0.005 || inputLen > 0.05)) {
          clearSitTimer();
          player.height = 1.65;
        }

        const standingY = player.pos.y - player.height;
        const groundY = heightFn(player.pos.x, player.pos.z, standingY);
        const targetY = groundY + player.height;
        const yDiff = targetY - player.pos.y;
        if (player.pos.y <= targetY + 0.16 && player.vel.y <= 0.5) {
          if (Math.abs(yDiff) < 0.012) {
            player.pos.y = targetY;
          } else {
            player.pos.y += yDiff * Math.min(1, dt * 15);
          }
          player.vel.y = 0;
          player.onGround = true;
        } else {
          player.vel.y -= 14.5 * dt;
          player.pos.y += player.vel.y * dt;
          if (player.pos.y <= targetY) {
            player.pos.y = targetY;
            player.vel.y = 0;
            player.onGround = true;
          }
        }

        if (moved > 0.005 && player.onGround) {
          stepAcc += moved;
          if (stepAcc > 1.45) {
            stepAcc = 0;
            sfx.step(surfaceFn(player.pos.x, player.pos.z, player.pos.y - player.height));
          }
        }

        const onSlope = Math.abs(yDiff) > 0.035;
        const bob =
          moved > 0.005 && player.onGround && !onSlope ? Math.sin(elapsed * 9) * 0.016 : 0;
        camera.position.set(player.pos.x, player.pos.y + bob, player.pos.z);
        camera.rotation.order = 'YXZ';
        camera.rotation.y = player.yaw;
        camera.rotation.x = player.pitch;
        findInteractable();
        drawMinimap(now);
      }
    }

    if (renderer.initialized) {
      renderer.render(scene, camera);
    }
    if (!loaderHidden) {
      loaderHidden = true;
      window.setTimeout(() => callbacksRef.current.onLoaderDone(), 240);
    }
  }

  function afterDraw(done: () => void): void {
    const ctx = renderer.getContext() as Partial<WebGL2RenderingContext> | null;
    if (ctx && typeof ctx.fenceSync === 'function' && typeof ctx.flush === 'function' && typeof ctx.clientWaitSync === 'function' && typeof ctx.deleteSync === 'function') {
      const sync = ctx.fenceSync(ctx.SYNC_GPU_COMMANDS_COMPLETE ?? 0x9117, 0);
      ctx.flush();
      const poll = () => {
        if (!alive) {
          return;
        }
        if (sync && ctx.clientWaitSync!(sync, 0, 0) !== (ctx.TIMEOUT_EXPIRED ?? 0x911b)) {
          ctx.deleteSync!(sync);
          done();
        } else {
          pollTimerId = window.setTimeout(poll, 5);
        }
      };
      pollTimerId = window.setTimeout(poll, 5);
      return;
    }
    const queue = (
      renderer.backend as {
        device?: { queue?: { onSubmittedWorkDone?: () => Promise<void> } };
      } | null
    )?.device?.queue;
    if (queue && typeof queue.onSubmittedWorkDone === 'function') {
      void queue
        .onSubmittedWorkDone()
        .then(() => {
          if (alive) {
            done();
          }
        })
        .catch(() => {
          if (alive) {
            pollTimerId = window.setTimeout(done, 16);
          }
        });
      return;
    }
    pollTimerId = window.setTimeout(done, 16);
  }

  let lastFrameMs = performance.now();
  let elapsedSec = 0;

  function animate(now?: number): void {
    if (!alive) {
      return;
    }
    const ts = now ?? performance.now();
    const dt = Math.min(Math.max((ts - lastFrameMs) / 1000, 0), 0.05);
    lastFrameMs = ts;
    elapsedSec += dt;
    stepSimulation(ts, dt, elapsedSec);

    if (isSoftwareGl) {
      afterDraw(() => {
        if (!alive) {
          return;
        }
        pollTimerId = window.setTimeout(() => animate(performance.now()), 80);
      });
    } else {
      rafId = requestAnimationFrame(animate);
    }
  }

  function dispose(): void {
    if (!alive) {
      return;
    }
    alive = false;
    ready = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    if (pollTimerId) {
      window.clearTimeout(pollTimerId);
    }
    clearScene();
    envTex?.dispose();
    envTex = null;
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    glCanvas.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('pointerlockchange', onPtrChange);
    document.removeEventListener('pointerlockerror', onPtrErr);
    glCanvas.removeEventListener('touchstart', onCTouchStart);
    glCanvas.removeEventListener('touchmove', onCTouchMove);
    window.removeEventListener('touchend', onCTouchEnd);
    window.removeEventListener('touchcancel', onCTouchEnd);
    window.removeEventListener('resize', resize);
    window.removeEventListener('orientationchange', resize);
    mq?.removeEventListener('change', resize);
    tex?.dispose();
    tex = null;
    sfx.dispose();
    if (renderer.initialized) {
      void renderer.dispose().catch(() => {});
    }
  }

  async function initAndStart(): Promise<void> {
    try {
      await renderer.init();
    } catch (primaryErr) {
      try {
        renderer = new THREE.WebGPURenderer({
          canvas: glCanvas,
          antialias: !isSoftwareGl,
          powerPreference: 'high-performance',
          forceWebGL: true,
        });
        applyRendererConfig(renderer);
        await renderer.init();
      } catch (fallbackErr) {
        const msg =
          fallbackErr instanceof Error
            ? fallbackErr.message
            : primaryErr instanceof Error
              ? primaryErr.message
              : String(fallbackErr);
        if (alive) {
          dispose();
          callbacksRef.current.onWebGLFailed('无法初始化 WebGPU/WebGL2 3D 渲染器：' + msg);
        }
        return;
      }
    }

    if (!alive) {
      void renderer.dispose().catch(() => {});
      return;
    }

    const isWebGpu = Boolean(
      (renderer.backend as { isWebGPUBackend?: boolean } | null)?.isWebGPUBackend,
    );
    glCanvas.dataset.backend = isWebGpu ? 'WebGPU' : 'WebGL2';

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envScene = buildStudioEnvironment();
    envTex = pmremGenerator.fromScene(envScene, 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();
    disposeEnvScene(envScene);

    tex = createTexCache(Math.min(16, renderer.getMaxAnisotropy()));
    ready = true;
    resize();
    loadScene(state.sceneIdx);
    lastFrameMs = performance.now();
    if (isSoftwareGl) {
      animate(performance.now());
    } else {
      rafId = requestAnimationFrame(animate);
    }
  }

  void initAndStart();

  return {
    loadScene,
    enterCityHub,
    summonTruck,
    toggleDrive,
    honkTruck,
    setRes(scale: number) {
      state.resScale = scale;
      resize();
    },
    setPerf(perf: PerfMode) {
      state.perf = perf;
      renderer.shadowMap.enabled = !isSoftwareGl && perf === 'high';
      if (perf === 'high' && ready) {
        setupShadows(state.inCity);
      }
      scene.traverse((o) => {
        const m = (o as THREE.Mesh).material;
        if (m) {
          if (Array.isArray(m)) {
            m.forEach((item) => {
              item.needsUpdate = true;
            });
          } else {
            m.needsUpdate = true;
          }
        }
      });
    },
    setFov(fov: number) {
      state.fov = fov;
      if (!state.zoomActive && !driving) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
    },
    setAudio(on: boolean) {
      state.audioOn = on;
      sfx.setAudioOn(on);
      if (on) {
        sfx.resume();
      }
      sfx.setAmbient(state.inCity ? 'city' : SCENES_META[state.sceneIdx].id);
    },
    triggerInteract,
    doJump,
    clearHover,
    resetTouch,
    setJoyVec(x: number, y: number) {
      joyVec.x = x;
      joyVec.y = y;
    },
    resetSceneAndState() {
      state.collected.clear();
      state.bookState = {};
      state.studioImg = null;
      state.roadBridge = false;
      state.officePage = 0;
      state.pendingSpawn = null;
      if (state.inCity) {
        enterCityHub();
      } else {
        loadScene(state.sceneIdx);
      }
      sfx.play('switch');
      callbacksRef.current.onWhisper('现场已恢复初始状态。');
    },
    dispose,
  };
}

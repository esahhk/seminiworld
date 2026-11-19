import * as THREE from 'three';
import { SoundFX } from '../audio/soundFx';
import { SCENES_META, sceneIdxById } from '../data/scenesMeta';
import { SCENE_BUILDERS } from '../scenes';
import type { SceneContext } from '../scenes/sceneContext';
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
import { createTexCache } from './texCache';

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

export function createGameEngine(opts: GameEngineInitOptions): GameEngineHandle | null {
  const { glCanvas, minimapCanvas, state, callbacksRef, isTouchActive } = opts;

  const isSoftwareGl = detectSoftwareWebGL();

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: glCanvas,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    callbacksRef.current.onWebGLFailed('无法初始化 WebGL 3D 渲染器：' + msg);
    return null;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = !isSoftwareGl && state.perf === 'high';
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    state.fov,
    window.innerWidth / window.innerHeight,
    0.1,
    180,
  );
  const sfx = new SoundFX();
  sfx.setAudioOn(state.audioOn);
  const tex = createTexCache(Math.min(4, renderer.capabilities.getMaxAnisotropy()));

  const player: PlayerState = {
    pos: new THREE.Vector3(0, 1.65, 5),
    vel: new THREE.Vector3(),
    yaw: 0,
    pitch: 0,
    onGround: true,
    height: 1.65,
  };

  let colliders: Collider[] = [];
  let interactables: Interactable[] = [];
  let updaters: ((dt: number, t: number) => void)[] = [];
  const trackedResources = new Set<THREE.BufferGeometry | THREE.Material | THREE.Texture>();
  let activeIntervals: number[] = [];
  let activeTimeouts: number[] = [];
  let sitTimer: number | null = null;

  let bounds: Bounds = { minX: -12, maxX: 12, minZ: -12, maxZ: 12 };
  let heightFn: (x: number, z: number, standingY?: number) => number = () => 0;
  let surfaceFn: (x: number, z: number, standingY?: number) => SurfaceType = () => 'concrete';

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
    interactables = [];
    updaters = [];
    state.zoomActive = false;
  }

  function setupShadows(): void {
    if (isSoftwareGl || state.perf === 'fast') {
      return;
    }
    const isSmallScreen = window.innerWidth <= 900;
    const shadowRes = isSmallScreen ? 768 : 1024;
    scene.traverse((obj) => {
      const light = obj as THREE.DirectionalLight;
      if (light.isDirectionalLight && light.castShadow) {
        light.shadow.mapSize.set(shadowRes, shadowRes);
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 65;
        const d = 16;
        light.shadow.camera.left = -d;
        light.shadow.camera.right = d;
        light.shadow.camera.top = d;
        light.shadow.camera.bottom = -d;
        light.shadow.bias = -0.0005;
      }
      const spot = obj as THREE.SpotLight;
      if (spot.isSpotLight && spot.castShadow) {
        spot.shadow.mapSize.set(512, 512);
        spot.shadow.bias = -0.0005;
      }
    });
  }

  function loadScene(idx: number): void {
    const total = SCENES_META.length;
    state.sceneIdx = ((idx % total) + total) % total;
    callbacksRef.current.onCloseModal();
    callbacksRef.current.onClosePanels();

    const meta = SCENES_META[state.sceneIdx];
    clearScene();

    const ctx: SceneContext = {
      T: THREE,
      scene,
      camera,
      player,
      state,
      tex,
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
      sceneIdxById,
      loadScene,
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

    setupShadows();
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
    sfx.setAmbient(meta.id);
    callbacksRef.current.onSceneLoaded(state.sceneIdx, meta.name, info.whisper);
  }

  function resetTouch(): void {
    lookTouchId = null;
    dragging = false;
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
    if (targetInter) {
      targetInter.onInteract();
    }
  }

  function doJump(): void {
    if (state.paused) {
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
    if (e.code === 'Space') {
      e.preventDefault();
      if (!e.repeat) {
        const active = document.activeElement as HTMLElement | null;
        if (active && typeof active.blur === 'function') {
          active.blur();
        }
        doJump();
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
    if (pointerLocked) {
      player.yaw -= e.movementX * 0.0022;
      player.pitch = Math.max(-1.35, Math.min(1.35, player.pitch - e.movementY * 0.0022));
    } else if (dragging) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      player.yaw -= dx * 0.004;
      player.pitch = Math.max(-1.35, Math.min(1.35, player.pitch - dy * 0.004));
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
        const dx = t.clientX - lookLX;
        const dy = t.clientY - lookLY;
        lookLX = t.clientX;
        lookLY = t.clientY;
        player.yaw -= dx * 0.0055;
        player.pitch = Math.max(-1.35, Math.min(1.35, player.pitch - dy * 0.0055));
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
    const maxDpr = window.innerWidth <= 900 ? 1.5 : 1.75;
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
    const scale = 3.6;
    const cx = 64;
    const cy = 64;
    mmCtx.fillStyle = 'rgba(160,165,170,0.28)';
    for (const c of colliders) {
      if (!c.active) {
        continue;
      }
      if (Math.abs(c.minX - player.pos.x) > 12 || Math.abs(c.minZ - player.pos.z) > 12) {
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
      mmCtx.fillStyle = it.id.startsWith('col_') ? '#e6c373' : '#7ec4cf';
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

      for (const u of updaters) {
        u(dt, elapsed);
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

    renderer.render(scene, camera);
    if (!loaderHidden) {
      loaderHidden = true;
      window.setTimeout(() => callbacksRef.current.onLoaderDone(), 240);
    }
  }

  function afterDraw(done: () => void): void {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    if (typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (!alive) {
          return;
        }
        if (
          sync &&
          gl.clientWaitSync(sync, 0, 0) !== gl.TIMEOUT_EXPIRED
        ) {
          gl.deleteSync(sync);
          done();
        } else {
          pollTimerId = window.setTimeout(poll, 5);
        }
      };
      pollTimerId = window.setTimeout(poll, 5);
    } else {
      pollTimerId = window.setTimeout(done, 16);
    }
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
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    if (pollTimerId) {
      window.clearTimeout(pollTimerId);
    }
    clearScene();
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
    tex.dispose();
    sfx.dispose();
    renderer.dispose();
  }

  loadScene(state.sceneIdx);
  if (isSoftwareGl) {
    animate(performance.now());
  } else {
    rafId = requestAnimationFrame(animate);
  }

  return {
    loadScene,
    setRes(scale: number) {
      state.resScale = scale;
      resize();
    },
    setPerf(perf: PerfMode) {
      state.perf = perf;
      renderer.shadowMap.enabled = !isSoftwareGl && perf === 'high';
      if (perf === 'high') {
        setupShadows();
      }
      renderer.shadowMap.needsUpdate = true;
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
      if (!state.zoomActive) {
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
      sfx.setAmbient(SCENES_META[state.sceneIdx].id);
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
      loadScene(state.sceneIdx);
      sfx.play('switch');
      callbacksRef.current.onWhisper('现场已恢复初始状态。');
    },
    dispose,
  };
}

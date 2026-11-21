import type * as THREE from 'three/webgpu';

export type SceneId =
  | 'platform'
  | 'hellstone'
  | 'office'
  | 'mall'
  | 'garage'
  | 'infirmary'
  | 'school_bbq'
  | 'zigzag'
  | 'park_lot'
  | 'hospital'
  | 'airport'
  | 'waterpark'
  | 'convenience'
  | 'subway'
  | 'studio'
  | 'cave'
  | 'backyard';

export type BookKey = 'office' | 'studio' | 'convenience';

export type SurfaceType =
  | 'concrete'
  | 'wood'
  | 'metal'
  | 'water'
  | 'grass'
  | 'carpet'
  | 'dirt'
  | 'marble'
  | 'stone';

export type PerfMode = 'high' | 'fast';
export type TouchMode = 'auto' | '1' | '0';
export type PanelId = 'col' | 'set' | null;

export interface VehicleHudState {
  inCity: boolean;
  summoned: boolean;
  driving: boolean;
  speedKmh: number;
  gear: 'P' | 'D' | 'R';
}

export interface SceneMeta {
  id: SceneId;
  name: string;
  item: string;
  desc: string;
  hidden?: boolean;
}

export interface BookPage {
  label: string;
  body: string;
}

export interface BookDefinition {
  title: string;
  meta: string;
  pages: BookPage[];
}

export interface BookProgress {
  page: number;
  scrolls: Record<number, number>;
  paper: boolean;
}

export interface ModalAction {
  label: string;
  fn?: () => void;
  href?: string;
}

export interface ModalConfig {
  mode: 'inspect' | 'book';
  title: string;
  meta: string;
  prog: string;
  body: string;
  actions: ModalAction[];
  bookKey?: BookKey;
  bookPage?: number;
  paper?: boolean;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface Collider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
  active: boolean;
  mesh?: THREE.Mesh;
}

export interface Interactable {
  id: string;
  pos: THREE.Vector3;
  radius: number;
  label: string;
  hint: string;
  getLabel: (() => string) | null;
  getHint: (() => string) | null;
  onInteract: () => void;
  mesh: THREE.Mesh | null;
}

export interface PlayerState {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  yaw: number;
  pitch: number;
  onGround: boolean;
  height: number;
}

export interface SpawnPoint {
  pos: THREE.Vector3;
  yaw: number;
}

export interface SceneInitResult {
  pos: THREE.Vector3;
  yaw: number;
  whisper: string;
}

export interface SharedGameState {
  sceneIdx: number;
  inCity: boolean;
  collected: Set<SceneId>;
  resScale: number;
  perf: PerfMode;
  audioOn: boolean;
  touchMode: TouchMode;
  fov: number;
  zoomActive: boolean;
  bookState: Partial<Record<BookKey, BookProgress>>;
  studioImg: string | null;
  roadBridge: boolean;
  officePage: number;
  paused: boolean;
  pendingSpawn: SpawnPoint | null;
  immersive: boolean;
}

export interface EngineCallbacks {
  onSceneLoaded: (idx: number, name: string, whisper: string, inCity?: boolean) => void;
  onWhisper: (text: string, duration?: number) => void;
  onCollect: (id: SceneId, item: string, desc: string) => void;
  onVehicleState: (state: VehicleHudState) => void;
  onOpenModal: (
    title: string,
    body: string,
    actions?: ModalAction[],
    opts?: { meta?: string; prog?: string },
  ) => void;
  onUpdateModalText: (
    title: string,
    body: string,
    meta?: string,
    prog?: string,
  ) => void;
  onCloseModal: () => void;
  onOpenBook: (key: BookKey) => void;
  onClosePanels: () => void;
  onToggleImmersive: () => void;
  onExitImmersive: () => void;
  onTouchDetected: (isTouch: boolean) => void;
  onPromptChange: (hit: boolean, text: string) => void;
  onLoaderDone: () => void;
  onWebGLFailed: (reason: string) => void;
}

export interface GameEngineHandle {
  loadScene: (idx: number) => void;
  enterCityHub: (focusSceneId?: SceneId) => void;
  summonTruck: () => void;
  toggleDrive: () => void;
  honkTruck: () => void;
  setRes: (scale: number) => void;
  setPerf: (perf: PerfMode) => void;
  setFov: (fov: number) => void;
  setAudio: (on: boolean) => void;
  triggerInteract: () => void;
  doJump: () => void;
  clearHover: () => void;
  resetTouch: () => void;
  setJoyVec: (x: number, y: number) => void;
  resetSceneAndState: () => void;
  dispose: () => void;
}

import * as THREE from 'three/webgpu';
import type { SoundFX } from '../audio/soundFx';
import type { TexCache } from '../engine/texCache';
import type {
  BookKey,
  Bounds,
  Collider,
  Interactable,
  ModalAction,
  PlayerState,
  SceneId,
  SceneInitResult,
  SharedGameState,
  SurfaceType,
} from '../types/game';

export interface RoadSpawnCandidate {
  x: number;
  z: number;
  yaw: number;
}

export interface SceneContext {
  T: typeof THREE;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  player: PlayerState;
  state: SharedGameState;
  tex: TexCache;
  sfx: SoundFX;
  V: (x: number, y: number, z: number) => THREE.Vector3;
  track: <G extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(
    obj: G,
  ) => G;
  mkMesh: (
    geo: THREE.BufferGeometry,
    m: THREE.Material,
    x?: number,
    y?: number,
    z?: number,
    cast?: boolean,
    recv?: boolean,
  ) => THREE.Mesh;
  addMesh: (
    geo: THREE.BufferGeometry,
    m: THREE.Material,
    x?: number,
    y?: number,
    z?: number,
    cast?: boolean,
    recv?: boolean,
  ) => THREE.Mesh;
  addBox: (
    w: number,
    h: number,
    d: number,
    m: THREE.Material,
    x: number,
    y: number,
    z: number,
    solid?: boolean,
    cast?: boolean,
    recv?: boolean,
  ) => THREE.Mesh;
  addCylinder: (
    rt: number,
    rb: number,
    h: number,
    seg: number,
    m: THREE.Material,
    x: number,
    y: number,
    z: number,
    cast?: boolean,
    recv?: boolean,
  ) => THREE.Mesh;
  addSign: (
    w: number,
    h: number,
    texMap: THREE.Texture,
    x: number,
    y: number,
    z: number,
    ry?: number,
    rx?: number,
  ) => THREE.Mesh;
  addDoubleSign: (
    w: number,
    h: number,
    texMap: THREE.Texture,
    x: number,
    y: number,
    z: number,
    ry?: number,
    frameHex?: number,
  ) => THREE.Group;
  syncColX: (mesh: THREE.Mesh, halfW: number) => void;
  syncColZ: (mesh: THREE.Mesh, halfD: number) => void;
  createMaterial: (
    opts: THREE.MeshStandardMaterialParameters,
  ) => THREE.MeshStandardMaterial;
  addInteract: (
    id: string,
    pos: THREE.Vector3,
    label: string,
    hint: string,
    onInteract: () => void,
    opts?: {
      radius?: number;
      mesh?: THREE.Mesh | null;
      getLabel?: (() => string) | null;
      getHint?: (() => string) | null;
    },
  ) => Interactable;
  addCollectible: (
    id: SceneId,
    x: number,
    y: number,
    z: number,
    color?: number,
  ) => Interactable | null;
  addTimedRedirect: (fn: () => void, ms: number) => number;
  activeIntervals: number[];
  updaters: ((dt: number, t: number) => void)[];
  colliders: Collider[];
  roadCenters: RoadSpawnCandidate[];
  sceneIdxById: (id: SceneId) => number;
  loadScene: (idx: number) => void;
  enterCityHub: (focusSceneId?: SceneId) => void;
  showWhisper: (txt: string, dur?: number) => void;
  openModal: (
    title: string,
    body: string,
    actions?: ModalAction[],
    opts?: { meta?: string; prog?: string },
  ) => void;
  updateModalText: (
    title: string,
    body: string,
    meta?: string,
    prog?: string,
  ) => void;
  closeModal: () => void;
  openBook: (key: BookKey) => void;
  setBounds: (b: Bounds) => void;
  setHeightFn: (
    fn: (x: number, z: number, standingY?: number) => number,
  ) => void;
  getHeight: (x: number, z: number, standingY?: number) => number;
  setSurfaceFn: (
    fn: (x: number, z: number, standingY?: number) => SurfaceType,
  ) => void;
  setSitTimer: (cb: () => void, ms: number) => void;
  clearSitTimer: () => void;
}

export type SceneBuilder = (ctx: SceneContext) => SceneInitResult;

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { FallbackView } from './components/FallbackView';
import { HudOverlay } from './components/HudOverlay';
import { InspectModal } from './components/InspectModal';
import { LoaderOverlay } from './components/LoaderOverlay';
import { Panels } from './components/Panels';
import { TouchControls } from './components/TouchControls';
import { BOOKS } from './data/books';
import { SCENES_META } from './data/scenesMeta';
import { createGameEngine } from './engine/GameEngine';
import type {
  BookKey,
  EngineCallbacks,
  GameEngineHandle,
  ModalAction,
  ModalConfig,
  PanelId,
  PerfMode,
  SceneId,
  SharedGameState,
  TouchMode,
  VehicleHudState,
} from './types/game';

interface GlCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const GlCanvas = memo(function GlCanvas({ canvasRef }: GlCanvasProps) {
  return <canvas ref={canvasRef} id="gl" />;
});

export default function App() {
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngineHandle | null>(null);
  const joyVecRef = useRef({ x: 0, y: 0 });

  const stateRef = useRef<SharedGameState>({
    sceneIdx: 0,
    inCity: false,
    collected: new Set<SceneId>(),
    resScale: 1,
    perf: 'high',
    audioOn: true,
    touchMode: 'auto',
    fov: 68,
    zoomActive: false,
    bookState: {},
    studioImg: null,
    roadBridge: false,
    officePage: 0,
    paused: false,
    pendingSpawn: null,
    immersive: false,
  });

  const [sceneIdx, setSceneIdx] = useState(0);
  const [inCity, setInCity] = useState(false);
  const [vehicleState, setVehicleState] = useState<VehicleHudState>({
    inCity: false,
    summoned: false,
    driving: false,
    speedKmh: 0,
    gear: 'P',
    steerDeg: 0,
    handbrake: false,
    turbo: false,
    boostPct: 100,
    rpmPct: 14,
    driftDeg: 0,
  });
  const [whisperText, setWhisperText] = useState('');
  const [whisperVisible, setWhisperVisible] = useState(false);
  const [collected, setCollected] = useState<Set<SceneId>>(() => new Set());
  const [activePanel, setActivePanel] = useState<PanelId>(null);
  const [modal, setModal] = useState<ModalConfig | null>(null);
  const [progText, setProgText] = useState('');
  const [restoreScrollTop, setRestoreScrollTop] = useState<number | null>(null);

  const [resScale, setResScale] = useState(1);
  const [perf, setPerf] = useState<PerfMode>('high');
  const [audioOn, setAudioOn] = useState(true);
  const [touchMode, setTouchMode] = useState<TouchMode>('auto');
  const [fov, setFov] = useState(68);
  const [immersive, setImmersive] = useState(false);
  const [lastInputTouch, setLastInputTouch] = useState(() =>
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0),
  );

  const [promptHit, setPromptHit] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [loaderState, setLoaderState] = useState<{ visible: boolean; hiding: boolean }>({
    visible: true,
    hiding: false,
  });
  const [fallbackMsg, setFallbackMsg] = useState<string | null>(null);
  const [engineAttempt, setEngineAttempt] = useState(0);

  const whisperTimerRef = useRef<number | null>(null);
  const lastScrollTopRef = useRef(0);
  const touchModeRef = useRef<TouchMode>(touchMode);
  const lastInputTouchRef = useRef(lastInputTouch);
  touchModeRef.current = touchMode;
  lastInputTouchRef.current = lastInputTouch;

  const showWhisper = useCallback((text: string, duration = 3600) => {
    setWhisperText(text);
    setWhisperVisible(true);
    if (whisperTimerRef.current !== null) {
      window.clearTimeout(whisperTimerRef.current);
    }
    whisperTimerRef.current = window.setTimeout(() => {
      setWhisperVisible(false);
      whisperTimerRef.current = null;
    }, duration);
  }, []);

  const releaseInputForOverlay = useCallback(() => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    engineRef.current?.clearHover();
    engineRef.current?.resetTouch();
  }, []);

  const closeModal = useCallback(() => {
    setModal((prev) => {
      if (prev?.mode === 'book' && prev.bookKey !== undefined && prev.bookPage !== undefined) {
        const bk = stateRef.current.bookState[prev.bookKey];
        if (bk) {
          bk.scrolls[prev.bookPage] = lastScrollTopRef.current;
        }
      }
      return null;
    });
    setProgText('');
  }, []);

  const closePanels = useCallback(() => {
    setActivePanel(null);
  }, []);

  useEffect(() => {
    const isPaused = modal !== null || activePanel !== null;
    stateRef.current.paused = isPaused;
    document.body.dataset.state = isPaused ? 'paused' : 'playing';
    if (!isPaused) {
      engineRef.current?.resetTouch();
    }
  }, [modal, activePanel]);

  useEffect(() => {
    stateRef.current.immersive = immersive;
    document.body.classList.toggle('immersive', immersive);
    return () => {
      document.body.classList.remove('immersive');
    };
  }, [immersive]);

  const openModal = useCallback(
    (
      title: string,
      body: string,
      actions: ModalAction[] = [],
      opts: { meta?: string; prog?: string } = {},
    ) => {
      releaseInputForOverlay();
      setActivePanel(null);
      setRestoreScrollTop(0);
      setProgText(opts.prog ?? '');
      setModal({
        mode: 'inspect',
        title,
        meta: opts.meta ?? '',
        prog: opts.prog ?? '',
        body,
        actions,
      });
    },
    [releaseInputForOverlay],
  );

  const updateModalText = useCallback(
    (title: string, body: string, meta?: string, prog?: string) => {
      setModal((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          title,
          body,
          meta: meta !== undefined ? meta : prev.meta,
          prog: prog !== undefined ? prog : prev.prog,
        };
      });
      if (prog !== undefined) {
        setProgText(prog);
      }
    },
    [],
  );

  const openBook = useCallback(
    (key: BookKey) => {
      const book = BOOKS[key];
      if (!book) {
        return;
      }
      const existing = stateRef.current.bookState[key];
      const bk = existing ?? { page: 0, scrolls: {}, paper: false };
      stateRef.current.bookState[key] = bk;

      releaseInputForOverlay();
      setActivePanel(null);
      const savedScroll = bk.scrolls[bk.page] ?? 0;
      lastScrollTopRef.current = savedScroll;
      setRestoreScrollTop(savedScroll);
      setProgText(`第 ${bk.page + 1} / ${book.pages.length} 节`);
      setModal({
        mode: 'book',
        title: book.title,
        meta: book.meta,
        prog: `第 ${bk.page + 1} / ${book.pages.length} 节`,
        body: book.pages[bk.page].body,
        actions: [],
        bookKey: key,
        bookPage: bk.page,
        paper: bk.paper,
      });
    },
    [releaseInputForOverlay],
  );

  const handleSelectBookPage = useCallback((key: BookKey, pageIdx: number) => {
    const book = BOOKS[key];
    const bk = stateRef.current.bookState[key];
    if (!book || !bk || pageIdx < 0 || pageIdx >= book.pages.length) {
      return;
    }
    bk.scrolls[bk.page] = lastScrollTopRef.current;
    bk.page = pageIdx;
    const saved = bk.scrolls[pageIdx] ?? 0;
    lastScrollTopRef.current = saved;
    setRestoreScrollTop(saved);
    setProgText(`第 ${pageIdx + 1} / ${book.pages.length} 节`);
    setModal((prev) =>
      prev
        ? {
            ...prev,
            bookPage: pageIdx,
            body: book.pages[pageIdx].body,
            prog: `第 ${pageIdx + 1} / ${book.pages.length} 节`,
          }
        : prev,
    );
  }, []);

  const handleTogglePaper = useCallback((key: BookKey) => {
    const bk = stateRef.current.bookState[key];
    if (!bk) {
      return;
    }
    bk.paper = !bk.paper;
    setModal((prev) => (prev ? { ...prev, paper: bk.paper } : prev));
  }, []);

  const handleBodyScroll = useCallback(
    (scrollTop: number, scrollHeight: number, clientHeight: number) => {
      lastScrollTopRef.current = scrollTop;
      setModal((prev) => {
        if (prev?.mode === 'book' && prev.bookKey !== undefined && prev.bookPage !== undefined) {
          const bk = stateRef.current.bookState[prev.bookKey];
          const book = BOOKS[prev.bookKey];
          if (bk && book) {
            bk.scrolls[prev.bookPage] = scrollTop;
            const max = scrollHeight - clientHeight;
            const pct =
              max <= 2 ? 100 : Math.min(100, Math.round((scrollTop / max) * 100));
            const nextProg = `第 ${prev.bookPage + 1}/${book.pages.length} 节 · ${pct}%`;
            setProgText((cur) => (cur === nextProg ? cur : nextProg));
          }
        }
        return prev;
      });
    },
    [],
  );

  const toggleImmersive = useCallback(() => {
    setImmersive((prev) => {
      const next = !prev;
      if (next) {
        setActivePanel(null);
      }
      return next;
    });
  }, []);

  const exitImmersive = useCallback(() => {
    setImmersive(false);
  }, []);

  const callbacksRef = useRef<EngineCallbacks>({
    onSceneLoaded: () => {},
    onWhisper: () => {},
    onCollect: () => {},
    onVehicleState: () => {},
    onOpenModal: () => {},
    onUpdateModalText: () => {},
    onCloseModal: () => {},
    onOpenBook: () => {},
    onClosePanels: () => {},
    onToggleImmersive: () => {},
    onExitImmersive: () => {},
    onTouchDetected: () => {},
    onPromptChange: () => {},
    onLoaderDone: () => {},
    onWebGLFailed: () => {},
  });

  callbacksRef.current = {
    onSceneLoaded: (idx, _name, whisper, cityMode = false) => {
      setSceneIdx(idx);
      setInCity(cityMode);
      showWhisper(whisper, 4200);
    },
    onWhisper: showWhisper,
    onCollect: (id, item, desc) => {
      setCollected(new Set(stateRef.current.collected));
      showWhisper(`拾得「${item}」：${desc}`, 4500);
      void id;
    },
    onVehicleState: (vs) => {
      setVehicleState(vs);
    },
    onOpenModal: openModal,
    onUpdateModalText: updateModalText,
    onCloseModal: closeModal,
    onOpenBook: openBook,
    onClosePanels: closePanels,
    onToggleImmersive: toggleImmersive,
    onExitImmersive: exitImmersive,
    onTouchDetected: (isTouch) => {
      setLastInputTouch((prev) => (prev === isTouch ? prev : isTouch));
    },
    onPromptChange: (hit, text) => {
      setPromptHit(hit);
      setPromptText(text);
    },
    onLoaderDone: () => {
      setLoaderState({ visible: true, hiding: true });
      window.setTimeout(() => {
        setLoaderState({ visible: false, hiding: false });
      }, 480);
    },
    onWebGLFailed: (reason) => {
      setFallbackMsg(reason);
      setLoaderState({ visible: true, hiding: true });
      window.setTimeout(() => {
        setLoaderState({ visible: false, hiding: false });
      }, 480);
    },
  };

  useEffect(() => {
    const glCanvas = glCanvasRef.current;
    if (!glCanvas) {
      return;
    }
    const handle = createGameEngine({
      glCanvas,
      minimapCanvas: minimapRef.current,
      state: stateRef.current,
      callbacksRef,
      isTouchActive: () =>
        touchModeRef.current === '1' ||
        (touchModeRef.current === 'auto' && lastInputTouchRef.current),
    });
    engineRef.current = handle;
    return () => {
      engineRef.current = null;
      handle?.dispose();
    };
  }, [engineAttempt]);

  useEffect(() => {
    return () => {
      if (whisperTimerRef.current !== null) {
        window.clearTimeout(whisperTimerRef.current);
      }
    };
  }, []);

  const handleTogglePanel = useCallback(
    (panel: Exclude<PanelId, null>) => {
      closeModal();
      setActivePanel((prev) => {
        if (prev === panel) {
          return null;
        }
        releaseInputForOverlay();
        return panel;
      });
    },
    [closeModal, releaseInputForOverlay],
  );

  const handleEnterCity = useCallback(() => {
    closeModal();
    closePanels();
    releaseInputForOverlay();
    if (engineRef.current) {
      if (stateRef.current.inCity) {
        engineRef.current.loadScene(stateRef.current.sceneIdx);
      } else {
        engineRef.current.enterCityHub();
      }
    }
    setPromptHit(false);
    setPromptText('');
  }, [closeModal, closePanels, releaseInputForOverlay]);

  const handlePrevScene = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.loadScene(stateRef.current.sceneIdx - 1);
    } else {
      const total = SCENES_META.length;
      const nextIdx = (stateRef.current.sceneIdx - 1 + total) % total;
      stateRef.current.sceneIdx = nextIdx;
      setSceneIdx(nextIdx);
      closeModal();
      closePanels();
    }
    setPromptHit(false);
    setPromptText('');
  }, [closeModal, closePanels]);

  const handleNextScene = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.loadScene(stateRef.current.sceneIdx + 1);
    } else {
      const total = SCENES_META.length;
      const nextIdx = (stateRef.current.sceneIdx + 1) % total;
      stateRef.current.sceneIdx = nextIdx;
      setSceneIdx(nextIdx);
      closeModal();
      closePanels();
    }
    setPromptHit(false);
    setPromptText('');
  }, [closeModal, closePanels]);

  const handleReset = useCallback(() => {
    closeModal();
    closePanels();
    setCollected(new Set());
    if (engineRef.current) {
      engineRef.current.resetSceneAndState();
    } else {
      stateRef.current.collected.clear();
      stateRef.current.bookState = {};
      stateRef.current.studioImg = null;
      stateRef.current.roadBridge = false;
      stateRef.current.officePage = 0;
      stateRef.current.pendingSpawn = null;
      showWhisper('现场已恢复初始状态。');
    }
    setPromptHit(false);
    setPromptText('');
  }, [closeModal, closePanels, showWhisper]);

  const handleJoyChange = useCallback((x: number, y: number) => {
    joyVecRef.current = { x, y };
    engineRef.current?.setJoyVec(x, y);
  }, []);

  const handleTouchActive = useCallback(() => {
    setLastInputTouch((prev) => (prev ? prev : true));
  }, []);

  const handleTouchJump = useCallback(() => {
    setLastInputTouch(true);
    engineRef.current?.doJump();
  }, []);

  const handleTouchInteract = useCallback(() => {
    setLastInputTouch(true);
    if (engineRef.current) {
      engineRef.current.triggerInteract();
    } else {
      const id = SCENES_META[stateRef.current.sceneIdx]?.id;
      if (id && id in BOOKS) {
        openBook(id as BookKey);
      }
    }
  }, [openBook]);

  const touchVisible =
    !immersive && (touchMode === '1' || (touchMode === 'auto' && lastInputTouch));
  const curMeta = SCENES_META[sceneIdx] ?? SCENES_META[0];

  return (
    <>
      {fallbackMsg === null && <GlCanvas canvasRef={glCanvasRef} />}

      {fallbackMsg !== null && (
        <FallbackView
          message={fallbackMsg}
          sceneIdx={sceneIdx}
          paused={modal !== null || activePanel !== null}
          immersive={immersive}
          joyVecRef={joyVecRef}
          onRetry={() => {
            setFallbackMsg(null);
            setLoaderState({ visible: true, hiding: false });
            setEngineAttempt((n) => n + 1);
          }}
          onOpenBook={openBook}
          onPrevScene={handlePrevScene}
          onNextScene={handleNextScene}
          onCloseModalOrPanels={() => {
            if (modal !== null) {
              closeModal();
            } else {
              closePanels();
            }
          }}
          onToggleImmersive={toggleImmersive}
          onExitImmersive={exitImmersive}
        />
      )}

      <LoaderOverlay visible={loaderState.visible} hiding={loaderState.hiding} />

      <HudOverlay
        sceneIdx={sceneIdx}
        sceneName={curMeta.name}
        inCity={inCity}
        vehicle={vehicleState}
        whisperText={whisperText}
        whisperVisible={whisperVisible}
        collectedCount={collected.size}
        activePanel={activePanel}
        immersive={immersive}
        promptHit={promptHit}
        promptText={promptText}
        showMinimap={fallbackMsg === null}
        minimapRef={minimapRef}
        onPrevScene={handlePrevScene}
        onNextScene={handleNextScene}
        onEnterCity={handleEnterCity}
        onSummonTruck={() => engineRef.current?.summonTruck()}
        onToggleDrive={() => engineRef.current?.toggleDrive()}
        onHonkTruck={() => engineRef.current?.honkTruck()}
        onShiftGear={(g) => engineRef.current?.shiftGear(g)}
        onDriveSteer={(v) => engineRef.current?.setDriveSteer(v)}
        onDrivePedal={(p, pressed) => engineRef.current?.setDrivePedal(p, pressed)}
        onDriveHandbrake={(pressed) => engineRef.current?.setDriveHandbrake(pressed)}
        onDriveTurbo={(pressed) => engineRef.current?.setDriveTurbo(pressed)}
        onTogglePanel={handleTogglePanel}
        onReset={handleReset}
        onToggleImmersive={toggleImmersive}
        onPromptClick={() => engineRef.current?.triggerInteract()}
      />

      <TouchControls
        visible={touchVisible}
        paused={modal !== null || activePanel !== null}
        driving={vehicleState.driving}
        onJoyChange={handleJoyChange}
        onTouchActive={handleTouchActive}
        onJump={handleTouchJump}
        onInteract={handleTouchInteract}
      />

      <Panels
        activePanel={activePanel}
        collected={collected}
        resScale={resScale}
        perf={perf}
        audioOn={audioOn}
        touchMode={touchMode}
        fov={fov}
        immersive={immersive}
        onClose={closePanels}
        onInspectCollectible={(title, body) => openModal(title, body)}
        onChangeRes={(v) => {
          setResScale(v);
          engineRef.current?.setRes(v);
        }}
        onChangePerf={(v) => {
          setPerf(v);
          engineRef.current?.setPerf(v);
        }}
        onChangeAudio={(on) => {
          setAudioOn(on);
          engineRef.current?.setAudio(on);
        }}
        onChangeTouch={(mode) => {
          setTouchMode(mode);
          stateRef.current.touchMode = mode;
        }}
        onChangeFov={(v) => {
          setFov(v);
          engineRef.current?.setFov(v);
        }}
        onToggleImmersive={() => {
          closePanels();
          toggleImmersive();
        }}
      />

      <InspectModal
        modal={modal}
        progText={progText}
        onClose={closeModal}
        onSelectBookPage={handleSelectBookPage}
        onTogglePaper={handleTogglePaper}
        onBodyScroll={handleBodyScroll}
        restoreScrollTop={restoreScrollTop}
      />
    </>
  );
}

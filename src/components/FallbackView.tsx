import { useEffect, useRef } from 'react';
import { BOOKS } from '../data/books';
import { SCENES_META } from '../data/scenesMeta';
import type { BookKey } from '../types/game';

interface FallbackViewProps {
  message: string;
  sceneIdx: number;
  paused: boolean;
  immersive: boolean;
  joyVecRef: { current: { x: number; y: number } };
  onRetry: () => void;
  onOpenBook: (key: BookKey) => void;
  onPrevScene: () => void;
  onNextScene: () => void;
  onCloseModalOrPanels: () => void;
  onToggleImmersive: () => void;
  onExitImmersive: () => void;
}

export function FallbackView({
  message,
  sceneIdx,
  paused,
  immersive,
  joyVecRef,
  onRetry,
  onOpenBook,
  onPrevScene,
  onNextScene,
  onCloseModalOrPanels,
  onToggleImmersive,
  onExitImmersive,
}: FallbackViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ id: number | null; lx: number; ly: number }>({
    id: null,
    lx: 0,
    ly: 0,
  });

  useEffect(() => {
    posRef.current = { x: 0, y: 0 };
  }, [sceneIdx]);

  useEffect(() => {
    const fc = canvasRef.current;
    if (!fc) {
      return;
    }
    const g = fc.getContext('2d');
    if (!g) {
      return;
    }

    const fit = () => {
      fc.width = window.innerWidth;
      fc.height = window.innerHeight;
    };
    fit();

    const keys: Record<string, boolean> = {};

    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === 'Escape') {
        if (paused) {
          onCloseModalOrPanels();
        } else if (immersive) {
          onExitImmersive();
        }
        return;
      }
      if (paused) {
        return;
      }
      if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (!e.repeat) {
          onToggleImmersive();
        }
      }
      if ((e.code === 'KeyE' || e.code === 'Enter') && !e.repeat) {
        const id = SCENES_META[sceneIdx].id;
        if (id === 'office' || id === 'studio' || id === 'convenience') {
          onOpenBook(id);
        }
      }
      if (e.code === 'BracketLeft' && !e.repeat) {
        onPrevScene();
      }
      if (e.code === 'BracketRight' && !e.repeat) {
        onNextScene();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    const onBlur = () => {
      for (const k in keys) {
        keys[k] = false;
      }
      dragRef.current.id = null;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (paused) {
        return;
      }
      const t = e.changedTouches[0];
      if (t) {
        dragRef.current = { id: t.identifier, lx: t.clientX, ly: t.clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (paused) {
        return;
      }
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === dragRef.current.id) {
          posRef.current.x += (t.clientX - dragRef.current.lx) * 0.6;
          posRef.current.y += (t.clientY - dragRef.current.ly) * 0.6;
          dragRef.current.lx = t.clientX;
          dragRef.current.ly = t.clientY;
        }
      }
    };

    const onTouchEnd = () => {
      dragRef.current.id = null;
    };

    window.addEventListener('resize', fit);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    fc.addEventListener('touchstart', onTouchStart, { passive: true });
    fc.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    let raf = 0;
    const draw = () => {
      if (!paused) {
        if (keys['KeyW'] || keys['ArrowUp']) {
          posRef.current.y -= 3;
        }
        if (keys['KeyS'] || keys['ArrowDown']) {
          posRef.current.y += 3;
        }
        if (keys['KeyA'] || keys['ArrowLeft']) {
          posRef.current.x -= 3;
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
          posRef.current.x += 3;
        }
        posRef.current.x += joyVecRef.current.x * 3;
        posRef.current.y += joyVecRef.current.y * 3;
      }

      g.fillStyle = '#181a1f';
      g.fillRect(0, 0, fc.width, fc.height);
      const meta = SCENES_META[sceneIdx];
      g.fillStyle = '#cbb893';
      g.font = '17px sans-serif';
      g.textAlign = 'center';
      g.fillText(`${meta.name}（轻量视图回退模式）`, fc.width / 2, fc.height / 2 - 34);
      g.fillStyle = '#9da1a8';
      g.font = '12.5px sans-serif';
      g.fillText(
        message || '当前环境未能创建 WebGL 上下文，已切换至轻量视图模式',
        fc.width / 2,
        fc.height / 2,
      );
      if (meta.id in BOOKS) {
        g.fillStyle = '#e2cf9e';
        g.fillText(
          '此场景内含长篇读本，按 E 或点击右下「互动」可打开阅读',
          fc.width / 2,
          fc.height / 2 + 28,
        );
      }
      g.fillStyle = 'rgba(200,180,140,0.45)';
      g.beginPath();
      g.arc(
        fc.width / 2 + posRef.current.x,
        fc.height / 2 + 86 + posRef.current.y,
        12,
        0,
        Math.PI * 2,
      );
      g.fill();
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', fit);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      fc.removeEventListener('touchstart', onTouchStart);
      fc.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [
    message,
    sceneIdx,
    paused,
    immersive,
    joyVecRef,
    onOpenBook,
    onPrevScene,
    onNextScene,
    onCloseModalOrPanels,
    onToggleImmersive,
    onExitImmersive,
  ]);

  return (
    <>
      <canvas ref={canvasRef} id="fallback" className="open" />
      <button
        type="button"
        className="btn open"
        id="fb-retry"
        onClick={onRetry}
      >
        重试加载 3D
      </button>
    </>
  );
}

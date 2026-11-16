import { useEffect, useRef } from 'react';

interface TouchControlsProps {
  visible: boolean;
  paused: boolean;
  onJoyChange: (x: number, y: number) => void;
  onTouchActive: () => void;
  onJump: () => void;
  onInteract: () => void;
}

export function TouchControls({
  visible,
  paused,
  onJoyChange,
  onTouchActive,
  onJump,
  onInteract,
}: TouchControlsProps) {
  const joyZoneRef = useRef<HTMLDivElement>(null);
  const joyKnobRef = useRef<HTMLDivElement>(null);
  const joyIdRef = useRef<number | null>(null);

  const onJoyChangeRef = useRef(onJoyChange);
  const onTouchActiveRef = useRef(onTouchActive);
  onJoyChangeRef.current = onJoyChange;
  onTouchActiveRef.current = onTouchActive;

  useEffect(() => {
    if (!visible || paused) {
      joyIdRef.current = null;
      if (joyKnobRef.current) {
        joyKnobRef.current.style.transform = '';
      }
      onJoyChangeRef.current(0, 0);
    }
  }, [visible, paused]);

  useEffect(() => {
    const zone = joyZoneRef.current;
    if (!zone) {
      return;
    }

    const updateJoy = (cx: number, cy: number) => {
      const r = zone.getBoundingClientRect();
      let dx = cx - (r.left + r.width / 2);
      let dy = cy - (r.top + r.height / 2);
      const max = 56;
      const d = Math.hypot(dx, dy);
      if (d > max) {
        dx = (dx / d) * max;
        dy = (dy / d) * max;
      }
      if (joyKnobRef.current) {
        joyKnobRef.current.style.transform = `translate(${dx}px,${dy}px)`;
      }
      onJoyChangeRef.current(dx / max, dy / max);
    };

    const resetJoy = () => {
      joyIdRef.current = null;
      if (joyKnobRef.current) {
        joyKnobRef.current.style.transform = '';
      }
      onJoyChangeRef.current(0, 0);
    };

    const onStart = (e: TouchEvent) => {
      onTouchActiveRef.current();
      if (paused) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      const t = e.changedTouches[0];
      if (t) {
        joyIdRef.current = t.identifier;
        updateJoy(t.clientX, t.clientY);
      }
    };

    const onMove = (e: TouchEvent) => {
      if (paused) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === joyIdRef.current) {
          updateJoy(t.clientX, t.clientY);
        }
      }
    };

    const onEnd = (e: TouchEvent) => {
      e.stopPropagation();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joyIdRef.current) {
          resetJoy();
        }
      }
    };

    const onCancel = (e: TouchEvent) => {
      e.stopPropagation();
      resetJoy();
    };

    zone.addEventListener('touchstart', onStart, { passive: false });
    zone.addEventListener('touchmove', onMove, { passive: false });
    zone.addEventListener('touchend', onEnd);
    zone.addEventListener('touchcancel', onCancel);

    return () => {
      zone.removeEventListener('touchstart', onStart);
      zone.removeEventListener('touchmove', onMove);
      zone.removeEventListener('touchend', onEnd);
      zone.removeEventListener('touchcancel', onCancel);
    };
  }, [paused]);

  return (
    <div id="touch-ui" className={visible ? 'visible' : ''}>
      <div id="joy-zone" ref={joyZoneRef}>
        <div id="joy-knob" ref={joyKnobRef} />
      </div>
      <button
        type="button"
        id="touch-jump"
        aria-label="跳跃"
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onTouchActive();
          onJump();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onJump();
        }}
      >
        跳跃
      </button>
      <button
        type="button"
        id="touch-act"
        aria-label="互动"
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onTouchActive();
          onInteract();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onInteract();
        }}
      >
        互动
      </button>
    </div>
  );
}

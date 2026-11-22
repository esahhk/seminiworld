import { useRef, type RefObject } from 'react';
import { SCENES_META } from '../data/scenesMeta';
import type { PanelId, TruckGear, VehicleHudState } from '../types/game';

interface HudOverlayProps {
  sceneIdx: number;
  sceneName: string;
  inCity: boolean;
  vehicle: VehicleHudState;
  whisperText: string;
  whisperVisible: boolean;
  collectedCount: number;
  activePanel: PanelId;
  immersive: boolean;
  promptHit: boolean;
  promptText: string;
  showMinimap: boolean;
  minimapRef: RefObject<HTMLCanvasElement | null>;
  onPrevScene: () => void;
  onNextScene: () => void;
  onEnterCity: () => void;
  onSummonTruck: () => void;
  onToggleDrive: () => void;
  onHonkTruck: () => void;
  onShiftGear: (gear: TruckGear) => void;
  onDriveSteer: (steer: number) => void;
  onDrivePedal: (pedal: 'gas' | 'brake', pressed: boolean) => void;
  onDriveHandbrake: (pressed: boolean) => void;
  onTogglePanel: (panel: Exclude<PanelId, null>) => void;
  onReset: () => void;
  onToggleImmersive: () => void;
  onPromptClick: () => void;
}

const GEARS: { id: TruckGear; label: string; keyHint: string }[] = [
  { id: 'P', label: '驻车', keyHint: '1' },
  { id: 'R', label: '倒车', keyHint: '2' },
  { id: 'N', label: '空挡', keyHint: '3' },
  { id: 'D', label: '前进', keyHint: '4' },
];

export function HudOverlay({
  sceneIdx,
  sceneName,
  inCity,
  vehicle,
  whisperText,
  whisperVisible,
  collectedCount,
  activePanel,
  immersive,
  promptHit,
  promptText,
  showMinimap,
  minimapRef,
  onPrevScene,
  onNextScene,
  onEnterCity,
  onSummonTruck,
  onToggleDrive,
  onHonkTruck,
  onShiftGear,
  onDriveSteer,
  onDrivePedal,
  onDriveHandbrake,
  onTogglePanel,
  onReset,
  onToggleImmersive,
  onPromptClick,
}: HudOverlayProps) {
  const visibleTotal = SCENES_META.filter((m) => !m.hidden).length;
  const isHiddenScene = Boolean(SCENES_META[sceneIdx]?.hidden);
  const wheelDraggingRef = useRef(false);
  const wheelStartXRef = useRef(0);

  return (
    <>
      <div id="hud">
        <div className="top-left">
          <div className="scene-badge">
            <span className="scene-idx" id="ui-idx">
              {inCity
                ? 'CITY'
                : isHiddenScene
                  ? '??/??'
                  : `${String(sceneIdx + 1).padStart(2, '0')}/${visibleTotal}`}
            </span>
            <span className="scene-divider" aria-hidden="true" />
            <span className="scene-name" id="ui-name">
              {inCity ? '微缩城市枢纽' : sceneName}
            </span>
          </div>
          <div className={`whisper${whisperVisible ? ' show' : ''}`} id="ui-whisper">
            {whisperText}
          </div>
        </div>

        <div className="top-right">
          <button
            type="button"
            className="btn btn-icon"
            id="btn-prev"
            aria-label="上一处场景"
            title="上一处 ["
            onClick={onPrevScene}
          >
            ◀
          </button>
          <button
            type="button"
            className="btn btn-icon"
            id="btn-next"
            aria-label="下一处场景"
            title="下一处 ]"
            onClick={onNextScene}
          >
            ▶
          </button>
          <button
            type="button"
            className={`btn btn-world${inCity ? ' active' : ''}`}
            id="btn-scenes"
            onClick={onEnterCity}
          >
            <svg className="world-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.2" />
              <path d="M8 2.8L9.6 6.4L13.2 8L9.6 9.6L8 13.2L6.4 9.6L2.8 8L6.4 6.4Z" stroke="currentColor" strokeWidth="1.1" />
            </svg>
            {inCity ? '返回现场' : '切换世界'}
          </button>
          <button
            type="button"
            className={`btn${activePanel === 'col' ? ' active' : ''}`}
            id="btn-col"
            onClick={() => onTogglePanel('col')}
          >
            拾遗{' '}
            <span className="num-tab" id="col-count">
              {collectedCount}/{visibleTotal}
            </span>
          </button>
          <button type="button" className="btn" id="btn-reset" onClick={onReset}>
            重置
          </button>
          <button
            type="button"
            className={`btn${activePanel === 'set' ? ' active' : ''}`}
            id="btn-set"
            onClick={() => onTogglePanel('set')}
          >
            设置
          </button>
          <button
            type="button"
            className={`btn${immersive ? ' active' : ''}`}
            id="btn-immersive"
            title="隐藏界面沉浸游览 (F)"
            onClick={onToggleImmersive}
          >
            沉浸 [F]
          </button>
        </div>

        <div id="reticle" className={promptHit ? 'hit' : ''} />
        <div
          id="prompt"
          role="button"
          tabIndex={promptHit ? 0 : -1}
          className={promptHit ? 'show' : ''}
          onClick={(e) => {
            e.stopPropagation();
            onPromptClick();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onPromptClick();
            }
          }}
        >
          {promptText}
        </div>

        {showMinimap && (
          <div id="minimap-wrap">
            <canvas ref={minimapRef} id="minimap" width={128} height={128} />
          </div>
        )}

        {inCity && !vehicle.driving && (
          <div id="city-dock">
            <button
              type="button"
              className="btn dock-btn"
              id="btn-summon-truck"
              onClick={(e) => {
                e.stopPropagation();
                onSummonTruck();
              }}
            >
              {vehicle.summoned ? '重新召唤卡车 [G]' : '召唤厢式卡车 [G]'}
            </button>
            <button
              type="button"
              className="btn dock-btn"
              id="btn-drive-truck"
              onClick={(e) => {
                e.stopPropagation();
                onToggleDrive();
              }}
            >
              上车驾驶 [E]
            </button>
            {vehicle.summoned && (
              <button
                type="button"
                className="btn dock-btn"
                id="btn-horn-truck"
                onClick={(e) => {
                  e.stopPropagation();
                  onHonkTruck();
                }}
              >
                鸣笛 [H]
              </button>
            )}
          </div>
        )}

        {inCity && vehicle.driving && (
          <div id="drive-cockpit" onClick={(e) => e.stopPropagation()}>
            <div className="cockpit-steer-cluster">
              <button
                type="button"
                className="steer-key-btn"
                id="btn-steer-left"
                aria-label="左打方向"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  onDriveSteer(1);
                }}
                onPointerUp={() => onDriveSteer(0)}
                onPointerCancel={() => onDriveSteer(0)}
                onLostPointerCapture={() => onDriveSteer(0)}
              >
                ◀ 左转 [A]
              </button>

              <div
                className="steering-wheel-wrap"
                id="steering-wheel"
                role="slider"
                aria-label="方向盘转动"
                aria-valuemin={-420}
                aria-valuemax={420}
                aria-valuenow={vehicle.steerDeg}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  wheelDraggingRef.current = true;
                  wheelStartXRef.current = e.clientX;
                }}
                onPointerMove={(e) => {
                  if (!wheelDraggingRef.current) {
                    return;
                  }
                  const dx = e.clientX - wheelStartXRef.current;
                  const val = Math.max(-1, Math.min(1, -dx / 68));
                  onDriveSteer(val);
                }}
                onPointerUp={() => {
                  wheelDraggingRef.current = false;
                  onDriveSteer(0);
                }}
                onPointerCancel={() => {
                  wheelDraggingRef.current = false;
                  onDriveSteer(0);
                }}
                onLostPointerCapture={() => {
                  wheelDraggingRef.current = false;
                  onDriveSteer(0);
                }}
              >
                <svg
                  className="steering-wheel-svg"
                  viewBox="0 0 96 96"
                  style={{ transform: `rotate(${vehicle.steerDeg}deg)` }}
                >
                  <circle cx="48" cy="48" r="41" fill="none" stroke="#2f353d" strokeWidth="9" />
                  <circle cx="48" cy="48" r="41" fill="none" stroke="#d8cfc0" strokeWidth="1.5" opacity="0.55" />
                  <rect x="44" y="6" width="8" height="7" rx="1" fill="#c9a55c" />
                  <path d="M48 48 L12 48 M48 48 L84 48 M48 48 L48 86" stroke="#2a2f36" strokeWidth="7" strokeLinecap="round" />
                  <circle cx="48" cy="48" r="12" fill="#181b20" stroke="#7d7668" strokeWidth="1.5" />
                  <circle cx="48" cy="48" r="4" fill="#c9a55c" />
                </svg>
              </div>

              <button
                type="button"
                className="steer-key-btn"
                id="btn-steer-right"
                aria-label="右打方向"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  onDriveSteer(-1);
                }}
                onPointerUp={() => onDriveSteer(0)}
                onPointerCancel={() => onDriveSteer(0)}
                onLostPointerCapture={() => onDriveSteer(0)}
              >
                右转 [D] ▶
              </button>
            </div>

            <div className="cockpit-center-cluster">
              <div className="speed-readout" id="truck-speed">
                <span className="speed-num">{vehicle.speedKmh}</span>
                <span className="speed-unit">KM/H</span>
              </div>

              <div className="gear-rack" id="gear-shifter" role="group" aria-label="排挡杆挡位">
                {GEARS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    id={`btn-gear-${g.id}`}
                    className={`gear-slot${vehicle.gear === g.id ? ' on' : ''}`}
                    title={`${g.label} (${g.keyHint})`}
                    onClick={() => onShiftGear(g.id)}
                  >
                    <span className="gear-code">{g.id}</span>
                    <span className="gear-sub">{g.label}</span>
                  </button>
                ))}
              </div>

              <div className="cab-actions">
                <button
                  type="button"
                  className="btn cab-btn"
                  id="btn-horn-truck"
                  onClick={onHonkTruck}
                >
                  鸣笛 [H]
                </button>
                <button
                  type="button"
                  className="btn cab-btn"
                  id="btn-summon-truck"
                  onClick={onSummonTruck}
                >
                  重置车位 [G]
                </button>
                <button
                  type="button"
                  className="btn cab-btn exit"
                  id="btn-drive-truck"
                  onClick={onToggleDrive}
                >
                  下车 [E]
                </button>
              </div>
            </div>

            <div className="cockpit-pedal-cluster">
              <button
                type="button"
                className={`pedal-btn hb${vehicle.handbrake ? ' on' : ''}`}
                id="btn-pedal-hb"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  onDriveHandbrake(true);
                }}
                onPointerUp={() => onDriveHandbrake(false)}
                onPointerCancel={() => onDriveHandbrake(false)}
                onLostPointerCapture={() => onDriveHandbrake(false)}
              >
                <span className="pedal-lbl">手刹</span>
                <span className="pedal-key">SPACE</span>
              </button>
              <button
                type="button"
                className="pedal-btn brake"
                id="btn-pedal-brake"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  onDrivePedal('brake', true);
                }}
                onPointerUp={() => onDrivePedal('brake', false)}
                onPointerCancel={() => onDrivePedal('brake', false)}
                onLostPointerCapture={() => onDrivePedal('brake', false)}
              >
                <span className="pedal-lbl">刹车</span>
                <span className="pedal-key">S / ↓</span>
              </button>
              <button
                type="button"
                className="pedal-btn gas"
                id="btn-pedal-gas"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  onDrivePedal('gas', true);
                }}
                onPointerUp={() => onDrivePedal('gas', false)}
                onPointerCancel={() => onDrivePedal('gas', false)}
                onLostPointerCapture={() => onDrivePedal('gas', false)}
              >
                <span className="pedal-lbl">油门</span>
                <span className="pedal-key">W / ↑</span>
              </button>
            </div>
          </div>
        )}

        <div id="subbar">
          {vehicle.driving
            ? '1~4 或 Q/Z 切换 P·R·N·D 挡 · A/D 或拖拽方向盘转向 · W/S 油门刹车 · E 下车'
            : inCity
              ? 'WASD 移动 · G 召唤厢式卡车 · E 进建筑或上车 · F 沉浸 · [ ] 切景'
              : 'WASD 移动 · Shift 加速 · 空格跳跃 · 鼠标环视 · E 互动 · F 沉浸 · [ ] 切景'}
        </div>
      </div>

      <button
        type="button"
        id="btn-exit-imm"
        aria-label="退出沉浸模式"
        onClick={onToggleImmersive}
      >
        退出沉浸 [F / Esc]
      </button>
    </>
  );
}

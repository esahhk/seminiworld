import type { RefObject } from 'react';
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
  onDriveTurbo: (pressed: boolean) => void;
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
  onDriveTurbo,
  onTogglePanel,
  onReset,
  onToggleImmersive,
  onPromptClick,
}: HudOverlayProps) {
  const visibleTotal = SCENES_META.filter((m) => !m.hidden).length;
  const isHiddenScene = Boolean(SCENES_META[sceneIdx]?.hidden);
  const steerPct = Math.max(-44, Math.min(44, (vehicle.steerDeg / 420) * 44));

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
              <path
                d="M8 2.8L9.6 6.4L13.2 8L9.6 9.6L8 13.2L6.4 9.6L2.8 8L6.4 6.4Z"
                stroke="currentColor"
                strokeWidth="1.1"
              />
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
            <div className="cockpit-left">
              <div className="steer-pad-row">
                <button
                  type="button"
                  className={`steer-paddle${vehicle.steerDeg < -18 ? ' on' : ''}`}
                  id="btn-steer-left"
                  aria-label="向左转向"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    onDriveSteer(1);
                  }}
                  onPointerUp={() => onDriveSteer(0)}
                  onPointerCancel={() => onDriveSteer(0)}
                  onLostPointerCapture={() => onDriveSteer(0)}
                >
                  <span className="steer-arrow">◀</span>
                  <span className="steer-txt">左转 [A]</span>
                </button>
                <button
                  type="button"
                  className={`steer-paddle${vehicle.steerDeg > 18 ? ' on' : ''}`}
                  id="btn-steer-right"
                  aria-label="向右转向"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    onDriveSteer(-1);
                  }}
                  onPointerUp={() => onDriveSteer(0)}
                  onPointerCancel={() => onDriveSteer(0)}
                  onLostPointerCapture={() => onDriveSteer(0)}
                >
                  <span className="steer-txt">右转 [D]</span>
                  <span className="steer-arrow">▶</span>
                </button>
              </div>
              <div className="steer-track" aria-hidden="true">
                <span className="steer-center-mark" />
                <span
                  className="steer-thumb"
                  style={{ left: `calc(50% + ${steerPct}%)` }}
                />
              </div>
            </div>

            <div className="cockpit-telemetry">
              <div className="telemetry-head">
                <div className="speed-block" id="truck-speed">
                  <span className="speed-num">{vehicle.speedKmh}</span>
                  <span className="speed-unit">KM/H</span>
                  {vehicle.turbo && <span className="status-tag turbo">TURBO</span>}
                  {Math.abs(vehicle.driftDeg) >= 8 && (
                    <span className="status-tag drift">DRIFT</span>
                  )}
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
              </div>

              <div className="telemetry-bars">
                <div className="meter-row">
                  <span className="meter-lbl">RPM</span>
                  <div className="meter-track">
                    <div
                      className="meter-fill rpm"
                      style={{ width: `${Math.max(8, Math.min(100, vehicle.rpmPct))}%` }}
                    />
                  </div>
                </div>
                <div className="meter-row">
                  <span className="meter-lbl">N2O</span>
                  <div className="meter-track">
                    <div
                      className={`meter-fill boost${vehicle.turbo ? ' active' : ''}`}
                      style={{ width: `${Math.max(0, Math.min(100, vehicle.boostPct))}%` }}
                    />
                  </div>
                </div>
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

            <div className="cockpit-right">
              <div className="pedal-deck">
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
                  <span className="pedal-key">S / 倒</span>
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
                <button
                  type="button"
                  className={`pedal-btn turbo${vehicle.turbo ? ' on' : ''}`}
                  id="btn-pedal-turbo"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    onDriveTurbo(true);
                  }}
                  onPointerUp={() => onDriveTurbo(false)}
                  onPointerCancel={() => onDriveTurbo(false)}
                  onLostPointerCapture={() => onDriveTurbo(false)}
                >
                  <span className="pedal-lbl">氮气</span>
                  <span className="pedal-key">SHIFT</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div id="subbar">
          {vehicle.driving
            ? 'W/S 油门与刹车倒车 · A/D 转向 · Shift 氮气加速 · 空格手刹漂移 · 1~4 切挡 · E 下车'
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

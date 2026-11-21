import type { RefObject } from 'react';
import { SCENES_META } from '../data/scenesMeta';
import type { PanelId, VehicleHudState } from '../types/game';

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
  onTogglePanel: (panel: Exclude<PanelId, null>) => void;
  onReset: () => void;
  onToggleImmersive: () => void;
  onPromptClick: () => void;
}

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
  onTogglePanel,
  onReset,
  onToggleImmersive,
  onPromptClick,
}: HudOverlayProps) {
  const visibleTotal = SCENES_META.filter((m) => !m.hidden).length;
  const isHiddenScene = Boolean(SCENES_META[sceneIdx]?.hidden);

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
            <span id="ui-name">{inCity ? '微缩城市' : sceneName}</span>
          </div>
          <div className={`whisper${whisperVisible ? ' show' : ''}`} id="ui-whisper">
            {whisperText}
          </div>
        </div>

        <div className="top-right">
          <button
            type="button"
            className="btn"
            id="btn-prev"
            aria-label="上一处场景"
            title="上一处 ["
            onClick={onPrevScene}
          >
            ◀
          </button>
          <button
            type="button"
            className="btn"
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
            <span className="world-dot" aria-hidden="true" />
            {inCity ? '返回现场' : '切换世界'}
          </button>
          <button
            type="button"
            className={`btn${activePanel === 'col' ? ' active' : ''}`}
            id="btn-col"
            onClick={() => onTogglePanel('col')}
          >
            拾遗{' '}
            <span id="col-count">
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

        {inCity && (
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
              className={`btn dock-btn${vehicle.driving ? ' active' : ''}`}
              id="btn-drive-truck"
              onClick={(e) => {
                e.stopPropagation();
                onToggleDrive();
              }}
            >
              {vehicle.driving ? '下车 [E]' : '驾驶卡车 [E]'}
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
            {vehicle.driving && (
              <div className="speed-pill" id="truck-speed">
                <span className="gear-tag">{vehicle.gear}</span>
                <span>{vehicle.speedKmh} km/h</span>
              </div>
            )}
          </div>
        )}

        <div id="subbar">
          {vehicle.driving
            ? 'W/S 油门倒车 · A/D 转向 · 空格手刹 · H 鸣笛 · E 下车 · 拖动环视'
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

import type { RefObject } from 'react';
import { SCENES_META } from '../data/scenesMeta';
import type { PanelId } from '../types/game';

interface HudOverlayProps {
  sceneIdx: number;
  sceneName: string;
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
  onTogglePanel: (panel: Exclude<PanelId, null>) => void;
  onReset: () => void;
  onToggleImmersive: () => void;
  onPromptClick: () => void;
}

export function HudOverlay({
  sceneIdx,
  sceneName,
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
              {isHiddenScene ? '??/??' : `${String(sceneIdx + 1).padStart(2, '0')}/${visibleTotal}`}
            </span>
            <span id="ui-name">{sceneName}</span>
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
            className={`btn btn-world${activePanel === 'scenes' ? ' active' : ''}`}
            id="btn-scenes"
            onClick={() => onTogglePanel('scenes')}
          >
            <span className="world-dot" aria-hidden="true" />
            切换世界
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

        <div id="subbar">
          WASD 移动 · Shift 加速 · 空格跳跃 · 鼠标环视 · E 互动 · F 沉浸 · [ ] 切景
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

import { SCENES_META } from '../data/scenesMeta';
import type { PanelId, PerfMode, SceneId, TouchMode } from '../types/game';

interface PanelsProps {
  activePanel: PanelId;
  sceneIdx: number;
  collected: Set<SceneId>;
  resScale: number;
  perf: PerfMode;
  audioOn: boolean;
  touchMode: TouchMode;
  fov: number;
  immersive: boolean;
  onClose: () => void;
  onSelectScene: (idx: number) => void;
  onInspectCollectible: (title: string, body: string) => void;
  onChangeRes: (val: number) => void;
  onChangePerf: (val: PerfMode) => void;
  onChangeAudio: (val: boolean) => void;
  onChangeTouch: (val: TouchMode) => void;
  onChangeFov: (val: number) => void;
  onToggleImmersive: () => void;
}

export function Panels({
  activePanel,
  sceneIdx,
  collected,
  resScale,
  perf,
  audioOn,
  touchMode,
  fov,
  immersive,
  onClose,
  onSelectScene,
  onInspectCollectible,
  onChangeRes,
  onChangePerf,
  onChangeAudio,
  onChangeTouch,
  onChangeFov,
  onToggleImmersive,
}: PanelsProps) {
  const total = SCENES_META.length;

  return (
    <>
      <div className={`panel${activePanel === 'scenes' ? ' open' : ''}`} id="panel-scenes">
        <h3>
          <span>十七处漫游目录（点击直达）</span>
          <button type="button" className="btn" onClick={onClose}>
            关闭
          </button>
        </h3>
        <div className="scene-grid" id="scene-grid">
          {SCENES_META.map((m, i) => (
            <button
              key={m.id}
              type="button"
              className={`sc-item${i === sceneIdx ? ' cur' : ''}`}
              onClick={() => {
                onSelectScene(i);
                onClose();
              }}
            >
              <span className="sc-num">{String(i + 1).padStart(2, '0')}</span>
              <span>{m.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={`panel${activePanel === 'col' ? ' open' : ''}`} id="panel-col">
        <h3>
          <span>
            旧物拾遗 ({collected.size}/{total})
          </span>
          <button type="button" className="btn" onClick={onClose}>
            关闭
          </button>
        </h3>
        <div className="col-list" id="col-list">
          {SCENES_META.map((m, i) => {
            const got = collected.has(m.id);
            return (
              <button
                key={m.id}
                type="button"
                className={`col-item ${got ? 'got' : 'miss'}`}
                disabled={!got}
                onClick={() => {
                  if (got) {
                    onInspectCollectible(m.item, `${m.desc}\n\n发现地：${m.name}`);
                  }
                }}
              >
                <span>
                  {String(i + 1).padStart(2, '0')} · {got ? m.item : '未寻得'}
                </span>
                <span>{got ? m.name : '?'}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`panel${activePanel === 'set' ? ' open' : ''}`} id="panel-set">
        <h3>
          <span>画面与操作</span>
          <button type="button" className="btn" onClick={onClose}>
            关闭
          </button>
        </h3>

        <div className="set-row">
          <span>分辨率倍率</span>
          <div className="seg" id="seg-res">
            <button
              type="button"
              className={resScale === 0.75 ? 'on' : ''}
              onClick={() => onChangeRes(0.75)}
            >
              0.75x
            </button>
            <button
              type="button"
              className={resScale === 1 ? 'on' : ''}
              onClick={() => onChangeRes(1)}
            >
              1x
            </button>
            <button
              type="button"
              className={resScale === 1.5 ? 'on' : ''}
              onClick={() => onChangeRes(1.5)}
            >
              1.5x
            </button>
          </div>
        </div>

        <div className="set-row">
          <span>渲染质量</span>
          <div className="seg" id="seg-perf">
            <button
              type="button"
              className={perf === 'high' ? 'on' : ''}
              onClick={() => onChangePerf('high')}
            >
              光影柔和
            </button>
            <button
              type="button"
              className={perf === 'fast' ? 'on' : ''}
              onClick={() => onChangePerf('fast')}
            >
              流畅优先
            </button>
          </div>
        </div>

        <div className="set-row">
          <span>环境音效与脚步</span>
          <div className="seg" id="seg-audio">
            <button
              type="button"
              className={audioOn ? 'on' : ''}
              onClick={() => onChangeAudio(true)}
            >
              开
            </button>
            <button
              type="button"
              className={!audioOn ? 'on' : ''}
              onClick={() => onChangeAudio(false)}
            >
              关
            </button>
          </div>
        </div>

        <div className="set-row">
          <span>触屏虚拟摇杆</span>
          <div className="seg" id="seg-touch">
            <button
              type="button"
              className={touchMode === 'auto' ? 'on' : ''}
              onClick={() => onChangeTouch('auto')}
            >
              自动
            </button>
            <button
              type="button"
              className={touchMode === '1' ? 'on' : ''}
              onClick={() => onChangeTouch('1')}
            >
              显示
            </button>
            <button
              type="button"
              className={touchMode === '0' ? 'on' : ''}
              onClick={() => onChangeTouch('0')}
            >
              隐藏
            </button>
          </div>
        </div>

        <div className="set-row">
          <span>视野广角 FOV</span>
          <div className="seg" id="seg-fov">
            <button
              type="button"
              className={fov === 55 ? 'on' : ''}
              onClick={() => onChangeFov(55)}
            >
              55°
            </button>
            <button
              type="button"
              className={fov === 68 ? 'on' : ''}
              onClick={() => onChangeFov(68)}
            >
              68°
            </button>
            <button
              type="button"
              className={fov === 82 ? 'on' : ''}
              onClick={() => onChangeFov(82)}
            >
              82°
            </button>
          </div>
        </div>

        <div className="set-row">
          <span>沉浸模式（隐藏界面）</span>
          <button type="button" className="btn" id="btn-set-imm" onClick={onToggleImmersive}>
            {immersive ? '退出沉浸' : '进入沉浸 [F]'}
          </button>
        </div>
      </div>
    </>
  );
}

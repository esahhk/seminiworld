interface LoaderOverlayProps {
  visible: boolean;
  hiding: boolean;
}

export function LoaderOverlay({ visible, hiding }: LoaderOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div id="loader" className={hiding ? 'hide' : ''} aria-live="polite">
      <div className="ld-title">路过十七处</div>
      <div className="ld-bar">
        <div className="ld-fill" />
      </div>
      <div className="ld-sub">正在铺陈场景与微光……</div>
    </div>
  );
}

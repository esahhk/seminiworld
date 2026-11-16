import { useEffect, useRef } from 'react';
import { BOOKS } from '../data/books';
import type { BookKey, ModalConfig } from '../types/game';

interface InspectModalProps {
  modal: ModalConfig | null;
  progText: string;
  onClose: () => void;
  onSelectBookPage: (key: BookKey, pageIdx: number) => void;
  onTogglePaper: (key: BookKey) => void;
  onBodyScroll: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  restoreScrollTop: number | null;
}

export function InspectModal({
  modal,
  progText,
  onClose,
  onSelectBookPage,
  onTogglePaper,
  onBodyScroll,
  restoreScrollTop,
}: InspectModalProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!modal || !bodyRef.current) {
      return;
    }
    const el = bodyRef.current;
    const raf = requestAnimationFrame(() => {
      el.scrollTop = restoreScrollTop ?? 0;
      onBodyScroll(el.scrollTop, el.scrollHeight, el.clientHeight);
    });
    return () => cancelAnimationFrame(raf);
  }, [modal?.mode, modal?.bookKey, modal?.bookPage, modal?.title, restoreScrollTop, onBodyScroll]);

  const isOpen = modal !== null;
  const isBook = modal?.mode === 'book' && modal.bookKey !== undefined;
  const book = isBook && modal.bookKey ? BOOKS[modal.bookKey] : null;
  const curPage = modal?.bookPage ?? 0;

  return (
    <>
      <div
        id="modal-backdrop"
        className={isOpen ? 'open' : ''}
        onClick={onClose}
      />
      <div
        id="inspect-modal"
        className={[
          isOpen ? 'open' : '',
          isBook ? 'reader' : '',
          modal?.paper ? 'paper' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        role="dialog"
        aria-modal={isOpen}
        aria-labelledby="inspect-title"
      >
        <div id="inspect-title">{modal?.title ?? ''}</div>
        <div id="inspect-sub">
          <span id="inspect-meta">{modal?.meta ?? ''}</span>
          <span id="inspect-prog">{progText}</span>
        </div>

        <div id="inspect-chapters">
          {book &&
            modal?.bookKey &&
            book.pages.map((p, idx) => (
              <button
                key={p.label}
                type="button"
                className={`chap-btn${idx === curPage ? ' on' : ''}`}
                onClick={() => onSelectBookPage(modal.bookKey!, idx)}
              >
                {p.label}
              </button>
            ))}
        </div>

        <div
          id="inspect-body"
          ref={bodyRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            onBodyScroll(el.scrollTop, el.scrollHeight, el.clientHeight);
          }}
        >
          {modal?.body ?? ''}
        </div>

        <div id="inspect-actions">
          {isBook && book && modal?.bookKey ? (
            <>
              <div className="act-left">
                <button
                  type="button"
                  className="btn"
                  disabled={curPage === 0}
                  onClick={() => onSelectBookPage(modal.bookKey!, curPage - 1)}
                >
                  上一章
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={curPage >= book.pages.length - 1}
                  onClick={() => onSelectBookPage(modal.bookKey!, curPage + 1)}
                >
                  下一章
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => onTogglePaper(modal.bookKey!)}
                >
                  {modal.paper ? '暗底夜间' : '纸色护眼'}
                </button>
              </div>
              <div className="act-right">
                <button type="button" className="btn" onClick={onClose}>
                  合上（记住位置）
                </button>
              </div>
            </>
          ) : (
            <div className="act-right">
              {(modal?.actions ?? []).map((act) => (
                <button
                  key={act.label}
                  type="button"
                  className="btn"
                  onClick={() => act.fn?.()}
                >
                  {act.label}
                </button>
              ))}
              {(modal?.actions ?? []).length === 0 && (
                <button type="button" className="btn" onClick={onClose}>
                  合上
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

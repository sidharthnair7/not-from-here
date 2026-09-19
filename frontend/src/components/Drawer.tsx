import React, { useEffect, useRef, useMemo } from 'react';
import { useStore } from '../state/store';
import { SP } from '../lib/species';
import { V } from '../lib/verdicts';
import { fmt } from '../lib/format';
import { makeTile, Sighting } from '../lib/tile';
import { drawArt } from '../lib/art';
import { Evidence } from './Evidence';

export const Drawer: React.FC = () => {
  const { drawer, closeDrawer, copyText } = useStore();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const { open, item, isReport } = drawer;

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      if (drawerRef.current) {
        drawerRef.current.scrollTop = 0;
      }
      // Focus close button on open
      setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 50);
    } else {
      // Restore focus to trigger on close
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }
  }, [open]);

  // Trap focus inside drawer and handle Escape
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDrawer();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, closeDrawer]);

  const thumbnail = useMemo(() => {
    if (!item) return '';
    const sp = SP[item.key] || SP.phragmites;
    if (isReport) {
      const sighting = item as Sighting;
      if (!sighting.tile) {
        sighting.tile = makeTile(sighting);
      }
      return sighting.tile.toDataURL();
    } else {
      const cv = document.createElement('canvas');
      cv.width = 240;
      cv.height = 226;
      const ctx = cv.getContext('2d');
      if (ctx) {
        drawArt(ctx, 240, 226, sp.kind, sp.hue, 200 + item.id.length * 7);
      }
      return cv.toDataURL();
    }
  }, [item, isReport]);

  if (!item) return null;

  const sp = SP[item.key] || SP.phragmites;
  const res = item.res;
  const t = V[res.verdict] || { label: res.verdict, tone: 'warn' };

  return (
    <>
      <div
        className={`scrim ${open ? 'on' : ''}`}
        id="scrim"
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <aside
        ref={drawerRef}
        id="drawer"
        className={open ? 'on' : ''}
        role="dialog"
        aria-modal="true"
        aria-label="Sighting evidence"
      >
        <button
          ref={closeBtnRef}
          className="x"
          id="dx"
          aria-label="Close"
          onClick={closeDrawer}
        >
          ×
        </button>
        <div className="dhead">
          <img src={thumbnail} alt={`${sp.common} photo`} />
          <div>
            <h3>{sp.name}</h3>
            <p>
              {sp.common}
              <br />
              {fmt(item.date)} · {item.place}
            </p>
            <span className="pill" data-t={t.tone}>
              {t.label}
            </span>
          </div>
        </div>
        <div className="dbody">
          <div className="kv">
            <b>{res.rule}.</b> {res.reason}
          </div>
          {res.report_text && (
            <div className="rep" style={{ margin: 0 }}>
              <h3>
                Drafted report{' '}
                <button
                  className="btn sm line"
                  id="dcp"
                  onClick={() => copyText(res.report_text || '', 'Report text copied')}
                >
                  Copy
                </button>
              </h3>
              <p>{res.report_text}</p>
            </div>
          )}
          <Evidence result={res} />
        </div>
      </aside>
    </>
  );
};

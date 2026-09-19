import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store';
import { Sphere } from '../lib/Sphere';
import { makeTile, Sighting } from '../lib/tile';
import { SP } from '../lib/species';
import { fmt } from '../lib/format';
import { useInView } from '../hooks/useInView';

export const SphereCanvas: React.FC = () => {
  const { sightings, newId, openDrawer } = useStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sphereRef = useRef<Sphere | null>(null);
  const [caption, setCaption] = useState<{ name: string; sub: string } | null>(null);
  const [containerRef, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });

  const sightingsRef = useRef(sightings);
  sightingsRef.current = sightings;
  const newIdRef = useRef(newId);
  newIdRef.current = newId;

  useEffect(() => {
    if (!inView) {
      if (sphereRef.current) {
        sphereRef.current.destroy();
        sphereRef.current = null;
      }
      return;
    }

    let isCancelled = false;
    let timeoutId: number | null = null;

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const fontPromise =
      document.fonts && document.fonts.ready
        ? Promise.race([document.fonts.ready, sleep(1200)])
        : Promise.resolve();

    fontPromise.then(() => {
      if (isCancelled || !canvasRef.current) return;

      if (sphereRef.current) {
        sphereRef.current.destroy();
        sphereRef.current = null;
      }

      const items = sightingsRef.current.map((s) => {
        if (!s.tile) {
          s.tile = makeTile(s);
        }
        return s as Sighting & { tile: HTMLCanvasElement };
      });

      const sphereInstance = new Sphere(
        canvasRef.current,
        items,
        (it) => openDrawer(it, true),
        (it) => {
          if (!it) {
            setCaption(null);
          } else {
            const sp = SP[it.key] || SP.phragmites;
            setCaption({
              name: sp.name,
              sub: `${sp.common} · ${fmt(it.date)} · ${it.place}`
            });
          }
        },
        () => newIdRef.current
      );

      sphereRef.current = sphereInstance;

      const freshIdx = items.findIndex((s) => s.id === newIdRef.current);
      if (freshIdx >= 0) {
        sphereInstance.focus(freshIdx);
        timeoutId = window.setTimeout(() => {
          if (isCancelled) return;
          const it = items[freshIdx];
          const sp = SP[it.key] || SP.phragmites;
          setCaption({
            name: sp.name,
            sub: 'Just added to the record'
          });
        }, 400);
      }
    });

    return () => {
      isCancelled = true;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      if (sphereRef.current) {
        sphereRef.current.destroy();
        sphereRef.current = null;
      }
    };
  }, [inView, openDrawer]);

  return (
    <div ref={containerRef} className="stage" id="stage">
      <canvas
        ref={canvasRef}
        id="cv"
        aria-label="Sphere of verified sightings. Use the list below for keyboard access."
      ></canvas>
      <div className="tip">Drag to spin</div>
      <div className="cap" id="cap" style={{ opacity: caption ? 1 : 0 }}>
        {caption && (
          <>
            <b>{caption.name}</b>
            <span>{caption.sub}</span>
          </>
        )}
      </div>
    </div>
  );
};

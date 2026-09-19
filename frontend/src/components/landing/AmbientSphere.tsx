import React, { useEffect, useRef } from 'react';
import { Sphere } from '../../lib/Sphere';
import { makeTile, Sighting } from '../../lib/tile';
import { seedSightings } from '../../lib/fixtures';
import { useInView } from '../../hooks/useInView';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export const AmbientSphere: React.FC = () => {
  const [containerRef, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sphereRef = useRef<Sphere | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!inView || reducedMotion || !canvasRef.current) {
      if (sphereRef.current) {
        sphereRef.current.destroy();
        sphereRef.current = null;
      }
      return;
    }

    const items = seedSightings().slice(0, 16).map((s) => {
      s.tile = makeTile(s);
      return s as Sighting & { tile: HTMLCanvasElement };
    });

    const sphereInstance = new Sphere(
      canvasRef.current,
      items,
      () => {},
      () => {}
    );
    sphereInstance.yaw = 0.2;
    sphereRef.current = sphereInstance;

    return () => {
      if (sphereRef.current) {
        sphereRef.current.destroy();
        sphereRef.current = null;
      }
    };
  }, [inView, reducedMotion]);

  return (
    <div ref={containerRef} className="ambient-sphere-wrap" aria-hidden="true">
      <canvas ref={canvasRef} className="ambient-sphere-canvas" />
    </div>
  );
};

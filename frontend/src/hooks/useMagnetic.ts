import { useRef, useEffect } from 'react';
import { useReducedMotion } from './useReducedMotion';

export function useMagnetic<T extends HTMLElement = HTMLButtonElement>() {
  const ref = useRef<T | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion) return;

    // Disable on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist < 80) {
        const pull = Math.min(6, dist * 0.15);
        const factor = dist > 0 ? pull / dist : 0;
        el.style.transition = 'transform 100ms ease-out';
        el.style.transform = `translate3d(${dx * factor}px, ${dy * factor}px, 0)`;
      }
    };

    const handlePointerLeave = () => {
      el.style.transition = 'transform 250ms cubic-bezier(0.2, 0.9, 0.3, 1.2)';
      el.style.transform = 'translate3d(0, 0, 0)';
    };

    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerleave', handlePointerLeave);
      el.style.transform = '';
      el.style.transition = '';
    };
  }, [reducedMotion]);

  return ref;
}

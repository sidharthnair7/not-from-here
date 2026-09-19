import { useRef, useEffect } from 'react';
import { useReducedMotion } from './useReducedMotion';

export function useSpotlight<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
    };

    el.addEventListener('pointermove', handlePointerMove);

    return () => {
      el.removeEventListener('pointermove', handlePointerMove);
    };
  }, [reducedMotion]);

  return ref;
}

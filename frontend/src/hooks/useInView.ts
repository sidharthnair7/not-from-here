import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseInViewOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {}
): [(node: T | null) => void, boolean] {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = false } = options;
  const [inView, setInView] = useState(false);
  const elementRef = useRef<T | null>(null);
  const isIntersectingRef = useRef(false);

  const updateState = useCallback(() => {
    const isDocVisible = typeof document !== 'undefined' ? !document.hidden : true;
    const shouldBeInView = isIntersectingRef.current && isDocVisible;
    setInView((prev) => {
      if (triggerOnce && prev) return true;
      return shouldBeInView;
    });
  }, [triggerOnce]);

  const setRef = useCallback((node: T | null) => {
    elementRef.current = node;
  }, []);

  useEffect(() => {
    const node = elementRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        isIntersectingRef.current = entry.isIntersecting;
        updateState();
      },
      { threshold, rootMargin }
    );

    observer.observe(node);

    const handleVisibility = () => {
      updateState();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [threshold, rootMargin, updateState]);

  return [setRef, inView];
}

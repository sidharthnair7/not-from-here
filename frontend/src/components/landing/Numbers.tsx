import React, { useState, useEffect } from 'react';
import { useInView } from '../../hooks/useInView';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTranslation } from '../../i18n/context';

export const Numbers: React.FC = () => {
  const [containerRef, inView] = useInView({ threshold: 0.3, triggerOnce: true });
  const reducedMotion = useReducedMotion();
  const { t } = useTranslation();

  const [n1, setN1] = useState(0);
  const [n2, setN2] = useState(0);
  const [n3, setN3] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reducedMotion) {
      setN1(4);
      setN2(2);
      setN3(50);
      return;
    }

    const duration = 1200;
    const start = performance.now();

    const frame = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(1, elapsed / duration);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setN1(Math.round(ease * 4));
      setN2(Math.round(ease * 2));
      setN3(Math.round(ease * 50));

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };

    requestAnimationFrame(frame);
  }, [inView, reducedMotion]);

  return (
    <section ref={containerRef} className="numbers-section" aria-label="Key gate metrics">
      <div className="wrap">
        <div className="numbers-grid card spot">
          <div className="num-stat">
            <b className="stat-val">{n1}</b>
            <span className="stat-label">{t('num1_label')}</span>
          </div>
          <div className="num-stat">
            <b className="stat-val">{n2}</b>
            <span className="stat-label">{t('num2_label')}</span>
          </div>
          <div className="num-stat">
            <b className="stat-val">{n3} km</b>
            <span className="stat-label">{t('num3_label')}</span>
          </div>
          <div className="num-stat">
            <b className="stat-val">0</b>
            <span className="stat-label">{t('num4_label')}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

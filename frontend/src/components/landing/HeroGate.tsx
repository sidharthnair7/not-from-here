import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SCEN } from '../../lib/fixtures';
import { SP } from '../../lib/species';
import { V, RULES, failIdx } from '../../lib/verdicts';
import { drawArt } from '../../lib/art';
import { IconForVerdict } from '../Icons';
import { useInView } from '../../hooks/useInView';
import { useTranslation } from '../../i18n/context';

const SCENARIO_KEYS = ['phragmites', 'split', 'slf', 'cattail'];

export const HeroGate: React.FC = () => {
  const [containerRef, inView] = useInView({ threshold: 0.2 });
  const [scenIndex, setScenIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [phase, setPhase] = useState<'running' | 'done'>('running');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const { t, lang } = useTranslation();

  const currentKey = SCENARIO_KEYS[scenIndex];
  const scenario = SCEN[currentKey];
  const res = scenario.res;
  const fi = failIdx(res.verdict);
  const sp = SP[scenario.key] || SP.phragmites;

  // Draw procedural canvas thumbnail
  useEffect(() => {
    if (canvasRef.current) {
      const cv = canvasRef.current;
      const c = cv.getContext('2d');
      if (c) {
        c.filter = scenario.blur ? `blur(${scenario.blur * 1.6}px)` : 'none';
        drawArt(c, 480, 270, sp.kind, sp.hue, scenario.seed);
      }
    }
  }, [scenario, sp]);

  // Step progression animation loop (~9s full cycle per scenario)
  const advanceStep = useCallback(() => {
    setStepIdx((prev) => {
      if (prev < 3) {
        if (fi && prev + 1 === fi) {
          setPhase('done');
          return prev;
        }
        return prev + 1;
      } else {
        setPhase('done');
        return prev;
      }
    });
  }, [fi]);

  useEffect(() => {
    if (!inView || isPaused) {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Reset to running step 0 on new scenario
    setPhase('running');
    setStepIdx(0);

    const stepTimer = window.setInterval(() => {
      advanceStep();
    }, 600);

    // After full evaluation, dwell on verdict, then move to next scenario
    const cycleTimer = window.setTimeout(() => {
      setScenIndex((prev) => (prev + 1) % SCENARIO_KEYS.length);
    }, 8800);

    return () => {
      clearInterval(stepTimer);
      clearTimeout(cycleTimer);
    };
  }, [inView, isPaused, scenIndex, advanceStep]);

  const handleTogglePause = () => {
    setIsPaused((p) => !p);
  };

  const handleReplay = () => {
    setScenIndex(0);
    setStepIdx(0);
    setPhase('running');
    setIsPaused(false);
  };

  const verdictTone = V[res.verdict]?.tone || 'warn';
  const verdictLabel = V[res.verdict]?.label || res.verdict;

  return (
    <div
      ref={containerRef}
      className="gate-demo card spot"
      aria-label="Interactive demo of the four-rule verification pipeline"
    >
      <div className="sr-only">
        Current automated demo evaluating {sp.name}. Decision: {verdictLabel}.
      </div>

      <div className="photo">
        <canvas ref={canvasRef} width={480} height={270} />
        <div className="chip">
          {sp.name} · {scenario.place}
        </div>
        <div className="hero-gate-controls">
          <button
            type="button"
            className="hero-ctrl-btn"
            onClick={handleTogglePause}
            aria-label={isPaused ? t('hero_gate_replay') : t('hero_gate_pause')}
            title={isPaused ? t('hero_gate_replay') : t('hero_gate_pause')}
          >
            {isPaused ? '▶' : '❚❚'}
          </button>
          <button
            type="button"
            className="hero-ctrl-btn"
            onClick={handleReplay}
            aria-label={t('hero_gate_replay')}
            title={t('hero_gate_replay')}
          >
            ↻
          </button>
        </div>
      </div>

      {/* Dynamic verdict banner */}
      <div
        className={`banner ${phase === 'done' ? 'pop' : ''}`}
        data-t={phase === 'done' ? verdictTone : 'idle'}
        aria-live="off"
      >
        <div className="v" style={{ gap: 12, alignItems: 'center' }}>
          {phase === 'done' ? (
            <IconForVerdict verdict={res.verdict} />
          ) : (
            <div className="spin" style={{ width: 26, height: 26 }} />
          )}
          <div>
            <h2>
              {phase === 'done'
                ? verdictLabel
                : lang === 'fr'
                ? 'Évaluation de 4 règles'
                : 'Evaluating four rules'}
            </h2>
            <p className="rule" style={{ margin: '4px 0 0', fontSize: 13 }}>
              {phase === 'done'
                ? res.rule
                : lang === 'fr'
                ? 'Chaque règle doit être validée pour continuer.'
                : 'Each rule must pass before the next runs.'}
            </p>
          </div>
        </div>
      </div>

      {/* 4 rule rows */}
      <ol className="steps" aria-live="off">
        {RULES.map((rule, i) => {
          let s = 'idle';
          if (phase === 'running') {
            if (i < stepIdx) s = 'pass';
            else if (i === stepIdx) s = 'running';
          } else {
            if (fi && i + 1 === fi) s = verdictTone === 'warn' ? 'warnfail' : 'fail';
            else if (fi && i + 1 > fi) s = 'skip';
            else s = 'pass';
          }

          const label =
            s === 'pass'
              ? 'passed'
              : s === 'fail' || s === 'warnfail'
              ? 'refused'
              : s === 'running'
              ? 'checking'
              : s === 'skip'
              ? 'not run'
              : '';

          return (
            <li key={i} className="step" data-s={s}>
              <span className="n">
                {s === 'pass' ? '✓' : s === 'fail' || s === 'warnfail' ? '✕' : i + 1}
              </span>
              <div>
                <div className="t">{rule.t}</div>
                <div className="d">{rule.d}</div>
              </div>
              <span className="st">{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

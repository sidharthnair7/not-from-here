import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SCEN } from '../../lib/fixtures';
import { SP } from '../../lib/species';
import { drawArt } from '../../lib/art';
import { useGate } from '../../hooks/useGate';
import { V } from '../../lib/verdicts';
import { IconForVerdict, IdleIcon } from '../Icons';
import { Evidence } from '../Evidence';
import { useTranslation } from '../../i18n/context';

export const Playground: React.FC = () => {
  const { t } = useTranslation();
  const [selectedKey, setSelectedKey] = useState<string>('phragmites');
  const { phase, steps, result, isRunning, run } = useGate();

  const scenarios = Object.entries(SCEN);

  const handleSelect = async (k: string) => {
    setSelectedKey(k);
    await run(k, null, SCEN[k].lat, SCEN[k].lng);
  };

  return (
    <section className="playground-section" aria-label="Interactive rule playground">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">{t('play_eyebrow')}</span>
          <h2 className="section-title">{t('play_title')}</h2>
          <p className="section-sub">{t('play_sub')}</p>
        </div>

        {/* 4 Thumbnails Row */}
        <div className="play-scenarios-grid" role="group" aria-label="Selectable test scenarios">
          {scenarios.map(([k, s]) => {
            const sp = SP[s.key] || SP.phragmites;
            const isSelected = selectedKey === k;

            return (
              <button
                key={k}
                type="button"
                className={`play-thumb-card card spot ${isSelected ? 'active-thumb' : ''}`}
                onClick={() => handleSelect(k)}
                disabled={isRunning}
                aria-pressed={isSelected}
              >
                <ScenarioCanvas kind={sp.kind} hue={sp.hue} seed={s.seed} blur={s.blur} />
                <div className="play-thumb-meta">
                  <b className="play-thumb-title">{s.tab}</b>
                  <span className="play-thumb-sp"><i>{sp.name}</i></span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Gate Runner Box */}
        <div className="play-runner card spot" style={{ marginTop: 24, padding: 24 }}>
          {/* Banner */}
          <div
            className={`banner ${phase === 'done' ? 'pop' : ''}`}
            data-t={result ? V[result.verdict]?.tone : 'idle'}
            style={{ borderRadius: 16 }}
          >
            <div className="v">
              {phase === 'done' && result ? (
                <IconForVerdict verdict={result.verdict} />
              ) : isRunning ? (
                <div className="spin" />
              ) : (
                <IdleIcon />
              )}
              <div>
                <h2>
                  {phase === 'done' && result
                    ? V[result.verdict]?.label
                    : isRunning
                    ? 'Checking four rules…'
                    : 'Select a scenario above to test'}
                </h2>
                <p className="rule">
                  {phase === 'done' && result
                    ? result.rule
                    : 'Each rule must pass before the next one runs.'}
                </p>
              </div>
            </div>
            {result && <p className="why">{result.reason}</p>}
          </div>

          {/* Steps */}
          <ol className="steps" style={{ marginTop: 16 }}>
            {['Proposal agreement', 'Ontario invasive list', 'Range check', 'Season check'].map((name, i) => {
              const s = steps[i];
              const isWarn = result && V[result.verdict]?.tone === 'warn';
              const dstate = s === 'fail' && isWarn ? 'warnfail' : s;
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
                <li key={i} className="step" data-s={dstate}>
                  <span className="n">{s === 'pass' ? '✓' : s === 'fail' || s === 'warnfail' ? '✕' : i + 1}</span>
                  <div>
                    <div className="t">{name}</div>
                  </div>
                  <span className="st">{label}</span>
                </li>
              );
            })}
          </ol>

          {/* Evidence and deep link */}
          {result && (
            <div style={{ marginTop: 20 }}>
              <details className="evi">
                <summary>
                  <span>Evidence details</span>
                </summary>
                <div className="evi-body">
                  <Evidence result={result} />
                </div>
              </details>

              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Link to={`/check?scn=${selectedKey}`} className="btn sm line" style={{ textDecoration: 'none' }}>
                  {t('play_open_full')} ➔
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const ScenarioCanvas: React.FC<{
  kind: string;
  hue: number;
  seed: number;
  blur: number;
}> = ({ kind, hue, seed, blur }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      const c = ref.current.getContext('2d');
      if (c) {
        c.filter = blur ? `blur(${blur * 1.6}px)` : 'none';
        drawArt(c, 240, 140, kind, hue, seed);
      }
    }
  }, [kind, hue, seed, blur]);

  return <canvas ref={ref} width={240} height={140} className="play-canvas" />;
};

import React, { useState, useEffect, useRef } from 'react';
import { drawArt } from '../../lib/art';
import { SP } from '../../lib/species';
import { SCEN } from '../../lib/fixtures';
import { useTranslation } from '../../i18n/context';

export const PinnedStory: React.FC = () => {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const step1Ref = useRef<HTMLDivElement | null>(null);
  const step2Ref = useRef<HTMLDivElement | null>(null);
  const step3Ref = useRef<HTMLDivElement | null>(null);
  const step4Ref = useRef<HTMLDivElement | null>(null);

  // Draw sticky specimen card (Phragmites)
  useEffect(() => {
    if (leftCanvasRef.current) {
      const c = leftCanvasRef.current.getContext('2d');
      if (c) {
        const sp = SP.phragmites;
        drawArt(c, 480, 280, sp.kind, sp.hue, SCEN.phragmites.seed);
      }
    }
  }, []);

  // Track step in view via IntersectionObserver (centered rootMargin)
  useEffect(() => {
    const refs = [step1Ref.current, step2Ref.current, step3Ref.current, step4Ref.current];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = refs.indexOf(entry.target as HTMLDivElement);
            if (idx >= 0) {
              setActiveStep(idx);
            }
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '-25% 0px -25% 0px'
      }
    );

    refs.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const ruleTitles = [
    t('story_rule1_title'),
    t('story_rule2_title'),
    t('story_rule3_title'),
    t('story_rule4_title')
  ];

  return (
    <section className="story-section" aria-label="How the gate works">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">{t('story_eyebrow')}</span>
          <h2 className="section-title">{t('story_title')}</h2>
        </div>

        <div className="story-grid">
          {/* Sticky Left Specimen Card */}
          <div className="story-left">
            <div className="story-sticky-card card spot">
              <div className="story-specimen-wrap">
                <canvas ref={leftCanvasRef} width={480} height={280} />
                <div className="chip story-chip">Phragmites australis · Little Lake</div>
              </div>

              {/* Dynamic banner reflecting current scroll rule progress */}
              <div
                className="banner pop"
                data-t={activeStep === 3 ? 'go' : 'idle'}
                style={{ padding: '14px 18px', borderRadius: 16 }}
              >
                <div className="v" style={{ gap: 12, alignItems: 'center' }}>
                  {activeStep === 3 ? (
                    <svg className="ic" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 34, height: 34 }}>
                      <circle cx="24" cy="24" r="20" />
                      <path d="M14 25l7 7 13-15" />
                    </svg>
                  ) : (
                    <div className="spin" style={{ width: 22, height: 22 }} />
                  )}
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--serif)', color: activeStep === 3 ? 'var(--go)' : 'var(--ink)' }}>
                      {activeStep === 3 ? 'Report this' : `Rule ${activeStep + 1} of 4`}
                    </h3>
                    <p className="rule" style={{ margin: '2px 0 0', fontSize: 12.5 }}>
                      {activeStep === 3 ? 'All four rules passed' : ruleTitles[activeStep]}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mini progress tracker */}
              <ol className="steps" style={{ marginTop: 12, gap: 6 }}>
                {ruleTitles.map((title, i) => {
                  const isPassed = i < activeStep || (activeStep === 3 && i <= 3);
                  const isCurrent = i === activeStep && activeStep !== 3;
                  const state = isPassed ? 'pass' : isCurrent ? 'running' : 'idle';

                  return (
                    <li key={i} className="step" data-s={state} style={{ padding: '8px 12px', borderRadius: 12 }}>
                      <span className="n" style={{ width: 26, height: 26, fontSize: 11 }}>
                        {isPassed ? '✓' : i + 1}
                      </span>
                      <div className="t" style={{ fontSize: 13.5 }}>
                        {title}
                      </div>
                      <span className="st" style={{ fontSize: 12 }}>
                        {isPassed ? 'passed' : isCurrent ? 'active' : ''}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {/* Right Scroll Steps */}
          <div className="story-right">
            {/* Rule 1 */}
            <div ref={step1Ref} className={`story-step-block ${activeStep === 0 ? 'active' : ''}`}>
              <div className="story-num">{t('story_rule1_num')}</div>
              <h3 className="story-rule-title">{t('story_rule1_title')}</h3>
              <p className="story-rule-desc">{t('story_rule1_desc')}</p>

              <div className="story-visual visual-proposals card spot">
                <div className="prop-model">
                  <span className="prop-src">ollama:qwen2.5vl:7b</span>
                  <div className="bar-row">
                    <span className="bar-label">Phragmites australis</span>
                    <span className="bar"><b style={{ width: '89%' }}></b></span>
                    <span className="num">0.89</span>
                  </div>
                </div>

                <div className="visual-connector" aria-hidden="true">
                  <svg viewBox="0 0 200 24" className="connector-svg">
                    <path d="M10 4 Q 100 20 190 4" fill="none" stroke="var(--go)" strokeWidth="2" strokeDasharray="4 4" />
                  </svg>
                  <span className="connector-pill">Consensus: match</span>
                </div>

                <div className="prop-model">
                  <span className="prop-src">bedrock:nova-2-lite</span>
                  <div className="bar-row">
                    <span className="bar-label">Phragmites australis</span>
                    <span className="bar"><b style={{ width: '87%' }}></b></span>
                    <span className="num">0.87</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rule 2 */}
            <div ref={step2Ref} className={`story-step-block ${activeStep === 1 ? 'active' : ''}`}>
              <div className="story-num">{t('story_rule2_num')}</div>
              <h3 className="story-rule-title">{t('story_rule2_title')}</h3>
              <p className="story-rule-desc">{t('story_rule2_desc')}</p>

              <div className="story-visual visual-chips card spot">
                <div className="chip-stack">
                  <div className="list-chip listed match">
                    <span className="chip-check">✓</span>
                    <span>Phragmites australis</span>
                    <span className="chip-tag tag">Invasive (regulated)</span>
                  </div>
                  <div className="list-chip unlisted dimmed">
                    <span className="chip-x">✕</span>
                    <span>Typha latifolia (Broad-leaved cattail)</span>
                    <span className="chip-tag tag">Native lookalike</span>
                  </div>
                  <div className="list-chip unlisted dimmed">
                    <span className="chip-x">✕</span>
                    <span>Iris pseudacorus (Yellow flag)</span>
                    <span className="chip-tag tag">Distinct taxon</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rule 3 */}
            <div ref={step3Ref} className={`story-step-block ${activeStep === 2 ? 'active' : ''}`}>
              <div className="story-num">{t('story_rule3_num')}</div>
              <h3 className="story-rule-title">{t('story_rule3_title')}</h3>
              <p className="story-rule-desc">{t('story_rule3_desc')}</p>

              <div className="story-visual visual-radar card spot">
                <svg viewBox="0 0 280 140" className="radar-stage-svg">
                  <circle cx="140" cy="70" r="62" fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                  <text x="144" y="16" fill="var(--dim)" fontSize="9" fontFamily="var(--mono)">200 km limit</text>
                  <circle cx="140" cy="70" r="34" fill="none" stroke="rgba(98,213,154,0.35)" strokeWidth="1.5" />
                  <text x="144" y="44" fill="var(--go)" fontSize="9" fontFamily="var(--mono)">50 km range</text>

                  {/* Sighting point */}
                  <circle cx="140" cy="70" r="4.5" fill="var(--go)" />

                  {/* Confirmed nearby points */}
                  <circle cx="122" cy="58" r="3" fill="var(--acc)" opacity="0.8" />
                  <circle cx="158" cy="82" r="3" fill="var(--acc)" opacity="0.8" />
                  <circle cx="132" cy="94" r="3" fill="var(--acc)" opacity="0.8" />
                  <circle cx="164" cy="56" r="3" fill="var(--acc)" opacity="0.8" />
                </svg>
                <div className="radar-counter">
                  <b className="count-num">37</b>
                  <span>research-grade observations within 50 km</span>
                </div>
              </div>
            </div>

            {/* Rule 4 */}
            <div ref={step4Ref} className={`story-step-block ${activeStep === 3 ? 'active' : ''}`}>
              <div className="story-num">{t('story_rule4_num')}</div>
              <h3 className="story-rule-title">{t('story_rule4_title')}</h3>
              <p className="story-rule-desc">{t('story_rule4_desc')}</p>

              <div className="story-visual visual-season card spot">
                <div className="season-meta">
                  <span>Photo date: <b>14 September</b></span>
                  <span className="tag" style={{ color: 'var(--go)', borderColor: 'rgba(98,213,154,0.3)' }}>Active season</span>
                </div>
                <div className="season-bars">
                  {[2, 2, 8, 35, 110, 210, 290, 320, 344, 215, 60, 8].map((val, mIdx) => {
                    const isSep = mIdx === 8;
                    const h = Math.round((val / 344) * 60);
                    return (
                      <div key={mIdx} className="season-col">
                        <div
                          className={`season-bar ${isSep ? 'highlight' : ''}`}
                          style={{ height: `${h}px` }}
                        />
                        <span className="season-label">{['J','F','M','A','M','J','J','A','S','O','N','D'][mIdx]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

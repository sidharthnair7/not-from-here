import React from 'react';
import { useTranslation } from '../../i18n/context';

export const Bento: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="bento-section" aria-label="Gate architecture and principles">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">{t('bento_eyebrow')}</span>
          <h2 className="section-title">{t('bento_title')}</h2>
          <p className="section-sub">{t('bento_sub')}</p>
        </div>

        <div className="bento-grid">
          {/* Card 1: span 7 - Refusals table */}
          <div className="bento-card span-7 card spot">
            <div className="bento-meta">
              <span className="tag">Rule audit</span>
              <h3>{t('bento1_title')}</h3>
              <p>{t('bento1_desc')}</p>
            </div>
            <div className="bento-visual bento-table-preview">
              <div className="mini-row">
                <span className="mono dim">16 Sep</span>
                <span><i>Phragmites</i> vs <i>Typha</i></span>
                <span className="pill" data-t="warn">Split decision</span>
              </div>
              <div className="mini-row">
                <span className="mono dim">11 Sep</span>
                <span><i>Reynoutria japonica</i></span>
                <span className="pill" data-t="warn">2 nearby (need 3)</span>
              </div>
              <div className="mini-row">
                <span className="mono dim">05 Sep</span>
                <span><i>Alliaria petiolata</i></span>
                <span className="pill" data-t="warn">Out of season</span>
              </div>
            </div>
          </div>

          {/* Card 2: span 5 - Two proposers, zero guessing */}
          <div className="bento-card span-5 card spot">
            <div className="bento-meta">
              <span className="tag">Consensus</span>
              <h3>{t('bento2_title')}</h3>
              <p>{t('bento2_desc')}</p>
            </div>
            <div className="bento-visual bento-split-preview">
              <div className="rings-wrap">
                <div className="ring ring-a">
                  <span>Qwen 2.5</span>
                  <b>0.55</b>
                </div>
                <div className="ring-vs">≠</div>
                <div className="ring ring-b">
                  <span>Nova Lite</span>
                  <b>0.48</b>
                </div>
              </div>
              <div className="pill" data-t="warn" style={{ alignSelf: 'center', marginTop: 12 }}>
                Refusal: identification split
              </div>
            </div>
          </div>

          {/* Card 3: span 4 - Real sightings only */}
          <div className="bento-card span-4 card spot">
            <div className="bento-meta">
              <span className="tag">Ground truth</span>
              <h3>{t('bento3_title')}</h3>
              <p>{t('bento3_desc')}</p>
            </div>
            <div className="bento-visual bento-inat-preview">
              <div className="inat-row">
                <span className="inat-dot" />
                <span>Little Lake Shoreline</span>
                <span className="mono">2.4 km</span>
              </div>
              <div className="inat-row">
                <span className="inat-dot" />
                <span>Otonabee River Trail</span>
                <span className="mono">7.9 km</span>
              </div>
              <div className="inat-row">
                <span className="inat-dot" />
                <span>Jackson Park</span>
                <span className="mono">13.2 km</span>
              </div>
            </div>
          </div>

          {/* Card 4: span 4 - Season-aware */}
          <div className="bento-card span-4 card spot">
            <div className="bento-meta">
              <span className="tag">Seasonality</span>
              <h3>{t('bento4_title')}</h3>
              <p>{t('bento4_desc')}</p>
            </div>
            <div className="bento-visual bento-scrubber-preview">
              <div className="scrubber-track">
                {[10, 15, 30, 60, 90, 100, 95, 75, 50, 25, 12, 8].map((v, i) => (
                  <div
                    key={i}
                    className={`scrub-bar ${i === 8 ? 'active' : ''}`}
                    style={{ height: `${v}%` }}
                  />
                ))}
              </div>
              <div className="scrub-cursor" style={{ left: '72%' }}>
                <span>Sep peak</span>
              </div>
            </div>
          </div>

          {/* Card 5: span 4 - New range? A human decides */}
          <div className="bento-card span-4 card spot">
            <div className="bento-meta">
              <span className="tag" style={{ color: 'var(--stop)', borderColor: 'rgba(255,115,115,0.3)' }}>
                First detection
              </span>
              <h3>{t('bento5_title')}</h3>
              <p>{t('bento5_desc')}</p>
            </div>
            <div className="bento-visual bento-hotline-preview">
              <div className="hotline-icon-wrap">
                <div className="hotline-pulse" />
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--stop)" strokeWidth="2" className="hotline-phone">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <span className="hotline-label">Invading Species Hotline</span>
            </div>
          </div>

          {/* Card 6: span 12 - Privacy & data architecture */}
          <div className="bento-card span-12 card spot">
            <div className="bento-meta">
              <span className="tag">Data privacy</span>
              <h3>{t('bento6_title')}</h3>
              <p>{t('bento6_desc')}</p>
            </div>
            <div className="bento-visual bento-diagram-preview" aria-hidden="true">
              <div className="diagram-node">
                <span className="d-icon">📷</span>
                <span className="d-title">Photo on device</span>
              </div>
              <div className="diagram-arrow">➔</div>
              <div className="diagram-node">
                <span className="d-icon">🤖</span>
                <span className="d-title">Vision models</span>
              </div>
              <div className="diagram-arrow">➔</div>
              <div className="diagram-node active-gate">
                <span className="d-icon">🛡️</span>
                <span className="d-title">4-Rule Gate</span>
              </div>
              <div className="diagram-block-barrier">
                <span className="barrier-x">✕</span>
                <span className="barrier-text">Photo blocked</span>
              </div>
              <div className="diagram-node writer-node">
                <span className="d-icon">📝</span>
                <span className="d-title">Report draft</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../state/store';
import { SphereCanvas } from '../SphereCanvas';
import { SP } from '../../lib/species';
import { fmt } from '../../lib/format';
import { useInView } from '../../hooks/useInView';
import { useTranslation } from '../../i18n/context';

export const Showcase: React.FC = () => {
  const { sightings, openDrawer } = useStore();
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'sphere' | 'grid'>('sphere');
  const [containerRef, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section ref={containerRef} className="showcase-section" aria-label="Verified species record showcase">
      <div className="wrap showcase-header">
        <div>
          <span className="eyebrow">THE ONTARIO RECORD</span>
          <h2 className="section-title">{t('showcase_title')}</h2>
          <p className="section-sub">{t('showcase_sub')}</p>
        </div>
        <div className="showcase-controls">
          <div className="view-toggle" role="group" aria-label="Visualization mode">
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'sphere' ? 'active' : ''}`}
              onClick={() => setViewMode('sphere')}
              aria-pressed={viewMode === 'sphere'}
            >
              {t('showcase_toggle_sphere')}
            </button>
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
            >
              {t('showcase_toggle_grid')}
            </button>
          </div>
          <Link to="/record" className="btn sm" style={{ width: 'auto', textDecoration: 'none' }}>
            {t('showcase_explore')} ➔
          </Link>
        </div>
      </div>

      <div className="showcase-stage-wrap">
        {viewMode === 'sphere' ? (
          <div style={{ minHeight: '65vh' }}>
            {inView && <SphereCanvas />}
          </div>
        ) : (
          <div className="wrap">
            <div className="record-grid" role="region" aria-label="Sightings grid">
              {sightings.map((s) => {
                const sp = SP[s.key] || SP.phragmites;
                return (
                  <div
                    key={s.id}
                    className="card spot record-card"
                    tabIndex={0}
                    role="button"
                    onClick={() => openDrawer(s, true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openDrawer(s, true);
                      }
                    }}
                  >
                    <div className="record-card-head">
                      <span className="pill" data-t="go">Report</span>
                      <span className="mono dim" style={{ fontSize: 12 }}>{fmt(s.date)}</span>
                    </div>
                    <h3 className="record-card-sp"><i>{sp.name}</i></h3>
                    <p className="record-card-common">{sp.common}</p>
                    <p className="record-card-loc dim">{s.place}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

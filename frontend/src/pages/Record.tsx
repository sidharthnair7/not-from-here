import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../state/store';
import { SphereCanvas } from '../components/SphereCanvas';
import { fmt } from '../lib/format';
import { SP } from '../lib/species';
import { V } from '../lib/verdicts';
import { SeoHead } from '../components/common/SeoHead';
import { useTranslation } from '../i18n/context';

export const Record: React.FC = () => {
  const { sightings, refusals, openDrawer, resetDemoData } = useStore();
  const [viewMode, setViewMode] = useState<'sphere' | 'grid'>('sphere');
  const { t } = useTranslation();
  const lastTriggerRef = useRef<HTMLElement | null>(null);

  const handleOpenDrawer = (item: any, isReport: boolean, e: React.SyntheticEvent) => {
    lastTriggerRef.current = e.currentTarget as HTMLElement;
    openDrawer(item, isReport);
  };

  const handleReset = () => {
    if (window.confirm(t('reset_confirm'))) {
      resetDemoData();
    }
  };

  return (
    <>
      <SeoHead
        title="The Record"
        description="Every verified invasive species sighting in Ontario that passed all four gate rules."
      />

      <div className="wrap" id="main-content">
        <div className="rec-head">
          <div>
            <h1>The record</h1>
            <p>
              Every tile is a sighting that passed all four rules. Drag to turn the sphere, tap a tile
              to see its evidence.
            </p>
          </div>

          <div className="rec-right-actions">
            <div className="stat">
              <div>
                <b>{sightings.length}</b>reported
              </div>
              <div>
                <b>{refusals.length}</b>refused
              </div>
            </div>

            <div className="rec-toolbar">
              {/* Grid / Sphere View Toggle */}
              <div className="view-toggle" role="group" aria-label="Record view mode">
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

              {/* Reset Demo Data Button */}
              <button
                type="button"
                className="btn sm line"
                onClick={handleReset}
                title={t('reset_demo')}
              >
                {t('reset_demo')}
              </button>
            </div>
          </div>
        </div>

        {/* Sightings Display: Sphere vs Accessible Grid */}
        {sightings.length === 0 ? (
          <div className="card spot" style={{ padding: '60px 20px', textAlign: 'center', margin: '24px 0' }}>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>{t('empty_record_title')}</h2>
            <p className="sub" style={{ marginBottom: 20 }}>{t('empty_record_sub')}</p>
            <Link to="/check" className="btn sm" style={{ width: 'auto', display: 'inline-block' }}>
              {t('empty_record_cta')} ➔
            </Link>
          </div>
        ) : viewMode === 'sphere' ? (
          <div aria-hidden={viewMode !== 'sphere'}>
            <SphereCanvas />
          </div>
        ) : (
          <div className="record-grid" role="region" aria-label="Accessible sightings grid" style={{ margin: '24px 0' }}>
            {sightings.map((s) => {
              const sp = SP[s.key] || SP.phragmites;
              return (
                <div
                  key={s.id}
                  className="card spot record-card"
                  tabIndex={0}
                  role="button"
                  onClick={(e) => handleOpenDrawer(s, true, e)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenDrawer(s, true, e);
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
        )}

        {/* Refusals Table */}
        <section className="refusals">
          <h2>Refused, and why</h2>
          <p className="sub">Refusals are part of the record too. Tap a row for its evidence.</p>
          <div className="card">
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>{t('table_date')}</th>
                    <th>{t('table_species')}</th>
                    <th>{t('table_verdict')}</th>
                    <th>{t('table_where')}</th>
                  </tr>
                </thead>
                <tbody>
                  {refusals.map((x) => {
                    const sp = SP[x.key] || SP.phragmites;
                    const isSplit = x.verdict === 'NOT_VERIFIED_SPLIT';
                    const secondTaxon =
                      x.res.proposals && x.res.proposals[1]?.list[0]?.taxonName;

                    return (
                      <tr
                        key={x.id}
                        tabIndex={0}
                        data-id={x.id}
                        onClick={(e) => handleOpenDrawer(x, false, e)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleOpenDrawer(x, false, e);
                          }
                        }}
                      >
                        <td className="m">{fmt(x.date)}</td>
                        <td>
                          {isSplit ? (
                            <>
                              Split: <i>{sp.name}</i> or <i>{secondTaxon}</i>
                            </>
                          ) : (
                            <i>{sp.name}</i>
                          )}
                        </td>
                        <td>
                          <span className="pill" data-t={V[x.verdict]?.tone || 'warn'}>
                            {V[x.verdict]?.label || x.verdict}
                          </span>
                        </td>
                        <td>{x.place}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Record;

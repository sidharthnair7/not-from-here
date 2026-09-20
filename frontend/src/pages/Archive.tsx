import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../state/store';
import { Sighting } from '../lib/tile';
import { SP, Species } from '../lib/species';
import { fmt } from '../lib/format';
import { makeSpecimenDiscTexture } from '../lib/specimenTexture';
import { InfiniteMenu, MenuItem } from '../components/InfiniteMenu/InfiniteMenu';
import { SeoHead } from '../components/common/SeoHead';
import { useTranslation } from '../i18n/context';
import './Archive.css';

interface SpecimenMenuItem extends MenuItem {
  sighting: Sighting;
  species: Species;
}

export const Archive: React.FC = () => {
  const { sightings, openDrawer, resetDemoData } = useStore();
  const { t } = useTranslation();
  const [scale, setScale] = useState<number>(2.2);
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);

  const menuItems: SpecimenMenuItem[] = useMemo(() => {
    return sightings.map((s) => {
      const sp = SP[s.key] || SP.phragmites;
      return {
        image: makeSpecimenDiscTexture(s),
        link: `#specimen-${s.id}`,
        title: sp.name,
        description: `${sp.common} · ${fmt(s.date)} · ${s.place}`,
        sighting: s,
        species: sp
      };
    });
  }, [sightings]);

  const activeSighting = (activeItem?.sighting as Sighting) || sightings[0] || null;
  const activeSpecies = activeSighting ? SP[activeSighting.key] || SP.phragmites : null;

  const handleOpenEvidence = (s?: Sighting | null) => {
    const target = s || activeSighting;
    if (target) {
      openDrawer(target, true);
    }
  };

  const handleReset = () => {
    if (window.confirm(t('reset_confirm'))) {
      resetDemoData();
    }
  };

  return (
    <>
      <SeoHead
        title="The Living Archive"
        description="An infinite 3D specimen constellation of verified invasive species sightings in Ontario."
      />

      <div className="wrap" id="main-content">
        <div className="archive-head">
          <div>
            <h1>
              {t('archive_title')} <em>· 3D Atlas</em>
            </h1>
            <p>{t('archive_sub')}</p>
          </div>

          <div className="archive-toolbar">
            <div className="stat">
              <div>
                <b>{sightings.length}</b> {t('archive_specimens_loaded')}
              </div>
            </div>

            <button
              type="button"
              className="btn sm line"
              onClick={handleReset}
              title={t('reset_demo')}
            >
              {t('reset_demo')}
            </button>

            <Link to="/check" className="btn sm">
              {t('nav_check')} ➔
            </Link>
          </div>
        </div>

        {sightings.length === 0 ? (
          <div className="card spot" style={{ padding: '60px 20px', textAlign: 'center', margin: '24px 0' }}>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>{t('empty_record_title')}</h2>
            <p className="sub" style={{ marginBottom: 20 }}>{t('empty_record_sub')}</p>
            <Link to="/check" className="btn sm" style={{ width: 'auto', display: 'inline-block' }}>
              {t('empty_record_cta')} ➔
            </Link>
          </div>
        ) : (
          <>
            <div className="archive-stage">
              <div className="archive-hint-bar">
                <span className="pulse-dot" />
                <span>{t('archive_tap_hint')}</span>
              </div>

              <InfiniteMenu
                items={menuItems}
                scale={scale}
                backgroundColor="#080b10"
                onActionClick={() => handleOpenEvidence(activeSighting)}
                onActiveItemChange={setActiveItem}
              />

              {/* Optical Zoom Controls */}
              <div className="archive-zoom-ctrl">
                <span className="archive-zoom-label">{t('archive_zoom')}</span>
                {/* `scale` is the camera distance (3 × scale), so a bigger number is further away.
                    The slider is inverted so that right means closer, the way every zoom control works. */}
                <input
                  type="range"
                  min="1.2"
                  max="4.0"
                  step="0.1"
                  value={5.2 - scale}
                  onChange={(e) => setScale(5.2 - parseFloat(e.target.value))}
                  className="archive-zoom-slider"
                  aria-label={t('archive_zoom')}
                />
                <div className="archive-zoom-presets">
                  <button
                    type="button"
                    className={`archive-zoom-btn ${Math.abs(scale - 3.4) < 0.2 ? 'active' : ''}`}
                    onClick={() => setScale(3.4)}
                    title="Wide view, the whole sphere"
                  >
                    Wide
                  </button>
                  <button
                    type="button"
                    className={`archive-zoom-btn ${Math.abs(scale - 2.2) < 0.2 ? 'active' : ''}`}
                    onClick={() => setScale(2.2)}
                    title="Standard view"
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    className={`archive-zoom-btn ${Math.abs(scale - 1.4) < 0.2 ? 'active' : ''}`}
                    onClick={() => setScale(1.4)}
                    title="Close view, one tile at a time"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            {/* Focused Specimen Dossier Spotlight */}
            {activeSighting && activeSpecies && (
              <section className="specimen-spotlight" aria-label="Focused Specimen Details">
                <div className="specimen-card spot">
                  <div className="specimen-disc-preview">
                    <img
                      src={makeSpecimenDiscTexture(activeSighting)}
                      alt={activeSpecies.name}
                      width={96}
                      height={96}
                    />
                  </div>

                  <div className="specimen-info">
                    <h3>{activeSpecies.name}</h3>
                    <p className="specimen-common-name">{activeSpecies.common}</p>

                    <div className="specimen-meta-row">
                      <span>
                        Date: <span className="val">{fmt(activeSighting.date)}</span>
                      </span>
                      <span>·</span>
                      <span>
                        Location: <span className="val">{activeSighting.place}</span>
                      </span>
                      <span>·</span>
                      <span>
                        Specimen ID: <span className="val">#{activeSighting.id}</span>
                      </span>
                    </div>

                    <div className="specimen-gate-chips">
                      <span className="gate-chip">✓ Rule 1: Dual Vision Match</span>
                      <span className="gate-chip">✓ Rule 2: Ontario Invasive Regulated</span>
                      <span className="gate-chip">✓ Rule 3: Active Phenology</span>
                      <span className="gate-chip">✓ Rule 4: Visual Distinctness</span>
                    </div>
                  </div>

                  <div className="specimen-actions">
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() => handleOpenEvidence(activeSighting)}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {t('archive_inspect_cta')} ➔
                    </button>
                    <Link
                      to="/record"
                      className="btn sm line"
                      style={{ whiteSpace: 'nowrap', textAlign: 'center' }}
                    >
                      {t('nav_record')}
                    </Link>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Archive;

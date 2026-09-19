import React from 'react';
import { SP } from '../../lib/species';
import { useTranslation } from '../../i18n/context';

const LeafGlyph: React.FC = () => (
  <svg
    className="ticker-glyph"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <path d="M3 13C3 7 7 3 13 3c0 6-4 10-10 10Z" stroke="var(--acc)" />
    <path d="M3 13 9 7" stroke="var(--acc)" />
  </svg>
);

export const Ticker: React.FC = () => {
  const { t } = useTranslation();
  const speciesList = Object.values(SP);

  // Duplicate list to achieve seamless infinite loop
  const row1 = [...speciesList, ...speciesList];
  const row2 = [...speciesList.slice().reverse(), ...speciesList.slice().reverse()];

  return (
    <section className="ticker-section" aria-label="Monitored species ticker">
      <div className="wrap">
        <p className="ticker-caption">{t('ticker_caption')}</p>
      </div>

      <div className="ticker-container" tabIndex={0}>
        {/* Row 1: Leftward */}
        <div className="ticker-track track-left">
          {row1.map((sp, idx) => (
            <div key={`r1-${idx}`} className="ticker-item">
              <span className="ticker-name">{sp.name}</span>
              <LeafGlyph />
            </div>
          ))}
        </div>

        {/* Row 2: Rightward */}
        <div className="ticker-track track-right">
          {row2.map((sp, idx) => (
            <div key={`r2-${idx}`} className="ticker-item">
              <span className="ticker-name">{sp.name}</span>
              <LeafGlyph />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

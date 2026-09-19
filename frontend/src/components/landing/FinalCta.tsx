import React from 'react';
import { Link } from 'react-router-dom';
import { useMagnetic } from '../../hooks/useMagnetic';
import { useTranslation } from '../../i18n/context';

export const FinalCta: React.FC = () => {
  const { t } = useTranslation();
  const btnRef = useMagnetic<HTMLAnchorElement>();

  return (
    <section className="final-cta-section" aria-label="Call to action">
      <div className="wrap">
        <div className="final-cta-card card spot">
          <div className="aurora-blob aurora-blob-1" aria-hidden="true" />
          <div className="aurora-blob aurora-blob-2" aria-hidden="true" />

          <h2 className="final-cta-title">{t('final_cta_title')}</h2>
          <p className="final-cta-sub">{t('final_cta_sub')}</p>

          <Link
            ref={btnRef}
            to="/check"
            className="btn magnetic-btn"
            style={{ width: 'auto', display: 'inline-block' }}
          >
            {t('final_cta_btn')}
          </Link>
        </div>
      </div>
    </section>
  );
};

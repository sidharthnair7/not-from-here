import React from 'react';
import { useTranslation } from '../../i18n/context';

export const Faq: React.FC = () => {
  const { t } = useTranslation();

  const faqs = [
    { q: t('faq1_q'), a: t('faq1_a') },
    { q: t('faq2_q'), a: t('faq2_a') },
    { q: t('faq3_q'), a: t('faq3_a') },
    { q: t('faq4_q'), a: t('faq4_a') },
    { q: t('faq5_q'), a: t('faq5_a') },
    { q: t('faq6_q'), a: t('faq6_a') }
  ];

  return (
    <section className="faq-section" aria-label="Frequently asked questions">
      <div className="wrap" style={{ maxWidth: 840 }}>
        <div className="section-head" style={{ textAlign: 'center' }}>
          <span className="eyebrow">{t('faq_eyebrow')}</span>
          <h2 className="section-title">{t('faq_title')}</h2>
        </div>

        <div className="faq-accordion">
          {faqs.map((f, i) => (
            <details key={i} className="faq-item card spot">
              <summary className="faq-summary">
                <span className="faq-question">{f.q}</span>
                <span className="faq-icon" aria-hidden="true">+</span>
              </summary>
              <div className="faq-content">
                <p className="faq-answer">{f.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

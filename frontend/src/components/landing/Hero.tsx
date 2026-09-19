import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { HeroGate } from './HeroGate';
import { useMagnetic } from '../../hooks/useMagnetic';
import { useTranslation } from '../../i18n/context';

export function SplitWords({ text, em = [] as number[] }: { text: string; em?: number[] }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="w" style={{ ['--i' as any]: i }}>
            <span className={em.includes(i) ? 'em' : undefined}>{w}</span>
          </span>{' '}
        </Fragment>
      ))}
    </>
  );
}

export const Hero: React.FC = () => {
  const { t, lang } = useTranslation();
  const magneticBtnRef = useMagnetic<HTMLAnchorElement>();

  const headlineText =
    lang === 'fr'
      ? 'Le modèle propose. Les règles décident.'
      : 'The model proposes. The rules decide.';

  return (
    <section className="hero-l">
      <div className="wrap grid2">
        <div className="copy">
          <div className="eyebrow-pill" role="status">
            <span className="eyebrow-dot" />
            <span>{t('eyebrow')}</span>
          </div>

          <h1>
            <SplitWords text={headlineText} em={[2]} />
          </h1>

          <p className="lede">{t('hero_sub')}</p>

          <div className="ctas">
            <Link
              ref={magneticBtnRef}
              to="/check"
              className="btn"
            >
              {t('hero_cta_check')}
            </Link>
            <Link
              to="/record"
              className="btn line"
            >
              {t('hero_cta_record')}
            </Link>
          </div>
        </div>

        <HeroGate />
      </div>
    </section>
  );
};

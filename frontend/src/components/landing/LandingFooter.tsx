import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/context';

export const LandingFooter: React.FC = () => {
  const { t, lang, setLang } = useTranslation();

  return (
    <footer className="landing-footer" role="contentinfo">
      <div className="wrap">
        <div className="footer-cols">
          {/* Column 1: Product */}
          <div className="footer-col">
            <h4 className="footer-col-title">{t('footer_product')}</h4>
            <ul className="footer-links">
              <li><Link to="/check">{t('nav_check')}</Link></li>
              <li><Link to="/record">{t('nav_record')}</Link></li>
              <li><Link to="/about">{t('nav_about')}</Link></li>
            </ul>
          </div>

          {/* Column 2: Data sources */}
          <div className="footer-col">
            <h4 className="footer-col-title">{t('footer_sources')}</h4>
            <ul className="footer-links">
              <li><a href="https://www.inaturalist.org" target="_blank" rel="noopener noreferrer">iNaturalist Research Grade</a></li>
              <li><a href="https://www.gbif.org" target="_blank" rel="noopener noreferrer">GBIF Occurrences</a></li>
              <li><a href="https://www.invasivespeciescentre.ca" target="_blank" rel="noopener noreferrer">Invasive Species Centre Ontario</a></li>
            </ul>
          </div>

          {/* Column 3: Project & Language Toggle */}
          <div className="footer-col">
            <h4 className="footer-col-title">{t('footer_project')}</h4>
            <ul className="footer-links">
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub Repository</a></li>
              <li>
                <div className="lang-toggle-wrap">
                  <span className="lang-label">Language:</span>
                  <button
                    type="button"
                    className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                    onClick={() => setLang('en')}
                    aria-label="Switch to English"
                  >
                    EN
                  </button>
                  <span className="dim">/</span>
                  <button
                    type="button"
                    className={`lang-btn ${lang === 'fr' ? 'active' : ''}`}
                    onClick={() => setLang('fr')}
                    aria-label="Passer en français"
                  >
                    FR
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-notice">{t('footer_sample_notice')}</p>
          <p className="footer-license dim">{t('footer_license')}</p>
        </div>
      </div>
    </footer>
  );
};

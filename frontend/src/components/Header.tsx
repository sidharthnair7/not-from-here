import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BrandIcon } from './Icons';
import { LiveStatusBadge } from './common/LiveStatusBadge';
import { ScrollProgressBar } from './common/ScrollProgressBar';
import { useStore } from '../state/store';
import { useTranslation } from '../i18n/context';

export const Header: React.FC = () => {
  const { sightings } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, lang, setLang } = useTranslation();

  const isHome = location.pathname === '/';
  const isCheck = location.pathname === '/check';
  const isRecord = location.pathname === '/record';
  const isAbout = location.pathname === '/about';

  const navigateWithTransition = (to: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === to) return;

    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        navigate(to);
      });
    } else {
      navigate(to);
    }
  };

  return (
    <header className="top" role="banner">
      <div className="wrap">
        <div className="header-left">
          <NavLink
            className="brand"
            to="/"
            onClick={(e) => navigateWithTransition('/', e)}
            aria-label="Not From Here, home"
          >
            <BrandIcon />
            <span>
              Not <i>from</i> here
            </span>
          </NavLink>
          <LiveStatusBadge />
        </div>

        <nav aria-label="Main navigation">
          <NavLink
            to="/"
            onClick={(e) => navigateWithTransition('/', e)}
            aria-current={isHome ? 'page' : undefined}
          >
            {t('nav_home')}
          </NavLink>
          <NavLink
            to="/check"
            onClick={(e) => navigateWithTransition('/check', e)}
            aria-current={isCheck ? 'page' : undefined}
          >
            {t('nav_check')}
          </NavLink>
          <NavLink
            to="/record"
            onClick={(e) => navigateWithTransition('/record', e)}
            aria-current={isRecord ? 'page' : undefined}
          >
            {t('nav_record')}
            <span className="ct" id="navct">
              {sightings.length}
            </span>
          </NavLink>
          <NavLink
            to="/about"
            onClick={(e) => navigateWithTransition('/about', e)}
            aria-current={isAbout ? 'page' : undefined}
          >
            {t('nav_about')}
          </NavLink>
        </nav>

        <div className="header-right">
          {/* Quick Language Toggle */}
          <button
            type="button"
            className="lang-pill-btn"
            onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            aria-label={`Switch to ${lang === 'en' ? 'French' : 'English'}`}
            title={`Switch to ${lang === 'en' ? 'French' : 'English'}`}
          >
            {lang === 'en' ? 'FR' : 'EN'}
          </button>

          {/* Primary Action Button (hidden on /check) */}
          {!isCheck && (
            <button
              type="button"
              className="btn sm nav-try-btn"
              onClick={(e) => navigateWithTransition('/check', e)}
            >
              {t('nav_try_it')}
            </button>
          )}
        </div>
      </div>
      <ScrollProgressBar />
    </header>
  );
};

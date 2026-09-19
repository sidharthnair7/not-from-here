import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Drawer } from './components/Drawer';
import { Toast } from './components/Toast';
import { SkipLink } from './components/common/SkipLink';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Landing } from './pages/Landing';
import { Check } from './pages/Check';
import { NotFound } from './pages/NotFound';
import { useStore } from './state/store';

// Lazy-load Record and About routes to meet JS bundle budget (<150 kB initial gzipped JS)
const Record = lazy(() => import('./pages/Record'));
const About = lazy(() => import('./pages/About'));

const RouteEffects: React.FC = () => {
  const { pathname } = useLocation();
  const { closeDrawer } = useStore();

  useEffect(() => {
    window.scrollTo({ top: 0 });
    closeDrawer();
  }, [pathname, closeDrawer]);

  return null;
};

export const App: React.FC = () => {
  return (
    <>
      <SkipLink />
      <RouteEffects />
      <Header />
      <main id="app">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="wrap" style={{ padding: '80px 0', textAlign: 'center' }}>
                <div className="spin" style={{ margin: '0 auto 12px' }} />
                <span className="mono dim" style={{ fontSize: 13 }}>
                  Loading…
                </span>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/check" element={<Check />} />
              <Route path="/record" element={<Record />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Drawer />
      <Toast />
    </>
  );
};

export default App;

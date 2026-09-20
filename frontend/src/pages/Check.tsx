import React, { useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../state/store';
import { SCEN } from '../lib/fixtures';
import { PhotoFrame } from '../components/PhotoFrame';
import { Banner } from '../components/Banner';
import { Steps } from '../components/Steps';
import { Evidence } from '../components/Evidence';
import { RadarMiniMap } from '../components/common/RadarMiniMap';
import { SeoHead } from '../components/common/SeoHead';
import { useTranslation } from '../i18n/context';

export const Check: React.FC = () => {
  const {
    scn,
    upload,
    lat,
    lng,
    phase,
    result,
    live,
    selectScenario,
    setCoordinates,
    runCheck,
    showToast,
    copyText
  } = useStore();

  const [searchParams] = useSearchParams();
  const rightColRef = useRef<HTMLDivElement | null>(null);
  const leftColRef = useRef<HTMLDivElement | null>(null);

  // The sighting card is sticky. If it is taller than the window, stick it by its bottom instead of its top so the
  // Check button is always visible and the card never needs its own scrollbar.
  useEffect(() => {
    const el = leftColRef.current;
    if (!el) return;
    const place = () => {
      const header = 80;
      const overflow = el.offsetHeight + header + 16 - window.innerHeight;
      el.style.top = overflow > 0 ? `${header - overflow}px` : `${header}px`;
    };
    place();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(place) : null;
    ro?.observe(el);
    window.addEventListener('resize', place);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', place);
    };
  }, []);
  const { t } = useTranslation();

  // Support ?scn=... deep-linking
  useEffect(() => {
    const scnParam = searchParams.get('scn');
    if (scnParam && SCEN[scnParam] && scn !== scnParam) {
      selectScenario(scnParam);
    }
  }, [searchParams, scn, selectScenario]);

  // Keyboard shortcut hint: press Enter to check
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'Enter' &&
        (scn || upload) &&
        phase !== 'running' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        runCheck(rightColRef.current);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scn, upload, phase, runCheck]);

  const handleGeo = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          setCoordinates(+p.coords.latitude.toFixed(3), +p.coords.longitude.toFixed(3));
        },
        () => {
          showToast('Location blocked. Type coordinates instead.');
        }
      );
    } else {
      showToast('Location not available');
    }
  };

  const handleGo = () => {
    runCheck(rightColRef.current);
  };

  const handleDownloadTxt = (reportText: string) => {
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invasive-sighting-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Report downloaded');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async (reportText: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Suspected Invasive Species Report',
          text: reportText
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      copyText(reportText, 'Report text copied to clipboard');
    }
  };

  const canCheck = Boolean(scn || upload);
  const isRunning = phase === 'running';

  return (
    <>
      <SeoHead
        title="Check a Sighting"
        description="Verify suspected invasive plants and insects against Ontario's four gate rules."
      />

      <div className="wrap" id="main-content">
        <section className="hero">
          <h1>
            The model proposes. The rules <em>decide.</em>
          </h1>
          <p>
            Photograph a plant or insect you think might be invasive. Four rules check it against
            Ontario's list, real sightings nearby and the season. If any rule fails, we say no and
            show you why.
          </p>
        </section>

        <div className="grid">
          <div className="card" id="left" ref={leftColRef}>
            <h2>Your sighting</h2>
            <p className="sub">Drop a photo, or try one of the demo photos.</p>

            <PhotoFrame />

            <div className="demos" role="group" aria-label="Demo photos">
              {Object.entries(SCEN).map(([k, v]) => (
                <button
                  key={k}
                  data-k={k}
                  aria-pressed={scn === k}
                  disabled={isRunning}
                  onClick={() => selectScenario(k)}
                >
                  {v.tab}
                </button>
              ))}
            </div>

            <label className="lbl" htmlFor="lat">
              {t('loc_lbl')}
            </label>
            <div className="loc">
              <input
                id="lat"
                type="number"
                step="0.001"
                value={lat}
                aria-label="Latitude"
                onChange={(e) => setCoordinates(parseFloat(e.target.value) || 0, lng)}
              />
              <input
                id="lng"
                type="number"
                step="0.001"
                value={lng}
                aria-label="Longitude"
                onChange={(e) => setCoordinates(lat, parseFloat(e.target.value) || 0)}
              />
              <button className="ghost" id="geo" onClick={handleGeo}>
                {t('loc_btn')}
              </button>
            </div>

            {/* Proximity Radar Map */}
            <RadarMiniMap
              lat={lat}
              lng={lng}
              nearest={result?.nearest}
              count50={result?.evidence?.range?.count_50km ?? null}
              count200={result?.evidence?.range?.count_200km ?? null}
            />

            <button
              className="btn"
              id="go"
              disabled={!canCheck || isRunning}
              onClick={handleGo}
            >
              {isRunning ? t('checking_btn') : t('check_btn')}
            </button>
            <p className="hint-mono" style={{ margin: '8px 2px 0', fontSize: 12, color: 'var(--dim)' }}>
              {t('press_enter_hint')}
            </p>

            <p className="demo-note">
              {live
                ? 'Live: photos go to the local backend for one check and are not stored; only a hash of the photo and the rounded location go into the record.'
                : 'Demo mode: results come from sample data until the backend is connected. Photos you upload are not sent anywhere.'}
            </p>
          </div>

          <div id="right" ref={rightColRef}>
            <div id="banner">
              <Banner />
            </div>

            <div id="detail">
              <Steps />

              <div id="after">
                {phase === 'done' && result && (
                  <>
                    {result.verdict === 'REPORT' && (
                      <div className="rep print-report-box">
                        <h3>
                          Drafted report
                          <div className="rep-actions-bar" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button
                              className="btn sm line"
                              id="cp2"
                              onClick={() =>
                                copyText(result.report_text || '', 'Report text copied')
                              }
                            >
                              Copy
                            </button>
                            <button
                              className="btn sm line"
                              onClick={() => handleDownloadTxt(result.report_text || '')}
                            >
                              {t('download_txt')}
                            </button>
                            <button
                              className="btn sm line"
                              onClick={handlePrint}
                            >
                              {t('print_pdf')}
                            </button>
                            {'share' in navigator && (
                              <button
                                className="btn sm line"
                                onClick={() => handleShare(result.report_text || '')}
                              >
                                {t('share_web')}
                              </button>
                            )}
                          </div>
                        </h3>
                        <p>{result.report_text}</p>
                      </div>
                    )}

                    {result.how_to_tell && result.how_to_tell.tell.length > 0 && (
                      <div className="hot" data-testid="how-to-tell">
                        <b>How to tell</b>
                        {result.how_to_tell.compares && (
                          <p>Compared with: {result.how_to_tell.compares}</p>
                        )}
                        <ul>
                          {result.how_to_tell.tell.map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                        </ul>
                        {result.how_to_tell.source && (
                          <a href={result.how_to_tell.source} target="_blank" rel="noopener noreferrer">
                            Source
                          </a>
                        )}
                      </div>
                    )}

                    {result.verdict === 'NEW_RANGE' && (
                      <div className="hot">
                        <b>Route this to a person</b>
                        <p>
                          Call the Invading Species Hotline. Copy the number from the Invasive
                          Species Centre page rather than trusting anyone's memory, including ours.
                        </p>
                        <a
                          className="btn sm"
                          style={{ textDecoration: 'none', display: 'inline-block' }}
                          href="https://www.invasivespeciescentre.ca"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open Invasive Species Centre
                        </a>
                      </div>
                    )}

                    <details className="evi" id="evi">
                      <summary>
                        <span>
                          Evidence{' '}
                          <small>
                            {(result.proposals || []).length} proposers ·{' '}
                            {(result.nearest || []).length} nearby records · month histogram
                          </small>
                        </span>
                      </summary>
                      <div className="evi-body">
                        <Evidence result={result} />
                      </div>
                    </details>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer>
        <div className="wrap">
          Sample data shown. Live mode reads iNaturalist and the Invasive Species Centre through the
          Spring Boot API.
        </div>
      </footer>
    </>
  );
};

export default Check;

import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../state/store';
import { V } from '../lib/verdicts';
import { IconForVerdict, IdleIcon } from './Icons';

export const Banner: React.FC = () => {
  const { phase, result, scn, upload, offline, copyText } = useStore();

  if (offline) {
    return (
      <div className="banner pop" data-t="warn" role="status" data-testid="offline">
        <div className="v">
          <IdleIcon />
          <div>
            <h2>No model behind this page</h2>
            <p className="rule">Your photo was not analysed and was not sent anywhere.</p>
          </div>
        </div>
        <p className="why">
          This copy runs the interface only. The demo photos show real results captured from the full system. To
          check your own photo, run the backend on your machine or use the hosted copy: see the README on GitHub.
        </p>
      </div>
    );
  }

  if (phase === 'done' && result) {
    const t = V[result.verdict] || { label: result.verdict, tone: 'warn' };
    return (
      <div className="banner pop" data-t={t.tone} role="status">
        <div className="v">
          <IconForVerdict verdict={result.verdict} />
          <div>
            <h2>{t.label}</h2>
            <p className="rule">{result.rule}</p>
          </div>
        </div>
        <p className="why">{result.reason}</p>
        {result.note && (
          <p className="why" data-testid="note">
            {result.note}
          </p>
        )}
        {result.agreement && result.agreement.views > 1 && (
          <p className="rule" data-testid="agreement">
            {result.agreement.agreeing} of {result.agreement.views} views agree
            {result.agreement.needed ? ` (needs ${result.agreement.needed})` : ''}
          </p>
        )}
        {result.verdict === 'REPORT' && (
          <div className="actions">
            <button
              className="btn sm"
              id="cp"
              onClick={() => copyText(result.report_text || '', 'Report text copied')}
            >
              Copy report text
            </button>
            <Link
              className="btn sm line"
              style={{ textDecoration: 'none', display: 'inline-block' }}
              to="/record"
            >
              See it on the record
            </Link>
          </div>
        )}
      </div>
    );
  }

  const running = phase === 'running';
  const ready = Boolean(scn || upload);

  return (
    <div className="banner" data-t="idle">
      <div className="v">
        {running ? (
          <div className="spin" style={{ marginTop: 10 }}></div>
        ) : (
          <IdleIcon />
        )}
        <div>
          <h2>
            {running
              ? 'Checking four rules'
              : ready
              ? 'Ready to check'
              : 'Waiting for a photo'}
          </h2>
          <p className="rule">
            {running
              ? 'Each rule has to pass before the next one runs.'
              : 'The verdict appears here, in one of three colours.'}
          </p>
        </div>
      </div>
    </div>
  );
};

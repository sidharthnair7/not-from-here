import React from 'react';
import { useStore } from '../state/store';
import { RULES, V } from '../lib/verdicts';

export const Steps: React.FC = () => {
  const { steps, result } = useStore();

  const statusLabels: Record<string, string> = {
    idle: '',
    running: 'checking',
    pass: 'passed',
    fail: 'refused',
    skip: 'not run'
  };

  return (
    <ol className="steps" id="steps">
      {RULES.map((x, i) => {
        const s = steps[i];
        const warn = Boolean(result && V[result.verdict]?.tone === 'warn');
        const dstate = s === 'fail' && warn ? 'warnfail' : s;
        const label = statusLabels[s] || '';
        const detail =
          result && result.trace && result.trace[i] && s !== 'idle' && s !== 'running'
            ? result.trace[i]
            : x.d;

        return (
          <li className="step" data-s={dstate} key={i}>
            <span className="n">{s === 'pass' ? '✓' : s === 'fail' ? '✕' : i + 1}</span>
            <div>
              <div className="t">{x.t}</div>
              <div className="d">{detail}</div>
            </div>
            <span className="st">{label}</span>
          </li>
        );
      })}
    </ol>
  );
};

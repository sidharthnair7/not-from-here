import React from 'react';
import { MON } from '../lib/format';

interface HistSVGProps {
  hist: number[];
  month: number;
}

export const HistSVG: React.FC<HistSVGProps> = ({ hist, month }) => {
  const max = Math.max(1, ...hist),
    W = 300,
    H = 92,
    bw = 18,
    gap = 6,
    x0 = 4;

  return (
    <svg className="hist" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Ontario records by month">
      {hist.map((v, i) => {
        const h = Math.max(v ? 3 : 0, (v / max) * 62);
        const x = x0 + i * (bw + gap);
        const cur = i + 1 === month;
        const col = cur ? (v ? 'var(--acc)' : 'var(--stop)') : 'rgba(255,255,255,.2)';

        return (
          <React.Fragment key={i}>
            <rect x={x} y={72 - h} width={bw} height={h} rx={3} fill={col} />
            {v === 0 && (
              <rect
                x={x}
                y={70}
                width={bw}
                height={2}
                rx={1}
                fill={cur ? 'var(--stop)' : 'rgba(255,255,255,.2)'}
              />
            )}
            <text
              x={x + bw / 2}
              y={86}
              textAnchor="middle"
              style={cur ? { fill: 'var(--ink)' } : undefined}
            >
              {MON[i][0]}
            </text>
          </React.Fragment>
        );
      })}
    </svg>
  );
};

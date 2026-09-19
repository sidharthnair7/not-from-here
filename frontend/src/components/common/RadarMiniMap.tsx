import React from 'react';
import { useTranslation } from '../../i18n/context';

interface RadarMiniMapProps {
  lat: number;
  lng: number;
}

export const RadarMiniMap: React.FC<RadarMiniMapProps> = ({ lat, lng }) => {
  const { t } = useTranslation();

  // Deterministic faint dots around center based on coordinates
  const dots = [
    { dx: 18, dy: -12 },
    { dx: -24, dy: 16 },
    { dx: 38, dy: 22 },
    { dx: -15, dy: -32 },
    { dx: 52, dy: -8 }
  ];

  return (
    <div className="radar-box" role="img" aria-label={`${t('radar_title')}: ${lat}, ${lng}`}>
      <svg viewBox="0 0 280 110" className="radar-svg">
        <defs>
          <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--acc)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient glow */}
        <circle cx="140" cy="55" r="50" fill="url(#radar-glow)" />

        {/* Outer ring 200 km */}
        <circle
          cx="140"
          cy="55"
          r="48"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        <text x="144" y="14" fill="var(--dim)" fontSize="8" fontFamily="var(--mono)">
          200 km
        </text>

        {/* Inner ring 50 km */}
        <circle
          cx="140"
          cy="55"
          r="26"
          fill="none"
          stroke="rgba(169,186,255,0.2)"
          strokeWidth="1"
        />
        <text x="144" y="34" fill="var(--acc)" fontSize="8" fontFamily="var(--mono)">
          50 km
        </text>

        {/* Crosshair axes */}
        <line x1="88" y1="55" x2="192" y2="55" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <line x1="140" y1="8" x2="140" y2="102" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

        {/* Nearby faint record dots */}
        {dots.map((d, i) => (
          <circle
            key={i}
            cx={140 + d.dx}
            cy={55 + d.dy}
            r="2"
            fill="var(--acc)"
            opacity="0.35"
          />
        ))}

        {/* Sighting center dot */}
        <circle cx="140" cy="55" r="4" fill="var(--go)" />
        <circle cx="140" cy="55" r="8" fill="none" stroke="var(--go)" strokeWidth="1" opacity="0.4" className="pulse-ring" />
      </svg>
      <div className="radar-caption">
        <span>{t('radar_title')}</span>
        <span className="radar-coords">
          {lat.toFixed(3)}, {lng.toFixed(3)}
        </span>
      </div>
    </div>
  );
};

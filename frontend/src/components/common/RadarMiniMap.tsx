import React from 'react';
import { useTranslation } from '../../i18n/context';
import { NearestRecord } from '../../lib/mkResult';

interface RadarMiniMapProps {
  lat: number;
  lng: number;
  /** Real nearby records from the last check, plotted at their true bearing and distance. */
  nearest?: NearestRecord[];
  /** Research-grade record counts from the last check, shown on the rings. */
  count50?: number | null;
  count200?: number | null;
}

// SVG geometry: centre and the two ring radii (50 km and 200 km)
const CX = 140;
const CY = 100;
const R50 = 58;
const R200 = 92;

const toRad = (d: number) => (d * Math.PI) / 180;

/** Distance in km and initial bearing in degrees from (lat1,lng1) to (lat2,lng2). */
function distanceAndBearing(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const km = 2 * R * Math.asin(Math.sqrt(a));
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI; // 0 = north, clockwise
  return { km, bearing };
}

/** Radius on the radar for a distance: linear to the 50 km ring, then compressed to the 200 km ring. */
function radiusFor(km: number): number {
  if (km <= 50) return (km / 50) * R50;
  if (km <= 200) return R50 + ((km - 50) / 150) * (R200 - R50);
  return R200;
}

export const RadarMiniMap: React.FC<RadarMiniMapProps> = ({ lat, lng, nearest, count50, count200 }) => {
  const { t } = useTranslation();

  const points = (nearest || [])
    .filter((n) => typeof n.lat === 'number' && typeof n.lng === 'number' && !Number.isNaN(n.lat))
    .map((n) => {
      const { km, bearing } = distanceAndBearing(lat, lng, n.lat as number, n.lng as number);
      const r = radiusFor(km);
      const rad = toRad(bearing);
      return { x: CX + r * Math.sin(rad), y: CY - r * Math.cos(rad), km, place: n.place, date: n.date };
    });

  const hasCounts = typeof count50 === 'number' && typeof count200 === 'number';
  const label50 = hasCounts ? `50 km · ${count50}` : '50 km';
  const label200 = hasCounts ? `200 km · ${count200}` : '200 km';

  return (
    <div
      className="radar-box"
      role="img"
      aria-label={`${t('radar_title')}: ${lat}, ${lng}${points.length ? `, ${points.length} nearby records` : ''}`}
    >
      <svg viewBox="0 0 280 200" className="radar-svg">
        <defs>
          <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--acc)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={CX} cy={CY} r={R200} fill="url(#radar-glow)" />

        {/* 200 km ring */}
        <circle cx={CX} cy={CY} r={R200} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2 3" />
        <text x={CX + 4} y={CY - R200 + 10} fill="var(--dim)" fontSize="9" fontFamily="var(--mono)">
          {label200}
        </text>

        {/* 50 km ring */}
        <circle cx={CX} cy={CY} r={R50} fill="none" stroke="rgba(169,186,255,0.28)" strokeWidth="1" />
        <text x={CX + 4} y={CY - R50 + 10} fill="var(--acc)" fontSize="9" fontFamily="var(--mono)">
          {label50}
        </text>

        {/* crosshair */}
        <line x1={CX - R200} y1={CY} x2={CX + R200} y2={CY} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <line x1={CX} y1={CY - R200} x2={CX} y2={CY + R200} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <text x={CX - 3} y={CY - R200 - 2} fill="var(--dim)" fontSize="8" fontFamily="var(--mono)">N</text>

        {/* real records, at true bearing and distance */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3.2" fill="var(--acc)" opacity="0.9">
              <title>{`${p.km.toFixed(1)} km · ${p.date}${p.place ? ` · ${p.place}` : ''}`}</title>
            </circle>
            <circle cx={p.x} cy={p.y} r="6" fill="none" stroke="var(--acc)" strokeWidth="1" opacity="0.35" />
          </g>
        ))}

        {/* the sighting */}
        <circle cx={CX} cy={CY} r="4" fill="var(--go)" />
        <circle cx={CX} cy={CY} r="8" fill="none" stroke="var(--go)" strokeWidth="1" opacity="0.4" className="pulse-ring" />
      </svg>
      <div className="radar-caption">
        <span>
          {t('radar_title')}
          {points.length > 0 ? ` · ${points.length} nearest real sightings` : ''}
        </span>
        <span className="radar-coords">
          {lat.toFixed(3)}, {lng.toFixed(3)}
        </span>
      </div>
    </div>
  );
};

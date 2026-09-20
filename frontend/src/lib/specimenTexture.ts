import { Sighting } from './tile';
import { SP } from './species';
import { drawArt } from './art';
import { fmt } from './format';

const textureCache = new Map<string, string>();

/**
 * Generates a high-resolution 512x512 circular specimen tile data URL
 * optimized for mapping onto InfiniteMenu's icosahedron disc geometry.
 */
export function makeSpecimenDiscTexture(s: Sighting): string {
  const cacheKey = `${s.id}_${s.key}_${s.seed}`;
  const cached = textureCache.get(cacheKey);
  if (cached) return cached;

  const sp = SP[s.key] || SP.phragmites;
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  // Clip to disc circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
  ctx.clip();

  // Draw procedural botanical art as base
  drawArt(ctx, size, size, sp.kind, sp.hue, s.seed);

  // Overlay laboratory field lens rings
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
  ctx.stroke();

  // Subtle vignette gradient around rim
  const rimGrad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
  rimGrad.addColorStop(0, 'rgba(8, 11, 16, 0)');
  rimGrad.addColorStop(0.7, 'rgba(8, 11, 16, 0.35)');
  rimGrad.addColorStop(1, 'rgba(8, 11, 16, 0.9)');
  ctx.fillStyle = rimGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Specimen label plaque at bottom of disc
  const plaqueH = 110;
  const plaqueY = size - plaqueH;
  const plaqueGrad = ctx.createLinearGradient(0, plaqueY, 0, size);
  plaqueGrad.addColorStop(0, 'rgba(8, 11, 16, 0)');
  plaqueGrad.addColorStop(0.3, 'rgba(8, 11, 16, 0.85)');
  plaqueGrad.addColorStop(1, 'rgba(8, 11, 16, 0.98)');
  ctx.fillStyle = plaqueGrad;
  ctx.fillRect(0, plaqueY, size, plaqueH);

  // Status indicator pill
  const pillW = 88;
  const pillH = 24;
  const pillX = cx - pillW / 2;
  const pillY = size - 96;

  ctx.fillStyle = 'rgba(98, 213, 154, 0.2)';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(pillX, pillY, pillW, pillH, 12) : ctx.rect(pillX, pillY, pillW, pillH);
  ctx.fill();

  ctx.strokeStyle = 'rgba(98, 213, 154, 0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#62d59a';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VERIFIED', cx, pillY + 16);

  // Species Latin Name
  ctx.fillStyle = '#eef1f5';
  ctx.font = 'italic 500 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(sp.name, cx, size - 48, size - 40);

  // Common Name & Date
  ctx.fillStyle = '#93a0ad';
  ctx.font = '400 15px system-ui, sans-serif';
  ctx.fillText(`${sp.common} · ${fmt(s.date)}`, cx, size - 24);

  ctx.restore();

  // Outer border stroke
  ctx.strokeStyle = 'rgba(169, 186, 255, 0.35)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
  ctx.stroke();

  const dataUrl = canvas.toDataURL('image/png');
  textureCache.set(cacheKey, dataUrl);
  return dataUrl;
}

import { fmt } from './format';
import { SP } from './species';
import { drawArt, rr } from './art';
import { CheckResult } from './mkResult';
import { Verdict } from './verdicts';

export interface Sighting {
  id: string;
  key: string;
  date: string;
  place: string;
  seed: number;
  sample?: boolean;
  fresh?: boolean;
  res: CheckResult;
  tile?: HTMLCanvasElement;
}

export interface Refusal {
  id: string;
  key: string;
  date: string;
  verdict: Verdict;
  place: string;
  sample?: boolean;
  res: CheckResult;
}

export function makeTile(s: Sighting): HTMLCanvasElement {
  const sp = SP[s.key] || SP.phragmites,
    W = 240,
    H = 300,
    PH = 226,
    cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const c = cv.getContext('2d');
  if (!c) return cv;

  c.save();
  rr(c, 0, 0, W, H, 14);
  c.clip();
  c.fillStyle = '#0d1218';
  c.fillRect(0, 0, W, H);
  c.save();
  c.beginPath();
  c.rect(0, 0, W, PH);
  c.clip();
  drawArt(c, W, PH, sp.kind, sp.hue, s.seed);
  c.restore();
  c.fillStyle = '#0d1218';
  c.fillRect(0, PH, W, H - PH);
  c.fillStyle = '#eef1f5';
  c.font = 'italic 500 16px Fraunces, Georgia, serif';
  c.textBaseline = 'alphabetic';
  c.fillText(sp.name, 14, PH + 26, W - 28);
  c.fillStyle = '#93a0ad';
  c.font = '400 12.5px "Hanken Grotesk", system-ui, sans-serif';
  c.fillText(fmt(s.date), 14, PH + 46);
  c.fillStyle = 'rgba(98,213,154,.16)';
  rr(c, W - 84, PH + 34, 70, 20, 10);
  c.fill();
  c.fillStyle = '#62d59a';
  c.font = '600 11.5px "Hanken Grotesk", system-ui, sans-serif';
  c.textAlign = 'center';
  c.fillText('Report', W - 49, PH + 48);
  c.restore();
  c.strokeStyle = 'rgba(255,255,255,.14)';
  c.lineWidth = 1;
  rr(c, 0.5, 0.5, W - 1, H - 1, 14);
  c.stroke();
  return cv;
}

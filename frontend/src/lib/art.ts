import { rng } from './rng';
import { SpecimenKind } from './species';

export function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

export function reed(c: CanvasRenderingContext2D, w: number, h: number, hue: number, r: () => number) {
  c.fillStyle = 'rgba(16,26,38,.6)';
  c.fillRect(0, h * 0.82, w, h * 0.18);
  for (let i = 0; i < 17; i++) {
    const x = w * (0.06 + 0.88 * r()),
      top = h * (0.14 + 0.24 * r()),
      lean = (r() - 0.5) * w * 0.18,
      base = h * 0.88;
    c.strokeStyle = `hsl(${hue + 20},30%,${30 + r() * 16}%)`;
    c.lineWidth = 1.5 + r() * 1.6;
    c.beginPath();
    c.moveTo(x, base);
    c.quadraticCurveTo(x + lean * 0.2, (base + top) / 2, x + lean, top);
    c.stroke();
    for (let j = 0; j < 4; j++) {
      const t = 0.3 + j * 0.16,
        lx = x + lean * t * t,
        ly = base - (base - top) * t,
        d = r() < 0.5 ? -1 : 1;
      c.strokeStyle = `hsl(${hue + 25},36%,${32 + r() * 12}%)`;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(lx, ly);
      c.quadraticCurveTo(lx + d * w * 0.09, ly - h * 0.03, lx + d * w * 0.17, ly + h * 0.07);
      c.stroke();
    }
    for (let k = 0; k < 30; k++) {
      const a = -Math.PI / 2 + (r() - 0.5) * 1.5,
        l = h * (0.04 + 0.07 * r());
      c.strokeStyle = `rgba(${(205 + r() * 40) | 0},${(175 + r() * 40) | 0},${(190 + r() * 30) | 0},${0.3 + r() * 0.45})`;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x + lean, top + h * 0.05);
      c.lineTo(x + lean + Math.cos(a) * l * 0.8, top + h * 0.05 + Math.sin(a) * l);
      c.stroke();
    }
  }
}

export function leaf(c: CanvasRenderingContext2D, w: number, h: number, hue: number, r: () => number) {
  for (let i = 0; i < 24; i++) {
    const x = w * (0.08 + 0.84 * r()),
      y = h * (0.12 + 0.78 * r()),
      s = w * (0.09 + 0.1 * r()),
      a = r() * 6.283;
    c.save();
    c.translate(x, y);
    c.rotate(a);
    c.fillStyle = `hsla(${hue + r() * 30},${40 + r() * 22}%,${26 + r() * 24}%,.94)`;
    c.beginPath();
    c.moveTo(0, 0);
    c.bezierCurveTo(s * 0.5, -s * 0.55, s * 1.1, -s * 0.35, s * 1.3, 0);
    c.bezierCurveTo(s * 1.1, s * 0.35, s * 0.5, s * 0.55, 0, 0);
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,.2)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(s * 1.2, 0);
    c.stroke();
    c.restore();
  }
}

export function umbel(c: CanvasRenderingContext2D, w: number, h: number, hue: number, r: () => number) {
  for (let s = 0; s < 3; s++) {
    const x = w * (0.24 + 0.26 * s + (r() - 0.5) * 0.08),
      top = h * (0.24 + 0.14 * r());
    c.strokeStyle = `hsl(${hue + 40},28%,42%)`;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x, h);
    c.quadraticCurveTo(x + (r() - 0.5) * 24, h * 0.62, x, top);
    c.stroke();
    for (let i = 0; i < 26; i++) {
      const a = (i / 25) * Math.PI,
        ex = x + Math.cos(a) * w * 0.17,
        ey = top - Math.sin(a) * h * 0.1;
      c.strokeStyle = 'rgba(220,235,200,.55)';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(x, top + h * 0.02);
      c.lineTo(ex, ey);
      c.stroke();
      c.fillStyle = 'rgba(248,250,236,.92)';
      c.beginPath();
      c.arc(ex, ey, 2.4 + r() * 2, 0, 7);
      c.fill();
    }
  }
}

export function vine(c: CanvasRenderingContext2D, w: number, h: number, hue: number, r: () => number) {
  for (let k = 0; k < 3; k++) {
    let x = w * (0.2 + 0.3 * k),
      y = h;
    c.strokeStyle = `hsl(${hue + 30},28%,40%)`;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(x, y);
    const pts: [number, number][] = [];
    for (let i = 1; i <= 8; i++) {
      x += (r() - 0.5) * w * 0.34;
      y = h - (i * h) / 8.6;
      pts.push([x, y]);
      c.lineTo(x, y);
    }
    c.stroke();
    pts.forEach(([px, py]) => {
      for (const d of [-1, 1]) {
        c.fillStyle = `hsla(${hue + r() * 24},46%,${30 + r() * 16}%,.95)`;
        c.beginPath();
        c.ellipse(px + d * w * 0.06, py, w * 0.07, w * 0.024, d * 0.35, 0, 7);
        c.fill();
      }
    });
    c.strokeStyle = 'rgba(190,220,120,.8)';
    c.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const [px, py] = pts[3 + i] || pts[7];
      c.beginPath();
      c.moveTo(px, py);
      c.lineTo(px + (r() - 0.5) * 10, py + h * 0.06);
      c.stroke();
    }
  }
}

export function beetle(c: CanvasRenderingContext2D, w: number, h: number, _hue: number, r: () => number) {
  for (let i = 0; i < 32; i++) {
    c.strokeStyle = `rgba(255,255,255,${0.03 + r() * 0.05})`;
    c.lineWidth = 1 + r() * 2;
    const x = r() * w;
    c.beginPath();
    c.moveTo(x, 0);
    c.bezierCurveTo(x + 20, h * 0.3, x - 20, h * 0.6, x + (r() - 0.5) * 30, h);
    c.stroke();
  }
  c.save();
  c.translate(w / 2, h * 0.52);
  c.rotate(r() * 0.5 - 0.25);
  c.strokeStyle = 'rgba(12,22,18,.95)';
  c.lineWidth = 3.2;
  for (const s of [-1, 1])
    for (let i = 0; i < 3; i++) {
      const y = -h * 0.05 + i * h * 0.065;
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(s * w * 0.2, y - h * 0.035);
      c.lineTo(s * w * 0.3, y + h * 0.05);
      c.stroke();
    }
  const g = c.createLinearGradient(-w * 0.1, -h * 0.2, w * 0.1, h * 0.2);
  g.addColorStop(0, '#69f5b8');
  g.addColorStop(0.5, '#16a06a');
  g.addColorStop(1, '#0a5a45');
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(0, h * 0.04, w * 0.13, h * 0.2, 0, 0, 7);
  c.fill();
  c.beginPath();
  c.ellipse(0, -h * 0.2, w * 0.07, h * 0.05, 0, 0, 7);
  c.fill();
  c.strokeStyle = 'rgba(0,0,0,.35)';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(0, -h * 0.14);
  c.lineTo(0, h * 0.24);
  c.stroke();
  c.strokeStyle = 'rgba(12,22,18,.95)';
  c.lineWidth = 2;
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(s * w * 0.03, -h * 0.24);
    c.quadraticCurveTo(s * w * 0.1, -h * 0.34, s * w * 0.16, -h * 0.3);
    c.stroke();
  }
  c.restore();
}

export function fly(c: CanvasRenderingContext2D, w: number, h: number, _hue: number, r: () => number) {
  c.strokeStyle = 'rgba(110,82,58,.7)';
  c.lineWidth = 12;
  c.beginPath();
  c.moveTo(-10, h * 0.86);
  c.quadraticCurveTo(w * 0.5, h * 0.68, w + 10, h * 0.92);
  c.stroke();
  c.save();
  c.translate(w / 2, h * 0.5);
  c.rotate(-0.12);
  for (const s of [-1, 1]) {
    c.save();
    c.scale(s, 1);
    c.fillStyle = 'rgba(196,182,178,.96)';
    c.beginPath();
    c.moveTo(0, -h * 0.05);
    c.bezierCurveTo(w * 0.26, -h * 0.36, w * 0.44, -h * 0.1, w * 0.31, h * 0.22);
    c.bezierCurveTo(w * 0.2, h * 0.28, w * 0.06, h * 0.15, 0, h * 0.1);
    c.fill();
    c.fillStyle = 'rgba(38,28,30,.78)';
    for (let i = 0; i < 10; i++) {
      c.beginPath();
      c.arc(w * (0.06 + 0.26 * r()), h * (-0.22 + 0.36 * r()), 2 + r() * 3.2, 0, 7);
      c.fill();
    }
    c.fillStyle = 'rgba(215,72,84,.9)';
    c.beginPath();
    c.moveTo(w * 0.05, h * 0.1);
    c.quadraticCurveTo(w * 0.26, h * 0.15, w * 0.29, h * 0.25);
    c.quadraticCurveTo(w * 0.12, h * 0.27, w * 0.05, h * 0.19);
    c.fill();
    c.restore();
  }
  c.fillStyle = '#cdbb86';
  c.beginPath();
  c.ellipse(0, h * 0.05, w * 0.05, h * 0.16, 0, 0, 7);
  c.fill();
  c.fillStyle = '#3a2f2b';
  c.beginPath();
  c.ellipse(0, -h * 0.13, w * 0.035, h * 0.04, 0, 0, 7);
  c.fill();
  c.restore();
}

export function mussel(c: CanvasRenderingContext2D, w: number, h: number, _hue: number, r: () => number) {
  c.fillStyle = 'rgba(14,24,34,.55)';
  c.fillRect(0, h * 0.6, w, h * 0.4);
  for (let i = 0; i < 8; i++) {
    const x = w * (0.14 + 0.72 * r()),
      y = h * (0.4 + 0.42 * r()),
      s = w * (0.09 + 0.07 * r());
    c.save();
    c.translate(x, y);
    c.rotate((r() - 0.5) * 1.3);
    const P = () => {
      c.beginPath();
      c.moveTo(0, -s);
      c.bezierCurveTo(s * 0.95, -s * 0.55, s * 0.9, s * 0.6, 0, s);
      c.bezierCurveTo(-s * 0.9, s * 0.6, -s * 0.95, -s * 0.55, 0, -s);
    };
    P();
    c.fillStyle = `hsl(${34 + r() * 16},${26 + r() * 14}%,${44 + r() * 16}%)`;
    c.fill();
    c.strokeStyle = 'rgba(28,18,8,.5)';
    c.lineWidth = 1.4;
    for (let k = 0.25; k < 1; k += 0.2) {
      c.save();
      c.scale(k, k);
      P();
      c.restore();
      c.stroke();
    }
    c.strokeStyle = 'rgba(28,18,8,.45)';
    c.lineWidth = 3;
    for (let k = -2; k <= 2; k++) {
      c.beginPath();
      c.moveTo(k * s * 0.2, -s * 0.8);
      c.lineTo(k * s * 0.28, s * 0.8);
      c.stroke();
    }
    c.restore();
  }
}

export function spike(c: CanvasRenderingContext2D, w: number, h: number, _hue: number, r: () => number) {
  for (let s = 0; s < 4; s++) {
    const x = w * (0.18 + 0.21 * s),
      top = h * (0.14 + 0.18 * r());
    c.strokeStyle = 'hsl(112,26%,32%)';
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(x, h);
    c.lineTo(x + (r() - 0.5) * 10, top);
    c.stroke();
    for (let i = 0; i < 80; i++) {
      const t = r(),
        y = top + h * 0.6 * t * 0.65,
        rad = Math.max(2, 6.5 * (1 - t * 0.75));
      c.fillStyle = `hsla(${312 + r() * 20},70%,${50 + r() * 16}%,.92)`;
      c.beginPath();
      c.arc(x + (r() - 0.5) * rad * 3, y, rad * 0.62, 0, 7);
      c.fill();
    }
  }
}

export function cattail(c: CanvasRenderingContext2D, w: number, h: number, hue: number, r: () => number) {
  c.fillStyle = 'rgba(16,26,38,.6)';
  c.fillRect(0, h * 0.84, w, h * 0.16);
  for (let i = 0; i < 10; i++) {
    const x = w * (0.08 + 0.84 * r()),
      top = h * (0.2 + 0.2 * r()),
      base = h * 0.9,
      lean = (r() - 0.5) * w * 0.1;
    c.strokeStyle = `hsl(${hue + 50},32%,${34 + r() * 10}%)`;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x, base);
    c.quadraticCurveTo(x, (base + top) / 2, x + lean, top);
    c.stroke();
    c.lineWidth = 5;
    c.strokeStyle = `hsl(${hue + 65},30%,${30 + r() * 10}%)`;
    c.beginPath();
    c.moveTo(x + 6, base);
    c.quadraticCurveTo(x + w * 0.12 * (r() - 0.5), base - h * 0.4, x + w * 0.14 * (r() < 0.5 ? -1 : 1), top + h * 0.15);
    c.stroke();
    c.fillStyle = `hsl(${22 + r() * 8},48%,${24 + r() * 8}%)`;
    c.beginPath();
    if ('roundRect' in c && typeof (c as unknown as { roundRect?: (...args: number[]) => void }).roundRect === 'function') {
      (c as unknown as { roundRect: (...args: number[]) => void }).roundRect(x + lean - 4.5, top, 9, h * 0.14, 4.5);
    } else {
      c.rect(x + lean - 4.5, top, 9, h * 0.14);
    }
    c.fill();
  }
}

const painters: Record<string, (c: CanvasRenderingContext2D, w: number, h: number, hue: number, r: () => number) => void> = {
  reed,
  leaf,
  umbel,
  vine,
  beetle,
  fly,
  mussel,
  spike,
  cattail
};

export function drawArt(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  kind: SpecimenKind | string,
  hue: number,
  seed: number
) {
  const r = rng(seed);
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, `hsl(${hue},36%,31%)`);
  g.addColorStop(0.6, `hsl(${hue + 15},30%,16%)`);
  g.addColorStop(1, `hsl(${hue + 25},32%,8%)`);
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  const sg = c.createRadialGradient(w * 0.74, h * 0.26, 0, w * 0.74, h * 0.26, w * 0.55);
  sg.addColorStop(0, 'rgba(255,238,205,.38)');
  sg.addColorStop(1, 'rgba(255,238,205,0)');
  c.fillStyle = sg;
  c.fillRect(0, 0, w, h);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  (painters[kind] || leaf)(c, w, h, hue, r);
  for (let i = 0; i < (w * h) / 80; i++) {
    c.fillStyle = `rgba(255,255,255,${r() * 0.06})`;
    c.fillRect(r() * w, r() * h, 1, 1);
  }
  const v = c.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.9);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,.55)');
  c.fillStyle = v;
  c.fillRect(0, 0, w, h);
}

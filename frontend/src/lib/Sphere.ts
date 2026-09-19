import { Sighting } from './tile';
import { rr } from './art';

export interface ProjectedTile {
  i: number;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
}

export interface DragState {
  x: number;
  y: number;
  moved: number;
}

export interface FocusTarget {
  yaw: number;
  pitch: number;
  i: number;
}

export class Sphere {
  cv: HTMLCanvasElement;
  c: CanvasRenderingContext2D;
  items: (Sighting & { tile: HTMLCanvasElement })[];
  onPick: (item: Sighting) => void;
  onHover: (item: Sighting | null) => void;
  getNewId?: () => string | null;

  yaw = 0.4;
  pitch = -0.12;
  vy = 0;
  vp = 0;
  drag: DragState | null = null;
  hover = -1;
  target: FocusTarget | null = null;
  dead = false;
  proj: ProjectedTile[] = [];
  last = 0;
  W = 0;
  H = 0;

  pts: [number, number, number][];
  stars: [number, number, number, number][];
  ro: ResizeObserver;
  rafId: number | null = null;

  private onPointerDownHandler: (e: PointerEvent) => void;
  private onPointerMoveHandler: (e: PointerEvent) => void;
  private onPointerUpHandler: (e: PointerEvent) => void;
  private onPointerCancelHandler: () => void;
  private onPointerLeaveHandler: () => void;

  constructor(
    cv: HTMLCanvasElement,
    items: (Sighting & { tile: HTMLCanvasElement })[],
    onPick: (item: Sighting) => void,
    onHover: (item: Sighting | null) => void,
    getNewId?: () => string | null
  ) {
    this.cv = cv;
    const ctx = cv.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.c = ctx;
    this.items = items;
    this.onPick = onPick;
    this.onHover = onHover;
    this.getNewId = getNewId;

    const n = items.length;
    this.pts = items.map((_, i) => {
      const y = 1 - (2 * (i + 0.5)) / n,
        rad = Math.sqrt(1 - y * y),
        th = i * 2.399963;
      return [Math.cos(th) * rad, y, Math.sin(th) * rad];
    });

    this.stars = Array.from({ length: 120 }, () => [
      Math.random(),
      Math.random(),
      0.4 + Math.random() * 1.2,
      Math.random() * 6.28
    ]);

    this.ro = new ResizeObserver(() => this.resize());
    if (cv.parentElement) {
      this.ro.observe(cv.parentElement);
    }
    this.resize();

    this.onPointerDownHandler = (e: PointerEvent) => {
      cv.setPointerCapture(e.pointerId);
      this.drag = { x: e.clientX, y: e.clientY, moved: 0 };
      this.target = null;
      cv.classList.add('gr');
    };

    this.onPointerMoveHandler = (e: PointerEvent) => {
      if (this.drag) {
        const dx = e.clientX - this.drag.x,
          dy = e.clientY - this.drag.y;
        this.drag.x = e.clientX;
        this.drag.y = e.clientY;
        this.drag.moved += Math.abs(dx) + Math.abs(dy);
        this.yaw += dx * 0.006;
        this.pitch += dy * 0.006;
        this.vy = dx * 0.006;
        this.vp = dy * 0.006;
        this.clamp();
      } else {
        this.setHover(this.pick(e));
      }
    };

    this.onPointerUpHandler = (e: PointerEvent) => {
      if (!this.drag) return;
      const m = this.drag.moved;
      this.drag = null;
      cv.classList.remove('gr');
      if (m < 7) {
        const i = this.pick(e);
        if (i >= 0) this.onPick(this.items[i]);
      }
    };

    this.onPointerCancelHandler = () => {
      this.drag = null;
      cv.classList.remove('gr');
    };

    this.onPointerLeaveHandler = () => {
      if (!this.drag) this.setHover(-1);
    };

    cv.addEventListener('pointerdown', this.onPointerDownHandler);
    cv.addEventListener('pointermove', this.onPointerMoveHandler);
    cv.addEventListener('pointerup', this.onPointerUpHandler);
    cv.addEventListener('pointercancel', this.onPointerCancelHandler);
    cv.addEventListener('pointerleave', this.onPointerLeaveHandler);

    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  destroy() {
    this.dead = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.ro.disconnect();
    this.cv.removeEventListener('pointerdown', this.onPointerDownHandler);
    this.cv.removeEventListener('pointermove', this.onPointerMoveHandler);
    this.cv.removeEventListener('pointerup', this.onPointerUpHandler);
    this.cv.removeEventListener('pointercancel', this.onPointerCancelHandler);
    this.cv.removeEventListener('pointerleave', this.onPointerLeaveHandler);
  }

  clamp() {
    this.pitch = Math.max(-1.15, Math.min(1.15, this.pitch));
  }

  resize() {
    const p = this.cv.parentElement;
    if (!p) return;
    const d = Math.min(2, window.devicePixelRatio || 1);
    this.W = p.clientWidth;
    this.H = p.clientHeight;
    this.cv.width = this.W * d;
    this.cv.height = this.H * d;
    this.c.setTransform(d, 0, 0, d, 0, 0);
  }

  rot(p: [number, number, number]): [number, number, number] {
    const cy = Math.cos(this.yaw),
      sy = Math.sin(this.yaw),
      x = p[0] * cy + p[2] * sy,
      z1 = -p[0] * sy + p[2] * cy,
      cp = Math.cos(this.pitch),
      sp = Math.sin(this.pitch);
    return [x, p[1] * cp - z1 * sp, p[1] * sp + z1 * cp];
  }

  focus(i: number) {
    if (i < 0 || i >= this.pts.length) return;
    const [x, y, z] = this.pts[i],
      yaw = Math.atan2(-x, z),
      z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
    this.target = { yaw, pitch: Math.atan2(y, z1), i };
  }

  pick(e: PointerEvent): number {
    const b = this.cv.getBoundingClientRect(),
      px = e.clientX - b.left,
      py = e.clientY - b.top;
    for (let k = this.proj.length - 1; k >= 0; k--) {
      const q = this.proj[k];
      if (q.z > -0.2 && Math.abs(px - q.x) < q.w / 2 && Math.abs(py - q.y) < q.h / 2) return q.i;
    }
    return -1;
  }

  setHover(i: number) {
    if (i === this.hover) return;
    this.hover = i;
    this.cv.classList.toggle('pt', i >= 0);
    this.onHover(i >= 0 ? this.items[i] : null);
  }

  loop(t: number) {
    if (this.dead || !this.cv.isConnected) {
      this.ro.disconnect();
      return;
    }

    // Pause physics/rendering if the tab is hidden
    if (typeof document !== 'undefined' && document.hidden) {
      this.rafId = requestAnimationFrame((nextT) => this.loop(nextT));
      return;
    }

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dt = Math.min(50, t - (this.last || t)) / 16;
    this.last = t;

    if (!this.drag) {
      if (this.target) {
        let dy = this.target.yaw - this.yaw;
        dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        this.yaw += dy * 0.06;
        this.pitch += (this.target.pitch - this.pitch) * 0.06;
        if (Math.abs(dy) < 0.004) this.target = null;
      } else {
        this.yaw += this.vy * dt;
        this.pitch += this.vp * dt;
        this.vy *= 0.94;
        this.vp *= 0.94;
        if (!reduce && this.hover < 0) this.yaw += 0.0016 * dt;
      }
      this.clamp();
    }

    this.draw(t);
    this.rafId = requestAnimationFrame((nextT) => this.loop(nextT));
  }

  draw(t: number) {
    const c = this.c,
      W = this.W,
      H = this.H,
      cx = W / 2,
      cy = H / 2 - 8,
      R = Math.min(W * 0.4, H * 0.4),
      n = this.items.length;
    c.clearRect(0, 0, W, H);

    for (const s of this.stars) {
      c.globalAlpha = 0.25 + 0.35 * Math.sin(t / 1400 + s[3]);
      c.fillStyle = '#cfd8ff';
      c.beginPath();
      c.arc(s[0] * W, s[1] * H, s[2] * 0.7, 0, 7);
      c.fill();
    }
    c.globalAlpha = 1;

    const g = c.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.45);
    g.addColorStop(0, 'rgba(120,140,255,.14)');
    g.addColorStop(0.6, 'rgba(120,140,255,.04)');
    g.addColorStop(1, 'rgba(120,140,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    c.strokeStyle = 'rgba(169,186,255,.09)';
    c.lineWidth = 1;
    c.beginPath();
    c.arc(cx, cy, R * 1.02, 0, 7);
    c.stroke();

    const tw = Math.max(58, Math.min(150, R * Math.sqrt((4 * Math.PI) / n) * 0.56)),
      D = 3.3,
      list: ProjectedTile[] = [];

    this.pts.forEach((p, i) => {
      const [x, y, z] = this.rot(p),
        k = D / (D - z),
        w = tw * k;
      list.push({ i, x: cx + x * R * k, y: cy - y * R * k, z, w, h: w * 1.25 });
    });
    list.sort((a, b) => a.z - b.z);
    this.proj = list;

    const currentNewId = this.getNewId ? this.getNewId() : null;

    for (const q of list) {
      const it = this.items[q.i],
        a = Math.max(0.16, Math.min(1, 0.2 + (0.85 * (q.z + 1)) / 2));
      c.globalAlpha = a;
      c.shadowColor = 'rgba(0,0,0,.55)';
      c.shadowBlur = q.z > 0 ? 18 : 0;
      c.shadowOffsetY = q.z > 0 ? 8 : 0;
      c.drawImage(it.tile, q.x - q.w / 2, q.y - q.h / 2, q.w, q.h);
      c.shadowBlur = 0;
      c.shadowOffsetY = 0;

      if (q.i === this.hover) {
        c.globalAlpha = 1;
        c.strokeStyle = '#a9baff';
        c.lineWidth = 2;
        rr(c, q.x - q.w / 2 - 3, q.y - q.h / 2 - 3, q.w + 6, q.h + 6, 16);
        c.stroke();
      }

      if (currentNewId && it.id === currentNewId && q.z > -0.3) {
        const p = (Math.sin(t / 380) + 1) / 2;
        c.globalAlpha = 0.9 * (1 - p * 0.6);
        c.strokeStyle = '#62d59a';
        c.lineWidth = 2;
        rr(
          c,
          q.x - q.w / 2 - 4 - p * 5,
          q.y - q.h / 2 - 4 - p * 5,
          q.w + 8 + p * 10,
          q.h + 8 + p * 10,
          18
        );
        c.stroke();
      }
    }
    c.globalAlpha = 1;
  }
}

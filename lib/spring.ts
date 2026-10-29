/**
 * Apple-style springs, described by damping ratio and response (seconds) rather than duration.
 * Interruptible: re-targeting a running spring keeps its live value and velocity.
 */
export type Spring = {
  x: number; v: number; target: number; raf: number;
  zeta: number; response: number; eps: number;
  onUpdate?: (x: number) => void; onRest?: () => void;
};
export type SpringOptions = { zeta?: number; response?: number; eps?: number; velocity?: number; onUpdate?: (x: number) => void; onRest?: () => void };

export const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function spring(x: number): Spring { return { x, v: 0, target: x, raf: 0, zeta: 1, response: 0.4, eps: 0.4 }; }
export function stop(s: Spring) { if (s.raf) cancelAnimationFrame(s.raf); s.raf = 0; s.v = 0; }

export function animate(s: Spring, target: number, o: SpringOptions = {}) {
  s.target = target;
  if (o.velocity !== undefined) s.v = o.velocity;
  s.zeta = o.zeta ?? 1; s.response = o.response ?? 0.4; s.eps = o.eps ?? 0.4;
  s.onUpdate = o.onUpdate; s.onRest = o.onRest;
  if (prefersReducedMotion()) { stop(s); s.x = target; s.onUpdate?.(s.x); s.onRest?.(); return; }
  if (s.raf) return;
  let last = performance.now();
  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 30); last = now;
    const k = Math.pow((2 * Math.PI) / s.response, 2), c = (4 * Math.PI * s.zeta) / s.response;
    for (let i = 0, h = dt / 4; i < 4; i++) { const a = -k * (s.x - s.target) - c * s.v; s.v += a * h; s.x += s.v * h; }
    if (Math.abs(s.x - s.target) < s.eps && Math.abs(s.v) < s.eps * 10) {
      s.x = s.target; s.v = 0; s.raf = 0; s.onUpdate?.(s.x); s.onRest?.(); return;
    }
    s.onUpdate?.(s.x);
    s.raf = requestAnimationFrame(tick);
  };
  s.raf = requestAnimationFrame(tick);
}

/** Where a flick would come to rest (Apple's projection from Designing Fluid Interfaces). */
export const project = (v: number, d = 0.998) => ((v / 1000) * d) / (1 - d);
/** Progressive resistance past a boundary. */
export const rubber = (over: number, dim: number, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over));

export function tracker() {
  const h: { t: number; y: number }[] = [];
  return {
    add(t: number, y: number) { h.push({ t, y }); while (h.length > 2 && t - h[0].t > 100) h.shift(); },
    v() { if (h.length < 2) return 0; const a = h[0], b = h[h.length - 1]; return (b.y - a.y) / Math.max((b.t - a.t) / 1000, 0.008); }
  };
}
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

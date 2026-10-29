"use client";
import type { CSSProperties } from "react";
import type { Show } from "./types";

/**
 * Generated stand-in artwork for shows that have no photo yet. Deterministic per show id,
 * styled by its first medium. Runs in the browser only and is cached per show.
 */
const PALETTES = [
  ["#24392F", "#C99A4E", "#8B3A2B", "#E6D8BE"], ["#1E2742", "#3D5A99", "#B4532E", "#EDE6D6"], ["#0E1424", "#2A3554", "#F2A33C", "#F7E3B5"],
  ["#3A3D3C", "#8E918C", "#4F7C80", "#D9D6CE"], ["#0F1011", "#E0B04A", "#C2452D", "#7FA8A0"], ["#4A2A1C", "#B0613A", "#D88B57", "#E9D3B8"],
  ["#141B33", "#2F4B8C", "#D46A4C", "#CFC7E0"], ["#1F1D1A", "#C2412E", "#2D6A8C", "#EFE8DA"], ["#0F2230", "#1F4E6E", "#9CC6D9", "#E8F1F2"],
  ["#2B1D2E", "#8C3B5E", "#D9A441", "#F0E6E0"], ["#09090B", "#2B6CB0", "#E35D4F", "#F5E6C8"], ["#3B2A1E", "#8A5A35", "#C9A26B", "#D7CBB4"]
];
const STYLE_FOR: Record<string, string> = { Painting: "painting", Drawing: "design", Photography: "photo", Sculpture: "sculpture", Installation: "installation", Textile: "textile", Video: "video", Print: "design", Design: "design", Performance: "installation", "Mixed media": "painting" };

function mulberry32(a: number) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const rgba = (hex: string, a: number) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
type G = CanvasRenderingContext2D; type R = () => number;

const STYLES: Record<string, (g: G, r: R, P: string[], w: number, h: number) => void> = {
  painting(g, r, P, w, h) {
    g.fillStyle = P[0]; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) { const x = r() * w, y = r() * h, rad = 140 + r() * 280, col = P[1 + Math.floor(r() * 3)]; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba(col, 0.8)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
    g.lineCap = "round";
    for (let i = 0; i < 160; i++) { g.strokeStyle = rgba(P[Math.floor(r() * 4)], 0.05 + r() * 0.14); g.lineWidth = 2 + r() * 16; const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (r() - 0.5) * 180, y + (r() - 0.5) * 60, x + (r() - 0.5) * 280, y + (r() - 0.5) * 90); g.stroke(); }
  },
  photo(g, r, P, w, h) {
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, P[0]); sky.addColorStop(0.6, P[1]); sky.addColorStop(1, P[0]); g.fillStyle = sky; g.fillRect(0, 0, w, h);
    let x = -10; g.fillStyle = "rgba(0,0,0,.55)"; while (x < w) { const bw = 40 + r() * 90, bh = 160 + r() * 330; g.fillRect(x, h - bh, bw, bh); x += bw + 4; }
    for (let i = 0; i < 70; i++) { const bx = r() * w, by = h * 0.35 + r() * h * 0.55, br = 3 + r() * 26; g.shadowColor = P[2]; g.shadowBlur = 30; g.fillStyle = rgba(r() > 0.2 ? P[2] : P[3], 0.15 + r() * 0.5); g.beginPath(); g.arc(bx, by, br, 0, Math.PI * 2); g.fill(); }
    g.shadowBlur = 0;
    const v = g.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.75); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.65)"); g.fillStyle = v; g.fillRect(0, 0, w, h);
  },
  sculpture(g, r, P, w, h) {
    const wall = g.createLinearGradient(0, 0, 0, h * 0.72); wall.addColorStop(0, P[3]); wall.addColorStop(1, P[1]); g.fillStyle = wall; g.fillRect(0, 0, w, h * 0.72);
    g.fillStyle = P[0]; g.fillRect(0, h * 0.72, w, h * 0.28);
    const pw = 230, ph = 170, px = (w - pw) / 2, py = h * 0.72 - ph * 0.55;
    g.fillStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.ellipse(w / 2 + 30, h * 0.78, 200, 34, 0, 0, Math.PI * 2); g.fill();
    const pg = g.createLinearGradient(px, 0, px + pw, 0); pg.addColorStop(0, "#E9E6DF"); pg.addColorStop(1, "#A9A59C"); g.fillStyle = pg; g.fillRect(px, py, pw, ph);
    const n = 1 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) { const cx = w / 2 + (i - (n - 1) / 2) * 70, rw = 52 + r() * 40, rh = 80 + r() * 120, cy = py - rh * 0.9; const sg = g.createRadialGradient(cx - rw * 0.4, cy - rh * 0.3, 4, cx, cy, rh); sg.addColorStop(0, rgba(P[3], 0.95)); sg.addColorStop(0.5, P[2]); sg.addColorStop(1, P[0]); g.fillStyle = sg; g.beginPath(); g.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2); g.fill(); }
  },
  textile(g, r, P, w, h) {
    g.fillStyle = P[0]; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 5) { const band = Math.floor((Math.sin(y / (30 + r() * 4)) + 1) * 1.5 + r() * 0.8); g.fillStyle = rgba(P[clamp(band, 0, 3)], 0.75 + r() * 0.25); g.fillRect(0, y, w, 4); }
    g.fillStyle = "rgba(0,0,0,.18)"; for (let x = 0; x < w; x += 5) g.fillRect(x, 0, 1.5, h);
    g.strokeStyle = rgba(P[3], 0.55); g.lineWidth = 3; const s = 60 + Math.floor(r() * 30);
    for (let y = s / 2; y < h; y += s) for (let x = (Math.floor(y / s) % 2) * (s / 2); x < w + s; x += s) { g.beginPath(); g.moveTo(x, y - s / 3); g.lineTo(x + s / 3, y); g.lineTo(x, y + s / 3); g.lineTo(x - s / 3, y); g.closePath(); g.stroke(); }
  },
  installation(g, r, P, w, h) {
    g.fillStyle = P[0]; g.fillRect(0, 0, w, h);
    const cols = 5, rows = 8, cw = w / cols, rh = h / rows;
    g.strokeStyle = rgba(P[3], 0.2); g.lineWidth = 1; for (let i = 0; i < 30; i++) { g.beginPath(); g.moveTo(r() * w, r() * h); g.lineTo(r() * w, r() * h); g.stroke(); }
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { if (r() < 0.25) continue; const x = i * cw + 14 + r() * 10, y = j * rh + 18 + r() * 8; const on = r() < 0.4; g.shadowColor = P[1]; g.shadowBlur = on ? 40 : 0; g.fillStyle = on ? rgba(P[1], 0.85) : rgba(P[2 + Math.floor(r() * 2)], 0.35); g.fillRect(x, y, cw - 34, rh - 42); }
    g.shadowBlur = 0;
  },
  video(g, r, P, w, h) {
    g.fillStyle = P[0]; g.fillRect(0, 0, w, h);
    const beam = g.createLinearGradient(0, h, 0, h * 0.3); beam.addColorStop(0, rgba(P[3], 0.3)); beam.addColorStop(1, rgba(P[3], 0)); g.fillStyle = beam; g.beginPath(); g.moveTo(w / 2 - 8, h); g.lineTo(w * 0.08, h * 0.22); g.lineTo(w * 0.92, h * 0.22); g.lineTo(w / 2 + 8, h); g.fill();
    const sx = w * 0.1, sy = h * 0.16, sw = w * 0.8, sh = h * 0.3; const sc = g.createLinearGradient(sx, 0, sx + sw, 0); sc.addColorStop(0, P[1]); sc.addColorStop(0.6, P[3]); sc.addColorStop(1, P[2]);
    g.shadowColor = P[3]; g.shadowBlur = 90; g.fillStyle = sc; g.fillRect(sx, sy, sw, sh); g.shadowBlur = 0;
    g.fillStyle = "rgba(0,0,0,.2)"; for (let y = sy; y < sy + sh; y += 3) g.fillRect(sx, y, sw, 1);
    g.fillStyle = "rgba(0,0,0,.85)"; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(w * (0.1 + i * 0.1), h * 0.82 + (i % 2) * 30, 30, 46, 0, 0, Math.PI * 2); g.fill(); }
  },
  design(g, r, P, w, h) {
    g.fillStyle = P[3]; g.fillRect(0, 0, w, h);
    g.strokeStyle = rgba(P[0], 0.08); g.lineWidth = 1;
    for (let x = 0; x < w; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    for (let i = 0; i < 16; i++) { g.save(); g.translate(r() * w, r() * h); g.rotate((r() - 0.5) * 0.6); g.shadowColor = "rgba(0,0,0,.25)"; g.shadowBlur = 10; g.shadowOffsetY = 4; g.fillStyle = P[Math.floor(r() * 3)]; const a = 40 + r() * 160, b = 30 + r() * 120; if (r() < 0.5) g.fillRect(-a / 2, -b / 2, a, b); else { g.beginPath(); g.moveTo(-a / 2, b / 2); g.lineTo(0, -b / 2); g.lineTo(a / 2, b / 2); g.closePath(); g.fill(); } g.restore(); }
  }
};

const cache = new Map<string, string>();
export function palette(s: Show) { return PALETTES[hash(s.id) % PALETTES.length]; }
/** A CSS background-image value for a show: its first photo, or a generated stand-in. */
export function artUrl(s: Show): string {
  if (s.photos[0]) return s.photos[0];
  const hit = cache.get(s.id); if (hit) return hit;
  if (typeof document === "undefined") return "";
  const c = document.createElement("canvas"); c.width = 600; c.height = 800;
  const g = c.getContext("2d"); if (!g) return "";
  const style = STYLE_FOR[s.mediums[0]] || "painting";
  STYLES[style](g, mulberry32(hash(s.id)), palette(s), 600, 800);
  const url = c.toDataURL("image/jpeg", 0.82);
  cache.set(s.id, url);
  return url;
}
export const artStyle = (s: Show): CSSProperties => {
  const u = artUrl(s);
  const p = palette(s);
  return u ? { backgroundImage: `url("${u}")` } : { backgroundImage: `linear-gradient(160deg, ${p[1]}, ${p[0]})` };
};

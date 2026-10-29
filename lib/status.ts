import type { Show, Walk } from "./types";
import { locale, type Lang, type T } from "./i18n";

const DAY = 864e5;
/** Parse a local "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm" as a date in the viewer's clock. */
export function parseLocal(s: string): Date {
  const [d, t] = s.split("T");
  const [y, m, dd] = d.split("-").map(Number);
  const [hh, mm] = (t || "00:00").split(":").map(Number);
  return new Date(y, m - 1, dd, hh || 0, mm || 0);
}
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const dayDiff = (d: Date, now = new Date()) => Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / DAY);
export const hourOf = (d: Date) => d.getHours() + d.getMinutes() / 60;
export const fmtTime = (h: number) => { const hh = Math.floor(h), mm = Math.round((h - hh) * 60); const ap = hh >= 12 ? "pm" : "am"; const h12 = ((hh + 11) % 12) + 1; return mm ? `${h12}:${String(mm).padStart(2, "0")} ${ap}` : `${h12} ${ap}`; };
export const fmtDate = (d: Date, l: Lang, withYear = false) => d.toLocaleDateString(locale(l), withYear ? { day: "numeric", month: "short", year: "numeric" } : { day: "numeric", month: "short" });
export const weekday = (d: Date, l: Lang) => d.toLocaleDateString(locale(l), { weekday: "long" });

const endOf = (s: Show) => { const e = parseLocal(s.end); e.setHours(23, 59, 59); return e; };
export const isEnded = (s: Show, now = new Date()) => now > endOf(s);
export function isOpenNow(s: Show, now = new Date()) {
  const h = hourOf(now);
  return now >= parseLocal(s.start) && now <= endOf(s) && s.openDays.includes(now.getDay()) && h >= s.openFrom && h < s.openTo;
}

export type StatusKind = "opening" | "soon" | "ended" | "closing" | "open" | "closed";
export function status(s: Show, t: T, l: Lang, now = new Date()): { kind: StatusKind; text: string } {
  const rel = (d: Date) => { const n = dayDiff(d, now); return n === 0 ? t.relToday : n === 1 ? t.relTomorrow : weekday(d, l); };
  if (s.openingAt) {
    const o = parseLocal(s.openingAt);
    if (o > now && o.getTime() - now.getTime() < 8 * DAY) return { kind: "opening", text: t.sOpening(rel(o), fmtTime(hourOf(o))) };
  }
  const start = parseLocal(s.start);
  if (now < start) return { kind: "soon", text: t.sOpens(fmtDate(start, l)) };
  if (isEnded(s, now)) return { kind: "ended", text: "" };
  const left = dayDiff(parseLocal(s.end), now);
  if (left <= 5) return { kind: "closing", text: left <= 0 ? t.sLastDay : left === 1 ? t.sClosesTomorrow : t.sClosingIn(left) };
  if (isOpenNow(s, now)) return { kind: "open", text: t.sOpen(fmtTime(s.openTo)) };
  if (s.openDays.includes(now.getDay()) && hourOf(now) < s.openFrom) return { kind: "closed", text: t.sClosedOpens(fmtTime(s.openFrom)) };
  for (let i = 1; i < 8; i++) {
    const d = new Date(startOfDay(now).getTime() + i * DAY);
    if (d >= startOfDay(start) && s.openDays.includes(d.getDay())) return { kind: "closed", text: t.sClosedOpens(i === 1 ? t.relTomorrow : weekday(d, l)) };
  }
  return { kind: "closed", text: t.sClosed };
}

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_SHORT_HI = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];
export function hoursLabel(s: Show, l: Lang) {
  const names = l === "hi" ? DAY_SHORT_HI : DAY_SHORT;
  const order = [1, 2, 3, 4, 5, 6, 0];
  const idx = order.map((d, i) => (s.openDays.includes(d) ? i : -1)).filter(i => i >= 0);
  let days: string;
  if (idx.length === 7) days = l === "hi" ? "रोज़" : "Daily";
  else {
    const runs: string[] = []; let a = idx[0], p = idx[0];
    for (let i = 1; i <= idx.length; i++) {
      if (idx[i] === p + 1) { p = idx[i]; continue; }
      runs.push(a === p ? names[order[a]] : `${names[order[a]]}–${names[order[p]]}`);
      a = p = idx[i];
    }
    days = runs.join(", ");
  }
  return `${days}, ${fmtTime(s.openFrom)} – ${fmtTime(s.openTo)}`;
}

/** Great-circle distance in km. */
export function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371, toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type WalkPlan = Walk & { shows: Show[]; legs: { km: number; mins: number; auto: boolean }[]; km: number; mins: number; auto: boolean };
export function planWalk(w: Walk, byId: Map<string, Show>): WalkPlan | null {
  const shows = w.stops.map(id => byId.get(id)).filter((s): s is Show => !!s);
  if (shows.length < 2) return null;
  const legs = shows.slice(1).map((s, i) => {
    const d = km(shows[i], s) * 1.3; // streets are not straight lines
    const auto = d > 1.6;
    return { km: d, mins: Math.max(3, Math.round(auto ? (d / 18) * 60 + 6 : (d / 4.8) * 60)), auto };
  });
  const total = legs.reduce((n, l) => n + l.km, 0);
  return { ...w, shows, legs, km: total, mins: legs.reduce((n, l) => n + l.mins, 0) + 20 * shows.length, auto: legs.some(l => l.auto) };
}

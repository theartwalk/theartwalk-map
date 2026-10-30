import type { AppData, ArtEvent, Show, Walk } from "./types";
import { MEDIUMS } from "./types";
import { AREAS } from "./areas";
import { getSheetData, list, normDateTime, parseDays, parseHour, parseHoursText, photoUrl } from "./sheet";
import { sampleData } from "@/data/sample";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "./supabase";

/**
 * Where the map's shows come from, in order:
 * 1. Supabase (the `events`, `galleries` and `walks` tables) when NEXT_PUBLIC_SUPABASE_URL is set.
 * 2. The Google Sheet when SHEET_ID is set.
 * 3. The built-in sample data.
 * Results are cached for five minutes.
 */
const REVALIDATE_SECONDS = 300;
type Row = Record<string, unknown>;

async function rest(path: string): Promise<Row[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    next: { revalidate: REVALIDATE_SECONDS }
  });
  if (!res.ok) throw new Error(`Supabase ${path.split("?")[0]} returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());
const num = (v: unknown) => { const n = typeof v === "number" ? v : parseFloat(str(v)); return Number.isFinite(n) && n !== 0 ? n : undefined; };
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(str).filter(Boolean) : list(str(v)));
const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-11-01", "1 Nov 2026", "Nov 1, 2026" → "2026-11-01"; anything else → "". */
export function isoDate(v: unknown): string {
  const s = str(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (!s) return "";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/** "6:30 PM", "18:30", "6 pm – 9 pm" → "18:30"; anything else → "". */
export function clockTime(v: unknown): string {
  const m = str(v).match(/(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?/i);
  if (!m) return "";
  let h = Number(m[1]); const min = m[2] ? Number(m[2]) : 0, ap = m[3]?.toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return h < 24 && min < 60 ? `${pad(h)}:${pad(min)}` : "";
}
function areaFor(...texts: string[]): string | undefined {
  for (const t of texts) {
    if (!t) continue;
    if (AREAS[t]) return t;
    const k = key(t), hit = Object.keys(AREAS).find(a => k.includes(key(a)));
    if (hit) return hit;
  }
  return undefined;
}

export function fromSupabase(events: Row[], galleries: Row[], walks: Row[]): AppData {
  const galleryByName = new Map(galleries.map(g => [key(str(g.name)), g]));
  const shows: Show[] = [];
  const artEvents: ArtEvent[] = [];
  const mediumOf = new Map(MEDIUMS.map(m => [m.toLowerCase(), m as string]));

  for (const e of events) {
    if (e.show_on_map === false) continue;
    const id = str(e.id), title = str(e.title), venue = str(e.venue);
    const start = isoDate(e.date), end = isoDate(e.end_date) || start;
    if (!id || !title || !start) continue;
    const gal = galleryByName.get(key(venue)) ?? galleries.find(g => key(venue).includes(key(str(g.name))) && str(g.name).length > 3);
    const area = areaFor(str(e.area), str(gal?.area)) ?? (str(e.area) || str(gal?.area) || "Delhi");
    const known = areaFor(area, str(e.address), str(gal?.address));
    const lat = num(e.lat) ?? num(gal?.lat) ?? num(gal?.latitude) ?? (known ? AREAS[known].lat : undefined);
    const lng = num(e.lng) ?? num(gal?.lng) ?? num(gal?.longitude) ?? (known ? AREAS[known].lng : undefined);
    if (!lat || !lng) continue; // can't place it on the map yet

    const hoursText = parseHoursText(str(e.regular_hours)) ?? parseHoursText(str(gal?.default_hours));
    const mediums = arr(e.mediums).length ? arr(e.mediums) : arr(e.tags).map(t => mediumOf.get(t.toLowerCase())).filter((m): m is string => !!m);
    const photos = [str(e.image_url), ...arr(e.photos)].map(photoUrl).filter((u, i, a) => /^https?:\/\//.test(u) && a.indexOf(u) === i);
    const type = str(e.type) || "Exhibition";
    const time = clockTime(e.time);
    const openingAt = normDateTime(str(e.opening_at)) || (/opening/i.test(type) && time ? `${start}T${time}` : "");

    shows.push({
      id, galleryId: str(gal?.id) || key(venue), gallery: venue || str(gal?.name), area, address: str(e.address) || str(gal?.address),
      lat, lng, instagram: str(gal?.instagram),
      title, artists: arr(e.artists), mediums,
      start, end: end < start ? start : end, openingAt,
      openDays: str(e.open_days) ? parseDays(str(e.open_days)) : hoursText?.days ?? [2, 3, 4, 5, 6, 0],
      openFrom: str(e.open_from) ? parseHour(str(e.open_from), 11) : hoursText?.from ?? 11,
      openTo: str(e.open_to) ? parseHour(str(e.open_to), 19) : hoursText?.to ?? 19,
      entry: str(e.price) || "Free", about: str(e.description),
      photos, photoCredit: str(e.photo_credit)
    });
    if (openingAt) artEvents.push({ id: `opening-${id}`, type: "Opening night", showId: id, walkId: "", startsAt: openingAt, note: "" });
    else if (!/exhibition/i.test(type) && time) artEvents.push({ id: `event-${id}`, type, showId: id, walkId: "", startsAt: `${start}T${time}`, note: str(e.date_label) });
  }

  const ids = new Set(shows.map(s => s.id));
  const walkList: Walk[] = walks
    .map(w => ({ id: str(w.id), title: str(w.title), titleHi: str(w.title_hi) || str(w.title), stops: arr(w.stops).filter(s => ids.has(s)) }))
    .filter(w => w.id && w.title && w.stops.length >= 2);
  return { shows, walks: walkList, events: artEvents, source: "supabase", generatedAt: new Date().toISOString() };
}

export async function getData(): Promise<AppData> {
  if (!supabaseConfigured) return getSheetData();
  try {
    const [events, galleries, walks] = await Promise.all([
      rest("events?select=*"),
      rest("galleries?select=*").catch(() => [] as Row[]),
      rest("walks?select=*&published=is.true").catch(() => [] as Row[]) // table appears after 01_friends.sql
    ]);
    return fromSupabase(events, galleries, walks);
  } catch (err) {
    console.error("[theartwalk] Could not read Supabase, falling back.", err);
    return process.env.SHEET_ID ? getSheetData() : sampleData();
  }
}

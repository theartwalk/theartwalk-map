import Papa from "papaparse";
import type { AppData, ArtEvent, Show, Walk } from "./types";
import { AREAS } from "./areas";
import { sampleData } from "@/data/sample";

/**
 * Reads the master Google Sheet (tabs: Galleries, Exhibitions, Walks, Events) through the
 * public CSV export. Column names match the Art Walk Gallery Data Kit.
 * Results are cached for five minutes, so edits to the sheet reach the site within about five minutes.
 */
const REVALIDATE_SECONDS = 300;
type Row = Record<string, string>;

function tabUrl(sheetId: string, tab: string) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
}
async function readTab(sheetId: string, tab: string, required: boolean): Promise<Row[]> {
  const res = await fetch(tabUrl(sheetId, tab), { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) { if (required) throw new Error(`Sheet tab "${tab}" returned ${res.status}`); return []; }
  const text = await res.text();
  const parsed = Papa.parse<Row>(text, { header: true, skipEmptyLines: true, transformHeader: h => h.trim().toLowerCase() });
  return parsed.data.map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, (v ?? "").trim()])));
}

const DAY_INDEX: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
export const list = (s: string) => s.split(",").map(x => x.trim()).filter(Boolean);
export function parseDays(s: string): number[] {
  if (!s) return [2, 3, 4, 5, 6, 0];
  if (/daily/i.test(s)) return [0, 1, 2, 3, 4, 5, 6];
  return list(s).map(d => DAY_INDEX[d.slice(0, 3).toLowerCase()]).filter(n => n !== undefined);
}
export function parseHour(s: string, fallback: number): number {
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!m) return fallback;
  return Number(m[1]) + (m[2] ? Number(m[2]) / 60 : 0);
}
export function parseHoursText(s: string): { days: number[]; from: number; to: number } | null {
  // "Tue–Sun 11:00–19:00", used for a gallery's default_hours
  const m = s.match(/^(.*?)\s+(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})$/);
  if (!m) return null;
  const range = m[1].match(/^(\w{3})\s*[–-]\s*(\w{3})$/);
  let days: number[];
  if (range) {
    const a = DAY_INDEX[range[1].toLowerCase()], b = DAY_INDEX[range[2].toLowerCase()];
    days = []; for (let i = a; ; i = (i + 1) % 7) { days.push(i); if (i === b) break; }
  } else days = parseDays(m[1]);
  return { days, from: parseHour(m[2], 11), to: parseHour(m[3], 19) };
}
/** Turns a Google Drive share link into a direct image URL; leaves other URLs alone. */
export function photoUrl(s: string): string {
  if (!s) return "";
  const m = s.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]+)/);
  return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1600` : s;
}
export const normDateTime = (s: string) => s ? s.replace(" ", "T").slice(0, 16) : "";
const yes = (s: string) => /^(y|yes|true|1)$/i.test(s);

function fromSheet(galleries: Row[], exhibitions: Row[], walks: Row[], events: Row[]): AppData {
  const g = new Map(galleries.map(r => [r.gallery_id, r]));
  const shows: Show[] = [];
  for (const r of exhibitions) {
    if ((r.status || "").toLowerCase() !== "live" || !yes(r.consent)) continue;
    const gal = g.get(r.gallery_id);
    if (!gal || !r.show_id || !r.title || !r.start_date || !r.end_date) continue;
    const area = gal.area || "Delhi";
    const lat = Number(gal.lat) || AREAS[area]?.lat, lng = Number(gal.lng) || AREAS[area]?.lng;
    if (!lat || !lng) continue;
    const def = parseHoursText(gal.default_hours || "");
    shows.push({
      id: r.show_id, galleryId: r.gallery_id, gallery: gal.name || r.gallery_id, area, address: gal.address || "",
      lat, lng, instagram: gal.instagram || "",
      title: r.title, artists: list(r.artists), mediums: list(r.mediums),
      start: r.start_date, end: r.end_date, openingAt: normDateTime(r.opening_at),
      openDays: r.open_days ? parseDays(r.open_days) : def?.days ?? [2, 3, 4, 5, 6, 0],
      openFrom: r.open_from ? parseHour(r.open_from, 11) : def?.from ?? 11,
      openTo: r.open_to ? parseHour(r.open_to, 19) : def?.to ?? 19,
      entry: r.entry || "Free", about: r.about || "",
      photos: [r.photo_1, r.photo_2, r.photo_3].map(photoUrl).filter(Boolean), photoCredit: r.photo_credit || ""
    });
  }
  const ids = new Set(shows.map(s => s.id));
  const walkList: Walk[] = walks.map(r => ({ id: r.walk_id, title: r.title, titleHi: r.title_hi || r.title, stops: list(r.stops).filter(id => ids.has(id)) }))
    .filter(w => w.id && w.title && w.stops.length >= 2);
  const walkIds = new Set(walkList.map(w => w.id));
  const eventList: ArtEvent[] = events.map(r => ({ id: r.event_id, type: r.type || "Event", showId: ids.has(r.show_id) ? r.show_id : "", walkId: walkIds.has(r.walk_id) ? r.walk_id : "", startsAt: normDateTime(r.starts_at), note: r.note || "" }))
    .filter(e => e.id && e.startsAt && (e.showId || e.walkId));
  return { shows, walks: walkList, events: eventList, source: "sheet", generatedAt: new Date().toISOString() };
}

/** Reads the Google Sheet when SHEET_ID is set; otherwise, or on error, the sample data. */
export async function getSheetData(): Promise<AppData> {
  const id = process.env.SHEET_ID;
  if (!id) return sampleData();
  try {
    const [galleries, exhibitions, walks, events] = await Promise.all([
      readTab(id, "Galleries", true), readTab(id, "Exhibitions", true), readTab(id, "Walks", false), readTab(id, "Events", false)
    ]);
    // Once a sheet is configured, never mix in invented shows, even if the sheet has none live yet.
    return fromSheet(galleries, exhibitions, walks, events);
  } catch (err) {
    console.error("[theartwalk] Could not read the Google Sheet, using sample data instead.", err);
    return sampleData();
  }
}

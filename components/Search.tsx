"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AREAS } from "@/lib/areas";
import { useApp } from "./context";
import { ShowRow } from "./bits";
import { IconSearch } from "./icons";

/** Searches show titles, galleries, artists and areas (English or Hindi area names). */
export default function Search({ onClose }: { onClose: () => void }) {
  const { data, t, dist, st } = useApp();
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => input.current?.focus(), 30); }, []);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [onClose]);

  const live = useMemo(() => data.shows.filter(s => st(s).kind !== "ended"), [data.shows, st]);
  const query = q.trim().toLowerCase();
  const has = (s: string) => s.toLowerCase().includes(query);
  let body: React.ReactNode;
  if (!query) {
    body = <><div className="list-h">{t.hShows}</div>{[...live].sort((a, b) => dist(a) - dist(b)).map(s => <ShowRow key={s.id} show={s} />)}</>;
  } else {
    const shows = live.filter(s => has(s.title));
    const gals = live.filter(s => has(s.gallery) && !shows.includes(s));
    const arts = live.filter(s => s.artists.some(has) && !shows.includes(s) && !gals.includes(s));
    const areas = live.filter(s => (has(s.area) || has(AREAS[s.area]?.hi || "")) && !shows.includes(s) && !gals.includes(s) && !arts.includes(s));
    const sec = (h: string, list: typeof live, artistLine = false) => list.length ? <><div className="list-h">{h}</div>{list.map(s => <ShowRow key={s.id} show={s} extra={artistLine ? <span className="meta" style={{ display: "block" }}>{s.artists.join(", ")}</span> : undefined} />)}</> : null;
    const any = shows.length + gals.length + arts.length + areas.length;
    body = any ? <>{sec(t.hShows, shows)}{sec(t.hGalleries, gals)}{sec(t.hArtists, arts, true)}{sec(t.hAreas, areas)}</> : <div className="empty">{t.noResults}</div>;
  }
  return (
    <div className="overlay" role="dialog" aria-label={t.search}>
      <div className="search-bar">
        <label><IconSearch /><input ref={input} type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t.searchPh} aria-label={t.search} autoComplete="off" /></label>
        <button type="button" className="cancel" onClick={onClose}>{t.cancel}</button>
      </div>
      <div className="overlay-scroll"><div className="results">{body}</div></div>
    </div>
  );
}

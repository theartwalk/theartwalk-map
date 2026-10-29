"use client";
import type { Show } from "@/lib/types";
import { artStyle } from "@/lib/placeholder";
import { areaName, medium } from "@/lib/i18n";
import type { WalkPlan } from "@/lib/status";
import { useApp } from "./context";
import { IconBookmark } from "./icons";

export function Status({ show }: { show: Show }) {
  const { st } = useApp();
  const s = st(show);
  return s.text ? <span className={`status ${s.kind}`}>{s.text}</span> : null;
}

export function Pills({ show }: { show: Show }) {
  const { lang } = useApp();
  return <div className="pills">{show.mediums.map(m => <span key={m} className="pill">{medium(m, lang)}</span>)}</div>;
}

export function SaveButton({ show }: { show: Show }) {
  const { personal, toggleSave, t } = useApp();
  const on = !!personal.saved[show.id];
  return (
    <button type="button" className="save-btn" aria-pressed={on} aria-label={t.save}
      onClick={e => { e.stopPropagation(); toggleSave(show.id); }}>
      <IconBookmark />
    </button>
  );
}

/** A list row for a show: thumbnail, title, gallery and area, then status or a custom line. */
export function ShowRow({ show, extra }: { show: Show; extra?: React.ReactNode }) {
  const { openDetail, lang } = useApp();
  return (
    <button type="button" className="row-item" onClick={e => openDetail(show, (e.currentTarget.querySelector(".thumb") as HTMLElement) || e.currentTarget)}>
      <span className="thumb" style={artStyle(show)} />
      <span style={{ minWidth: 0 }}>
        <span className="rt">{show.title}</span>
        <span className="meta" style={{ display: "block" }}>{show.gallery} · {areaName(show.area, lang)}</span>
        {extra ?? <Status show={show} />}
      </span>
    </button>
  );
}

/** A tiny drawing of a walk's route, normalised to fit a 54px tile. */
export function RouteThumb({ walk, size = 54 }: { walk: WalkPlan; size?: number }) {
  const xs = walk.shows.map(s => s.lng), ys = walk.shows.map(s => -s.lat);
  const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
  const span = Math.max(maxx - minx, maxy - miny, 1e-6), inner = size - 20, sc = inner / span;
  const pts = walk.shows.map(s => [10 + (s.lng - minx) * sc + (inner - (maxx - minx) * sc) / 2, 10 + (-s.lat - miny) * sc + (inner - (maxy - miny) * sc) / 2]);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" style={{ display: "block" }}>
      <polyline points={pts.map(p => p.join(",")).join(" ")} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" />)}
    </svg>
  );
}

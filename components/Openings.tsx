"use client";
import { artStyle } from "@/lib/placeholder";
import { areaName, eventType } from "@/lib/i18n";
import { dayDiff, fmtDate, fmtTime, hourOf, parseLocal, weekday } from "@/lib/status";
import { useApp } from "./context";
import { RouteThumb } from "./bits";

/** The next seven days of opening nights, talks and walks, grouped by day. */
export default function Openings({ topInset }: { topInset: number }) {
  const { data, t, lang, now, byId, walks, openDetail, startWalk } = useApp();
  const soon = data.events
    .map(e => ({ ...e, at: parseLocal(e.startsAt) }))
    .filter(e => e.at.getTime() > now.getTime() - 2 * 36e5 && dayDiff(e.at, now) <= 7)
    .sort((a, b) => a.at.getTime() - b.at.getTime());
  let last: number | null = null;
  return (
    <div className="page">
      <div className="page-in" style={{ paddingTop: topInset + 16 }}>
        <h2>{t.eventsTitle}</h2>
        <p className="sub">{t.eventsSub}</p>
        {soon.length === 0 && <div className="empty">{t.eventsEmpty}</div>}
        {soon.map(ev => {
          const d = dayDiff(ev.at, now);
          const header = d !== last ? <div className="day-h">{d === 0 ? t.today : d === 1 ? t.tomorrow : `${weekday(ev.at, lang)} · ${fmtDate(ev.at, lang)}`}</div> : null;
          last = d;
          const w = ev.walkId ? walks.find(x => x.id === ev.walkId) : undefined;
          const s = ev.showId ? byId.get(ev.showId) : undefined;
          if (!w && !s) return null;
          return (
            <div key={ev.id}>
              {header}
              {w ? (
                <button type="button" className="ev" onClick={() => startWalk(w.id)}>
                  <span className="time">{fmtTime(hourOf(ev.at))}</span>
                  <span style={{ minWidth: 0 }}>
                    <span className="type">{eventType(ev.type, lang)}</span>
                    <span className="rt">{lang === "hi" ? w.titleHi : w.title}</span>
                    <span className="meta" style={{ display: "block" }}>{ev.note ? `${ev.note} · ` : ""}{t.walkMeta(w.shows.length, t.hm(w.mins), w.km.toFixed(1))}</span>
                  </span>
                  <span className="route-thumb" style={{ width: 48, height: 48 }}><RouteThumb walk={w} size={48} /></span>
                </button>
              ) : s && (
                <button type="button" className="ev" onClick={e => openDetail(s, (e.currentTarget.querySelector(".thumb") as HTMLElement) || e.currentTarget)}>
                  <span className="time">{fmtTime(hourOf(ev.at))}</span>
                  <span style={{ minWidth: 0 }}>
                    <span className="type">{eventType(ev.type, lang)}</span>
                    <span className="rt">{s.title}</span>
                    <span className="meta" style={{ display: "block" }}>{s.gallery} · {areaName(s.area, lang)}</span>
                  </span>
                  <span className="thumb" style={artStyle(s)} />
                </button>
              )}
            </div>
          );
        })}
        <p className="note">{t.eventsNote}</p>
      </div>
    </div>
  );
}

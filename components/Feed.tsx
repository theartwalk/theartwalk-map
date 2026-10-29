"use client";
import type { Show } from "@/lib/types";
import { artStyle } from "@/lib/placeholder";
import { areaName } from "@/lib/i18n";
import { fmtDate, parseLocal } from "@/lib/status";
import { useApp } from "./context";
import { Pills, SaveButton } from "./bits";

/** Full-screen cards, one show per screen, swiped vertically. */
export default function Feed({ shows, topInset }: { shows: Show[]; topInset: number }) {
  const { t, lang, st, distLabel, openDetail } = useApp();
  return (
    <div className="feed">
      {shows.map(s => {
        const status = st(s);
        return (
          <article key={s.id} className="card" tabIndex={0} aria-label={`${s.title}, ${s.gallery}`}
            onClick={e => openDetail(s, e.currentTarget)}
            onKeyDown={e => { if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) { e.preventDefault(); openDetail(s, e.currentTarget); } }}>
            <div className="art" style={artStyle(s)} />
            {status.text && <span className={`status ${status.kind}`} style={{ top: topInset + 6 }}>{status.text}</span>}
            <div className="card-body">
              <div className="gal">{s.gallery} · {areaName(s.area, lang)}</div>
              <h3>{s.title}</h3>
              <div className="row">
                <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
                  <div className="meta">{s.artists.join(", ")} · {t.until(fmtDate(parseLocal(s.end), lang))} · {distLabel(s)}</div>
                  <Pills show={s} />
                </div>
                <SaveButton show={s} />
              </div>
            </div>
          </article>
        );
      })}
      <div className="feed-end"><strong>{t.feedEnd}</strong><span>{shows.length ? t.feedEndSub : t.feedNone}</span></div>
    </div>
  );
}

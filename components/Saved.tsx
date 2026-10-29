"use client";
import { useState } from "react";
import { medium } from "@/lib/i18n";
import { fmtDate } from "@/lib/status";
import { useApp } from "./context";
import { ShowRow } from "./bits";

/** Want-to-see list and the visit diary. Both live on this device. */
export default function Saved({ topInset }: { topInset: number }) {
  const { t, lang, personal, byId } = useApp();
  const [tab, setTab] = useState<"saved" | "visited">("saved");
  const savedIds = Object.keys(personal.saved).filter(id => byId.has(id)).sort((a, b) => personal.saved[b] - personal.saved[a]);
  const visitedIds = Object.keys(personal.visited).filter(id => byId.has(id)).sort((a, b) => personal.visited[b] - personal.visited[a]);
  const counts: Record<string, number> = {};
  visitedIds.forEach(id => byId.get(id)!.mediums.forEach(m => { counts[m] = (counts[m] || 0) + 1; }));

  return (
    <div className="page">
      <div className="page-in" style={{ paddingTop: topInset + 16 }}>
        <div className="seg" role="tablist" aria-label={t.saved}>
          <button type="button" role="tab" aria-selected={tab === "saved"} onClick={() => setTab("saved")}>{t.wantToSee}<span className="c">{savedIds.length}</span></button>
          <button type="button" role="tab" aria-selected={tab === "visited"} onClick={() => setTab("visited")}>{t.diary}<span className="c">{visitedIds.length}</span></button>
        </div>
        {tab === "saved" ? (
          savedIds.length ? savedIds.map(id => <ShowRow key={id} show={byId.get(id)!} />)
            : <div className="empty"><strong>{t.emptySavedH}</strong>{t.emptySaved}</div>
        ) : visitedIds.length ? (
          <>
            <div className="summary"><strong>{t.seen(visitedIds.length)}</strong>
              {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([m, n]) => <span key={m} className="pill">{medium(m, lang)} · {n}</span>)}
            </div>
            {visitedIds.map(id => <ShowRow key={id} show={byId.get(id)!} extra={<span className="status">{t.visitedOn(fmtDate(new Date(personal.visited[id]), lang))}</span>} />)}
          </>
        ) : <div className="empty"><strong>{t.emptyDiaryH}</strong>{t.emptyDiary}</div>}
        <p className="note">{t.deviceNote}</p>
      </div>
    </div>
  );
}

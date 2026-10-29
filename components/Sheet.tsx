"use client";
import { useEffect, useRef } from "react";
import { animate, project, rubber, spring, stop, tracker } from "@/lib/spring";

export type Snap = "hidden" | "peek" | "half" | "full";
const PEEK = 172;

/** Snap positions (distance from the top of the container) for a container of height h. */
export function snaps(h: number, tabSpace: number) {
  return { full: 54, half: Math.round(h * 0.46), peek: h - PEEK - tabSpace, hidden: h + 30 };
}

type Props = {
  snap: Snap;
  onSnap: (s: Snap) => void;
  onDismiss: () => void;
  onMove?: (y: number, h: number) => void;
  head: React.ReactNode;
  children: React.ReactNode;
  label: string;
};

/**
 * A bottom sheet that tracks the finger 1:1, keeps the release velocity, projects where a flick
 * would land, snaps to the nearest stop and can be grabbed again mid-motion.
 */
export default function Sheet({ snap, onSnap, onDismiss, onMove, head, children, label }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const headEl = useRef<HTMLDivElement>(null);
  const listEl = useRef<HTMLDivElement>(null);
  const sy = useRef(spring(10000));
  const drag = useRef<{ y0: number; s0: number; moved: boolean; id: number; trk: ReturnType<typeof tracker> } | null>(null);
  const suppress = useRef(false);
  const cb = useRef({ onSnap, onDismiss, onMove }); cb.current = { onSnap, onDismiss, onMove };

  const tab = useRef(88);
  const measureTab = () => {
    const probe = document.createElement("div"); probe.style.cssText = "position:absolute;visibility:hidden;height:var(--tab-space)";
    document.body.appendChild(probe); tab.current = probe.offsetHeight || 88; probe.remove();
  };
  const height = () => el.current?.parentElement?.clientHeight || window.innerHeight;
  const S = () => snaps(height(), tab.current);
  const render = (y: number) => {
    if (el.current) el.current.style.transform = `translate3d(0,${y}px,0)`;
    cb.current.onMove?.(y, height());
  };
  const sizeList = () => {
    if (!listEl.current || !headEl.current) return;
    listEl.current.style.maxHeight = `${Math.max(0, height() - sy.current.x - headEl.current.offsetHeight)}px`;
  };
  const go = (name: Snap, velocity?: number) => {
    const flick = Math.abs(velocity || 0) > 400;
    animate(sy.current, S()[name], { velocity, zeta: flick ? 0.82 : 1, response: flick ? 0.32 : 0.36, eps: 0.4, onUpdate: render, onRest: sizeList });
  };

  useEffect(() => { measureTab(); sy.current.x = S().hidden; render(sy.current.x); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { go(snap); }, [snap]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onResize = () => { measureTab(); stop(sy.current); sy.current.x = S()[snap]; render(sy.current.x); sizeList(); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [snap]); // eslint-disable-line react-hooks/exhaustive-deps

  const down = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("a,input,[data-nodrag]")) return;
    stop(sy.current);
    drag.current = { y0: e.clientY, s0: sy.current.x, moved: false, id: e.pointerId, trk: tracker() };
    drag.current.trk.add(e.timeStamp, e.clientY);
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current; if (!d || e.pointerId !== d.id) return;
    const dy = e.clientY - d.y0;
    if (!d.moved && Math.abs(dy) > 6) { d.moved = true; try { headEl.current?.setPointerCapture(e.pointerId); } catch { /* ignore */ } }
    if (!d.moved) return;
    d.trk.add(e.timeStamp, e.clientY);
    const s = S(); let y = d.s0 + dy;
    if (y < s.full) y = s.full - rubber(s.full - y, height());
    sy.current.x = y; render(y);
  };
  const up = (e: React.PointerEvent) => {
    const d = drag.current; if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    if (!d.moved) { if (sy.current.x !== S()[snap]) go(snap); return; }
    suppress.current = true; setTimeout(() => { suppress.current = false; }, 0);
    const v = d.trk.v(), s = S(), proj = sy.current.x + project(v, 0.99);
    if (proj > s.peek + 70) { animate(sy.current, s.hidden, { velocity: v, zeta: 1, response: 0.32, onUpdate: render }); cb.current.onDismiss(); return; }
    let best: Snap = "full";
    (["full", "half", "peek"] as Snap[]).forEach(n => { if (Math.abs(s[n] - proj) < Math.abs(s[best] - proj)) best = n; });
    if (best === snap) go(best, v); else cb.current.onSnap(best);
    // a changed snap animates through the effect; carry the velocity
    sy.current.v = v;
  };
  const key = (e: React.KeyboardEvent) => {
    if (e.target !== headEl.current) return;
    if (e.key === "ArrowUp") { cb.current.onSnap(snap === "peek" ? "half" : "full"); e.preventDefault(); }
    if (e.key === "ArrowDown") { cb.current.onSnap(snap === "full" ? "half" : "peek"); e.preventDefault(); }
  };

  return (
    <div ref={el} className="sheet" aria-label={label} aria-hidden={snap === "hidden"}>
      <div ref={headEl} className="sheet-head" tabIndex={0} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}
        onClickCapture={e => { if (suppress.current) { e.stopPropagation(); e.preventDefault(); } }}>
        <div className="grabber" aria-hidden="true" />
        {head}
      </div>
      <div ref={listEl} className="sheet-list">{children}</div>
    </div>
  );
}

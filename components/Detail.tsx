"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { Show } from "@/lib/types";
import { animate, clamp, lerp, prefersReducedMotion, spring } from "@/lib/spring";
import { artStyle } from "@/lib/placeholder";
import { areaName } from "@/lib/i18n";
import { fmtDate, fmtTime, hourOf, hoursLabel, parseLocal, weekday } from "@/lib/status";
import { useApp } from "./context";
import { Pills } from "./bits";
import { IconBack, IconBookmark, IconCheck, IconPin, IconRoute, IconWhatsApp } from "./icons";

type Rect = { left: number; top: number; width: number; height: number };
export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || (typeof location !== "undefined" ? location.origin : "https://theartwalk.in");

/** The show page grows out of whatever was tapped and shrinks back into it on close. */
export default function Detail({ show, from, onClosed }: { show: Show | null; from: HTMLElement | null; onClosed: () => void }) {
  const ctx = useApp();
  const { t, lang, personal, toggleSave, toggleVisited, st, distLabel, walks, startWalk, data } = ctx;
  const root = useRef<HTMLElement>(null), hero = useRef<HTMLDivElement>(null), body = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null), backBtn = useRef<HTMLButtonElement>(null), saveBtn = useRef<HTMLButtonElement>(null);
  const p = useRef(spring(0));
  const rect = useRef<Rect>({ left: 0, top: 0, width: 80, height: 100 });
  const scrollAt = useRef(0);
  const opened = useRef(false);

  const appBox = () => (root.current?.closest(".app") as HTMLElement | null)?.getBoundingClientRect() ?? new DOMRect(0, 0, innerWidth, innerHeight);
  const rectOf = (el: HTMLElement | null): Rect => {
    const a = appBox(), fb = { left: a.width / 2 - 40, top: a.height / 2 - 50, width: 80, height: 100 };
    if (!el || !el.isConnected) return fb;
    const r = el.getBoundingClientRect(); if (!r.width) return fb;
    return { left: r.left - a.left, top: r.top - a.top, width: r.width, height: r.height };
  };
  const draw = (x: number) => {
    const d = root.current, h = hero.current; if (!d || !h) return;
    const a = appBox(), W = a.width, H = a.height, r = rect.current, q = 1 - x;
    d.style.clipPath = `inset(${r.top * q}px ${(W - r.left - r.width) * q}px ${(H - r.top - r.height) * q}px ${r.left * q}px round ${(14 * q).toFixed(1)}px)`;
    const heroH = h.offsetHeight || 1, sc = Math.max(r.width / W, r.height / heroH);
    const fromX = r.left + r.width / 2 - (W * sc) / 2, fromY = r.top + r.height / 2 - (heroH * sc) / 2 + scrollAt.current;
    h.style.transform = `translate3d(${lerp(fromX, 0, x)}px,${lerp(fromY, 0, x)}px,0) scale(${lerp(sc, 1, x)})`;
    if (body.current) { body.current.style.opacity = clamp((x - 0.4) / 0.6, 0, 1).toFixed(3); body.current.style.transform = `translate3d(0,${q * 40}px,0)`; }
    if (scrim.current) scrim.current.style.opacity = (clamp(x, 0, 1) * 0.5).toFixed(3);
    const o = clamp((x - 0.55) / 0.45, 0, 1).toFixed(3);
    if (backBtn.current) backBtn.current.style.opacity = o;
    if (saveBtn.current) saveBtn.current.style.opacity = o;
  };

  useLayoutEffect(() => {
    if (!show || opened.current) return;
    opened.current = true;
    scrollAt.current = 0;
    if (root.current) root.current.scrollTop = 0;
    rect.current = rectOf(from);
    if (from) from.style.visibility = "hidden";
    if (scrim.current) scrim.current.style.pointerEvents = "auto";
    if (prefersReducedMotion()) { p.current.x = 1; draw(1); }
    else { draw(0); animate(p.current, 1, { zeta: 1, response: 0.42, eps: 0.0006, onUpdate: draw }); }
    setTimeout(() => backBtn.current?.focus({ preventScroll: true }), 60);
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = (after?: () => void) => {
    if (!opened.current) return;
    scrollAt.current = root.current?.scrollTop ?? 0;
    if (from && from.isConnected) { from.style.visibility = ""; rect.current = rectOf(from); from.style.visibility = "hidden"; } else rect.current = rectOf(null);
    if (scrim.current) scrim.current.style.pointerEvents = "none";
    const done = () => {
      opened.current = false;
      if (from) from.style.visibility = "";
      onClosed();
      if (after) after(); else if (from?.isConnected) from.focus?.({ preventScroll: true });
    };
    if (prefersReducedMotion()) { p.current.x = 0; done(); return; }
    animate(p.current, 0, { zeta: 1, response: 0.38, eps: 0.0006, onUpdate: draw, onRest: done });
  };

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }); // re-bind each render so close() sees current props

  if (!show) return null;
  const s = st(show);
  const saved = !!personal.saved[show.id], visited = !!personal.visited[show.id];
  const maps = `https://www.google.com/maps/search/?api=1&query=${show.lat},${show.lng}`;
  const endText = parseLocal(show.end).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const share = `https://wa.me/?text=${encodeURIComponent(`${show.title} at ${show.gallery}, ${show.area}. On until ${endText}. ${siteUrl()}/shows/${show.id}`)}`;
  const opening = show.openingAt ? parseLocal(show.openingAt) : null;
  const withShow = walks.filter(w => w.stops.includes(show.id));

  return (
    <>
      <div ref={scrim} className="scrim" onClick={() => close()} />
      <article ref={root} className="detail" aria-label={show.title}>
        <div ref={hero} className="detail-hero" style={artStyle(show)} role="img" aria-label={show.photoCredit ? t.photoCredit(show.photoCredit) : show.title} />
        <div ref={body} className="detail-body">
          <div>
            {s.text && <span className={`status ${s.kind}`}>{s.text}</span>}
            <h2>{show.title}</h2>
            <div className="gal">{show.gallery} · {areaName(show.area, lang)}</div>
          </div>
          <div style={{ fontSize: 15 }}>{show.artists.join(", ")}</div>
          <div className="actions">
            <button type="button" className="act primary" aria-pressed={saved} onClick={() => toggleSave(show.id)}><IconBookmark /> {t.save}</button>
            <button type="button" className="act visited" aria-pressed={visited} onClick={() => toggleVisited(show.id)}><IconCheck /> {visited ? t.visited : t.markVisited}</button>
            <a className="act" href={maps} target="_blank" rel="noopener noreferrer"><IconPin />{t.directions}</a>
            <a className="act" href={share} target="_blank" rel="noopener noreferrer"><IconWhatsApp />{t.share}</a>
          </div>
          <dl className="facts">
            <dt>{t.dates}</dt><dd>{fmtDate(parseLocal(show.start), lang)} – {fmtDate(parseLocal(show.end), lang, true)}</dd>
            {opening && <><dt>{t.opening}</dt><dd>{weekday(opening, lang)} {fmtDate(opening, lang)}, {fmtTime(hourOf(opening))}</dd></>}
            <dt>{t.hours}</dt><dd>{hoursLabel(show, lang)}</dd>
            <dt>{t.entry}</dt><dd>{show.entry}</dd>
            <dt>{t.where}</dt><dd>{show.address || `${show.gallery}, ${areaName(show.area, lang)}`} · {distLabel(show)} {t.away}</dd>
          </dl>
          {show.about && <p className="about">{show.about}</p>}
          <Pills show={show} />
          {withShow.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {withShow.map(w => <button key={w.id} type="button" className="btn" onClick={() => close(() => startWalk(w.id))}><IconRoute />{lang === "hi" ? w.titleHi : w.title}</button>)}
            </div>
          )}
          {show.photoCredit && <p className="sample-note">{t.photoCredit(show.photoCredit)}</p>}
          {data.source === "sample" && <p className="sample-note">{t.sampleNote}</p>}
        </div>
      </article>
      <button ref={backBtn} type="button" className="float-btn back" aria-label={t.back} onClick={() => close()}><IconBack /></button>
      <button ref={saveBtn} type="button" className="float-btn save" aria-label={t.save} aria-pressed={saved} onClick={() => toggleSave(show.id)}><IconBookmark /></button>
    </>
  );
}

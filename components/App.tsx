"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppData, Show } from "@/lib/types";
import { MEDIUMS } from "@/lib/types";
import { STRINGS, areaName, medium } from "@/lib/i18n";
import { DEFAULT_LOCATION } from "@/lib/areas";
import { isOpenNow, km, planWalk, status } from "@/lib/status";
import { artStyle } from "@/lib/placeholder";
import { useLang, usePersonal, useTheme } from "@/lib/store";
import { AppCtx, type Ctx } from "./context";
import { MapView, type MapHandle } from "./MapView";
import Sheet, { snaps, type Snap } from "./Sheet";
import Detail from "./Detail";
import Feed from "./Feed";
import Openings from "./Openings";
import Saved from "./Saved";
import Search from "./Search";
import Profile from "./Profile";
import { RouteThumb, SaveButton, ShowRow, Status } from "./bits";
import { IconBookmark, IconCalendar, IconChevron, IconClose, IconFeed, IconLocate, IconMap, IconPerson, IconSearch } from "./icons";

type View = "map" | "feed" | "events" | "saved";

export default function App({ data }: { data: AppData }) {
  const [lang, setLang] = useLang();
  const [theme, setTheme] = useTheme();
  const [personal, updatePersonal] = usePersonal();
  const t = STRINGS[lang];

  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(id); }, []);

  // Theme and language on the root element.
  const [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => setSystemDark(mq.matches); on(); mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  useEffect(() => { if (theme === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const mapTheme: "light" | "dark" = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  const byId = useMemo(() => new Map(data.shows.map(s => [s.id, s])), [data.shows]);
  const walks = useMemo(() => data.walks.map(w => planWalk(w, byId)).filter((w): w is NonNullable<typeof w> => !!w), [data.walks, byId]);
  const [you, setYou] = useState<{ lat: number; lng: number } | null>(null);
  const origin = you ?? DEFAULT_LOCATION;

  const st = useCallback((s: Show) => status(s, t, lang, now), [t, lang, now]);
  const dist = useCallback((s: Show) => km(origin, s), [origin]);
  const distLabel = useCallback((s: Show) => `${dist(s).toFixed(1)} ${lang === "hi" ? "किमी" : "km"}`, [dist, lang]);

  const [filters, setFilters] = useState<{ medium: string; openNow: boolean }>({ medium: "All", openNow: false });
  const visible = useMemo(() => data.shows.filter(s => {
    if (st(s).kind === "ended") return false;
    if (filters.medium !== "All" && !s.mediums.includes(filters.medium)) return false;
    if (filters.openNow && !isOpenNow(s, now)) return false;
    return true;
  }).sort((a, b) => dist(a) - dist(b)), [data.shows, filters, st, now, dist]);
  const usedMediums = useMemo(() => MEDIUMS.filter(m => data.shows.some(s => s.mediums.includes(m))), [data.shows]);

  const [view, setView] = useState<View>("map");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [walkId, setWalkId] = useState<string | null>(null);
  const [snap, setSnap] = useState<Snap>("hidden");
  const [detail, setDetail] = useState<{ show: Show; from: HTMLElement | null } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const walk = walkId ? walks.find(w => w.id === walkId) ?? null : null;
  const selected = selectedId ? byId.get(selectedId) ?? null : null;

  const mapRef = useRef<MapHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const [topInset, setTopInset] = useState(110);
  useEffect(() => {
    if (!topRef.current) return;
    const ro = new ResizeObserver(() => setTopInset(topRef.current?.offsetHeight ?? 110));
    ro.observe(topRef.current); return () => ro.disconnect();
  }, []);

  const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useCallback((m: string) => { setToastMsg(m); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToastMsg(""), 2400); }, []);

  const stageH = () => stageRef.current?.clientHeight ?? innerHeight;
  const select = useCallback((id: string) => {
    const s = byId.get(id); if (!s) return;
    setWalkId(null); setSelectedId(id);
    setSnap(prev => (prev === "hidden" || prev === "full" ? "peek" : prev));
    mapRef.current?.focusShow(s, 300);
  }, [byId]);
  const startWalk = useCallback((id: string) => {
    const w = walks.find(x => x.id === id); if (!w) return;
    setView("map"); setSelectedId(null); setWalkId(id); setSnap("half");
    setTimeout(() => mapRef.current?.fitWalk(w, Math.round(stageH() * 0.54)), 50);
  }, [walks]);
  const endWalk = () => { setWalkId(null); setSnap("hidden"); };
  const dismissSheet = () => { if (walkId) endWalk(); else { setSelectedId(null); setSnap("hidden"); } };

  const toggleSave = useCallback((id: string) => updatePersonal(p => {
    const saved = { ...p.saved };
    if (saved[id]) { delete saved[id]; toast(t.tUnsaved); } else { saved[id] = Date.now(); toast(t.tSaved); }
    return { ...p, saved };
  }), [updatePersonal, toast, t]);
  const toggleVisited = useCallback((id: string) => updatePersonal(p => {
    const visited = { ...p.visited };
    if (visited[id]) { delete visited[id]; toast(t.tUnvisited); } else { visited[id] = Date.now(); toast(t.tVisited); }
    return { ...p, visited };
  }), [updatePersonal, toast, t]);
  const openDetail = useCallback((s: Show, from: HTMLElement | null) => setDetail({ show: s, from }), []);

  // Deep links: /?show=<id> and /?walk=<id>
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const sid = q.get("show"), wid = q.get("walk");
    if (sid && byId.has(sid)) setTimeout(() => setDetail({ show: byId.get(sid)!, from: null }), 300);
    else if (wid) setTimeout(() => startWalk(wid), 600);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If a filter hides the selected show, close the sheet.
  useEffect(() => { if (selected && !visible.includes(selected) && !walk) { setSelectedId(null); setSnap("hidden"); } }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSheetMove = (y: number, h: number) => {
    const s = snaps(h, 88);
    const k = Math.min(1, Math.max(0, (s.half - y) / (s.half - s.full))); // dim only above half
    if (dimRef.current) dimRef.current.style.opacity = (k * 0.35).toFixed(3);
    if (fabRef.current) {
      const rowUp = view === "map" && !walkId && snap === "hidden";
      const top = rowUp ? h - 88 - 96 : Math.min(y, h - 88);
      fabRef.current.style.top = `${top - 58}px`;
      const hide = y < s.half - 10;
      fabRef.current.style.opacity = hide ? "0" : "1";
      fabRef.current.style.pointerEvents = hide ? "none" : "";
    }
  };
  useEffect(() => { onSheetMove(stageH() + 30, stageH()); }, [snap, walkId, view]); // eslint-disable-line react-hooks/exhaustive-deps

  const locate = () => {
    if (!("geolocation" in navigator)) { toast(t.locateFail); return; }
    toast(t.locating);
    navigator.geolocation.getCurrentPosition(
      pos => { const p = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setYou(p); mapRef.current?.flyTo(p.lat, p.lng, 14); setToastMsg(""); },
      () => toast(t.locateFail), { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const tag = useCallback((ids: string[]) => {
    const kinds = ids.map(id => byId.get(id)).filter((s): s is Show => !!s).map(s => st(s).kind);
    if (kinds.includes("closing")) return { kind: "closing" as const, text: t.endingSoon };
    if (kinds.includes("opening")) return { kind: "opening" as const, text: t.openingTag };
    return null;
  }, [byId, st, t]);

  const ctx: Ctx = { data, t, lang, now, byId, walks, personal, st, dist, distLabel, toggleSave, toggleVisited, openDetail, startWalk, toast };

  const nearby = selected ? visible.filter(s => s.id !== selected.id).sort((a, b) => km(a, selected) - km(b, selected)) : [];
  const sheetHead = walk ? (
    <div className="walk-head">
      <span className="wk">{t.walkKicker}</span>
      <h3>{lang === "hi" ? walk.titleHi : walk.title}</h3>
      <div className="meta">{t.walkMeta(walk.shows.length, t.hm(walk.mins), walk.km.toFixed(1))}{walk.auto ? ` · ${t.autoNote}` : ""}</div>
      <div className="bar">
        <a className="btn primary" target="_blank" rel="noopener noreferrer"
          href={`https://www.google.com/maps/dir/?api=1&origin=${walk.shows[0].lat},${walk.shows[0].lng}&destination=${walk.shows[walk.shows.length - 1].lat},${walk.shows[walk.shows.length - 1].lng}${walk.shows.length > 2 ? `&waypoints=${encodeURIComponent(walk.shows.slice(1, -1).map(s => `${s.lat},${s.lng}`).join("|"))}` : ""}&travelmode=walking`}>
          <IconLocate />{t.startWalk}
        </a>
        <button type="button" className="btn" data-nodrag aria-label={t.closeWalk} onClick={endWalk}><IconClose /></button>
      </div>
    </div>
  ) : selected ? (
    <div className="preview">
      <button type="button" className="thumb" style={artStyle(selected)} aria-label={selected.title} onClick={e => openDetail(selected, e.currentTarget)} />
      <button type="button" style={{ textAlign: "left", minWidth: 0 }} onClick={e => openDetail(selected, (e.currentTarget.previousElementSibling as HTMLElement) || null)}>
        <Status show={selected} />
        <div className="t">{selected.title}</div>
        <div className="meta">{selected.gallery} · {areaName(selected.area, lang)} · {distLabel(selected)}</div>
      </button>
      <span data-nodrag><SaveButton show={selected} /></span>
    </div>
  ) : null;
  const sheetList = walk ? (
    <>
      <div style={{ height: 8 }} />
      {walk.shows.map((s, i) => (
        <div key={s.id}>
          {i > 0 && <div className="leg">{t.leg(walk.legs[i - 1].mins, walk.legs[i - 1].auto)}</div>}
          <button type="button" className="stop" onClick={e => openDetail(s, e.currentTarget.querySelector(".thumb") as HTMLElement)}>
            <span className="n">{i + 1}</span>
            <span className="thumb" style={artStyle(s)} />
            <span style={{ minWidth: 0 }}><span className="rt">{s.title}</span><span className="meta" style={{ display: "block" }}>{s.gallery} · {areaName(s.area, lang)}</span><Status show={s} /></span>
          </button>
        </div>
      ))}
    </>
  ) : selected ? (<><div className="list-h">{t.nearby}</div>{nearby.map(s => <ShowRow key={s.id} show={s} />)}</>) : null;

  const tabs: { v: View; label: string; icon: React.ReactNode }[] = [
    { v: "map", label: t.map, icon: <IconMap /> }, { v: "feed", label: t.feed, icon: <IconFeed /> },
    { v: "events", label: t.events, icon: <IconCalendar /> }, { v: "saved", label: t.saved, icon: <IconBookmark /> }
  ];

  return (
    <AppCtx.Provider value={ctx}>
      <main className="app">
        <div className="view" ref={stageRef}>
          <section className="view" hidden={view !== "map"} aria-label={t.map}>
            <MapView ref={mapRef} shows={visible} walk={walk} selectedId={selectedId} theme={mapTheme} you={you}
              tag={tag} moreLabel={t.more} onSelect={select} labelKey={`${lang}-${now.getHours()}`} />
            <div ref={dimRef} className="map-dim" />
            <div className="hint" style={{ top: topInset + 2 }}><b>{t.shows(visible.length)}</b>{data.source === "sample" ? ` · ${t.sample}` : ""}</div>
            <button ref={fabRef} type="button" className="fab" aria-label={t.locate} onClick={locate}><IconLocate /></button>
            {walks.length > 0 && (
              <div className={`walks${!walkId && snap === "hidden" ? "" : " off"}`} aria-label={t.walk}>
                {walks.map(w => (
                  <button key={w.id} type="button" className="walk-card" onClick={() => startWalk(w.id)}>
                    <span className="mono-av" aria-hidden="true">aw</span>
                    <span style={{ minWidth: 0 }}>
                      <span className="wk">{t.walk}</span>
                      <span className="wt">{lang === "hi" ? w.titleHi : w.title}</span>
                      <span className="meta" style={{ display: "block" }}>{t.walkMeta(w.shows.length, t.hm(w.mins), w.km.toFixed(1))}</span>
                    </span>
                    <span className="route-thumb"><RouteThumb walk={w} /></span>
                  </button>
                ))}
              </div>
            )}
            <Sheet snap={snap} onSnap={setSnap} onDismiss={dismissSheet} onMove={onSheetMove} head={sheetHead} label={walk ? t.walk : t.map}>{sheetList}</Sheet>
          </section>

          {view === "feed" && <section className="view" aria-label={t.feed}><Feed shows={visible} topInset={topInset} /></section>}
          {view === "events" && <section className="view" aria-label={t.events}><Openings topInset={topInset} /></section>}
          {view === "saved" && <section className="view" aria-label={t.saved}><Saved topInset={topInset} /></section>}

          <div ref={topRef} className="top">
            <div className="row">
              <button type="button" className="circle" aria-label={t.profile} onClick={() => setProfileOpen(true)}><IconPerson /></button>
              <button type="button" className="circle" aria-label={t.search} onClick={() => setSearchOpen(true)}><IconSearch /></button>
              <button type="button" className="pillbtn" onClick={() => toast(t.city)}><span className="brand">{lang === "hi" ? "दिल्ली" : "Delhi"}</span><IconChevron /></button>
              <span className="sp" />
              <button type="button" className="pillbtn lang" aria-label={t.language} onClick={() => { const next = lang === "en" ? "hi" : "en"; setLang(next); if (next === "hi") toast(STRINGS.hi.contentNote); }}>
                {lang === "hi" ? <><span className="off">EN</span>&nbsp;/&nbsp;हिं</> : <>EN&nbsp;/&nbsp;<span className="off">हिं</span></>}
              </button>
            </div>
            {(view === "map" || view === "feed") && (
              <div className="chips" role="toolbar" aria-label={t.all}>
                <button type="button" className="chip open-now" aria-pressed={filters.openNow} onClick={() => setFilters(f => ({ ...f, openNow: !f.openNow }))}>{t.openNow}</button>
                {["All", ...usedMediums].map(m => (
                  <button key={m} type="button" className="chip" aria-pressed={filters.medium === m} onClick={() => setFilters(f => ({ ...f, medium: m }))}>{m === "All" ? t.all : medium(m, lang)}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <nav className="tabbar" role="tablist" aria-label="Sections">
          {tabs.map(x => (
            <button key={x.v} type="button" className="tab" role="tab" aria-selected={view === x.v} onClick={() => setView(x.v)}>{x.icon}{x.label}</button>
          ))}
        </nav>

        {searchOpen && <Search onClose={() => setSearchOpen(false)} />}
        {profileOpen && <Profile onClose={() => setProfileOpen(false)} theme={theme} setTheme={setTheme} setLang={setLang} updatePersonal={updatePersonal} />}
        <Detail show={detail?.show ?? null} from={detail?.from ?? null} onClosed={() => setDetail(null)} />
        <div className={`toast${toastMsg ? " on" : ""}`} role="status" aria-live="polite">{toastMsg}</div>
      </main>
    </AppCtx.Provider>
  );
}

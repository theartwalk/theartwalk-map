"use client";
import { useEffect, useRef, useState } from "react";
import { animate, spring } from "@/lib/spring";
import { artStyle } from "@/lib/placeholder";
import { areaName, medium, type Lang } from "@/lib/i18n";
import type { Personal, Theme } from "@/lib/store";
import { useApp } from "./context";
import { siteUrl } from "./Detail";
import { IconClose } from "./icons";

const COMMUNITY = process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL || "";
const SUBMIT_NUMBER = process.env.NEXT_PUBLIC_SUBMIT_WHATSAPP || "919654256673";

type Props = {
  onClose: () => void;
  theme: Theme; setTheme: (t: Theme) => void;
  setLang: (l: Lang) => void;
  updatePersonal: (fn: (p: Personal) => Personal) => void;
};

/** A taste profile built from saves and visits, kept on the device. No account, no Premium. */
export default function Profile({ onClose, theme, setTheme, setLang, updatePersonal }: Props) {
  const { t, lang, personal, byId, toast, openDetail } = useApp();
  const el = useRef<HTMLDivElement>(null);
  const y = useRef(spring(typeof window !== "undefined" ? window.innerHeight : 800));
  const [armed, setArmed] = useState(false);

  const draw = (v: number) => { if (el.current) el.current.style.transform = `translate3d(0,${v}px,0)`; };
  useEffect(() => { draw(y.current.x); animate(y.current, 0, { response: 0.4, onUpdate: draw }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const close = () => animate(y.current, window.innerHeight, { response: 0.36, onUpdate: draw, onRest: onClose });
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "Escape") close(); }; addEventListener("keydown", k); return () => removeEventListener("keydown", k); });
  useEffect(() => { if (!armed) return; const id = setTimeout(() => setArmed(false), 4000); return () => clearTimeout(id); }, [armed]);

  const visited = Object.keys(personal.visited).filter(id => byId.has(id));
  const saved = Object.keys(personal.saved).filter(id => byId.has(id));
  const mediums: Record<string, number> = {}, areas: Record<string, number> = {}, artists: Record<string, number> = {};
  visited.forEach(id => { const s = byId.get(id)!; s.mediums.forEach(m => { mediums[m] = (mediums[m] || 0) + 2; }); areas[s.area] = (areas[s.area] || 0) + 1; s.artists.forEach(a => { artists[a] = (artists[a] || 0) + 1; }); });
  saved.forEach(id => byId.get(id)!.mediums.forEach(m => { mediums[m] = (mediums[m] || 0) + 1; }));
  const sort = (o: Record<string, number>) => Object.entries(o).sort((a, b) => b[1] - a[1]);
  const M = sort(mediums), A = sort(areas), R = sort(artists);
  const topM = M[0] ? medium(M[0][0], lang) : "", topA = A[0] ? areaName(A[0][0], lang) : "";
  const name = personal.name.trim();
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(t.shareText(name, visited.length, topM, topA, siteUrl()))}`;
  const recent = [...visited].sort((a, b) => personal.visited[b] - personal.visited[a]).slice(0, 8);
  const submitUrl = `https://wa.me/${SUBMIT_NUMBER}?text=${encodeURIComponent("Hi, I'd like to list an exhibition on The Art Walk map.")}`;

  return (
    <div ref={el} className="overlay" role="dialog" aria-label={t.profile}>
      <button type="button" className="circle close" aria-label={t.close} onClick={close}><IconClose /></button>
      <div className="overlay-scroll">
        <div className="profile-in">
          <div className="p-head">
            <div className="p-av" aria-hidden="true">{(name[0] || "A").toUpperCase()}</div>
            <input className="p-name" type="text" maxLength={32} value={personal.name} placeholder={t.namePh} aria-label={t.namePh}
              onChange={e => { const v = e.target.value; updatePersonal(p => ({ ...p, name: v })); }} />
            <div className="p-stats">
              <div className="p-stat"><b>{saved.length}</b><span>{t.stSaved}</span></div>
              <div className="p-stat"><b>{visited.length}</b><span>{t.stVisited}</span></div>
              <div className="p-stat"><b>{A.length}</b><span>{t.stAreas}</span></div>
            </div>
          </div>

          <section className="p-card"><h3>{t.taste}</h3>
            {M.length ? (
              <div className="bars">{M.map(([m, n]) => (
                <div key={m} className="bar-row"><span>{medium(m, lang)}</span><span className="track"><span className="fill" style={{ width: `${Math.round((n / M[0][1]) * 100)}%` }} /></span><span className="n">{n}</span></div>
              ))}</div>
            ) : <p className="p-empty">{t.tasteEmpty}</p>}
          </section>

          {A.length > 0 && <section className="p-card"><h3>{t.favAreas}</h3><ol className="ranked">{A.slice(0, 3).map(([a, n], i) => <li key={a}><span className="i">{i + 1}</span><span>{areaName(a, lang)}</span><span className="c">{t.nVisits(n)}</span></li>)}</ol></section>}
          {R.length > 0 && <section className="p-card"><h3>{t.artistsSeen}</h3><ol className="ranked">{R.slice(0, 5).map(([a, n], i) => <li key={a}><span className="i">{i + 1}</span><span>{a}</span><span className="c">{t.nVisits(n)}</span></li>)}</ol></section>}
          {recent.length > 0 && <section className="p-card"><h3>{t.recent}</h3><div className="recent">{recent.map(id => { const s = byId.get(id)!; return <button key={id} type="button" style={artStyle(s)} aria-label={s.title} onClick={e => openDetail(s, e.currentTarget)} />; })}</div></section>}

          <section className="p-card"><h3>{t.shareH}</h3>
            <div className="share-card" aria-hidden="true">
              <span className="k">{t.shareK}</span>
              <span className="big">{t.shareBig(visited.length)}</span>
              <span className="sm">{t.shareSm(topM, topA)}</span>
            </div>
            <a className="btn primary" style={{ width: "100%" }} href={shareUrl} target="_blank" rel="noopener noreferrer">{t.shareBtn}</a>
          </section>

          <section className="p-card"><h3>{t.settings}</h3>
            <div className="set">
              <div className="set-row"><span>{t.language}</span><div className="segs">
                <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>English</button>
                <button type="button" aria-pressed={lang === "hi"} onClick={() => { setLang("hi"); toast(t.contentNote); }}>हिंदी</button>
              </div></div>
              <div className="set-row"><span>{t.theme}</span><div className="segs">
                {(["system", "light", "dark"] as Theme[]).map(k => <button key={k} type="button" aria-pressed={theme === k} onClick={() => setTheme(k)}>{k === "system" ? t.themeSys : k === "light" ? t.themeLight : t.themeDark}</button>)}
              </div></div>
              <div className="set-row"><span>{t.cityL}</span><div className="segs">
                <button type="button" aria-pressed="true">{lang === "hi" ? "दिल्ली" : "Delhi"}</button>
                <button type="button" onClick={() => toast(t.city)}>Mumbai</button>
                <button type="button" onClick={() => toast(t.city)}>Kochi</button>
              </div></div>
            </div>
            <div style={{ marginTop: 14 }}>
              <a className="link-row" href="https://www.instagram.com/theartwalk.in/" target="_blank" rel="noopener noreferrer"><span>{t.ig}<small>{t.igSub}</small></span><span aria-hidden="true">↗</span></a>
              {COMMUNITY
                ? <a className="link-row" href={COMMUNITY} target="_blank" rel="noopener noreferrer"><span>{t.wa}<small>{t.waSub}</small></span><span aria-hidden="true">↗</span></a>
                : <button type="button" className="link-row" onClick={() => toast(t.waSoon)}><span>{t.wa}<small>{t.waSoon}</small></span><span aria-hidden="true">›</span></button>}
              <a className="link-row" href={submitUrl} target="_blank" rel="noopener noreferrer"><span>{t.listShow}<small>{t.listShowSub}</small></span><span aria-hidden="true">↗</span></a>
              <button type="button" className="link-row danger" onClick={() => {
                if (!armed) { setArmed(true); return; }
                setArmed(false); updatePersonal(p => ({ ...p, saved: {}, visited: {} })); toast(t.cleared);
              }}><span>{armed ? t.clearConfirm : t.clear}</span></button>
            </div>
          </section>
          <p className="p-note">{t.localNote}</p>
        </div>
      </div>
    </div>
  );
}

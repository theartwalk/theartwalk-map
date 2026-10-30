"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { personName, useSocial, USERNAME_RE, type Person } from "@/lib/social";
import { eventType } from "@/lib/i18n";
import { fmtDate, fmtTime, hourOf, parseLocal, weekday } from "@/lib/status";
import { artStyle } from "@/lib/placeholder";
import { useApp } from "./context";
import { siteUrl } from "./Detail";
import { Avatar } from "./bits";
import { IconPlus, IconSearch, IconWhatsApp } from "./icons";

/** Friends tab: sign in, pick a username, then a feed of friends' notes and openings they're going to. */
export default function Friends({ topInset, pendingAdd, clearPendingAdd }: { topInset: number; pendingAdd: string; clearPendingAdd: () => void }) {
  const social = useSocial();
  const { t } = useApp();
  let body: React.ReactNode;
  if (!social.ready) body = <div className="empty" aria-busy="true">…</div>;
  else if (!social.session) body = <SignInCard />;
  else if (social.error && !social.me) body = <div className="empty"><strong>{t.tError}</strong>{/relation|does not exist|schema cache/i.test(social.error) ? t.dbMissing : social.error}</div>;
  else if (social.needsSetup) body = <Setup />;
  else if (!social.me) body = <div className="empty" aria-busy="true">…</div>;
  else body = <Signed pendingAdd={pendingAdd} clearPendingAdd={clearPendingAdd} />;
  return (
    <div className="page">
      <div className="page-in" style={{ paddingTop: topInset + 16 }}>{body}</div>
    </div>
  );
}

export function SignInCard({ compact = false }: { compact?: boolean }) {
  const { signIn } = useSocial();
  const { t } = useApp();
  return (
    <div className={`signin${compact ? " compact" : ""}`}>
      {!compact && <h2>{t.signInH}</h2>}
      {!compact && <p className="sub">{t.signInP}</p>}
      <button type="button" className="btn primary google" onClick={signIn}>{compact ? t.signInNotes : t.google}</button>
      {!compact && <p className="fine">{t.signInFine} <a href="/privacy">{t.privacy}</a></p>}
    </div>
  );
}

function Setup() {
  const { me, session, saveProfile } = useSocial();
  const { t, toast } = useApp();
  const meta = session?.user.user_metadata ?? {};
  const suggested = (String(meta.full_name || meta.name || session?.user.email?.split("@")[0] || "")).toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "").slice(0, 20);
  const [username, setUsername] = useState(me?.username || (USERNAME_RE.test(suggested) ? suggested : ""));
  const [name, setName] = useState(me?.display_name || String(meta.full_name || meta.name || ""));
  const [adult, setAdult] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const u = username.trim().toLowerCase();
  const valid = USERNAME_RE.test(u) && adult;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!valid || busy) return;
    setBusy(true); setErr("");
    const r = await saveProfile({ username: u, display_name: name });
    setBusy(false);
    if (r === "taken") setErr(t.usernameTaken); else if (r === "format") setErr(t.usernameRule); else if (r) { setErr(t.tError); toast(t.tError); }
  };
  return (
    <form className="setup" onSubmit={submit}>
      <Avatar person={me ?? { display_name: name }} size={72} />
      <h2>{t.setupH}</h2>
      <p className="sub">{t.setupP}</p>
      <label className="field"><span>{t.usernameL}</span>
        <span className="at-wrap"><span className="at">@</span>
          <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))} maxLength={24} autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username" aria-invalid={!!username && !USERNAME_RE.test(u)} required />
        </span>
        <small className={username && !USERNAME_RE.test(u) ? "bad" : ""}>{err && err === t.usernameTaken ? err : t.usernameRule}</small>
      </label>
      <label className="field"><span>{t.nameL}</span><input value={name} onChange={e => setName(e.target.value)} maxLength={40} autoComplete="name" /></label>
      <label className="check"><input type="checkbox" checked={adult} onChange={e => setAdult(e.target.checked)} /> <span>{t.adult}</span></label>
      <p className="fine">{t.rules}</p>
      {err && err !== t.usernameTaken && <p className="fine bad">{err}</p>}
      <button type="submit" className="btn primary wide" disabled={!valid || busy}>{t.continueBtn}</button>
    </form>
  );
}

function Signed({ pendingAdd, clearPendingAdd }: { pendingAdd: string; clearPendingAdd: () => void }) {
  const social = useSocial();
  const { t } = useApp();
  const [tab, setTab] = useState<"activity" | "friends">(social.friends.length ? "activity" : "friends");
  return (
    <>
      <div className="seg" role="tablist" aria-label={t.friends}>
        <button type="button" role="tab" aria-selected={tab === "activity"} onClick={() => setTab("activity")}>{t.activity}</button>
        <button type="button" role="tab" aria-selected={tab === "friends"} onClick={() => setTab("friends")}>{t.friends}<span className="c">{social.friends.length}</span>{social.incoming.length > 0 && <span className="badge" aria-label={t.requests}>{social.incoming.length}</span>}</button>
      </div>
      {pendingAdd && <AddCard username={pendingAdd} onDone={clearPendingAdd} />}
      {social.incoming.length > 0 && (
        <section className="fr-sec">
          <div className="list-h">{t.requests}</div>
          {social.incoming.map(r => <PersonRow key={r.id} person={r.other} />)}
        </section>
      )}
      {tab === "activity" ? <ActivityFeed /> : <FriendsList />}
    </>
  );
}

function AddCard({ username, onDone }: { username: string; onDone: () => void }) {
  const { findByUsername } = useSocial();
  const { t } = useApp();
  const [p, setP] = useState<Person | null | undefined>(undefined);
  useEffect(() => { let on = true; findByUsername(username).then(x => { if (on) setP(x); }); return () => { on = false; }; }, [username, findByUsername]);
  if (p === undefined) return null;
  return (
    <section className="add-card">
      {p ? <><div className="list-h">{t.wantsAdd(personName(p))}</div><PersonRow person={p} /></> : <p className="fine">{t.notFound}</p>}
      <button type="button" className="link-btn" onClick={onDone}>{t.close}</button>
    </section>
  );
}

/** One person with the right button for where you stand with them. */
export function PersonRow({ person }: { person: Person }) {
  const social = useSocial();
  const { t, toast } = useApp();
  const rel = social.relation(person.id);
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return; const id = setTimeout(() => setArmed(false), 3000); return () => clearTimeout(id); }, [armed]);
  const act = async (fn: () => Promise<boolean>, okMsg: string) => { setBusy(true); const ok = await fn(); setBusy(false); toast(ok ? okMsg : t.tError); };
  let action: React.ReactNode = null;
  if (rel.kind === "none") action = <button type="button" className="btn primary sm" disabled={busy} onClick={() => act(() => social.sendRequest(person.id), t.tRequest)}><IconPlus />{t.addFriend}</button>;
  else if (rel.kind === "outgoing") action = <button type="button" className="btn sm" disabled={busy} onClick={() => act(() => social.removeFriendship(rel.requestId!), t.tRemoved)}>{t.requested} · {t.cancelReq}</button>;
  else if (rel.kind === "incoming") action = (
    <span className="two">
      <button type="button" className="btn primary sm" disabled={busy} onClick={() => act(() => social.respond(rel.requestId!, true), t.tFriends)}>{t.accept}</button>
      <button type="button" className="btn sm" disabled={busy} onClick={() => act(() => social.respond(rel.requestId!, false), t.tRemoved)}>{t.decline}</button>
    </span>
  );
  else if (rel.kind === "friend") action = (
    <button type="button" className={`btn sm${armed ? " danger" : ""}`} disabled={busy} onClick={() => { if (!armed) { setArmed(true); return; } setArmed(false); act(() => social.removeFriendship(rel.requestId!), t.tRemoved); }}>{armed ? t.removeConfirm : t.isFriend}</button>
  );
  return (
    <div className="person">
      <Avatar person={person} size={44} />
      <span className="who"><b>{person.display_name || `@${person.username}`}</b>{person.username && <small>@{person.username}</small>}</span>
      {action}
    </div>
  );
}

function FriendsList() {
  const social = useSocial();
  const { t } = useApp();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Person[] | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().replace(/^@/, "").length < 2) { setResults(null); return; }
    timer.current = setTimeout(async () => setResults(await social.searchPeople(q)), 250);
  }, [q, social.searchPeople]); // eslint-disable-line react-hooks/exhaustive-deps
  const inviteUrl = `https://wa.me/?text=${encodeURIComponent(t.inviteText(social.me?.username || "", siteUrl()))}`;
  const sent = social.outgoing;
  return (
    <>
      <label className="find"><IconSearch /><input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t.searchPeople} aria-label={t.searchPeople} autoCapitalize="none" autoCorrect="off" spellCheck={false} /></label>
      {results && (results.length ? results.map(p => <PersonRow key={p.id} person={p} />) : <p className="fine pad">{t.noMatch}</p>)}
      <a className="btn wide invite" href={inviteUrl} target="_blank" rel="noopener noreferrer"><IconWhatsApp />{t.invite}</a>
      {!results && (
        <>
          {social.friends.length ? (
            <section className="fr-sec"><div className="list-h">{t.friends} · {social.friends.length}</div>{social.friends.map(p => <PersonRow key={p.id} person={p} />)}</section>
          ) : <div className="empty"><strong>{t.noFriendsH}</strong>{t.noFriends}</div>}
          {sent.length > 0 && <section className="fr-sec"><div className="list-h">{t.requested}</div>{sent.map(r => <PersonRow key={r.id} person={r.other} />)}</section>}
        </>
      )}
      <p className="note">{t.socialNote}</p>
    </>
  );
}

function ActivityFeed() {
  const social = useSocial();
  const { t, lang, now, byId, data, openDetail } = useApp();
  const uid = social.session?.user.id;
  const events = useMemo(() => new Map(data.events.map(e => [e.id, e])), [data.events]);
  type Item = { key: string; at: number; node: React.ReactNode };
  const items: Item[] = [];
  const mins = (iso: string) => Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60000));

  for (const n of social.notes) {
    if (n.user_id === uid) continue;
    const s = byId.get(n.show_id); if (!s) continue;
    items.push({ key: `n${n.id}`, at: new Date(n.updated_at).getTime(), node: (
      <button type="button" className="act-item" onClick={e => openDetail(s, (e.currentTarget.querySelector(".thumb") as HTMLElement) || null)}>
        <Avatar person={n.person} size={40} />
        <span className="txt"><b>{personName(n.person)}</b> {t.leftNote} <b>{s.title}</b>: <span className="q">{n.body}</span> <span className="when">{t.ago(mins(n.updated_at))}</span></span>
        <span className="thumb" style={artStyle(s)} />
      </button>
    ) });
  }
  for (const g of social.going) {
    if (g.user_id === uid) continue;
    const ev = events.get(g.event_id); if (!ev) continue;
    const at = parseLocal(ev.startsAt); if (at.getTime() < now.getTime() - 6 * 36e5) continue;
    const s = ev.showId ? byId.get(ev.showId) : undefined; if (!s) continue;
    items.push({ key: `g${g.user_id}${g.event_id}`, at: new Date(g.created_at).getTime(), node: (
      <button type="button" className="act-item" onClick={e => openDetail(s, (e.currentTarget.querySelector(".thumb") as HTMLElement) || null)}>
        <Avatar person={g.person} size={40} />
        <span className="txt"><b>{personName(g.person)}</b> {t.goingTo} <b>{eventType(ev.type, lang)} · {s.title}</b>, {weekday(at, lang)} {fmtDate(at, lang)}, {fmtTime(hourOf(at))} <span className="when">{t.ago(mins(g.created_at))}</span></span>
        <span className="thumb" style={artStyle(s)} />
      </button>
    ) });
  }
  items.sort((a, b) => b.at - a.at);
  if (!items.length) return <div className="empty"><strong>{t.feedEmptyH}</strong>{social.friends.length ? t.feedEmpty : t.noFriends}</div>;
  return <div className="activity">{items.slice(0, 80).map(i => <div key={i.key}>{i.node}</div>)}</div>;
}

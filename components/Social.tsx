"use client";
import { useEffect, useState } from "react";
import { personName, useSocial } from "@/lib/social";
import { useApp } from "./context";
import { Avatar } from "./bits";
import { SignInCard } from "./Friends";
import { IconCheck } from "./icons";

/** On a show page: your own note, and notes from friends. */
export function ShowNotes({ showId }: { showId: string }) {
  const social = useSocial();
  const { t, now, toast, openFriends } = useApp();
  const uid = social.session?.user.id;
  const mine = social.notes.find(n => n.user_id === uid && n.show_id === showId);
  const theirs = social.notes.filter(n => n.show_id === showId && n.user_id !== uid);
  const [draft, setDraft] = useState(mine?.body ?? "");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setDraft(mine?.body ?? ""); }, [mine?.body]);
  if (!social.enabled || !social.ready) return null;

  let you: React.ReactNode;
  if (!social.session) you = <SignInCard compact />;
  else if (social.needsSetup) you = <button type="button" className="btn wide" onClick={openFriends}>{t.finishSetup}</button>;
  else {
    const changed = draft.trim() !== (mine?.body ?? "") && draft.trim().length > 0;
    you = (
      <div className="my-note">
        <label className="sr-only" htmlFor={`note-${showId}`}>{t.yourNote}</label>
        <textarea id={`note-${showId}`} value={draft} maxLength={280} rows={3} placeholder={t.notePh} onChange={e => setDraft(e.target.value)} />
        <div className="note-bar">
          <span className="count">{draft.length}/280</span>
          {mine && <button type="button" className="btn sm" disabled={busy} onClick={async () => { setBusy(true); const ok = await social.deleteNote(showId); setBusy(false); toast(ok ? t.tNoteDel : t.tError); if (ok) setDraft(""); }}>{t.deleteNote}</button>}
          <button type="button" className="btn primary sm" disabled={!changed || busy} onClick={async () => { setBusy(true); const ok = await social.saveNote(showId, draft); setBusy(false); toast(ok ? t.tNote : t.tError); }}>{t.saveNote}</button>
        </div>
      </div>
    );
  }
  const mins = (iso: string) => Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60000));
  return (
    <section className="notes" aria-label={t.notesH}>
      <h3>{t.notesH}</h3>
      {you}
      {social.session && !social.needsSetup && (
        theirs.length ? (
          <>
            <div className="list-h">{t.friendsNotes}</div>
            {theirs.map(n => (
              <div key={n.id} className="note-item">
                <Avatar person={n.person} size={34} />
                <div><b>{personName(n.person)}</b> <span className="when">{t.ago(mins(n.updated_at))}</span><p>{n.body}</p></div>
              </div>
            ))}
          </>
        ) : <p className="fine">{t.noFriendNotes}</p>
      )}
    </section>
  );
}

/** Under an opening: friends who are going, and a Going button. */
export function GoingRow({ eventId }: { eventId: string }) {
  const social = useSocial();
  const { t, toast, openFriends } = useApp();
  const [busy, setBusy] = useState(false);
  if (!social.enabled || !social.ready) return null;
  const uid = social.session?.user.id;
  const who = social.going.filter(g => g.event_id === eventId && g.user_id !== uid);
  const on = social.going.some(g => g.event_id === eventId && g.user_id === uid);
  const click = async () => {
    if (!social.session) { social.signIn(); return; }
    if (social.needsSetup) { openFriends(); return; }
    setBusy(true); const r = await social.toggleGoing(eventId); setBusy(false);
    toast(r === null ? t.tError : r ? t.tGoing : t.tNotGoing);
  };
  return (
    <div className="going-row">
      {who.length > 0 && (
        <span className="faces" title={who.map(g => personName(g.person)).join(", ")}>
          {who.slice(0, 4).map(g => <Avatar key={g.user_id} person={g.person} size={24} />)}
          <span className="meta">{t.friendsGoing(who.length)}</span>
        </span>
      )}
      <button type="button" className={`btn sm going${on ? " on" : ""}`} aria-pressed={on} disabled={busy} onClick={click}
        aria-label={social.session ? t.going : t.signInGoing}>
        {on && <IconCheck />}{on ? t.youGoing : t.going}
      </button>
    </div>
  );
}

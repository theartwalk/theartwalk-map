"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { sb, supabaseConfigured } from "./supabase";

/**
 * Accounts and friends. Signing in is optional: the map, saves and diary work without it.
 * With an account people can add friends (requests must be accepted), leave a note on a show,
 * and mark themselves going to an opening. Notes and "going" are visible only to friends;
 * the database enforces that (see supabase/01_friends.sql).
 */
export type Person = { id: string; username: string | null; display_name: string | null; avatar_url: string | null };
export type Friendship = { id: number; requester: string; addressee: string; status: "pending" | "accepted" | "declined"; created_at: string; other: Person };
export type Note = { id: string; user_id: string; show_id: string; body: string; created_at: string; updated_at: string; person: Person | null };
export type Going = { user_id: string; event_id: string; created_at: string; person: Person | null };
export type Relation = { kind: "self" | "friend" | "incoming" | "outgoing" | "none"; requestId?: number };

type Social = {
  enabled: boolean;
  ready: boolean;
  session: Session | null;
  me: Person | null;
  needsSetup: boolean;
  error: string;
  friends: Person[];
  incoming: Friendship[];
  outgoing: Friendship[];
  notes: Note[];
  going: Going[];
  relation: (id: string) => Relation;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  saveProfile: (p: { username: string; display_name: string }) => Promise<string | null>;
  searchPeople: (q: string) => Promise<Person[]>;
  findByUsername: (u: string) => Promise<Person | null>;
  sendRequest: (id: string) => Promise<boolean>;
  respond: (requestId: number, accept: boolean) => Promise<boolean>;
  removeFriendship: (requestId: number) => Promise<boolean>;
  saveNote: (showId: string, body: string) => Promise<boolean>;
  deleteNote: (showId: string) => Promise<boolean>;
  toggleGoing: (eventId: string) => Promise<boolean | null>;
  deleteAccount: () => Promise<boolean>;
};

const PERSON = "id,username,display_name,avatar_url";
const AFTER_LOGIN = "taw-after-login";
const Ctx = createContext<Social | null>(null);

export const USERNAME_RE = /^[a-z0-9_.]{3,24}$/;
export const personName = (p: Person | null | undefined) => (p?.display_name || (p?.username ? `@${p.username}` : "") || "Someone").trim();

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const client = sb();
  const [ready, setReady] = useState(!client);
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<Person & { is_adult?: boolean } | null>(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [going, setGoing] = useState<Going[]>([]);
  const uid = session?.user.id ?? null;
  const loading = useRef(false);

  const load = useCallback(async (userId: string) => {
    if (!client || loading.current) return;
    loading.current = true;
    try {
      const [p, f, n, g] = await Promise.all([
        client.from("profiles").select(`${PERSON},is_adult`).eq("id", userId).maybeSingle(),
        client.from("friendships").select(`id,requester,addressee,status,created_at,req:profiles!friendships_requester_fkey(${PERSON}),add:profiles!friendships_addressee_fkey(${PERSON})`),
        client.from("notes").select(`id,user_id,show_id,body,created_at,updated_at,person:profiles(${PERSON})`).order("updated_at", { ascending: false }).limit(400),
        client.from("going").select(`user_id,event_id,created_at,person:profiles(${PERSON})`).order("created_at", { ascending: false }).limit(400)
      ]);
      const bad = [p, f, n, g].find(r => r.error);
      if (bad?.error) { setError(bad.error.message); console.error("[theartwalk] social load", bad.error); }
      else setError("");
      setMe(p.data ?? null);
      setLoaded(true);
      type FRow = Omit<Friendship, "other"> & { req: Person; add: Person };
      setFriendships(((f.data ?? []) as unknown as FRow[]).map(r => ({ id: r.id, requester: r.requester, addressee: r.addressee, status: r.status, created_at: r.created_at, other: r.requester === userId ? r.add : r.req })));
      setNotes((n.data ?? []) as unknown as Note[]);
      setGoing((g.data ?? []) as unknown as Going[]);
    } finally { loading.current = false; }
  }, [client]);

  useEffect(() => {
    if (!client) return;
    let alive = true;
    client.auth.getSession().then(({ data }) => { if (alive) { setSession(data.session); setReady(true); } });
    const { data: sub } = client.auth.onAuthStateChange((_e, s) => { setSession(s); setReady(true); });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [client]);

  useEffect(() => {
    if (uid) load(uid);
    else { setMe(null); setLoaded(false); setFriendships([]); setNotes([]); setGoing([]); }
    // Remove the one-time ?code= from the address bar after Google sends people back.
    if (uid && typeof location !== "undefined" && new URLSearchParams(location.search).has("code")) {
      const q = new URLSearchParams(location.search); q.delete("code"); q.delete("state");
      history.replaceState(null, "", `${location.pathname}${q.size ? `?${q}` : ""}${location.hash}`);
    }
  }, [uid, load]);

  // Refresh when people come back to the tab, so new requests and notes show up.
  useEffect(() => {
    if (!uid) return;
    const on = () => { if (document.visibilityState === "visible") load(uid); };
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, [uid, load]);

  const accepted = friendships.filter(f => f.status === "accepted");
  const friends = useMemo(() => accepted.map(f => f.other).filter(Boolean), [friendships]); // eslint-disable-line react-hooks/exhaustive-deps
  const incoming = friendships.filter(f => f.status === "pending" && f.addressee === uid);
  const outgoing = friendships.filter(f => f.status !== "accepted" && f.requester === uid);

  const relation = useCallback((id: string): Relation => {
    if (id === uid) return { kind: "self" };
    const f = friendships.find(x => x.other?.id === id);
    if (!f) return { kind: "none" };
    if (f.status === "accepted") return { kind: "friend", requestId: f.id };
    return f.requester === uid ? { kind: "outgoing", requestId: f.id } : { kind: "incoming", requestId: f.id };
  }, [friendships, uid]);

  const signIn = useCallback(async () => {
    if (!client) return;
    try { sessionStorage.setItem(AFTER_LOGIN, location.pathname + location.search); } catch { /* ignore */ }
    const { error: e } = await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/` } });
    if (e) setError(e.message);
  }, [client]);

  const signOut = useCallback(async () => { await client?.auth.signOut(); }, [client]);
  const refresh = useCallback(async () => { if (uid) await load(uid); }, [uid, load]);

  const saveProfile = useCallback(async ({ username, display_name }: { username: string; display_name: string }) => {
    if (!client || !uid) return "signin";
    const u = username.trim().toLowerCase();
    if (!USERNAME_RE.test(u)) return "format";
    const { error: e } = await client.from("profiles").upsert({ id: uid, username: u, display_name: display_name.trim().slice(0, 40) || null, is_adult: true });
    if (e) return e.code === "23505" ? "taken" : e.message;
    await load(uid);
    return null;
  }, [client, uid, load]);

  const searchPeople = useCallback(async (q: string) => {
    if (!client || !uid) return [];
    const term = q.trim().toLowerCase().replace(/^@/, "").replace(/[^a-z0-9_. ]/g, "");
    if (term.length < 2) return [];
    const { data } = await client.from("profiles").select(PERSON)
      .or(`username.ilike.${term}%,display_name.ilike.%${term.replace(/[.]/g, "")}%`)
      .not("username", "is", null).neq("id", uid).limit(20);
    return (data ?? []) as Person[];
  }, [client, uid]);

  const findByUsername = useCallback(async (u: string) => {
    if (!client || !uid) return null;
    const name = u.trim().toLowerCase().replace(/^@/, "");
    if (!USERNAME_RE.test(name)) return null;
    const { data } = await client.from("profiles").select(PERSON).eq("username", name).maybeSingle();
    return (data as Person | null) ?? null;
  }, [client, uid]);

  const run = useCallback(async (p: PromiseLike<{ error: { message: string } | null }>) => {
    const { error: e } = await p;
    if (e) { console.error("[theartwalk]", e); return false; }
    if (uid) await load(uid);
    return true;
  }, [uid, load]);

  const sendRequest = useCallback((id: string) => client && uid ? run(client.from("friendships").insert({ requester: uid, addressee: id })) : Promise.resolve(false), [client, uid, run]);
  const respond = useCallback((requestId: number, accept: boolean) => client ? run(client.rpc("respond_friend_request", { request_id: requestId, accept })) : Promise.resolve(false), [client, run]);
  const removeFriendship = useCallback((requestId: number) => client ? run(client.from("friendships").delete().eq("id", requestId)) : Promise.resolve(false), [client, run]);

  const saveNote = useCallback((showId: string, body: string) => {
    if (!client || !uid) return Promise.resolve(false);
    return run(client.from("notes").upsert({ user_id: uid, show_id: showId, body: body.trim().slice(0, 280), updated_at: new Date().toISOString() }, { onConflict: "user_id,show_id" }));
  }, [client, uid, run]);
  const deleteNote = useCallback((showId: string) => client && uid ? run(client.from("notes").delete().eq("user_id", uid).eq("show_id", showId)) : Promise.resolve(false), [client, uid, run]);

  const toggleGoing = useCallback(async (eventId: string) => {
    if (!client || !uid) return null;
    const on = going.some(g => g.user_id === uid && g.event_id === eventId);
    // Show the change straight away; the reload confirms it.
    setGoing(prev => on ? prev.filter(g => !(g.user_id === uid && g.event_id === eventId)) : [{ user_id: uid, event_id: eventId, created_at: new Date().toISOString(), person: me }, ...prev]);
    const ok = await run(on ? client.from("going").delete().eq("user_id", uid).eq("event_id", eventId) : client.from("going").insert({ user_id: uid, event_id: eventId }));
    if (!ok) { await load(uid); return null; }
    return !on;
  }, [client, uid, going, me, run, load]);

  const deleteAccount = useCallback(async () => {
    if (!client || !uid) return false;
    const { error: e } = await client.rpc("delete_my_account");
    if (e) { console.error("[theartwalk]", e); return false; }
    await client.auth.signOut();
    return true;
  }, [client, uid]);

  const value: Social = {
    enabled: supabaseConfigured, ready, session, me, needsSetup: !!session && loaded && !error && (!me || !me.username || !me.is_adult),
    error, friends, incoming, outgoing, notes, going, relation,
    signIn, signOut, refresh, saveProfile, searchPeople, findByUsername, sendRequest, respond, removeFriendship, saveNote, deleteNote, toggleGoing, deleteAccount
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSocial() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSocial outside SocialProvider");
  return c;
}

/** Where to return after Google sign-in; read once. */
export function takeAfterLogin(): string | null {
  try { const v = sessionStorage.getItem(AFTER_LOGIN); sessionStorage.removeItem(AFTER_LOGIN); return v; } catch { return null; }
}

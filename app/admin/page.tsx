/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useCallback, CSSProperties } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";

function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}

type Tab = "shows" | "galleries" | "walks";

interface Gallery {
  id: string; name: string; area: string; address: string;
  lat: number; lng: number; instagram: string; website: string;
  default_hours: string; published: boolean;
}
interface Show {
  id: string; gallery_id: string; gallery: string; area: string;
  address: string; lat: number; lng: number; instagram: string;
  title: string; artists: string[]; mediums: string[];
  start: string; end: string; opening_at: string; open_days: string[];
  open_from: number | null; open_to: number | null;
  entry: string; about: string; photos: string[];
  photo_credit: string; published: boolean;
}
interface Walk {
  id: string; title: string; title_hi: string;
  stops: string[]; published: boolean;
}

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const arrField = (v: string) =>
  v.split(",").map((s) => s.trim()).filter(Boolean);

const blankGallery = (): Gallery => ({
  id: "", name: "", area: "", address: "", lat: 0, lng: 0,
  instagram: "", website: "", default_hours: "", published: true,
});
const blankShow = (): Show => ({
  id: "", gallery_id: "", gallery: "", area: "", address: "",
  lat: 0, lng: 0, instagram: "", title: "", artists: [], mediums: [],
  start: "", end: "", opening_at: "", open_days: [],
  open_from: null, open_to: null,
  entry: "", about: "", photos: [], photo_credit: "", published: true,
});
const blankWalk = (): Walk => ({
  id: "", title: "", title_hi: "", stops: [], published: true,
});

// ── Styles ─────────────────────────────────────────────────────────────────
const C = {
  gold: "#c8a96a", bg: "#0f0f0f", bg2: "#1a1a1a", bg3: "#111",
  border: "#2a2a2a", text: "#f0f0f0", muted: "#666", danger: "#e74c3c",
};
const css = (obj: CSSProperties): CSSProperties => obj;

const S = {
  page: css({ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "system-ui,sans-serif" }),
  header: css({ background: C.bg2, borderBottom: `1px solid ${C.border}`, padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }),
  logo: css({ fontSize: 20, fontWeight: 800, letterSpacing: 1, color: C.gold }),
  badge: css({ fontSize: 10, background: "#c8a96a22", color: C.gold, border: "1px solid #c8a96a44", borderRadius: 4, padding: "2px 8px", letterSpacing: 1 }),
  tabs: css({ display: "flex", borderBottom: `1px solid ${C.border}`, background: "#161616", padding: "0 24px" }),
  body: css({ padding: 24, maxWidth: 900, margin: "0 auto" }),
  row: css({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }),
  h2: css({ fontSize: 18, fontWeight: 700, margin: 0 }),
  table: css({ width: "100%", borderCollapse: "collapse", fontSize: 13 }),
  th: css({ textAlign: "left", padding: "10px 12px", background: C.bg2, color: C.muted, fontWeight: 600, letterSpacing: 0.5, fontSize: 11, borderBottom: `1px solid ${C.border}` }),
  td: css({ padding: "10px 12px", borderBottom: "1px solid #1e1e1e", verticalAlign: "top" }),
  form: css({ background: C.bg2, borderRadius: 10, padding: 20, marginBottom: 24, border: `1px solid ${C.border}` }),
  formTitle: css({ fontSize: 15, fontWeight: 700, marginBottom: 16, color: C.gold }),
  grid2: css({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }),
  field: css({ marginBottom: 12 }),
  label: css({ display: "block", fontSize: 11, color: "#888", marginBottom: 4, letterSpacing: 0.5 }),
  input: css({ width: "100%", padding: "8px 10px", background: C.bg3, border: `1px solid #333`, borderRadius: 6, color: C.text, fontSize: 13, boxSizing: "border-box" }),
  textarea: css({ width: "100%", padding: "8px 10px", background: C.bg3, border: `1px solid #333`, borderRadius: 6, color: C.text, fontSize: 13, boxSizing: "border-box", minHeight: 80, resize: "vertical" }),
  formRow: css({ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }),
  loginBox: css({ maxWidth: 360, margin: "120px auto", background: C.bg2, borderRadius: 12, padding: 32, border: `1px solid ${C.border}`, textAlign: "center" }),
  err: css({ color: C.danger, fontSize: 12, marginTop: 8 }),
};

const btn = (variant: "primary" | "ghost" | "danger"): CSSProperties => ({
  padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
  ...(variant === "primary" ? { background: C.gold, color: "#000" } :
      variant === "danger"  ? { background: "#c0392b22", color: C.danger, border: "1px solid #e74c3c44" } :
                              { background: "#2a2a2a", color: "#aaa" }),
});
const tabStyle = (active: boolean): CSSProperties => ({
  padding: "12px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600,
  letterSpacing: 0.5, border: "none", background: "none",
  color: active ? C.gold : C.muted,
  borderBottom: active ? `2px solid ${C.gold}` : "2px solid transparent",
});
const pubBadge = (pub: boolean): CSSProperties => ({
  display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
  background: pub ? "#c8a96a22" : "#2a2a2a",
  color: pub ? C.gold : "#555",
});

// ── Login ──────────────────────────────────────────────────────────────────
function Login({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState(""); const [err, setErr] = useState("");
  const submit = () => pw === ADMIN_PASSWORD ? onLogin() : setErr("Incorrect password");
  return (
    <div style={S.page}>
      <div style={S.loginBox}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.gold, marginBottom: 8 }}>THE ART WALK</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Admin · Map</div>
        <input style={{ ...S.input, marginBottom: 12 }} type="password" placeholder="Password"
          value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
        {err && <div style={S.err}>{err}</div>}
        <button style={{ ...btn("primary"), width: "100%", marginTop: 12 }} onClick={submit}>ENTER</button>
      </div>
    </div>
  );
}

// ── Gallery form ───────────────────────────────────────────────────────────
function GalleryForm({ initial, onSave, onCancel }: { initial: Gallery; onSave: (g: Gallery) => void; onCancel: () => void }) {
  const [g, setG] = useState(initial);
  const f = (k: keyof Gallery) => (e: React.ChangeEvent<HTMLInputElement>) => setG(p => ({ ...p, [k]: e.target.value }));
  const save = () => {
    if (!g.name || !g.area || !g.address) return alert("Name, area and address required");
    onSave({ ...g, id: g.id || slug(g.name), lat: Number(g.lat), lng: Number(g.lng) });
  };
  return (
    <div style={S.form}>
      <div style={S.formTitle}>{g.id ? "Edit Gallery" : "Add Gallery"}</div>
      <div style={S.grid2}>
        <div><label style={S.label}>NAME *</label><input style={S.input} value={g.name} onChange={f("name")} /></div>
        <div><label style={S.label}>AREA *</label><input style={S.input} value={g.area} onChange={f("area")} /></div>
      </div>
      <div style={S.field}><label style={S.label}>ADDRESS *</label><input style={S.input} value={g.address} onChange={f("address")} /></div>
      <div style={S.grid2}>
        <div><label style={S.label}>LATITUDE</label><input style={S.input} type="number" value={g.lat} onChange={f("lat")} /></div>
        <div><label style={S.label}>LONGITUDE</label><input style={S.input} type="number" value={g.lng} onChange={f("lng")} /></div>
      </div>
      <div style={S.grid2}>
        <div><label style={S.label}>INSTAGRAM</label><input style={S.input} value={g.instagram} onChange={f("instagram")} placeholder="@handle" /></div>
        <div><label style={S.label}>WEBSITE</label><input style={S.input} value={g.website} onChange={f("website")} /></div>
      </div>
      <div style={S.field}><label style={S.label}>DEFAULT HOURS</label><input style={S.input} value={g.default_hours} onChange={f("default_hours")} placeholder="Tue–Sun 11am–6pm" /></div>
      <div style={S.formRow}>
        <button style={btn("ghost")} onClick={onCancel}>Cancel</button>
        <button style={btn("primary")} onClick={save}>Save Gallery</button>
      </div>
    </div>
  );
}

// ── Show form ──────────────────────────────────────────────────────────────
function ShowForm({ initial, onSave, onCancel }: { initial: Show; onSave: (s: Show) => void; onCancel: () => void }) {
  const [sh, setSh] = useState(initial);
  const [artistsStr, setArtistsStr] = useState(initial.artists.join(", "));
  const [mediumsStr, setMediumsStr] = useState(initial.mediums.join(", "));
  const [openDaysStr, setOpenDaysStr] = useState(initial.open_days.join(", "));
  const [photosStr, setPhotosStr] = useState(initial.photos.join(", "));
  const f = (k: keyof Show) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSh(p => ({ ...p, [k]: e.target.value }));
  const save = () => {
    if (!sh.title || !sh.gallery) return alert("Title and gallery required");
    onSave({
      ...sh, id: sh.id || slug(sh.title + "-" + sh.gallery),
      lat: Number(sh.lat), lng: Number(sh.lng),
      open_from: sh.open_from ? Number(sh.open_from) : null,
      open_to: sh.open_to ? Number(sh.open_to) : null,
      artists: arrField(artistsStr), mediums: arrField(mediumsStr),
      open_days: arrField(openDaysStr), photos: arrField(photosStr),
    });
  };
  return (
    <div style={S.form}>
      <div style={S.formTitle}>{sh.id ? "Edit Show" : "Add Show"}</div>
      <div style={S.grid2}>
        <div><label style={S.label}>TITLE *</label><input style={S.input} value={sh.title} onChange={f("title")} /></div>
        <div><label style={S.label}>GALLERY NAME *</label><input style={S.input} value={sh.gallery} onChange={f("gallery")} /></div>
      </div>
      <div style={S.grid2}>
        <div><label style={S.label}>AREA</label><input style={S.input} value={sh.area} onChange={f("area")} /></div>
        <div><label style={S.label}>INSTAGRAM</label><input style={S.input} value={sh.instagram} onChange={f("instagram")} placeholder="@handle" /></div>
      </div>
      <div style={S.field}><label style={S.label}>ADDRESS</label><input style={S.input} value={sh.address} onChange={f("address")} /></div>
      <div style={S.grid2}>
        <div><label style={S.label}>LATITUDE</label><input style={S.input} type="number" value={sh.lat} onChange={f("lat")} /></div>
        <div><label style={S.label}>LONGITUDE</label><input style={S.input} type="number" value={sh.lng} onChange={f("lng")} /></div>
      </div>
      <div style={S.field}><label style={S.label}>ARTISTS (comma separated)</label><input style={S.input} value={artistsStr} onChange={e => setArtistsStr(e.target.value)} placeholder="Artist One, Artist Two" /></div>
      <div style={S.field}><label style={S.label}>MEDIUMS (comma separated)</label><input style={S.input} value={mediumsStr} onChange={e => setMediumsStr(e.target.value)} placeholder="Painting, Photography" /></div>
      <div style={S.grid2}>
        <div><label style={S.label}>START DATE</label><input style={S.input} type="date" value={sh.start} onChange={f("start")} /></div>
        <div><label style={S.label}>END DATE</label><input style={S.input} type="date" value={sh.end} onChange={f("end")} /></div>
      </div>
      <div style={S.field}><label style={S.label}>OPENING NIGHT (YYYY-MM-DDThh:mm)</label><input style={S.input} value={sh.opening_at} onChange={f("opening_at")} placeholder="2026-11-20T18:00" /></div>
      <div style={S.field}><label style={S.label}>OPEN DAYS (e.g. Tue,Wed,Thu,Fri,Sat)</label><input style={S.input} value={openDaysStr} onChange={e => setOpenDaysStr(e.target.value)} /></div>
      <div style={S.grid2}>
        <div><label style={S.label}>OPENS AT (e.g. 11)</label><input style={S.input} type="number" value={sh.open_from ?? ""} onChange={f("open_from")} /></div>
        <div><label style={S.label}>CLOSES AT (e.g. 18.5)</label><input style={S.input} type="number" value={sh.open_to ?? ""} onChange={f("open_to")} /></div>
      </div>
      <div style={S.grid2}>
        <div><label style={S.label}>ENTRY</label><input style={S.input} value={sh.entry} onChange={f("entry")} placeholder="Free / ₹200" /></div>
        <div><label style={S.label}>PHOTO CREDIT</label><input style={S.input} value={sh.photo_credit} onChange={f("photo_credit")} /></div>
      </div>
      <div style={S.field}><label style={S.label}>ABOUT</label><textarea style={S.textarea} value={sh.about} onChange={f("about")} /></div>
      <div style={S.field}><label style={S.label}>PHOTO URLS (comma separated)</label><textarea style={{ ...S.textarea, minHeight: 60 }} value={photosStr} onChange={e => setPhotosStr(e.target.value)} /></div>
      <div style={S.formRow}>
        <button style={btn("ghost")} onClick={onCancel}>Cancel</button>
        <button style={btn("primary")} onClick={save}>Save Show</button>
      </div>
    </div>
  );
}

// ── Walk form ──────────────────────────────────────────────────────────────
function WalkForm({ initial, onSave, onCancel }: { initial: Walk; onSave: (w: Walk) => void; onCancel: () => void }) {
  const [w, setW] = useState(initial);
  const [stopsStr, setStopsStr] = useState(initial.stops.join(", "));
  const f = (k: keyof Walk) => (e: React.ChangeEvent<HTMLInputElement>) => setW(p => ({ ...p, [k]: e.target.value }));
  const save = () => {
    if (!w.title) return alert("Title required");
    onSave({ ...w, id: w.id || slug(w.title), stops: arrField(stopsStr) });
  };
  return (
    <div style={S.form}>
      <div style={S.formTitle}>{w.id ? "Edit Walk" : "Add Walk"}</div>
      <div style={S.grid2}>
        <div><label style={S.label}>TITLE (English) *</label><input style={S.input} value={w.title} onChange={f("title")} /></div>
        <div><label style={S.label}>TITLE (Hindi)</label><input style={S.input} value={w.title_hi} onChange={f("title_hi")} /></div>
      </div>
      <div style={S.field}><label style={S.label}>STOPS — event IDs in walking order (comma separated)</label>
        <textarea style={S.textarea} value={stopsStr} onChange={e => setStopsStr(e.target.value)} placeholder="show-id-1, show-id-2" />
      </div>
      <div style={S.formRow}>
        <button style={btn("ghost")} onClick={onCancel}>Cancel</button>
        <button style={btn("primary")} onClick={save}>Save Walk</button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("shows");
  const [shows, setShows] = useState<Show[]>([]);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [walks, setWalks] = useState<Walk[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState<Show | null>(null);
  const [galleryForm, setGalleryForm] = useState<Gallery | null>(null);
  const [walkForm, setWalkForm] = useState<Walk | null>(null);
  const [msg, setMsg] = useState("");

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const sb = getSupabase();
    const [ev, ga, wa] = await Promise.all([
      sb.from("events").select("*").order("created_at", { ascending: false }),
      sb.from("galleries").select("*").order("name"),
      sb.from("walks").select("*").order("title"),
    ]);
    if (ev.data) setShows(ev.data as Show[]);
    if (ga.data) setGalleries(ga.data as Gallery[]);
    if (wa.data) setWalks(wa.data as Walk[]);
    setLoading(false);
  }, []);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  const sb = getSupabase();

  const saveShow = async (sh: Show) => {
    const { error } = await sb.from("events").upsert(sh as any);
    if (error) return alert(error.message);
    flash("Show saved ✓"); setShowForm(null); load();
  };
  const deleteShow = async (id: string) => {
    if (!confirm("Delete this show?")) return;
    await sb.from("events").delete().eq("id", id);
    flash("Deleted"); load();
  };
  const saveGallery = async (g: Gallery) => {
    const { error } = await sb.from("galleries").upsert(g as any);
    if (error) return alert(error.message);
    flash("Gallery saved ✓"); setGalleryForm(null); load();
  };
  const deleteGallery = async (id: string) => {
    if (!confirm("Delete this gallery?")) return;
    await sb.from("galleries").delete().eq("id", id);
    flash("Deleted"); load();
  };
  const saveWalk = async (w: Walk) => {
    const { error } = await sb.from("walks").upsert(w as any);
    if (error) return alert(error.message);
    flash("Walk saved ✓"); setWalkForm(null); load();
  };
  const deleteWalk = async (id: string) => {
    if (!confirm("Delete this walk?")) return;
    await sb.from("walks").delete().eq("id", id);
    flash("Deleted"); load();
  };

  const empty = (cols: number, label: string) => (
    <tr><td colSpan={cols} style={{ ...S.td, textAlign: "center", color: "#555", padding: 32 }}>No {label} yet. Add one above.</td></tr>
  );

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.logo}>THE ART WALK</div>
        <span style={S.badge}>ADMIN · MAP</span>
        {msg && <span style={{ marginLeft: "auto", color: C.gold, fontSize: 13 }}>{msg}</span>}
      </div>

      <div style={S.tabs}>
        {(["shows", "galleries", "walks"] as Tab[]).map(t => (
          <button key={t} style={tabStyle(tab === t)} onClick={() => setTab(t)}>
            {t.toUpperCase()} ({t === "shows" ? shows.length : t === "galleries" ? galleries.length : walks.length})
          </button>
        ))}
      </div>

      <div style={S.body}>
        {loading && <div style={{ color: C.muted, textAlign: "center", padding: 40 }}>Loading…</div>}

        {/* SHOWS */}
        {tab === "shows" && !loading && (
          <>
            <div style={S.row}>
              <div style={S.h2}>Exhibitions &amp; Shows</div>
              <button style={btn("primary")} onClick={() => setShowForm(blankShow())}>+ Add Show</button>
            </div>
            {showForm && <ShowForm initial={showForm} onSave={saveShow} onCancel={() => setShowForm(null)} />}
            <table style={S.table}>
              <thead><tr>
                <th style={S.th}>TITLE</th><th style={S.th}>GALLERY</th>
                <th style={S.th}>AREA</th><th style={S.th}>ENDS</th>
                <th style={S.th}>STATUS</th><th style={S.th}></th>
              </tr></thead>
              <tbody>
                {shows.map(sh => (
                  <tr key={sh.id}>
                    <td style={S.td}><b>{sh.title}</b><br /><span style={{ color: C.muted, fontSize: 11 }}>{sh.artists.join(", ")}</span></td>
                    <td style={S.td}>{sh.gallery}</td>
                    <td style={S.td}>{sh.area}</td>
                    <td style={{ ...S.td, color: "#888", fontSize: 12 }}>{sh.end || "—"}</td>
                    <td style={S.td}><span style={pubBadge(sh.published)}>{sh.published ? "Live" : "Draft"}</span></td>
                    <td style={{ ...S.td, textAlign: "right", whiteSpace: "nowrap" }}>
                      <button style={{ ...btn("ghost"), marginRight: 6 }} onClick={() => setShowForm(sh)}>Edit</button>
                      <button style={btn("danger")} onClick={() => deleteShow(sh.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {shows.length === 0 && empty(6, "shows")}
              </tbody>
            </table>
          </>
        )}

        {/* GALLERIES */}
        {tab === "galleries" && !loading && (
          <>
            <div style={S.row}>
              <div style={S.h2}>Galleries</div>
              <button style={btn("primary")} onClick={() => setGalleryForm(blankGallery())}>+ Add Gallery</button>
            </div>
            {galleryForm && <GalleryForm initial={galleryForm} onSave={saveGallery} onCancel={() => setGalleryForm(null)} />}
            <table style={S.table}>
              <thead><tr>
                <th style={S.th}>NAME</th><th style={S.th}>AREA</th>
                <th style={S.th}>COORDINATES</th><th style={S.th}>STATUS</th><th style={S.th}></th>
              </tr></thead>
              <tbody>
                {galleries.map(g => (
                  <tr key={g.id}>
                    <td style={S.td}><b>{g.name}</b><br /><span style={{ color: C.muted, fontSize: 11 }}>{g.instagram}</span></td>
                    <td style={S.td}>{g.area}</td>
                    <td style={{ ...S.td, color: "#888", fontSize: 12 }}>{g.lat}, {g.lng}</td>
                    <td style={S.td}><span style={pubBadge(g.published)}>{g.published ? "Live" : "Draft"}</span></td>
                    <td style={{ ...S.td, textAlign: "right", whiteSpace: "nowrap" }}>
                      <button style={{ ...btn("ghost"), marginRight: 6 }} onClick={() => setGalleryForm(g)}>Edit</button>
                      <button style={btn("danger")} onClick={() => deleteGallery(g.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {galleries.length === 0 && empty(5, "galleries")}
              </tbody>
            </table>
          </>
        )}

        {/* WALKS */}
        {tab === "walks" && !loading && (
          <>
            <div style={S.row}>
              <div style={S.h2}>Curated Walks</div>
              <button style={btn("primary")} onClick={() => setWalkForm(blankWalk())}>+ Add Walk</button>
            </div>
            {walkForm && <WalkForm initial={walkForm} onSave={saveWalk} onCancel={() => setWalkForm(null)} />}
            <table style={S.table}>
              <thead><tr>
                <th style={S.th}>TITLE</th><th style={S.th}>STOPS</th>
                <th style={S.th}>STATUS</th><th style={S.th}></th>
              </tr></thead>
              <tbody>
                {walks.map(w => (
                  <tr key={w.id}>
                    <td style={S.td}><b>{w.title}</b><br /><span style={{ color: C.muted, fontSize: 11 }}>{w.title_hi}</span></td>
                    <td style={{ ...S.td, color: "#888", fontSize: 12 }}>{w.stops.length} stops</td>
                    <td style={S.td}><span style={pubBadge(w.published)}>{w.published ? "Live" : "Draft"}</span></td>
                    <td style={{ ...S.td, textAlign: "right", whiteSpace: "nowrap" }}>
                      <button style={{ ...btn("ghost"), marginRight: 6 }} onClick={() => setWalkForm(w)}>Edit</button>
                      <button style={btn("danger")} onClick={() => deleteWalk(w.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {walks.length === 0 && empty(4, "walks")}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

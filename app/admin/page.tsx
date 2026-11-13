"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type Tab = "shows" | "galleries" | "walks";

// ── Types ──────────────────────────────────────────────────────────────────
interface Gallery {
  id: string;
  name: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
  instagram?: string;
  website?: string;
  default_hours?: string;
  published: boolean;
}

interface Show {
  id: string;
  gallery_id?: string;
  gallery: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
  instagram?: string;
  title: string;
  artists: string[];
  mediums: string[];
  start?: string;
  end?: string;
  opening_at?: string;
  open_days: string[];
  open_from?: number;
  open_to?: number;
  entry?: string;
  about?: string;
  photos: string[];
  photo_credit?: string;
  published: boolean;
}

interface Walk {
  id: string;
  title: string;
  title_hi?: string;
  stops: string[];
  published: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const arrField = (v: string) =>
  v.split(",").map((s) => s.trim()).filter(Boolean);

// ── Blank forms ───────────────────────────────────────────────────────────
const blankGallery = (): Gallery => ({
  id: "", name: "", area: "", address: "", lat: 0, lng: 0,
  instagram: "", website: "", default_hours: "", published: true,
});
const blankShow = (): Show => ({
  id: "", gallery_id: "", gallery: "", area: "", address: "",
  lat: 0, lng: 0, instagram: "", title: "", artists: [], mediums: [],
  start: "", end: "", opening_at: "", open_days: [], open_from: undefined,
  open_to: undefined, entry: "", about: "", photos: [], photo_credit: "",
  published: true,
});
const blankWalk = (): Walk => ({
  id: "", title: "", title_hi: "", stops: [], published: true,
});

// ── Styles ─────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0f0f0f", color: "#f0f0f0", fontFamily: "system-ui, sans-serif" },
  header: { background: "#1a1a1a", borderBottom: "1px solid #2a2a2a", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 },
  logo: { fontSize: 20, fontWeight: 800, letterSpacing: 1, color: "#c8a96a" },
  badge: { fontSize: 10, background: "#c8a96a22", color: "#c8a96a", border: "1px solid #c8a96a44", borderRadius: 4, padding: "2px 8px", letterSpacing: 1 },
  tabs: { display: "flex", gap: 0, borderBottom: "1px solid #2a2a2a", background: "#161616", padding: "0 24px" },
  tab: { padding: "12px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600, letterSpacing: 0.5, border: "none", background: "none", color: "#666", borderBottom: "2px solid transparent" },
  tabActive: { color: "#c8a96a", borderBottom: "2px solid #c8a96a" },
  body: { padding: "24px", maxWidth: 900, margin: "0 auto" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  h2: { fontSize: 18, fontWeight: 700, margin: 0 },
  btn: { padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  btnPrimary: { background: "#c8a96a", color: "#000" },
  btnDanger: { background: "#c0392b22", color: "#e74c3c", border: "1px solid #e74c3c44" },
  btnGhost: { background: "#2a2a2a", color: "#aaa" },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th: { textAlign: "left" as const, padding: "10px 12px", background: "#1a1a1a", color: "#666", fontWeight: 600, letterSpacing: 0.5, fontSize: 11, borderBottom: "1px solid #2a2a2a" },
  td: { padding: "10px 12px", borderBottom: "1px solid #1e1e1e", verticalAlign: "top" as const },
  form: { background: "#1a1a1a", borderRadius: 10, padding: 20, marginBottom: 24, border: "1px solid #2a2a2a" },
  formTitle: { fontSize: 15, fontWeight: 700, marginBottom: 16, color: "#c8a96a" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 },
  label: { display: "block", fontSize: 11, color: "#888", marginBottom: 4, letterSpacing: 0.5 },
  input: { width: "100%", padding: "8px 10px", background: "#111", border: "1px solid #333", borderRadius: 6, color: "#f0f0f0", fontSize: 13, boxSizing: "border-box" as const },
  textarea: { width: "100%", padding: "8px 10px", background: "#111", border: "1px solid #333", borderRadius: 6, color: "#f0f0f0", fontSize: 13, boxSizing: "border-box" as const, minHeight: 80, resize: "vertical" as const },
  formRow: { display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 },
  loginBox: { maxWidth: 360, margin: "120px auto", background: "#1a1a1a", borderRadius: 12, padding: 32, border: "1px solid #2a2a2a", textAlign: "center" as const },
  loginTitle: { fontSize: 22, fontWeight: 800, color: "#c8a96a", marginBottom: 8 },
  loginSub: { fontSize: 13, color: "#666", marginBottom: 24 },
  err: { color: "#e74c3c", fontSize: 12, marginTop: 8 },
  pub: { display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 },
};

// ── Login screen ──────────────────────────────────────────────────────────
function Login({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const submit = () => {
    if (pw === ADMIN_PASSWORD) { onLogin(); }
    else { setErr("Incorrect password"); }
  };
  return (
    <div style={s.page}>
      <div style={s.loginBox}>
        <div style={s.loginTitle}>THE ART WALK</div>
        <div style={s.loginSub}>Admin · Map</div>
        <input
          style={{ ...s.input, marginBottom: 12 }}
          type="password" placeholder="Password"
          value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
        />
        {err && <div style={s.err}>{err}</div>}
        <button style={{ ...s.btn, ...s.btnPrimary, width: "100%", marginTop: 12 }} onClick={submit}>
          ENTER
        </button>
      </div>
    </div>
  );
}

// ── Gallery form ──────────────────────────────────────────────────────────
function GalleryForm({ initial, onSave, onCancel }: {
  initial: Gallery; onSave: (g: Gallery) => void; onCancel: () => void;
}) {
  const [g, setG] = useState(initial);
  const f = (k: keyof Gallery) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setG(prev => ({ ...prev, [k]: e.target.value }));
  const save = () => {
    if (!g.name || !g.area || !g.address) return alert("Name, area and address required");
    const id = g.id || slug(g.name);
    onSave({ ...g, id, lat: Number(g.lat), lng: Number(g.lng) });
  };
  return (
    <div style={s.form}>
      <div style={s.formTitle}>{g.id ? "Edit Gallery" : "Add Gallery"}</div>
      <div style={s.grid}>
        <div><label style={s.label}>NAME *</label><input style={s.input} value={g.name} onChange={f("name")} /></div>
        <div><label style={s.label}>AREA *</label><input style={s.input} value={g.area} onChange={f("area")} /></div>
      </div>
      <div style={{ marginBottom: 12 }}><label style={s.label}>ADDRESS *</label><input style={s.input} value={g.address} onChange={f("address")} /></div>
      <div style={s.grid}>
        <div><label style={s.label}>LATITUDE</label><input style={s.input} type="number" value={g.lat} onChange={f("lat")} /></div>
        <div><label style={s.label}>LONGITUDE</label><input style={s.input} type="number" value={g.lng} onChange={f("lng")} /></div>
      </div>
      <div style={s.grid}>
        <div><label style={s.label}>INSTAGRAM</label><input style={s.input} value={g.instagram || ""} onChange={f("instagram")} placeholder="@handle" /></div>
        <div><label style={s.label}>WEBSITE</label><input style={s.input} value={g.website || ""} onChange={f("website")} /></div>
      </div>
      <div><label style={s.label}>DEFAULT HOURS</label><input style={s.input} value={g.default_hours || ""} onChange={f("default_hours")} placeholder="Tue–Sun 11am–6pm" /></div>
      <div style={s.formRow}>
        <button style={{ ...s.btn, ...s.btnGhost }} onClick={onCancel}>Cancel</button>
        <button style={{ ...s.btn, ...s.btnPrimary }} onClick={save}>Save Gallery</button>
      </div>
    </div>
  );
}

// ── Show form ─────────────────────────────────────────────────────────────
function ShowForm({ initial, onSave, onCancel }: {
  initial: Show; onSave: (s: Show) => void; onCancel: () => void;
}) {
  const [sh, setSh] = useState(initial);
  const [artistsStr, setArtistsStr] = useState(initial.artists.join(", "));
  const [mediumsStr, setMediumsStr] = useState(initial.mediums.join(", "));
  const [openDaysStr, setOpenDaysStr] = useState(initial.open_days.join(", "));
  const [photosStr, setPhotosStr] = useState(initial.photos.join(", "));
  const f = (k: keyof Show) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setSh(prev => ({ ...prev, [k]: e.target.value }));
  const save = () => {
    if (!sh.title || !sh.gallery) return alert("Title and gallery required");
    const id = sh.id || slug(sh.title + "-" + sh.gallery);
    onSave({
      ...sh, id,
      lat: Number(sh.lat), lng: Number(sh.lng),
      open_from: sh.open_from ? Number(sh.open_from) : undefined,
      open_to: sh.open_to ? Number(sh.open_to) : undefined,
      artists: arrField(artistsStr),
      mediums: arrField(mediumsStr),
      open_days: arrField(openDaysStr),
      photos: arrField(photosStr),
    });
  };
  return (
    <div style={s.form}>
      <div style={s.formTitle}>{sh.id ? "Edit Show" : "Add Show"}</div>
      <div style={s.grid}>
        <div><label style={s.label}>TITLE *</label><input style={s.input} value={sh.title} onChange={f("title")} /></div>
        <div><label style={s.label}>GALLERY NAME *</label><input style={s.input} value={sh.gallery} onChange={f("gallery")} /></div>
      </div>
      <div style={s.grid}>
        <div><label style={s.label}>AREA</label><input style={s.input} value={sh.area} onChange={f("area")} /></div>
        <div><label style={s.label}>INSTAGRAM</label><input style={s.input} value={sh.instagram || ""} onChange={f("instagram")} placeholder="@handle" /></div>
      </div>
      <div style={{ marginBottom: 12 }}><label style={s.label}>ADDRESS</label><input style={s.input} value={sh.address} onChange={f("address")} /></div>
      <div style={s.grid}>
        <div><label style={s.label}>LATITUDE</label><input style={s.input} type="number" value={sh.lat} onChange={f("lat")} /></div>
        <div><label style={s.label}>LONGITUDE</label><input style={s.input} type="number" value={sh.lng} onChange={f("lng")} /></div>
      </div>
      <div style={{ marginBottom: 12 }}><label style={s.label}>ARTISTS (comma separated)</label><input style={s.input} value={artistsStr} onChange={e => setArtistsStr(e.target.value)} placeholder="Artist One, Artist Two" /></div>
      <div style={{ marginBottom: 12 }}><label style={s.label}>MEDIUMS (comma separated)</label><input style={s.input} value={mediumsStr} onChange={e => setMediumsStr(e.target.value)} placeholder="Painting, Photography" /></div>
      <div style={s.grid}>
        <div><label style={s.label}>START DATE</label><input style={s.input} type="date" value={sh.start || ""} onChange={f("start")} /></div>
        <div><label style={s.label}>END DATE</label><input style={s.input} type="date" value={sh.end || ""} onChange={f("end")} /></div>
      </div>
      <div style={{ marginBottom: 12 }}><label style={s.label}>OPENING NIGHT (YYYY-MM-DDThh:mm)</label><input style={s.input} value={sh.opening_at || ""} onChange={f("opening_at")} placeholder="2026-11-20T18:00" /></div>
      <div style={{ marginBottom: 12 }}><label style={s.label}>OPEN DAYS (comma separated, e.g. Tue,Wed,Thu,Fri,Sat)</label><input style={s.input} value={openDaysStr} onChange={e => setOpenDaysStr(e.target.value)} /></div>
      <div style={s.grid}>
        <div><label style={s.label}>OPENS AT (decimal hour, e.g. 11)</label><input style={s.input} type="number" value={sh.open_from ?? ""} onChange={f("open_from")} /></div>
        <div><label style={s.label}>CLOSES AT (decimal hour, e.g. 18.5)</label><input style={s.input} type="number" value={sh.open_to ?? ""} onChange={f("open_to")} /></div>
      </div>
      <div style={s.grid}>
        <div><label style={s.label}>ENTRY</label><input style={s.input} value={sh.entry || ""} onChange={f("entry")} placeholder="Free / ₹200" /></div>
        <div><label style={s.label}>PHOTO CREDIT</label><input style={s.input} value={sh.photo_credit || ""} onChange={f("photo_credit")} /></div>
      </div>
      <div style={{ marginBottom: 12 }}><label style={s.label}>ABOUT</label><textarea style={s.textarea} value={sh.about || ""} onChange={f("about")} /></div>
      <div style={{ marginBottom: 12 }}><label style={s.label}>PHOTO URLS (comma separated)</label><textarea style={{ ...s.textarea, minHeight: 60 }} value={photosStr} onChange={e => setPhotosStr(e.target.value)} /></div>
      <div style={s.formRow}>
        <button style={{ ...s.btn, ...s.btnGhost }} onClick={onCancel}>Cancel</button>
        <button style={{ ...s.btn, ...s.btnPrimary }} onClick={save}>Save Show</button>
      </div>
    </div>
  );
}

// ── Walk form ─────────────────────────────────────────────────────────────
function WalkForm({ initial, onSave, onCancel }: {
  initial: Walk; onSave: (w: Walk) => void; onCancel: () => void;
}) {
  const [w, setW] = useState(initial);
  const [stopsStr, setStopsStr] = useState(initial.stops.join(", "));
  const f = (k: keyof Walk) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setW(prev => ({ ...prev, [k]: e.target.value }));
  const save = () => {
    if (!w.title) return alert("Title required");
    const id = w.id || slug(w.title);
    onSave({ ...w, id, stops: arrField(stopsStr) });
  };
  return (
    <div style={s.form}>
      <div style={s.formTitle}>{w.id ? "Edit Walk" : "Add Walk"}</div>
      <div style={s.grid}>
        <div><label style={s.label}>TITLE (English) *</label><input style={s.input} value={w.title} onChange={f("title")} /></div>
        <div><label style={s.label}>TITLE (Hindi)</label><input style={s.input} value={w.title_hi || ""} onChange={f("title_hi")} /></div>
      </div>
      <div style={{ marginBottom: 12 }}><label style={s.label}>STOPS — event IDs in walking order (comma separated)</label><textarea style={s.textarea} value={stopsStr} onChange={e => setStopsStr(e.target.value)} placeholder="show-id-1, show-id-2, show-id-3" /></div>
      <div style={s.formRow}>
        <button style={{ ...s.btn, ...s.btnGhost }} onClick={onCancel}>Cancel</button>
        <button style={{ ...s.btn, ...s.btnPrimary }} onClick={save}>Save Walk</button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
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
    const [ev, ga, wa] = await Promise.all([
      supabase.from("events").select("*").order("created_at", { ascending: false }),
      supabase.from("galleries").select("*").order("name"),
      supabase.from("walks").select("*").order("title"),
    ]);
    if (ev.data) setShows(ev.data as Show[]);
    if (ga.data) setGalleries(ga.data as Gallery[]);
    if (wa.data) setWalks(wa.data as Walk[]);
    setLoading(false);
  }, []);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  // ── Save handlers ──────────────────────────────────────────────────────
  const saveShow = async (sh: Show) => {
    const { error } = await supabase.from("events").upsert(sh);
    if (error) return alert(error.message);
    flash("Show saved ✓"); setShowForm(null); load();
  };
  const deleteShow = async (id: string) => {
    if (!confirm("Delete this show?")) return;
    await supabase.from("events").delete().eq("id", id);
    flash("Deleted"); load();
  };
  const saveGallery = async (g: Gallery) => {
    const { error } = await supabase.from("galleries").upsert(g);
    if (error) return alert(error.message);
    flash("Gallery saved ✓"); setGalleryForm(null); load();
  };
  const deleteGallery = async (id: string) => {
    if (!confirm("Delete this gallery?")) return;
    await supabase.from("galleries").delete().eq("id", id);
    flash("Deleted"); load();
  };
  const saveWalk = async (w: Walk) => {
    const { error } = await supabase.from("walks").upsert(w);
    if (error) return alert(error.message);
    flash("Walk saved ✓"); setWalkForm(null); load();
  };
  const deleteWalk = async (id: string) => {
    if (!confirm("Delete this walk?")) return;
    await supabase.from("walks").delete().eq("id", id);
    flash("Deleted"); load();
  };

  const pubBadge = (pub: boolean) => (
    <span style={{ ...s.pub, background: pub ? "#c8a96a22" : "#2a2a2a", color: pub ? "#c8a96a" : "#555" }}>
      {pub ? "Live" : "Draft"}
    </span>
  );

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.logo}>THE ART WALK</div>
        <span style={s.badge}>ADMIN · MAP</span>
        {msg && <span style={{ marginLeft: "auto", color: "#c8a96a", fontSize: 13 }}>{msg}</span>}
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {(["shows", "galleries", "walks"] as Tab[]).map(t => (
          <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}
            onClick={() => setTab(t)}>
            {t.toUpperCase()} {t === "shows" ? `(${shows.length})` : t === "galleries" ? `(${galleries.length})` : `(${walks.length})`}
          </button>
        ))}
      </div>

      <div style={s.body}>
        {loading && <div style={{ color: "#666", textAlign: "center", padding: 40 }}>Loading…</div>}

        {/* ── SHOWS ─────────────────────────────────────────── */}
        {tab === "shows" && !loading && (
          <>
            <div style={s.row}>
              <div style={s.h2}>Exhibitions &amp; Shows</div>
              <button style={{ ...s.btn, ...s.btnPrimary }} onClick={() => setShowForm(blankShow())}>+ Add Show</button>
            </div>
            {showForm && (
              <ShowForm initial={showForm} onSave={saveShow} onCancel={() => setShowForm(null)} />
            )}
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>TITLE</th>
                  <th style={s.th}>GALLERY</th>
                  <th style={s.th}>AREA</th>
                  <th style={s.th}>ENDS</th>
                  <th style={s.th}>STATUS</th>
                  <th style={s.th}></th>
                </tr>
              </thead>
              <tbody>
                {shows.map(sh => (
                  <tr key={sh.id}>
                    <td style={s.td}><b>{sh.title}</b><br /><span style={{ color: "#666", fontSize: 11 }}>{sh.artists.join(", ")}</span></td>
                    <td style={s.td}>{sh.gallery}</td>
                    <td style={s.td}>{sh.area}</td>
                    <td style={{ ...s.td, color: "#888", fontSize: 12 }}>{sh.end || "—"}</td>
                    <td style={s.td}>{pubBadge(sh.published)}</td>
                    <td style={{ ...s.td, textAlign: "right", whiteSpace: "nowrap" }}>
                      <button style={{ ...s.btn, ...s.btnGhost, marginRight: 6 }} onClick={() => setShowForm(sh)}>Edit</button>
                      <button style={{ ...s.btn, ...s.btnDanger }} onClick={() => deleteShow(sh.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {shows.length === 0 && (
                  <tr><td colSpan={6} style={{ ...s.td, textAlign: "center", color: "#555", padding: 32 }}>No shows yet. Add one above.</td></tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {/* ── GALLERIES ─────────────────────────────────────── */}
        {tab === "galleries" && !loading && (
          <>
            <div style={s.row}>
              <div style={s.h2}>Galleries</div>
              <button style={{ ...s.btn, ...s.btnPrimary }} onClick={() => setGalleryForm(blankGallery())}>+ Add Gallery</button>
            </div>
            {galleryForm && (
              <GalleryForm initial={galleryForm} onSave={saveGallery} onCancel={() => setGalleryForm(null)} />
            )}
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>NAME</th>
                  <th style={s.th}>AREA</th>
                  <th style={s.th}>COORDINATES</th>
                  <th style={s.th}>STATUS</th>
                  <th style={s.th}></th>
                </tr>
              </thead>
              <tbody>
                {galleries.map(g => (
                  <tr key={g.id}>
                    <td style={s.td}><b>{g.name}</b><br /><span style={{ color: "#666", fontSize: 11 }}>{g.instagram}</span></td>
                    <td style={s.td}>{g.area}</td>
                    <td style={{ ...s.td, color: "#888", fontSize: 12 }}>{g.lat}, {g.lng}</td>
                    <td style={s.td}>{pubBadge(g.published)}</td>
                    <td style={{ ...s.td, textAlign: "right", whiteSpace: "nowrap" }}>
                      <button style={{ ...s.btn, ...s.btnGhost, marginRight: 6 }} onClick={() => setGalleryForm(g)}>Edit</button>
                      <button style={{ ...s.btn, ...s.btnDanger }} onClick={() => deleteGallery(g.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {galleries.length === 0 && (
                  <tr><td colSpan={5} style={{ ...s.td, textAlign: "center", color: "#555", padding: 32 }}>No galleries yet. Add one above.</td></tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {/* ── WALKS ─────────────────────────────────────────── */}
        {tab === "walks" && !loading && (
          <>
            <div style={s.row}>
              <div style={s.h2}>Curated Walks</div>
              <button style={{ ...s.btn, ...s.btnPrimary }} onClick={() => setWalkForm(blankWalk())}>+ Add Walk</button>
            </div>
            {walkForm && (
              <WalkForm initial={walkForm} onSave={saveWalk} onCancel={() => setWalkForm(null)} />
            )}
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>TITLE</th>
                  <th style={s.th}>STOPS</th>
                  <th style={s.th}>STATUS</th>
                  <th style={s.th}></th>
                </tr>
              </thead>
              <tbody>
                {walks.map(w => (
                  <tr key={w.id}>
                    <td style={s.td}><b>{w.title}</b><br /><span style={{ color: "#666", fontSize: 11 }}>{w.title_hi}</span></td>
                    <td style={{ ...s.td, color: "#888", fontSize: 12 }}>{w.stops.length} stops</td>
                    <td style={s.td}>{pubBadge(w.published)}</td>
                    <td style={{ ...s.td, textAlign: "right", whiteSpace: "nowrap" }}>
                      <button style={{ ...s.btn, ...s.btnGhost, marginRight: 6 }} onClick={() => setWalkForm(w)}>Edit</button>
                      <button style={{ ...s.btn, ...s.btnDanger }} onClick={() => deleteWalk(w.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {walks.length === 0 && (
                  <tr><td colSpan={4} style={{ ...s.td, textAlign: "center", color: "#555", padding: 32 }}>No walks yet. Add one above.</td></tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

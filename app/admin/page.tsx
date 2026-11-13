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

const css = (obj: CSSProperties): CSSProperties => obj;

// ── Apple-inspired design tokens ──────────────────────────────────────────
const T = {
  gold: "#b8892e",
  bg: "#f2f2f7",
  surface: "rgba(255,255,255,0.92)",
  surfaceHigh: "rgba(255,255,255,1)",
  surfaceInput: "rgba(118,118,128,0.08)",
  border: "rgba(0,0,0,0.08)",
  borderStrong: "rgba(0,0,0,0.14)",
  text: "#000000",
  textSecondary: "rgba(0,0,0,0.5)",
  textTertiary: "rgba(0,0,0,0.25)",
  separator: "rgba(0,0,0,0.07)",
  red: "#ff3b30",
  green: "#34c759",
  blur: "blur(24px) saturate(180%)",
};

// ── Shared styles ──────────────────────────────────────────────────────────
const baseInput = css({
  width: "100%",
  padding: "11px 14px",
  background: T.surfaceInput,
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  color: T.text,
  fontSize: 15,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
  boxSizing: "border-box",
  outline: "none",
  letterSpacing: "-0.01em",
  WebkitAppearance: "none",
});

const baseTextarea = css({
  ...baseInput,
  minHeight: 88,
  resize: "vertical",
  lineHeight: 1.5,
});

function AppleInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ marginBottom: 1 }}>
      <input
        {...props}
        placeholder={label}
        style={{
          ...baseInput,
          borderRadius: 0,
          border: "none",
          borderBottom: `1px solid ${T.separator}`,
          background: "transparent",
          ...props.style,
        }}
      />
    </div>
  );
}

function FieldGroup({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {label && (
        <div style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 4 }}>
          {label}
        </div>
      )}
      <div style={{ background: T.surfaceHigh, borderRadius: 12, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "0 16px", borderBottom: `1px solid ${T.separator}`, minHeight: 44 }}>
      <label style={{ fontSize: 15, color: T.textSecondary, minWidth: 110, letterSpacing: "-0.01em", flexShrink: 0 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? label}
        style={{
          flex: 1, border: "none", background: "transparent",
          color: T.text, fontSize: 15, fontFamily: "inherit",
          letterSpacing: "-0.01em", textAlign: "right", outline: "none",
          padding: "11px 0",
        }}
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.separator}` }}>
      <label style={{ display: "block", fontSize: 12, color: T.textSecondary, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", border: "none", background: "transparent",
          color: T.text, fontSize: 15, fontFamily: "inherit",
          letterSpacing: "-0.01em", outline: "none", resize: "vertical",
          minHeight: 72, lineHeight: 1.5, boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function AppleButton({ children, variant = "primary", onClick, style }: {
  children: React.ReactNode; variant?: "primary" | "ghost" | "danger" | "tinted";
  onClick?: () => void; style?: CSSProperties;
}) {
  const [pressed, setPressed] = useState(false);
  const styles: Record<string, CSSProperties> = {
    primary: { background: T.gold, color: "#000", fontWeight: 600 },
    ghost: { background: T.surfaceHigh, color: T.text, border: `1px solid ${T.border}` },
    danger: { background: "rgba(255,69,58,0.15)", color: T.red, border: `1px solid rgba(255,69,58,0.25)` },
    tinted: { background: "rgba(200,169,106,0.15)", color: T.gold, border: `1px solid rgba(200,169,106,0.25)` },
  };
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer",
        fontSize: 15, fontFamily: "inherit", letterSpacing: "-0.01em",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition: "transform 100ms ease-out, opacity 100ms ease-out",
        ...styles[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── Login ──────────────────────────────────────────────────────────────────
function Login({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(false);
  const submit = () => {
    if (pw === ADMIN_PASSWORD) { onLogin(); }
    else { setErr("Incorrect password"); setShake(true); setTimeout(() => setShake(false), 500); }
  };
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" }}>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
        input::placeholder { color: rgba(0,0,0,0.3); }
        input[type=password]::-ms-reveal { display: none; }
      `}</style>
      <div style={{
        width: 340, background: T.surface,
        backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
        borderRadius: 20, border: `1px solid ${T.borderStrong}`,
        padding: "36px 28px",
        animation: shake ? "shake 0.4s ease" : "none",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", color: T.textSecondary, textTransform: "uppercase", marginBottom: 6 }}>The Art Walk</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: "-0.03em" }}>Admin</div>
        </div>
        <input
          type="password" placeholder="Password" value={pw}
          onChange={e => { setPw(e.target.value); setErr(""); }}
          onKeyDown={e => e.key === "Enter" && submit()}
          style={{
            ...baseInput, marginBottom: 12,
            textAlign: "center",
            background: "rgba(118,118,128,0.12)",
          }}
        />
        {err && <div style={{ textAlign: "center", color: T.red, fontSize: 13, marginBottom: 12 }}>{err}</div>}
        <AppleButton onClick={submit} style={{ width: "100%", padding: "13px 0", fontSize: 16, borderRadius: 12 }}>
          Continue
        </AppleButton>
      </div>
    </div>
  );
}

// ── Gallery form ───────────────────────────────────────────────────────────
function GalleryForm({ initial, onSave, onCancel }: { initial: Gallery; onSave: (g: Gallery) => void; onCancel: () => void }) {
  const [g, setG] = useState(initial);
  const f = (k: keyof Gallery) => (v: string) => setG(p => ({ ...p, [k]: v }));
  const save = () => {
    if (!g.name || !g.area || !g.address) return alert("Name, area and address required");
    onSave({ ...g, id: g.id || slug(g.name), lat: Number(g.lat), lng: Number(g.lng) });
  };
  return (
    <div style={{ background: T.surface, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, borderRadius: 16, border: `1px solid ${T.border}`, padding: 20, marginBottom: 20 }}>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 20, color: T.text }}>{g.id ? "Edit Gallery" : "New Gallery"}</div>
      <FieldGroup label="Gallery Info">
        <Field label="Name" value={g.name} onChange={f("name")} />
        <Field label="Area" value={g.area} onChange={f("area")} placeholder="Lodi Colony" />
        <Field label="Address" value={g.address} onChange={f("address")} placeholder="Full address" />
      </FieldGroup>
      <FieldGroup label="Location">
        <Field label="Latitude" type="number" value={g.lat} onChange={f("lat")} />
        <Field label="Longitude" type="number" value={g.lng} onChange={f("lng")} />
      </FieldGroup>
      <FieldGroup label="Contact">
        <Field label="Instagram" value={g.instagram} onChange={f("instagram")} placeholder="@handle" />
        <Field label="Website" value={g.website} onChange={f("website")} placeholder="https://" />
        <Field label="Hours" value={g.default_hours} onChange={f("default_hours")} placeholder="Tue–Sun 11am–6pm" />
      </FieldGroup>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <AppleButton variant="ghost" onClick={onCancel}>Cancel</AppleButton>
        <AppleButton onClick={save}>Save</AppleButton>
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
  const f = (k: keyof Show) => (v: string) => setSh(p => ({ ...p, [k]: v }));
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
    <div style={{ background: T.surface, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, borderRadius: 16, border: `1px solid ${T.border}`, padding: 20, marginBottom: 20 }}>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 20, color: T.text }}>{sh.id ? "Edit Show" : "New Show"}</div>
      <FieldGroup label="Exhibition">
        <Field label="Title" value={sh.title} onChange={f("title")} />
        <Field label="Gallery" value={sh.gallery} onChange={f("gallery")} />
        <Field label="Area" value={sh.area} onChange={f("area")} placeholder="Hauz Khas Village" />
        <Field label="Instagram" value={sh.instagram} onChange={f("instagram")} placeholder="@gallery" />
      </FieldGroup>
      <FieldGroup label="Location">
        <Field label="Address" value={sh.address} onChange={f("address")} />
        <Field label="Latitude" type="number" value={sh.lat} onChange={f("lat")} />
        <Field label="Longitude" type="number" value={sh.lng} onChange={f("lng")} />
      </FieldGroup>
      <FieldGroup label="Artists & Medium">
        <Field label="Artists" value={artistsStr} onChange={setArtistsStr} placeholder="One, Two, Three" />
        <Field label="Mediums" value={mediumsStr} onChange={setMediumsStr} placeholder="Painting, Photography" />
      </FieldGroup>
      <FieldGroup label="Dates">
        <Field label="Start" type="date" value={sh.start} onChange={f("start")} />
        <Field label="End" type="date" value={sh.end} onChange={f("end")} />
        <Field label="Opening night" value={sh.opening_at} onChange={f("opening_at")} placeholder="2026-11-20T18:00" />
      </FieldGroup>
      <FieldGroup label="Hours">
        <Field label="Open days" value={openDaysStr} onChange={setOpenDaysStr} placeholder="Tue,Wed,Thu,Fri,Sat" />
        <Field label="Opens at" type="number" value={sh.open_from ?? ""} onChange={f("open_from")} placeholder="11" />
        <Field label="Closes at" type="number" value={sh.open_to ?? ""} onChange={f("open_to")} placeholder="18" />
        <Field label="Entry" value={sh.entry} onChange={f("entry")} placeholder="Free / ₹200" />
      </FieldGroup>
      <FieldGroup label="Details">
        <TextAreaField label="About" value={sh.about} onChange={f("about")} placeholder="A short description of the show…" />
        <TextAreaField label="Photo URLs" value={photosStr} onChange={setPhotosStr} placeholder="https://…, https://…" />
        <Field label="Photo credit" value={sh.photo_credit} onChange={f("photo_credit")} />
      </FieldGroup>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <AppleButton variant="ghost" onClick={onCancel}>Cancel</AppleButton>
        <AppleButton onClick={save}>Save</AppleButton>
      </div>
    </div>
  );
}

// ── Walk form ──────────────────────────────────────────────────────────────
function WalkForm({ initial, onSave, onCancel }: { initial: Walk; onSave: (w: Walk) => void; onCancel: () => void }) {
  const [w, setW] = useState(initial);
  const [stopsStr, setStopsStr] = useState(initial.stops.join(", "));
  const f = (k: keyof Walk) => (v: string) => setW(p => ({ ...p, [k]: v }));
  const save = () => {
    if (!w.title) return alert("Title required");
    onSave({ ...w, id: w.id || slug(w.title), stops: arrField(stopsStr) });
  };
  return (
    <div style={{ background: T.surface, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, borderRadius: 16, border: `1px solid ${T.border}`, padding: 20, marginBottom: 20 }}>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 20, color: T.text }}>{w.id ? "Edit Walk" : "New Walk"}</div>
      <FieldGroup label="Walk Info">
        <Field label="Title" value={w.title} onChange={f("title")} />
        <Field label="Hindi title" value={w.title_hi} onChange={f("title_hi")} />
      </FieldGroup>
      <FieldGroup label="Stops">
        <TextAreaField label="Event IDs in walking order" value={stopsStr} onChange={setStopsStr} placeholder="show-id-1, show-id-2, show-id-3" />
      </FieldGroup>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <AppleButton variant="ghost" onClick={onCancel}>Cancel</AppleButton>
        <AppleButton onClick={save}>Save</AppleButton>
      </div>
    </div>
  );
}

// ── Row item ───────────────────────────────────────────────────────────────
function ListRow({ title, sub, right, onEdit, onDelete, last }: {
  title: string; sub?: string; right?: string;
  onEdit: () => void; onDelete: () => void; last?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", padding: "12px 16px",
        borderBottom: last ? "none" : `1px solid ${T.separator}`,
        background: hover ? "rgba(255,255,255,0.03)" : "transparent",
        transition: "background 150ms ease",
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, color: T.text, letterSpacing: "-0.01em", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 1 }}>{sub}</div>}
      </div>
      {right && <div style={{ fontSize: 13, color: T.textTertiary, flexShrink: 0 }}>{right}</div>}
      <div style={{ display: "flex", gap: 6, flexShrink: 0, opacity: hover ? 1 : 0, transition: "opacity 150ms ease" }}>
        <AppleButton variant="ghost" onClick={onEdit} style={{ padding: "5px 12px", fontSize: 13 }}>Edit</AppleButton>
        <AppleButton variant="danger" onClick={onDelete} style={{ padding: "5px 12px", fontSize: 13 }}>Delete</AppleButton>
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
  const [toast, setToast] = useState("");

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2500); };

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
    flash("Show saved"); setShowForm(null); load();
  };
  const deleteShow = async (id: string) => {
    if (!confirm("Delete this show?")) return;
    await sb.from("events").delete().eq("id", id);
    flash("Deleted"); load();
  };
  const saveGallery = async (g: Gallery) => {
    const { error } = await sb.from("galleries").upsert(g as any);
    if (error) return alert(error.message);
    flash("Gallery saved"); setGalleryForm(null); load();
  };
  const deleteGallery = async (id: string) => {
    if (!confirm("Delete this gallery?")) return;
    await sb.from("galleries").delete().eq("id", id);
    flash("Deleted"); load();
  };
  const saveWalk = async (w: Walk) => {
    const { error } = await sb.from("walks").upsert(w as any);
    if (error) return alert(error.message);
    flash("Walk saved"); setWalkForm(null); load();
  };
  const deleteWalk = async (id: string) => {
    if (!confirm("Delete this walk?")) return;
    await sb.from("walks").delete().eq("id", id);
    flash("Deleted"); load();
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "shows", label: "Shows", count: shows.length },
    { key: "galleries", label: "Galleries", count: galleries.length },
    { key: "walks", label: "Walks", count: walks.length },
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: rgba(0,0,0,0.25); }
        input[type=number]::-webkit-inner-spin-button { opacity: 0; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: none; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateY(16px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
      `}</style>

      {/* Header — translucent material */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(242,242,247,0.85)",
        backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
        borderBottom: `1px solid ${T.separator}`,
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", color: T.textSecondary, textTransform: "uppercase" }}>The Art Walk</span>
              <span style={{ fontSize: 13, color: T.textTertiary, marginLeft: 6 }}>· Admin</span>
            </div>
            <div style={{ display: "flex", gap: 2, background: "rgba(118,118,128,0.12)", borderRadius: 10, padding: 2 }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  padding: "5px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 500, letterSpacing: "-0.01em",
                  background: tab === t.key ? T.surfaceHigh : "transparent",
                  color: tab === t.key ? T.text : T.textSecondary,
                  transition: "all 150ms ease",
                }}>
                  {t.label}
                  <span style={{ marginLeft: 5, fontSize: 11, color: tab === t.key ? T.gold : T.textTertiary, fontVariantNumeric: "tabular-nums" }}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px 60px" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: T.textTertiary, fontSize: 15 }}>Loading…</div>
        )}

        {/* SHOWS */}
        {tab === "shows" && !loading && (
          <div style={{ animation: "fadeUp 0.25s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em" }}>Exhibitions</div>
              <AppleButton variant="tinted" onClick={() => { setShowForm(blankShow()); }}>+ New Show</AppleButton>
            </div>
            {showForm && <ShowForm initial={showForm} onSave={saveShow} onCancel={() => setShowForm(null)} />}
            {shows.length === 0 && !showForm && (
              <div style={{ textAlign: "center", padding: "48px 24px", background: T.surfaceHigh, borderRadius: 16, border: `1px solid ${T.border}`, color: T.textTertiary, fontSize: 15 }}>
                No shows yet — add your first exhibition
              </div>
            )}
            {shows.length > 0 && (
              <div style={{ background: T.surfaceHigh, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                {shows.map((sh, i) => (
                  <ListRow key={sh.id}
                    title={sh.title}
                    sub={`${sh.gallery} · ${sh.area}${sh.artists.length ? " · " + sh.artists.slice(0, 2).join(", ") : ""}`}
                    right={sh.end ? `until ${sh.end}` : undefined}
                    onEdit={() => setShowForm(sh)}
                    onDelete={() => deleteShow(sh.id)}
                    last={i === shows.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* GALLERIES */}
        {tab === "galleries" && !loading && (
          <div style={{ animation: "fadeUp 0.25s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em" }}>Galleries</div>
              <AppleButton variant="tinted" onClick={() => setGalleryForm(blankGallery())}>+ New Gallery</AppleButton>
            </div>
            {galleryForm && <GalleryForm initial={galleryForm} onSave={saveGallery} onCancel={() => setGalleryForm(null)} />}
            {galleries.length === 0 && !galleryForm && (
              <div style={{ textAlign: "center", padding: "48px 24px", background: T.surfaceHigh, borderRadius: 16, border: `1px solid ${T.border}`, color: T.textTertiary, fontSize: 15 }}>
                No galleries yet
              </div>
            )}
            {galleries.length > 0 && (
              <div style={{ background: T.surfaceHigh, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                {galleries.map((g, i) => (
                  <ListRow key={g.id}
                    title={g.name}
                    sub={`${g.area}${g.instagram ? " · " + g.instagram : ""}`}
                    right={`${g.lat.toFixed(3)}, ${g.lng.toFixed(3)}`}
                    onEdit={() => setGalleryForm(g)}
                    onDelete={() => deleteGallery(g.id)}
                    last={i === galleries.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* WALKS */}
        {tab === "walks" && !loading && (
          <div style={{ animation: "fadeUp 0.25s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em" }}>Walks</div>
              <AppleButton variant="tinted" onClick={() => setWalkForm(blankWalk())}>+ New Walk</AppleButton>
            </div>
            {walkForm && <WalkForm initial={walkForm} onSave={saveWalk} onCancel={() => setWalkForm(null)} />}
            {walks.length === 0 && !walkForm && (
              <div style={{ textAlign: "center", padding: "48px 24px", background: T.surfaceHigh, borderRadius: 16, border: `1px solid ${T.border}`, color: T.textTertiary, fontSize: 15 }}>
                No walks yet
              </div>
            )}
            {walks.length > 0 && (
              <div style={{ background: T.surfaceHigh, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                {walks.map((w, i) => (
                  <ListRow key={w.id}
                    title={w.title}
                    sub={w.title_hi || undefined}
                    right={`${w.stops.length} stops`}
                    onEdit={() => setWalkForm(w)}
                    onDelete={() => deleteWalk(w.id)}
                    last={i === walks.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.95)", backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
          border: `1px solid ${T.borderStrong}`, borderRadius: 20,
          padding: "10px 20px", fontSize: 14, fontWeight: 500, color: T.text,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          animation: "toastIn 0.25s ease",
          zIndex: 999, whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

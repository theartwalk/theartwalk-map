import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getData } from "@/lib/data";
import { fmtDate, hoursLabel, parseLocal } from "@/lib/status";

/**
 * A server-rendered page for each show, so links shared on WhatsApp get a proper preview
 * and search engines can index exhibitions. It links into the full map app.
 */
export const revalidate = 300;

async function find(id: string) {
  const data = await getData();
  return { show: data.shows.find(s => s.id === id), data };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { show } = await find(id);
  if (!show) return { title: "Exhibition not found" };
  const description = `${show.artists.join(", ")} at ${show.gallery}, ${show.area}. Until ${fmtDate(parseLocal(show.end), "en")}. ${show.about}`.slice(0, 200);
  return {
    title: `${show.title} at ${show.gallery}`,
    description,
    openGraph: { title: show.title, description, images: show.photos[0] ? [{ url: show.photos[0] }] : undefined }
  };
}

export default async function ShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { show, data } = await find(id);
  if (!show) notFound();
  const heroStyle = show.photos[0]
    ? { backgroundImage: `url("${show.photos[0]}")` }
    : { backgroundImage: "linear-gradient(160deg, #2F4B8C, #141B33)" };
  return (
    <main className="show-page">
      <div className="detail-hero" style={heroStyle} role="img" aria-label={show.title} />
      <div className="detail-body">
        <div>
          <h2 style={{ fontFamily: "var(--f-display)", fontWeight: 600, fontSize: 40, lineHeight: 1, margin: "8px 0" }}>{show.title}</h2>
          <div className="gal mono" style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)" }}>{show.gallery} · {show.area}</div>
        </div>
        <div style={{ fontSize: 15 }}>{show.artists.join(", ")}</div>
        <div className="actions">
          <Link className="act primary" href={`/?show=${encodeURIComponent(show.id)}`} style={{ background: "var(--accent)", color: "var(--on-accent)" }}>Open on the map</Link>
          <a className="act" href={`https://www.google.com/maps/search/?api=1&query=${show.lat},${show.lng}`} target="_blank" rel="noopener noreferrer">Directions</a>
        </div>
        <dl className="facts">
          <dt>Dates</dt><dd>{fmtDate(parseLocal(show.start), "en")} – {fmtDate(parseLocal(show.end), "en", true)}</dd>
          <dt>Hours</dt><dd>{hoursLabel(show, "en")}</dd>
          <dt>Entry</dt><dd>{show.entry}</dd>
          <dt>Where</dt><dd>{show.address || `${show.gallery}, ${show.area}`}</dd>
        </dl>
        {show.about && <p className="about">{show.about}</p>}
        {show.photoCredit && <p className="sample-note">Photo: {show.photoCredit}</p>}
        {data.source === "sample" && <p className="sample-note">Sample data. Galleries, shows and artists here are invented.</p>}
      </div>
    </main>
  );
}

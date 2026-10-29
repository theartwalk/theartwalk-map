"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { AttributionControl, LngLatBounds, Map as MLMap, Marker, getVersion, setWorkerUrl, type GeoJSONSource } from "maplibre-gl";
import type { Show } from "@/lib/types";
import type { WalkPlan } from "@/lib/status";
import { DELHI_CENTER } from "@/lib/areas";
import { artUrl, palette } from "@/lib/placeholder";

// Served from /public by scripts/copy-maplibre-worker.mjs (runs before dev and build).
setWorkerUrl(`/maplibre/maplibre-gl-worker.mjs?v=${getVersion()}`);

/** Free vector tiles from OpenFreeMap: no API key, no bill. */
const STYLE = {
  light: process.env.NEXT_PUBLIC_MAP_STYLE_LIGHT || "https://tiles.openfreemap.org/styles/positron",
  dark: process.env.NEXT_PUBLIC_MAP_STYLE_DARK || "https://tiles.openfreemap.org/styles/dark"
};

export type MapHandle = {
  focusShow: (s: Show, bottomInset: number) => void;
  fitWalk: (w: WalkPlan, bottomInset: number) => void;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
};
type Props = {
  shows: Show[];
  walk: WalkPlan | null;
  selectedId: string | null;
  theme: "light" | "dark";
  you: { lat: number; lng: number } | null;
  tag: (ids: string[]) => { kind: "closing" | "opening"; text: string } | null;
  moreLabel: (n: number) => string;
  onSelect: (id: string) => void;
  /** Changes whenever labels need rebuilding (language switch). */
  labelKey: string;
};

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
const tileBg = (s: Show) => { const u = artUrl(s); const p = palette(s); return u ? `background-image:url("${u}")` : `background-image:linear-gradient(160deg,${p[1]},${p[0]})`; };
const toFeatures = (list: Show[], numbered = false): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: list.map((s, i) => ({ type: "Feature", geometry: { type: "Point", coordinates: [s.lng, s.lat] }, properties: { id: s.id, n: numbered ? i + 1 : 0 } }))
});
const routeLine = (w: WalkPlan | null): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: w ? [{ type: "Feature", geometry: { type: "LineString", coordinates: w.shows.map(s => [s.lng, s.lat]) }, properties: {} }] : []
});

type LngLatLike = Parameters<MLMap["setCenter"]>[0];
type Cam = { center: LngLatLike; zoom: number; padding?: { top: number; bottom: number; left: number; right: number } };
/**
 * Animates the camera, and makes sure it arrives: an animation started while the map is still
 * loading its first tiles can be cut short, so if it ends far from the target we jump there.
 */
function moveCamera(map: MLMap, cam: Cam, duration: number) {
  map.stop();
  map.easeTo({ ...cam, duration });
  map.once("moveend", () => { if (Math.abs(map.getZoom() - cam.zoom) > 0.3) map.jumpTo(cam); });
}

export const MapView = forwardRef<MapHandle, Props>(function MapView(props, ref) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markers = useRef(new Map<string, { marker: Marker; el: HTMLElement; id?: string }>());
  const youMarker = useRef<Marker | null>(null);
  const latest = useRef(props);
  latest.current = props;
  const syncQueued = useRef(false);
  // Camera moves requested before the first style has loaded wait here, or they get lost.
  const ready = useRef(false);
  const pending = useRef<(() => void)[]>([]);
  const whenReady = (fn: () => void) => { if (ready.current) fn(); else pending.current.push(fn); };

  function byId(id: string) { return latest.current.shows.find(s => s.id === id) || latest.current.walk?.shows.find(s => s.id === id); }

  function clearMarkers() { markers.current.forEach(m => m.marker.remove()); markers.current.clear(); }

  function buildPoint(id: string, n: number) {
    const s = byId(id); if (!s) return null;
    const el = document.createElement("button");
    el.type = "button"; el.className = "pin";
    const tag = n ? null : latest.current.tag([id]);
    el.innerHTML = `${tag ? `<span class="tag ${tag.kind}">${esc(tag.text)}</span>` : ""}<span class="tile" style='${tileBg(s)}'>${n ? `<b class="num">${n}</b>` : ""}</span><span class="lbl">${esc(s.gallery)}</span>`;
    el.setAttribute("aria-label", `${n ? n + ". " : ""}${s.title}, ${s.gallery}`);
    el.addEventListener("click", ev => { ev.stopPropagation(); latest.current.onSelect(id); });
    return el;
  }
  function buildCluster(map: MLMap, clusterId: number, count: number, coords: [number, number]) {
    const el = document.createElement("button");
    el.type = "button"; el.className = "pin stack";
    el.innerHTML = `<span class="tile"></span><span class="lbl">&nbsp;<span class="more">${esc(latest.current.moreLabel(count - 1))}</span></span>`;
    el.setAttribute("aria-label", latest.current.moreLabel(count));
    const src = map.getSource("shows") as GeoJSONSource | undefined;
    src?.getClusterLeaves(clusterId, 50, 0).then(leaves => {
      const ids = leaves.map(l => String(l.properties?.id)).filter(Boolean);
      const lead = ids.map(byId).find(Boolean);
      if (!lead) return;
      const tile = el.querySelector(".tile") as HTMLElement; tile.setAttribute("style", tileBg(lead));
      (el.querySelector(".lbl") as HTMLElement).innerHTML = `${esc(lead.gallery)}<span class="more">${esc(latest.current.moreLabel(count - 1))}</span>`;
      const tag = latest.current.tag(ids);
      if (tag) el.insertAdjacentHTML("afterbegin", `<span class="tag ${tag.kind}">${esc(tag.text)}</span>`);
    }).catch(() => { /* cluster changed while loading */ });
    el.addEventListener("click", ev => {
      ev.stopPropagation();
      src?.getClusterExpansionZoom(clusterId).then(z => map.easeTo({ center: coords, zoom: Math.min(z + 0.4, 17), duration: 450 })).catch(() => {});
    });
    return el;
  }

  function sync() {
    syncQueued.current = false;
    if (process.env.NEXT_PUBLIC_DEBUG_MAP) console.info("[map] sync", latest.current.walk ? "stops" : "shows", mapRef.current?.querySourceFeatures(latest.current.walk ? "stops" : "shows").length);
    const map = mapRef.current; if (!map) return;
    const walk = latest.current.walk;
    const srcId = walk ? "stops" : "shows";
    if (!map.getSource(srcId)) return;
    const seen = new Set<string>();
    for (const f of map.querySourceFeatures(srcId)) {
      const p = f.properties || {};
      const key = p.cluster ? `c${p.cluster_id}` : `s${p.id}${walk ? "-w" : ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (markers.current.has(key)) continue;
      const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
      const el = p.cluster ? buildCluster(map, Number(p.cluster_id), Number(p.point_count), coords) : buildPoint(String(p.id), Number(p.n) || 0);
      if (!el) continue;
      const marker = new Marker({ element: el, anchor: "top", offset: [0, -30] }).setLngLat(coords).addTo(map);
      markers.current.set(key, { marker, el, id: p.cluster ? undefined : String(p.id) });
    }
    markers.current.forEach((m, k) => { if (!seen.has(k)) { m.marker.remove(); markers.current.delete(k); } });
    markSelected();
  }
  function queueSync() { if (!syncQueued.current) { syncQueued.current = true; requestAnimationFrame(sync); } }
  /** GeoJSON updates are parsed in a worker, so features appear a moment later: check again a few times. */
  function syncSoon() { queueSync(); [150, 400, 900, 1800].forEach(ms => setTimeout(queueSync, ms)); }
  function markSelected() {
    const sel = latest.current.selectedId;
    markers.current.forEach(m => { const on = !!sel && m.id === sel; m.el.classList.toggle("on", on); m.el.style.zIndex = on ? "5" : ""; });
  }

  function addLayers(map: MLMap) {
    const { shows, walk } = latest.current;
    if (!map.getSource("shows")) map.addSource("shows", { type: "geojson", data: toFeatures(shows), cluster: true, clusterRadius: 70, clusterMaxZoom: 15 });
    if (!map.getSource("stops")) map.addSource("stops", { type: "geojson", data: toFeatures(walk?.shows ?? [], true) });
    if (!map.getSource("route")) map.addSource("route", { type: "geojson", data: routeLine(walk) });
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2E3FA3";
    const surface = getComputedStyle(document.documentElement).getPropertyValue("--surface").trim() || "#FFFFFF";
    if (!map.getLayer("route-casing")) map.addLayer({ id: "route-casing", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": surface, "line-width": 10 } });
    if (!map.getLayer("route-line")) map.addLayer({ id: "route-line", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": accent, "line-width": 5 } });
    // Invisible layers keep both point sources loaded so their features can be read for markers.
    if (!map.getLayer("shows-anchor")) map.addLayer({ id: "shows-anchor", type: "circle", source: "shows", paint: { "circle-radius": 1, "circle-opacity": 0 } });
    if (!map.getLayer("stops-anchor")) map.addLayer({ id: "stops-anchor", type: "circle", source: "stops", paint: { "circle-radius": 1, "circle-opacity": 0 } });
    clearMarkers(); syncSoon();
  }

  // Create the map once.
  useEffect(() => {
    if (!box.current) return;
    const theme = latest.current.theme;
    const map = new MLMap({
      container: box.current, style: STYLE[theme], center: DELHI_CENTER, zoom: 11.4, minZoom: 9, maxZoom: 18,
      attributionControl: false, dragRotate: false, pitchWithRotate: false, maxBounds: [[76.6, 28.2], [77.7, 28.95]]
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new AttributionControl({ compact: true }), "top-right");
    // If the dark base map can't be loaded at all, fall back to the light one rather than a blank map.
    let fellBack = false, loadedOnce = false;
    map.on("error", () => { if (!fellBack && !loadedOnce && latest.current.theme === "dark") { fellBack = true; map.setStyle(STYLE.light); } });
    map.on("style.load", () => {
      loadedOnce = true; addLayers(map);
      if (!ready.current) { ready.current = true; const q = pending.current; pending.current = []; requestAnimationFrame(() => q.forEach(fn => fn())); }
    });
    map.on("render", queueSync);
    map.on("moveend", queueSync);
    map.on("idle", queueSync);
    map.on("sourcedata", e => { if ((e.sourceId === "shows" || e.sourceId === "stops") && e.isSourceLoaded) queueSync(); });
    mapRef.current = map;
    if (process.env.NEXT_PUBLIC_DEBUG_MAP) {
      (window as unknown as { __tawMap: MLMap }).__tawMap = map;
      (["movestart", "moveend", "style.load", "load"] as const).forEach(ev => map.on(ev, () => console.info("[map]", ev, map.getZoom().toFixed(2))));
    }
    return () => { clearMarkers(); youMarker.current?.remove(); map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme: swap the base map; our layers are re-added on style.load.
  const firstTheme = useRef(true);
  useEffect(() => {
    if (firstTheme.current) { firstTheme.current = false; return; }
    mapRef.current?.setStyle(STYLE[props.theme], { diff: false });
  }, [props.theme]);

  // Data: shows, walk stops and route.
  useEffect(() => {
    // Not isStyleLoaded(): that stays false while any source is still updating.
    const map = mapRef.current; if (!map || !map.getSource("shows")) return;
    (map.getSource("shows") as GeoJSONSource | undefined)?.setData(toFeatures(props.shows));
    (map.getSource("stops") as GeoJSONSource | undefined)?.setData(toFeatures(props.walk?.shows ?? [], true));
    (map.getSource("route") as GeoJSONSource | undefined)?.setData(routeLine(props.walk));
    clearMarkers(); syncSoon();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.shows, props.walk, props.labelKey]);

  useEffect(() => { markSelected(); }, [props.selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Visitor's own location.
  useEffect(() => {
    const map = mapRef.current; if (!map || !props.you) return;
    if (!youMarker.current) { const el = document.createElement("div"); el.className = "you"; youMarker.current = new Marker({ element: el }).setLngLat([props.you.lng, props.you.lat]).addTo(map); }
    else youMarker.current.setLngLat([props.you.lng, props.you.lat]);
  }, [props.you]);

  useImperativeHandle(ref, () => ({
    focusShow(s, bottomInset) {
      const map = mapRef.current; if (!map) return;
      // An offset (not padding) keeps the pin above the sheet without leaving padding behind for later moves.
      whenReady(() => { map.stop(); map.easeTo({ center: [s.lng, s.lat], zoom: Math.max(map.getZoom(), 15.2), offset: [0, -(bottomInset - 130) / 2], duration: 550 }); });
    },
    fitWalk(w, bottomInset) {
      const map = mapRef.current; if (!map) return;
      const b = new LngLatBounds();
      w.shows.forEach(s => b.extend([s.lng, s.lat]));
      whenReady(() => {
        map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
        const padding = { top: 150, bottom: bottomInset + 30, left: 60, right: 60 };
        const cam = map.cameraForBounds(b, { padding, maxZoom: 16 });
        if (cam?.center && cam.zoom !== undefined) moveCamera(map, { center: cam.center, zoom: cam.zoom }, 650);
      });
    },
    flyTo(lat, lng, zoom = 14) { whenReady(() => { const map = mapRef.current; if (map) moveCamera(map, { center: [lng, lat], zoom }, 600); }); }
  }), []);

  return <div ref={box} className="map" aria-label="Map of exhibitions" />;
});

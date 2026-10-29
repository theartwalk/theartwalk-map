import type { AppData, ArtEvent, Show, Walk } from "@/lib/types";
import { AREAS } from "@/lib/areas";

/**
 * Invented sample data placed in real Delhi neighbourhoods. Used when SHEET_ID is not set,
 * or when the sheet can't be reached. Dates are generated relative to today so statuses stay realistic.
 */
const TUE_SUN = [2, 3, 4, 5, 6, 0], MON_SAT = [1, 2, 3, 4, 5, 6], DAILY = [0, 1, 2, 3, 4, 5, 6], WED_SUN = [3, 4, 5, 6, 0], TUE_SAT = [2, 3, 4, 5, 6];

function istToday(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [y, m, d] = parts.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
const day = (off: number) => { const t = istToday(); t.setUTCDate(t.getUTCDate() + off); return t.toISOString().slice(0, 10); };
const at = (off: number, h: number, m = 0) => `${day(off)}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

type Raw = Omit<Show, "lat" | "lng" | "start" | "end" | "openingAt" | "address" | "photos" | "photoCredit" | "instagram" | "galleryId"> & { s: number; e: number; o?: [number, number, number?]; dLat?: number; dLng?: number };

const RAW: Raw[] = [
  { id: "monsoon-ledger", title: "Monsoon Ledger", gallery: "Saffron Room", area: "Lado Sarai", dLat: 0.0012, dLng: -0.0016, artists: ["Ira Menon"], mediums: ["Painting"], s: -12, e: 24, openDays: TUE_SUN, openFrom: 11, openTo: 19, entry: "Free",
    about: "Large oil-on-jute paintings built up over three monsoons. Menon records rainfall, flooding and repair as layers of pigment, scraped back and painted over like entries in an account book." },
  { id: "salt-and-thread", title: "Salt and Thread", gallery: "Kaarkhana Studio", area: "Shahpur Jat", artists: ["Farah Qureshi", "Neel Bose"], mediums: ["Textile"], s: -5, e: 40, openDays: MON_SAT, openFrom: 10, openTo: 18, entry: "Free",
    about: "Hand-woven panels made with weavers from Kutch and Barabanki. Each piece uses one fibre dyed with salt-based mordants, so the colour shifts as the light in the room changes." },
  { id: "night-shift", title: "Night Shift", gallery: "Lens House", area: "Hauz Khas Village", artists: ["Kabir Sethi"], mediums: ["Photography"], s: -20, e: 3, openDays: TUE_SUN, openFrom: 12, openTo: 20, entry: "₹100, free for students",
    about: "Two years of photographs taken between midnight and 5 am in Chandni Chowk: bakers, loaders, rickshaw pullers and a market lit only by sodium lamps." },
  { id: "weight-of-water", title: "The Weight of Water", gallery: "Plinth", area: "Defence Colony", artists: ["Meher Anand"], mediums: ["Sculpture"], s: -2, e: 30, openDays: TUE_SAT, openFrom: 11, openTo: 19, entry: "Free",
    about: "Cast-concrete vessels sized to hold exactly one day of water for one person in Delhi in May. Visitors can lift the smallest, which weighs 12 kg." },
  { id: "signals", title: "Signals", gallery: "The Annexe", area: "Okhla", artists: ["Rhea Dutta", "Arjun Pillai"], mediums: ["Installation", "Video"], s: 2, e: 45, o: [2, 18, 30], openDays: WED_SUN, openFrom: 12, openTo: 20, entry: "Free",
    about: "A dark room of 40 salvaged radios, each tuned to a frequency once used by All India Radio. A slow video projection maps which of those signals still broadcast." },
  { id: "small-gods", title: "Small Gods", gallery: "Terracotta Hall", area: "Mehrauli", artists: ["Sushil Prajapati"], mediums: ["Sculpture"], s: -30, e: 15, openDays: DAILY, openFrom: 10, openTo: 18, entry: "₹50",
    about: "More than 300 palm-sized terracotta figures fired in a village kiln near Gurugram, shown on low shelves at a child's eye level." },
  { id: "blue-hour", title: "Blue Hour", gallery: "Indigo Wall", area: "Lado Sarai", dLat: -0.0008, dLng: 0.0018, artists: ["Tara Singh", "Devika Nair", "Imran Ali"], mediums: ["Painting"], s: 1, e: 29, o: [1, 18, 0], openDays: TUE_SUN, openFrom: 11, openTo: 19, entry: "Free",
    about: "A group show of three painters who worked only between sunset and dark. Every canvas was finished within the same 40-minute window of light." },
  { id: "paper-cities", title: "Paper Cities", gallery: "Mandi House Arts Centre", area: "Mandi House", artists: ["Nakshe Collective"], mediums: ["Design", "Installation"], s: -8, e: 22, openDays: MON_SAT, openFrom: 10, openTo: 20, entry: "Free",
    about: "Hand-cut paper maps of 12 Delhi neighbourhoods, built by architecture students from surveys with residents. Each map shows what people said they would miss most if it were redeveloped." },
  { id: "archive-of-rain", title: "Archive of Rain", gallery: "Jor Bagh Project Space", area: "Jor Bagh", artists: ["Nandini Kaul"], mediums: ["Photography"], s: -15, e: 2, openDays: TUE_SUN, openFrom: 11, openTo: 19, entry: "Free",
    about: "Cyanotypes made by leaving treated paper under Lodhi Garden trees during the first rains. The prints record where the water fell and where the canopy held it back." },
  { id: "loom-logic", title: "Loom Logic", gallery: "Warp & Weft", area: "Lado Sarai", dLat: -0.0019, dLng: 0.0002, artists: ["Anjali Rawat"], mediums: ["Textile", "Design"], s: -6, e: 35, openDays: TUE_SUN, openFrom: 11, openTo: 19, entry: "Free",
    about: "Jacquard weavings generated from punch cards the artist wrote by hand, hung beside the cards themselves so visitors can read each pattern like code." },
  { id: "afterimage", title: "Afterimage", gallery: "Gallery Seven", area: "Connaught Place", artists: ["Vikram Joshi"], mediums: ["Video"], s: -3, e: 26, openDays: DAILY, openFrom: 11, openTo: 21, entry: "₹150",
    about: "Three-channel video shot in single-screen cinemas across North India in the months before they closed. The light of the projector itself becomes the subject." },
  { id: "earth-notes", title: "Earth Notes", gallery: "Kiln & Canvas", area: "Saket", artists: ["Pooja Mehra"], mediums: ["Painting"], s: -10, e: 50, openDays: TUE_SUN, openFrom: 11, openTo: 19, entry: "Free",
    about: "Paintings made with soil pigments collected from 30 construction sites. Each one is labelled with the site's PIN code and the building that replaced it." }
];

export function sampleData(): AppData {
  const shows: Show[] = RAW.map(r => {
    const a = AREAS[r.area];
    const { s, e, o, dLat, dLng, ...rest } = r;
    return {
      ...rest,
      galleryId: r.gallery.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      lat: a.lat + (dLat ?? 0), lng: a.lng + (dLng ?? 0),
      address: `${r.gallery}, ${r.area}, New Delhi (sample)`,
      instagram: "",
      start: day(s), end: day(e),
      openingAt: o ? at(o[0], o[1], o[2] ?? 0) : "",
      photos: [], photoCredit: ""
    };
  });
  const walks: Walk[] = [
    { id: "lado-sarai", title: "A Saturday in Lado Sarai", titleHi: "लाडो सराय में एक शनिवार", stops: ["monsoon-ledger", "blue-hour", "loom-logic", "earth-notes"] },
    { id: "thread-clay", title: "Thread and Clay", titleHi: "धागा और मिट्टी", stops: ["salt-and-thread", "loom-logic", "small-gods"] },
    { id: "light-water", title: "Light and Water", titleHi: "रोशनी और पानी", stops: ["archive-of-rain", "weight-of-water", "night-shift"] }
  ];
  const today = istToday().getUTCDay();
  const nextSat = ((6 - today + 7) % 7) || 7;
  const events: ArtEvent[] = [
    { id: "e1", type: "Opening night", showId: "blue-hour", walkId: "", startsAt: at(1, 18), note: "" },
    { id: "e2", type: "Opening night", showId: "signals", walkId: "", startsAt: at(2, 18, 30), note: "" },
    { id: "e3", type: "Closing walkthrough", showId: "night-shift", walkId: "", startsAt: at(1, 17), note: "" },
    { id: "e4", type: "Artist talk", showId: "weight-of-water", walkId: "", startsAt: at(2, 18, 30), note: "" },
    { id: "e5", type: "Weaving demo", showId: "salt-and-thread", walkId: "", startsAt: at(3, 11), note: "" },
    { id: "e6", type: "Art Walk meetup", showId: "", walkId: "lado-sarai", startsAt: at(nextSat, 16), note: "Starts at Saffron Room, Lado Sarai" },
    { id: "e7", type: "Workshop", showId: "paper-cities", walkId: "", startsAt: at(5, 11), note: "" },
    { id: "e8", type: "Screening", showId: "afterimage", walkId: "", startsAt: at(6, 19), note: "" }
  ];
  return { shows, walks, events, source: "sample", generatedAt: new Date().toISOString() };
}

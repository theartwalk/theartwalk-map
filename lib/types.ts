/** A single exhibition, already joined with its gallery. Dates are local Delhi dates as YYYY-MM-DD. */
export type Show = {
  id: string;
  galleryId: string;
  gallery: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
  instagram: string;
  title: string;
  artists: string[];
  mediums: string[];
  start: string;
  end: string;
  /** Local date-time "YYYY-MM-DDTHH:mm", or empty when there is no opening night. */
  openingAt: string;
  /** 0 = Sunday … 6 = Saturday */
  openDays: number[];
  /** Hours as decimals, e.g. 11 or 18.5 */
  openFrom: number;
  openTo: number;
  entry: string;
  about: string;
  photos: string[];
  photoCredit: string;
};

export type Walk = {
  id: string;
  title: string;
  titleHi: string;
  stops: string[];
};

export type ArtEvent = {
  id: string;
  type: string;
  showId: string;
  walkId: string;
  /** Local date-time "YYYY-MM-DDTHH:mm" */
  startsAt: string;
  note: string;
};

export type AppData = {
  shows: Show[];
  walks: Walk[];
  events: ArtEvent[];
  source: "sheet" | "sample";
  generatedAt: string;
};

export const MEDIUMS = ["Painting", "Drawing", "Photography", "Sculpture", "Installation", "Textile", "Video", "Print", "Design", "Performance", "Mixed media"] as const;

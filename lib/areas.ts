/** Delhi NCR neighbourhoods with approximate centres and Hindi names. */
export const AREAS: Record<string, { lat: number; lng: number; hi: string }> = {
  "Connaught Place": { lat: 28.6315, lng: 77.2167, hi: "कनॉट प्लेस" },
  "Mandi House": { lat: 28.6260, lng: 77.2340, hi: "मंडी हाउस" },
  "Jor Bagh": { lat: 28.5880, lng: 77.2170, hi: "जोर बाग" },
  "Lodhi Road": { lat: 28.5905, lng: 77.2250, hi: "लोधी रोड" },
  "Defence Colony": { lat: 28.5740, lng: 77.2320, hi: "डिफ़ेंस कॉलोनी" },
  "Hauz Khas Village": { lat: 28.5535, lng: 77.1940, hi: "हौज़ ख़ास विलेज" },
  "Shahpur Jat": { lat: 28.5480, lng: 77.2140, hi: "शाहपुर जाट" },
  "Okhla": { lat: 28.5480, lng: 77.2700, hi: "ओखला" },
  "Saket": { lat: 28.5245, lng: 77.2066, hi: "साकेत" },
  "Lado Sarai": { lat: 28.5235, lng: 77.1946, hi: "लाडो सराय" },
  "Mehrauli": { lat: 28.5180, lng: 77.1840, hi: "महरौली" },
  "New Friends Colony": { lat: 28.5672, lng: 77.2700, hi: "न्यू फ़्रेंड्स कॉलोनी" },
  "Chhatarpur": { lat: 28.4960, lng: 77.1830, hi: "छतरपुर" },
  "Gurugram": { lat: 28.4595, lng: 77.0266, hi: "गुरुग्राम" },
  "Noida": { lat: 28.5355, lng: 77.3910, hi: "नोएडा" }
};

/** Sample location used until the visitor shares theirs: Green Park. */
export const DEFAULT_LOCATION = { lat: 28.5594, lng: 77.2066 };
export const DELHI_CENTER: [number, number] = [77.2090, 28.5700];

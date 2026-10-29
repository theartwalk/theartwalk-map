import { AREAS } from "./areas";

export type Lang = "en" | "hi";

const MED_HI: Record<string, string> = { Painting: "चित्रकला", Drawing: "ड्रॉइंग", Photography: "फ़ोटोग्राफ़ी", Sculpture: "मूर्तिकला", Installation: "इंस्टॉलेशन", Textile: "वस्त्र कला", Video: "वीडियो", Print: "प्रिंट", Design: "डिज़ाइन", Performance: "परफ़ॉर्मेंस", "Mixed media": "मिश्रित माध्यम" };
const EVT_HI: Record<string, string> = { "Opening night": "ओपनिंग नाइट", "Closing walkthrough": "क्लोज़िंग वॉकथ्रू", "Artist talk": "कलाकार से बातचीत", "Weaving demo": "बुनाई का प्रदर्शन", "Art Walk meetup": "Art Walk मिलन", "Workshop": "वर्कशॉप", "Screening": "स्क्रीनिंग" };
export const medium = (m: string, l: Lang) => (l === "hi" ? MED_HI[m] || m : m);
export const eventType = (t: string, l: Lang) => (l === "hi" ? EVT_HI[t] || t : t);
export const areaName = (a: string, l: Lang) => (l === "hi" ? AREAS[a]?.hi || a : a);
export const locale = (l: Lang) => (l === "hi" ? "hi-IN" : "en-IN");

const en = {
  map: "Map", feed: "Feed", events: "Openings", saved: "Saved", openNow: "Open now", all: "All",
  search: "Search", searchPh: "Shows, galleries, artists, areas", cancel: "Cancel", nearby: "Also nearby", save: "Save", markVisited: "Mark visited", visited: "Visited",
  directions: "Directions", share: "Share on WhatsApp", dates: "Dates", opening: "Opening", hours: "Hours", entry: "Entry", where: "Where", away: "away",
  shows: (n: number) => `${n} ${n === 1 ? "show" : "shows"}`, sample: "sample data", more: (n: number) => `+${n} more`, endingSoon: "Ending soon", openingTag: "Opening soon",
  walk: "Walk", walkKicker: "Gallery walk · The Art Walk", startWalk: "Start in Google Maps", closeWalk: "Close walk", autoNote: "Includes a short auto ride",
  leg: (m: number, auto: boolean) => (auto ? `${m} min by auto` : `${m} min walk`), walkMeta: (n: number, t: string, k: string) => `${n} shows · ${t} · ${k} km`,
  hm: (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}` : `${m} min`),
  until: (d: string) => `until ${d}`, wantToSee: "Want to see", diary: "Diary",
  emptySavedH: "Nothing saved yet", emptySaved: "Tap the bookmark on any show to keep it here for your next gallery walk.",
  emptyDiaryH: "Your diary is empty", emptyDiary: "Open a show and tap Mark visited after you've been. Each visit is kept here with its date.",
  seen: (n: number) => `${n} ${n === 1 ? "show" : "shows"} seen`, visitedOn: (d: string) => `Visited ${d}`,
  deviceNote: "Saved shows and your diary stay on this device only.",
  eventsTitle: "Openings", eventsSub: "Opening nights, talks and walks in Delhi over the next seven days.", eventsNote: "New events are added every Monday.", eventsEmpty: "No events listed for the next seven days yet.",
  today: "Today", tomorrow: "Tomorrow",
  feedEnd: "That's every show", feedEndSub: "Change the filters to see more.", feedNone: "No shows match these filters right now.",
  noResults: "Nothing matches that yet. Try a gallery, artist or area.", hShows: "Shows", hGalleries: "Galleries", hArtists: "Artists", hAreas: "Areas",
  tSaved: "Saved for later", tUnsaved: "Removed from Saved", tVisited: "Added to your diary", tUnvisited: "Removed from your diary",
  city: "Delhi only for now. Mumbai, Bengaluru and Kochi come next.", locating: "Finding you…", locateFail: "Couldn't get your location, so distances use Green Park.",
  contentNote: "Show details are in English for now.",
  sOpen: (t: string) => `Open now · until ${t}`, sClosingIn: (n: number) => `Closing in ${n} days`, sClosesTomorrow: "Closes tomorrow", sLastDay: "Last day today",
  sOpening: (r: string, t: string) => `Opening night ${r}, ${t}`, sOpens: (d: string) => `Opens ${d}`, sClosedOpens: (w: string) => `Closed now · opens ${w}`, sClosed: "Closed now",
  relToday: "today", relTomorrow: "tomorrow",
  sampleNote: "Sample data. Galleries, shows and artists here are invented.",
  profile: "Profile", namePh: "Add your name", stSaved: "Saved", stVisited: "Visited", stAreas: "Areas",
  taste: "Taste snapshot", tasteEmpty: "Save or visit a few shows and your taste will show up here. Nothing is locked.",
  favAreas: "Favourite areas", artistsSeen: "Artists you've seen", recent: "Recently visited", nVisits: (n: number) => `${n} ${n === 1 ? "show" : "shows"}`,
  shareH: "Share your Art Walk", shareBtn: "Send on WhatsApp", shareK: "My Art Walk · Delhi",
  shareBig: (n: number) => (n ? `${n} ${n === 1 ? "show" : "shows"} seen` : "Just getting started"),
  shareSm: (m: string, a: string) => (m ? `Mostly ${m.toLowerCase()}${a ? `, often in ${a}` : ""}` : "Following Delhi's galleries on The Art Walk"),
  shareText: (nm: string, n: number, m: string, a: string, url: string) => `${nm ? nm + " has" : "I've"} seen ${n} ${n === 1 ? "show" : "shows"} on The Art Walk map${m ? `, mostly ${m.toLowerCase()}` : ""}${a ? `, often in ${a}` : ""}. Find Delhi's exhibitions at ${url}`,
  settings: "Settings", language: "Language", theme: "Appearance", themeSys: "System", themeLight: "Light", themeDark: "Dark", cityL: "City",
  ig: "Follow @theartwalk.in", igSub: "Instagram", wa: "Join the WhatsApp community", waSub: "Shows, openings and open calls every week", waSoon: "Invite link coming soon",
  listShow: "List your exhibition", listShowSub: "For galleries and artist-run spaces. Free.",
  clear: "Clear saved shows and diary", clearConfirm: "Tap again to clear everything", cleared: "Saved shows and diary cleared",
  localNote: "Everything here stays on this device. No account, no sign-up.",
  back: "Back", close: "Close", openInMap: "Open on the map", locate: "Show my location", zoomIn: "Zoom in", zoomOut: "Zoom out",
  photoCredit: (c: string) => `Photo: ${c}`
};
type Dict = typeof en;
const hi: Dict = {
  map: "नक्शा", feed: "फ़ीड", events: "आयोजन", saved: "सेव", openNow: "अभी खुला", all: "सभी",
  search: "खोजें", searchPh: "शो, गैलरी, कलाकार, इलाक़े", cancel: "रद्द करें", nearby: "आस-पास और भी", save: "सेव करें", markVisited: "देख लिया", visited: "देखा",
  directions: "रास्ता", share: "WhatsApp पर भेजें", dates: "तारीख़ें", opening: "ओपनिंग", hours: "समय", entry: "प्रवेश", where: "जगह", away: "दूर",
  shows: n => `${n} शो`, sample: "नमूना डेटा", more: n => `+${n} और`, endingSoon: "जल्द ख़त्म", openingTag: "जल्द ओपनिंग",
  walk: "वॉक", walkKicker: "गैलरी वॉक · The Art Walk", startWalk: "Google Maps में शुरू करें", closeWalk: "वॉक बंद करें", autoNote: "बीच में थोड़ी ऑटो सवारी",
  leg: (m, auto) => (auto ? `ऑटो से ${m} मिनट` : `${m} मिनट पैदल`), walkMeta: (n, t, k) => `${n} शो · ${t} · ${k} किमी`,
  hm: m => (m >= 60 ? `${Math.floor(m / 60)} घं ${m % 60} मि` : `${m} मिनट`),
  until: d => `${d} तक`, wantToSee: "देखना है", diary: "डायरी",
  emptySavedH: "अभी कुछ सेव नहीं", emptySaved: "किसी भी शो पर बुकमार्क दबाएँ, वह अगली गैलरी वॉक के लिए यहाँ रहेगा।",
  emptyDiaryH: "डायरी ख़ाली है", emptyDiary: "शो देखने के बाद उसे खोलें और “देख लिया” दबाएँ। हर विज़िट तारीख़ के साथ यहाँ रहेगी।",
  seen: n => `${n} शो देखे`, visitedOn: d => `${d} को देखा`,
  deviceNote: "सेव किए शो और डायरी सिर्फ़ इसी डिवाइस पर रहते हैं।",
  eventsTitle: "आयोजन", eventsSub: "अगले सात दिनों में दिल्ली की ओपनिंग, बातचीत और वॉक।", eventsNote: "हर सोमवार नए आयोजन जोड़े जाते हैं।", eventsEmpty: "अगले सात दिनों के आयोजन अभी नहीं जुड़े।",
  today: "आज", tomorrow: "कल",
  feedEnd: "बस, इतने ही शो", feedEndSub: "और देखने के लिए फ़िल्टर बदलें।", feedNone: "इन फ़िल्टर से अभी कोई शो नहीं मिला।",
  noResults: "अभी कुछ नहीं मिला। गैलरी, कलाकार या इलाक़े का नाम लिखें।", hShows: "शो", hGalleries: "गैलरी", hArtists: "कलाकार", hAreas: "इलाक़े",
  tSaved: "बाद के लिए सेव किया", tUnsaved: "सेव से हटाया", tVisited: "डायरी में जोड़ा", tUnvisited: "डायरी से हटाया",
  city: "अभी सिर्फ़ दिल्ली। मुंबई, बेंगलुरु और कोच्चि जल्द।", locating: "आपकी लोकेशन ढूँढ रहे हैं…", locateFail: "लोकेशन नहीं मिली, दूरी ग्रीन पार्क से है।",
  contentNote: "शो की जानकारी अभी अंग्रेज़ी में है।",
  sOpen: t => `अभी खुला · ${t} तक`, sClosingIn: n => `${n} दिन में बंद`, sClosesTomorrow: "कल बंद होगा", sLastDay: "आज आख़िरी दिन",
  sOpening: (r, t) => `ओपनिंग ${r}, ${t}`, sOpens: d => `${d} से`, sClosedOpens: w => `अभी बंद · ${w} खुलेगा`, sClosed: "अभी बंद",
  relToday: "आज", relTomorrow: "कल",
  sampleNote: "नमूना डेटा। यहाँ की गैलरी, शो और कलाकार काल्पनिक हैं।",
  profile: "प्रोफ़ाइल", namePh: "अपना नाम लिखें", stSaved: "सेव", stVisited: "देखे", stAreas: "इलाक़े",
  taste: "आपकी पसंद", tasteEmpty: "कुछ शो सेव करें या देखें, आपकी पसंद यहाँ दिखेगी। कुछ भी लॉक नहीं है।",
  favAreas: "पसंदीदा इलाक़े", artistsSeen: "जिन कलाकारों को देखा", recent: "हाल में देखे", nVisits: n => `${n} शो`,
  shareH: "अपनी Art Walk भेजें", shareBtn: "WhatsApp पर भेजें", shareK: "मेरी Art Walk · दिल्ली",
  shareBig: n => (n ? `${n} शो देखे` : "अभी शुरुआत"),
  shareSm: (m, a) => (m ? `ज़्यादातर ${m}${a ? `, अक्सर ${a} में` : ""}` : "The Art Walk पर दिल्ली की गैलरी"),
  shareText: (nm, n, m, a, url) => `${nm ? nm + " ने" : "मैंने"} The Art Walk पर ${n} शो देखे${m ? `, ज़्यादातर ${m}` : ""}${a ? `, अक्सर ${a} में` : ""}। दिल्ली की प्रदर्शनियाँ: ${url}`,
  settings: "सेटिंग", language: "भाषा", theme: "दिखावट", themeSys: "सिस्टम", themeLight: "हल्का", themeDark: "गहरा", cityL: "शहर",
  ig: "@theartwalk.in फ़ॉलो करें", igSub: "Instagram", wa: "WhatsApp कम्युनिटी से जुड़ें", waSub: "हर हफ़्ते शो, ओपनिंग और ओपन कॉल", waSoon: "इनवाइट लिंक जल्द आएगा",
  listShow: "अपनी प्रदर्शनी जोड़ें", listShowSub: "गैलरी और कलाकारों के स्पेस के लिए। मुफ़्त।",
  clear: "सेव किए शो और डायरी मिटाएँ", clearConfirm: "सब मिटाने के लिए फिर दबाएँ", cleared: "सेव किए शो और डायरी मिटा दी",
  localNote: "यह सब इसी डिवाइस पर रहता है। न खाता, न साइन-अप।",
  back: "वापस", close: "बंद करें", openInMap: "नक्शे पर खोलें", locate: "मेरी लोकेशन", zoomIn: "ज़ूम इन", zoomOut: "ज़ूम आउट",
  photoCredit: c => `फ़ोटो: ${c}`
};
export const STRINGS: Record<Lang, Dict> = { en, hi };
export type T = Dict;

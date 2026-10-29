# The Art Walk map

A map of Delhi's art exhibitions, with curated gallery walks, this week's openings, a saved list and a visit diary. Built for phones first, in English and Hindi, light and dark.

It runs on built-in sample data until you connect the master Google Sheet. The sample galleries, shows and artists are invented and labelled as sample data in the app.

## What's in it

| Screen | What it does |
| --- | --- |
| Map | Venue tiles that group nearby shows and split apart as you zoom; "Ending soon" and "Opening soon" tags; filters by medium and "Open now" |
| Bottom sheet | The selected show and what's nearby; drag, flick or grab it mid-motion |
| Gallery walks | Curated routes drawn on the map with numbered stops and walking times; opens the route in Google Maps |
| Feed | Full-screen cards, one show per screen |
| Openings | Opening nights, talks and walks over the next seven days |
| Saved | "Want to see" list and a dated visit diary, kept on the device |
| Profile | Taste snapshot from saves and visits, a WhatsApp share card, language and appearance settings. No account, no Premium |
| `/shows/<id>` | A server-rendered page per show, so WhatsApp links get a proper preview |

## Run it on your computer

You need Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local   # optional: add your Sheet ID here
npm run dev
```

Then open http://localhost:3000. Test on your phone by opening your computer's local network address on the same Wi-Fi.

## Connect the Google Sheet

The site reads the master sheet described in the Art Walk Gallery Data Kit. Edits reach the site within about five minutes.

1. Create a Google Sheet with four tabs named exactly **Galleries**, **Exhibitions**, **Walks** and **Events**. Row 1 of each tab holds the column names below.
2. Share it as **Anyone with the link: Viewer**.
3. Copy the Sheet ID (the long string between `/d/` and `/edit` in its URL) into `SHEET_ID` in `.env.local`, or into the hosting settings.

| Tab | Columns |
| --- | --- |
| Galleries | `gallery_id`, `name`, `area`, `address`, `lat`, `lng`, `instagram`, `website`, `default_hours` (e.g. `Tue–Sun 11:00–19:00`) |
| Exhibitions | `show_id`, `gallery_id`, `title`, `artists`, `mediums`, `start_date`, `end_date`, `opening_at`, `open_days`, `open_from`, `open_to`, `entry`, `about`, `photo_1`, `photo_2`, `photo_3`, `photo_credit`, `consent`, `status` |
| Walks | `walk_id`, `title`, `title_hi`, `stops` (show IDs, comma-separated, in order) |
| Events | `event_id`, `type`, `show_id` or `walk_id`, `starts_at` (e.g. `2026-11-07 18:30`), `note` |

Rules the site follows:

- Only exhibitions with `status` = **Live** and `consent` = **Yes** appear.
- Dates are `YYYY-MM-DD`. Times are 24-hour, e.g. `18:30`. `open_days` looks like `Tue,Wed,Thu,Fri,Sat,Sun` or `Daily`.
- `mediums` uses this list: Painting, Drawing, Photography, Sculpture, Installation, Textile, Video, Print, Design, Performance, Mixed media.
- Photos can be Google Drive share links (the file must be shared as "Anyone with the link") or any image URL.
- Once `SHEET_ID` is set, the sample data is never shown, even if the sheet has no live shows yet.

## Put it online with Vercel

1. Push this repository to GitHub.
2. At vercel.com, choose **Add New → Project** and import the repository. The defaults are right for Next.js.
3. Under **Environment Variables**, add the values from `.env.example`.
4. Deploy, then add `theartwalk.in` under **Settings → Domains** and follow the DNS instructions.

## Settings

| Variable | What it does |
| --- | --- |
| `SHEET_ID` | The master Google Sheet. Empty means sample data |
| `NEXT_PUBLIC_SITE_URL` | Public address used in share links |
| `NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL` | Invite link shown in the profile |
| `NEXT_PUBLIC_SUBMIT_WHATSAPP` | Number galleries message to list a show (country code, no +) |
| `NEXT_PUBLIC_MAP_STYLE_LIGHT`, `NEXT_PUBLIC_MAP_STYLE_DARK` | Optional custom map styles. Default: OpenFreeMap Positron and Dark |

## How it's built

- **Next.js 16** (App Router) with **React 19** and TypeScript.
- **MapLibre GL JS 6** with free **OpenFreeMap** tiles: no API key, no usage bill. The map's web worker is copied to `public/maplibre/` before every `dev` and `build` by `scripts/copy-maplibre-worker.mjs`.
- No database yet. Saved shows, the diary, name, language and theme live in the browser's local storage.
- Motion uses small spring helpers in `lib/spring.ts` (damping ratio and response, interruptible, velocity-aware), following Apple's fluid interface guidance. Reduced-motion settings are respected.
- Design tokens (colours, fonts, spacing) are at the top of `app/globals.css`. Change them there.

| Folder | Contents |
| --- | --- |
| `app/` | Routes, global styles, PWA manifest and icon |
| `components/` | Map, sheet, detail, feed, openings, saved, search, profile |
| `lib/` | Sheet loader, status and hours logic, Hindi and English text, springs, stand-in artwork |
| `data/sample.ts` | Invented sample data used without a sheet |

Map data © OpenStreetMap contributors, tiles by OpenFreeMap.

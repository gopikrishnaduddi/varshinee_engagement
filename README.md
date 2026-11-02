# Varshinee & Dheeraj — The Royal Engagement Experience

A cinematic, scroll-driven 3D invitation for the engagement of **Varshinee Duddi & Dheeraj Naidu Amudala** —
Thursday, 26 November 2026 · 10:00 AM – 12:00 PM · RR Mini Convention Centre · Lunch to follow.

Guests arrive at the golden doors of a South Indian temple at sunset. A royal seal sits on the doors; when they
enter, the seal parts, the doors swing open, light pours out and the camera walks through into a garlanded,
lamp-lit courtyard. The invitation unfolds on parchment, and scrolling carries the camera down the pillared aisle,
up to the mandapam canopy, around two floating golden rings, and finally to a twilight view of the illuminated
courtyard as dusk falls.

---

## ⚠️ One step before sharing: add the venue QR code

The family's original QR image was not available while building, so **no QR code is included** (a fabricated one
would be wrong). Save the original image here — exact name and place:

```
public/venue-qr.png
```

That's all. It is shown untouched (no crop, rotation, recolouring or overlay) on a white mat inside the gold frame.
If your file is a `.jpg`, either convert it to PNG or change `venue.qrImage` in `src/data/eventDetails.ts`.
Until the file exists, the venue card shows a polite "use the button below" message and the build prints a warning.

The frame was tested with a stand-in code at 140 px and 600 px source sizes; the rendered page decoded correctly
at 320 px, 390 px and 1440 px screen widths.

---

## Run it locally

Requires Node.js 20.19+ (22 recommended).

```bash
npm install
npm run dev        # http://localhost:5173  (also on your Wi-Fi network, to try it on a phone)
```

Production build and local preview:

```bash
npm run build      # type-checks, then builds to dist/
npm run preview    # http://localhost:4173
```

## Deploy

**Vercel** — import the repository (or run `npx vercel`). Framework: Vite. `vercel.json` already sets the build,
output folder and the calendar file's content type.

**Netlify** — import the repository (or run `npx netlify deploy --prod`). `netlify.toml` already sets
`npm run build` → `dist`.

**Your own domain** — set `VITE_SITE_URL` (see `.env.example`), e.g. `VITE_SITE_URL=https://varshinee-dheeraj.in`.
Both hosts provide their URL automatically, so this is only needed for a custom domain. It makes the WhatsApp
preview image and share links absolute.

## Changing details

Every name, date, time, venue, map link and line of wording lives in **`src/data/eventDetails.ts`**. The page, the
`.ics` calendar file, the share message and the page title all read from it.

## What's inside

| Scene | What happens |
| --- | --- |
| Loading | The V & D seal appears before any JavaScript; a gold line advances only on real milestones (app, fonts, 3D world). On slow connections it gives way to an illustrated gate after ~3 s. |
| 1 · Temple entrance | Procedural gopuram gate, carved golden doors with brass studs, mango-leaf thoranam, marigold & jasmine garlands, kuthuvilakku lamps, petals and gold dust. The HTML seal is projected onto the door emblem every frame. Click, tap, scroll or swipe to enter. |
| 2 · Invitation | Parchment card with drawn gold-foil border; names written in left-to-right, calligraphy swashes drawn stroke by stroke. All text is real, selectable HTML. |
| 3 · Mandapam | Scroll drives the camera down the colonnade; the blessing appears word by word. |
| 4 · Date | Arched plaque; a lotus mandala draws around "26"; clock hands settle at ten with a gold arc to twelve. **Add to Calendar** serves a real `.ics` (Asia/Kolkata, 10:00–12:00), plus a Google Calendar link. |
| 5 · Rings | Two interlocking rings (milgrain edges, engraved line, a set stone) beneath the hanging lamp, circled by a jasmine-and-rose wreath. |
| 6 · Venue | Arched ivory plaque, the QR frame, **Open in Google Maps** (new tab). |
| 7 · Blessings | Twilight courtyard with wall lamps, gopuram lights and corridor lamps; **Get Directions** and **Share Invitation** (native share sheet, otherwise WhatsApp / copy link). |

The sky and lighting move from golden hour to lamp-lit dusk as the story progresses.

### Stack

React 19 · TypeScript · Vite · Three.js · React Three Fiber · Drei · GSAP + ScrollTrigger · Lenis (desktop wheel
only) · Tailwind CSS v4 · Lucide icons · self-hosted fonts (Cormorant Garamond, Cinzel, DM Sans).

### Project structure

```
src/
  App.tsx                    gate lock, entrance timeline, scroll → camera wiring, fallbacks
  data/eventDetails.ts       single source of truth for all event content
  components/
    TempleEntrance.tsx       scene 1 overlay (seal, quote, Enter button, scroll/swipe to enter)
    InvitationReveal.tsx     scene 2 card          CoupleNames.tsx   names + swashes
    MandapamScene.tsx        scene 3               DateReveal.tsx    scene 4 + calendar
    GoldenRings.tsx          scene 5 text          VenueSection.tsx  scene 6
    QRCodeFrame.tsx          untouched QR on a white mat, flourishes outside it
    FinalBlessings.tsx       scene 7               ShareButton.tsx   share sheet / WhatsApp / copy
    SceneFallback.tsx        illustrated, non-WebGL temple (doors still open in CSS 3D)
    Monogram.tsx, Ornaments.tsx, SoundControl.tsx, JourneyNav.tsx, OgCard.tsx
    three/                   the 3D world (lazy-loaded chunk)
      World.tsx              canvas, quality tiers, performance monitor
      CameraRig.tsx          hand-composed landscape & portrait camera poses
      Architecture.tsx       gate, walls, colonnade, mandapam, rajagopuram (merged geometry, instanced pillars)
      TempleDoors.tsx, Garlands.tsx, Lamps.tsx, GoldenRings3D.tsx,
      FloatingPetals.tsx, GoldDust.tsx, Sky.tsx, Lighting.tsx
      geometry.ts, textures.ts, materials.ts, layout.ts
  hooks/useReducedMotion.ts, useResponsive3D.ts
  lib/ics.ts, share.ts, ambience.ts, journey.ts, boot.ts, support.ts
build/vite-plugins.ts        emits the .ics, fills page metadata, warns if the QR image is missing
public/                      favicon, touch icons, og-image.jpg, manifest  (+ venue-qr.png from you)
```

### Mobile, performance & accessibility

- Phones get their own camera framings (portrait poses), a lower pixel-ratio cap, no shadow maps, fewer petals and
  motes; an adaptive monitor lowers resolution further if frames drop. Desktop gets soft sun shadows.
- No downloaded models or textures: all geometry and textures are generated in code, so nothing can go missing.
- The 3D bundle is code-split and starts downloading immediately, in parallel with the page.
- Pillars, garland flowers, studs, diyas and petals are instanced; static architecture is merged into a few draw
  calls; shadows only re-render while the doors move; flame glows are a single point-sprite draw.
- **Reduced motion**: the entrance becomes a gentle fade, the camera holds one calm view, petals stop, and the
  canvas redraws only when needed.
- **No WebGL / lost context / 3D error**: the illustrated temple takes over automatically — the doors still open
  and every detail and button works.
- Semantic headings, visible focus rings, keyboard-reachable controls, screen-reader text for decorative scenes,
  and focus moves to the couple's names after entering.
- Audio is optional and silent by default — an original tanpura-style drone with soft bells synthesised in the
  browser (no audio files), toggled from the top-right button.

### Handy URL switches (for testing)

| Add to the URL | Effect |
| --- | --- |
| `?nowebgl` | Force the illustrated, non-WebGL version |
| `?reducedmotion` | Behave as if the device prefers reduced motion |
| `?tier=low` / `?tier=high` | Force phone / desktop 3D quality |
| `?og` | The 1200×630 social-preview composition (used to make `public/og-image.jpg`) |

To regenerate the preview image after changing details, open `/?og` at a 1200×630 window and save a screenshot as
`public/og-image.jpg`.

### Credits

- Fonts: Cormorant Garamond, Cinzel and DM Sans — SIL Open Font License, bundled via Fontsource.
- Icons: Lucide (ISC).
- All 3D models, textures, ornaments, the monogram and the ambience audio were created procedurally for this project.

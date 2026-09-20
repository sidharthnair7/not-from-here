# Not From Here — Invasive Species Sentinel

An editorial, high-performance web application and field screening sentinel for non-native plant and insect species across Southern Ontario. The model proposes candidates; four deterministic rules decide whether to report, refuse, or flag for expert review.

---

## Overview & Architecture

"Not From Here" is built with an Awwwards/Linear-grade aesthetic, combining raw Canvas 2D graphics, Web Animations API, View Transitions, and progressive enhancement without heavy UI or animation framework dependencies.

### Key Architectural Highlights
- **Deterministic 4-Gate Decision Pipeline**:
  1. *Proposal Agreement*: Dual-model consensus check.
  2. *Ontario Invasive List*: Verification against the Ontario Invasive Species Act schedule.
  3. *Range Check*: Spatiotemporal validation using iNaturalist research-grade records within 50 km.
  4. *Season Check*: Phenology validation matching observation month against historical Ontario records.
- **Dedicated Editorial Landing Page (`/`)**: 10 immersive sections with word-reveal typography, auto-looping interactive gate evaluator, GPU marquee ticker, 400vh pinned story visualizer, bento grid, inline playground, and lazy interactive 3D specimen sphere.
- **Real EXIF Metadata Extraction**: Client-side GPS coordinate and timestamp parsing from uploaded photos using `exifr`.
- **Offline PWA & Versioned Persistence**: Service worker precaching via `vite-plugin-pwa` with schema-validated, versioned `localStorage` (`nfh_store_v1`) that gracefully manages memory and storage quotas.
- **Full Bilingual i18n**: English and French (Ontario common names) with zero layout shift and `<html lang>` synchronization.
- **Strict Performance Budget**: Initial production JS bundle is **115.03 kB gzipped** (well beneath the < 150 kB budget). Total CSS is **8.43 kB gzipped**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Routing | `react-router-dom` v6 (`HashRouter` with View Transitions API) |
| Styling | Pure CSS variables (`src/styles.css`), glassmorphism, responsive grid |
| Visuals & Art | HTML5 Canvas 2D (Procedural specimen art & 3D Fibonacci sphere) |
| State Management | React Context + useReducer with versioned local storage sync |
| Metadata & EXIF | `exifr` |
| PWA & Offline | `vite-plugin-pwa` (Workbox Service Worker) |
| Testing | Vitest 2 + `@testing-library/react` + `@testing-library/jest-dom` + `jsdom` |
| Quality Tools | ESLint (Flat Config) + TypeScript compiler (`tsc`) + Prettier |

---

## Landing Page Structure

1. **Chrome Navigation**:
   - Pinned 2px scroll progress bar with accent glow.
   - Dynamic cursor spotlight (`.spot`) with CSS `--mx` / `--my` variables.
   - Magnetic primary CTA buttons with 6px spring pull.
   - Live/Demo status indicator probing `/api/health`.
   - "Try it" pill button navigating with progressive View Transitions.
   - Bilingual language toggle (EN / FR).
2. **Hero (100svh)**:
   - Editorial headline with word-by-word reveal typography.
   - Ambient radial-masked wireframe 3D sphere background.
   - **HeroGate**: Auto-advancing ~9s interactive demo simulating live 4-stage gate verification with manual pause/resume controls.
3. **Species Ticker**:
   - Hardware-accelerated infinite horizontal marquee displaying 11 Southern Ontario invasive species.
   - Hover and focus pause state with `prefers-reduced-motion` compliance.
4. **400vh Pinned Scroll Story**:
   - Sticky left stage with 4 custom visualizers (Agreement bar, Schedule badge, Radar range ring, Seasonal bar chart) synchronizing with scrolling explanation panels.
5. **Bento Grid**:
   - 12-column responsive layout detailing 6 core sentinel capabilities (Deterministic Rules, EXIF Sync, Zero Latency, Privacy by Design, Regulatory Export, Offline PWA).
6. **Interactive Playground**:
   - Inline mini-checker allowing users to select Ontario species and test gate evaluations on the fly, with deep links (`/check?scn=...`) to the full check suite.
7. **Numbers / Metrics**:
   - Viewport-triggered count-up statistics showcasing Ontario bio-security metrics.
8. **Record Showcase**:
   - Interactive 70vh 3D specimen sphere with specimen tiles and accessible Grid View toggle.
9. **FAQ Accordion**:
   - Accessible native `<details>` and `<summary>` components with custom indicators.
10. **Final CTA & Footer**:
    - High-impact editorial call to action and 3-column footer with regulatory resources (OMNRF, CFIA, EDDMapS Ontario).

---

## Product Upgrades

- **Real EXIF Extraction**: Automatically extracts latitude, longitude, and capture timestamp from user-uploaded JPEG/HEIC photos without server roundtrips.
- **Client-Side Image Rescaling**: Downscales uploaded images to max 1600px prior to processing, preventing browser memory exhaustion.
- **Clipboard Paste Support**: Users can paste photos directly from their clipboard onto the Check page (`Ctrl+V` / `Cmd+V`).
- **Dark SVG Radar Mini-Map**: Dynamic radar reticle indicating 50km and 200km radius rings with sighting blips and distance callouts.
- **Share & Export**: One-click `.txt` report export download, clipboard copy, native Web Share API integration, and clean `@media print` layout.
- **Accessible Grid View**: Grid view toggle on `/record` with keyboard navigation, aria labels, and focus trapping within the specimen inspection drawer.
- **Live Status Badge**: Live periodic probe to `/api/health` with automatic fallback to seeded mock fixtures (`mulberry32` PRNG).

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173`.

### 3. Production Build
```bash
npm run build
```
Generates production artifacts in `dist/` with PWA service worker and manifest.

### 4. Preview Production Build
```bash
npm run preview
```

### 5. Run Test Suite
```bash
npm run test
```
Runs 14 automated unit and integration tests across PRNG determinism, `mkResult` verdict synthesis, date formatting, and React Testing Library check flows.

### 6. Lint & Format
```bash
npm run lint
npm run format
```

---

## Backend API & Proxy Configuration

The Vite dev server is pre-configured to proxy `/api` requests to `http://localhost:8080`:

```ts
// vite.config.ts
export default defineConfig({
  plugins: [react(), VitePWA(...)],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

### API Endpoints

#### 1. Health Probe (`GET /api/health`)
- **Response**: `200 OK`
```json
{ "status": "ok", "version": "1.0.0" }
```
When reachable, the UI displays `LIVE SENTINEL` in emerald green. When unreachable, it gracefully displays `DEMO SENTINEL` and uses deterministic simulation.

#### 2. Sighting Check (`POST /api/check`)
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Payload**:
  - `photo`: File
  - `lat`: number
  - `lng`: number
  - `date`: string (ISO 8601)
- **Response**: `CheckResult` JSON structure containing verdict, rule, reason, proposals, 4-step trace, nearest records, seasonality histogram, and escalation report text.

---

## Tests and budgets

- `npx vitest run`: 18 tests in 5 suites (format, rng, mkResult, the check flow, the archive flow).
- `npx tsc --noEmit`: clean.
- Production bundle, measured with `vite build` on Sep 19, 2026: about 115 kB of gzipped JS and about 8 kB of gzipped CSS.
- Reduced motion is respected through the `prefers-reduced-motion` media query; the sphere pauses when its tab is hidden.
- No Lighthouse or accessibility audit has been run yet; nothing here claims one.

---

## License

MIT License. Designed for Southern Ontario conservation, bio-security surveillance, and community field science.

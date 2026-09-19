# Changelog

All notable changes to the "Not From Here" application are documented in this file.

## [2.0.0] - 2026-09-19

### Added
- **Dedicated Editorial Landing Page (`/`)**:
  - Pinned 2px scroll progress bar with accent lighting.
  - Interactive cursor spotlight effect (`.spot`) driving `--mx` and `--my` CSS custom properties.
  - Magnetic primary CTA buttons with 6px pull and spring release physics.
  - Live vs Demo API status badge with real-time `/api/health` polling.
  - "Try it" pill button in navigation using progressive View Transitions API.
  - 100svh Hero with word-by-word reveal typography and radial-masked ambient 3D sphere.
  - **HeroGate**: Auto-looping ~9s interactive demo simulating live 4-stage gate verification with manual pause/resume controls.
  - **Species Ticker**: Infinite GPU-accelerated horizontal marquee featuring 11 Ontario invasive species, pausing on hover/focus.
  - **400vh Pinned Story**: Sticky visualizer stage with 4 custom interactive visualizers (Consensus agreement, Schedule status, 50km Radar range ring, Seasonal bar chart) synchronizing with scrolling explanation cards.
  - **Bento Grid**: 12-column responsive layout detailing 6 key engineering features.
  - **Interactive Playground**: Inline mini-checker for instant gate evaluation with deep links (`/check?scn=...`) to the full check suite.
  - **Numbers / Metrics**: Viewport-triggered count-up statistics.
  - **Record Showcase**: Lazy-loaded 70vh 3D specimen sphere with specimen tiles and accessible Grid View toggle.
  - **FAQ Accordion**: Accessible native `<details>`/`<summary>` accordion.
  - **Final CTA & 3-Column Footer**: Direct escalation links to OMNRF, CFIA, and EDDMapS Ontario with bilingual language selector.

- **Product Upgrades & Field Enhancements**:
  - **EXIF Extraction (`exifr`)**: Client-side parsing of GPS latitude, longitude, and capture date from uploaded photos without server transmission.
  - **Versioned Persistence (`nfh_store_v1`)**: Schema-validated `localStorage` synchronization that safely strips canvas pixel buffers and protects against quota overflow.
  - **Clipboard Paste**: Listen for image paste events directly on the Check page (`Ctrl+V` / `Cmd+V`).
  - **Client-Side Image Downscaling**: Images larger than 1600px are downscaled prior to processing to preserve browser memory.
  - **Dark SVG Radar Mini-Map**: Interactive radar reticle indicating 50km and 200km radius rings with sighting blips and distance callouts.
  - **Export & Sharing**: One-click `.txt` report export download, clipboard copy, native Web Share API integration, and clean `@media print` stylesheet.
  - **Accessible Grid View**: Grid view toggle on `/record` with keyboard navigation, ARIA attributes, and focus trapping within the specimen drawer.
  - **Deep-Linking**: Support for `?scn=<species_key>` URL query parameter on `/check`.

- **Internationalization (i18n)**:
  - Full English and French support with authentic Ontario French common species names.
  - Reactive language context with `<html lang>` attribute synchronization.
  - Persistent language preference.

- **Offline PWA & SEO**:
  - Workbox Service Worker integration via `vite-plugin-pwa`.
  - SVG Favicon and 1200x630 OpenGraph social card.
  - `robots.txt` and `sitemap.xml`.
  - Font preloading and `font-display: swap` for zero layout shift.

- **Automated Testing & CI/CD**:
  - Vitest test suite with 14 unit and integration tests covering PRNG determinism, `mkResult` synthesis across all 6 verdicts, date formatting, and React Testing Library check flow.
  - Flat ESLint configuration with `typescript-eslint`.
  - GitHub Actions CI workflow (`.github/workflows/ci.yml`).

### Optimized
- Canvas render loops automatically pause when elements are scrolled out of view (`IntersectionObserver`) or when the browser tab is hidden (`visibilitychange`), eliminating idle CPU consumption.
- Production bundle size optimized to **115.03 kB gzipped JS** and **8.43 kB gzipped CSS**, beating the 150 kB budget.

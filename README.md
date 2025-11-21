# Scroll Tracker Browser

<p align="left">
  <img src="./assets/icon.png" alt="Logo" width="100"/>
</p>

Version: 0.0.5

A minimal, demo-ready iOS browser (Expo + React Native) that measures how people really browse—recording distance scrolled, active vs passive time, and per-domain sessions in real time.

> Status: ✅ Feature-complete for logging + analytics demos. All metrics stream to the console instantly, making it perfect for live walkthroughs or investor previews.

## Highlights

- **Full-screen WebView** instrumented with a custom JavaScript bridge—no distracting chrome.
- **Distance, time, and session tracking** with centimeter, meter, inch, foot, and screen-height readouts.
- **Domain intelligence** that starts/ends sessions automatically when URLs change (including SPA detection).
- **Device-aware calculations** using a curated PPI table for 25+ iPhone models (configurable fallback).
- **Zero-config logging** so you can narrate impact in real time from the Metro / RN debugger console.

## Stack & Layout

- Expo SDK 54, React Native 0.81, TypeScript 5.9, `react-native-webview`.
- Core files live at repo root (this directory). No nested workspace required.

```
scroll-tracker-browser/
├── App.tsx                  # Entry + provider wiring
├── assets/                  # App icon + splash artwork
├── src/
│   ├── components/          # Browser chrome, stats views, device selector, etc.
│   ├── trackers/            # ScrollTracker, TimeTracker, DomainSessionManager
│   ├── storage/             # AsyncStorage helpers (session snapshots/export)
│   ├── utils/               # DeviceConfig + shared helpers
│   └── types/               # Tracking/event interfaces
├── QUICKSTART.md            # 5-minute setup
├── TESTING_GUIDE.md         # Scenario-based validation
├── IMPLEMENTATION_SUMMARY.md # Deep dive + status log
└── PUBLISH_GUIDE.md         # TestFlight walkthrough
```

## Getting Started

### Prerequisites

- Node.js 20+
- Xcode 14+ with an iOS simulator (or a physical iPhone with Expo Go)
- Expo CLI (`npm install -g expo-cli`, optional but convenient)

### Install & run

```bash
git clone <repo-url> scroll-tracker-browser
cd scroll-tracker-browser
npm install
npm start        # or npm run ios / npm run android (android untested)
```

When Metro starts, press `i` for the iOS simulator or scan the QR code in Expo Go to run on device.

## Running a Live Demo

1. **Start Metro** with `npm start` and press `i`.
2. **Confirm Google loads** (default `initialUrl`).
3. **Scroll naturally** on a long feed like YouTube or Reddit.
4. **Narrate the console logs** (Metro terminal or RN debugger). Highlight scroll distance, time splits, and session events.
5. **Navigate to a second domain** (e.g., tap a YouTube link) to show session boundaries.
6. **Call out accuracy** by mentioning the PPI lookup and physical units.

### Suggested talking points

- Distance increases in centimeters/meters every flick.
- Active time rises while scrolling; passive time fills in when reading.
- Session end/start logs prove domain detection works, even inside SPAs.

### Sample console output

```
[DeviceConfig] Using default device configuration
[SESSION] Started new session for: google.com
[SCROLL] Domain: google.com, Distance: 15.2cm (0.152m), 0.5ft (6.0in), Screen Heights: 2.3
[TIME] Active: 3s, Passive: 12s, Total: 15s
[SESSION] Domain changed: google.com -> youtube.com
[SESSION] Ended session for: google.com, Duration: 15.4s, Scroll: 15.2cm
```

## Observability Cheat Sheet

- Logs appear in the Metro terminal, Chrome DevTools (Cmd+Ctrl+Z → “Debug”), and Xcode device logs.
- Key tags:
  - `[SCROLL]` aggregate distance (cm/m/in/ft/screen heights).
  - `[TIME]` active vs passive vs total seconds.
  - `[SESSION]` lifecycle events with duration + totals.
  - `[WebView]` instrumentation lifecycle (script injected, page loaded, etc.).

## Configuration & Tuning

| What | Where | Notes |
|------|-------|-------|
| Initial URL | `App.tsx` (`<BrowserView initialUrl="https://www.youtube.com" />`) | Change default landing page. |
| Device PPI | `src/utils/DeviceConfig.ts` | Choose a preset or set a custom fallback. |
| Scroll sensitivity | `src/trackers/TimeTracker.ts` (`MIN_DELTA`, `SCROLL_TIMEOUT`) | Lower delta = more sensitive “active” time. |
| Scroll debounce | `BrowserView.tsx` injected JS (`debounce(handleScroll, 50)`) | Increase to reduce log volume. |

## Testing & Validation

- Run through the curated scenarios in `TESTING_GUIDE.md` to validate browser loading, distance accuracy, time tracking, domain transitions, and SPA resilience.
- For a rapid check, see `QUICKSTART.md` (setup) followed by:
  - **Scroll Distance Test:** Scroll 2+ screen heights; verify `[SCROLL]` increments realistically.
  - **Active vs Passive:** Scroll for 5s, pause 10s, scroll 3s; confirm `[TIME]` splits.
  - **Session Swap:** Move from Google to YouTube; ensure handoff logs fire.

## Troubleshooting

- **WebView blank:** Confirm Xcode 14+ installed, `NSAllowsArbitraryLoads` true (already configured in `app.json`).
- **No scroll logs:** Use a long feed, ensure delta > 2px, or reduce `MIN_DELTA`.
- **Metrics look off:** Double-check PPI selection and simulator model.
- **Stale JS after navigation:** Reload with `Cmd+R`; injected script runs per page load and on SPA route polling.
- **Build cache issues:** `npx expo start -c` then restart Metro.

## Additional Docs & Next Steps

- `IMPLEMENTATION_SUMMARY.md` – detailed architecture notes and status.
- `QUICKSTART.md` – condensed operator checklist.
- `TESTING_GUIDE.md` – full validation suite.
- `PUBLISH_GUIDE.md` – complete TestFlight workflow.
- Future roadmap: data persistence, stats UI, export, device auto-detect, Android support.

## License

MIT License © Matt Zhu

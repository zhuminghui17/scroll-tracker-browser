# Scroll Tracker Browser

A React Native iOS app with an embedded browser that tracks scroll distance, time spent browsing, and domain sessions in real-time.

## Features

- **Full-Screen Browser**: Built with `react-native-webview` for seamless browsing experience
- **Scroll Distance Tracking**: Measures scroll distance in:
  - Centimeters / Meters
  - Inches / Feet
  - Screen heights
- **Time Tracking**: 
  - Active scrolling time (when user is actively scrolling)
  - Passive viewing time (when user is viewing without scrolling)
  - Total session time
- **Domain Session Management**: 
  - Automatically detects domain changes
  - Tracks per-domain metrics
  - Logs session start/end with statistics
- **Device-Specific Accuracy**: Uses device PPI for accurate distance calculations
- **Real-Time Logging**: All tracking metrics logged to console for verification

## Project Structure

```
ScrollTrackerBrowser/
├── App.tsx                              # Main app entry point
├── app.json                             # Expo configuration
├── package.json                         # Dependencies
├── tsconfig.json                        # TypeScript config
└── src/
    ├── components/
    │   └── BrowserView.tsx             # WebView with tracking integration
    ├── trackers/
    │   ├── ScrollTracker.ts            # Scroll distance calculations
    │   ├── TimeTracker.ts              # Active/passive time tracking
    │   └── DomainSessionManager.ts     # Domain session management
    ├── utils/
    │   └── DeviceConfig.ts             # iPhone PPI lookup table
    └── types/
        └── tracking.ts                 # TypeScript interfaces
```

## Architecture

### 3-Layer Architecture

**Layer 1: Browser UI (BrowserView.tsx)**
- Full-screen WebView component
- JavaScript injection for event capture
- Message handling between WebView and React Native

**Layer 2: Tracking Logic (src/trackers/)**
- `ScrollTracker`: Converts scroll deltas to physical distances using device PPI
- `TimeTracker`: Detects active scrolling vs passive viewing time
- `DomainSessionManager`: Manages sessions per domain, aggregates metrics

**Layer 3: Configuration & Types**
- `DeviceConfig`: PPI lookup for 25+ iPhone models
- `tracking.ts`: TypeScript interfaces for type safety

### Data Flow

```
WebView (JavaScript Events)
    ↓
postMessage (JSON)
    ↓
BrowserView.handleMessage()
    ↓
DomainSessionManager
    ↓
ScrollTracker + TimeTracker
    ↓
Console Logs (Real-time metrics)
```

## How It Works

### Scroll Tracking

1. JavaScript is injected into each loaded page
2. Scroll events captured with 50ms debouncing
3. Scroll delta (deltaY) sent to React Native
4. ScrollTracker converts points to physical units:
   ```
   distanceCm = scrollPoints / (devicePPI / 2.54)
   ```

### Time Tracking

1. Touch events (`touchstart`, `touchmove`, `touchend`) captured
2. Active scrolling detected when:
   - `deltaY > 2px` within `150ms` window
3. Time calculated as:
   - **Active Time**: Sum of all active scroll bursts
   - **Passive Time**: Total time - Active time

### Domain Session Management

1. URL changes detected via:
   - `onNavigationStateChange` (page navigation)
   - JavaScript polling (SPA route changes)
2. Domain extracted from URL
3. New session started on domain change
4. Previous session ended with final metrics

## Installation & Setup

### Prerequisites

- Node.js 20+ (current: v20.19.3 works despite warnings)
- Xcode 14+ (for iOS development)
- Expo CLI
- iOS Simulator or physical iPhone

### Install Dependencies

```bash
cd ScrollTrackerBrowser
npm install
```

Dependencies installed:
- `expo` - React Native framework
- `react-native-webview` - WebView component
- `react-native` - Core RN library

### Run on iOS Simulator

```bash
npm run ios
```

Or using Expo:

```bash
npx expo start
# Then press 'i' for iOS simulator
```

### Run on Physical iPhone

1. Install Expo Go app on your iPhone
2. Run:
   ```bash
   npx expo start
   ```
3. Scan QR code with your iPhone camera
4. App will open in Expo Go

## Usage

1. **Launch the app**: Opens with Google homepage by default
2. **Browse naturally**: Navigate to any website (e.g., YouTube, Instagram)
3. **Scroll**: Just scroll normally
4. **Check console**: Open React Native debugger to see real-time logs

### Console Output Example

```
[DeviceConfig] Using default device configuration
[SESSION] Started new session for: google.com
[WebView] Tracking script injected
[BrowserView] WebView tracking initialized
[BrowserView] Page loaded: https://www.google.com

[SCROLL] Domain: google.com, Distance: 15.2cm (0.152m), 0.5ft (6.0in), Screen Heights: 2.3
[TIME] Active: 3s, Passive: 12s, Total: 15s

[SESSION] Domain changed: google.com -> youtube.com
[SESSION] Ended session for: google.com, Duration: 15.4s, Scroll: 15.2cm

====== Session Metrics for youtube.com ======
[SCROLL] Domain: youtube.com, Distance: 125.3cm (1.253m), 4.11ft (49.3in), Screen Heights: 18.7
[TIME] Active: 25s, Passive: 45s, Total: 70s
==================================================
```

## Configuration

### Change Initial URL

Edit `App.tsx`:

```typescript
<BrowserView initialUrl="https://www.youtube.com" />
```

### Device PPI Configuration

Current supported devices (in `DeviceConfig.ts`):
- iPhone 15 Pro Max/Pro/Plus/Mini
- iPhone 14 Pro Max/Pro/Plus/Mini
- iPhone 13 Pro Max/Pro/Mini
- iPhone 12 Pro Max/Pro/Mini
- iPhone 11 Pro Max/Pro
- iPhone XS Max/XS/XR/X
- iPhone SE (all generations)

Default: iPhone 14 Pro (460 PPI)

### Adjust Tracking Parameters

In `TimeTracker.ts`:
```typescript
private readonly SCROLL_TIMEOUT = 150; // ms
private readonly MIN_DELTA = 2; // pixels
```

In `BrowserView.tsx` (JavaScript injection):
```javascript
const debouncedScroll = debounce(handleScroll, 50); // ms
```

## Key Algorithms

### Distance Calculation

```typescript
// Convert scroll points to physical distance
const ppi = deviceConfig.getPPI(); // e.g., 460 for iPhone 14 Pro
const inches = scrollPoints / ppi;
const centimeters = inches * 2.54;
const meters = centimeters / 100;
const feet = inches / 12;
```

### Active Scroll Detection

```typescript
// Active if deltaY > 2px within 150ms
if (Math.abs(deltaY) > 2 && timeSinceLastScroll <= 150) {
  activeScrollTime += timeSinceLastScroll;
}
```

### Screen Heights Calculation

```typescript
screenHeights = totalScrollPoints / viewportHeight;
```

## Testing

### Test Scroll Tracking

1. Open the app
2. Navigate to a long page (e.g., Reddit, Twitter)
3. Scroll continuously for 10 seconds
4. Check console for scroll distance logs
5. Verify distance increases

### Test Time Tracking

1. Start scrolling actively
2. Stop and wait 5 seconds (passive time)
3. Scroll again
4. Check console: Active time should be < Total time

### Test Domain Sessions

1. Start on Google
2. Navigate to YouTube
3. Check console for:
   - "Session ended" for Google
   - "Started new session" for YouTube

## Known Limitations

- **No Data Persistence**: Metrics only logged to console (no storage yet)
- **No UI Dashboard**: Focus is on browser functionality and tracking accuracy
- **iOS Only**: Configured for iOS, Android not tested
- **No Device Auto-Detection**: Uses default PPI (can be changed manually)

## Future Enhancements

- Add AsyncStorage for data persistence
- Create stats dashboard (TodayView, HistoryView)
- Add URL bar and navigation controls
- Implement device auto-detection
- Add data export functionality
- Support Android platform

## Troubleshooting

### WebView not loading

- Check network permissions in `app.json`
- Verify `NSAllowsArbitraryLoads` is set to `true`

### JavaScript injection not working

- Check React Native debugger console
- Look for "Tracking script injected" message
- Verify WebView has `javaScriptEnabled={true}`

### No scroll events

- Try scrolling on a long page (not a short page)
- Check debounce delay (50ms)
- Verify scroll events in browser console

### Build errors

- Clear cache: `npx expo start -c`
- Reinstall: `rm -rf node_modules && npm install`
- Check Node version: `node -v` (should be 20+)

## License

MIT License

## Author

Matt Zhu

---

**Note**: This is a development version focused on browser functionality and tracking accuracy. Stats visualization and data persistence will be added in future versions.


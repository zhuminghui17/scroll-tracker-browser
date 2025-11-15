# Quick Start Guide

Get the Scroll Tracker Browser running in 5 minutes!

## Step 1: Navigate to Project

```bash
cd /Users/minghuizhu/Projects/scroll-tracker-browser/ScrollTrackerBrowser
```

## Step 2: Install Dependencies (Already Done)

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

## Step 3: Start the Development Server

```bash
npm start
```

Or using Expo CLI directly:

```bash
npx expo start
```

## Step 4: Open in iOS Simulator

After the server starts, press **`i`** in the terminal to open iOS Simulator.

Alternatively:

```bash
npm run ios
```

## Step 5: Watch the Console Logs

Once the app opens:

1. Navigate to any website in the browser
2. Scroll up and down
3. Watch the terminal/console for tracking logs like:

```
[SESSION] Started new session for: google.com
[SCROLL] Domain: google.com, Distance: 15.2cm (0.152m), Screen Heights: 2.3
[TIME] Active: 3s, Passive: 12s, Total: 15s
```

## Testing Different Websites

The app opens to Google by default. Try these sites for good scrolling tests:

- **YouTube**: `https://youtube.com` - Long feeds
- **Reddit**: `https://reddit.com` - Infinite scroll
- **Instagram**: `https://instagram.com` - Stories and feeds
- **Twitter/X**: `https://twitter.com` - Timeline

## Viewing Logs in React Native Debugger

1. Shake the device (iOS Simulator: Cmd+Ctrl+Z)
2. Tap "Debug" to open Chrome DevTools
3. Check Console tab for detailed logs

Or use Metro bundler logs in the terminal.

## Key Console Messages

| Message | Meaning |
|---------|---------|
| `[DeviceConfig] Using default device configuration` | Device PPI loaded |
| `[SESSION] Started new session for: domain.com` | New browsing session started |
| `[WebView] Tracking script injected` | JavaScript tracking initialized |
| `[SCROLL] Domain: ..., Distance: ...` | Scroll metrics updated |
| `[TIME] Active: ..., Passive: ...` | Time tracking updated |
| `[SESSION] Domain changed: A -> B` | User navigated to new domain |

## Troubleshooting

### "Unable to resolve module"

```bash
npm install
npx expo start -c
```

### "WebView not loading"

Check `app.json` has proper network permissions (already configured).

### "No logs appearing"

1. Make sure you're scrolling on a page (not just viewing)
2. Check terminal for errors
3. Try reloading: Cmd+R in simulator

## What's Tracked

✅ **Scroll Distance**: cm, meters, feet, inches, screen heights  
✅ **Active Scroll Time**: Time spent actively scrolling  
✅ **Passive View Time**: Time spent viewing without scrolling  
✅ **Domain Sessions**: Separate tracking per website  
✅ **Session Duration**: Total time per domain  

## Configuration

### Change Starting URL

Edit `App.tsx` line 9:

```typescript
<BrowserView initialUrl="https://www.youtube.com" />
```

### Adjust Scroll Sensitivity

Edit `src/trackers/TimeTracker.ts`:

```typescript
private readonly MIN_DELTA = 2; // pixels (lower = more sensitive)
```

## File Structure

```
ScrollTrackerBrowser/
├── App.tsx                    # Entry point - change initialUrl here
├── src/
│   ├── components/
│   │   └── BrowserView.tsx    # Main browser component
│   ├── trackers/              # All tracking logic
│   └── utils/                 # Device config & helpers
└── README.md                  # Full documentation
```

## Next Steps

- ✅ Browser works and loads pages
- ✅ Scroll tracking logs to console
- ✅ Time tracking active vs passive
- ✅ Domain sessions tracked
- 🔜 Build stats UI (coming soon)
- 🔜 Add data persistence (coming soon)

## Publishing to TestFlight

Ready to share your app with testers? Check out the complete guide:

📱 **[PUBLISH_GUIDE.md](./PUBLISH_GUIDE.md)** - Complete TestFlight publishing guide (Chinese)

The guide covers:
- Apple Developer account setup
- EAS Build configuration
- Submitting to App Store Connect
- Managing internal testers
- Publishing updates

## Need Help?

Check `README.md` for full documentation, architecture details, and troubleshooting.

---

**Happy Scrolling! 📱📊**


# Testing Guide

How to verify that scroll tracking is working correctly.

## Prerequisites

App must be running:
```bash
cd /Users/minghuizhu/Projects/scroll-tracker-browser/ScrollTrackerBrowser
npm start
# Press 'i' for iOS simulator
```

## Test 1: Basic Browser Functionality ✅

**Objective**: Verify WebView loads and navigates

**Steps**:
1. App opens showing Google homepage
2. Wait for page to load completely
3. Tap on search box and search for "react native"
4. Click on a search result
5. Page should navigate and load new content

**Expected Console Output**:
```
[SESSION] Started new session for: google.com
[WebView] Tracking script injected
[BrowserView] Page loaded: https://www.google.com
```

**Pass Criteria**: 
- ✅ Page loads and displays correctly
- ✅ Can interact with page elements
- ✅ Navigation works

## Test 2: Scroll Distance Tracking ✅

**Objective**: Verify scroll distance calculation

**Steps**:
1. Navigate to a long page (e.g., YouTube homepage)
2. Slowly scroll down about 1 screen height
3. Wait 1 second
4. Scroll down another screen height
5. Check console for scroll metrics

**Expected Console Output**:
```
[SCROLL] Domain: youtube.com, Distance: 45.2cm (0.452m), 1.48ft (17.8in), Screen Heights: 2.1
[SCROLL] Domain: youtube.com, Distance: 92.5cm (0.925m), 3.03ft (36.4in), Screen Heights: 4.2
```

**Pass Criteria**:
- ✅ Distance increases with each scroll
- ✅ Screen heights roughly match visual estimate (2 scrolls ≈ 2-4 screen heights)
- ✅ Distance values are reasonable (not 0 or extremely large)

**Troubleshooting**:
- If no logs appear: Try scrolling more aggressively
- If distance is 0: Check that deltaY > 2px (minimum threshold)
- If distance is too large: Verify device PPI is correct

## Test 3: Active vs Passive Time Tracking ✅

**Objective**: Verify time tracking differentiates active scrolling from passive viewing

**Steps**:
1. Navigate to YouTube
2. Scroll continuously for 5 seconds (without stopping)
3. Stop scrolling and wait 10 seconds (just view)
4. Scroll again for 3 seconds
5. Check console for time metrics

**Expected Console Output**:
```
[TimeTracker] Active scrolling started
[TIME] Active: 5s, Passive: 2s, Total: 7s
[TimeTracker] Active scrolling ended
[TIME] Active: 5s, Passive: 12s, Total: 17s
[TimeTracker] Active scrolling started
[TIME] Active: 8s, Passive: 12s, Total: 20s
```

**Pass Criteria**:
- ✅ Active time increases only when scrolling
- ✅ Passive time increases when not scrolling
- ✅ Total time = Active + Passive (approximately)
- ✅ Active time should be much less than passive time for normal browsing

**Math Check**:
```
Expected after above steps:
- Active: ~8 seconds (5s + 3s of scrolling)
- Passive: ~10 seconds (waiting time)
- Total: ~18 seconds
```

## Test 4: Domain Session Management ✅

**Objective**: Verify sessions start/end on domain changes

**Steps**:
1. Start on Google (default)
2. Scroll a few times (observe metrics)
3. Navigate to YouTube (search "youtube" and click)
4. Wait for page load
5. Check console for session change

**Expected Console Output**:
```
[SESSION] Started new session for: google.com
[SCROLL] Domain: google.com, Distance: 25.3cm, Screen Heights: 1.2

[SESSION] Domain changed: google.com -> youtube.com
[SESSION] Ended session for: google.com, Duration: 8.5s, Scroll: 25.3cm
[SESSION] Started new session for: youtube.com
```

**Pass Criteria**:
- ✅ New session starts for Google on app launch
- ✅ Session ends when navigating to YouTube
- ✅ Final metrics shown for Google session
- ✅ New session starts for YouTube
- ✅ Metrics reset to 0 for new session

## Test 5: Touch Event Integration ✅

**Objective**: Verify touch events contribute to time tracking

**Steps**:
1. Navigate to any page
2. Touch and hold (don't scroll)
3. Drag finger to scroll slowly
4. Release finger
5. Observe time tracking logs

**Expected Console Output**:
```
(Touch events processed internally)
[TIME] Active: 2s, Passive: 1s, Total: 3s
```

**Pass Criteria**:
- ✅ Touch start/move/end events captured
- ✅ Time increases during touch interaction
- ✅ No errors in console

## Test 6: JavaScript Injection Persistence ✅

**Objective**: Verify tracking works across page navigations

**Steps**:
1. Start on Google
2. Scroll and verify tracking works
3. Navigate to YouTube
4. Scroll and verify tracking still works
5. Navigate to Reddit
6. Scroll and verify tracking still works

**Expected Behavior**:
- ✅ Tracking script re-injected on each navigation
- ✅ "Tracking script injected" message for each page
- ✅ Scroll events captured on all pages
- ✅ Metrics tracked per domain

## Test 7: Real-World Usage Simulation ✅

**Objective**: Simulate typical browsing behavior

**Steps**:
1. Open app (Google)
2. Search for "react native tutorials"
3. Scroll through search results (10 seconds)
4. Click on first result
5. Read article while scrolling (30 seconds)
6. Navigate to another link
7. Scroll some more (20 seconds)

**Expected Console Output** (approximate):
```
[SESSION] Started: google.com
[SCROLL] google.com: Distance: 50cm, Screen Heights: 2.5
[SESSION] Domain changed: google.com -> reactnative.dev
[SESSION] Ended: google.com, Duration: 15s, Scroll: 50cm
[SCROLL] reactnative.dev: Distance: 150cm, Screen Heights: 7.2
[TIME] Active: 25s, Passive: 35s, Total: 60s
```

**Pass Criteria**:
- ✅ Multiple domain sessions tracked
- ✅ Realistic scroll distances
- ✅ Active time < 50% of total (realistic for reading)
- ✅ No crashes or errors

## Test 8: Edge Cases ✅

### Test 8a: Very Fast Scrolling

**Steps**: Rapidly flick-scroll multiple times

**Expected**: 
- Distance increases
- Active time increases
- No crashes

### Test 8b: No Scrolling

**Steps**: Just view a page for 30 seconds without scrolling

**Expected**:
```
[TIME] Active: 0s, Passive: 30s, Total: 30s
[SCROLL] Distance: 0cm, Screen Heights: 0
```

### Test 8c: Very Slow Scrolling

**Steps**: Scroll extremely slowly (1 pixel per second)

**Expected**:
- May not register as active scroll (deltaY < 2px)
- Should still update scroll position
- Passive time dominates

### Test 8d: Single Page App (SPA)

**Steps**: Navigate within a SPA like Twitter/X

**Expected**:
- URL change detection via polling
- Same domain, so no session change
- Continuous tracking

## Metrics Validation

### Distance Sanity Check

For iPhone 14 Pro (460 PPI):
- 1 screen = ~2796 pixels = ~15.4 cm
- 10 screens = ~154 cm = 1.54 m
- 100 screens = ~15.4 m

**If your metrics are way off**:
- Check device PPI in DeviceConfig.ts
- Verify scroll deltaY values in logs
- Ensure viewport height is correct

### Time Sanity Check

For 60 seconds of browsing:
- Heavy scrolling: Active ~30s, Passive ~30s
- Reading: Active ~10s, Passive ~50s
- Just viewing: Active ~0s, Passive ~60s

## Performance Benchmarks

### Expected Performance

- **Event Processing**: < 1ms per event
- **Console Log Rate**: 1-2 logs per second during scrolling
- **Memory**: < 50MB increase during session
- **CPU**: < 5% during active scrolling
- **Battery**: Minimal impact (similar to Safari)

### Performance Issues

**If app lags**:
- Increase debounce delay (currently 50ms)
- Reduce console logging frequency
- Check for memory leaks in DevTools

## Debugging Tools

### Metro Bundler Console

Primary source of logs. Shows:
- All console.log messages
- JavaScript errors
- Network requests

### React Native Debugger

1. Open iOS Simulator
2. Press `Cmd+Ctrl+Z`
3. Tap "Debug"
4. Chrome DevTools opens
5. Check Console tab

### Xcode Console

For native iOS logs:
1. Open Xcode
2. Window → Devices and Simulators
3. Select your simulator
4. View device logs

## Common Issues

| Issue | Solution |
|-------|----------|
| No scroll events | Ensure page has scrollable content |
| Distance always 0 | Check device PPI configuration |
| Active time always 0 | Verify touch events are captured |
| Session not ending | Check domain extraction logic |
| JavaScript errors | Check injected script syntax |

## Success Criteria Summary

✅ **Browser**: Loads pages, navigates, displays content  
✅ **Scroll Tracking**: Distance increases, units correct  
✅ **Time Tracking**: Active vs passive differentiated  
✅ **Sessions**: Start/end on domain changes  
✅ **Logging**: Clear, comprehensive console output  
✅ **Performance**: Smooth, no lag or crashes  

## Next Steps After Testing

Once all tests pass:

1. ✅ Browser confirmed working
2. ✅ Tracking confirmed accurate
3. 🔜 Build stats UI
4. 🔜 Add data persistence
5. 🔜 Prepare for TestFlight

---

**Happy Testing!** 🧪

If you encounter any issues, check `README.md` for troubleshooting or `IMPLEMENTATION_SUMMARY.md` for technical details.


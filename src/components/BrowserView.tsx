// BrowserView: Full-screen WebView with scroll tracking

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import DomainStatsTracker from '../trackers/DomainStatsTracker';
import NewTabPage from './NewTabPage';
import { Bookmark } from '../types/browser';
import { getGatewayUrlSync, SCROLL_DEBOUNCE_MS } from '../config/gateway';
import { pixelsToCm, pixelsToMeters } from '../utils/formatters';

const BREAK_SCROLL_METERS = 5;

class GatewayReporter {
  private pendingDelta = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private totalDistance = 0;
  private signalCount = 0;
  private scrollTouchCount = 0;
  private startedAt: number | null = null;
  private breakRecommendedEmitted = false;
  onBreakRecommended?: () => void;

  recordTouchMove(): void {
    if (this.startedAt === null) return;
    this.scrollTouchCount += 1;
  }

  queue(deltaY: number): void {
    // Per-event |deltaY| matches ScrollTracker / Scroll Stats (signed batch in flush is for the printer only).
    this.totalDistance += Math.abs(deltaY);
    this.pendingDelta += deltaY;
    if (
      !this.breakRecommendedEmitted &&
      this.onBreakRecommended &&
      pixelsToMeters(this.totalDistance) >= BREAK_SCROLL_METERS
    ) {
      this.breakRecommendedEmitted = true;
      this.onBreakRecommended();
    }
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), SCROLL_DEBOUNCE_MS);
    }
  }

  flush(): void {
    this.timer = null;
    const delta = this.pendingDelta;
    this.pendingDelta = 0;
    if (delta === 0) return;

    if (this.startedAt === null) {
      this.startedAt = Date.now();
    }
    this.signalCount += 1;

    const gatewayUrl = getGatewayUrlSync();
    fetch(`${gatewayUrl}/scroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deltaY: delta }),
    }).catch(err => console.warn('[GatewayReporter] send failed:', err));
  }

  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.flush();
  }

  endSession(): Promise<void> {
    this.stop();
    if (this.signalCount === 0 || this.startedAt === null) {
      return Promise.resolve();
    }

    const durationMs = Date.now() - this.startedAt;
    const scrollDepthCm = pixelsToCm(this.totalDistance);
    const accumulatedPx = DomainStatsTracker.getInstance().getTotalDistancePixels();
    const accumulatedDistanceCm = pixelsToCm(accumulatedPx);
    const payload = {
      totalDistance: this.totalDistance,
      signalCount: this.signalCount,
      durationMs,
      scrollDepthCm,
      accumulatedDistanceCm,
      scrollTouchCount: this.scrollTouchCount,
    };

    this.totalDistance = 0;
    this.signalCount = 0;
    this.scrollTouchCount = 0;
    this.startedAt = null;
    this.breakRecommendedEmitted = false;

    const gatewayUrl = getGatewayUrlSync();
    return fetch(`${gatewayUrl}/session/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(() => console.log('[GatewayReporter] session ended'))
      .catch(err => console.warn('[GatewayReporter] end session failed:', err));
  }

  hasActiveSession(): boolean {
    return this.signalCount > 0;
  }

  private static instance: GatewayReporter | null = null;
  static getInstance(): GatewayReporter {
    if (!GatewayReporter.instance) {
      GatewayReporter.instance = new GatewayReporter();
    }
    return GatewayReporter.instance;
  }
}

// JavaScript code to inject into the WebView for tracking
const INJECTED_JAVASCRIPT = `
(function() {
  console.log('[WebView] Tracking script injected');
  
  let lastScrollY = 0;
  let lastTimestamp = Date.now();
  let isTracking = false;
  
  // Track scrollable containers separately
  let containerScrollPositions = new Map();
  let lastProcessedTime = 0;

  // Function to send data to React Native
  function sendMessage(data) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(data));
    }
  }

  // Track scroll events
  function handleScroll(event) {
    const now = Date.now();
    
    // Prevent processing the same scroll event multiple times within 10ms
    // This deduplicates when both window and document listeners fire
    if (now - lastProcessedTime < 10) {
      return;
    }
    lastProcessedTime = now;
    
    let scrollY = 0;
    let deltaY = 0;
    let elementKey = 'window';
    
    // Check if this is a container scroll or window scroll
    // event.scrollTop is stored at top level by throttledScroll
    if (event && event.target && event.target !== document && event.scrollTop !== undefined) {
      // Scrolling in a container element (like Pinterest's feed)
      const target = event.target;
      elementKey = (target.id || target.className || 'container').substring(0, 50); // Limit key length
      scrollY = event.scrollTop; // Use the stored scrollTop value
      
      // Get last position for this specific container
      const lastPosition = containerScrollPositions.get(elementKey) || 0;
      deltaY = scrollY - lastPosition;
      containerScrollPositions.set(elementKey, scrollY);
    } else {
      // Window scroll
      scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      deltaY = scrollY - lastScrollY;
      lastScrollY = scrollY;
    }
    
    // Only send if there's actual movement (>1px to avoid noise)
    if (Math.abs(deltaY) > 1) {
      sendMessage({
        type: 'scroll',
        scrollY: scrollY,
        deltaY: deltaY,
        timestamp: now,
        url: window.location.href,
      });
    }
    lastTimestamp = now;
  }

  // Throttled scroll handler (fires at most every 50ms)
  let scrollTimeout = null;
  let pendingEvent = null;
  function throttledScroll(event) {
    // Store event data immediately (event object may be recycled)
    pendingEvent = {
      target: event ? event.target : null,
      scrollTop: event && event.target ? event.target.scrollTop : undefined
    };
    
    if (!scrollTimeout) {
      scrollTimeout = setTimeout(() => {
        handleScroll(pendingEvent);
        scrollTimeout = null;
        pendingEvent = null;
      }, 50);
    }
  }


  // Track touch events for more accurate active time tracking
  function handleTouchStart() {
    sendMessage({
      type: 'touch',
      action: 'start',
      timestamp: Date.now(),
    });
  }

  function handleTouchMove() {
    sendMessage({
      type: 'touch',
      action: 'move',
      timestamp: Date.now(),
    });
  }

  function handleTouchEnd() {
    sendMessage({
      type: 'touch',
      action: 'end',
      timestamp: Date.now(),
    });
  }

  // Track page load
  function handlePageLoad() {
    sendMessage({
      type: 'page_load',
      url: window.location.href,
      timestamp: Date.now(),
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
    });
  }

  // Monitor URL changes (for SPAs)
  let lastUrl = window.location.href;
  setInterval(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      sendMessage({
        type: 'url_change',
        oldUrl: lastUrl,
        newUrl: currentUrl,
        timestamp: Date.now(),
      });
      lastUrl = currentUrl;
    }
  }, 500);

  // Add event listeners
  // Use capture phase to catch scroll events from both window and custom containers
  // The 10ms deduplication in handleScroll prevents double-counting
  document.addEventListener('scroll', throttledScroll, { passive: true, capture: true });
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('touchmove', handleTouchMove, { passive: true });
  window.addEventListener('touchend', handleTouchEnd, { passive: true });
  
  // Notify that page is loaded
  if (document.readyState === 'complete') {
    handlePageLoad();
  } else {
    window.addEventListener('load', handlePageLoad);
  }

  // Send initial message
  sendMessage({
    type: 'init',
    message: 'Scroll tracking initialized',
    timestamp: Date.now(),
  });

  console.log('[WebView] Event listeners attached');
})();
true; // Return true to indicate script executed successfully
`;

export interface BrowserViewRef {
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  loadUrl: (url: string) => void;
  getStats: () => any[];
  pause: () => void;
  resume: () => void;
  endSession: () => Promise<void>;
  hasActiveSession: () => boolean;
}

interface BrowserViewProps {
  tabId: string;
  initialUrl?: string;
  onUrlChange?: (url: string) => void;
  onTitleChange?: (title: string) => void;
  onNavigationStateChange?: (canGoBack: boolean, canGoForward: boolean) => void;
  bookmarks?: Bookmark[];
}

const BrowserView = forwardRef<BrowserViewRef, BrowserViewProps>(function BrowserView({
  tabId,
  initialUrl = 'about:newtab',
  onUrlChange,
  onTitleChange,
  onNavigationStateChange,
  bookmarks = [],
}, ref) {
  const webViewRef = useRef<WebView>(null);
  const statsTrackerRef = useRef(DomainStatsTracker.getInstance());
  const gatewayRef = useRef(GatewayReporter.getInstance());
  const currentUrlRef = useRef(initialUrl);
  const [showNewTab, setShowNewTab] = useState(initialUrl === 'about:newtab');

  // Expose navigation methods and stats data to parent
  useImperativeHandle(ref, () => ({
    goBack: () => {
      if (showNewTab) {
        setShowNewTab(false);
      } else {
        webViewRef.current?.goBack();
      }
    },
    goForward: () => {
      webViewRef.current?.goForward();
    },
    reload: () => {
      if (showNewTab) {
        // Nothing to reload on new tab page
      } else {
        webViewRef.current?.reload();
      }
    },
    loadUrl: (url: string) => {
      if (url === 'about:newtab') {
        setShowNewTab(true);
        currentUrlRef.current = url;
        onUrlChange?.(url);
      } else {
        setShowNewTab(false);
        webViewRef.current?.injectJavaScript(`window.location.href = "${url}";`);
        currentUrlRef.current = url;
      }
    },
    getStats: () => {
      return statsTrackerRef.current.getAllStats();
    },
    pause: () => {
      statsTrackerRef.current.pause(currentUrlRef.current, tabId);
    },
    resume: () => {
      statsTrackerRef.current.resume(currentUrlRef.current, tabId);
    },
    endSession: () => {
      return gatewayRef.current.endSession();
    },
    hasActiveSession: () => {
      return gatewayRef.current.hasActiveSession();
    },
  }));

  useEffect(() => {
    // Initialize tracking for initial URL (skip for new tab page)
    if (initialUrl !== 'about:newtab') {
      statsTrackerRef.current.resume(initialUrl, tabId);
    }

    const gateway = gatewayRef.current;
    gateway.onBreakRecommended = () => {
      Alert.alert(
        'Take a break',
        `You have scrolled more than ${BREAK_SCROLL_METERS} meters in this session. End the session to print your receipt and rest your eyes.`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'End session',
            onPress: () => {
              void gateway.endSession();
            },
          },
        ],
      );
    };

    return () => {
      statsTrackerRef.current.pause(currentUrlRef.current, tabId);
      gatewayRef.current.stop();
      gateway.onBreakRecommended = undefined;
      console.log(`[BrowserView] Tab ${tabId} unmounted, tracking paused`);
    };
  }, [initialUrl, tabId]);

  // Handle navigation from new tab page
  const handleNewTabNavigate = (url: string) => {
    setShowNewTab(false);
    currentUrlRef.current = url;
    onUrlChange?.(url);
    
    // Load URL in WebView
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.location.href = "${url}";`);
    }
    
    // Start tracking
    statsTrackerRef.current.resume(url, tabId);
  };

  // Handle messages from WebView
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      const statsTracker = statsTrackerRef.current;

      switch (data.type) {
        case 'init':
          console.log('[BrowserView] WebView tracking initialized');
          break;

        case 'scroll':
          if (Math.random() < 0.05) {
            console.log(`[BrowserView] Scroll event: deltaY=${data.deltaY}, scrollY=${data.scrollY}`);
          }
          
          statsTracker.processScrollEvent(
            data.url,
            data.scrollY,
            data.deltaY,
            data.timestamp
          );

          gatewayRef.current.queue(data.deltaY);
          break;

        case 'touch':
          // We need URL for touch event, but JS might not send it in 'touch' event type
          // Let's assume the JS injection updates to include url, or we use currentUrlRef
          statsTracker.processTouchEvent(currentUrlRef.current, data.action, data.timestamp);
          if (data.action === 'move') {
            gatewayRef.current.recordTouchMove();
          }
          break;

        case 'page_load':
          console.log(`[BrowserView] Page loaded: ${data.url}`);
          if (currentUrlRef.current !== data.url) {
             statsTracker.pause(currentUrlRef.current, tabId);
          }
          statsTracker.resume(data.url, tabId);
          currentUrlRef.current = data.url;
          break;

        case 'url_change':
          console.log(`[BrowserView] URL changed: ${data.oldUrl} -> ${data.newUrl}`);
          statsTracker.pause(data.oldUrl, tabId);
          statsTracker.resume(data.newUrl, tabId);
          currentUrlRef.current = data.newUrl;
          break;

        default:
          console.log('[BrowserView] Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('[BrowserView] Error parsing message:', error);
    }
  };

  // Handle navigation state changes
  const handleNavigationStateChange = (navState: any) => {
    if (navState.url && navState.url !== currentUrlRef.current && navState.url !== 'about:blank') {
      statsTrackerRef.current.pause(currentUrlRef.current, tabId);
      currentUrlRef.current = navState.url;
      setShowNewTab(false);
      statsTrackerRef.current.resume(navState.url, tabId);
      onUrlChange?.(navState.url);
    }

    // Update title if available
    if (navState.title) {
      onTitleChange?.(navState.title);
    }

    // Notify parent of navigation state
    if (onNavigationStateChange) {
      onNavigationStateChange(navState.canGoBack || showNewTab, navState.canGoForward);
    }
  };

  // Handle load progress
  const handleLoadProgress = (progress: any) => {
    if (progress.nativeEvent.progress === 1) {
      console.log('[BrowserView] Page fully loaded');
    }
  };

  // Pass bookmarks directly to new tab (favicons will be loaded dynamically)
  const newTabBookmarks = bookmarks;

  return (
    <View style={styles.container}>
      {showNewTab ? (
        <NewTabPage 
          onNavigate={handleNewTabNavigate}
          bookmarks={newTabBookmarks}
        />
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: initialUrl === 'about:newtab' ? 'about:blank' : initialUrl }}
          style={styles.webview}
          injectedJavaScript={INJECTED_JAVASCRIPT}
          onMessage={handleMessage}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadProgress={handleLoadProgress}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          allowsBackForwardNavigationGestures={true}
          // Cache and persistence props
          cacheEnabled={true}
          cacheMode="LOAD_CACHE_ELSE_NETWORK"
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          // iOS specific props
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          // Re-inject on every page load
          injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
});

export default BrowserView;


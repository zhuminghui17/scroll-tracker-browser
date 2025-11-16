// BrowserView: Full-screen WebView with scroll tracking

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import DomainStatsTracker from '../trackers/DomainStatsTracker';
import NewTabPage from './NewTabPage';
import { Bookmark } from '../types/browser';

// JavaScript code to inject into the WebView for tracking
const INJECTED_JAVASCRIPT = `
(function() {
  console.log('[WebView] Tracking script injected');
  
  let lastScrollY = 0;
  let lastTimestamp = Date.now();
  let isTracking = false;

  // Function to send data to React Native
  function sendMessage(data) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(data));
    }
  }

  // Debounce function to limit event frequency
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Track scroll events
  function handleScroll() {
    const now = Date.now();
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    const deltaY = scrollY - lastScrollY;
    
    sendMessage({
      type: 'scroll',
      scrollY: scrollY,
      deltaY: deltaY,
      timestamp: now,
      url: window.location.href,
    });
    
    lastScrollY = scrollY;
    lastTimestamp = now;
  }

  // Debounced scroll handler (50ms)
  const debouncedScroll = debounce(handleScroll, 50);

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
  window.addEventListener('scroll', debouncedScroll, { passive: true });
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
  const statsTrackerRef = useRef(new DomainStatsTracker());
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
      statsTrackerRef.current.pause();
    },
    resume: () => {
      statsTrackerRef.current.resume();
    },
  }));

  useEffect(() => {
    // Initialize tracking for initial URL (skip for new tab page)
    if (initialUrl !== 'about:newtab') {
      statsTrackerRef.current.switchDomain(initialUrl);
    }

    // Cleanup on unmount
    return () => {
      statsTrackerRef.current.pause();
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
    statsTrackerRef.current.switchDomain(url);
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
          if (Math.random() < 0.05) { // Log 5% of scroll events
            console.log(`[BrowserView] Scroll event: deltaY=${data.deltaY}, scrollY=${data.scrollY}`);
          }
          
          statsTracker.processScrollEvent(
            data.scrollY,
            data.deltaY,
            data.timestamp
          );
          
          // Log metrics periodically
          if (Math.random() < 0.05) {
            statsTracker.logCurrentMetrics();
          }
          break;

        case 'touch':
          statsTracker.processTouchEvent(data.action, data.timestamp);
          break;

        case 'page_load':
          console.log(`[BrowserView] Page loaded: ${data.url}`);
          statsTracker.switchDomain(data.url);
          break;

        case 'url_change':
          console.log(`[BrowserView] URL changed: ${data.oldUrl} -> ${data.newUrl}`);
          statsTracker.switchDomain(data.newUrl);
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
      currentUrlRef.current = navState.url;
      setShowNewTab(false);
      statsTrackerRef.current.switchDomain(navState.url);
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


// BrowserView: Full-screen WebView with scroll tracking

import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import DomainSessionManager from '../trackers/DomainSessionManager';

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
    const viewportHeight = window.innerHeight;
    
    sendMessage({
      type: 'scroll',
      scrollY: scrollY,
      deltaY: deltaY,
      timestamp: now,
      url: window.location.href,
      viewportHeight: viewportHeight,
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

interface BrowserViewProps {
  initialUrl?: string;
}

const BrowserView: React.FC<BrowserViewProps> = ({ initialUrl = 'https://www.google.com' }) => {
  const webViewRef = useRef<WebView>(null);
  const sessionManagerRef = useRef(new DomainSessionManager());

  useEffect(() => {
    // Initialize session on mount
    sessionManagerRef.current.startSession(initialUrl);

    // Cleanup on unmount
    return () => {
      sessionManagerRef.current.endCurrentSession();
      console.log('[BrowserView] Component unmounted, session ended');
    };
  }, [initialUrl]);

  // Handle messages from WebView
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      const sessionManager = sessionManagerRef.current;

      switch (data.type) {
        case 'init':
          console.log('[BrowserView] WebView tracking initialized');
          break;

        case 'scroll':
          sessionManager.processScrollEvent(
            data.scrollY,
            data.deltaY,
            data.viewportHeight,
            data.timestamp
          );
          
          // Log metrics periodically (every 20 scroll events to avoid spam)
          if (Math.random() < 0.05) {
            sessionManager.logCurrentMetrics();
          }
          break;

        case 'touch':
          sessionManager.processTouchEvent(data.action, data.timestamp);
          break;

        case 'page_load':
          console.log(`[BrowserView] Page loaded: ${data.url}`);
          sessionManager.handleUrlChange(data.url);
          break;

        case 'url_change':
          console.log(`[BrowserView] URL changed: ${data.oldUrl} -> ${data.newUrl}`);
          sessionManager.handleUrlChange(data.newUrl);
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
    if (navState.url) {
      sessionManagerRef.current.handleUrlChange(navState.url);
    }
  };

  // Handle load progress
  const handleLoadProgress = (progress: any) => {
    if (progress.nativeEvent.progress === 1) {
      console.log('[BrowserView] Page fully loaded');
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: initialUrl }}
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
        // iOS specific props
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // Re-inject on every page load
        injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT}
      />
    </View>
  );
};

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


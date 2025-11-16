// BrowserTabs: Main tab manager coordinating all browser components

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, AppState, Alert } from 'react-native';
import BrowserView, { BrowserViewRef } from './BrowserView';
import NavigationBar from './NavigationBar';
import TabListView from './TabListView';
import BookmarksView from './BookmarksView';
import ScrollStatsView from './ScrollStatsView';
import { Tab, HistoryEntry, Bookmark } from '../types/browser';
import { DomainSession } from '../types/tracking';
import BrowserStorage from '../storage/BrowserStorage';

const DEFAULT_URL = 'https://www.google.com';

// Default bookmarks for new users
const DEFAULT_BOOKMARKS: Bookmark[] = [
  {
    id: 'default_youtube',
    url: 'https://www.youtube.com',
    title: 'YouTube',
    domain: 'youtube.com',
    timestamp: Date.now(),
  },
  {
    id: 'default_webtoons',
    url: 'https://www.webtoons.com',
    title: 'Webtoons',
    domain: 'webtoons.com',
    timestamp: Date.now(),
  },
  {
    id: 'default_instagram',
    url: 'https://www.instagram.com',
    title: 'Instagram',
    domain: 'instagram.com',
    timestamp: Date.now(),
  },
  {
    id: 'default_pinterest',
    url: 'https://www.pinterest.com',
    title: 'Pinterest',
    domain: 'pinterest.com',
    timestamp: Date.now(),
  },
  {
    id: 'default_amazon',
    url: 'https://www.amazon.com',
    title: 'Amazon',
    domain: 'amazon.com',
    timestamp: Date.now(),
  },
  {
    id: 'default_canvas',
    url: 'https://canvas.instructure.com',
    title: 'Canvas',
    domain: 'canvas.instructure.com',
    timestamp: Date.now(),
  },
];

const BrowserTabs: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showTabGrid, setShowTabGrid] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSessions, setCurrentSessions] = useState<DomainSession[]>([]);

  // Store refs to all tab WebViews
  const tabRefs = useRef<Map<string, BrowserViewRef>>(new Map());
  const previousActiveTabId = useRef<string>('');

  // Generate unique tab ID
  const generateTabId = (): string => {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Extract domain from URL
  const extractDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };

  // Create a new tab
  const createTab = useCallback((url: string = DEFAULT_URL): string => {
    const newTabId = generateTabId();
    const newTab: Tab = {
      id: newTabId,
      url,
      title: 'New Tab',
      canGoBack: false,
      canGoForward: false,
    };

    // Pause the current active tab before creating a new one
    if (previousActiveTabId.current) {
      const prevRef = tabRefs.current.get(previousActiveTabId.current);
      if (prevRef) {
        prevRef.pause();
        console.log(`[BrowserTabs] Paused previous tab: ${previousActiveTabId.current}`);
      }
    }

    setTabs((prevTabs) => [...prevTabs, newTab]);
    previousActiveTabId.current = newTabId;
    setActiveTabId(newTabId);

    console.log(`[BrowserTabs] Created new tab: ${newTabId}`);
    return newTabId;
  }, []);

  // Close a tab
  const closeTab = useCallback((tabId: string) => {
    setTabs((prevTabs) => {
      const updatedTabs = prevTabs.filter((tab) => tab.id !== tabId);

      // If no tabs left, create a new one
      if (updatedTabs.length === 0) {
        const newTabId = generateTabId();
        const newTab: Tab = {
          id: newTabId,
          url: DEFAULT_URL,
          title: 'New Tab',
          canGoBack: false,
          canGoForward: false,
        };
        setActiveTabId(newTabId);
        return [newTab];
      }

      // If we closed the active tab, switch to another
      if (tabId === activeTabId) {
        const currentIndex = prevTabs.findIndex((tab) => tab.id === tabId);
        const nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        setActiveTabId(updatedTabs[nextIndex].id);
      }

      return updatedTabs;
    });

    // Remove ref
    tabRefs.current.delete(tabId);
    console.log(`[BrowserTabs] Closed tab: ${tabId}`);
  }, [activeTabId]);

  // Switch to a tab
  const switchTab = useCallback((tabId: string) => {
    // Pause the previous active tab
    if (previousActiveTabId.current && previousActiveTabId.current !== tabId) {
      const prevRef = tabRefs.current.get(previousActiveTabId.current);
      if (prevRef) {
        prevRef.pause();
        console.log(`[BrowserTabs] Paused tab: ${previousActiveTabId.current}`);
      }
    }
    
    // Resume the new active tab
    const newRef = tabRefs.current.get(tabId);
    if (newRef) {
      newRef.resume();
      console.log(`[BrowserTabs] Resumed tab: ${tabId}`);
    }
    
    previousActiveTabId.current = tabId;
    setActiveTabId(tabId);
    console.log(`[BrowserTabs] Switched to tab: ${tabId}`);
  }, []);

  // Update tab info
  const updateTab = useCallback((
    tabId: string,
    updates: Partial<Tab>
  ) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === tabId ? { ...tab, ...updates } : tab
      )
    );
  }, []);

  // Add to history
  const addToHistory = useCallback((url: string, title: string) => {
    const entry: HistoryEntry = {
      url,
      title,
      domain: extractDomain(url),
      timestamp: Date.now(),
    };

    setHistory((prevHistory) => {
      const newHistory = [entry, ...prevHistory];
      // Keep only last 1000 entries
      return newHistory.slice(0, 1000);
    });
  }, []);

  // Add bookmark
  const addBookmark = useCallback((url: string, title: string) => {
    // Check if already bookmarked
    const exists = bookmarks.some((b) => b.url === url);
    if (exists) {
      Alert.alert('Already Bookmarked', 'This page is already in your bookmarks.');
      return;
    }

    const newBookmark: Bookmark = {
      id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      title,
      domain: extractDomain(url),
      timestamp: Date.now(),
    };

    setBookmarks((prev) => [newBookmark, ...prev]);
    Alert.alert('Bookmarked', `"${title}" has been added to your bookmarks.`);
    console.log('[BrowserTabs] Added bookmark:', title);
  }, [bookmarks]);

  // Delete bookmark
  const deleteBookmark = useCallback((bookmarkId: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
    console.log('[BrowserTabs] Deleted bookmark:', bookmarkId);
  }, []);

  // Load saved state on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedState = await BrowserStorage.loadBrowserState();

        if (savedState && savedState.tabs.length > 0) {
          setTabs(savedState.tabs);
          previousActiveTabId.current = savedState.activeTabId;
          setActiveTabId(savedState.activeTabId);
          setHistory(savedState.history);
          // If no bookmarks saved, use default bookmarks
          setBookmarks(savedState.bookmarks && savedState.bookmarks.length > 0 
            ? savedState.bookmarks 
            : DEFAULT_BOOKMARKS);
          console.log('[BrowserTabs] Restored browser state from storage');
        } else {
          // Create initial tab and set default bookmarks
          const newTabId = createTab(DEFAULT_URL);
          previousActiveTabId.current = newTabId;
          setBookmarks(DEFAULT_BOOKMARKS);
          console.log('[BrowserTabs] Created initial tab with default bookmarks');
        }
      } catch (error) {
        console.error('[BrowserTabs] Error loading state:', error);
        const newTabId = createTab(DEFAULT_URL);
        previousActiveTabId.current = newTabId;
        setBookmarks(DEFAULT_BOOKMARKS);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, [createTab]);

  // Save state periodically and on app state change
  useEffect(() => {
    if (isLoading || tabs.length === 0) return;

    const saveState = async () => {
      try {
        await BrowserStorage.saveBrowserState({
          tabs,
          activeTabId,
          history,
          bookmarks,
        });
        console.log('[BrowserTabs] Saved browser state');
      } catch (error) {
        console.error('[BrowserTabs] Error saving state:', error);
      }
    };

    // Save immediately when tabs change
    const timeoutId = setTimeout(saveState, 1000);

    // Save on app state change (background/inactive)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        saveState();
      }
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.remove();
    };
  }, [tabs, activeTabId, history, bookmarks, isLoading]);

  // Navigation handlers for active tab
  const handleBack = () => {
    const ref = tabRefs.current.get(activeTabId);
    ref?.goBack();
  };

  const handleForward = () => {
    const ref = tabRefs.current.get(activeTabId);
    ref?.goForward();
  };

  const handleRefresh = () => {
    const ref = tabRefs.current.get(activeTabId);
    ref?.reload();
  };

  const handleNavigate = (url: string) => {
    const ref = tabRefs.current.get(activeTabId);
    ref?.loadUrl(url);
    updateTab(activeTabId, { url });
  };

  const handleNewTab = () => {
    createTab(DEFAULT_URL);
  };

  const handleShowTabs = () => {
    setShowTabGrid(true);
  };

  const handleShowMenu = () => {
    // Menu action handled in NavigationBar
  };

  const handleAddBookmark = () => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (activeTab) {
      addBookmark(activeTab.url, activeTab.title || 'Untitled');
    }
  };

  const handleShowBookmarks = () => {
    setShowBookmarks(true);
  };

  const handleSelectBookmark = (url: string) => {
    handleNavigate(url);
  };

  // Get all sessions from all tabs
  const getAllSessions = useCallback((): DomainSession[] => {
    const allSessions: DomainSession[] = [];
    
    tabRefs.current.forEach((ref) => {
      try {
        const sessions = ref.getSessions();
        if (sessions && Array.isArray(sessions)) {
          allSessions.push(...sessions);
        }
      } catch (error) {
        console.error('[BrowserTabs] Error getting sessions from tab:', error);
      }
    });

    return allSessions;
  }, []);

  // Refresh sessions data
  const refreshSessions = useCallback(() => {
    setCurrentSessions(getAllSessions());
  }, [getAllSessions]);

  const handleShowStats = () => {
    refreshSessions(); // Get initial data
    setShowStats(true);
  };

  // Get active tab data
  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  if (isLoading) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      {/* Navigation Bar */}
      <NavigationBar
        url={activeTab?.url || DEFAULT_URL}
        canGoBack={activeTab?.canGoBack || false}
        canGoForward={activeTab?.canGoForward || false}
        tabCount={tabs.length}
        onBack={handleBack}
        onForward={handleForward}
        onRefresh={handleRefresh}
        onNavigate={handleNavigate}
        onShowTabs={handleShowTabs}
        onNewTab={handleNewTab}
        onShowMenu={handleShowMenu}
        onAddBookmark={handleAddBookmark}
        onShowBookmarks={handleShowBookmarks}
        onShowStats={handleShowStats}
      />

      {/* WebView for each tab (only active one is visible) */}
      <View style={styles.webviewContainer}>
        {tabs.map((tab) => (
          <View
            key={tab.id}
            style={[
              styles.webview,
              tab.id !== activeTabId && styles.webviewHidden,
            ]}
          >
            <BrowserView
              ref={(ref) => {
                if (ref) {
                  tabRefs.current.set(tab.id, ref);
                  // If this tab is not the active one, pause it immediately
                  if (tab.id !== activeTabId) {
                    ref.pause();
                    console.log(`[BrowserTabs] Tab ${tab.id} initialized as paused`);
                  }
                }
              }}
              tabId={tab.id}
              initialUrl={tab.url}
              onUrlChange={(url) => {
                updateTab(tab.id, { url });
                if (tab.id === activeTabId) {
                  addToHistory(url, tab.title);
                }
              }}
              onTitleChange={(title) => {
                updateTab(tab.id, { title });
              }}
              onNavigationStateChange={(canGoBack, canGoForward) => {
                updateTab(tab.id, { canGoBack, canGoForward });
              }}
            />
          </View>
        ))}
      </View>

      {/* Tab List View */}
      <TabListView
        visible={showTabGrid}
        tabs={tabs}
        activeTabId={activeTabId}
        onClose={() => setShowTabGrid(false)}
        onSelectTab={switchTab}
        onCloseTab={closeTab}
        onNewTab={handleNewTab}
      />

      {/* Bookmarks View */}
      <BookmarksView
        visible={showBookmarks}
        bookmarks={bookmarks}
        onClose={() => setShowBookmarks(false)}
        onSelectBookmark={handleSelectBookmark}
        onDeleteBookmark={deleteBookmark}
      />

      {/* Scroll Stats View */}
      <ScrollStatsView
        visible={showStats}
        sessions={currentSessions}
        onClose={() => setShowStats(false)}
        onRefresh={refreshSessions}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  webviewHidden: {
    opacity: 0,
    zIndex: -1,
  },
});

export default BrowserTabs;


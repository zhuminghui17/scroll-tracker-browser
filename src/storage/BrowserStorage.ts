// Persistent storage for browser state using AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tab, HistoryEntry, BrowserState } from '../types/browser';

const STORAGE_KEYS = {
  TABS: '@browser_tabs',
  ACTIVE_TAB: '@browser_active_tab',
  HISTORY: '@browser_history',
};

export class BrowserStorage {
  // Save all tabs
  static async saveTabs(tabs: Tab[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(tabs);
      await AsyncStorage.setItem(STORAGE_KEYS.TABS, jsonValue);
      console.log('[BrowserStorage] Saved tabs:', tabs.length);
    } catch (error) {
      console.error('[BrowserStorage] Error saving tabs:', error);
    }
  }

  // Load all tabs
  static async loadTabs(): Promise<Tab[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.TABS);
      if (jsonValue) {
        const tabs = JSON.parse(jsonValue);
        console.log('[BrowserStorage] Loaded tabs:', tabs.length);
        return tabs;
      }
    } catch (error) {
      console.error('[BrowserStorage] Error loading tabs:', error);
    }
    return [];
  }

  // Save active tab ID
  static async saveActiveTabId(tabId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, tabId);
      console.log('[BrowserStorage] Saved active tab:', tabId);
    } catch (error) {
      console.error('[BrowserStorage] Error saving active tab:', error);
    }
  }

  // Load active tab ID
  static async loadActiveTabId(): Promise<string | null> {
    try {
      const tabId = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
      if (tabId) {
        console.log('[BrowserStorage] Loaded active tab:', tabId);
        return tabId;
      }
    } catch (error) {
      console.error('[BrowserStorage] Error loading active tab:', error);
    }
    return null;
  }

  // Save browsing history
  static async saveHistory(history: HistoryEntry[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(history);
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, jsonValue);
      console.log('[BrowserStorage] Saved history:', history.length, 'entries');
    } catch (error) {
      console.error('[BrowserStorage] Error saving history:', error);
    }
  }

  // Load browsing history
  static async loadHistory(): Promise<HistoryEntry[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
      if (jsonValue) {
        const history = JSON.parse(jsonValue);
        console.log('[BrowserStorage] Loaded history:', history.length, 'entries');
        return history;
      }
    } catch (error) {
      console.error('[BrowserStorage] Error loading history:', error);
    }
    return [];
  }

  // Save complete browser state
  static async saveBrowserState(state: BrowserState): Promise<void> {
    try {
      await Promise.all([
        this.saveTabs(state.tabs),
        this.saveActiveTabId(state.activeTabId),
        this.saveHistory(state.history),
      ]);
      console.log('[BrowserStorage] Browser state saved successfully');
    } catch (error) {
      console.error('[BrowserStorage] Error saving browser state:', error);
    }
  }

  // Load complete browser state
  static async loadBrowserState(): Promise<BrowserState | null> {
    try {
      const [tabs, activeTabId, history] = await Promise.all([
        this.loadTabs(),
        this.loadActiveTabId(),
        this.loadHistory(),
      ]);

      if (tabs.length > 0 && activeTabId) {
        console.log('[BrowserStorage] Browser state loaded successfully');
        return {
          tabs,
          activeTabId,
          history,
        };
      }
    } catch (error) {
      console.error('[BrowserStorage] Error loading browser state:', error);
    }
    return null;
  }

  // Clear all browser data
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TABS,
        STORAGE_KEYS.ACTIVE_TAB,
        STORAGE_KEYS.HISTORY,
      ]);
      console.log('[BrowserStorage] All browser data cleared');
    } catch (error) {
      console.error('[BrowserStorage] Error clearing browser data:', error);
    }
  }
}

export default BrowserStorage;


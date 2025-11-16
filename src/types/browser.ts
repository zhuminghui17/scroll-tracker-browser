// TypeScript types for browser functionality

export interface Tab {
  id: string;
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface HistoryEntry {
  url: string;
  title: string;
  domain: string;
  timestamp: number;
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  domain: string;
  timestamp: number;
}

export interface BrowserState {
  tabs: Tab[];
  activeTabId: string;
  history: HistoryEntry[];
  bookmarks: Bookmark[];
}

export interface TabGridItem extends Tab {
  // Could include thumbnail/screenshot in future
  thumbnail?: string;
}


// DomainStatsTracker: Global stats tracking service

import { AppState, AppStateStatus } from 'react-native';
import { DomainStats, ScrollMetrics, TimeMetrics } from '../types/tracking';
import ScrollTracker from './ScrollTracker';
import TimeTracker from './TimeTracker';
import BrowserStorage from '../storage/BrowserStorage';

export class DomainStatsTracker {
  private static instance: DomainStatsTracker;
  
  private domainStats: Map<string, {
    scrollTracker: ScrollTracker;
    timeTracker: TimeTracker;
    lastVisited: number;
  }> = new Map();
  
  // Track active tabs per domain to handle multiple tabs on same domain
  private activeTabsByDomain: Map<string, Set<string>> = new Map();
  
  private saveInterval: NodeJS.Timeout | null = null;
  private isBackgrounded: boolean = false;

  private constructor() {
    this.initialize();
    // Periodically save stats (every 30 seconds) to ensure data persistence
    this.saveInterval = setInterval(() => {
      this.save();
    }, 30000);

    // Handle app state changes to pause/resume tracking
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  static getInstance(): DomainStatsTracker {
    if (!DomainStatsTracker.instance) {
      DomainStatsTracker.instance = new DomainStatsTracker();
    }
    return DomainStatsTracker.instance;
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      if (!this.isBackgrounded) {
        // Pause all currently active trackers
        this.activeTabsByDomain.forEach((tabs, domain) => {
          if (tabs.size > 0) {
            const tracker = this.domainStats.get(domain);
            if (tracker) {
              tracker.timeTracker.pause();
            }
          }
        });
        this.isBackgrounded = true;
        this.save();
        console.log('[DomainStatsTracker] App backgrounded, paused all trackers');
      }
    } else if (nextAppState === 'active') {
      if (this.isBackgrounded) {
        // Resume all previously active trackers
        this.activeTabsByDomain.forEach((tabs, domain) => {
          if (tabs.size > 0) {
            const tracker = this.domainStats.get(domain);
            if (tracker) {
              tracker.timeTracker.resume();
            }
          }
        });
        this.isBackgrounded = false;
        console.log('[DomainStatsTracker] App active, resumed trackers');
      }
    }
  };

  private async initialize() {
    const stats = await BrowserStorage.loadStats();
    if (stats && Array.isArray(stats)) {
      stats.forEach((stat: any) => {
        // Ensure we have valid data before creating trackers
        if (stat.domain) {
          const distance = stat.scrollMetrics?.distancePixels || 0;
          const scrollingTime = stat.timeMetrics?.scrollingTime || 0;
          const totalTime = stat.timeMetrics?.totalTime || 0;
          
          this.domainStats.set(stat.domain, {
            scrollTracker: new ScrollTracker(distance),
            timeTracker: new TimeTracker(scrollingTime, totalTime),
            lastVisited: stat.lastVisited || Date.now()
          });
        }
      });
      console.log(`[DomainStatsTracker] Initialized with ${this.domainStats.size} domains`);
    }
  }

  async save() {
     const stats = this.getAllStats();
     if (stats.length > 0) {
       await BrowserStorage.saveStats(stats);
     }
  }

  // Extract domain from URL
  private extractDomain(url: string): string {
    try {
      if (!url || url === 'about:newtab' || url === 'about:blank') return 'system';
      const urlObj = new URL(url);
      // Remove 'www.' prefix if present
      let domain = urlObj.hostname.replace(/^www\./, '');
      return domain;
    } catch (error) {
      return 'unknown';
    }
  }

  // Get or create tracker for a domain
  private getOrCreateTracker(domain: string): { scrollTracker: ScrollTracker; timeTracker: TimeTracker; lastVisited: number } {
    if (!this.domainStats.has(domain)) {
      this.domainStats.set(domain, {
        scrollTracker: new ScrollTracker(),
        timeTracker: new TimeTracker(),
        lastVisited: Date.now(),
      });
    }
    return this.domainStats.get(domain)!;
  }

  // Process scroll event
  processScrollEvent(url: string, scrollY: number, deltaY: number, timestamp: number): void {
    const domain = this.extractDomain(url);
    if (domain === 'system' || domain === 'unknown') return;

    const tracker = this.getOrCreateTracker(domain);
    tracker.scrollTracker.processScrollEvent(scrollY, deltaY);
    tracker.timeTracker.processScrollEvent(deltaY, timestamp);
    tracker.lastVisited = Date.now();
  }

  // Process touch event
  processTouchEvent(url: string, action: 'start' | 'move' | 'end', timestamp: number): void {
    const domain = this.extractDomain(url);
    if (domain === 'system' || domain === 'unknown') return;

    const tracker = this.getOrCreateTracker(domain);
    tracker.timeTracker.processTouchEvent(action, timestamp);
  }

  // Pause tracking for a specific domain/tab
  pause(url: string, tabId: string): void {
    const domain = this.extractDomain(url);
    if (domain === 'system' || domain === 'unknown') return;

    if (!this.activeTabsByDomain.has(domain)) {
      this.activeTabsByDomain.set(domain, new Set());
    }
    const activeTabs = this.activeTabsByDomain.get(domain)!;
    activeTabs.delete(tabId);

    // Only pause the tracker if NO tabs are active for this domain
    // AND app is not already backgrounded (if backgrounded, it's already paused)
    if (activeTabs.size === 0 && !this.isBackgrounded) {
      const tracker = this.domainStats.get(domain);
      if (tracker) {
        tracker.timeTracker.pause();
        this.save(); // Save on pause
      }
    }
  }

  // Resume tracking for a specific domain/tab
  resume(url: string, tabId: string): void {
    const domain = this.extractDomain(url);
    if (domain === 'system' || domain === 'unknown') return;

    if (!this.activeTabsByDomain.has(domain)) {
      this.activeTabsByDomain.set(domain, new Set());
    }
    const activeTabs = this.activeTabsByDomain.get(domain)!;
    activeTabs.add(tabId);

    // Ensure tracker is resumed
    // Only if app is not backgrounded
    if (!this.isBackgrounded) {
      const tracker = this.getOrCreateTracker(domain);
      tracker.timeTracker.resume();
      tracker.lastVisited = Date.now();
    }
  }

  // Get all domain stats
  getAllStats(): DomainStats[] {
    const stats: DomainStats[] = [];

    this.domainStats.forEach((tracker, domain) => {
      const scrollMetrics = tracker.scrollTracker.getCurrentMetrics();
      stats.push({
        domain,
        scrollMetrics,
        timeMetrics: tracker.timeTracker.getCurrentMetrics(),
        lastVisited: tracker.lastVisited,
      });
    });

    return stats.sort((a, b) => b.lastVisited - a.lastVisited);
  }
}

export default DomainStatsTracker;

// DomainStatsTracker: Global stats tracking service

import { AppState, AppStateStatus } from 'react-native';
import { DomainStats, ScrollMetrics, TimeMetrics, SessionLog } from '../types/tracking';
import ScrollTracker from './ScrollTracker';
import TimeTracker from './TimeTracker';
import BrowserStorage from '../storage/BrowserStorage';

interface SessionState {
  startTime: number;
  startScroll: number;
  startScrollTime: number;
  startTotalTime: number;
}

export class DomainStatsTracker {
  private static instance: DomainStatsTracker;
  
  private domainStats: Map<string, {
    scrollTracker: ScrollTracker;
    timeTracker: TimeTracker;
    lastVisited: number;
  }> = new Map();
  
  // Track active tabs per domain to handle multiple tabs on same domain
  private activeTabsByDomain: Map<string, Set<string>> = new Map();
  
  // Track active sessions for logging
  private activeSessions: Map<string, SessionState> = new Map();
  private sessionLogs: SessionLog[] = [];

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

  private initialized: boolean = false;

  static getInstance(): DomainStatsTracker {
    if (!DomainStatsTracker.instance) {
      DomainStatsTracker.instance = new DomainStatsTracker();
    }
    return DomainStatsTracker.instance;
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      if (!this.isBackgrounded) {
        // Pause all currently active trackers and end sessions
        this.activeTabsByDomain.forEach((tabs, domain) => {
          if (tabs.size > 0) {
            this.pauseDomainTracking(domain);
          }
        });
        this.isBackgrounded = true;
        this.save();
        console.log('[DomainStatsTracker] App backgrounded, paused all trackers');
      }
    } else if (nextAppState === 'active') {
      if (this.isBackgrounded) {
        // Resume all previously active trackers and start sessions
        this.activeTabsByDomain.forEach((tabs, domain) => {
          if (tabs.size > 0) {
             this.resumeDomainTracking(domain);
          }
        });
        this.isBackgrounded = false;
        console.log('[DomainStatsTracker] App active, resumed trackers');
      }
    }
  };

  private async initialize() {
    // Load aggregated stats
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

    // Load session logs
    const logs = await BrowserStorage.loadSessionLogs();
    if (logs && Array.isArray(logs)) {
      this.sessionLogs = logs;
      console.log(`[DomainStatsTracker] Initialized with ${this.sessionLogs.length} session logs`);
    }
    this.initialized = true;
    console.log('[DomainStatsTracker] Initialization complete');
  }

  async save() {
     if (!this.initialized) {
       console.log('[DomainStatsTracker] Skipping save, not initialized');
       return;
     }
     const stats = this.getAllStats();
     if (stats.length > 0) {
       await BrowserStorage.saveStats(stats);
     }
     if (this.sessionLogs.length > 0) {
       await BrowserStorage.saveSessionLogs(this.sessionLogs);
     }
  }

  // Extract domain from URL
  private extractDomain(url: string): string {
    try {
      if (!url || url === 'about:newtab' || url === 'about:blank') return 'system';
      const urlObj = new URL(url);
      
      // Extract base domain (domain + TLD, removing all subdomains)
      // Examples: m.webtoons.com -> webtoons.com, en.wikipedia.org -> wikipedia.org
      const parts = urlObj.hostname.split('.');
      
      // Handle edge cases
      if (parts.length <= 1) return urlObj.hostname;
      
      // For domains like co.uk, github.io, etc., keep last 3 parts
      // Otherwise keep last 2 parts (domain.tld)
      const secondLevelTLDs = ['co', 'com', 'org', 'net', 'ac', 'gov', 'edu', 'mil'];
      let domain;
      if (parts.length >= 3 && secondLevelTLDs.includes(parts[parts.length - 2])) {
        // Keep last 3 parts for domains like example.co.uk
        domain = parts.slice(-3).join('.');
      } else {
        // Keep last 2 parts for standard domains (domain.tld)
        domain = parts.slice(-2).join('.');
      }
      
      // Debug log for tracking issues
      if (Math.random() < 0.05 && urlObj.hostname !== domain) {
        console.log(`[DomainStatsTracker] Normalized ${urlObj.hostname} -> ${domain}`);
      }
      
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

  // Start a session log for a domain
  private startSessionLog(domain: string) {
    const tracker = this.getOrCreateTracker(domain);
    const scrollMetrics = tracker.scrollTracker.getCurrentMetrics();
    const timeMetrics = tracker.timeTracker.getCurrentMetrics();

    this.activeSessions.set(domain, {
      startTime: Date.now(),
      startScroll: scrollMetrics.distancePixels,
      startScrollTime: timeMetrics.scrollingTime,
      startTotalTime: timeMetrics.totalTime,
    });
    console.log(`[DomainStatsTracker] Started session log for ${domain}`);
  }

  // End a session log for a domain
  private endSessionLog(domain: string) {
    const sessionStart = this.activeSessions.get(domain);
    if (!sessionStart) return;

    const tracker = this.domainStats.get(domain);
    if (!tracker) return;

    const scrollMetrics = tracker.scrollTracker.getCurrentMetrics();
    const timeMetrics = tracker.timeTracker.getCurrentMetrics();
    const endTime = Date.now();

    const log: SessionLog = {
      domain,
      startTime: new Date(sessionStart.startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      scrollDistance: scrollMetrics.distancePixels - sessionStart.startScroll,
      scrollTime: timeMetrics.scrollingTime - sessionStart.startScrollTime,
      totalTime: timeMetrics.totalTime - sessionStart.startTotalTime,
    };

    // Only save logs with significant activity:
    // 1. Must have scrolled at least 10 pixels
    // 2. OR stayed on page for at least 5 seconds
    if (log.scrollDistance > 10 && log.totalTime > 1000) {
      this.sessionLogs.push(log);
      // Limit logs size (keep last 10000)
      if (this.sessionLogs.length > 10000) {
        this.sessionLogs = this.sessionLogs.slice(-10000);
      }
      console.log(`[DomainStatsTracker] Logged session for ${domain}: ${log.totalTime}ms, ${log.scrollDistance}px`);
    } else {
      console.log(`[DomainStatsTracker] Ignored insignificant session for ${domain}: ${log.totalTime}ms, ${log.scrollDistance}px`);
    }

    this.activeSessions.delete(domain);
  }

  private pauseDomainTracking(domain: string) {
    const tracker = this.domainStats.get(domain);
    if (tracker) {
      tracker.timeTracker.pause();
      this.endSessionLog(domain);
      this.save(); // Save on pause
    }
  }

  private resumeDomainTracking(domain: string) {
    const tracker = this.getOrCreateTracker(domain);
    tracker.timeTracker.resume();
    tracker.lastVisited = Date.now();
    this.startSessionLog(domain);
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
      this.pauseDomainTracking(domain);
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
      // Check if session already active (could happen if multiple tabs)
      if (!this.activeSessions.has(domain)) {
         this.resumeDomainTracking(domain);
      } else {
         // Just update last visited
         const tracker = this.getOrCreateTracker(domain);
         tracker.lastVisited = Date.now();
      }
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

  // Get all session logs
  getSessionLogs(): SessionLog[] {
    return [...this.sessionLogs].sort((a, b) => 
      new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
    );
  }

  // Export logs as CSV string
  exportLogsCSV(): string {
    const header = 'domain,start_timestamp,end_timestamp,scroll_distance_pixels,scroll_distance_cm,scroll_time_ms,total_time_ms';
    const rows = this.sessionLogs.map(log => {
      // Convert pixels to cm using device PPI
      const DeviceConfig = require('../utils/DeviceConfig').DeviceConfig;
      const ppi = DeviceConfig.getInstance().getPPI();
      const inches = log.scrollDistance / ppi;
      const cm = inches * 2.54;
      
      return `${log.domain},${log.startTime},${log.endTime},${Math.round(log.scrollDistance)},${cm.toFixed(2)},${Math.round(log.scrollTime)},${Math.round(log.totalTime)}`;
    });
    
    return [header, ...rows].join('\n');
  }

  // Clear logs and stats
  async clearAllData(): Promise<void> {
    this.sessionLogs = [];
    this.domainStats.clear();
    this.activeSessions.clear();
    this.activeTabsByDomain.clear();
    
    // Clear storage
    await BrowserStorage.clearAll();
    
    // Re-initialize empty state
    await this.save();
    console.log('[DomainStatsTracker] All data cleared');
  }
}

export default DomainStatsTracker;

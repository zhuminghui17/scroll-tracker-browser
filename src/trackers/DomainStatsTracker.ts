// DomainStatsTracker: Simple per-domain stats tracking without sessions

import { DomainStats, ScrollMetrics, TimeMetrics } from '../types/tracking';
import ScrollTracker from './ScrollTracker';
import TimeTracker from './TimeTracker';

export class DomainStatsTracker {
  private domainStats: Map<string, {
    scrollTracker: ScrollTracker;
    timeTracker: TimeTracker;
    lastVisited: number;
  }> = new Map();
  
  private currentDomain: string | null = null;

  // Extract domain from URL
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove 'www.' prefix if present
      let domain = urlObj.hostname.replace(/^www\./, '');
      return domain;
    } catch (error) {
      console.warn('[DomainStatsTracker] Invalid URL:', url);
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
      console.log(`[DomainStatsTracker] Created new tracker for: ${domain}`);
    }
    return this.domainStats.get(domain)!;
  }

  // Switch to tracking a different domain
  switchDomain(url: string): void {
    const newDomain = this.extractDomain(url);
    
    if (this.currentDomain === newDomain) {
      return; // Already on this domain
    }

    // Pause the previous domain's time tracker
    if (this.currentDomain) {
      const prevTracker = this.domainStats.get(this.currentDomain);
      if (prevTracker) {
        prevTracker.timeTracker.pause();
        console.log(`[DomainStatsTracker] Paused: ${this.currentDomain}`);
      }
    }

    // Resume (or create) the new domain's tracker
    const newTracker = this.getOrCreateTracker(newDomain);
    newTracker.timeTracker.resume();
    newTracker.lastVisited = Date.now();
    
    this.currentDomain = newDomain;
    console.log(`[DomainStatsTracker] Switched to: ${newDomain}`);
  }

  // Process scroll event for current domain
  processScrollEvent(scrollY: number, deltaY: number, viewportHeight: number, timestamp: number): void {
    if (!this.currentDomain) return;

    const tracker = this.domainStats.get(this.currentDomain);
    if (!tracker) return;

    tracker.scrollTracker.processScrollEvent(scrollY, deltaY, viewportHeight);
    tracker.timeTracker.processScrollEvent(deltaY, timestamp);
    tracker.lastVisited = Date.now();
  }

  // Process touch event for current domain
  processTouchEvent(action: 'start' | 'move' | 'end', timestamp: number): void {
    if (!this.currentDomain) return;

    const tracker = this.domainStats.get(this.currentDomain);
    if (!tracker) return;

    tracker.timeTracker.processTouchEvent(action, timestamp);
  }

  // Pause tracking (when tab becomes inactive)
  pause(): void {
    if (!this.currentDomain) return;

    const tracker = this.domainStats.get(this.currentDomain);
    if (tracker) {
      tracker.timeTracker.pause();
      console.log('[DomainStatsTracker] Tracking paused');
    }
  }

  // Resume tracking (when tab becomes active)
  resume(): void {
    if (!this.currentDomain) return;

    const tracker = this.domainStats.get(this.currentDomain);
    if (tracker) {
      tracker.timeTracker.resume();
      console.log('[DomainStatsTracker] Tracking resumed');
    }
  }

  // Get all domain stats
  getAllStats(): DomainStats[] {
    const stats: DomainStats[] = [];

    this.domainStats.forEach((tracker, domain) => {
      stats.push({
        domain,
        scrollMetrics: tracker.scrollTracker.getCurrentMetrics(),
        timeMetrics: tracker.timeTracker.getCurrentMetrics(),
        lastVisited: tracker.lastVisited,
      });
    });

    return stats;
  }

  // Get current domain
  getCurrentDomain(): string | null {
    return this.currentDomain;
  }

  // Log current metrics
  logCurrentMetrics(): void {
    if (!this.currentDomain) {
      console.log('[DomainStatsTracker] No active domain');
      return;
    }

    const tracker = this.domainStats.get(this.currentDomain);
    if (!tracker) return;

    console.log(`\n====== Stats for ${this.currentDomain} ======`);
    tracker.scrollTracker.logMetrics(this.currentDomain);
    tracker.timeTracker.logMetrics();
    console.log('==================================================\n');
  }
}

export default DomainStatsTracker;


// DomainSessionManager: Manages domain sessions and tracks per-domain metrics

import { DomainSession, ScrollMetrics, TimeMetrics } from '../types/tracking';
import ScrollTracker from './ScrollTracker';
import TimeTracker from './TimeTracker';

export class DomainSessionManager {
  private currentSession: DomainSession | null = null;
  private sessions: DomainSession[] = [];
  private scrollTracker: ScrollTracker;
  private timeTracker: TimeTracker;

  constructor() {
    this.scrollTracker = new ScrollTracker();
    this.timeTracker = new TimeTracker();
  }

  // Extract domain from URL
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove 'www.' prefix if present
      let domain = urlObj.hostname.replace(/^www\./, '');
      return domain;
    } catch (error) {
      console.warn('[DomainSessionManager] Invalid URL:', url);
      return 'unknown';
    }
  }

  // Start a new session for a domain
  startSession(url: string): void {
    // End current session if exists
    if (this.currentSession) {
      this.endCurrentSession();
    }

    const domain = this.extractDomain(url);
    
    // Reset trackers for new session
    this.scrollTracker.reset();
    this.timeTracker.reset();

    this.currentSession = {
      domain,
      startTime: Date.now(),
      scrollMetrics: {
        distanceCm: 0,
        distanceMeters: 0,
        distanceFeet: 0,
        distanceInches: 0,
        screenHeights: 0,
      },
      timeMetrics: {
        activeScrollTime: 0,
        passiveViewTime: 0,
        totalTime: 0,
      },
      url,
    };

    console.log(`[SESSION] Started new session for: ${domain}`);
  }

  // End the current session
  endCurrentSession(): void {
    if (!this.currentSession) {
      return;
    }

    // Update final metrics
    this.currentSession.endTime = Date.now();
    this.currentSession.scrollMetrics = this.scrollTracker.getCurrentMetrics();
    this.currentSession.timeMetrics = this.timeTracker.getCurrentMetrics();

    // Store session
    this.sessions.push({ ...this.currentSession });

    console.log(
      `[SESSION] Ended session for: ${this.currentSession.domain}, ` +
      `Duration: ${((this.currentSession.endTime - this.currentSession.startTime) / 1000).toFixed(1)}s, ` +
      `Scroll: ${this.currentSession.scrollMetrics.distanceCm}cm`
    );

    this.currentSession = null;
  }

  // Handle URL/domain change
  handleUrlChange(newUrl: string): void {
    const newDomain = this.extractDomain(newUrl);
    const currentDomain = this.currentSession?.domain;

    if (currentDomain && currentDomain !== newDomain) {
      console.log(`[SESSION] Domain changed: ${currentDomain} -> ${newDomain}`);
      this.startSession(newUrl);
    } else if (!this.currentSession) {
      // No current session, start a new one
      this.startSession(newUrl);
    }
  }

  // Process scroll event
  processScrollEvent(scrollY: number, deltaY: number, viewportHeight: number, timestamp: number): void {
    if (!this.currentSession) {
      return;
    }

    // Update scroll metrics
    this.scrollTracker.processScrollEvent(scrollY, deltaY, viewportHeight);
    
    // Update time metrics
    this.timeTracker.processScrollEvent(deltaY, timestamp);

    // Update current session with latest metrics
    this.currentSession.scrollMetrics = this.scrollTracker.getCurrentMetrics();
    this.currentSession.timeMetrics = this.timeTracker.getCurrentMetrics();
  }

  // Process touch event
  processTouchEvent(action: 'start' | 'move' | 'end', timestamp: number): void {
    if (!this.currentSession) {
      return;
    }

    this.timeTracker.processTouchEvent(action, timestamp);
    this.currentSession.timeMetrics = this.timeTracker.getCurrentMetrics();
  }

  // Get current session
  getCurrentSession(): DomainSession | null {
    return this.currentSession;
  }

  // Get all sessions
  getAllSessions(): DomainSession[] {
    return this.sessions;
  }

  // Get sessions for a specific domain
  getSessionsByDomain(domain: string): DomainSession[] {
    return this.sessions.filter(session => session.domain === domain);
  }

  // Log current session metrics
  logCurrentMetrics(): void {
    if (!this.currentSession) {
      console.log('[SESSION] No active session');
      return;
    }

    console.log(`\n====== Session Metrics for ${this.currentSession.domain} ======`);
    this.scrollTracker.logMetrics(this.currentSession.domain);
    this.timeTracker.logMetrics();
    console.log('==================================================\n');
  }

  // Get aggregated stats by domain
  getAggregatedStats(): Map<string, { scrollMetrics: ScrollMetrics; timeMetrics: TimeMetrics; sessionCount: number }> {
    const stats = new Map();

    for (const session of this.sessions) {
      if (!stats.has(session.domain)) {
        stats.set(session.domain, {
          scrollMetrics: { ...session.scrollMetrics },
          timeMetrics: { ...session.timeMetrics },
          sessionCount: 1,
        });
      } else {
        const existing = stats.get(session.domain);
        
        // Aggregate scroll metrics
        existing.scrollMetrics.distanceCm += session.scrollMetrics.distanceCm;
        existing.scrollMetrics.distanceMeters += session.scrollMetrics.distanceMeters;
        existing.scrollMetrics.distanceFeet += session.scrollMetrics.distanceFeet;
        existing.scrollMetrics.distanceInches += session.scrollMetrics.distanceInches;
        existing.scrollMetrics.screenHeights += session.scrollMetrics.screenHeights;
        
        // Aggregate time metrics
        existing.timeMetrics.activeScrollTime += session.timeMetrics.activeScrollTime;
        existing.timeMetrics.passiveViewTime += session.timeMetrics.passiveViewTime;
        existing.timeMetrics.totalTime += session.timeMetrics.totalTime;
        
        existing.sessionCount++;
      }
    }

    return stats;
  }
}

export default DomainSessionManager;


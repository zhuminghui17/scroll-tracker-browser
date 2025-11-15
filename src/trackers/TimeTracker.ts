// TimeTracker: Tracks active scrolling time vs passive viewing time

import { TimeMetrics } from '../types/tracking';

export class TimeTracker {
  private sessionStartTime: number = 0;
  private activeScrollTime: number = 0; // milliseconds of active scrolling
  private passiveViewTime: number = 0; // milliseconds of passive viewing
  
  private lastScrollTime: number = 0;
  private isScrolling: boolean = false;
  private scrollTimeoutId: any = null;
  
  // Configuration
  private readonly SCROLL_TIMEOUT = 150; // ms - time to consider scroll as "continuous"
  private readonly MIN_DELTA = 2; // minimum deltaY to consider as active scroll

  constructor() {
    this.sessionStartTime = Date.now();
  }

  // Process a scroll event
  processScrollEvent(deltaY: number, timestamp: number): void {
    const absDelta = Math.abs(deltaY);
    
    // Only track if scroll delta is significant
    if (absDelta > this.MIN_DELTA) {
      if (!this.isScrolling) {
        // Start of a new scroll burst
        this.isScrolling = true;
        console.log('[TimeTracker] Active scrolling started');
      }
      
      // Update last scroll time
      const timeSinceLastScroll = this.lastScrollTime > 0 ? timestamp - this.lastScrollTime : 0;
      
      if (timeSinceLastScroll > 0 && timeSinceLastScroll <= this.SCROLL_TIMEOUT) {
        // Continuous scrolling - add the time difference to active time
        this.activeScrollTime += timeSinceLastScroll;
      }
      
      this.lastScrollTime = timestamp;
      
      // Clear existing timeout
      if (this.scrollTimeoutId) {
        clearTimeout(this.scrollTimeoutId);
      }
      
      // Set timeout to detect end of scrolling
      this.scrollTimeoutId = setTimeout(() => {
        this.isScrolling = false;
        console.log('[TimeTracker] Active scrolling ended');
      }, this.SCROLL_TIMEOUT);
    }
  }

  // Process touch events (start, move, end)
  processTouchEvent(action: 'start' | 'move' | 'end', timestamp: number): void {
    if (action === 'start') {
      if (!this.isScrolling) {
        this.isScrolling = true;
        this.lastScrollTime = timestamp;
      }
    } else if (action === 'end') {
      if (this.isScrolling && this.lastScrollTime > 0) {
        const scrollDuration = timestamp - this.lastScrollTime;
        this.activeScrollTime += scrollDuration;
        this.isScrolling = false;
      }
    }
  }

  // Get current time metrics
  getCurrentMetrics(): TimeMetrics {
    const now = Date.now();
    const totalTime = now - this.sessionStartTime;
    
    // Calculate passive time as total time minus active scrolling time
    const passiveTime = Math.max(0, totalTime - this.activeScrollTime);
    
    return {
      activeScrollTime: this.activeScrollTime,
      passiveViewTime: passiveTime,
      totalTime: totalTime,
    };
  }

  // Reset tracking (for new session)
  reset(): void {
    this.sessionStartTime = Date.now();
    this.activeScrollTime = 0;
    this.passiveViewTime = 0;
    this.lastScrollTime = 0;
    this.isScrolling = false;
    
    if (this.scrollTimeoutId) {
      clearTimeout(this.scrollTimeoutId);
      this.scrollTimeoutId = null;
    }
    
    console.log('[TimeTracker] Reset');
  }

  // Format time for display
  private formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Log current metrics to console
  logMetrics(): void {
    const metrics = this.getCurrentMetrics();
    console.log(
      `[TIME] Active: ${this.formatTime(metrics.activeScrollTime)}, ` +
      `Passive: ${this.formatTime(metrics.passiveViewTime)}, ` +
      `Total: ${this.formatTime(metrics.totalTime)}`
    );
  }
}

export default TimeTracker;


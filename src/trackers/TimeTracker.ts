// TimeTracker: Tracks active scrolling time vs passive viewing time

import { TimeMetrics } from '../types/tracking';

export class TimeTracker {
  private sessionStartTime: number = 0;
  private scrollingTime: number = 0; // milliseconds spent scrolling
  
  private scrollSessionStartTime: number = 0; // When current scroll session started
  private isScrolling: boolean = false;
  private scrollTimeoutId: any = null;
  
  // Pause/resume functionality
  private isPaused: boolean = false;
  private pauseStartTime: number = 0;
  private totalPausedTime: number = 0; // Total time spent paused
  
  // Configuration
  private readonly SCROLL_TIMEOUT = 500; // ms - time after last scroll to end session
  private readonly MIN_DELTA = 2; // minimum deltaY to consider as active scroll

  constructor() {
    this.sessionStartTime = Date.now();
  }

  // Process a scroll event
  processScrollEvent(deltaY: number, timestamp: number): void {
    // Don't track if paused
    if (this.isPaused) {
      if (Math.random() < 0.05) {
        console.log('[TimeTracker] Scroll event ignored - tracker is paused');
      }
      return;
    }
    
    const absDelta = Math.abs(deltaY);
    
    // Only track if scroll delta is significant
    if (absDelta > this.MIN_DELTA) {
      // Start new scroll session if not already scrolling
      if (!this.isScrolling) {
        this.isScrolling = true;
        this.scrollSessionStartTime = timestamp;
        console.log('[TimeTracker] Scroll session started');
      }
      
      // Clear existing timeout
      if (this.scrollTimeoutId) {
        clearTimeout(this.scrollTimeoutId);
      }
      
      // Set timeout to detect end of scrolling
      this.scrollTimeoutId = setTimeout(() => {
        if (this.isScrolling && this.scrollSessionStartTime > 0) {
          // Calculate and add the duration of this scroll session
          const scrollDuration = Date.now() - this.scrollSessionStartTime;
          this.scrollingTime += scrollDuration;
          console.log(`[TimeTracker] Scroll session ended, added ${scrollDuration}ms (total: ${this.scrollingTime}ms)`);
          this.isScrolling = false;
          this.scrollSessionStartTime = 0;
        }
      }, this.SCROLL_TIMEOUT);
    }
  }

  // Process touch events (start, move, end)
  processTouchEvent(action: 'start' | 'move' | 'end', timestamp: number): void {
    // Don't track if paused
    if (this.isPaused) return;
    
    if (action === 'start') {
      if (!this.isScrolling) {
        this.isScrolling = true;
        this.scrollSessionStartTime = timestamp;
      }
    } else if (action === 'end') {
      if (this.isScrolling && this.scrollSessionStartTime > 0) {
        const scrollDuration = timestamp - this.scrollSessionStartTime;
        this.scrollingTime += scrollDuration;
        console.log(`[TimeTracker] Touch scroll ended, added ${scrollDuration}ms`);
        this.isScrolling = false;
        this.scrollSessionStartTime = 0;
      }
    }
  }

  // Pause time tracking (when tab becomes inactive)
  pause(): void {
    if (this.isPaused) return;
    
    this.isPaused = true;
    this.pauseStartTime = Date.now();
    
    // End any active scrolling and save the time
    if (this.isScrolling && this.scrollSessionStartTime > 0) {
      const scrollDuration = Date.now() - this.scrollSessionStartTime;
      this.scrollingTime += scrollDuration;
      console.log(`[TimeTracker] Paused during scroll, saved ${scrollDuration}ms (total: ${this.scrollingTime}ms)`);
      this.isScrolling = false;
      this.scrollSessionStartTime = 0;
    }
    
    // Clear timeout
    if (this.scrollTimeoutId) {
      clearTimeout(this.scrollTimeoutId);
      this.scrollTimeoutId = null;
    }
    
    console.log('[TimeTracker] Paused');
  }

  // Resume time tracking (when tab becomes active)
  resume(): void {
    if (!this.isPaused) return;
    
    const pauseDuration = Date.now() - this.pauseStartTime;
    this.totalPausedTime += pauseDuration;
    this.isPaused = false;
    this.pauseStartTime = 0;
    
    console.log(`[TimeTracker] Resumed (paused for ${pauseDuration}ms)`);
  }

  // Get current time metrics
  getCurrentMetrics(): TimeMetrics {
    const now = Date.now();
    let totalTime = now - this.sessionStartTime - this.totalPausedTime;
    
    // If currently paused, subtract the current pause duration
    if (this.isPaused && this.pauseStartTime > 0) {
      totalTime -= (now - this.pauseStartTime);
    }
    
    const metrics = {
      scrollingTime: this.scrollingTime,
      totalTime: totalTime,
    };
    
    // Debug logging every ~10 seconds
    if (Math.random() < 0.01) {
      console.log(`[TimeTracker] Current metrics - Total: ${(totalTime / 1000).toFixed(1)}s, Scrolling: ${(this.scrollingTime / 1000).toFixed(1)}s, Paused: ${this.isPaused}`);
    }
    
    return metrics;
  }

  // Reset tracking (for new session)
  reset(): void {
    this.sessionStartTime = Date.now();
    this.scrollingTime = 0;
    this.scrollSessionStartTime = 0;
    this.isScrolling = false;
    this.isPaused = false;
    this.pauseStartTime = 0;
    this.totalPausedTime = 0;
    
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
      `[TIME] Scrolling: ${this.formatTime(metrics.scrollingTime)}, ` +
      `Total: ${this.formatTime(metrics.totalTime)}`
    );
  }
}

export default TimeTracker;



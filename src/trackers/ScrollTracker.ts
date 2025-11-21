// ScrollTracker: Calculates scroll distance in various units

import { DeviceConfig } from '../utils/DeviceConfig';
import { ScrollMetrics } from '../types/tracking';

export class ScrollTracker {
  private deviceConfig: DeviceConfig;
  private totalScrollPoints: number = 0;
  private lastScrollY: number = 0;

  constructor(initialScrollPoints: number = 0) {
    this.deviceConfig = DeviceConfig.getInstance();
    this.totalScrollPoints = initialScrollPoints;
  }

  // Process a scroll event and update metrics
  processScrollEvent(scrollY: number, deltaY: number): ScrollMetrics {
    // Track absolute scroll delta for distance measurement (all movement - up and down)
    const absDeltaY = Math.abs(deltaY);
    this.totalScrollPoints += absDeltaY;
    
    if (Math.random() < 0.05) { // Log 5% of scroll events
      console.log(`[ScrollTracker] deltaY: ${deltaY}, total: ${this.totalScrollPoints}px`);
    }
    
    this.lastScrollY = scrollY;

    return this.getCurrentMetrics();
  }

  // Calculate current scroll metrics
  getCurrentMetrics(): ScrollMetrics {
    return {
      distancePixels: this.totalScrollPoints,
    };
  }

  // Reset tracking (useful for new sessions)
  reset(): void {
    this.totalScrollPoints = 0;
    this.lastScrollY = 0;
    console.log('[ScrollTracker] Reset');
  }

  // Get total scroll distance in points
  getTotalScrollPoints(): number {
    return this.totalScrollPoints;
  }

  // Get last scroll position
  getLastScrollY(): number {
    return this.lastScrollY;
  }

  // Log current metrics to console
  logMetrics(domain: string): void {
    const metrics = this.getCurrentMetrics();
    const ppi = this.deviceConfig.getPPI();
    const deviceScreenHeight = this.deviceConfig.getDeviceInfo().screenHeight;
    
    // Convert to display units
    const inches = metrics.distancePixels / ppi;
    const cm = inches * 2.54;
    const meters = cm / 100;
    const screenHeights = metrics.distancePixels / deviceScreenHeight;
    
    console.log(
      `[SCROLL] Domain: ${domain}, ` +
      `Distance: ${metrics.distancePixels}px (${cm.toFixed(2)}cm, ${meters.toFixed(3)}m), ` +
      `Screen Heights: ${screenHeights.toFixed(2)}`
    );
  }
}

export default ScrollTracker;


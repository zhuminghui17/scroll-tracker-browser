// ScrollTracker: Calculates scroll distance in various units

import { DeviceConfig } from '../utils/DeviceConfig';
import { ScrollMetrics } from '../types/tracking';

export class ScrollTracker {
  private deviceConfig: DeviceConfig;
  private totalScrollPoints: number = 0;
  private totalScreenHeights: number = 0;
  private lastScrollY: number = 0;

  constructor() {
    this.deviceConfig = DeviceConfig.getInstance();
  }

  // Process a scroll event and update metrics
  processScrollEvent(scrollY: number, deltaY: number, viewportHeight: number): ScrollMetrics {
    // Track absolute scroll delta (always positive for distance measurement)
    const absDeltaY = Math.abs(deltaY);
    
    this.totalScrollPoints += absDeltaY;
    this.totalScreenHeights += absDeltaY / viewportHeight;
    this.lastScrollY = scrollY;

    return this.getCurrentMetrics();
  }

  // Calculate current scroll metrics in all units
  getCurrentMetrics(): ScrollMetrics {
    const ppi = this.deviceConfig.getPPI();
    
    // Convert points to inches: points / PPI
    const inches = this.totalScrollPoints / ppi;
    
    // Convert to other units
    const centimeters = inches * 2.54;
    const meters = centimeters / 100;
    const feet = inches / 12;

    return {
      distanceCm: parseFloat(centimeters.toFixed(2)),
      distanceMeters: parseFloat(meters.toFixed(3)),
      distanceFeet: parseFloat(feet.toFixed(2)),
      distanceInches: parseFloat(inches.toFixed(2)),
      screenHeights: parseFloat(this.totalScreenHeights.toFixed(2)),
    };
  }

  // Reset tracking (useful for new sessions)
  reset(): void {
    this.totalScrollPoints = 0;
    this.totalScreenHeights = 0;
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
    console.log(
      `[SCROLL] Domain: ${domain}, ` +
      `Distance: ${metrics.distanceCm}cm (${metrics.distanceMeters}m), ` +
      `${metrics.distanceFeet}ft (${metrics.distanceInches}in), ` +
      `Screen Heights: ${metrics.screenHeights}`
    );
  }
}

export default ScrollTracker;


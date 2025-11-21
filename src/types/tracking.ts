// TypeScript types for scroll tracking

export interface ScrollEvent {
  type: 'scroll';
  scrollY: number;
  deltaY: number;
  timestamp: number;
  url: string;
}

export interface TouchEvent {
  type: 'touch';
  action: 'start' | 'move' | 'end';
  timestamp: number;
}

export interface DomainChangeEvent {
  type: 'domain_change';
  oldUrl: string;
  newUrl: string;
  timestamp: number;
}

export interface TrackingEvent {
  type: 'scroll' | 'touch' | 'domain_change' | 'page_load';
  data: ScrollEvent | TouchEvent | DomainChangeEvent | any;
}

export interface ScrollMetrics {
  distancePixels: number; // Total scroll distance in pixels (device pixels/points)
}

export interface TimeMetrics {
  scrollingTime: number; // milliseconds spent scrolling (fingers moving)
  totalTime: number; // milliseconds total time on page
}

// Simple stats per domain (aggregated)
export interface DomainStats {
  domain: string;
  scrollMetrics: ScrollMetrics;
  timeMetrics: TimeMetrics;
  lastVisited: number;
}

// Detailed session log for CSV export
export interface SessionLog {
  domain: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  scrollDistance: number;
  scrollTime: number;
  totalTime: number;
}

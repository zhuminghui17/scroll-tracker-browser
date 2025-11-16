// TypeScript types for scroll tracking

export interface ScrollEvent {
  type: 'scroll';
  scrollY: number;
  deltaY: number;
  timestamp: number;
  url: string;
  viewportHeight: number;
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
  distanceCm: number;
  distanceMeters: number;
  distanceFeet: number;
  distanceInches: number;
  screenHeights: number;
}

export interface TimeMetrics {
  scrollingTime: number; // milliseconds spent scrolling (fingers moving)
  totalTime: number; // milliseconds total time on page
}

export interface DomainSession {
  domain: string;
  startTime: number;
  endTime?: number;
  scrollMetrics: ScrollMetrics;
  timeMetrics: TimeMetrics;
  url: string;
}

export interface SessionSummary {
  domain: string;
  totalScrollDistance: ScrollMetrics;
  totalTime: TimeMetrics;
  sessionCount: number;
  lastVisited: number;
}


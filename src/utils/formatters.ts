// Formatting utilities for stats display

/**
 * Format distance in meters to human-readable string
 * @param meters Distance in meters
 * @returns Formatted string like "1.2 km" or "450 m"
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`; // 1.11 km
  }
  return `${(meters).toFixed(2)} m`; // 1.11 m
}

/**
 * Format time in milliseconds to human-readable string
 * @param ms Time in milliseconds
 * @returns Formatted string like "2h 34m" or "45s"
 */
export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const remainingSeconds = seconds % 60;
    if (remainingSeconds > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${hours}h`;
}

/**
 * Format percentage
 * @param ratio Ratio between 0 and 1
 * @returns Formatted string like "75%"
 */
export function formatPercentage(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/**
 * Format number with comma separators
 * @param num Number to format
 * @returns Formatted string like "1,234"
 */
export function formatNumber(num: number): string {
  return Math.round(num).toLocaleString();
}

/**
 * Format distance value for display in stats cards
 * @param meters Distance in meters
 * @returns Object with value and unit
 */
export function formatDistanceForCard(meters: number): { value: string; unit: string } {
  if (meters >= 1000) {
    return {
      value: (meters / 1000).toFixed(2),
      unit: 'km',
    };
  }
  return {
    value: (meters).toFixed(2),
    unit: 'm',
  };
}

/**
 * Format time for display in stats cards
 * @param ms Time in milliseconds
 * @returns Object with value and unit
 */
export function formatTimeForCard(ms: number): { value: string; unit: string } {
  const seconds = Math.floor(ms / 1000);
  
  if (seconds < 60) {
    return { value: seconds.toString(), unit: 's' };
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return { value: minutes.toString(), unit: 'min' };
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return {
    value: `${hours}:${remainingMinutes.toString().padStart(2, '0')}`,
    unit: 'h',
  };
}


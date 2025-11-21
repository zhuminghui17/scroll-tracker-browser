// Formatting utilities for stats display

import { DeviceConfig } from './DeviceConfig';

/**
 * Convert pixels to meters
 * @param pixels Distance in device pixels/points
 * @returns Distance in meters
 */
export function pixelsToMeters(pixels: number): number {
  const deviceConfig = DeviceConfig.getInstance();
  const ppi = deviceConfig.getPPI();
  const inches = pixels / ppi;
  const cm = inches * 2.54;
  const meters = cm / 100;
  return meters;
}

/**
 * Convert pixels to centimeters
 * @param pixels Distance in device pixels/points
 * @returns Distance in centimeters
 */
export function pixelsToCm(pixels: number): number {
  const deviceConfig = DeviceConfig.getInstance();
  const ppi = deviceConfig.getPPI();
  const inches = pixels / ppi;
  const cm = inches * 2.54;
  return cm;
}

/**
 * Convert pixels to screen heights
 * @param pixels Distance in device pixels/points
 * @returns Number of screen heights
 */
export function pixelsToScreenHeights(pixels: number): number {
  const deviceConfig = DeviceConfig.getInstance();
  const deviceScreenHeight = deviceConfig.getDeviceInfo().screenHeight;
  return pixels / deviceScreenHeight;
}

/**
 * Format distance from pixels to human-readable string
 * @param pixels Distance in device pixels/points
 * @returns Formatted string like "1.2 km" or "450 m"
 */
export function formatDistance(pixels: number): string {
  const meters = pixelsToMeters(pixels);
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  if (meters >= 1) {
    return `${meters.toFixed(2)} m`;
  }
  const cm = pixelsToCm(pixels);
  return `${cm.toFixed(1)} cm`;
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
 * @param pixels Distance in device pixels/points
 * @returns Object with value and unit
 */
export function formatDistanceForCard(pixels: number): { value: string; unit: string } {
  const meters = pixelsToMeters(pixels);
  if (meters >= 1000) {
    return {
      value: (meters / 1000).toFixed(2),
      unit: 'km',
    };
  }
  if (meters >= 1) {
    return {
      value: meters.toFixed(2),
      unit: 'm',
    };
  }
  const cm = pixelsToCm(pixels);
  return {
    value: cm.toFixed(1),
    unit: 'cm',
  };
}


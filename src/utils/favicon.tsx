// Favicon utilities: Fetch and display website favicons

import React, { useState } from 'react';
import { Image, Text, StyleSheet } from 'react-native';

/**
 * Get favicon URL for a given website URL
 */
export const getFaviconUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    // Using Google's favicon service with higher resolution
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return '';
  }
};

/**
 * Favicon icon component with fallback
 */
interface FaviconIconProps {
  url: string;
  size?: number;
  fallbackEmoji?: string;
}

export const FaviconIcon: React.FC<FaviconIconProps> = ({ 
  url, 
  size = 24,
  fallbackEmoji = '🌐' 
}) => {
  const [imageError, setImageError] = useState(false);
  const faviconUrl = getFaviconUrl(url);

  if (!faviconUrl || imageError) {
    return <Text style={[styles.fallbackText, { fontSize: size }]}>{fallbackEmoji}</Text>;
  }

  return (
    <Image
      source={{ uri: faviconUrl }}
      style={[styles.faviconImage, { width: size, height: size }]}
      onError={() => setImageError(true)}
    />
  );
};

const styles = StyleSheet.create({
  faviconImage: {
    borderRadius: 4,
  },
  fallbackText: {
    textAlign: 'center',
  },
});


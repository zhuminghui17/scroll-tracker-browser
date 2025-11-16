// NavigationBar: Mobile-optimized browser navigation controls

import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  ActionSheetIOS,
  Alert,
} from 'react-native';

interface NavigationBarProps {
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
  tabCount: number;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
  onNavigate: (url: string) => void;
  onShowTabs: () => void;
  onNewTab: () => void;
  onShowMenu: () => void;
  onAddBookmark: () => void;
  onShowBookmarks: () => void;
  onShowStats: () => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({
  url,
  canGoBack,
  canGoForward,
  tabCount,
  onBack,
  onForward,
  onRefresh,
  onNavigate,
  onShowTabs,
  onNewTab,
  onShowMenu,
  onAddBookmark,
  onShowBookmarks,
  onShowStats,
}) => {
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [editedUrl, setEditedUrl] = useState(url);
  const urlInputRef = useRef<TextInput>(null);

  // Update edited URL when prop changes
  React.useEffect(() => {
    if (!isEditingUrl) {
      setEditedUrl(url);
    }
  }, [url, isEditingUrl]);

  const handleUrlSubmit = () => {
    setIsEditingUrl(false);
    let finalUrl = editedUrl.trim();

    // If empty, don't navigate
    if (!finalUrl) {
      setEditedUrl(url);
      return;
    }

    // Check if it's a search query (no dots, or looks like a query)
    const isSearch = !finalUrl.includes('.') || finalUrl.includes(' ');

    if (isSearch) {
      // Search on Google
      finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`;
    } else {
      // Add https:// if no protocol
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
      }
    }

    onNavigate(finalUrl);
  };

  const handleMenuPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            'Cancel',
            'Add Bookmark',
            'View Bookmarks',
            'View Scroll Stats',
            'Refresh',
          ],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            onAddBookmark();
          } else if (buttonIndex === 2) {
            onShowBookmarks();
          } else if (buttonIndex === 3) {
            onShowStats();
          } else if (buttonIndex === 4) {
            onRefresh();
          }
        }
      );
    } else {
      // For Android, we'll use a simple alert for now
      Alert.alert(
        'Menu',
        'Choose an action',
        [
          { text: 'Add Bookmark', onPress: onAddBookmark },
          { text: 'View Bookmarks', onPress: onShowBookmarks },
          { text: 'View Scroll Stats', onPress: onShowStats },
          { text: 'Refresh', onPress: onRefresh },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  // Format URL for display (remove protocol, truncate if needed)
  const getDisplayUrl = (fullUrl: string): string => {
    try {
      const urlObj = new URL(fullUrl);
      let display = urlObj.hostname + urlObj.pathname;
      if (urlObj.search) {
        display += urlObj.search;
      }
      return display;
    } catch {
      return fullUrl;
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={[styles.button, !canGoBack && styles.buttonDisabled]}
        onPress={onBack}
        disabled={!canGoBack}
      >
        <Text style={[styles.buttonText, !canGoBack && styles.buttonTextDisabled]}>←</Text>
      </TouchableOpacity>

      {/* URL Bar */}
      <View style={styles.urlBarContainer}>
        <TextInput
          ref={urlInputRef}
          style={styles.urlInput}
          value={isEditingUrl ? editedUrl : getDisplayUrl(url)}
          onChangeText={setEditedUrl}
          onFocus={() => {
            setIsEditingUrl(true);
            setEditedUrl(url);
            // Select all text after a brief delay to ensure it works
            setTimeout(() => {
              urlInputRef.current?.setSelection(0, url.length);
            }, 10);
          }}
          onBlur={() => setIsEditingUrl(false)}
          onSubmitEditing={handleUrlSubmit}
          returnKeyType="go"
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Search or enter URL"
          placeholderTextColor="#999"
        />
      </View>

      {/* Tabs Button with Count */}
      <TouchableOpacity style={styles.tabButton} onPress={onShowTabs}>
        <View style={styles.tabButtonBadge}>
          <Text style={styles.tabButtonText}>{tabCount}</Text>
        </View>
      </TouchableOpacity>

      {/* New Tab Button */}
      <TouchableOpacity style={styles.button} onPress={onNewTab}>
        <Text style={styles.buttonText}>+</Text>
      </TouchableOpacity>

      {/* Menu Button */}
      <TouchableOpacity style={styles.button} onPress={handleMenuPress}>
        <Text style={styles.buttonText}>⋯</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  button: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginHorizontal: 4,
  },
  buttonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  buttonText: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: '#ccc',
  },
  urlBarContainer: {
    flex: 1,
    marginHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  urlInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
  },
  tabButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  tabButtonBadge: {
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '700',
  },
});

export default NavigationBar;


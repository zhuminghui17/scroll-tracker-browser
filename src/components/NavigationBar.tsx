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
  Keyboard,
} from 'react-native';

const ADMIN_MENU_TRIGGERS = new Set(['shooshoohoohoo, 0717']);

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
  onAddBookmark: () => void;
  onShowBookmarks: () => void;
  onShowStats: () => void;
  onShowDeviceSelection: () => void;
  onResetStats: () => void;
  onEndSession: () => void;
  onShowGatewaySettings: () => void;
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
  onAddBookmark,
  onShowBookmarks,
  onShowStats,
  onShowDeviceSelection,
  onResetStats,
  onEndSession,
  onShowGatewaySettings,
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
    // Dismiss keyboard immediately
    Keyboard.dismiss();
    urlInputRef.current?.blur();
    
    let finalUrl = editedUrl.trim();

    // If empty, don't navigate
    if (!finalUrl) {
      setEditedUrl(url);
      setIsEditingUrl(false);
      return;
    }

    const adminKey = finalUrl.toLowerCase().replace(/\s+/g, ' ');
    const adminCompact = adminKey.replace(/\s/g, '');
    if (
      ADMIN_MENU_TRIGGERS.has(adminKey) ||
      ADMIN_MENU_TRIGGERS.has(adminCompact)
    ) {
      Keyboard.dismiss();
      urlInputRef.current?.blur();
      setEditedUrl(url);
      setIsEditingUrl(false);
      handleMenuPress();
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

    setIsEditingUrl(false);
    onNavigate(finalUrl);
  };

  const handleMenuPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            'Gateway Settings',
            'Add Bookmark',
            'View Bookmarks',
            'View Scroll Stats',
            'Select Device',
            'Reset Stats & Logs',
            'Refresh',
            'Cancel',
          ],
          destructiveButtonIndex: 5,
          cancelButtonIndex: 7,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            onShowGatewaySettings();
          } else if (buttonIndex === 1) {
            onAddBookmark();
          } else if (buttonIndex === 2) {
            onShowBookmarks();
          } else if (buttonIndex === 3) {
            onShowStats();
          } else if (buttonIndex === 4) {
            onShowDeviceSelection();
          } else if (buttonIndex === 5) {
            onResetStats();
          } else if (buttonIndex === 6) {
            onRefresh();
          }
        }
      );
    } else {
      Alert.alert(
        'Admin',
        'Choose an action',
        [
          { text: 'Gateway Settings', onPress: onShowGatewaySettings },
          { text: 'Add Bookmark', onPress: onAddBookmark },
          { text: 'View Bookmarks', onPress: onShowBookmarks },
          { text: 'View Scroll Stats', onPress: onShowStats },
          { text: 'Select Device', onPress: onShowDeviceSelection },
          { text: 'Reset Stats & Logs', onPress: onResetStats, style: 'destructive' },
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

      <TouchableOpacity
        style={[styles.button, styles.endSessionButton]}
        onPress={onEndSession}
        accessibilityLabel="End print session"
      >
        <Text style={styles.endSessionButtonText}>End</Text>
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
  endSessionButton: {
    minWidth: 44,
    paddingHorizontal: 6,
  },
  endSessionButtonText: {
    fontSize: 14,
    color: '#C62828',
    fontWeight: '700',
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


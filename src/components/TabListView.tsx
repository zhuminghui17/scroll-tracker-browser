// TabListView: Mobile-optimized tab overview in list layout

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import { Tab } from '../types/browser';
import { FaviconIcon } from '../utils/favicon';

interface TabListViewProps {
  visible: boolean;
  tabs: Tab[];
  activeTabId: string;
  onClose: () => void;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
}

const TabListView: React.FC<TabListViewProps> = ({
  visible,
  tabs,
  activeTabId,
  onClose,
  onSelectTab,
  onCloseTab,
  onNewTab,
}) => {
  const handleSelectTab = (tabId: string) => {
    onSelectTab(tabId);
    onClose();
  };

  const handleCloseTab = (tabId: string, event: any) => {
    event.stopPropagation();
    onCloseTab(tabId);
  };

  const handleNewTab = () => {
    onNewTab();
    onClose();
  };

  // Truncate title
  const truncateTitle = (title: string, maxLength: number = 40): string => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  // Extract domain from URL
  const getDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tabs</Text>
          <TouchableOpacity onPress={onClose} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

      {/* Tab List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {tabs
          .filter((tab) => {
            // Only show "about:newtab" if it's the active tab
            const isActive = tab.id === activeTabId;
            if (tab.url === 'about:newtab' && !isActive) {
              return false;
            }
            return true;
          })
          .map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabItem,
                isActive && styles.tabItemActive,
              ]}
              onPress={() => handleSelectTab(tab.id)}
              activeOpacity={0.7}
            >
              {/* Tab Icon */}
              <View style={styles.tabIcon}>
                <FaviconIcon url={tab.url} size={24} fallbackEmoji="🌐" />
              </View>

              {/* Tab Info */}
              <View style={styles.tabInfo}>
                <Text style={styles.tabTitle} numberOfLines={1}>
                  {truncateTitle(tab.title || 'New Tab')}
                </Text>
                <Text style={styles.tabUrl} numberOfLines={1}>
                  {getDomain(tab.url)}
                </Text>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={(e) => handleCloseTab(tab.id, e)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

        {/* New Tab Button at Bottom */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.newTabButton} onPress={handleNewTab}>
            <Text style={styles.newTabButtonText}>+ New Tab</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60, // Account for status bar
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  doneButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    padding: 12,
    paddingBottom: 100, // Space for footer
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabItemActive: {
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  tabIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tabIconText: {
    fontSize: 20,
  },
  tabInfo: {
    flex: 1,
    marginRight: 8,
  },
  tabTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  tabUrl: {
    fontSize: 13,
    color: '#666',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  newTabButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  newTabButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TabListView;


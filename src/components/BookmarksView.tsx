// BookmarksView: Display and manage bookmarks

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { Bookmark } from '../types/browser';
import { FaviconIcon } from '../utils/favicon';

interface BookmarksViewProps {
  visible: boolean;
  bookmarks: Bookmark[];
  onClose: () => void;
  onSelectBookmark: (url: string) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
}

const BookmarksView: React.FC<BookmarksViewProps> = ({
  visible,
  bookmarks,
  onClose,
  onSelectBookmark,
  onDeleteBookmark,
}) => {
  const handleSelectBookmark = (url: string) => {
    onSelectBookmark(url);
    onClose();
  };

  const handleDeleteBookmark = (bookmarkId: string, title: string, event: any) => {
    event.stopPropagation();
    Alert.alert(
      'Delete Bookmark',
      `Remove "${title}" from bookmarks?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteBookmark(bookmarkId),
        },
      ]
    );
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
          <Text style={styles.headerTitle}>Bookmarks</Text>
          <TouchableOpacity onPress={onClose} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Bookmarks List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          {bookmarks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔖</Text>
              <Text style={styles.emptyTitle}>No Bookmarks Yet</Text>
              <Text style={styles.emptySubtitle}>
                Add bookmarks from the menu while browsing
              </Text>
            </View>
          ) : (
            bookmarks.map((bookmark) => (
              <TouchableOpacity
                key={bookmark.id}
                style={styles.bookmarkItem}
                onPress={() => handleSelectBookmark(bookmark.url)}
                activeOpacity={0.7}
              >
                {/* Bookmark Icon */}
                <View style={styles.bookmarkIcon}>
                  <FaviconIcon url={bookmark.url} size={24} fallbackEmoji="🔖" />
                </View>

                {/* Bookmark Info */}
                <View style={styles.bookmarkInfo}>
                  <Text style={styles.bookmarkTitle} numberOfLines={1}>
                    {truncateTitle(bookmark.title || 'Untitled')}
                  </Text>
                  <Text style={styles.bookmarkUrl} numberOfLines={1}>
                    {getDomain(bookmark.url)}
                  </Text>
                </View>

                {/* Delete Button */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => handleDeleteBookmark(bookmark.id, bookmark.title, e)}
                >
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
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
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  bookmarkItem: {
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
  bookmarkIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bookmarkIconText: {
    fontSize: 20,
  },
  bookmarkInfo: {
    flex: 1,
    marginRight: 8,
  },
  bookmarkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  bookmarkUrl: {
    fontSize: 13,
    color: '#666',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default BookmarksView;


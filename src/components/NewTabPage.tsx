// NewTabPage: Custom new tab page with search and bookmarks

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Bookmark } from '../types/browser';
import { FaviconIcon } from '../utils/favicon';

interface NewTabPageProps {
  onNavigate: (url: string) => void;
  bookmarks?: Bookmark[];
}

const NewTabPage: React.FC<NewTabPageProps> = ({ onNavigate, bookmarks = [] }) => {
  const [searchText, setSearchText] = useState('');

  const handleSearch = () => {
    if (!searchText.trim()) return;

    let url = searchText.trim();

    // Check if it's a URL
    if (url.includes('.') && !url.includes(' ')) {
      // Add https:// if not present
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      onNavigate(url);
    } else {
      // Search on Google
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      onNavigate(searchUrl);
    }

    setSearchText('');
  };

  const handleBookmarkPress = (url: string) => {
    onNavigate(url);
  };

  // Take first 8 bookmarks for display
  const displayBookmarks = bookmarks.slice(0, 8);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>🌐</Text>
        <Text style={styles.title}>New Tab</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search or enter address"
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Bookmarks Grid */}
      <View style={styles.bookmarksContainer}>
        <Text style={styles.bookmarksTitle}>Quick Links</Text>
        <View style={styles.bookmarksGrid}>
          {displayBookmarks.map((bookmark) => (
            <TouchableOpacity
              key={bookmark.id}
              style={styles.bookmarkCard}
              onPress={() => handleBookmarkPress(bookmark.url)}
              activeOpacity={0.7}
            >
              <View style={styles.bookmarkIcon}>
                <FaviconIcon 
                  url={bookmark.favicon || bookmark.url} 
                  size={32} 
                  fallbackEmoji="🔖" 
                />
              </View>
              <Text style={styles.bookmarkTitle} numberOfLines={1}>
                {bookmark.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Scroll Tracker Browser</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.5,
  },
  searchContainer: {
    marginBottom: 48,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    padding: 0,
  },
  bookmarksContainer: {
    flex: 1,
  },
  bookmarksTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  bookmarksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  bookmarkCard: {
    width: '25%',
    paddingHorizontal: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  bookmarkIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  bookmarkTitle: {
    fontSize: 13,
    color: '#000',
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  footerText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
});

export default NewTabPage;


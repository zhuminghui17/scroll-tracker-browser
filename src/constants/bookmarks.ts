// Default bookmarks for new users

import { Bookmark } from '../types/browser';

/** Bump when DEFAULT_BOOKMARKS change so stored bookmarks migrate on next launch. */
export const BOOKMARK_DEFAULTS_VERSION = 6;

export const DEFAULT_BOOKMARKS: Bookmark[] = [
  {
    id: 'default_youtube',
    url: 'https://www.youtube.com/',
    title: 'YouTube',
    domain: 'youtube.com',
    timestamp: Date.now(),
  },
  {
    id: 'default_threads',
    url: 'https://www.threads.net/',
    title: 'Threads',
    domain: 'threads.net',
    timestamp: Date.now(),
  },
  {
    id: 'default_pinterest',
    url: 'https://www.pinterest.com/',
    title: 'Pinterest',
    domain: 'pinterest.com',
    timestamp: Date.now(),
  },
  {
    id: 'default_bluesky',
    url: 'https://bsky.app/',
    title: 'Bluesky',
    domain: 'bsky.app',
    timestamp: Date.now(),
  },
  {
    id: 'default_substack',
    url: 'https://substack.com/',
    title: 'Substack',
    domain: 'substack.com',
    timestamp: Date.now(),
  },
  {
    id: 'default_reddit',
    url: 'https://www.reddit.com/',
    title: 'Reddit',
    domain: 'reddit.com',
    timestamp: Date.now(),
  },
  {
    id: 'default_webtoons',
    url: 'https://www.webtoons.com/',
    title: 'Webtoons',
    domain: 'webtoons.com',
    timestamp: Date.now(),
  },
  {
    id: 'default_atlantic',
    url: 'https://www.theatlantic.com/',
    title: 'The Atlantic',
    domain: 'theatlantic.com',
    timestamp: Date.now(),
  },
];

const defaultUrls = new Set(DEFAULT_BOOKMARKS.map((b) => b.url));

/**
 * Replace bundled defaults with current DEFAULT_BOOKMARKS; keep user-added (`bookmark_*` ids).
 * Call when BOOKMARK_DEFAULTS_VERSION increases or version key is missing.
 */
export function migrateBookmarksIfNeeded(saved: Bookmark[], savedVersion: number | null): Bookmark[] {
  if (savedVersion === BOOKMARK_DEFAULTS_VERSION && saved.length > 0) {
    return saved;
  }
  const userBookmarks = saved.filter((b) => b.id.startsWith('bookmark_') && !defaultUrls.has(b.url));
  return [...DEFAULT_BOOKMARKS, ...userBookmarks];
}


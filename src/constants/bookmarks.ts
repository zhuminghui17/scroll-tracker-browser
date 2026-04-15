// Default bookmarks for new users

import { Bookmark } from '../types/browser';

/** Bump when DEFAULT_BOOKMARKS change so stored bookmarks migrate on next launch. */
export const BOOKMARK_DEFAULTS_VERSION = 4;

export const DEFAULT_BOOKMARKS: Bookmark[] = [
  {
    id: 'default_atlantic',
    url: 'https://www.theatlantic.com/',
    title: 'The Atlantic',
    domain: 'theatlantic.com',
    timestamp: Date.now(),
  },
  {
    id: 'default_smithsonian',
    url: 'https://www.smithsonianmag.com/',
    title: 'Smithsonian',
    domain: 'smithsonianmag.com',
    timestamp: Date.now(),
  },
  {
    id: 'default_reddit',
    url: 'https://www.reddit.com',
    title: 'Reddit',
    domain: 'reddit.com',
    timestamp: Date.now(),
  },
  {
    id: 'default_thedp',
    url: 'https://www.thedp.com/',
    title: 'The Daily Pennsylvanian',
    domain: 'thedp.com',
    timestamp: Date.now(),
  },
  {
    id: 'default_weitzman',
    url: 'https://www.design.upenn.edu/',
    title: 'Weitzman School of Design',
    domain: 'design.upenn.edu',
    timestamp: Date.now(),
  },
  {
    id: 'default_wikipedia',
    url: 'https://en.wikipedia.org/',
    title: 'Wikipedia',
    domain: 'wikipedia.org',
    timestamp: Date.now(),
  },
  {
    id: 'default_instagram',
    url: 'https://www.instagram.com',
    title: 'Instagram',
    domain: 'instagram.com',
    timestamp: Date.now(),
  },
  {
    id: 'default_pinterest',
    url: 'https://www.pinterest.com',
    title: 'Pinterest',
    domain: 'pinterest.com',
    timestamp: Date.now(),
  },
  {
    id: 'default_amazon',
    url: 'https://www.amazon.com',
    title: 'Amazon',
    domain: 'amazon.com',
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


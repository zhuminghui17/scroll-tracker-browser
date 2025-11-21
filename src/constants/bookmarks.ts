// Default bookmarks for new users

import { Bookmark } from '../types/browser';

export const DEFAULT_BOOKMARKS: Bookmark[] = [
  {
    id: 'default_youtube',
    url: 'https://www.m.youtube.com',
    title: 'YouTube',
    domain: 'm.youtube.com',
    timestamp: Date.now(),
  },
  {
    id: 'default_webtoons',
    url: 'https://www.m.webtoons.com',
    title: 'Webtoons',
    domain: 'm.webtoons.com',
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
  {
    id: 'default_canvas',
    url: 'https://canvas.instructure.com',
    title: 'Canvas',
    domain: 'canvas.instructure.com',
    timestamp: Date.now(),
  },
];


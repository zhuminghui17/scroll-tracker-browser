import AsyncStorage from '@react-native-async-storage/async-storage';

const GATEWAY_URL_KEY = '@gateway_url';
const DEFAULT_GATEWAY_URL = 'https://infinite-scroll-relay-production.up.railway.app';

let cachedGatewayUrl: string | null = null;

export async function getGatewayUrl(): Promise<string> {
  if (cachedGatewayUrl) return cachedGatewayUrl;
  
  try {
    const stored = await AsyncStorage.getItem(GATEWAY_URL_KEY);
    cachedGatewayUrl = stored || DEFAULT_GATEWAY_URL;
    return cachedGatewayUrl;
  } catch {
    return DEFAULT_GATEWAY_URL;
  }
}

export async function setGatewayUrl(url: string): Promise<void> {
  cachedGatewayUrl = url;
  await AsyncStorage.setItem(GATEWAY_URL_KEY, url);
}

export function getGatewayUrlSync(): string {
  return cachedGatewayUrl || DEFAULT_GATEWAY_URL;
}

export async function initGatewayConfig(): Promise<string> {
  return getGatewayUrl();
}

export const SCROLL_DEBOUNCE_MS = 300;

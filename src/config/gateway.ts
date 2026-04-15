import AsyncStorage from '@react-native-async-storage/async-storage';

const GATEWAY_URL_KEY = '@gateway_url';

/**
 * Production relay (HTTPS). Same base URL as `RELAY_URL` in infinite-scroll-gateway `.env`
 * when the gateway runs in relay mode — the gateway opens WSS to this host; the app POSTs
 * `/scroll` and `/session/end` to the same host.
 */
export const DEPLOYED_RELAY_BASE_URL = 'https://infinite-scroll-relay-production.up.railway.app';

/** Local gateway HTTP (run `npm run dev` in infinite-scroll-gateway). Use on iOS Simulator if cloud requests fail. */
export const LOCAL_GATEWAY_URL = 'http://127.0.0.1:3000';

const DEFAULT_GATEWAY_URL = DEPLOYED_RELAY_BASE_URL;

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

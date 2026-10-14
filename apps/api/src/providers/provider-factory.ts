import { env } from '../config/env.js';
import { MockMarketDataProvider } from './mock-market-data.provider.js';
import { SsiIboardProvider } from './ssi-iboard.provider.js';
import type { MarketDataProvider } from './market-data.interface.js';

let _provider: MarketDataProvider | null = null;

export function getMarketDataProvider(): MarketDataProvider {
  if (_provider) return _provider;
  if (env.MARKET_DATA_PROVIDER === 'rest') {
    const baseUrl = env.MARKET_DATA_BASE_URL ?? 'https://iboard-api.ssi.com.vn';
    _provider = new SsiIboardProvider(baseUrl, env.MARKET_DATA_TIMEOUT_MS);
  } else {
    _provider = new MockMarketDataProvider();
  }
  return _provider;
}

// Allow resetting the singleton — used in tests
export function resetMarketDataProvider(): void {
  _provider = null;
}

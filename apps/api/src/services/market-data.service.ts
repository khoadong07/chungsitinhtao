import type { Candle, GetCandlesParams } from '../providers/market-data.interface.js';
import { getMarketDataProvider } from '../providers/provider-factory.js';
import { env } from '../config/env.js';

export interface MarketDataResult {
  candles: Candle[];
  source: {
    provider: string;
    isMock: boolean;
    isStale: boolean;
    fetchedAt: string;
    priceUnit: string;
  };
}

interface CacheEntry {
  result: MarketDataResult;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(params: GetCandlesParams): string {
  return `${params.symbol}:${params.timeframe}:${params.limit}`;
}

export async function getCandles(params: GetCandlesParams): Promise<MarketDataResult> {
  const key = cacheKey(params);
  const now = Date.now();

  const entry = cache.get(key);
  if (entry && entry.expiresAt > now) {
    return {
      ...entry.result,
      source: { ...entry.result.source, isStale: true },
    };
  }

  const provider = getMarketDataProvider();
  const candleResult = await provider.getCandles(params);

  const result: MarketDataResult = {
    candles: candleResult.candles,
    source: {
      ...candleResult.source,
      isStale: false,
    },
  };

  cache.set(key, {
    result,
    expiresAt: now + env.MARKET_DATA_CACHE_TTL_SECONDS * 1000,
  });

  return result;
}

export function clearCache(): void {
  cache.clear();
}

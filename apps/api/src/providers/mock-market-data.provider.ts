import type { Candle, CandleResult, GetCandlesParams, MarketDataProvider } from './market-data.interface.js';

// Simple LCG: next = (a * seed + c) % m
function lcg(seed: number): { next(): number } {
  let state = seed >>> 0;
  return {
    next(): number {
      state = ((1664525 * state + 1013904223) & 0xffffffff) >>> 0;
      return state / 0xffffffff;
    },
  };
}

function symbolSeed(symbol: string): number {
  let h = 0;
  for (let i = 0; i < symbol.length; i++) {
    h = (h * 31 + symbol.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(h) || 1;
}

// Advances a date by 1 business day (skips Sat/Sun)
function nextBusinessDay(d: Date): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + 1);
  const dow = next.getUTCDay();
  if (dow === 6) next.setUTCDate(next.getUTCDate() + 2); // Sat → Mon
  if (dow === 0) next.setUTCDate(next.getUTCDate() + 1); // Sun → Mon
  return next;
}

const TOTAL_CANDLES = 300;
const START_DATE = '2024-01-02T00:00:00.000Z';

export class MockMarketDataProvider implements MarketDataProvider {
  readonly providerName = 'mock';
  readonly isMock = true;

  getCandles(params: GetCandlesParams): Promise<CandleResult> {
    const { symbol, limit } = params;
    const rng = lcg(symbolSeed(symbol));

    const baseSeed = symbolSeed(symbol);
    const basePrice = (baseSeed % 90) + 10; // 10–100 in thousands VND

    const allCandles: Candle[] = [];
    let currentDate = new Date(START_DATE);
    let price = basePrice;

    for (let i = 0; i < TOTAL_CANDLES; i++) {
      // Daily price change ±3%
      const change = (rng.next() - 0.5) * 0.06; // ±3%
      const closePrice = price * (1 + change);
      const openPrice = price;

      // Intraday range ±1.5% beyond open/close
      const highExtra = rng.next() * 0.015;
      const lowExtra = rng.next() * 0.015;
      const high = Math.max(openPrice, closePrice) * (1 + highExtra);
      const low = Math.min(openPrice, closePrice) * (1 - lowExtra);

      // Volume: 1M–50M, seed-influenced
      const volume = Math.round((rng.next() * 49_000_000 + 1_000_000));

      allCandles.push({
        timestamp: currentDate.toISOString(),
        open: Math.round(openPrice * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(closePrice * 100) / 100,
        volume,
      });

      price = closePrice;
      currentDate = nextBusinessDay(currentDate);
    }

    // Return last `limit` candles (already ascending)
    const count = Math.min(limit, TOTAL_CANDLES);
    const candles = allCandles.slice(TOTAL_CANDLES - count);

    return Promise.resolve({
      candles,
      source: {
        provider: this.providerName,
        isMock: true,
        fetchedAt: new Date().toISOString(),
        priceUnit: 'thousands_vnd',
      },
    });
  }
}

import { describe, it, expect } from 'vitest';
import { MockMarketDataProvider } from '../providers/mock-market-data.provider.js';
import { validateCandle, type Candle } from '../providers/market-data.interface.js';

describe('MockMarketDataProvider', () => {
  const provider = new MockMarketDataProvider();

  it('returns exactly limit candles when limit <= 300', async () => {
    const result = await provider.getCandles({ symbol: 'MBB', timeframe: '1D', limit: 50 });
    expect(result.candles).toHaveLength(50);
  });

  it('returns 250 candles by default limit', async () => {
    const result = await provider.getCandles({ symbol: 'ACB', timeframe: '1D', limit: 250 });
    expect(result.candles).toHaveLength(250);
  });

  it('candles are sorted ascending by timestamp', async () => {
    const result = await provider.getCandles({ symbol: 'FPT', timeframe: '1D', limit: 100 });
    for (let i = 1; i < result.candles.length; i++) {
      expect(result.candles[i].timestamp >= result.candles[i - 1].timestamp).toBe(true);
    }
  });

  it('all candles pass OHLC validity: high >= open and close', async () => {
    const result = await provider.getCandles({ symbol: 'VNM', timeframe: '1D', limit: 100 });
    for (const c of result.candles) {
      expect(c.high).toBeGreaterThanOrEqual(c.open);
      expect(c.high).toBeGreaterThanOrEqual(c.close);
    }
  });

  it('all candles pass OHLC validity: low <= open and close', async () => {
    const result = await provider.getCandles({ symbol: 'VNM', timeframe: '1D', limit: 100 });
    for (const c of result.candles) {
      expect(c.low).toBeLessThanOrEqual(c.open);
      expect(c.low).toBeLessThanOrEqual(c.close);
    }
  });

  it('volume > 0 for all candles', async () => {
    const result = await provider.getCandles({ symbol: 'HPG', timeframe: '1D', limit: 50 });
    for (const c of result.candles) {
      expect(c.volume).toBeGreaterThan(0);
    }
  });

  it('same symbol always returns identical data (deterministic)', async () => {
    const r1 = await provider.getCandles({ symbol: 'MBB', timeframe: '1D', limit: 10 });
    const r2 = await provider.getCandles({ symbol: 'MBB', timeframe: '1D', limit: 10 });
    expect(r1.candles).toEqual(r2.candles);
  });

  it('different symbols return different candle data', async () => {
    const r1 = await provider.getCandles({ symbol: 'MBB', timeframe: '1D', limit: 10 });
    const r2 = await provider.getCandles({ symbol: 'ACB', timeframe: '1D', limit: 10 });
    expect(r1.candles[0].close).not.toBe(r2.candles[0].close);
  });

  it('isMock is true', async () => {
    const result = await provider.getCandles({ symbol: 'FPT', timeframe: '1D', limit: 5 });
    expect(result.source.isMock).toBe(true);
    expect(provider.isMock).toBe(true);
  });

  it('priceUnit is thousands_vnd', async () => {
    const result = await provider.getCandles({ symbol: 'FPT', timeframe: '1D', limit: 5 });
    expect(result.source.priceUnit).toBe('thousands_vnd');
  });
});

describe('validateCandle', () => {
  const baseCandle: Candle = {
    timestamp: '2024-01-02T00:00:00.000Z',
    open: 20,
    high: 21,
    low: 19,
    close: 20.5,
    volume: 1_000_000,
  };

  it('accepts a valid candle', () => {
    expect(validateCandle(baseCandle)).toBe(true);
  });

  it('rejects candle with high < close', () => {
    expect(validateCandle({ ...baseCandle, high: 20, close: 21 })).toBe(false);
  });

  it('rejects candle with high < open', () => {
    expect(validateCandle({ ...baseCandle, high: 19, open: 20 })).toBe(false);
  });

  it('rejects candle with low > open', () => {
    expect(validateCandle({ ...baseCandle, low: 21, open: 20 })).toBe(false);
  });

  it('rejects candle with low > close', () => {
    expect(validateCandle({ ...baseCandle, low: 21, close: 20.5 })).toBe(false);
  });

  it('rejects candle with volume < 0', () => {
    expect(validateCandle({ ...baseCandle, volume: -1 })).toBe(false);
  });

  it('rejects candle with NaN price', () => {
    expect(validateCandle({ ...baseCandle, close: NaN })).toBe(false);
  });
});

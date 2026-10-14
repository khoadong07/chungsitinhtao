import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../app.js';
import { resetMarketDataProvider } from '../providers/provider-factory.js';
import { clearCache } from '../services/market-data.service.js';

describe('GET /api/v1/stocks/:symbol/candles', () => {
  beforeEach(() => {
    resetMarketDataProvider();
    clearCache();
  });

  it('returns 200 with correct shape for valid symbol', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/stocks/MBB/candles',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{
      symbol: string;
      timeframe: string;
      count: number;
      candles: unknown[];
      source: { isMock: boolean; provider: string; isStale: boolean };
    }>();
    expect(body.symbol).toBe('MBB');
    expect(body.timeframe).toBe('1D');
    expect(body.count).toBe(250);
    expect(body.candles).toHaveLength(250);
    expect(body.source.isMock).toBe(true);
    expect(body.source.provider).toBe('mock');
    expect(body.source.isStale).toBe(false);
  });

  it('returns exactly limit candles when limit param given', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/stocks/MBB/candles?limit=50',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ count: number; candles: unknown[] }>();
    expect(body.count).toBe(50);
    expect(body.candles).toHaveLength(50);
  });

  it('accepts lowercase symbol and normalizes to uppercase', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/stocks/mbb/candles?limit=5',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ symbol: string }>();
    expect(body.symbol).toBe('MBB');
  });

  it('returns 400 for symbol with spaces', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/stocks/invalid%20symbol/candles',
    });
    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('INVALID_SYMBOL');
  });

  it('returns 400 for single-char symbol', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/stocks/A/candles',
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when limit exceeds 500', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/stocks/MBB/candles?limit=1000',
    });
    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('INVALID_QUERY');
  });

  it('returns 400 when limit is 0', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/stocks/MBB/candles?limit=0',
    });
    expect(res.statusCode).toBe(400);
  });

  it('response includes source.isStale = false on first call', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/stocks/MBB/candles?limit=10',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ source: { isStale: boolean } }>();
    expect(body.source.isStale).toBe(false);
  });
});

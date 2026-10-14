import type { Candle, CandleResult, GetCandlesParams, MarketDataProvider } from './market-data.interface.js';
import { validateCandle } from './market-data.interface.js';
import { AppError, ProviderTimeoutError } from '../utils/errors.js';

const SSI_HEADERS = {
  accept: 'application/json, text/plain, */*',
  origin: 'https://iboard.ssi.com.vn',
  referer: 'https://iboard.ssi.com.vn/',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

interface SsiResponseData {
  t: number[];
  o: number[];
  h: number[];
  l: number[];
  c: number[];
  v: number[];
  s: string;
  nextTime: number | null;
}

interface SsiResponse {
  code: string;
  message: string;
  data: SsiResponseData;
  status: string;
}

function epochToIso(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toISOString();
}

export class SsiIboardProvider implements MarketDataProvider {
  readonly providerName = 'ssi-iboard';
  readonly isMock = false;

  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
  ) {}

  async getCandles(params: GetCandlesParams): Promise<CandleResult> {
    const { symbol, limit } = params;

    // Fetch enough history: go back limit*2 days to account for weekends/holidays
    const toEpoch = Math.floor(Date.now() / 1000);
    const fromEpoch = toEpoch - limit * 2 * 86400;

    const allCandles: Candle[] = await this.fetchAllPages(symbol, fromEpoch, toEpoch, limit);

    // Sort ascending and take last `limit`
    allCandles.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const candles = allCandles.slice(-limit);

    return {
      candles,
      source: {
        provider: this.providerName,
        isMock: false,
        fetchedAt: new Date().toISOString(),
        priceUnit: 'thousands_vnd',
      },
    };
  }

  private async fetchAllPages(
    symbol: string,
    fromEpoch: number,
    toEpoch: number,
    limit: number,
  ): Promise<Candle[]> {
    const collected: Candle[] = [];
    let currentFrom = fromEpoch;

    for (let page = 0; page < 10; page++) {
      const batch = await this.fetchPage(symbol, currentFrom, toEpoch);
      collected.push(...batch.candles);

      if (batch.nextTime === null || collected.length >= limit) break;
      currentFrom = batch.nextTime;
    }

    return collected;
  }

  private async fetchPage(
    symbol: string,
    fromEpoch: number,
    toEpoch: number,
  ): Promise<{ candles: Candle[]; nextTime: number | null }> {
    const url = new URL(`${this.baseUrl}/statistics/charts/history`);
    url.searchParams.set('resolution', '1D');
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('from', String(fromEpoch));
    url.searchParams.set('to', String(toEpoch));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        headers: SSI_HEADERS,
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ProviderTimeoutError();
      }
      throw new AppError('PROVIDER_FETCH_ERROR', `SSI fetch failed: ${String(err)}`, 503);
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      if (response.status === 429) {
        throw new AppError('PROVIDER_RATE_LIMIT', 'SSI iBoard rate limit exceeded', 429);
      }
      throw new AppError(
        'INVALID_PROVIDER_RESPONSE',
        `SSI returned HTTP ${response.status}`,
        502,
      );
    }

    let body: SsiResponse;
    try {
      body = (await response.json()) as SsiResponse;
    } catch {
      throw new AppError('INVALID_PROVIDER_RESPONSE', 'SSI response is not valid JSON', 502);
    }

    if (body.code !== 'SUCCESS' || body.data?.s !== 'ok') {
      throw new AppError(
        'INVALID_PROVIDER_RESPONSE',
        `SSI response error: code=${body.code}, s=${body.data?.s}`,
        502,
      );
    }

    const { t, o, h, l, c, v } = body.data;
    if (!Array.isArray(t) || t.length === 0) {
      return { candles: [], nextTime: null };
    }

    const candles: Candle[] = [];
    for (let i = 0; i < t.length; i++) {
      const candle: Candle = {
        timestamp: epochToIso(t[i]),
        open: o[i],
        high: h[i],
        low: l[i],
        close: c[i],
        volume: v[i],
      };
      if (!validateCandle(candle)) continue; // skip invalid candles, don't throw
      candles.push(candle);
    }

    return { candles, nextTime: body.data.nextTime };
  }
}

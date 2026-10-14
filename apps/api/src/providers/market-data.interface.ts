export interface Candle {
  timestamp: string; // ISO 8601
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface GetCandlesParams {
  symbol: string;
  timeframe: '1D';
  from?: string;
  to?: string;
  limit: number;
}

export interface CandleResult {
  candles: Candle[];
  source: {
    provider: string;
    isMock: boolean;
    fetchedAt: string;
    priceUnit: string;
  };
}

export interface MarketDataProvider {
  getCandles(params: GetCandlesParams): Promise<CandleResult>;
  readonly providerName: string;
  readonly isMock: boolean;
}

export function validateCandle(c: Candle): boolean {
  if (isNaN(c.open) || isNaN(c.high) || isNaN(c.low) || isNaN(c.close) || isNaN(c.volume)) {
    return false;
  }
  if (c.volume < 0) return false;
  if (c.high < c.open || c.high < c.close || c.high < c.low) return false;
  if (c.low > c.open || c.low > c.close || c.low > c.high) return false;
  return true;
}

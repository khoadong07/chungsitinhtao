export interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketDataProvider {
  getCandles(params: {
    symbol: string;
    timeframe: '1D';
    from?: string;
    to?: string;
    limit: number;
  }): Promise<Candle[]>;
}

export interface DataSourceMeta {
  provider: string;
  isMock: boolean;
  isStale: boolean;
  fetchedAt: string;
}

export interface PriceZone {
  lower: number;
  upper: number;
  type: 'support' | 'resistance';
  method: string;
  evidenceCount: number;
  lastObservedAt: string;
}

export interface IndicatorSnapshot {
  close: number;
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
  rsi14: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  atr14: number | null;
  volumeSma20: number | null;
  volumeRatio20: number | null;
}

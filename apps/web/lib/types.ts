export interface IndicatorSnapshot {
  timestamp: string;
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

export interface CandleWithIndicators {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20: number | null;
  ema50: number | null;
}

export interface DataQuality {
  totalCandles: number;
  hasEma20: boolean;
  hasEma50: boolean;
  hasEma200: boolean;
  hasRsi: boolean;
  hasMacd: boolean;
  hasAtr: boolean;
  hasVolumeSma: boolean;
}

export interface DataSource {
  provider: string;
  isMock: boolean;
  isStale: boolean;
  fetchedAt: string;
  priceUnit: string;
}

export interface PriceZone {
  lower: number;
  upper: number;
  type: 'support' | 'resistance';
  method: string;
  evidenceCount: number;
  lastObservedAt: string;
}

export interface TrendResult {
  classification: string;
  reasons: string[];
}

export interface MomentumResult {
  classification: string;
  reasons: string[];
}

export interface VolumeResult {
  classification: string;
  reasons: string[];
}

export interface SetupResult {
  classification: string;
  explanation: string;
}

export interface Scenario {
  name: string;
  trigger: string;
  invalidation: string;
  rationale: string[];
}

export interface DecisionResult {
  trend: TrendResult;
  momentum: MomentumResult;
  volume: VolumeResult;
  setup: SetupResult;
  scenarios: Scenario[];
  warnings: string[];
}

export interface TechnicalResult {
  snapshot: IndicatorSnapshot;
  candles: CandleWithIndicators[];
  dataQuality: DataQuality;
}

export interface SignalCount {
  negative: number;
  neutral: number;
  positive: number;
}

export interface BsiStockFilter {
  code: string;
  floor: string;
  closePrice: number;
  industry: string;
  marketCapBillion: number;
  pe: number;
  pb: number;
  ps: number;
  eps: number;
  bvps: number;
  roe: number;
  roa: number;
  beta: number;
  foreignOwnershipPct: number;
  high52W: number;
  low52W: number;
  perChange1D: number;
  perChange1M: number;
  perChange1Y: number;
  generalSignal: SignalCount;
  macdBelowSignal: boolean;
  rsiOversold: boolean;
  rsiOverbought: boolean;
}

export interface BsiValuation {
  closePriceVnd: number;
  peFairValue: number | null;
  pbFairValue: number | null;
  peEstimated: number | null;
  pbEstimated: number | null;
}

export interface BsiFundamentalData {
  filter: BsiStockFilter;
  valuation: BsiValuation;
  fetchedAt: string;
}

export interface AnalysisOutput {
  analysisId: string;
  symbol: string;
  asOf: string;
  dataSource: DataSource;
  technical: TechnicalResult;
  decision: DecisionResult;
  priceZones: PriceZone[];
  fundamental: BsiFundamentalData | null;
  warnings: string[];
  report: AnalysisReport | null;
  promptVersion: string | null;
  model: string | null;
}

export interface AnalysisReport {
  symbol: string;
  asOf: string;
  timeframe: string;
  summary: string;
  trend: TrendResult;
  momentum: MomentumResult;
  bullishFactors: string[];
  bearishFactors: string[];
  setup: SetupResult;
  scenarios: Scenario[];
  risks: string[];
  limitations: string[];
}

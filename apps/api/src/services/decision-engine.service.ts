import type { IndicatorSnapshot, TechnicalAnalysisResult } from './technical-analysis.service.js';
import type { PriceZone } from './support-resistance.service.js';

const RULES = {
  ema: {
    bullishRequiresCloseAboveEma20: true,
    bullishRequiresCloseAboveEma50: true,
    bullishRequiresEma20AboveEma50: true,
  },
  rsi: {
    oversold: 30,
    overbought: 70,
    momentum_threshold: 50,
  },
  volume: {
    highVolumeRatio: 1.5,
    lowVolumeRatio: 0.7,
  },
  macd: {
    histogramImprovingLookback: 3,
  },
} as const;

export type TrendClassification = 'bullish' | 'bearish' | 'mixed' | 'insufficient_data';
export type MomentumClassification =
  | 'improving'
  | 'weakening'
  | 'bullish'
  | 'bearish'
  | 'neutral'
  | 'insufficient_data';
export type VolumeClassification = 'high' | 'normal' | 'low' | 'insufficient_data';
export type SetupClassification =
  | 'potential_entry'
  | 'wait_for_confirmation'
  | 'hold_watch'
  | 'risk_elevated'
  | 'insufficient_data';

export interface TrendResult {
  classification: TrendClassification;
  reasons: string[];
}

export interface MomentumResult {
  classification: MomentumClassification;
  reasons: string[];
}

export interface VolumeResult {
  classification: VolumeClassification;
  reasons: string[];
}

export interface Scenario {
  name: 'bullish' | 'bearish';
  trigger: string;
  invalidation: string;
  rationale: string[];
}

export interface DecisionResult {
  trend: TrendResult;
  momentum: MomentumResult;
  volume: VolumeResult;
  setup: {
    classification: SetupClassification;
    explanation: string;
  };
  scenarios: Scenario[];
  warnings: string[];
}

export function classifyTrend(snapshot: IndicatorSnapshot): TrendResult {
  const { close, ema20, ema50, ema200 } = snapshot;
  const reasons: string[] = [];

  if (ema20 === null || ema50 === null) {
    return {
      classification: 'insufficient_data',
      reasons: ['EMA20 or EMA50 not yet available — insufficient candle history'],
    };
  }

  const closeAboveEma20 = close > ema20;
  const closeAboveEma50 = close > ema50;
  const ema20AboveEma50 = ema20 > ema50;

  if (closeAboveEma20) {
    reasons.push(`Close (${close.toFixed(2)}) is above EMA20 (${ema20.toFixed(2)})`);
  } else {
    reasons.push(`Close (${close.toFixed(2)}) is below EMA20 (${ema20.toFixed(2)})`);
  }

  if (closeAboveEma50) {
    reasons.push(`Close (${close.toFixed(2)}) is above EMA50 (${ema50.toFixed(2)})`);
  } else {
    reasons.push(`Close (${close.toFixed(2)}) is below EMA50 (${ema50.toFixed(2)})`);
  }

  if (ema20AboveEma50) {
    reasons.push(`EMA20 (${ema20.toFixed(2)}) is above EMA50 (${ema50.toFixed(2)}) — short-term trend positive`);
  } else {
    reasons.push(`EMA20 (${ema20.toFixed(2)}) is below EMA50 (${ema50.toFixed(2)}) — short-term trend negative`);
  }

  if (ema200 !== null) {
    if (close > ema200) {
      reasons.push(`Close is above EMA200 (${ema200.toFixed(2)}) — long-term trend supportive`);
    } else {
      reasons.push(`Close is below EMA200 (${ema200.toFixed(2)}) — long-term trend headwind`);
    }
  }

  const isBullish = closeAboveEma20 && closeAboveEma50 && ema20AboveEma50;
  const isBearish = !closeAboveEma20 && !closeAboveEma50 && !ema20AboveEma50;

  return {
    classification: isBullish ? 'bullish' : isBearish ? 'bearish' : 'mixed',
    reasons,
  };
}

function isHistogramImproving(recent: (number | null)[]): boolean {
  const valid = recent.filter((v): v is number => v !== null);
  if (valid.length < 2) return false;
  let improving = true;
  for (let i = 1; i < valid.length; i++) {
    if (valid[i] <= valid[i - 1]) { improving = false; break; }
  }
  return improving;
}

function isHistogramDeclining(recent: (number | null)[]): boolean {
  const valid = recent.filter((v): v is number => v !== null);
  if (valid.length < 2) return false;
  let declining = true;
  for (let i = 1; i < valid.length; i++) {
    if (valid[i] >= valid[i - 1]) { declining = false; break; }
  }
  return declining;
}

export function classifyMomentum(
  snapshot: IndicatorSnapshot,
  recentHistogram: (number | null)[],
): MomentumResult {
  const { rsi14, macd, macdHistogram } = snapshot;
  const reasons: string[] = [];

  if (rsi14 === null && macd === null) {
    return {
      classification: 'insufficient_data',
      reasons: ['RSI14 and MACD are both unavailable — insufficient candle history'],
    };
  }

  if (rsi14 !== null) {
    reasons.push(`RSI14 = ${rsi14.toFixed(2)} (${rsi14 > RULES.rsi.overbought ? 'overbought' : rsi14 < RULES.rsi.oversold ? 'oversold' : rsi14 > RULES.rsi.momentum_threshold ? 'above midline' : 'below midline'})`);
  }
  if (macd !== null) {
    reasons.push(`MACD = ${macd.toFixed(4)} (${macd > 0 ? 'positive' : 'negative'})`);
  }
  if (macdHistogram !== null) {
    reasons.push(`MACD histogram = ${macdHistogram.toFixed(4)}`);
  }

  // Bullish: all three positive and above thresholds
  if (rsi14 !== null && macd !== null && macdHistogram !== null &&
      rsi14 > RULES.rsi.momentum_threshold && macd > 0 && macdHistogram > 0) {
    reasons.push('RSI above 50, MACD positive, histogram positive — momentum bullish');
    return { classification: 'bullish', reasons };
  }

  // Bearish: all three negative
  if (rsi14 !== null && macd !== null && macdHistogram !== null &&
      rsi14 < RULES.rsi.momentum_threshold && macd < 0 && macdHistogram < 0) {
    reasons.push('RSI below 50, MACD negative, histogram negative — momentum bearish');
    return { classification: 'bearish', reasons };
  }

  const histImproving = isHistogramImproving(recentHistogram.slice(-RULES.macd.histogramImprovingLookback));
  const histDeclining = isHistogramDeclining(recentHistogram.slice(-RULES.macd.histogramImprovingLookback));

  // Improving
  const histPositive = macdHistogram !== null && macdHistogram > 0;
  const rsiBelow50 = rsi14 === null || rsi14 < RULES.rsi.momentum_threshold;
  const rsiBelow70 = rsi14 === null || rsi14 < RULES.rsi.overbought;

  if ((histPositive && rsiBelow50) || (histImproving && rsiBelow70)) {
    reasons.push('MACD histogram improving with RSI not yet overbought — momentum improving');
    return { classification: 'improving', reasons };
  }

  // Weakening
  const histNegative = macdHistogram !== null && macdHistogram < 0;
  const rsiAbove50 = rsi14 === null || rsi14 > RULES.rsi.momentum_threshold;
  const rsiAbove30 = rsi14 === null || rsi14 > RULES.rsi.oversold;

  if ((histNegative && rsiAbove50) || (histDeclining && rsiAbove30)) {
    reasons.push('MACD histogram declining with RSI not yet oversold — momentum weakening');
    return { classification: 'weakening', reasons };
  }

  reasons.push('Mixed signals — no clear momentum direction');
  return { classification: 'neutral', reasons };
}

export function classifyVolume(snapshot: IndicatorSnapshot): VolumeResult {
  const { volumeRatio20 } = snapshot;

  if (volumeRatio20 === null) {
    return {
      classification: 'insufficient_data',
      reasons: ['Volume SMA20 not yet available'],
    };
  }

  const reasons = [`Volume ratio vs 20-day avg: ${volumeRatio20.toFixed(2)}x`];

  if (volumeRatio20 >= RULES.volume.highVolumeRatio) {
    reasons.push(`Above ${RULES.volume.highVolumeRatio}x threshold — unusually high volume`);
    return { classification: 'high', reasons };
  }
  if (volumeRatio20 < RULES.volume.lowVolumeRatio) {
    reasons.push(`Below ${RULES.volume.lowVolumeRatio}x threshold — below-average volume`);
    return { classification: 'low', reasons };
  }

  reasons.push('Volume within normal range');
  return { classification: 'normal', reasons };
}

function classifySetup(
  trend: TrendResult,
  momentum: MomentumResult,
  volume: VolumeResult,
): { classification: SetupClassification; explanation: string } {
  const t = trend.classification;
  const m = momentum.classification;
  const v = volume.classification;

  if (t === 'insufficient_data' || m === 'insufficient_data') {
    return {
      classification: 'insufficient_data',
      explanation: 'Cannot classify setup — insufficient indicator data. Need at least 26 candles for MACD and 20 for EMA.',
    };
  }

  if (t === 'bullish' && (m === 'bullish' || m === 'improving') && v === 'high') {
    return {
      classification: 'potential_entry',
      explanation: `Bullish trend with ${m} momentum confirmed by high volume — favorable entry conditions.`,
    };
  }

  if (t === 'bearish' && (m === 'bearish' || m === 'weakening')) {
    return {
      classification: 'risk_elevated',
      explanation: `Bearish trend with ${m} momentum — risk elevated. Avoid new long positions until conditions improve.`,
    };
  }

  if (
    (t === 'bullish' && (m === 'neutral' || m === 'improving')) ||
    (t === 'mixed' && m === 'improving') ||
    (t === 'bearish' && m === 'improving')
  ) {
    return {
      classification: 'wait_for_confirmation',
      explanation: `Trend is ${t} with ${m} momentum — wait for clearer confirmation before acting. ${t === 'bearish' ? 'Possible early reversal signal.' : ''}`.trim(),
    };
  }

  return {
    classification: 'hold_watch',
    explanation: `Mixed or unclear conditions (trend: ${t}, momentum: ${m}, volume: ${v}). Monitor for clearer signals.`,
  };
}

function generateScenarios(snapshot: IndicatorSnapshot, priceZones: PriceZone[]): Scenario[] {
  const resistanceZones = priceZones.filter(z => z.type === 'resistance').sort((a, b) => a.lower - b.lower);
  const supportZones = priceZones.filter(z => z.type === 'support').sort((a, b) => b.upper - a.upper);

  const nearestResistance = resistanceZones.find(z => z.lower > snapshot.close) ?? resistanceZones[0];
  const nearestSupport = supportZones.find(z => z.upper < snapshot.close) ?? supportZones[0];

  const bullishRationale: string[] = [];
  if (snapshot.ema20 !== null && snapshot.close > snapshot.ema20) bullishRationale.push('Price above EMA20 supports upside continuation');
  if (snapshot.rsi14 !== null && snapshot.rsi14 > 50) bullishRationale.push(`RSI ${snapshot.rsi14.toFixed(1)} above midline`);
  if (snapshot.macdHistogram !== null && snapshot.macdHistogram > 0) bullishRationale.push('MACD histogram positive');
  if (bullishRationale.length === 0) bullishRationale.push('Monitor for bullish confirmation signals');

  const bearishRationale: string[] = [];
  if (snapshot.ema20 !== null && snapshot.close < snapshot.ema20) bearishRationale.push('Price below EMA20 supports downside continuation');
  if (snapshot.rsi14 !== null && snapshot.rsi14 < 50) bearishRationale.push(`RSI ${snapshot.rsi14.toFixed(1)} below midline`);
  if (snapshot.macdHistogram !== null && snapshot.macdHistogram < 0) bearishRationale.push('MACD histogram negative');
  if (bearishRationale.length === 0) bearishRationale.push('Monitor for bearish confirmation signals');

  const bullishTrigger = nearestResistance
    ? `Close above resistance zone ${nearestResistance.upper.toFixed(2)} with volume confirmation`
    : 'Close above recent swing high with volume confirmation';

  const bullishInvalidation = nearestSupport
    ? `Close below support zone ${nearestSupport.lower.toFixed(2)}`
    : snapshot.ema20 !== null
      ? `Close below EMA20 (${snapshot.ema20.toFixed(2)})`
      : 'Close below recent swing low';

  const bearishTrigger = nearestSupport
    ? `Close below support zone ${nearestSupport.lower.toFixed(2)}`
    : 'Close below recent swing low';

  const bearishInvalidation = nearestResistance
    ? `Close above resistance zone ${nearestResistance.upper.toFixed(2)}`
    : snapshot.ema50 !== null
      ? `Close above EMA50 (${snapshot.ema50.toFixed(2)})`
      : 'Close above recent swing high';

  return [
    {
      name: 'bullish',
      trigger: bullishTrigger,
      invalidation: bullishInvalidation,
      rationale: bullishRationale,
    },
    {
      name: 'bearish',
      trigger: bearishTrigger,
      invalidation: bearishInvalidation,
      rationale: bearishRationale,
    },
  ];
}

export function runDecisionEngine(
  snapshot: IndicatorSnapshot,
  recentHistogram: (number | null)[],
  priceZones: PriceZone[],
  dataQuality: TechnicalAnalysisResult['dataQuality'],
): DecisionResult {
  const trend = classifyTrend(snapshot);
  const momentum = classifyMomentum(snapshot, recentHistogram);
  const volume = classifyVolume(snapshot);
  const setup = classifySetup(trend, momentum, volume);
  const scenarios = generateScenarios(snapshot, priceZones);

  const warnings: string[] = [];
  if (!dataQuality.hasEma200) warnings.push('EMA200 unavailable — long-term trend context limited');
  if (!dataQuality.hasRsi) warnings.push('RSI unavailable — momentum assessment based on MACD only');
  if (!dataQuality.hasMacd) warnings.push('MACD unavailable — momentum assessment based on RSI only');

  return { trend, momentum, volume, setup, scenarios, warnings };
}

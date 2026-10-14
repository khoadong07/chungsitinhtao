import type { Candle } from '../providers/market-data.interface.js';
import { InsufficientDataError } from '../utils/errors.js';

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
  ema200: number | null;
  rsi14: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  atr14: number | null;
  volumeSma20: number | null;
  volumeRatio20: number | null;
}

export interface TechnicalAnalysisResult {
  candles: CandleWithIndicators[];
  snapshot: IndicatorSnapshot;
  dataQuality: {
    totalCandles: number;
    hasEma20: boolean;
    hasEma50: boolean;
    hasEma200: boolean;
    hasRsi: boolean;
    hasMacd: boolean;
    hasAtr: boolean;
    hasVolumeSma: boolean;
  };
}

function calcEma(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < period) return result;

  const mult = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += closes[i];
  result[period - 1] = sum / period;

  for (let i = period; i < closes.length; i++) {
    result[i] = closes[i] * mult + (result[i - 1] as number) * (1 - mult);
  }
  return result;
}

function calcRsi14(closes: number[]): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < 15) return result;

  // First avg gain/loss from first 14 changes (indices 1..14)
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= 14; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += -change;
  }
  avgGain /= 14;
  avgLoss /= 14;

  const rsiAt = (ag: number, al: number): number => {
    if (al === 0 && ag === 0) return 50;
    if (al === 0) return 100;
    return 100 - 100 / (1 + ag / al);
  };

  result[14] = rsiAt(avgGain, avgLoss);

  for (let i = 15; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * 13 + gain) / 14;
    avgLoss = (avgLoss * 13 + loss) / 14;
    result[i] = rsiAt(avgGain, avgLoss);
  }
  return result;
}

function calcMacd(
  ema12: (number | null)[],
  ema26: (number | null)[],
): {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
} {
  const n = ema12.length;
  const macd: (number | null)[] = new Array(n).fill(null);
  const signal: (number | null)[] = new Array(n).fill(null);
  const histogram: (number | null)[] = new Array(n).fill(null);

  for (let i = 0; i < n; i++) {
    if (ema12[i] !== null && ema26[i] !== null) {
      macd[i] = (ema12[i] as number) - (ema26[i] as number);
    }
  }

  // Signal = EMA9 of macd values (only non-null ones, preserving index)
  const macdMult = 2 / (9 + 1);
  let signalVal: number | null = null;
  let validCount = 0;
  let smaSum = 0;

  for (let i = 0; i < n; i++) {
    if (macd[i] === null) continue;
    const m = macd[i] as number;

    if (signalVal === null) {
      validCount++;
      smaSum += m;
      if (validCount === 9) {
        signalVal = smaSum / 9;
        signal[i] = signalVal;
      }
    } else {
      signalVal = m * macdMult + signalVal * (1 - macdMult);
      signal[i] = signalVal;
    }
  }

  for (let i = 0; i < n; i++) {
    if (macd[i] !== null && signal[i] !== null) {
      histogram[i] = (macd[i] as number) - (signal[i] as number);
    }
  }

  return { macd, signal, histogram };
}

function calcAtr14(candles: Candle[]): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length < 14) return result;

  const tr: number[] = candles.map((c, i) => {
    const hl = c.high - c.low;
    if (i === 0) return hl;
    const prevClose = candles[i - 1].close;
    return Math.max(hl, Math.abs(c.high - prevClose), Math.abs(c.low - prevClose));
  });

  let atr = 0;
  for (let i = 0; i < 14; i++) atr += tr[i];
  atr /= 14;
  result[13] = atr;

  for (let i = 14; i < candles.length; i++) {
    atr = (atr * 13 + tr[i]) / 14;
    result[i] = atr;
  }
  return result;
}

function calcVolumeSma20(candles: Candle[]): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  for (let i = 19; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - 19; j <= i; j++) sum += candles[j].volume;
    result[i] = sum / 20;
  }
  return result;
}

function round4(v: number | null): number | null {
  if (v === null) return null;
  return Math.round(v * 10000) / 10000;
}

export function calculateIndicators(candles: Candle[]): TechnicalAnalysisResult {
  if (candles.length === 0) throw new InsufficientDataError(1, 0);

  const closes = candles.map((c) => c.close);

  const ema20 = calcEma(closes, 20);
  const ema50 = calcEma(closes, 50);
  const ema200 = calcEma(closes, 200);
  const rsi14 = calcRsi14(closes);
  const ema12 = calcEma(closes, 12);
  const ema26 = calcEma(closes, 26);
  const { macd, signal, histogram } = calcMacd(ema12, ema26);
  const atr14 = calcAtr14(candles);
  const volSma20 = calcVolumeSma20(candles);

  const result: CandleWithIndicators[] = candles.map((c, i) => {
    const vs = volSma20[i];
    const vr = vs !== null && vs !== 0 ? c.volume / vs : null;
    return {
      timestamp: c.timestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
      ema20: ema20[i],
      ema50: ema50[i],
      ema200: ema200[i],
      rsi14: rsi14[i],
      macd: macd[i],
      macdSignal: signal[i],
      macdHistogram: histogram[i],
      atr14: atr14[i],
      volumeSma20: vs,
      volumeRatio20: vr,
    };
  });

  const last = result[result.length - 1];
  const snapshot: IndicatorSnapshot = {
    timestamp: last.timestamp,
    close: last.close,
    ema20: round4(last.ema20),
    ema50: round4(last.ema50),
    ema200: round4(last.ema200),
    rsi14: round4(last.rsi14),
    macd: round4(last.macd),
    macdSignal: round4(last.macdSignal),
    macdHistogram: round4(last.macdHistogram),
    atr14: round4(last.atr14),
    volumeSma20: round4(last.volumeSma20),
    volumeRatio20: round4(last.volumeRatio20),
  };

  return {
    candles: result,
    snapshot,
    dataQuality: {
      totalCandles: candles.length,
      hasEma20: snapshot.ema20 !== null,
      hasEma50: snapshot.ema50 !== null,
      hasEma200: snapshot.ema200 !== null,
      hasRsi: snapshot.rsi14 !== null,
      hasMacd: snapshot.macd !== null,
      hasAtr: snapshot.atr14 !== null,
      hasVolumeSma: snapshot.volumeSma20 !== null,
    },
  };
}

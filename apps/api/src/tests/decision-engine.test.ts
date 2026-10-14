import { describe, it, expect } from 'vitest';
import {
  runDecisionEngine,
  classifyTrend,
  classifyMomentum,
  classifyVolume,
} from '../services/decision-engine.service.js';
import type { IndicatorSnapshot, TechnicalAnalysisResult } from '../services/technical-analysis.service.js';
import type { PriceZone } from '../services/support-resistance.service.js';

function makeSnapshot(overrides: Partial<IndicatorSnapshot> = {}): IndicatorSnapshot {
  return {
    timestamp: '2024-06-01T00:00:00.000Z',
    close: 60,
    ema20: 58,
    ema50: 55,
    ema200: 50,
    rsi14: 55,
    macd: 0.5,
    macdSignal: 0.3,
    macdHistogram: 0.2,
    atr14: 1.5,
    volumeSma20: 10000000,
    volumeRatio20: 1.6,
    ...overrides,
  };
}

const fullDataQuality: TechnicalAnalysisResult['dataQuality'] = {
  totalCandles: 250,
  hasEma20: true,
  hasEma50: true,
  hasEma200: true,
  hasRsi: true,
  hasMacd: true,
  hasAtr: true,
  hasVolumeSma: true,
};

const noZones: PriceZone[] = [];
const histogram5: (number | null)[] = [0.1, 0.15, 0.18, 0.2, 0.22];

describe('classifyTrend', () => {
  it('bullish: close > ema20 > ema50 and close above both', () => {
    const snap = makeSnapshot({ close: 60, ema20: 58, ema50: 55 });
    const result = classifyTrend(snap);
    expect(result.classification).toBe('bullish');
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('bearish: close < ema20 < ema50', () => {
    const snap = makeSnapshot({ close: 50, ema20: 53, ema50: 56 });
    const result = classifyTrend(snap);
    expect(result.classification).toBe('bearish');
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('mixed: close above ema20 but ema20 below ema50', () => {
    const snap = makeSnapshot({ close: 54, ema20: 53, ema50: 55 });
    const result = classifyTrend(snap);
    expect(result.classification).toBe('mixed');
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('insufficient_data: ema20 null', () => {
    const snap = makeSnapshot({ ema20: null });
    const result = classifyTrend(snap);
    expect(result.classification).toBe('insufficient_data');
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('insufficient_data: ema50 null', () => {
    const snap = makeSnapshot({ ema50: null });
    const result = classifyTrend(snap);
    expect(result.classification).toBe('insufficient_data');
  });
});

describe('classifyMomentum', () => {
  it('bullish: rsi>50, macd>0, histogram>0', () => {
    const snap = makeSnapshot({ rsi14: 60, macd: 0.5, macdHistogram: 0.2 });
    const result = classifyMomentum(snap, histogram5);
    expect(result.classification).toBe('bullish');
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('bearish: rsi<50, macd<0, histogram<0', () => {
    const snap = makeSnapshot({ rsi14: 40, macd: -0.5, macdHistogram: -0.2 });
    const result = classifyMomentum(snap, [-0.5, -0.4, -0.3, -0.25, -0.2]);
    expect(result.classification).toBe('bearish');
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('insufficient_data: both rsi and macd null', () => {
    const snap = makeSnapshot({ rsi14: null, macd: null, macdHistogram: null });
    const result = classifyMomentum(snap, []);
    expect(result.classification).toBe('insufficient_data');
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('improving: histogram trending up and rsi below 50', () => {
    const snap = makeSnapshot({ rsi14: 45, macd: 0.1, macdHistogram: 0.1 });
    const result = classifyMomentum(snap, [0.05, 0.07, 0.09]);
    expect(['improving', 'bullish']).toContain(result.classification);
  });
});

describe('classifyVolume', () => {
  it('high: volumeRatio >= 1.5', () => {
    const result = classifyVolume(makeSnapshot({ volumeRatio20: 1.8 }));
    expect(result.classification).toBe('high');
  });

  it('low: volumeRatio < 0.7', () => {
    const result = classifyVolume(makeSnapshot({ volumeRatio20: 0.5 }));
    expect(result.classification).toBe('low');
  });

  it('normal: volumeRatio between 0.7 and 1.5', () => {
    const result = classifyVolume(makeSnapshot({ volumeRatio20: 1.0 }));
    expect(result.classification).toBe('normal');
  });

  it('insufficient_data: volumeRatio null', () => {
    const result = classifyVolume(makeSnapshot({ volumeRatio20: null }));
    expect(result.classification).toBe('insufficient_data');
  });
});

describe('runDecisionEngine — setup', () => {
  it('potential_entry: bullish trend + bullish momentum + high volume', () => {
    const snap = makeSnapshot({ close: 60, ema20: 58, ema50: 55, rsi14: 60, macd: 0.5, macdHistogram: 0.2, volumeRatio20: 1.8 });
    const result = runDecisionEngine(snap, histogram5, noZones, fullDataQuality);
    expect(result.setup.classification).toBe('potential_entry');
    expect(result.setup.explanation.length).toBeGreaterThan(0);
  });

  it('risk_elevated: bearish trend + bearish momentum', () => {
    const snap = makeSnapshot({ close: 50, ema20: 53, ema50: 56, rsi14: 40, macd: -0.5, macdHistogram: -0.2, volumeRatio20: 1.0 });
    const result = runDecisionEngine(snap, [-0.5, -0.4, -0.3, -0.25, -0.2], noZones, fullDataQuality);
    expect(result.setup.classification).toBe('risk_elevated');
  });

  it('insufficient_data: ema20 null → setup insufficient_data', () => {
    const snap = makeSnapshot({ ema20: null, ema50: null });
    const result = runDecisionEngine(snap, [], noZones, { ...fullDataQuality, hasEma20: false, hasEma50: false });
    expect(result.setup.classification).toBe('insufficient_data');
  });

  it('deterministic: same inputs always produce same output', () => {
    const snap = makeSnapshot();
    const r1 = runDecisionEngine(snap, histogram5, noZones, fullDataQuality);
    const r2 = runDecisionEngine(snap, histogram5, noZones, fullDataQuality);
    expect(r1.setup.classification).toBe(r2.setup.classification);
    expect(r1.trend.classification).toBe(r2.trend.classification);
    expect(r1.momentum.classification).toBe(r2.momentum.classification);
  });
});

describe('runDecisionEngine — scenarios', () => {
  it('always returns exactly 2 scenarios', () => {
    const result = runDecisionEngine(makeSnapshot(), histogram5, noZones, fullDataQuality);
    expect(result.scenarios).toHaveLength(2);
    expect(result.scenarios[0].name).toBe('bullish');
    expect(result.scenarios[1].name).toBe('bearish');
  });

  it('each scenario has trigger, invalidation, and non-empty rationale', () => {
    const result = runDecisionEngine(makeSnapshot(), histogram5, noZones, fullDataQuality);
    for (const s of result.scenarios) {
      expect(s.trigger.length).toBeGreaterThan(0);
      expect(s.invalidation.length).toBeGreaterThan(0);
      expect(s.rationale.length).toBeGreaterThan(0);
    }
  });

  it('uses price zones in trigger/invalidation when provided', () => {
    const zones: PriceZone[] = [
      { lower: 65, upper: 66, type: 'resistance', method: 'swing', evidenceCount: 3, lastObservedAt: '2024-05-01T00:00:00.000Z' },
      { lower: 55, upper: 56, type: 'support', method: 'swing', evidenceCount: 3, lastObservedAt: '2024-04-01T00:00:00.000Z' },
    ];
    const result = runDecisionEngine(makeSnapshot(), histogram5, zones, fullDataQuality);
    const bullish = result.scenarios.find(s => s.name === 'bullish')!;
    const bearish = result.scenarios.find(s => s.name === 'bearish')!;
    expect(bullish.trigger).toContain('66');
    expect(bearish.trigger).toContain('55');
  });
});

describe('runDecisionEngine — warnings', () => {
  it('adds warning when EMA200 unavailable', () => {
    const result = runDecisionEngine(
      makeSnapshot({ ema200: null }),
      histogram5,
      noZones,
      { ...fullDataQuality, hasEma200: false },
    );
    expect(result.warnings.some(w => w.includes('EMA200'))).toBe(true);
  });
});

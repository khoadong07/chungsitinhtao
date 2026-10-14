import { describe, it, expect } from 'vitest';
import { calculateIndicators } from '../services/technical-analysis.service.js';
import { InsufficientDataError } from '../utils/errors.js';
import type { Candle } from '../providers/market-data.interface.js';

function makeFixtureCandles(count: number): Candle[] {
  const candles: Candle[] = [];
  let price = 50.0;
  const startDate = new Date('2024-01-02T00:00:00.000Z');
  for (let i = 0; i < count; i++) {
    const date = new Date(startDate.getTime() + i * 86400000);
    const change = Math.sin(i / 10) * 0.5 + 0.05;
    price = price + change;
    const open = price;
    const close = price + Math.sin(i / 5) * 0.3;
    const high = Math.max(open, close) + 0.5;
    const low = Math.min(open, close) - 0.5;
    candles.push({
      timestamp: date.toISOString(),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: 1000000 + i * 1000,
    });
  }
  return candles;
}

function makeRisingCandles(count: number): Candle[] {
  const candles: Candle[] = [];
  const startDate = new Date('2024-01-02T00:00:00.000Z');
  for (let i = 0; i < count; i++) {
    const date = new Date(startDate.getTime() + i * 86400000);
    const base = 50 + i * 0.5;
    candles.push({
      timestamp: date.toISOString(),
      open: base,
      high: base + 0.5,
      low: base - 0.1,
      close: base + 0.4,
      volume: 1000000,
    });
  }
  return candles;
}

describe('calculateIndicators', () => {
  it('throws InsufficientDataError for empty input', () => {
    expect(() => calculateIndicators([])).toThrow(InsufficientDataError);
  });

  it('output candles are aligned with input (same length and timestamps)', () => {
    const input = makeFixtureCandles(30);
    const { candles } = calculateIndicators(input);
    expect(candles.length).toBe(input.length);
    for (let i = 0; i < input.length; i++) {
      expect(candles[i].timestamp).toBe(input[i].timestamp);
    }
  });

  describe('EMA', () => {
    it('250 candles: ema20, ema50, ema200 non-null in snapshot', () => {
      const { snapshot } = calculateIndicators(makeFixtureCandles(250));
      expect(snapshot.ema20).not.toBeNull();
      expect(snapshot.ema50).not.toBeNull();
      expect(snapshot.ema200).not.toBeNull();
    });

    it('19 candles: ema20 is null for all candles', () => {
      const { candles } = calculateIndicators(makeFixtureCandles(19));
      expect(candles.every((c) => c.ema20 === null)).toBe(true);
    });

    it('20 candles: ema20 non-null only for last candle', () => {
      const { candles } = calculateIndicators(makeFixtureCandles(20));
      expect(candles[18].ema20).toBeNull();
      expect(candles[19].ema20).not.toBeNull();
    });

    it('EMA20 snapshot is a finite number close to close price', () => {
      const { snapshot } = calculateIndicators(makeFixtureCandles(250));
      expect(typeof snapshot.ema20).toBe('number');
      expect(Number.isFinite(snapshot.ema20)).toBe(true);
      // EMA20 tracks recent closes — should be within 20% of current close
      const ratio = Math.abs((snapshot.ema20 as number) - snapshot.close) / snapshot.close;
      expect(ratio).toBeLessThan(0.2);
    });

    it('EMA20 and EMA50 are distinct values', () => {
      const { snapshot } = calculateIndicators(makeFixtureCandles(250));
      expect(snapshot.ema20).not.toBe(snapshot.ema50);
    });
  });

  describe('RSI', () => {
    it('14 candles: RSI is null', () => {
      const { snapshot } = calculateIndicators(makeFixtureCandles(14));
      expect(snapshot.rsi14).toBeNull();
    });

    it('15 candles: RSI non-null for last candle', () => {
      const { candles } = calculateIndicators(makeFixtureCandles(15));
      expect(candles[14].rsi14).not.toBeNull();
    });

    it('RSI is between 0 and 100', () => {
      const { snapshot } = calculateIndicators(makeFixtureCandles(250));
      expect(snapshot.rsi14).not.toBeNull();
      expect(snapshot.rsi14 as number).toBeGreaterThanOrEqual(0);
      expect(snapshot.rsi14 as number).toBeLessThanOrEqual(100);
    });

    it('all-gaining prices yield RSI near 100', () => {
      const { snapshot } = calculateIndicators(makeRisingCandles(50));
      expect(snapshot.rsi14).not.toBeNull();
      expect(snapshot.rsi14 as number).toBeGreaterThan(90);
    });
  });

  describe('MACD', () => {
    it('250 candles: macd, macdSignal, macdHistogram all non-null', () => {
      const { snapshot } = calculateIndicators(makeFixtureCandles(250));
      expect(snapshot.macd).not.toBeNull();
      expect(snapshot.macdSignal).not.toBeNull();
      expect(snapshot.macdHistogram).not.toBeNull();
    });

    it('25 candles: macd is null (EMA26 needs 26)', () => {
      const { snapshot } = calculateIndicators(makeFixtureCandles(25));
      expect(snapshot.macd).toBeNull();
    });

    it('26 candles: macd non-null, signal null', () => {
      const { snapshot } = calculateIndicators(makeFixtureCandles(26));
      expect(snapshot.macd).not.toBeNull();
      expect(snapshot.macdSignal).toBeNull();
    });

    it('histogram = macd - signal within floating point tolerance', () => {
      const { snapshot } = calculateIndicators(makeFixtureCandles(250));
      const diff = Math.abs(
        (snapshot.macdHistogram as number) -
          ((snapshot.macd as number) - (snapshot.macdSignal as number)),
      );
      expect(diff).toBeLessThan(1e-8);
    });
  });

  describe('ATR', () => {
    it('13 candles: ATR is null', () => {
      const { snapshot } = calculateIndicators(makeFixtureCandles(13));
      expect(snapshot.atr14).toBeNull();
    });

    it('14 candles: ATR non-null', () => {
      const { snapshot } = calculateIndicators(makeFixtureCandles(14));
      expect(snapshot.atr14).not.toBeNull();
    });

    it('ATR > 0 for valid candles', () => {
      const { snapshot } = calculateIndicators(makeFixtureCandles(50));
      expect(snapshot.atr14).not.toBeNull();
      expect(snapshot.atr14 as number).toBeGreaterThan(0);
    });
  });

  describe('Volume SMA', () => {
    it('19 candles: volumeSma20 null', () => {
      const { snapshot } = calculateIndicators(makeFixtureCandles(19));
      expect(snapshot.volumeSma20).toBeNull();
    });

    it('20 candles: volumeSma20 non-null', () => {
      const { snapshot } = calculateIndicators(makeFixtureCandles(20));
      expect(snapshot.volumeSma20).not.toBeNull();
    });

    it('volumeRatio20 = volume / volumeSma20', () => {
      const candles = makeFixtureCandles(25);
      const { candles: out } = calculateIndicators(candles);
      const last = out[out.length - 1];
      if (last.volumeSma20 !== null && last.volumeRatio20 !== null) {
        const expected = last.volume / last.volumeSma20;
        expect(Math.abs(last.volumeRatio20 - expected)).toBeLessThan(1e-10);
      }
    });
  });

  describe('dataQuality', () => {
    it('250 candles: all flags true', () => {
      const { dataQuality } = calculateIndicators(makeFixtureCandles(250));
      expect(dataQuality.hasEma20).toBe(true);
      expect(dataQuality.hasEma50).toBe(true);
      expect(dataQuality.hasEma200).toBe(true);
      expect(dataQuality.hasRsi).toBe(true);
      expect(dataQuality.hasMacd).toBe(true);
      expect(dataQuality.hasAtr).toBe(true);
      expect(dataQuality.hasVolumeSma).toBe(true);
    });

    it('5 candles: all flags false', () => {
      const { dataQuality } = calculateIndicators(makeFixtureCandles(5));
      expect(dataQuality.hasEma20).toBe(false);
      expect(dataQuality.hasEma50).toBe(false);
      expect(dataQuality.hasEma200).toBe(false);
      expect(dataQuality.hasRsi).toBe(false);
      expect(dataQuality.hasMacd).toBe(false);
      expect(dataQuality.hasAtr).toBe(false);
      expect(dataQuality.hasVolumeSma).toBe(false);
    });
  });
});

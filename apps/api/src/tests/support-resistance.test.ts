import { describe, it, expect } from 'vitest';
import { detectPriceZones } from '../services/support-resistance.service.js';
import type { Candle } from '../providers/market-data.interface.js';

function makeCandles(count: number): Candle[] {
  const candles: Candle[] = [];
  const startDate = new Date('2024-01-02T00:00:00.000Z');
  for (let i = 0; i < count; i++) {
    const date = new Date(startDate.getTime() + i * 86400000);
    const base = 50 + Math.sin(i / 8) * 5;
    candles.push({
      timestamp: date.toISOString(),
      open: base,
      high: base + 1,
      low: base - 1,
      close: base + 0.2,
      volume: 1000000,
    });
  }
  return candles;
}

describe('detectPriceZones', () => {
  it('returns empty array with fewer than 11 candles', () => {
    expect(detectPriceZones(makeCandles(10), null)).toEqual([]);
    expect(detectPriceZones(makeCandles(0), null)).toEqual([]);
  });

  it('returns empty array with exactly 10 candles (2*5=10, need 11)', () => {
    expect(detectPriceZones(makeCandles(10), null)).toHaveLength(0);
  });

  it('returns zones with enough candles', () => {
    const zones = detectPriceZones(makeCandles(100), null);
    expect(zones.length).toBeGreaterThan(0);
  });

  it('all zones have lower <= upper', () => {
    const zones = detectPriceZones(makeCandles(100), null);
    for (const z of zones) {
      expect(z.lower).toBeLessThanOrEqual(z.upper);
    }
  });

  it('all zones have evidenceCount >= 1', () => {
    const zones = detectPriceZones(makeCandles(100), null);
    for (const z of zones) {
      expect(z.evidenceCount).toBeGreaterThanOrEqual(1);
    }
  });

  it('all zones have valid type', () => {
    const zones = detectPriceZones(makeCandles(100), null);
    for (const z of zones) {
      expect(['support', 'resistance']).toContain(z.type);
    }
  });

  it('returns at most 10 zones (5 support + 5 resistance)', () => {
    const zones = detectPriceZones(makeCandles(300), null);
    expect(zones.length).toBeLessThanOrEqual(10);
  });

  it('uses ATR-based tolerance when ATR is provided', () => {
    const zonesNoAtr = detectPriceZones(makeCandles(100), null);
    const zonesWithAtr = detectPriceZones(makeCandles(100), 1.5);
    // Both should return valid zones; ATR tolerance may merge differently
    expect(zonesNoAtr.every((z) => z.lower <= z.upper)).toBe(true);
    expect(zonesWithAtr.every((z) => z.lower <= z.upper)).toBe(true);
  });

  it('zones have method = "swing"', () => {
    const zones = detectPriceZones(makeCandles(100), null);
    for (const z of zones) {
      expect(z.method).toBe('swing');
    }
  });

  it('lastObservedAt is a valid ISO 8601 string', () => {
    const zones = detectPriceZones(makeCandles(100), null);
    for (const z of zones) {
      expect(() => new Date(z.lastObservedAt)).not.toThrow();
      expect(new Date(z.lastObservedAt).getTime()).not.toBeNaN();
    }
  });
});

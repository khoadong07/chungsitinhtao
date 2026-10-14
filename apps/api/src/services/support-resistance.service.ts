import type { Candle } from '../providers/market-data.interface.js';

export interface PriceZone {
  lower: number;
  upper: number;
  type: 'support' | 'resistance';
  method: string;
  evidenceCount: number;
  lastObservedAt: string;
}

const SWING_WINDOW = 5;

interface SwingPoint {
  price: number;
  timestamp: string;
  type: 'high' | 'low';
}

function clusterPoints(
  points: SwingPoint[],
  tolerance: number,
  zoneType: 'support' | 'resistance',
): PriceZone[] {
  if (points.length === 0) return [];

  const sorted = [...points].sort((a, b) => a.price - b.price);
  const zones: PriceZone[] = [];
  let cluster: SwingPoint[] = [sorted[0]];

  const flush = () => {
    const prices = cluster.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const half = tolerance / 2;
    const lastObs = cluster.reduce((best, p) =>
      p.timestamp > best.timestamp ? p : best,
    );
    zones.push({
      lower: Math.round((min - half) * 100000) / 100000,
      upper: Math.round((max + half) * 100000) / 100000,
      type: zoneType,
      method: 'swing',
      evidenceCount: cluster.length,
      lastObservedAt: lastObs.timestamp,
    });
  };

  for (let i = 1; i < sorted.length; i++) {
    const refPrice = cluster[cluster.length - 1].price;
    if (sorted[i].price - refPrice <= tolerance) {
      cluster.push(sorted[i]);
    } else {
      flush();
      cluster = [sorted[i]];
    }
  }
  flush();

  return zones;
}

export function detectPriceZones(candles: Candle[], atr: number | null): PriceZone[] {
  const minLen = 2 * SWING_WINDOW + 1;
  if (candles.length < minLen) return [];

  const swingHighs: SwingPoint[] = [];
  const swingLows: SwingPoint[] = [];

  for (let i = SWING_WINDOW; i < candles.length - SWING_WINDOW; i++) {
    const c = candles[i];
    let isHigh = true;
    let isLow = true;
    for (let j = i - SWING_WINDOW; j <= i + SWING_WINDOW; j++) {
      if (j === i) continue;
      if (candles[j].high >= c.high) isHigh = false;
      if (candles[j].low <= c.low) isLow = false;
    }
    if (isHigh) swingHighs.push({ price: c.high, timestamp: c.timestamp, type: 'high' });
    if (isLow) swingLows.push({ price: c.low, timestamp: c.timestamp, type: 'low' });
  }

  const lastClose = candles[candles.length - 1].close;
  const getTolerance = (price: number) =>
    atr !== null ? atr * 0.5 : price * 0.015;

  const supportZones = clusterPoints(swingLows, getTolerance(lastClose), 'support')
    .sort((a, b) => b.evidenceCount - a.evidenceCount)
    .slice(0, 5);

  const resistanceZones = clusterPoints(swingHighs, getTolerance(lastClose), 'resistance')
    .sort((a, b) => b.evidenceCount - a.evidenceCount)
    .slice(0, 5);

  return [...supportZones, ...resistanceZones];
}

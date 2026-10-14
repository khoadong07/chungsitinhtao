'use client';

import { useEffect, useRef } from 'react';
import type { CandleWithIndicators } from '../lib/types';
import {
  createChart,
  ColorType,
  type IChartApi,
  type CandlestickData,
  type Time,
  type HistogramData,
  type LineData,
} from 'lightweight-charts';

interface CandlestickChartProps {
  candles: CandleWithIndicators[];
  symbol: string;
}

function toTime(iso: string): Time {
  return iso.slice(0, 10) as Time;
}

export default function CandlestickChart({ candles, symbol }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f172a' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#334155' },
      timeScale: { borderColor: '#334155', timeVisible: false },
      width: containerRef.current.clientWidth,
      height: 360,
    });
    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });
    const candleData: CandlestickData[] = candles.map(c => ({
      time: toTime(c.timestamp),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeries.setData(candleData);

    const volSeries = chart.addHistogramSeries({
      color: '#3b82f680',
      priceFormat: { type: 'volume' },
      priceScaleId: 'vol',
    });
    chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    const volData: HistogramData[] = candles.map(c => ({
      time: toTime(c.timestamp),
      value: c.volume,
      color: c.close >= c.open ? '#22c55e40' : '#ef444440',
    }));
    volSeries.setData(volData);

    const ema20Data: LineData[] = candles
      .filter(c => c.ema20 !== null)
      .map(c => ({ time: toTime(c.timestamp), value: c.ema20 as number }));
    if (ema20Data.length > 0) {
      const ema20Series = chart.addLineSeries({ color: '#3b82f6', lineWidth: 1, title: 'EMA20' });
      ema20Series.setData(ema20Data);
    }

    const ema50Data: LineData[] = candles
      .filter(c => c.ema50 !== null)
      .map(c => ({ time: toTime(c.timestamp), value: c.ema50 as number }));
    if (ema50Data.length > 0) {
      const ema50Series = chart.addLineSeries({ color: '#f97316', lineWidth: 1, title: 'EMA50' });
      ema50Series.setData(ema50Data);
    }

    chart.timeScale().fitContent();

    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width) chart.applyOptions({ width });
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [candles]);

  return (
    <div className="bg-gray-900 rounded-lg p-3">
      <p className="text-xs text-gray-400 mb-2 font-medium">{symbol} · 1D · EMA20 <span className="text-blue-400">■</span> EMA50 <span className="text-orange-400">■</span></p>
      <div ref={containerRef} />
    </div>
  );
}

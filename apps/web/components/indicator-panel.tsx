import type { IndicatorSnapshot } from '../lib/types';

interface IndicatorPanelProps { snapshot: IndicatorSnapshot; }

function fmt(v: number | null, d = 2) { return v === null ? 'N/A' : v.toFixed(d); }

function rsiColor(v: number | null) {
  if (v === null) return '#94a3b8';
  if (v > 70) return '#f43f5e';
  if (v < 30) return '#10b981';
  return '#f8fafc';
}
function histColor(v: number | null) { return v === null ? '#94a3b8' : v >= 0 ? '#10b981' : '#f43f5e'; }

interface MetricProps { label: string; value: string; sub?: string; subClr?: string; color?: string; bg?: string; delay?: string; }
function Metric({ label, value, sub, subClr, color = '#f8fafc', bg = 'rgba(255,255,255,0.04)', delay = '0ms' }: MetricProps) {
  return (
    <div className="rounded-xl p-3 hover-lift anim-scale"
      style={{ background: bg, border: '1px solid rgba(255,255,255,0.07)', animationDelay: delay }}>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">{label}</p>
      <p className="text-lg font-bold tabular-nums metric-in" style={{ color, animationDelay: delay }}>{value}</p>
      {sub && <p className="text-[10px] mt-1 font-medium" style={{ color: subClr ?? '#64748b' }}>{sub}</p>}
    </div>
  );
}

export function IndicatorPanel({ snapshot }: IndicatorPanelProps) {
  const histSign = snapshot.macdHistogram !== null ? (snapshot.macdHistogram >= 0 ? '+' : '') : '';
  const rsi = snapshot.rsi14;
  const rsiSub = rsi === null ? undefined : rsi > 70 ? 'Quá mua' : rsi < 30 ? 'Quá bán' : 'Trung tính';
  const rsiSubClr = rsi === null ? undefined : rsi > 70 ? '#f43f5e' : rsi < 30 ? '#10b981' : '#64748b';
  const rsiBg = rsi === null ? undefined : rsi > 70 ? 'rgba(244,63,94,0.07)' : rsi < 30 ? 'rgba(16,185,129,0.07)' : undefined;
  const volHigh = snapshot.volumeRatio20 !== null && snapshot.volumeRatio20 > 1.5;
  const histNeg = snapshot.macdHistogram !== null && snapshot.macdHistogram < 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="RSI 14" value={fmt(rsi)} sub={rsiSub} subClr={rsiSubClr}
          color={rsiColor(rsi)} bg={rsiBg} delay="0ms" />
        <Metric label="MACD Hist" value={snapshot.macdHistogram !== null ? `${histSign}${fmt(snapshot.macdHistogram, 4)}` : 'N/A'}
          sub={snapshot.macd !== null ? `Line: ${fmt(snapshot.macd, 4)}` : undefined}
          color={histColor(snapshot.macdHistogram)}
          bg={histNeg ? 'rgba(244,63,94,0.06)' : snapshot.macdHistogram !== null ? 'rgba(16,185,129,0.06)' : undefined}
          delay="60ms" />
        <Metric label="ATR 14" value={fmt(snapshot.atr14)} sub="Biến động TB" delay="120ms" />
        <Metric label="Volume Ratio" value={snapshot.volumeRatio20 !== null ? `${fmt(snapshot.volumeRatio20)}×` : 'N/A'}
          sub={snapshot.volumeSma20 !== null ? `SMA20: ${(snapshot.volumeSma20 / 1e6).toFixed(1)}M` : undefined}
          color={volHigh ? '#f59e0b' : '#f8fafc'}
          bg={volHigh ? 'rgba(245,158,11,0.07)' : undefined}
          delay="180ms" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'EMA 20',  val: snapshot.ema20,  d: '240ms' },
          { label: 'EMA 50',  val: snapshot.ema50,  d: '290ms' },
          { label: 'EMA 200', val: snapshot.ema200, d: '340ms' },
        ].map(({ label, val, d }) => {
          const diff = val !== null ? snapshot.close - val : null;
          const up = diff !== null && diff >= 0;
          return (
            <div key={label} className="rounded-xl px-3 py-2.5 flex items-center justify-between hover-lift anim-scale"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', animationDelay: d }}>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-sm font-bold text-white tabular-nums">{fmt(val)}</p>
              </div>
              {diff !== null && (
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
                  style={{ background: up ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)', color: up ? '#10b981' : '#f43f5e' }}>
                  {up ? '▲' : '▼'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

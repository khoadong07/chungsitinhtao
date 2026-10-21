'use client';

import dynamic from 'next/dynamic';
import type { AnalysisOutput } from '../lib/types';
import { IndicatorPanel } from './indicator-panel';
import { SignalSummary } from './signal-summary';
import { ScenarioPanel } from './scenario-panel';
import { ValuationPanel } from './valuation-panel';
import { AiAgentPanel } from './ai-agent-panel';
import { NewsWidget } from './news-widget';
import { CommunityWidget } from './community-widget';

const CandlestickChart = dynamic(() => import('./candlestick-chart'), { ssr: false });

interface Props { data: AnalysisOutput; onRetry: () => void; isReportLoading?: boolean; onStartAiAgent?: () => void; aiRequested?: boolean; pollTimedOut?: boolean; }

function fmt(v: number) {
  return v.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Card({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-2xl hover-lift ${className}`}
      style={{ background: 'rgba(14,18,35,0.8)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)', ...style }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] mb-3 flex items-center gap-2">
      <span className="inline-block w-1 h-3 rounded-full" style={{ background: 'linear-gradient(180deg,#7c3aed,#22d3ee)' }} />
      {children}
    </p>
  );
}

function PriceZones({ zones }: { zones: AnalysisOutput['priceZones'] }) {
  const supports = zones.filter(z => z.type === 'support');
  const resistances = zones.filter(z => z.type === 'resistance');
  if (zones.length === 0) return <p className="text-slate-600 text-xs">Chưa phát hiện vùng giá đủ bằng chứng.</p>;

  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: 'Hỗ trợ', items: supports, clr: '#22c55e', bg: 'rgba(34,197,94,0.06)', b: 'rgba(34,197,94,0.18)' },
        { label: 'Kháng cự', items: resistances, clr: '#ef4444', bg: 'rgba(239,68,68,0.06)', b: 'rgba(239,68,68,0.18)' },
      ].map(({ label, items, clr, bg, b }) => (
        <div key={label}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: clr }}>{label}</p>
          <div className="space-y-1.5">
            {items.length === 0
              ? <p className="text-xs text-slate-600">—</p>
              : items.map((z, i) => (
                <div key={i} className="flex justify-between rounded-lg px-3 py-1.5 text-xs" style={{ background: bg, border: `1px solid ${b}` }}>
                  <span className="tabular-nums font-medium" style={{ color: clr }}>{fmt(z.lower)} – {fmt(z.upper)}</span>
                  <span className="text-slate-500">{z.evidenceCount}đ</span>
                </div>
              ))
            }
          </div>
        </div>
      ))}
    </div>
  );
}

export function AnalysisReport({ data, onRetry, isReportLoading = false, onStartAiAgent, aiRequested = false, pollTimedOut = false }: Props) {
  const { dataSource, technical, decision, priceZones, warnings } = data;
  const asOf = new Date(data.asOf).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const close = technical.snapshot.close;
  const ema20 = technical.snapshot.ema20;
  const ema50 = technical.snapshot.ema50;
  const vsEma = ema20 ? ((close - ema20) / ema20) * 100 : null;
  const vsEma50 = ema50 ? ((close - ema50) / ema50) * 100 : null;
  const prevCandle = technical.candles.length >= 2 ? technical.candles[technical.candles.length - 2] : null;
  const vsPrevClose = prevCandle ? ((close - prevCandle.close) / prevCandle.close) * 100 : null;

  return (
    <div className="space-y-4">

      {/* Banners */}
      {(dataSource.isMock || warnings.length > 0) && (
        <div className="space-y-2 anim-fade-up d-0">
          {dataSource.isMock && (
            <div className="rounded-xl px-4 py-2 text-xs text-yellow-300 flex items-center gap-2" style={{ background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.15)' }}>
              ⚠️ Dữ liệu mô phỏng
            </div>
          )}
          {warnings.map((w, i) => (
            <div key={i} className="rounded-xl px-4 py-2 text-xs text-amber-400 flex items-center gap-2" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
              ⚠ {w}
            </div>
          ))}
        </div>
      )}

      {/* ── Hero Header ─────────────────────────────── */}
      <div
        className="rounded-2xl p-5 anim-fade-up d-0 gradient-border"
        style={{
          background: 'linear-gradient(135deg,rgba(109,40,217,0.12),rgba(14,18,35,0.9),rgba(6,182,212,0.04))',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-start justify-between gap-6 mb-4">
          {/* Left: symbol + meta */}
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <h1 className="text-4xl font-bold text-white tracking-tight font-display metric-in">{data.symbol}</h1>
              {data.fundamental?.filter.industry && (
                <span className="text-[11px] px-2.5 py-1 rounded-lg text-violet-300 font-semibold" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  {data.fundamental.filter.industry}
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 glow-dot" />
                <span className="text-[10px] text-slate-600">Live</span>
              </div>
            </div>
            <p className="text-xs text-slate-600">{asOf} · {technical.dataQuality.totalCandles} nến · 1D</p>
          </div>

          {/* Right: price + comparison strip */}
          <div className="text-right shrink-0">
            <div className="flex items-baseline justify-end gap-2">
              <p className={`text-4xl font-bold tabular-nums font-mono metric-in ${vsEma !== null && vsEma >= 0 ? 'num-profit' : vsEma !== null ? 'num-loss' : 'text-white'}`}>
                {close.toFixed(2)}
              </p>
              <span className="text-[11px] text-slate-500 mb-0.5">nghìn VND</span>
            </div>
            {/* Horizontal comparison row */}
            <div className="flex items-stretch justify-end gap-0 mt-2">
              {[
                { label: 'EMA20', value: ema20, pct: vsEma },
                { label: 'EMA50', value: ema50, pct: vsEma50 },
                { label: 'Hôm qua', value: prevCandle?.close ?? null, pct: vsPrevClose },
              ].filter(m => m.value !== null && m.pct !== null).map((m, i, arr) => (
                <div
                  key={m.label}
                  className="px-3 text-right"
                  style={i < arr.length - 1 ? { borderRight: '1px solid rgba(255,255,255,0.07)' } : undefined}
                >
                  <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-0.5">{m.label}</p>
                  <p className="text-xs font-mono text-slate-300 tabular-nums">{(m.value as number).toFixed(2)}</p>
                  <p className={`text-[11px] font-bold tabular-nums ${(m.pct as number) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(m.pct as number) >= 0 ? '▲' : '▼'}{Math.abs(m.pct as number).toFixed(2)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fundamentals strip */}
        {data.fundamental && (
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { l: 'P/E',     v: data.fundamental.filter.pe   > 0 ? data.fundamental.filter.pe.toFixed(1)   : 'N/A', dim: data.fundamental.filter.pe <= 0 },
              { l: 'P/B',     v: data.fundamental.filter.pb   > 0 ? data.fundamental.filter.pb.toFixed(2)   : 'N/A', dim: data.fundamental.filter.pb <= 0 },
              { l: 'ROE',     v: data.fundamental.filter.roe != null ? data.fundamental.filter.roe.toFixed(1) + '%' : 'N/A', dim: false },
              { l: 'ROA',     v: data.fundamental.filter.roa != null ? data.fundamental.filter.roa.toFixed(1) + '%' : 'N/A', dim: false },
              { l: 'EPS',     v: data.fundamental.filter.eps  > 0 ? (data.fundamental.filter.eps/1000).toFixed(0) + 'k' : 'N/A', dim: data.fundamental.filter.eps <= 0 },
              { l: 'Beta',    v: data.fundamental.filter.beta != null ? data.fundamental.filter.beta.toFixed(2) : 'N/A', dim: false },
              { l: 'Vốn hóa', v: data.fundamental.filter.marketCapBillion != null ? (data.fundamental.filter.marketCapBillion/1000).toFixed(0) + 'T' : 'N/A', dim: false },
              { l: 'NĐTNN',   v: data.fundamental.filter.foreignOwnershipPct != null ? data.fundamental.filter.foreignOwnershipPct.toFixed(1) + '%' : 'N/A', dim: false },
            ].map(({ l, v, dim }) => (
              <div key={l} className="group">
                <p className="text-[10px] text-slate-600 mb-0.5 uppercase tracking-wide">{l}</p>
                <p className={`text-xs font-bold font-mono transition-colors ${dim ? 'text-slate-600' : 'text-slate-200 group-hover:text-white'}`}>{v}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 2-Column Grid ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">

        {/* Left column */}
        <div className="space-y-4">

          {/* Chart */}
          <Card className="p-4 anim-slide-l d-1">
            <SectionTitle>Biểu đồ giá · EMA20 <span className="text-blue-400">─</span> EMA50 <span className="text-orange-400">─</span></SectionTitle>
            <CandlestickChart candles={technical.candles} symbol={data.symbol} />
          </Card>

          {/* Indicators */}
          <Card className="p-4 anim-slide-l d-2">
            <SectionTitle>Chỉ báo kỹ thuật</SectionTitle>
            <IndicatorPanel snapshot={technical.snapshot} />
          </Card>

          {/* Signals */}
          <Card className="p-4 anim-slide-l d-3">
            <SectionTitle>Phân loại tín hiệu</SectionTitle>
            <SignalSummary decision={decision} />
          </Card>

          {/* Scenarios */}
          <Card className="p-4 anim-slide-l d-4">
            <SectionTitle>Kịch bản giao dịch</SectionTitle>
            <ScenarioPanel scenarios={decision.scenarios} />
          </Card>

          {/* Price zones */}
          <Card className="p-4 anim-slide-l d-5">
            <SectionTitle>Vùng hỗ trợ / Kháng cự</SectionTitle>
            <PriceZones zones={priceZones} />
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="anim-slide-r d-1">
            <AiAgentPanel report={data.report} model={data.model} symbol={data.symbol} isLoading={isReportLoading} onStart={onStartAiAgent} aiRequested={aiRequested} pollTimedOut={pollTimedOut} />
          </div>
          {data.fundamental && (
            <div className="anim-slide-r d-2">
              <ValuationPanel fundamental={data.fundamental} currentClose={close} />
            </div>
          )}
          <div className="anim-slide-r d-3">
            <NewsWidget symbol={data.symbol} enabled={true} />
          </div>
          <div className="anim-slide-r d-4">
            <CommunityWidget symbol={data.symbol} enabled={true} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 anim-fade d-6">
        <div className="flex items-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          <p className="text-[11px] text-slate-700">Phân tích tự động · Không phải lời khuyên đầu tư</p>
        </div>
        <button onClick={onRetry} className="flex items-center gap-1.5 text-xs font-medium text-violet-500 hover:text-violet-400 transition-colors neon-hover cursor-pointer">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
          </svg>
          Làm mới
        </button>
      </div>
    </div>
  );
}

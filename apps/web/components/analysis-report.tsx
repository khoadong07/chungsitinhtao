'use client';

import dynamic from 'next/dynamic';
import type { AnalysisOutput } from '../lib/types';
import { IndicatorPanel } from './indicator-panel';
import { SignalSummary } from './signal-summary';
import { ScenarioPanel } from './scenario-panel';
import { ValuationPanel } from './valuation-panel';
import { AiAgentPanel } from './ai-agent-panel';
import { NewsWidget } from './news-widget';

const CandlestickChart = dynamic(() => import('./candlestick-chart'), { ssr: false });

interface Props { data: AnalysisOutput; onRetry: () => void; isReportLoading?: boolean; }

function fmt(v: number) {
  return v.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Card({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-2xl hover-lift ${className}`}
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', ...style }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">{children}</p>
  );
}

function PriceZones({ zones }: { zones: AnalysisOutput['priceZones'] }) {
  const supports = zones.filter(z => z.type === 'support');
  const resistances = zones.filter(z => z.type === 'resistance');
  if (zones.length === 0) return <p className="text-slate-600 text-xs">Chưa phát hiện vùng giá đủ bằng chứng.</p>;

  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: 'Hỗ trợ', items: supports, clr: '#10b981', bg: 'rgba(16,185,129,0.07)', b: 'rgba(16,185,129,0.15)' },
        { label: 'Kháng cự', items: resistances, clr: '#f43f5e', bg: 'rgba(244,63,94,0.07)', b: 'rgba(244,63,94,0.15)' },
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

export function AnalysisReport({ data, onRetry, isReportLoading = false }: Props) {
  const { dataSource, technical, decision, priceZones, warnings } = data;
  const asOf = new Date(data.asOf).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const close = technical.snapshot.close;
  const ema20 = technical.snapshot.ema20;
  const vsEma = ema20 ? ((close - ema20) / ema20) * 100 : null;

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
        className="rounded-2xl p-5 anim-fade-up d-0"
        style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(6,182,212,0.05))', border: '1px solid rgba(139,92,246,0.18)' }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-3xl font-bold text-white tracking-tight">{data.symbol}</h1>
              {data.fundamental?.filter.industry && (
                <span className="text-xs px-2 py-0.5 rounded-md text-violet-300 font-medium" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  {data.fundamental.filter.industry}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{asOf} · {technical.dataQuality.totalCandles} nến · 1D</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold tabular-nums text-white metric-in">{close.toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-0.5">nghìn VND</p>
            {vsEma !== null && (
              <p className={`text-xs font-semibold mt-1 ${vsEma >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {vsEma >= 0 ? '▲' : '▼'} {Math.abs(vsEma).toFixed(2)}% vs EMA20
              </p>
            )}
          </div>
        </div>

        {/* Fundamentals strip */}
        {data.fundamental && (
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {[
              { l: 'P/E',       v: data.fundamental.filter.pe   > 0 ? data.fundamental.filter.pe.toFixed(1)   : 'N/A' },
              { l: 'P/B',       v: data.fundamental.filter.pb   > 0 ? data.fundamental.filter.pb.toFixed(2)   : 'N/A' },
              { l: 'ROE',       v: data.fundamental.filter.roe.toFixed(1) + '%' },
              { l: 'ROA',       v: data.fundamental.filter.roa.toFixed(1) + '%' },
              { l: 'EPS',       v: data.fundamental.filter.eps  > 0 ? (data.fundamental.filter.eps/1000).toFixed(0) + 'k' : 'N/A' },
              { l: 'Beta',      v: data.fundamental.filter.beta.toFixed(2) },
              { l: 'Vốn hóa',   v: (data.fundamental.filter.marketCapBillion/1000).toFixed(0) + 'T' },
              { l: 'NĐTNN',     v: data.fundamental.filter.foreignOwnershipPct.toFixed(1) + '%' },
            ].map(({ l, v }) => (
              <div key={l}>
                <p className="text-[10px] text-slate-500 mb-0.5">{l}</p>
                <p className="text-xs font-bold text-slate-200">{v}</p>
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
            <AiAgentPanel report={data.report} model={data.model} symbol={data.symbol} isLoading={isReportLoading} />
          </div>
          {data.fundamental && (
            <div className="anim-slide-r d-2">
              <ValuationPanel fundamental={data.fundamental} currentClose={close} />
            </div>
          )}
          <div className="anim-slide-r d-3">
            <NewsWidget symbol={data.symbol} enabled={true} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 anim-fade d-6">
        <p className="text-xs text-slate-700">Phân tích tự động · Không phải lời khuyên đầu tư</p>
        <button onClick={onRetry} className="text-xs text-violet-500 hover:text-violet-400 transition-colors flex items-center gap-1">
          <span>↺</span> Làm mới
        </button>
      </div>
    </div>
  );
}

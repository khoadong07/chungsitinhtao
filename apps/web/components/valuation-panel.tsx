import type { BsiFundamentalData } from '../lib/types';

interface Props {
  fundamental: BsiFundamentalData;
  currentClose: number; // thousands VND
}

function FairValueRow({ label, fairVnd, currentK, color }: { label: string; fairVnd: number | null; currentK: number; color: string }) {
  if (!fairVnd || fairVnd <= 0) {
    return (
      <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex justify-between items-center">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-xs text-slate-600">N/A</p>
        </div>
      </div>
    );
  }

  const fairK = fairVnd / 1000;
  const upside = ((fairK - currentK) / currentK) * 100;
  const isUp = upside > 0;

  // progress bar: current vs fair
  const lo = Math.min(currentK, fairK) * 0.9;
  const hi = Math.max(currentK, fairK) * 1.1;
  const range = hi - lo || 1;
  const curPct = Math.max(2, Math.min(98, ((currentK - lo) / range) * 100));
  const fairPct = Math.max(2, Math.min(98, ((fairK  - lo) / range) * 100));

  return (
    <div className="rounded-xl px-4 py-3.5 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
          <p className="text-base font-bold text-white tabular-nums">{fairK.toFixed(2)}<span className="text-xs font-normal text-slate-500 ml-1">nghìn</span></p>
        </div>
        <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}
          style={{ background: isUp ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)' }}>
          {isUp ? '▲' : '▼'} {Math.abs(upside).toFixed(1)}%
        </div>
      </div>

      {/* Bar */}
      <div className="relative h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
        {/* range fill */}
        <div
          className="absolute top-0 h-full rounded-full opacity-25 bar-fill"
          style={{
            left: `${Math.min(curPct, fairPct)}%`,
            width: `${Math.abs(fairPct - curPct)}%`,
            background: isUp ? '#10b981' : '#f43f5e',
          }}
        />
        {/* current dot */}
        <div
          className="absolute top-1/2 w-3 h-3 rounded-full border-2 border-white bg-slate-300 shadow-md"
          style={{ left: `${curPct}%`, transform: 'translateX(-50%) translateY(-50%)' }}
        />
        {/* fair dot */}
        <div
          className="absolute top-1/2 w-3 h-3 rounded-full border-2 shadow-md"
          style={{ left: `${fairPct}%`, transform: 'translateX(-50%) translateY(-50%)', background: color, borderColor: color }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-600">
        <span>Hiện tại: {currentK.toFixed(2)}</span>
        <span>Định giá: {fairK.toFixed(2)}</span>
      </div>
    </div>
  );
}

export function ValuationPanel({ fundamental, currentClose }: Props) {
  const { valuation, filter } = fundamental;

  const lo52 = filter.low52W;
  const hi52 = filter.high52W;
  const pos52 = hi52 > lo52 ? Math.max(0, Math.min(100, ((currentClose - lo52) / (hi52 - lo52)) * 100)) : 50;
  const pos52Color = pos52 < 25 ? '#f43f5e' : pos52 < 60 ? '#f59e0b' : '#10b981';

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(6,182,212,0.18)' }}
    >
      {/* Header */}
      <div
        className="px-5 py-3.5 flex items-center gap-2.5"
        style={{ background: 'linear-gradient(90deg,rgba(6,182,212,0.1),rgba(139,92,246,0.05))', borderBottom: '1px solid rgba(6,182,212,0.1)' }}
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#06b6d4,#7c3aed)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">Định giá</p>
          <p className="text-xs text-slate-400 mt-0.5">PE · PB Fair Value</p>
        </div>
      </div>

      <div className="p-5 space-y-4">

        {/* 52-week range */}
        <div>
          <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
            <span>52W Thấp: <span className="text-rose-400 font-semibold">{lo52.toFixed(2)}</span></span>
            <span>52W Cao: <span className="text-emerald-400 font-semibold">{hi52.toFixed(2)}</span></span>
          </div>
          <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div
              className="absolute top-0 left-0 h-full rounded-full bar-fill"
              style={{
                width: `${pos52}%`,
                background: 'linear-gradient(90deg,#f43f5e 0%,#f59e0b 50%,#10b981 100%)',
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <p className="text-[10px] text-slate-500">Vị trí 52W</p>
            <p className="text-[10px] font-bold" style={{ color: pos52Color }}>{pos52.toFixed(0)}%</p>
          </div>
        </div>

        {/* Performance row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { l: '1 ngày', v: filter.perChange1D ?? 0 },
            { l: '1 tháng', v: filter.perChange1M ?? 0 },
            { l: '1 năm', v: filter.perChange1Y ?? 0 },
          ].map(({ l, v }) => (
            <div
              key={l}
              className="rounded-xl p-2.5 text-center"
              style={{ background: v >= 0 ? 'rgba(16,185,129,0.06)' : 'rgba(244,63,94,0.06)', border: `1px solid ${v >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)'}` }}
            >
              <p className="text-[10px] text-slate-500 mb-0.5">{l}</p>
              <p className={`text-xs font-bold ${v >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {v >= 0 ? '+' : ''}{v.toFixed(2)}%
              </p>
            </div>
          ))}
        </div>

        {/* Fair value bars */}
        <div className="space-y-2.5">
          <FairValueRow label="Định giá theo P/E" fairVnd={valuation.peFairValue}   currentK={currentClose} color="#8b5cf6" />
          <FairValueRow label="Định giá theo P/B" fairVnd={valuation.pbFairValue}   currentK={currentClose} color="#22d3ee" />
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { l: 'EPS',   v: filter.eps  > 0 ? filter.eps.toLocaleString('vi-VN')  + ' VND' : 'N/A' },
            { l: 'BVPS',  v: filter.bvps > 0 ? filter.bvps.toLocaleString('vi-VN') + ' VND' : 'N/A' },
            { l: 'Beta',  v: filter.beta != null ? filter.beta.toFixed(2) : 'N/A' },
            { l: 'NĐTNN', v: filter.foreignOwnershipPct != null ? filter.foreignOwnershipPct.toFixed(1) + '%' : 'N/A' },
          ].map(({ l, v }) => (
            <div key={l} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-slate-500 mb-0.5">{l}</p>
              <p className="text-xs font-bold text-slate-200">{v}</p>
            </div>
          ))}
        </div>

        {/* BSI signal summary */}
        <div className="rounded-xl px-4 py-2.5 flex items-center justify-between" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tín hiệu tổng hợp</p>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-emerald-400">+{filter.generalSignal.positive}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">{filter.generalSignal.neutral}</span>
            <span className="text-slate-600">·</span>
            <span className="text-rose-400">-{filter.generalSignal.negative}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

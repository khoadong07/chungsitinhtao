import type { DecisionResult } from '../lib/types';

const LABELS: Record<string, string> = {
  bullish: 'Tăng trưởng', bearish: 'Giảm', mixed: 'Hỗn hợp',
  improving: 'Cải thiện', weakening: 'Yếu dần', neutral: 'Trung tính',
  high: 'Cao', low: 'Thấp', normal: 'Bình thường',
  potential_entry: 'Tiềm năng vào lệnh', wait_for_confirmation: 'Chờ xác nhận',
  hold_watch: 'Theo dõi', risk_elevated: 'Rủi ro cao', insufficient_data: 'Thiếu dữ liệu',
};

function cls(c: string): { bg: string; bdr: string; clr: string } {
  if (['bullish','potential_entry','improving','high'].includes(c))
    return { bg: 'rgba(16,185,129,0.08)', bdr: 'rgba(16,185,129,0.18)', clr: '#10b981' };
  if (['bearish','risk_elevated','weakening'].includes(c))
    return { bg: 'rgba(244,63,94,0.08)', bdr: 'rgba(244,63,94,0.18)', clr: '#f43f5e' };
  if (['mixed','wait_for_confirmation','neutral','normal'].includes(c))
    return { bg: 'rgba(245,158,11,0.07)', bdr: 'rgba(245,158,11,0.18)', clr: '#f59e0b' };
  return { bg: 'rgba(255,255,255,0.04)', bdr: 'rgba(255,255,255,0.07)', clr: '#94a3b8' };
}

function SignalCard({ title, classification, reasons, delay }: { title: string; classification: string; reasons: string[]; delay: string }) {
  const { bg, bdr, clr } = cls(classification);
  const label = LABELS[classification] ?? classification;
  return (
    <div className="rounded-xl p-3.5 hover-lift anim-scale" style={{ background: bg, border: `1px solid ${bdr}`, animationDelay: delay }}>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">{title}</p>
      <p className="text-sm font-bold mb-2.5" style={{ color: clr }}>{label}</p>
      {reasons.length > 0 && (
        <ul className="space-y-1.5">
          {reasons.map((r, i) => (
            <li key={i} className="text-[11px] text-slate-400 flex gap-1.5 leading-relaxed">
              <span className="shrink-0 mt-0.5" style={{ color: clr }}>›</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SignalSummary({ decision }: { decision: DecisionResult }) {
  const { bg, bdr, clr } = cls(decision.setup.classification);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SignalCard title="Xu hướng"   classification={decision.trend.classification}    reasons={decision.trend.reasons}    delay="0ms" />
        <SignalCard title="Động lượng" classification={decision.momentum.classification}  reasons={decision.momentum.reasons}  delay="60ms" />
        <SignalCard title="Khối lượng" classification={decision.volume.classification}    reasons={decision.volume.reasons}    delay="120ms" />
        <div className="rounded-xl p-3.5 hover-lift anim-scale" style={{ background: bg, border: `1px solid ${bdr}`, animationDelay: '180ms' }}>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Tín hiệu thiết lập</p>
          <p className="text-sm font-bold mb-2.5" style={{ color: clr }}>
            {LABELS[decision.setup.classification] ?? decision.setup.classification}
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">{decision.setup.explanation}</p>
        </div>
      </div>
      {decision.warnings.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {decision.warnings.map((w, i) => (
            <span key={i} className="text-[11px] text-amber-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.14)' }}>
              ⚠ {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

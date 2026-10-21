import type { AnalysisReport } from '../lib/types';

interface Props {
  report: AnalysisReport | null;
  model: string | null;
  symbol: string;
  isLoading?: boolean;
  onStart?: () => void;
  aiRequested?: boolean;
  pollTimedOut?: boolean;
}

const MODEL_LABEL: Record<string, string> = {
  openai: 'DeepSeek AI',
  anthropic: 'Claude AI',
};

function setupMeta(c: string): { label: string; icon: string; color: string; bg: string } {
  const map: Record<string, { label: string; icon: string; color: string; bg: string }> = {
    potential_entry:      { label: 'Tiềm năng vào lệnh', icon: '🎯', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
    wait_for_confirmation:{ label: 'Chờ xác nhận',       icon: '⏳', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
    hold_watch:           { label: 'Theo dõi',            icon: '👁',  color: '#22d3ee', bg: 'rgba(34,211,238,0.08)' },
    risk_elevated:        { label: 'Rủi ro cao',          icon: '⚠️', color: '#f43f5e', bg: 'rgba(244,63,94,0.08)' },
    insufficient_data:    { label: 'Thiếu dữ liệu',       icon: '📊', color: '#64748b', bg: 'rgba(255,255,255,0.04)' },
  };
  return map[c] ?? { label: c, icon: '●', color: '#94a3b8', bg: 'rgba(255,255,255,0.04)' };
}

export function AiAgentPanel({ report, model, symbol, isLoading = false, onStart, aiRequested = false, pollTimedOut = false }: Props) {
  const isAi = model !== null && !isLoading;
  const modelLabel = model ? (MODEL_LABEL[model] ?? model) : 'Fallback';

  return (
    <div
      className="rounded-2xl overflow-hidden border-pulse"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}
    >
      {/* Header */}
      <div
        className="px-5 py-3.5 flex items-center justify-between"
        style={{ background: 'linear-gradient(90deg,rgba(139,92,246,0.14),rgba(6,182,212,0.06))', borderBottom: '1px solid rgba(139,92,246,0.12)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
                <path d="M12 8v4l3 3"/>
                <circle cx="20" cy="4" r="2.5" fill="white" stroke="none"/>
              </svg>
            </div>
            {isAi && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 glow-dot" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">AI Agent</p>
            <p className="text-xs text-slate-400 mt-0.5">{symbol} · {modelLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: isAi ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)' }}>
          <span className={`w-1.5 h-1.5 rounded-full ${isAi ? 'bg-emerald-400 glow-dot' : 'bg-slate-500'}`} />
          <span className={`text-xs font-semibold ${isAi ? 'text-emerald-400' : 'text-slate-500'}`}>
            {isAi ? 'Active' : 'Fallback'}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Poll timed out — show retry */}
        {pollTimedOut && !report ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-300 mb-1">AI mất quá nhiều thời gian</p>
              <p className="text-xs text-slate-500">Server đang bận hoặc LLM quá tải. Thử lại sau.</p>
            </div>
            {onStart && (
              <button
                onClick={onStart}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 cursor-pointer"
                style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)' }}
              >
                Thử lại
              </button>
            )}
          </div>
        ) : !aiRequested && !isLoading && !report && onStart ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(6,182,212,0.08))', border: '1px solid rgba(124,58,237,0.2)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
                <path d="M12 8v4l3 3"/>
                <circle cx="20" cy="4" r="2.5" fill="#22d3ee" stroke="none"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-300 mb-1">Phân tích AI chuyên sâu</p>
              <p className="text-xs text-slate-500 leading-relaxed">Xu hướng · Kịch bản · Rủi ro · Nhận định</p>
            </div>
            <button
              onClick={onStart}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 cursor-pointer"
              style={{ background: 'linear-gradient(135deg,#6d28d9,#7c3aed)', boxShadow: '0 2px 16px rgba(124,58,237,0.35)' }}
            >
              Chạy AI Agent
            </button>
          </div>
        ) : isLoading ? (
          <div className="space-y-3 py-2">
            <div className="skeleton h-4 rounded-lg w-full" />
            <div className="skeleton h-4 rounded-lg w-4/5" />
            <div className="skeleton h-4 rounded-lg w-3/5" />
            <div className="skeleton h-16 rounded-xl w-full mt-2" />
            <div className="grid grid-cols-2 gap-3">
              <div className="skeleton h-24 rounded-xl" />
              <div className="skeleton h-24 rounded-xl" />
            </div>
            <div className="skeleton h-16 rounded-xl w-full" />
            <p className="text-center text-xs text-slate-600 pt-1 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 glow-dot inline-block" />
              AI đang phân tích...
            </p>
          </div>
        ) : !report ? (
          <p className="text-slate-600 text-sm text-center py-6">Chưa có báo cáo AI</p>
        ) : (
          <>
            {/* Summary */}
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Tổng quan</p>
              <p className="text-sm text-slate-300 leading-relaxed">{report.summary}</p>
            </div>

            {/* Setup signal */}
            {(() => {
              const m = setupMeta(report.setup.classification);
              return (
                <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: m.bg, border: `1px solid ${m.color}22` }}>
                  <span className="text-xl">{m.icon}</span>
                  <div>
                    <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider">Tín hiệu thiết lập</p>
                    <p className="text-sm font-bold" style={{ color: m.color }}>{m.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{report.setup.explanation}</p>
                  </div>
                </div>
              );
            })()}

            {/* Bullish / Bearish 2-col */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'Tăng', factors: report.bullishFactors ?? [], color: '#10b981', icon: '▲', bg: 'rgba(16,185,129,0.04)' },
                { title: 'Giảm', factors: report.bearishFactors ?? [], color: '#f43f5e', icon: '▼', bg: 'rgba(244,63,94,0.04)' },
              ].map(({ title, factors, color, icon, bg }) => (
                <div key={title} className="rounded-xl p-3" style={{ background: bg, border: `1px solid ${color}18` }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color }}>
                    {icon} Yếu tố {title}
                  </p>
                  {factors.length === 0
                    ? <p className="text-xs text-slate-600">—</p>
                    : <ul className="space-y-1.5">
                        {factors.slice(0, 3).map((f, i) => (
                          <li key={i} className="text-xs text-slate-400 leading-relaxed flex gap-1.5">
                            <span className="shrink-0 mt-0.5" style={{ color }}>›</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                  }
                </div>
              ))}
            </div>

            {/* Risks */}
            {report.risks.length > 0 && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)' }}>
                <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest mb-2">⚠ Rủi ro cần lưu ý</p>
                <ul className="space-y-1.5">
                  {report.risks.slice(0, 3).map((r, i) => (
                    <li key={i} className="text-xs text-slate-400 leading-relaxed flex gap-1.5">
                      <span className="text-amber-600 shrink-0 mt-0.5">›</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Scenario triggers (mini) */}
            {report.scenarios.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Kịch bản AI</p>
                <div className="space-y-2">
                  {report.scenarios.map((s, i) => {
                    const bull = s.name === 'bullish';
                    return (
                      <div key={i} className="rounded-xl px-3 py-2.5" style={{ background: bull ? 'rgba(16,185,129,0.06)' : 'rgba(244,63,94,0.06)', border: `1px solid ${bull ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)'}` }}>
                        <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: bull ? '#10b981' : '#f43f5e' }}>
                          {bull ? '▲ Tăng' : '▼ Giảm'}
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed">{s.trigger}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

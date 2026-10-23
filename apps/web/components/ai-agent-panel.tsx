'use client';

import { useState } from 'react';
import type { AnalysisReport, ActionPlan } from '../lib/types';

/* ── helpers ─────────────────────────────────────────────── */

const MODEL_LABEL: Record<string, string> = {
  openai: 'DeepSeek AI',
  anthropic: 'Claude AI',
};

function setupMeta(c: string) {
  const map: Record<string, { label: string; icon: string; color: string; bg: string }> = {
    potential_entry:       { label: 'Tiềm năng vào lệnh', icon: '🎯', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
    wait_for_confirmation: { label: 'Chờ xác nhận',       icon: '⏳', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
    hold_watch:            { label: 'Theo dõi',            icon: '👁',  color: '#22d3ee', bg: 'rgba(34,211,238,0.08)' },
    risk_elevated:         { label: 'Rủi ro cao',          icon: '⚠️', color: '#f43f5e', bg: 'rgba(244,63,94,0.08)' },
    insufficient_data:     { label: 'Thiếu dữ liệu',       icon: '📊', color: '#64748b', bg: 'rgba(255,255,255,0.04)' },
  };
  return map[c] ?? { label: c, icon: '●', color: '#94a3b8', bg: 'rgba(255,255,255,0.04)' };
}

/* ── ActionPlanCard (dùng trong modal) ───────────────────── */

function ActionPlanCard({ plan }: { plan: ActionPlan }) {
  if (plan.side === 'none') {
    return (
      <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Kế hoạch giao dịch</p>
        <p className="text-xs text-slate-500 leading-relaxed">{plan.rationale}</p>
      </div>
    );
  }

  const rr = plan.entry && plan.stopLoss && plan.targets.length > 0
    ? (() => {
        const mid = (plan.entry.lower + plan.entry.upper) / 2;
        const risk = mid - plan.stopLoss.price;
        const reward = plan.targets[0].price - mid;
        return risk > 0 ? (reward / risk).toFixed(1) : null;
      })()
    : null;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: 'rgba(16,185,129,0.07)', borderBottom: '1px solid rgba(16,185,129,0.12)' }}>
        <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-widest">📋 Kế hoạch giao dịch</p>
        {rr && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>R:R {rr}</span>
        )}
      </div>
      <div className="p-4 space-y-3" style={{ background: 'rgba(16,185,129,0.03)' }}>
        <p className="text-[11px] text-slate-400 leading-relaxed">{plan.rationale}</p>
        <div className="space-y-2">
          {plan.entry && (
            <div className="flex items-start gap-3 rounded-lg px-3 py-2.5" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }}>
              <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(16,185,129,0.2)' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide mb-0.5">Vùng vào lệnh</p>
                <p className="text-sm font-bold text-white tabular-nums">{plan.entry.lower.toFixed(2)} – {plan.entry.upper.toFixed(2)}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{plan.entry.note}</p>
              </div>
            </div>
          )}
          {plan.stopLoss && (
            <div className="flex items-start gap-3 rounded-lg px-3 py-2.5" style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)' }}>
              <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(244,63,94,0.15)' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-wide mb-0.5">Cắt lỗ</p>
                <p className="text-sm font-bold text-white tabular-nums">{plan.stopLoss.price.toFixed(2)}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{plan.stopLoss.note}</p>
              </div>
            </div>
          )}
          {plan.targets.map((t, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg px-3 py-2.5" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(139,92,246,0.15)' }}>
                <span className="text-[9px] font-bold text-violet-400">T{i + 1}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-wide mb-0.5">Chốt lời {i + 1}</p>
                <p className="text-sm font-bold text-white tabular-nums">{t.price.toFixed(2)}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{t.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── FullReportModal ─────────────────────────────────────── */

function FullReportModal({ report, symbol, model, onClose }: {
  report: AnalysisReport;
  symbol: string;
  model: string | null;
  onClose: () => void;
}) {
  const modelLabel = model ? (MODEL_LABEL[model] ?? model) : 'Fallback';
  const m = setupMeta(report.setup.classification);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex flex-col rounded-2xl overflow-hidden"
        style={{
          width: '70vw',
          maxWidth: '900px',
          maxHeight: '88vh',
          background: 'rgba(8,12,28,0.97)',
          border: '1px solid rgba(139,92,246,0.25)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.08)',
        }}
      >
        {/* Modal header */}
        <div
          className="shrink-0 px-6 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(90deg,rgba(139,92,246,0.12),rgba(6,182,212,0.05))', borderBottom: '1px solid rgba(139,92,246,0.12)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 8v4l3 3"/>
                <circle cx="20" cy="4" r="2.5" fill="white" stroke="none"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Báo cáo AI đầy đủ</p>
              <p className="text-xs text-slate-400 mt-0.5">{symbol} · {modelLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto p-6 space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(139,92,246,0.3) transparent' }}>

          {/* Summary */}
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Tổng quan</p>
            <p className="text-sm text-slate-300 leading-relaxed">{report.summary}</p>
          </div>

          {/* Setup */}
          <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: m.bg, border: `1px solid ${m.color}22` }}>
            <span className="text-xl">{m.icon}</span>
            <div>
              <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider">Tín hiệu thiết lập</p>
              <p className="text-sm font-bold" style={{ color: m.color }}>{m.label}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{report.setup.explanation}</p>
            </div>
          </div>

          {/* Bullish / Bearish */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { title: 'Tăng', factors: report.bullishFactors ?? [], color: '#10b981', icon: '▲', bg: 'rgba(16,185,129,0.04)' },
              { title: 'Giảm', factors: report.bearishFactors ?? [], color: '#f43f5e', icon: '▼', bg: 'rgba(244,63,94,0.04)' },
            ].map(({ title, factors, color, icon, bg }) => (
              <div key={title} className="rounded-xl p-3" style={{ background: bg, border: `1px solid ${color}18` }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color }}>{icon} Yếu tố {title}</p>
                {factors.length === 0
                  ? <p className="text-xs text-slate-600">—</p>
                  : <ul className="space-y-1.5">
                      {factors.map((f, i) => (
                        <li key={i} className="text-xs text-slate-400 leading-relaxed flex gap-1.5">
                          <span className="shrink-0 mt-0.5" style={{ color }}>›</span><span>{f}</span>
                        </li>
                      ))}
                    </ul>
                }
              </div>
            ))}
          </div>

          {/* Action plan */}
          {report.actionPlan && <ActionPlanCard plan={report.actionPlan} />}

          {/* Risks */}
          {report.risks.length > 0 && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)' }}>
              <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest mb-2">⚠ Rủi ro cần lưu ý</p>
              <ul className="space-y-1.5">
                {report.risks.map((r, i) => (
                  <li key={i} className="text-xs text-slate-400 leading-relaxed flex gap-1.5">
                    <span className="text-amber-600 shrink-0 mt-0.5">›</span><span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Scenarios */}
          {report.scenarios.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Kịch bản AI</p>
              <div className="space-y-2">
                {report.scenarios.map((s, i) => {
                  const bull = s.name === 'bullish';
                  return (
                    <div key={i} className="rounded-xl px-4 py-3 space-y-1.5" style={{ background: bull ? 'rgba(16,185,129,0.06)' : 'rgba(244,63,94,0.06)', border: `1px solid ${bull ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)'}` }}>
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: bull ? '#10b981' : '#f43f5e' }}>{bull ? '▲ Tăng' : '▼ Giảm'}</p>
                      <p className="text-xs text-slate-300 leading-relaxed"><span className="text-slate-500 mr-1">Trigger:</span>{s.trigger}</p>
                      <p className="text-xs text-slate-400 leading-relaxed"><span className="text-slate-500 mr-1">Invalidation:</span>{s.invalidation}</p>
                      {s.rationale?.length > 0 && (
                        <ul className="space-y-1 pt-1">
                          {s.rationale.map((r, j) => (
                            <li key={j} className="text-xs text-slate-500 flex gap-1.5">
                              <span style={{ color: bull ? '#10b981' : '#f43f5e' }}>›</span><span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Limitations */}
          {report.limitations?.length > 0 && (
            <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">Giới hạn phân tích</p>
              <ul className="space-y-1">
                {report.limitations.map((l, i) => (
                  <li key={i} className="text-[11px] text-slate-600 flex gap-1.5">
                    <span className="text-slate-700 shrink-0">›</span><span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main panel ──────────────────────────────────────────── */

interface Props {
  report: AnalysisReport | null;
  model: string | null;
  symbol: string;
  isLoading?: boolean;
  onStart?: () => void;
  aiRequested?: boolean;
  pollTimedOut?: boolean;
}

export function AiAgentPanel({ report, model, symbol, isLoading = false, onStart, aiRequested = false, pollTimedOut = false }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const isAi = model !== null && !isLoading;
  const modelLabel = model ? (MODEL_LABEL[model] ?? model) : 'Fallback';

  return (
    <>
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
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 8v4l3 3"/>
                  <circle cx="20" cy="4" r="2.5" fill="white" stroke="none"/>
                </svg>
              </div>
              {isAi && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 glow-dot" />}
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">AI Agent</p>
              <p className="text-xs text-slate-400 mt-0.5">{symbol} · {modelLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: isAi ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)' }}>
            <span className={`w-1.5 h-1.5 rounded-full ${isAi ? 'bg-emerald-400 glow-dot' : 'bg-slate-500'}`} />
            <span className={`text-xs font-semibold ${isAi ? 'text-emerald-400' : 'text-slate-500'}`}>{isAi ? 'Active' : 'Fallback'}</span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Poll timed out */}
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
                <button onClick={onStart} className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 cursor-pointer" style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)' }}>
                  Thử lại
                </button>
              )}
            </div>

          ) : !aiRequested && !isLoading && !report && onStart ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(6,182,212,0.08))', border: '1px solid rgba(124,58,237,0.2)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 8v4l3 3"/>
                  <circle cx="20" cy="4" r="2.5" fill="#22d3ee" stroke="none"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-300 mb-1">Phân tích AI chuyên sâu</p>
                <p className="text-xs text-slate-500 leading-relaxed">Xu hướng · Kịch bản · Rủi ro · Nhận định</p>
              </div>
              <button onClick={onStart} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 cursor-pointer" style={{ background: 'linear-gradient(135deg,#6d28d9,#7c3aed)', boxShadow: '0 2px 16px rgba(124,58,237,0.35)' }}>
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
                const sm = setupMeta(report.setup.classification);
                return (
                  <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: sm.bg, border: `1px solid ${sm.color}22` }}>
                    <span className="text-xl">{sm.icon}</span>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider">Tín hiệu thiết lập</p>
                      <p className="text-sm font-bold" style={{ color: sm.color }}>{sm.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{report.setup.explanation}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Bullish / Bearish — preview only, max 2 items each */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { title: 'Tăng', factors: report.bullishFactors ?? [], color: '#10b981', icon: '▲', bg: 'rgba(16,185,129,0.04)' },
                  { title: 'Giảm', factors: report.bearishFactors ?? [], color: '#f43f5e', icon: '▼', bg: 'rgba(244,63,94,0.04)' },
                ].map(({ title, factors, color, icon, bg }) => (
                  <div key={title} className="rounded-xl p-3" style={{ background: bg, border: `1px solid ${color}18` }}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color }}>{icon} Yếu tố {title}</p>
                    {factors.length === 0
                      ? <p className="text-xs text-slate-600">—</p>
                      : <ul className="space-y-1.5">
                          {factors.slice(0, 2).map((f, i) => (
                            <li key={i} className="text-xs text-slate-400 leading-relaxed flex gap-1.5">
                              <span className="shrink-0 mt-0.5" style={{ color }}>›</span><span>{f}</span>
                            </li>
                          ))}
                          {factors.length > 2 && (
                            <li className="text-[10px] text-slate-600">+{factors.length - 2} yếu tố khác…</li>
                          )}
                        </ul>
                    }
                  </div>
                ))}
              </div>

              {/* "Xem toàn bộ" button */}
              <button
                onClick={() => setModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(6,182,212,0.06))',
                  border: '1px solid rgba(139,92,246,0.25)',
                  color: '#a78bfa',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
                Xem toàn bộ kết quả
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && report && (
        <FullReportModal
          report={report}
          symbol={symbol}
          model={model}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

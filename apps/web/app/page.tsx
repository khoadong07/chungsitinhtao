'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnalysisReport } from '../components/analysis-report';
import { useAnalysis } from '../hooks/use-analysis';

const DEFAULT_SYMBOL = 'ACB';
const QUICK_PICKS = ['ACB', 'MBB', 'FPT', 'HPG', 'VNM', 'TCB', 'VIC'];

export default function HomePage() {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [inputVal, setInputVal] = useState(DEFAULT_SYMBOL);
  const [horizon, setHorizon] = useState<'swing' | 'position'>('swing');
  const [submitted, setSubmitted] = useState(true); // auto-load ACB
  const [inputError, setInputError] = useState('');

  const { data, isLoading, isReportLoading, isError, error: queryError, refetch } = useAnalysis({
    symbol,
    holdingHorizon: horizon,
    enabled: submitted,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputVal.trim().toUpperCase();
    if (!/^[A-Z0-9]{2,10}$/.test(trimmed)) {
      setInputError('Mã CP không hợp lệ');
      return;
    }
    setInputError('');
    setSymbol(trimmed);
    setSubmitted(true);
  }

  function pickSymbol(s: string) {
    setInputVal(s);
    setSymbol(s);
    setSubmitted(true);
    setInputError('');
  }

  const displaySymbol = data?.symbol ?? symbol;
  const closePrice = data?.technical?.snapshot?.close;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Top Bar ─────────────────────────────────── */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: 'rgba(2,6,23,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 1px 0 0 rgba(124,58,237,0.08)',
        }}
      >
        <div className="max-w-[1440px] mx-auto px-5 h-14 flex items-center gap-4">

          {/* Logo + brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="relative">
              <Image src="/logo.png" alt="Chứng Sĩ Tỉnh Táo" width={32} height={32} className="rounded-xl" priority />
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 glow-dot" />
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-sm text-white leading-none font-display tracking-tight">Chứng Sĩ Tỉnh Táo</p>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5 italic">Đừng nghe tiếng lòng, hãy nghe dữ liệu.</p>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

          {/* Search form */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                value={inputVal}
                onChange={e => { setInputVal(e.target.value); setInputError(''); }}
                placeholder="ACB, VNM, FPT..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-sm font-semibold text-white placeholder-slate-600 focus:outline-none uppercase transition-all focus:ring-1 focus:ring-violet-500/40"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${inputError ? 'rgba(244,63,94,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  letterSpacing: '0.05em',
                }}
                maxLength={10} autoComplete="off" spellCheck={false}
              />
            </div>
            <select
              value={horizon}
              onChange={e => setHorizon(e.target.value as 'swing' | 'position')}
              className="text-[11px] font-medium text-slate-400 py-1.5 px-2 rounded-xl focus:outline-none shrink-0 cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <option value="swing">Swing</option>
              <option value="position">Position</option>
            </select>
            <button
              type="submit" disabled={isLoading}
              className="shrink-0 px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg,#6d28d9,#7c3aed,#9333ea)',
                boxShadow: '0 2px 12px rgba(124,58,237,0.35)',
              }}
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Đang tải
                </span>
              ) : 'Phân tích'}
            </button>
          </form>

          {/* Quick picks */}
          <div className="hidden lg:flex items-center gap-1">
            {QUICK_PICKS.map(s => (
              <button
                key={s}
                onClick={() => pickSymbol(s)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide transition-all active:scale-95 cursor-pointer ${s === displaySymbol ? 'pick-active' : ''}`}
                style={s !== displaySymbol ? {
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#475569',
                } : {
                  border: '1px solid rgba(124,58,237,0.45)',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Live price badge */}
          {closePrice && !isLoading && (
            <div
              className="hidden md:flex items-center gap-2 ml-auto shrink-0 px-3 py-1.5 rounded-xl anim-fade"
              style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 glow-dot" />
              <span className="text-[11px] font-bold text-slate-400 tracking-wide">{displaySymbol}</span>
              <span className="text-sm font-bold text-white tabular-nums font-mono">{closePrice.toFixed(2)}</span>
              <span className="text-[10px] text-slate-600">k</span>
            </div>
          )}
        </div>

        {/* Error hint */}
        {inputError && (
          <p className="text-center text-xs text-rose-400 pb-1" role="alert">{inputError}</p>
        )}
      </header>

      {/* ── Main ────────────────────────────────────── */}
      <main className="max-w-[1440px] mx-auto px-5 py-5">

        {/* Shimmer skeleton */}
        {isLoading && (
          <div className="space-y-4 anim-fade">
            <div className="skeleton h-[88px] rounded-2xl w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
              <div className="space-y-3">
                <div className="skeleton h-72 rounded-2xl" />
                <div className="grid grid-cols-4 gap-3">
                  {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-[72px] rounded-xl" />)}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="skeleton h-40 rounded-xl" />
                  <div className="skeleton h-40 rounded-xl" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="skeleton h-[420px] rounded-2xl" />
                <div className="skeleton h-72 rounded-2xl" />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="rounded-2xl p-10 text-center anim-scale" style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)' }}>
            <div className="text-3xl mb-3">⚠️</div>
            <p className="text-rose-300 font-semibold mb-1">Không thể tải phân tích</p>
            <p className="text-rose-400/60 text-sm mb-4">{(queryError as Error)?.message ?? 'Lỗi không xác định'}</p>
            <button onClick={() => void refetch()} className="px-5 py-2 rounded-xl text-sm font-medium text-white active:scale-95 transition-transform" style={{ background: 'rgba(244,63,94,0.2)', border: '1px solid rgba(244,63,94,0.3)' }}>
              Thử lại
            </button>
          </div>
        )}

        {/* Dashboard */}
        {data && !isLoading && (
          <AnalysisReport data={data} onRetry={() => void refetch()} isReportLoading={isReportLoading} />
        )}
      </main>
    </div>
  );
}

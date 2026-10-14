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
    <div className="min-h-screen" style={{ background: '#080b1a' }}>

      {/* ── Top Bar ─────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{ background: 'rgba(8,11,26,0.88)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="max-w-[1440px] mx-auto px-5 h-14 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo.png" alt="Chứng Sĩ Tỉnh Táo" width={32} height={32} className="rounded-lg" priority />
            <div className="hidden sm:block">
              <p className="font-bold text-sm tracking-tight text-white leading-none">Chứng Sĩ Tỉnh Táo</p>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">Đừng nghe tiếng lòng, hãy nghe dữ liệu.</p>
            </div>
          </div>

          {/* Search form */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                value={inputVal}
                onChange={e => { setInputVal(e.target.value); setInputError(''); }}
                placeholder="Mã CP: ACB, MBB..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none uppercase transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${inputError ? 'rgba(244,63,94,0.5)' : 'rgba(255,255,255,0.08)'}` }}
                maxLength={10} autoComplete="off" spellCheck={false}
              />
            </div>
            <select
              value={horizon}
              onChange={e => setHorizon(e.target.value as 'swing' | 'position')}
              className="text-xs text-slate-300 py-1.5 px-2 rounded-lg focus:outline-none shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <option value="swing">Swing</option>
              <option value="position">Position</option>
            </select>
            <button
              type="submit" disabled={isLoading}
              className="shrink-0 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}
            >
              {isLoading ? '…' : 'Phân tích'}
            </button>
          </form>

          {/* Quick picks */}
          <div className="hidden lg:flex items-center gap-1">
            {QUICK_PICKS.map(s => (
              <button
                key={s}
                onClick={() => pickSymbol(s)}
                className="px-2.5 py-1 rounded-md text-xs font-medium transition-all active:scale-95"
                style={{
                  background: s === displaySymbol ? 'rgba(139,92,246,0.22)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${s === displaySymbol ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  color: s === displaySymbol ? '#c4b5fd' : '#64748b',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Live price */}
          {closePrice && !isLoading && (
            <div
              className="hidden md:flex items-center gap-2 ml-auto shrink-0 px-3 py-1.5 rounded-lg anim-fade"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <span className="text-xs text-slate-500">{displaySymbol}</span>
              <span className="text-sm font-bold text-white tabular-nums">{closePrice.toFixed(2)}</span>
              <span className="text-xs text-slate-600">nghìn VND</span>
            </div>
          )}
        </div>
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

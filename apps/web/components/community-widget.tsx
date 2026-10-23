'use client';

import { usePosts, type NewsItem } from '../hooks/use-news';

interface Props { symbol: string; enabled: boolean }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

function SentimentDot({ s }: { s: number }) {
  if (s === 1)  return <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: '#22c55e' }} />;
  if (s === -1) return <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: '#ef4444' }} />;
  return <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: '#475569' }} />;
}

function PostCard({ item, symbol }: { item: NewsItem; symbol: string }) {
  const text = (item.description || item.title || '').replace(/<[^>]*>/g, '').trim();
  const preview = text.length > 200 ? text.slice(0, 200) + '…' : text;

  return (
    <div className="px-4 py-3.5 hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>

      {/* Content row */}
      <div className="flex gap-2.5 mb-2">
        <SentimentDot s={item.sentiment} />
        <p className="text-[12px] text-slate-300 leading-relaxed flex-1">{preview}</p>
      </div>

      {/* Tagged symbols */}
      {item.taggedSymbols.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2 ml-4">
          {item.taggedSymbols.slice(0, 5).map(s => (
            <span key={s.symbol}
              className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{
                background: s.symbol === symbol ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)',
                color: s.symbol === symbol ? '#c4b5fd' : '#64748b',
              }}>
              {s.symbol}
              <span style={{ color: (s.percentChange ?? 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                {(s.percentChange ?? 0) >= 0 ? '+' : ''}{(s.percentChange ?? 0).toFixed(1)}%
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between ml-4">
        <div className="flex items-center gap-1.5 min-w-0">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <span className="text-[10px] text-slate-600 truncate max-w-[100px]">{item.sourceName}</span>
          <span className="text-slate-700 shrink-0">·</span>
          <span className="text-[10px] text-slate-600 shrink-0">{timeAgo(item.date)}</span>
        </div>
        <div className="flex items-center gap-2.5 text-slate-600 shrink-0">
          {item.likes > 0 && (
            <span className="flex items-center gap-1 text-[10px]">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {item.likes}
            </span>
          )}
          {item.replies > 0 && (
            <span className="flex items-center gap-1 text-[10px]">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {item.replies}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommunityWidget({ symbol, enabled }: Props) {
  const { data: items, isLoading } = usePosts(symbol, enabled);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>

      {/* Header */}
      <div className="px-5 py-3.5 flex items-center gap-2.5"
        style={{ background: 'linear-gradient(90deg,rgba(99,102,241,0.08),rgba(255,255,255,0.02))', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-none">Cộng đồng thảo luận</p>
          <p className="text-xs text-slate-400 mt-0.5">{symbol} · FireAnt</p>
        </div>
        {items && items.length > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
            style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
            {items.length} bài
          </span>
        )}
      </div>

      {/* Sentiment legend */}
      <div className="px-4 py-2 flex items-center gap-3 text-[10px] text-slate-600"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Tích cực</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" /> Tiêu cực</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-600 inline-block" /> Trung lập</span>
      </div>

      {/* List */}
      <div style={{ maxHeight: '480px', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' } as React.CSSProperties}>

        {isLoading && (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-2.5">
                <div className="skeleton w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="skeleton h-3 rounded w-full" />
                  <div className="skeleton h-3 rounded w-5/6" />
                  <div className="skeleton h-3 rounded w-3/4" />
                  <div className="skeleton h-2.5 rounded w-1/3 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!items || items.length === 0) && (
          <div className="text-center py-10">
            <svg className="mx-auto mb-2.5 text-slate-700" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p className="text-slate-600 text-xs">Chưa có thảo luận về {symbol}</p>
          </div>
        )}

        {items && items.map(item => <PostCard key={item.id} item={item} symbol={symbol} />)}
      </div>
    </div>
  );
}

'use client';

import { useNews, type NewsItem } from '../hooks/use-news';

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

function SentimentBadge({ s }: { s: number }) {
  if (s === 1)  return <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>Tích cực</span>;
  if (s === -1) return <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>Tiêu cực</span>;
  return null;
}

function NewsCard({ item, symbol }: { item: NewsItem; symbol: string }) {
  return (
    <div className="px-4 py-3.5 hover:bg-white/[0.025] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>

      {/* Title row */}
      <div className="flex items-start gap-2 mb-1.5">
        <p className="text-[12.5px] font-semibold text-slate-200 leading-snug flex-1">
          {item.title || item.description.slice(0, 90)}
        </p>
        <SentimentBadge s={item.sentiment} />
      </div>

      {/* Description */}
      {item.description && item.title && (
        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mb-2">
          {item.description}
        </p>
      )}

      {/* Tagged symbols */}
      {item.taggedSymbols.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {item.taggedSymbols.slice(0, 5).map(s => (
            <span key={s.symbol}
              className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{
                background: s.symbol === symbol ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)',
                color: s.symbol === symbol ? '#c4b5fd' : '#64748b',
              }}>
              {s.symbol}
              <span style={{ color: s.percentChange >= 0 ? '#22c55e' : '#ef4444' }}>
                {s.percentChange >= 0 ? '+' : ''}{s.percentChange.toFixed(1)}%
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          <span className="text-[10px] text-slate-600 truncate max-w-[110px]">{item.sourceName}</span>
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

export function NewsWidget({ symbol, enabled }: Props) {
  const { data: items, isLoading } = useNews(symbol, enabled);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>

      {/* Header */}
      <div className="px-5 py-3.5 flex items-center gap-2.5"
        style={{ background: 'linear-gradient(90deg,rgba(245,158,11,0.08),rgba(255,255,255,0.02))', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
            <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-none">Tin tức thị trường</p>
          <p className="text-xs text-slate-400 mt-0.5">{symbol} · FireAnt</p>
        </div>
        {items && items.length > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
            style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
            {items.length} tin
          </span>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: '560px', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' } as React.CSSProperties}>

        {isLoading && (
          <div className="p-4 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton h-3.5 rounded w-5/6" />
                <div className="skeleton h-3 rounded w-full" />
                <div className="skeleton h-3 rounded w-4/6" />
                <div className="flex gap-2 mt-1">
                  <div className="skeleton h-2.5 rounded w-20" />
                  <div className="skeleton h-2.5 rounded w-14" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!items || items.length === 0) && (
          <div className="text-center py-10">
            <svg className="mx-auto mb-2.5 text-slate-700" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
            </svg>
            <p className="text-slate-600 text-xs">Chưa có tin tức cho {symbol}</p>
          </div>
        )}

        {items && items.map(item => <NewsCard key={item.id} item={item} symbol={symbol} />)}
      </div>
    </div>
  );
}

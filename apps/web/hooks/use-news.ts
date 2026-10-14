'use client';

import { useQuery } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface NewsItem {
  id: number;
  title: string;
  description: string;
  date: string;
  sourceName: string;
  sourceUrl: string;
  articleUrl: string | null;
  imageUrl: string | null;
  likes: number;
  replies: number;
  sentiment: number;
  taggedSymbols: Array<{ symbol: string; price: number; change: number; percentChange: number }>;
}

async function fetchNews(symbol: string): Promise<NewsItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/stocks/${encodeURIComponent(symbol)}/news?limit=15`);
  if (!res.ok) return [];
  const data = await res.json() as { items: NewsItem[] };
  return data.items ?? [];
}

async function fetchPosts(symbol: string): Promise<NewsItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/stocks/${encodeURIComponent(symbol)}/posts?limit=20`);
  if (!res.ok) return [];
  const data = await res.json() as { items: NewsItem[] };
  return data.items ?? [];
}

export function useNews(symbol: string, enabled: boolean) {
  return useQuery({
    queryKey: ['news', symbol],
    queryFn: () => fetchNews(symbol),
    enabled: enabled && !!symbol,
    staleTime: 3 * 60 * 1000,
    retry: 0,
  });
}

export function usePosts(symbol: string, enabled: boolean) {
  return useQuery({
    queryKey: ['posts', symbol],
    queryFn: () => fetchPosts(symbol),
    enabled: enabled && !!symbol,
    staleTime: 3 * 60 * 1000,
    retry: 0,
  });
}

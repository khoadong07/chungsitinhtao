import { env } from '../config/env.js';

interface RawPostSource {
  postSourceID: number;
  name: string;
  url: string;
}

interface RawTaggedSymbol {
  symbol: string;
  price: number;
  change: number;
  percentChange: number;
}

interface RawPost {
  postID: number;
  title: string | null;
  description: string | null;
  content: string | null;
  date: string;
  user: { id: string; name: string } | null;
  postSource: RawPostSource | null;
  taggedSymbols: RawTaggedSymbol[];
  totalLikes: number;
  totalReplies: number;
  sentiment: number; // -1 bearish, 0 neutral, 1 bullish
  contentURL: string | null;
  linkImage: string | null;
}

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

function decodeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, '')   // strip remaining HTML tags
    .replace(/\s+/g, ' ')
    .trim();
}

const FIREANT_HEADERS = {
  'accept': 'application/json, text/plain, */*',
  'accept-language': 'en,vi;q=0.9',
  'origin': 'https://fireant.vn',
  'referer': 'https://fireant.vn/',
  'sec-ch-ua': '"Chromium";v="154", "Google Chrome";v="154", "Not A(Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36',
};

export async function getSymbolPosts(symbol: string, limit = 15): Promise<NewsItem[]> {
  return _fetchPosts(symbol, 0, limit);
}

export async function getSymbolNews(symbol: string, limit = 15): Promise<NewsItem[]> {
  return _fetchPosts(symbol, 1, limit);
}

async function _fetchPosts(symbol: string, type: 0 | 1, limit: number): Promise<NewsItem[]> {
  const token = env.FIREANT_TOKEN;
  if (!token) return [];

  const url = `https://restv2.fireant.vn/posts?symbol=${encodeURIComponent(symbol.toUpperCase())}&type=${type}&offset=0&limit=${limit}`;

  const res = await fetch(url, {
    headers: { ...FIREANT_HEADERS, 'authorization': `Bearer ${token}` },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return [];

  const data = await res.json() as unknown;
  if (!Array.isArray(data)) return [];

  return (data as RawPost[]).map(p => ({
    id: p.postID,
    title: decodeHtml(p.title),
    description: decodeHtml(p.description ?? p.content),
    date: p.date,
    sourceName: p.postSource?.name ?? (p.user as { name?: string } | null)?.name ?? 'FireAnt',
    sourceUrl: p.postSource?.url ?? 'https://fireant.vn',
    articleUrl: p.contentURL ?? null,
    imageUrl: p.linkImage ?? null,
    likes: p.totalLikes ?? 0,
    replies: p.totalReplies ?? 0,
    sentiment: p.sentiment ?? 0,
    taggedSymbols: (p.taggedSymbols ?? []).map(s => ({
      symbol: s.symbol,
      price: s.price,
      change: s.change,
      percentChange: s.percentChange,
    })),
  }));
}

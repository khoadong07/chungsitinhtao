import type { AnalysisOutput } from './types';

// Empty string → browser uses same-origin relative paths, proxied by Next.js rewrites to api:4000
const API_BASE = '';

export async function pollAnalysisReport(analysisId: string): Promise<Pick<AnalysisOutput, 'report' | 'model' | 'promptVersion'> | null> {
  const res = await fetch(`${API_BASE}/api/v1/analysis/${encodeURIComponent(analysisId)}`);
  if (!res.ok) return null;
  const data = await res.json() as AnalysisOutput;
  return { report: data.report, model: data.model, promptVersion: data.promptVersion };
}

export async function getHealth() {
  const res = await fetch(`${API_BASE}/api/v1/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json() as Promise<{ status: string; database: string; marketDataProvider: string }>;
}

export async function getCandles(symbol: string, limit = 250) {
  const res = await fetch(`${API_BASE}/api/v1/stocks/${encodeURIComponent(symbol)}/candles?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch candles: ${res.status}`);
  return res.json();
}

export async function getIndicators(symbol: string, limit = 250) {
  const res = await fetch(`${API_BASE}/api/v1/stocks/${encodeURIComponent(symbol)}/indicators?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch indicators: ${res.status}`);
  return res.json();
}

export async function runAnalysis(params: {
  symbol: string;
  lookback?: number;
  holdingHorizon?: 'swing' | 'position';
}): Promise<AnalysisOutput> {
  const res = await fetch(`${API_BASE}/api/v1/analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      symbol: params.symbol.toUpperCase(),
      timeframe: '1D',
      lookback: params.lookback ?? 250,
      analysisType: 'technical',
      holdingHorizon: params.holdingHorizon ?? 'swing',
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as { error?: { message?: string } }).error?.message ?? `Analysis failed: ${res.status}`;
    throw new Error(msg);
  }
  return res.json() as Promise<AnalysisOutput>;
}

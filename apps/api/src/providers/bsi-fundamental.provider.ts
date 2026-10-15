const BSI_BASE = 'https://binvest.bsi.com.vn';
const BSI_HEADERS = {
  accept: 'application/json, text/plain, */*',
  origin: 'https://resource1.bsi.com.vn',
  referer: 'https://resource1.bsi.com.vn/',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36',
};

const CACHE_TTL_MS = 5 * 60 * 1000;

export interface SignalCount {
  negative: number;
  neutral: number;
  positive: number;
}

export interface BsiStockFilter {
  code: string;
  floor: string;
  closePrice: number;
  totalVol: number;
  totalVal: number;
  foreignOwnershipPct: number;
  perChange1D: number;
  perChange5D: number;
  perChange1M: number;
  perChange3M: number;
  perChange6M: number;
  perChange1Y: number;
  perChangeYTD: number;
  beta: number;
  high52W: number;
  low52W: number;
  eps: number;
  bvps: number;
  pe: number;
  pb: number;
  ps: number;
  marketCapBillion: number;
  roe: number;
  roa: number;
  avgVol5d: number;
  avgVol10d: number;
  avgVol20d: number;
  avgVol60d: number;
  industry: string;
  technicalSignal: SignalCount;
  trendSignal: SignalCount;
  generalSignal: SignalCount;
  macdBelowSignal: boolean;
  rsiOversold: boolean;
  rsiOverbought: boolean;
}

export interface BsiValuation {
  closePriceVnd: number;
  averageGrowthLNST: number | null;
  peFairValue: number | null;
  pbFairValue: number | null;
  peEstimated: number | null;
  pbEstimated: number | null;
}

export interface BsiFundamentalData {
  filter: BsiStockFilter;
  valuation: BsiValuation;
  fetchedAt: string;
}

interface FilterCache {
  data: BsiStockFilter[];
  expiresAt: number;
}
interface ValuationCache {
  data: BsiValuation;
  expiresAt: number;
}

const filterCache = new Map<string, FilterCache>();
const valuationCache = new Map<string, ValuationCache>();

export function clearBsiCache(): void {
  filterCache.clear();
  valuationCache.clear();
}

function num(v: unknown): number {
  return Number(v) || 0;
}

function sig(v: unknown): SignalCount {
  const s = v as Partial<SignalCount> | undefined;
  return { negative: num(s?.negative), neutral: num(s?.neutral), positive: num(s?.positive) };
}

function mapFilterRow(raw: Record<string, unknown>): BsiStockFilter {
  return {
    code: String(raw['code'] ?? ''),
    floor: String(raw['floor'] ?? ''),
    closePrice: num(raw['closePrice']),
    totalVol: num(raw['totalVol']),
    totalVal: num(raw['totalVal']),
    foreignOwnershipPct: num(raw['TyleNDTNNdangnamgiu']),
    perChange1D: num(raw['perChange1D']),
    perChange5D: num(raw['perChange5D']),
    perChange1M: num(raw['perChange1M']),
    perChange3M: num(raw['perChange3M']),
    perChange6M: num(raw['perChange6M']),
    perChange1Y: num(raw['perChange1Y']),
    perChangeYTD: num(raw['perChangeYTD']),
    beta: num(raw['beta']),
    high52W: num(raw['PRICE_HIGHEST_CR_52W']),
    low52W: num(raw['PRICE_LOWEST_CR_52W']),
    eps: num(raw['EPS']),
    bvps: num(raw['BVPS']),
    pe: num(raw['PE']),
    pb: num(raw['PB']),
    ps: num(raw['PS']),
    marketCapBillion: num(raw['marketCap']),
    roe: num(raw['ROE']),
    roa: num(raw['ROA']),
    avgVol5d: num(raw['avg_totalVol_5d']),
    avgVol10d: num(raw['avg_totalVol_10d']),
    avgVol20d: num(raw['avg_totalVol_20d']),
    avgVol60d: num(raw['avg_totalVol_60d']),
    industry: String(raw['LV4'] ?? ''),
    technicalSignal: sig(raw['technicalSignal']),
    trendSignal: sig(raw['trendSignal']),
    generalSignal: sig(raw['generalSignal']),
    macdBelowSignal: num(raw['macd_dang_o_duoi_duong_tin_hieu']) === 1,
    rsiOversold: num(raw['rsi_dang_o_vung_qua_ban_30']) === 1,
    rsiOverbought: num(raw['rsi_dang_o_vung_qua_mua_70']) === 1,
  };
}


function pick(arr: number[], idx: number): number | null {
  const v = arr[idx];
  return typeof v === 'number' && v > 0 ? v : null;
}

function mapValuation(raw: Record<string, unknown>): BsiValuation {
  // With average=1, BSI returns pre-computed fair values:
  // reasonablePriceStock: [avgPE, avgPB, EPS, BVPS, PE_fairValue, PB_fairValue]
  // estimatedPriceStock:   [estPE, estPB, estEPS, estBVPS, est_PE_fair, est_PB_fair]
  const reasonable = (raw['reasonablePriceStock'] as number[] | undefined) ?? [];
  const estimated  = (raw['estimatedPriceStock']  as number[] | undefined) ?? [];

  return {
    closePriceVnd: num(raw['closePrice']),
    averageGrowthLNST: raw['averageGrowthLNST'] != null ? num(raw['averageGrowthLNST']) : null,
    peFairValue:  pick(reasonable, 4),
    pbFairValue:  pick(reasonable, 5),
    peEstimated:  pick(estimated,  4),
    pbEstimated:  pick(estimated,  5),
  };
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 800): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // Don't retry on AbortError (timeout) — it won't get faster
      if (err instanceof Error && err.name === 'AbortError') throw err;
      if (i < retries) await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

async function fetchAllFilters(timeoutMs: number): Promise<BsiStockFilter[]> {
  const cached = filterCache.get('all');
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  return withRetry(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${BSI_BASE}/api/v1/filter`, {
        headers: BSI_HEADERS,
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`BSI filter HTTP ${res.status}`);
      const body = (await res.json()) as { status: number; data: Record<string, unknown>[] };
      if (body.status !== 200 || !Array.isArray(body.data)) throw new Error('BSI filter bad response');
      const data = body.data.map(mapFilterRow);
      filterCache.set('all', { data, expiresAt: Date.now() + CACHE_TTL_MS });
      return data;
    } finally {
      clearTimeout(timer);
    }
  });
}

async function fetchValuationRaw(symbol: string, timeoutMs: number): Promise<Record<string, unknown>> {
  return withRetry(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      // average=1 returns stock's own 1Y avg P/E, P/B and pre-computed fair values
      const url = `${BSI_BASE}/api/v1/investment/stock-valuation?stock=${encodeURIComponent(symbol)}&average=1&perWelfareFund=0.05`;
      const res = await fetch(url, { headers: BSI_HEADERS, signal: controller.signal });
      if (!res.ok) throw new Error(`BSI valuation HTTP ${res.status}`);
      const body = (await res.json()) as { status: number; data: Record<string, unknown> | null };
      if (body.status !== 200 || !body.data) throw new Error('BSI valuation bad response');
      return body.data;
    } finally {
      clearTimeout(timer);
    }
  });
}

export async function getBsiFundamental(
  symbol: string,
  timeoutMs = 20000,
): Promise<BsiFundamentalData | null> {
  try {
    // Check valuation cache before fetching (avoids parallel fetch if already cached)
    const cachedVal = valuationCache.get(symbol);

    // Fetch filter + valuation in parallel — each takes ~3-4s so sequential would risk timeout
    const [filters, rawValuation] = await Promise.all([
      fetchAllFilters(timeoutMs),
      cachedVal && cachedVal.expiresAt > Date.now()
        ? Promise.resolve(null) // will use cache below
        : fetchValuationRaw(symbol, timeoutMs),
    ]);

    const row = filters.find(f => f.code === symbol);
    if (!row) return null;

    let valuation: BsiValuation;
    if (cachedVal && cachedVal.expiresAt > Date.now()) {
      valuation = cachedVal.data;
    } else if (rawValuation) {
      valuation = mapValuation(rawValuation);
      valuationCache.set(symbol, { data: valuation, expiresAt: Date.now() + CACHE_TTL_MS });
    } else {
      return null;
    }

    return { filter: row, valuation, fetchedAt: new Date().toISOString() };
  } catch {
    return null;
  }
}

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBsiFundamental, clearBsiCache } from '../providers/bsi-fundamental.provider.js';

const mockFilterRow = {
  code: 'MBB',
  floor: 'HOSE',
  closePrice: 19.35,
  totalVol: 15849800,
  totalVal: 306.05,
  TyleNDTNNdangnamgiu: 23.23,
  perChange1D: 1.57,
  perChange5D: 1.31,
  perChange1M: -1.78,
  perChange3M: -5.38,
  perChange6M: -9.52,
  perChange1Y: -10.69,
  perChangeYTD: -4.51,
  beta: 0.81,
  PRICE_HIGHEST_CR_52W: 23.23,
  PRICE_LOWEST_CR_52W: 18.03,
  EPS: 2987.28,
  BVPS: 15569.23,
  PE: 6.48,
  PB: 1.24,
  PS: 3.28,
  marketCap: 194830.31,
  ROE: 21.16,
  ROA: 1.98,
  avg_totalVol_5d: 11531151,
  avg_totalVol_10d: 11396467,
  avg_totalVol_20d: 11265248,
  avg_totalVol_60d: 12756914,
  LV4: 'Ngân hàng',
  technicalSignal: { negative: 2, neutral: 5, positive: 1 },
  trendSignal: { negative: 9, neutral: 0, positive: 4 },
  generalSignal: { negative: 11, neutral: 5, positive: 5 },
  macd_dang_o_duoi_duong_tin_hieu: 1,
  rsi_dang_o_vung_qua_ban_30: 0,
  rsi_dang_o_vung_qua_mua_70: 0,
};

const mockValuationData = {
  closePrice: 19350,
  averageGrowthLNST: 27.48,
  reasonablePriceStock: [0, 0, 2987.28, 15569.23, 0, 0],
  estimatedPriceStock: [0, 0, 3220.98, 17326.26, 0, 0],
};

function makeFetchMock(filterData = [mockFilterRow], valuationData = mockValuationData) {
  return vi.fn().mockImplementation((url: string) => {
    if (String(url).includes('/api/v1/filter')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ status: 200, data: filterData }),
      });
    }
    if (String(url).includes('/stock-valuation')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ status: 200, data: valuationData }),
      });
    }
    return Promise.reject(new Error('Unknown URL'));
  });
}

describe('getBsiFundamental', () => {
  beforeEach(() => {
    clearBsiCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns BsiFundamentalData for known symbol', async () => {
    vi.stubGlobal('fetch', makeFetchMock());
    const result = await getBsiFundamental('MBB');
    expect(result).not.toBeNull();
    expect(result!.filter.code).toBe('MBB');
    expect(result!.filter.industry).toBe('Ngân hàng');
    expect(result!.fetchedAt).toBeTruthy();
  });

  it('returns null for unknown symbol', async () => {
    vi.stubGlobal('fetch', makeFetchMock([]));
    const result = await getBsiFundamental('UNKNOWN');
    expect(result).toBeNull();
  });

  it('returns null when fetch throws (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const result = await getBsiFundamental('MBB');
    expect(result).toBeNull();
  });

  it('maps PE, PB, ROE correctly', async () => {
    vi.stubGlobal('fetch', makeFetchMock());
    const result = await getBsiFundamental('MBB');
    expect(result!.filter.pe).toBeCloseTo(6.48);
    expect(result!.filter.pb).toBeCloseTo(1.24);
    expect(result!.filter.roe).toBeCloseTo(21.16);
    expect(result!.filter.eps).toBeCloseTo(2987.28);
    expect(result!.filter.beta).toBeCloseTo(0.81);
    expect(result!.filter.foreignOwnershipPct).toBeCloseTo(23.23);
  });

  it('maps valuation peFairValue from reasonablePriceStock[2]', async () => {
    vi.stubGlobal('fetch', makeFetchMock());
    const result = await getBsiFundamental('MBB');
    expect(result!.valuation.peFairValue).toBeCloseTo(2987.28);
    expect(result!.valuation.pbFairValue).toBeCloseTo(15569.23);
    expect(result!.valuation.peEstimated).toBeCloseTo(3220.98);
    expect(result!.valuation.pbEstimated).toBeCloseTo(17326.26);
  });

  it('sets peFairValue to null when reasonablePriceStock[2] is 0', async () => {
    vi.stubGlobal('fetch', makeFetchMock(undefined, {
      ...mockValuationData,
      reasonablePriceStock: [0, 0, 0, 0, 0, 0],
      estimatedPriceStock: [0, 0, 0, 0, 0, 0],
    }));
    const result = await getBsiFundamental('MBB');
    expect(result!.valuation.peFairValue).toBeNull();
    expect(result!.valuation.pbFairValue).toBeNull();
  });

  it('uses filter cache: second call does NOT call fetch again', async () => {
    const mockFetch = makeFetchMock();
    vi.stubGlobal('fetch', mockFetch);
    await getBsiFundamental('MBB');
    await getBsiFundamental('MBB');
    // filter called once, valuation called once (first call), second reuses both
    const filterCalls = mockFetch.mock.calls.filter(c => String(c[0]).includes('/filter'));
    expect(filterCalls.length).toBe(1);
  });

  it('maps macdBelowSignal and rsiOversold correctly', async () => {
    vi.stubGlobal('fetch', makeFetchMock());
    const result = await getBsiFundamental('MBB');
    expect(result!.filter.macdBelowSignal).toBe(true);
    expect(result!.filter.rsiOversold).toBe(false);
    expect(result!.filter.rsiOverbought).toBe(false);
  });

  it('maps generalSignal counts correctly', async () => {
    vi.stubGlobal('fetch', makeFetchMock());
    const result = await getBsiFundamental('MBB');
    expect(result!.filter.generalSignal).toEqual({ negative: 11, neutral: 5, positive: 5 });
  });

  it('returns null when valuation API returns non-200', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes('/filter')) {
        return Promise.resolve({ ok: true, json: async () => ({ status: 200, data: [mockFilterRow] }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ status: 401, data: null }) });
    });
    vi.stubGlobal('fetch', mockFetch);
    const result = await getBsiFundamental('MBB');
    expect(result).toBeNull();
  });
});

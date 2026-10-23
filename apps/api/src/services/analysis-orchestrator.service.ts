import { randomUUID } from 'crypto';
import { getCandles, type MarketDataResult } from './market-data.service.js';
import { saveAnalysisRun, updateAnalysisReport } from '../repositories/analysis.repository.js';
import { calculateIndicators, type TechnicalAnalysisResult } from './technical-analysis.service.js';
import { detectPriceZones, type PriceZone } from './support-resistance.service.js';
import { runDecisionEngine, type DecisionResult } from './decision-engine.service.js';
import { generateReport } from './llm-analysis.service.js';
import { getBsiFundamental, type BsiFundamentalData } from '../providers/bsi-fundamental.provider.js';
import type { AnalysisReport } from '../schemas/analysis.schema.js';

export interface AnalysisInput {
  symbol: string;
  timeframe: '1D';
  lookback: number;
  holdingHorizon: 'swing' | 'position';
  withLlm?: boolean;
}

export interface AnalysisOutput {
  analysisId: string;
  symbol: string;
  asOf: string;
  dataSource: MarketDataResult['source'];
  technical: TechnicalAnalysisResult;
  decision: DecisionResult;
  priceZones: PriceZone[];
  fundamental: BsiFundamentalData | null;
  report: AnalysisReport | null;
  promptVersion: string | null;
  model: string | null;
  warnings: string[];
}

// Phase 1: fetch data, compute technicals, save to DB — returns immediately (no LLM wait)
export async function runAnalysis(input: AnalysisInput): Promise<AnalysisOutput> {
  const [marketData, fundamental] = await Promise.all([
    getCandles({ symbol: input.symbol, timeframe: input.timeframe, limit: input.lookback }),
    getBsiFundamental(input.symbol, 20000).catch(() => null),
  ]);

  const technical = calculateIndicators(marketData.candles);
  const { snapshot, candles, dataQuality } = technical;
  const priceZones = detectPriceZones(marketData.candles, snapshot.atr14);
  const recentHistogram = candles.slice(-5).map(c => c.macdHistogram);
  const decision = runDecisionEngine(snapshot, recentHistogram, priceZones, dataQuality);

  const warnings: string[] = [];
  if (marketData.source.isMock)  warnings.push('Data is simulated (mock mode). Do not use for real trading decisions.');
  if (marketData.source.isStale) warnings.push('Data may be stale. Refresh for latest analysis.');
  if (!dataQuality.hasEma200)    warnings.push('EMA200 unavailable — insufficient historical data for long-term trend.');
  if (fundamental === null)      warnings.push('Không lấy được dữ liệu cơ bản từ BSI.');

  const fastResult: AnalysisOutput = {
    analysisId: randomUUID(),
    symbol: input.symbol,
    asOf: new Date().toISOString(),
    dataSource: marketData.source,
    technical,
    decision,
    priceZones,
    fundamental,
    report: null,
    promptVersion: null,
    model: null,
    warnings,
  };

  // Persist fast result immediately so the GET /:id endpoint can serve it
  try {
    await saveAnalysisRun(fastResult);
  } catch {
    if (process.env['NODE_ENV'] !== 'test') {
      process.stderr.write(`[warn] Failed to persist analysis ${fastResult.analysisId}\n`);
    }
  }

  // Phase 2: run LLM in background only when requested
  if (input.withLlm) {
    enrichWithLlmReport(fastResult).catch(err => {
      process.stderr.write(`[llm-bg] ${fastResult.analysisId}: ${err instanceof Error ? err.message : String(err)}\n`);
    });
  }

  return fastResult;
}

// In-process dedup: tracks analysisIds currently being enriched
const _inProgress = new Set<string>();

export function isLlmInProgress(analysisId: string): boolean {
  return _inProgress.has(analysisId);
}

export async function triggerLlmEnrichment(analysisId: string, base: AnalysisOutput): Promise<'started' | 'in_progress'> {
  if (_inProgress.has(analysisId)) return 'in_progress';
  _inProgress.add(analysisId);
  enrichWithLlmReport(base).catch(err => {
    process.stderr.write(`[llm-bg] ${analysisId}: ${err instanceof Error ? err.message : String(err)}\n`);
  }).finally(() => _inProgress.delete(analysisId));
  return 'started';
}

async function enrichWithLlmReport(base: AnalysisOutput): Promise<void> {
  const { report, promptVersion, model } = await generateReport(base);
  try {
    await updateAnalysisReport(base.analysisId, report, model, promptVersion);
  } catch (err) {
    process.stderr.write(`[llm-bg] update failed ${base.analysisId}: ${err instanceof Error ? err.message : String(err)}\n`);
  }
}

import { prisma } from '../lib/prisma.js';
import type { AnalysisOutput } from '../services/analysis-orchestrator.service.js';

// Prisma 6 removed InputJsonValue; JSON fields accept any serialisable value
function toJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as object;
}

export async function saveAnalysisRun(output: AnalysisOutput): Promise<void> {
  await prisma.analysisRun.create({
    data: {
      id: output.analysisId,
      symbol: output.symbol,
      timeframe: '1D',
      analysisType: 'technical',
      asOf: new Date(output.asOf),
      provider: output.dataSource.provider,
      isMock: output.dataSource.isMock,
      isStale: output.dataSource.isStale,
      inputSnapshot: toJson({
        symbol: output.symbol,
        timeframe: '1D',
        asOf: output.asOf,
        dataSource: output.dataSource,
        warnings: output.warnings,
      }),
      technicalSnapshot: toJson({
        snapshot: output.technical.snapshot,
        dataQuality: output.technical.dataQuality,
      }),
      decisionSnapshot: toJson(output.decision),
      report: toJson(output.report ?? {}),
      model: output.model,
      promptVersion: output.promptVersion,
    },
  });
}

export async function updateAnalysisReport(
  id: string,
  report: AnalysisOutput['report'],
  model: string | null,
  promptVersion: string | null,
): Promise<void> {
  await prisma.analysisRun.update({
    where: { id },
    data: {
      report: toJson(report ?? {}),
      model,
      promptVersion,
    },
  });
}

export async function findAnalysisRunById(id: string): Promise<AnalysisOutput | null> {
  const run = await prisma.analysisRun.findUnique({ where: { id } });
  if (!run) return null;

  const inputSnap = run.inputSnapshot as unknown as {
    dataSource: AnalysisOutput['dataSource'];
    warnings: string[];
  };
  const techSnap = run.technicalSnapshot as unknown as {
    snapshot: AnalysisOutput['technical']['snapshot'];
    dataQuality: AnalysisOutput['technical']['dataQuality'];
  };
  const reportObj = run.report as unknown as Record<string, unknown>;

  return {
    analysisId: run.id,
    symbol: run.symbol,
    asOf: run.asOf.toISOString(),
    dataSource: inputSnap.dataSource,
    technical: {
      candles: [],
      snapshot: techSnap.snapshot,
      dataQuality: techSnap.dataQuality,
    },
    decision: run.decisionSnapshot as unknown as AnalysisOutput['decision'],
    priceZones: [],
    fundamental: null,
    report: Object.keys(reportObj).length > 0
      ? reportObj as unknown as AnalysisOutput['report']
      : null,
    promptVersion: run.promptVersion,
    model: run.model,
    warnings: inputSnap.warnings ?? [],
  };
}

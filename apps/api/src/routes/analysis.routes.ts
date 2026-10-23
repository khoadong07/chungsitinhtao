import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { runAnalysis, triggerLlmEnrichment } from '../services/analysis-orchestrator.service.js';
import { findAnalysisRunById } from '../repositories/analysis.repository.js';
import { AppError } from '../utils/errors.js';

const analysisRequestSchema = z.object({
  symbol: z
    .string()
    .regex(/^[A-Za-z0-9]{2,10}$/, 'Symbol must be 2-10 alphanumeric characters')
    .transform(s => s.toUpperCase()),
  timeframe: z.literal('1D').default('1D'),
  lookback: z.coerce.number().int().min(30).max(500).default(250),
  analysisType: z.literal('technical').default('technical'),
  holdingHorizon: z.enum(['swing', 'position']).default('swing'),
  withLlm: z.boolean().default(false),
});

export async function analysisRoutes(fastify: FastifyInstance) {
  fastify.post('/api/v1/analysis', async (request, reply) => {
    const bodyResult = analysisRequestSchema.safeParse(request.body);
    if (!bodyResult.success) {
      throw new AppError('INVALID_REQUEST', bodyResult.error.errors[0]?.message ?? 'Invalid request body', 400);
    }

    const { symbol, timeframe, lookback, holdingHorizon, withLlm } = bodyResult.data;
    const output = await runAnalysis({ symbol, timeframe, lookback, holdingHorizon, withLlm });
    return reply.send(output);
  });

  fastify.get('/api/v1/analysis/:analysisId', async (request, reply) => {
    const { analysisId } = request.params as { analysisId: string };

    try {
      const result = await findAnalysisRunById(analysisId);
      if (!result) {
        throw new AppError('NOT_FOUND', `Analysis ${analysisId} not found`, 404);
      }
      return reply.send(result);
    } catch (err) {
      if (err instanceof AppError || (err instanceof Error && 'statusCode' in err)) throw err;
      throw new AppError('DATABASE_ERROR', 'Unable to retrieve analysis history', 503);
    }
  });

  // Trigger LLM enrichment on demand for an existing analysis
  fastify.post('/api/v1/analysis/:analysisId/report', async (request, reply) => {
    const { analysisId } = request.params as { analysisId: string };

    try {
      const existing = await findAnalysisRunById(analysisId);
      if (!existing) {
        throw new AppError('NOT_FOUND', `Analysis ${analysisId} not found`, 404);
      }
      if (existing.report !== null) {
        return reply.send({ status: 'already_done' });
      }
      const status = await triggerLlmEnrichment(analysisId, existing);
      return reply.send({ status });
    } catch (err) {
      if (err instanceof AppError || (err instanceof Error && 'statusCode' in err)) throw err;
      throw new AppError('DATABASE_ERROR', 'Unable to trigger LLM enrichment', 503);
    }
  });
}

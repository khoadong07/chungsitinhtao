import type { FastifyInstance } from 'fastify';
import { symbolParamSchema, indicatorQuerySchema } from '../schemas/market-data.schema.js';
import { getCandles } from '../services/market-data.service.js';
import { calculateIndicators } from '../services/technical-analysis.service.js';
import { detectPriceZones } from '../services/support-resistance.service.js';
import { AppError } from '../utils/errors.js';

export async function indicatorsRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Params: { symbol: string };
    Querystring: { timeframe?: string; limit?: string };
  }>('/api/v1/stocks/:symbol/indicators', async (request, reply) => {
    const paramParse = symbolParamSchema.safeParse(request.params);
    if (!paramParse.success) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_SYMBOL',
          message: paramParse.error.errors[0]?.message ?? 'Invalid symbol',
        },
      });
    }

    const queryParse = indicatorQuerySchema.safeParse(request.query);
    if (!queryParse.success) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_QUERY',
          message: queryParse.error.errors[0]?.message ?? 'Invalid query parameters',
        },
      });
    }

    const { symbol } = paramParse.data;
    const { timeframe, limit } = queryParse.data;

    try {
      const marketData = await getCandles({ symbol, timeframe, limit });
      const technical = calculateIndicators(marketData.candles);
      const priceZones = detectPriceZones(marketData.candles, technical.snapshot.atr14);

      return reply.send({
        symbol,
        timeframe,
        snapshot: technical.snapshot,
        candles: technical.candles,
        priceZones,
        dataQuality: technical.dataQuality,
        source: marketData.source,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send({
          error: { code: err.code, message: err.message },
        });
      }
      throw err;
    }
  });
}

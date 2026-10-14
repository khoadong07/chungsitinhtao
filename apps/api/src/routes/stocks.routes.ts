import type { FastifyInstance } from 'fastify';
import { symbolParamSchema, candleQuerySchema } from '../schemas/market-data.schema.js';
import { getCandles } from '../services/market-data.service.js';
import { getBsiFundamental } from '../providers/bsi-fundamental.provider.js';
import { getSymbolNews, getSymbolPosts } from '../providers/fireant-news.provider.js';
import { AppError } from '../utils/errors.js';

export async function stocksRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Params: { symbol: string };
    Querystring: { timeframe?: string; limit?: string };
  }>('/api/v1/stocks/:symbol/candles', async (request, reply) => {
    const paramParse = symbolParamSchema.safeParse(request.params);
    if (!paramParse.success) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_SYMBOL',
          message: paramParse.error.errors[0]?.message ?? 'Invalid symbol',
        },
      });
    }

    const queryParse = candleQuerySchema.safeParse(request.query);
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
      const result = await getCandles({ symbol, timeframe, limit });
      return reply.send({
        symbol,
        timeframe,
        count: result.candles.length,
        candles: result.candles,
        source: result.source,
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

  fastify.get<{ Params: { symbol: string } }>(
    '/api/v1/stocks/:symbol/fundamental',
    async (request, reply) => {
      const paramParse = symbolParamSchema.safeParse(request.params);
      if (!paramParse.success) {
        return reply.status(400).send({
          error: { code: 'INVALID_SYMBOL', message: 'Invalid symbol' },
        });
      }
      const { symbol } = paramParse.data;
      const data = await getBsiFundamental(symbol);
      if (!data) {
        throw new AppError('NOT_FOUND', `No fundamental data found for ${symbol}`, 404);
      }
      return reply.send({ symbol, ...data });
    },
  );

  fastify.get<{ Params: { symbol: string }; Querystring: { limit?: string } }>(
    '/api/v1/stocks/:symbol/news',
    async (request, reply) => {
      const paramParse = symbolParamSchema.safeParse(request.params);
      if (!paramParse.success) {
        return reply.status(400).send({ error: { code: 'INVALID_SYMBOL', message: 'Invalid symbol' } });
      }
      const limit = Math.min(20, Math.max(1, parseInt(request.query.limit ?? '10', 10) || 10));
      const news = await getSymbolNews(paramParse.data.symbol, limit);
      return reply.send({ symbol: paramParse.data.symbol, count: news.length, items: news });
    },
  );

  fastify.get<{ Params: { symbol: string }; Querystring: { limit?: string } }>(
    '/api/v1/stocks/:symbol/posts',
    async (request, reply) => {
      const paramParse = symbolParamSchema.safeParse(request.params);
      if (!paramParse.success) {
        return reply.status(400).send({ error: { code: 'INVALID_SYMBOL', message: 'Invalid symbol' } });
      }
      const limit = Math.min(30, Math.max(1, parseInt(request.query.limit ?? '15', 10) || 15));
      const posts = await getSymbolPosts(paramParse.data.symbol, limit);
      return reply.send({ symbol: paramParse.data.symbol, count: posts.length, items: posts });
    },
  );
}

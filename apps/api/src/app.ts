import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { healthRoutes } from './routes/health.routes.js';
import { stocksRoutes } from './routes/stocks.routes.js';
import { indicatorsRoutes } from './routes/indicators.routes.js';
import { analysisRoutes } from './routes/analysis.routes.js';
import { adminRoutes } from './routes/admin.routes.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === 'test' ? 'silent' : 'info',
    },
    bodyLimit: 1024 * 64,
  });

  await fastify.register(cors, {
    origin: env.WEB_ORIGIN,
  });

  await fastify.register(rateLimit, {
    max: 30,
    timeWindow: '1 minute',
    errorResponseBuilder: (_request, context) => ({
      error: {
        code: 'RATE_LIMITED',
        message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
      },
    }),
  });

  await fastify.register(healthRoutes);
  await fastify.register(stocksRoutes);
  await fastify.register(indicatorsRoutes);
  await fastify.register(analysisRoutes);
  await fastify.register(adminRoutes);

  fastify.setErrorHandler(async (error: Error & { statusCode?: number; code?: string }, _request, reply) => {
    fastify.log.error(error);
    const statusCode = error.statusCode ?? 500;
    return reply.status(statusCode).send({
      error: {
        code: error.code ?? 'INTERNAL_ERROR',
        message: env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
      },
    });
  });

  return fastify;
}

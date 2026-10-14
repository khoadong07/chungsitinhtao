import type { FastifyInstance } from 'fastify';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/health', async (_request, reply) => {
    let dbStatus = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = env.DATABASE_URL ? 'configured_not_connected' : 'not_configured';
    }

    return reply.send({
      status: 'ok',
      database: dbStatus,
      marketDataProvider: env.MARKET_DATA_PROVIDER,
    });
  });
}

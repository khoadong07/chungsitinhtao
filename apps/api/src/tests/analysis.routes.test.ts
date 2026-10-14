import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../app.js';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    $queryRaw: vi.fn().mockRejectedValue(new Error('No DB in tests')),
    analysisRun: {
      create: vi.fn().mockRejectedValue(new Error('No DB in tests')),
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

describe('Analysis routes', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    app = await buildApp();
    await app.ready();
  });

  it('POST /api/v1/analysis with valid symbol returns 200 with full result', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/analysis',
      payload: { symbol: 'MBB' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<Record<string, unknown>>();
    expect(typeof body['analysisId']).toBe('string');
    expect(body['symbol']).toBe('MBB');
    expect(body['decision']).toBeDefined();
    expect(body['report']).toBeDefined();
    const report = body['report'] as Record<string, unknown>;
    expect(typeof report['summary']).toBe('string');
  });

  it('POST /api/v1/analysis auto-uppercases lowercase symbol', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/analysis',
      payload: { symbol: 'mbb' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<Record<string, unknown>>();
    expect(body['symbol']).toBe('MBB');
  });

  it('POST /api/v1/analysis with empty body returns 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/analysis',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/v1/analysis with lookback too small returns 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/analysis',
      payload: { symbol: 'MBB', lookback: 5 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/v1/analysis with lookback too large returns 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/analysis',
      payload: { symbol: 'MBB', lookback: 9999 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('GET /api/v1/analysis/nonexistent-id returns 404', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/analysis/nonexistent-id',
    });
    expect(res.statusCode).toBe(404);
    // Fastify v5 serializes AppError as { code, statusCode, message }
    const body = res.json<{ code: string }>();
    expect(body.code).toBe('NOT_FOUND');
  });

  it('GET /api/v1/health returns ok with configured_not_connected when no DB', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ status: string; database: string; marketDataProvider: string }>();
    expect(body.status).toBe('ok');
    expect(body.database).toBe('configured_not_connected');
    expect(body.marketDataProvider).toBe('mock');
  });
});

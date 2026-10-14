import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { signAdminToken, verifyAdminToken } from '../utils/jwt.js';
import { getAllConfig, upsertConfig, EDITABLE_KEYS, type ConfigKey } from '../repositories/admin.repository.js';
import { AppError } from '../utils/errors.js';

const ADMIN_PASSWORD = process.env['ADMIN_PASSWORD'] ?? 'admin123';

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const auth = request.headers['authorization'];
  if (!auth?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: { message: 'Unauthorized' } });
  }
  const token = auth.slice(7);
  if (!verifyAdminToken(token)) {
    return reply.status(401).send({ error: { message: 'Invalid or expired token' } });
  }
}

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.post('/api/v1/admin/login', async (request, reply) => {
    const schema = z.object({ password: z.string().min(1) });
    const result = schema.safeParse(request.body);
    if (!result.success) throw new AppError('INVALID_REQUEST', 'Password required', 400);

    if (result.data.password !== ADMIN_PASSWORD) {
      throw new AppError('UNAUTHORIZED', 'Invalid password', 401);
    }

    const token = signAdminToken();
    return reply.send({ token, expiresIn: 86400 });
  });

  fastify.get('/api/v1/admin/config', { preHandler: requireAdmin }, async (_request, reply) => {
    const config = await getAllConfig();
    return reply.send({ config, editableKeys: EDITABLE_KEYS });
  });

  fastify.patch('/api/v1/admin/config', { preHandler: requireAdmin }, async (request, reply) => {
    const schema = z.object({
      key: z.enum(EDITABLE_KEYS as [ConfigKey, ...ConfigKey[]]),
      value: z.string().min(0).max(500),
    });
    const result = schema.safeParse(request.body);
    if (!result.success) throw new AppError('INVALID_REQUEST', result.error.errors[0]?.message ?? 'Invalid', 400);

    await upsertConfig(result.data.key, result.data.value);
    return reply.send({ success: true, key: result.data.key, value: result.data.value });
  });
}

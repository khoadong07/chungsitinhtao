import { z } from 'zod';

export const symbolParamSchema = z.object({
  symbol: z
    .string()
    .regex(/^[A-Za-z0-9]{2,10}$/, 'Invalid symbol format')
    .transform((s) => s.toUpperCase()),
});

export const candleQuerySchema = z.object({
  timeframe: z.literal('1D').default('1D'),
  limit: z.coerce.number().int().min(1).max(500).default(250),
});

export const indicatorQuerySchema = z.object({
  timeframe: z.literal('1D').default('1D'),
  limit: z.coerce.number().int().min(30).max(500).default(250),
});

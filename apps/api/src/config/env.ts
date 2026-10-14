import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  MARKET_DATA_PROVIDER: z.enum(['mock', 'rest']).default('mock'),
  MARKET_DATA_BASE_URL: z.string().optional(),
  MARKET_DATA_API_KEY: z.string().optional(),
  MARKET_DATA_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  MARKET_DATA_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  LLM_PROVIDER: z.enum(['openai', 'anthropic', 'none']).default('none'),
  LLM_BASE_URL: z.string().url().optional(),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().optional(),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  FIREANT_TOKEN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.format();
  console.error('Invalid environment configuration:');
  console.error(JSON.stringify(formatted, null, 2));
  process.exit(1);
}

export const env = parsed.data;

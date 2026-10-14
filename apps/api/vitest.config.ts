import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/tests/**/*.test.ts'],
    env: {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/stockanalyzer',
      MARKET_DATA_PROVIDER: 'mock',
      NODE_ENV: 'test',
      WEB_ORIGIN: 'http://localhost:3000',
      LLM_PROVIDER: 'none',
      LLM_API_KEY: '',
      LLM_MODEL: '',
    },
  },
});

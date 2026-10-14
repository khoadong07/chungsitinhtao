# CLAUDE.md — Vietnam Stock Analyzer

## Project overview
Monorepo: pnpm workspace with Next.js frontend (`apps/web`) and Fastify backend (`apps/api`).

## Key rules
- TypeScript throughout; never use `any` without explicit justification
- All validation uses Zod — both request/response on the backend and forms on the frontend
- Logging uses Pino (backend only); never `console.log` in production code
- Indicator calculations (EMA, RSI, MACD, ATR, volume) are pure functions, independent of LLM calls
- LLM receives only pre-calculated, validated data — it must not recalculate or invent values
- Mock provider must work without any real API credentials (`MARKET_DATA_PROVIDER=mock`)
- Never commit `.env`, API keys, or secrets
- Store prices as `Decimal` (Prisma) — never rely on JS float arithmetic for monetary values
- Always run `pnpm typecheck && pnpm lint` before reporting a phase complete

## Workspace commands
```
pnpm install          # install all workspace deps
pnpm dev              # start both apps concurrently
pnpm build            # build all apps
pnpm test             # run all tests
pnpm lint             # lint all packages
pnpm typecheck        # typecheck all packages
pnpm db:migrate       # run prisma migrate dev (from apps/api)
pnpm db:generate      # run prisma generate (from apps/api)
```

## Market data provider — SSI iBoard (documented, Phase 2 to implement)
- Provider: SSI iBoard public API — no API key required, browser header spoofing only
- Base URL: `https://iboard-api.ssi.com.vn/statistics/charts/history`
- Method: GET, params: `resolution=1D&symbol=<TICKER>&from=<unix_epoch>&to=<unix_epoch>`
- Required headers: `origin: https://iboard.ssi.com.vn`, `referer: https://iboard.ssi.com.vn/`, `accept: application/json, text/plain, */*`, `user-agent: Mozilla/5.0 ...`
- Response shape: `{ code: "SUCCESS", data: { t: number[], o: number[], h: number[], l: number[], c: number[], v: number[], s: "ok", nextTime: number | null } }`
- Timestamps: Unix epoch seconds → convert to ISO 8601 with `Asia/Ho_Chi_Minh`
- Prices: VND in thousands (e.g. `20.72` = 20,720 VND) — store as-is but document unit clearly
- Pagination: `data.nextTime` is null when all data is returned
- See `docs/provider-ssi-iboard.md` for full details
- Set `MARKET_DATA_PROVIDER=mock` in Phase 1; implement REST adapter in Phase 2

## Pending items
- LLM provider: model ID and exact API key format depend on `LLM_PROVIDER` env var.
  The system is designed to work without an LLM (falls back to deterministic report).

## Phase status
- Phase 0: complete
- Phase 1: complete
- Phase 2: complete
- Phase 3: complete
- Phase 4: complete
- Phase 5: complete
- Phase 6: complete
- Phase 7: complete
- Phase 8 (backtesting): not started

# Vietnam Stock Analyzer

Technical analysis dashboard for Vietnamese stocks (HOSE, HNX, UPCoM).

Combines deterministic technical indicators (EMA, RSI, MACD, ATR, volume), rule-based signal classification, and optional LLM-generated Vietnamese analysis reports.

## Prerequisites

- Node.js >= 20
- pnpm >= 9 (`npm install -g pnpm`)
- Docker (optional, for PostgreSQL)

## Installation

```bash
git clone <repo>
cd vietnam-stock-analyzer
pnpm install
```

## Environment setup

```bash
cp .env.example apps/api/.env
```

Minimum required for mock mode (no external APIs):
```env
NODE_ENV=development
API_PORT=4000
WEB_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stockanalyzer
MARKET_DATA_PROVIDER=mock
LLM_PROVIDER=none
```

## Start PostgreSQL (Docker)

```bash
docker compose up -d
```

## Database migration

```bash
pnpm db:migrate    # runs prisma migrate dev
pnpm db:generate   # regenerates Prisma client after schema changes
```

## Run (development)

```bash
pnpm dev           # starts both frontend (port 3000) and backend (port 4000)
```

Or separately:
```bash
pnpm --filter api dev    # backend only  — http://localhost:4000
pnpm --filter web dev    # frontend only — http://localhost:3000
```

## Mock mode (no external APIs needed)

Set in `apps/api/.env`:
```env
MARKET_DATA_PROVIDER=mock
LLM_PROVIDER=none
```

Then `pnpm dev` — the app runs fully with simulated data. A mock-data warning banner is shown in the UI.

## Real market data (SSI iBoard)

```env
MARKET_DATA_PROVIDER=rest
MARKET_DATA_BASE_URL=https://iboard-api.ssi.com.vn
```

No API key required. The provider uses browser-compatible headers to access SSI's public charting API. See `docs/provider-ssi-iboard.md` for full details.

## LLM configuration (OpenAI)

```env
LLM_PROVIDER=openai
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
```

When `LLM_PROVIDER=none`, the system generates a deterministic Vietnamese report without calling any external API.

## Running tests

```bash
pnpm test                # all packages
pnpm --filter api test   # backend unit + integration tests
```

Tests do not require a running database or any API keys.

## Build

```bash
pnpm build         # build all packages
pnpm typecheck     # TypeScript check across all packages
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check (DB status, provider) |
| GET | `/api/v1/stocks/:symbol/candles` | OHLCV candles (`?limit=250`) |
| GET | `/api/v1/stocks/:symbol/indicators` | Technical indicators + snapshot |
| POST | `/api/v1/analysis` | Run full analysis (body: `{ symbol, lookback?, holdingHorizon? }`) |
| GET | `/api/v1/analysis/:id` | Retrieve stored analysis by ID |

## Project structure

```
apps/
  api/    Fastify backend — indicators, decision engine, LLM service, Prisma
  web/    Next.js 15 frontend — candlestick chart, indicator panels, analysis report
packages/
  shared/ Shared TypeScript interfaces
docs/
  provider-ssi-iboard.md  SSI iBoard API specification
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Port 3000 or 4000 in use | Kill the existing process |
| `database: "configured_not_connected"` | Run `docker compose up -d` then `pnpm db:migrate` |
| Mock data warning in UI | Expected in mock mode; set `MARKET_DATA_PROVIDER=rest` for real data |
| `LLM_PROVIDER=none` in report | Set `LLM_PROVIDER=openai` with a valid `LLM_API_KEY` |
| Prisma client out of date | Run `pnpm db:generate` after schema changes |

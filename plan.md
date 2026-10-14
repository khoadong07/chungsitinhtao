PLAN.md — Vietnamese Stock Analysis Bot
1. Project Overview
Objective

Build a web application that analyzes Vietnamese stock tickers (HOSE, HNX, UPCoM) using existing REST APIs that provide OHLCV market data.

The application combines:

Deterministic technical indicators calculated by code.
Rule-based market signal classification.
An LLM for natural-language interpretation and scenario explanation.
An interactive dashboard for reviewing technical analysis and potential trade setups.

Example user workflow:

Enter a ticker such as MBB, FPT, or HPG.
Select a timeframe and analysis horizon.
Fetch historical OHLCV data from the existing provider API.
Calculate indicators and identify technical conditions.
Generate an AI-assisted analysis.
Display trend, support/resistance zones, bullish and bearish scenarios, risks, and conditions that invalidate the analysis.
MVP Scope

Included:

Single-ticker analysis.
Daily OHLCV data.
Configurable REST market data provider.
Technical indicators: EMA20, EMA50, EMA200, RSI14, MACD, ATR14, volume SMA20.
Rule-based trend and signal classification.
Hybrid AI analysis using a configurable LLM provider.
Candlestick chart and indicator dashboard.
Analysis history and basic caching.
Input validation, error handling, logging, and automated tests.

Not included in MVP:

Automated trading or order execution.
Brokerage account integration.
Portfolio optimization.
Fundamental financial statement analysis.
Real-time streaming.
Multi-agent orchestration.
Automatic claims about future stock prices or guaranteed returns.
2. Technology Stack

Use TypeScript throughout the application.

Frontend
Next.js with App Router.
React.
TypeScript.
Tailwind CSS.
Lightweight Charts or another suitable candlestick chart library.
TanStack Query for API requests and caching.
Zod for client-side input validation where appropriate.
Backend
Node.js LTS.
TypeScript.
Fastify.
Zod for request and response validation.
technicalindicators or equivalent indicator library, after validating its output against reference calculations.
Pino for structured logging.
OpenAI SDK or a provider abstraction for the LLM integration.
Storage
PostgreSQL for analysis history and cached market data.
Prisma ORM.
Optional in-memory cache for the first development iteration.

Redis is not required for the initial MVP.

Testing
Vitest for unit and integration tests.
Fastify injection or an equivalent mechanism for HTTP endpoint tests.
Playwright for essential end-to-end browser tests.
Deployment

The application must run locally with a documented setup.

Use Docker Compose for PostgreSQL if Docker is available. The application itself should also be runnable directly with Node.js during development.

3. Architecture

Use a modular monolith rather than microservices.

Components:

Web frontend.
Backend REST API.
Market data provider adapter.
Technical analysis engine.
Rule-based decision engine.
LLM analysis service.
PostgreSQL persistence layer.

Data flow:

User | v Next.js Dashboard | v Fastify API | +--> Request validation | +--> Market Data Service | | | +--> Existing REST Provider | +--> Normalize OHLCV | +--> Validate freshness and completeness | +--> Technical Analysis Engine | | | +--> EMA / RSI / MACD / ATR / Volume | +--> Rule Engine | | | +--> Trend classification | +--> Momentum classification | +--> Scenario conditions | +--> LLM Analysis Service | | | +--> Structured prompt | +--> Schema-constrained response | +--> Output validation | +--> Persistence / Cache | v Analysis Response

Important design principle:

All numerical indicators and deterministic trading rules must be calculated by code, not invented or recalculated by the LLM.

The LLM explains validated results. It must not silently modify indicator values, create unsupported price levels, or turn uncertain scenarios into guarantees.

4. Repository Structure

Create the following structure:

vietnam-stock-analyzer/ ├── apps/ │ ├── web/ │ │ ├── app/ │ │ │ ├── page.tsx │ │ │ ├── layout.tsx │ │ │ ├── stocks/ │ │ │ │ └── [symbol]/ │ │ │ │ └── page.tsx │ │ │ └── globals.css │ │ ├── components/ │ │ │ ├── stock-search.tsx │ │ │ ├── candlestick-chart.tsx │ │ │ ├── indicator-panel.tsx │ │ │ ├── signal-summary.tsx │ │ │ ├── scenario-panel.tsx │ │ │ └── analysis-report.tsx │ │ ├── lib/ │ │ │ └── api-client.ts │ │ ├── package.json │ │ └── tsconfig.json │ │ │ └── api/ │ ├── src/ │ │ ├── app.ts │ │ ├── server.ts │ │ ├── config/ │ │ │ └── env.ts │ │ ├── routes/ │ │ │ ├── health.routes.ts │ │ │ ├── stocks.routes.ts │ │ │ └── analysis.routes.ts │ │ ├── schemas/ │ │ │ ├── market-data.schema.ts │ │ │ └── analysis.schema.ts │ │ ├── providers/ │ │ │ ├── market-data.interface.ts │ │ │ ├── rest-market-data.provider.ts │ │ │ └── mock-market-data.provider.ts │ │ ├── services/ │ │ │ ├── market-data.service.ts │ │ │ ├── technical-analysis.service.ts │ │ │ ├── support-resistance.service.ts │ │ │ ├── decision-engine.service.ts │ │ │ ├── llm-analysis.service.ts │ │ │ └── analysis-orchestrator.service.ts │ │ ├── repositories/ │ │ │ ├── market-data.repository.ts │ │ │ └── analysis.repository.ts │ │ ├── utils/ │ │ │ ├── date.ts │ │ │ └── errors.ts │ │ └── tests/ │ │ ├── indicators.test.ts │ │ ├── decision-engine.test.ts │ │ ├── market-data.test.ts │ │ └── analysis.routes.test.ts │ ├── prisma/ │ │ └── schema.prisma │ ├── package.json │ └── tsconfig.json │ ├── packages/ │ └── shared/ │ ├── src/ │ │ ├── market-data.ts │ │ └── analysis.ts │ └── package.json │ ├── scripts/ │ └── validate-indicators.ts ├── .env.example ├── .gitignore ├── CLAUDE.md ├── docker-compose.yml ├── package.json ├── pnpm-workspace.yaml ├── PLAN.md └── README.md

Claude Code may adjust the structure if necessary, but it must preserve the separation between providers, indicators, decision rules, and LLM interpretation.

5. Market Data Integration
5.1 Provider abstraction

Do not couple business logic directly to one vendor's API format.

Define a provider interface:

interface MarketDataProvider { getCandles(params: { symbol: string; timeframe: "1D"; from?: string; to?: string; limit: number; }): Promise<Candle[]>; }

Normalized candle schema:

interface Candle { timestamp: string; open: number; high: number; low: number; close: number; volume: number; }

Requirements:

Normalize vendor-specific field names.
Normalize timestamps to ISO 8601.
Use Asia/HoChiMinh when interpreting market session dates.
Validate OHLC relationships.
Reject negative volume and invalid numeric values.
Handle missing candles and duplicate timestamps.
Sort candles in ascending chronological order.
Distinguish adjusted from unadjusted prices.
Record the provider and fetch timestamp.
Never invent missing candles.
Never silently mix adjusted and unadjusted prices.
Implement request timeouts and bounded retries.
Respect provider rate limits and licensing requirements.
5.2 Environment variables

Create .env.example:

NODE_ENV=development

APIPORT=4000 WEBPORT=3000 WEB_ORIGIN=http://localhost:3000

DATABASEURL=postgresql://postgres:postgres@localhost:5432/stockanalyzer

MARKETDATABASEURL= MARKETDATAAPIKEY= MARKETDATAPROVIDER=mock

LLMPROVIDER=openai LLMAPIKEY= LLMMODEL=

MARKETDATATIMEOUTMS=10000 MARKETDATACACHETTLSECONDS=300 LLMTIMEOUT_MS=30000

Never commit real API keys or .env files.

The actual provider URL, authentication method, query parameters, response fields, and pagination must be configured after inspecting the existing API documentation or a sanitized sample response.

5.3 Mock provider

Implement a deterministic mock provider so the application can run before the real API is configured.

Requirements:

Supply at least 250 chronological daily candles.
Include realistic OHLCV relationships.
Use deterministic fixtures, not random data on each request.
Label all mock data clearly in the API response and UI.
Never present mock results as live market data.
6. Technical Analysis Engine

Implement indicators as pure functions or a clearly isolated service.

Input: validated chronological OHLCV candles.

Output: candle-aligned indicator values and a latest-indicator snapshot.

Indicators
Indicator	Initial parameters	Purpose
EMA	20, 50, 200	Trend and dynamic resistance/support
RSI	14	Momentum
MACD	12, 26, 9	Momentum changes
ATR	14	Volatility and risk-distance reference
Volume SMA	20	Relative trading activity

Requirements:

Require enough historical candles for the selected calculations.
Return null when a value is not yet available.
Define warm-up and initialization behavior explicitly.
Verify library conventions for EMA, RSI, MACD and ATR.
Never interpret missing indicator values as zero.
Use full precision internally and round only for display.
Unit-test against known fixtures and independent reference calculations.
Volume ratio

Calculate:

volumeRatio20 = currentVolume / averageVolume20

If the denominator is zero or unavailable, return null.

Indicator snapshot

Example:

interface IndicatorSnapshot { close: number; ema20: number | null; ema50: number | null; ema200: number | null; rsi14: number | null; macd: number | null; macdSignal: number | null; macdHistogram: number | null; atr14: number | null; volumeSma20: number | null; volumeRatio20: number | null; }

Do not interpret this object as a trading recommendation by itself.

7. Support and Resistance

Implement a transparent, configurable first version.

Potential methods:

Swing highs and swing lows.
Clusters of nearby pivot prices.
Previous significant highs and lows.
EMA levels as separate dynamic reference levels.

Requirements:

Use a documented swing detection window.
Merge nearby levels using a configurable percentage or ATR-based tolerance.
Include the price interval and the method used to derive each zone.
Track the candle timestamps supporting the zone.
Distinguish historical levels from dynamic indicator levels.
Avoid using future candles when generating a signal for a historical date.
Avoid presenting a zone as a precise guaranteed turning point.

Return:

interface PriceZone { lower: number; upper: number; type: "support" | "resistance"; method: string; evidenceCount: number; lastObservedAt: string; }

If insufficient evidence exists, return an empty list rather than fabricating levels.

8. Decision Engine

The decision engine is deterministic and independent of the LLM.

Initial trend classification

Use configurable rules such as:

Bullish: close above EMA20 and EMA50, with EMA20 above EMA50.
Bearish: close below EMA20 and EMA50, with EMA20 below EMA50.
Mixed: conditions conflict or data is insufficient.

EMA200 provides longer-term context when available.

Momentum classification

Use RSI and MACD together.

Possible classifications:

Improving.
Weakening.
Bullish.
Bearish.
Neutral.
Insufficient data.

Do not assume RSI below 30 automatically means buy or RSI above 70 automatically means sell.

Volume classification

Compare current volume with volume SMA20.

A configurable threshold may identify unusually strong volume, but it must not independently trigger a buy recommendation.

Setup classification

Initial output categories:

potential_entry
wait_for_confirmation
hold_watch
risk_elevated
insufficient_data

These are technical research labels, not personalized financial advice.

Example rule

If:

Close is below EMA20 and EMA50.
RSI is recovering but remains below 50.
MACD histogram is improving but remains negative.

Then:

Trend: bearish or mixed, depending on the configured trend rules.
Momentum: improving but not confirmed bullish.
Setup: wait_for_confirmation.
Explanation: short-term recovery is visible, but reversal conditions are incomplete.
Scenario generation

Generate conditional scenarios rather than unconditional forecasts.

Bullish scenario:

Price closes above a defined resistance zone.
Volume confirmation is present when reliable volume data is available.
Momentum improves or trend criteria become bullish.

Bearish scenario:

Price closes below a defined support zone.
Trend and momentum weaken further.

Each scenario must include:

Trigger condition.
Supporting evidence.
Invalidation condition.
Relevant indicator timestamps.
Known limitations.

The engine must not claim that a target price will definitely be reached.

9. Hybrid LLM Analysis
Responsibilities

The LLM may:

Explain indicator values.
Summarize bullish and bearish evidence.
Explain why a setup is or is not confirmed.
Compare conditional scenarios.
Produce concise Vietnamese reports.
Answer follow-up questions using supplied, validated analysis data.

The LLM must not:

Invent prices or indicators.
Invent financial statements or news.
Claim live data was fetched when it was not.
Override a failed data-quality check.
Present confidence scores as calibrated probabilities without validation.
Execute trades or submit brokerage orders.
Input contract

Provide the LLM with:

Symbol and exchange if known.
Market-data timestamp and source.
Data-quality flags.
Latest OHLCV values.
Calculated indicators.
Rule-engine classifications.
Derived support and resistance zones.
Bullish and bearish scenarios.
User's selected holding horizon.
Explicit limitations and missing fields.

Do not send hundreds of raw candles unless a specific task requires them. The backend should calculate and summarize numerical features first.

Output contract

Use a schema-validated response:

interface AnalysisReport { symbol: string; asOf: string; timeframe: "1D";

summary: string;

trend: { classification: string; reasons: string[]; };

momentum: { classification: string; reasons: string[]; };

bullishFactors: string[]; bearishFactors: string[];

setup: { classification: | "potentialentry" | "waitforconfirmation" | "holdwatch" | "riskelevated" | "insufficientdata"; explanation: string; };

scenarios: Array<{ name: "bullish" | "bearish"; trigger: string; invalidation: string; rationale: string[]; }>;

risks: string[]; limitations: string[]; }

The exact runtime schema should use Zod or an equivalent validator.

Reject malformed model responses. Implement one bounded retry or a safe fallback to a deterministic report.

Prompt rules

The system prompt must instruct the model to:

Respond in Vietnamese.
Use only the supplied market and analysis data for ticker-specific factual claims.
Preserve exact numerical values from validated inputs.
Clearly separate observations from interpretations.
Explain both bullish and bearish evidence.
Use conditional language for scenarios.
Avoid guarantees, unsupported price targets, and fabricated citations.
Disclose missing, stale, delayed, or mock data.
Return the exact required output schema.
Avoid personalized buy/sell instructions unless the necessary user context is explicitly supplied; even then, describe assumptions and risk constraints.

If the LLM is unavailable, the application must still provide a deterministic technical report.

10. API Endpoints

Use /api/v1 as the backend API prefix.

Health

GET /api/v1/health

Example response:

{ "status": "ok", "database": "connected", "marketDataProvider": "mock" }

Do not expose secrets or sensitive provider configuration.

Get candles

GET /api/v1/stocks/:symbol/candles?timeframe=1D&limit=250

Returns normalized OHLCV candles, source metadata, and the data-quality status.

Validate symbols, timeframe, date range, and limit.

Get technical indicators

GET /api/v1/stocks/:symbol/indicators?timeframe=1D&limit=250

Returns candles with indicator series and a latest-indicator snapshot.

Generate analysis

POST /api/v1/analysis

Request:

{ "symbol": "MBB", "timeframe": "1D", "lookback": 250, "analysisType": "technical", "holdingHorizon": "swing" }

Supported initial values:

timeframe: 1D
analysisType: technical
holdingHorizon: swing, position

Response:

{ "analysisId": "generated-id", "symbol": "MBB", "asOf": "2026-10-13T15:00:00+07:00", "dataSource": { "provider": "mock", "isMock": true, "isStale": false }, "technical": {}, "decision": {}, "report": {}, "warnings": [] }

The empty objects above are placeholders for the corresponding validated response structures, not acceptable final production values.

Get analysis history

GET /api/v1/analysis/:analysisId

Returns the stored analysis and its provenance.

Optional later endpoints
GET /api/v1/stocks/search?q=MBB
GET /api/v1/analysis?symbol=MBB
POST /api/v1/analysis/:analysisId/feedback

Do not build watchlists, scheduled alerts, or portfolio features before the core workflow works reliably.

11. Database Schema

Use Prisma and PostgreSQL.

AnalysisRun

Fields:

id: UUID primary key.
symbol: ticker.
timeframe: 1D.
analysisType: technical.
asOf: market-data timestamp.
provider: source identifier.
isMock: boolean.
isStale: boolean.
inputSnapshot: JSON containing the normalized analysis inputs.
technicalSnapshot: JSON containing indicator results.
decisionSnapshot: JSON containing deterministic rule outputs.
report: JSON containing the validated LLM or fallback report.
model: optional LLM model identifier.
promptVersion: analysis prompt version.
createdAt: creation timestamp.
MarketCandle

Fields:

id: UUID or equivalent primary key.
symbol: ticker.
timeframe: 1D.
timestamp: market session timestamp.
open, high, low, close: numeric values.
volume: numeric value.
adjusted: boolean when known.
provider: source identifier.
fetchedAt: fetch timestamp.

Add a unique constraint on:

symbol + timeframe + timestamp + provider + adjusted

Adapt the constraint if the provider cannot reliably identify adjustment status.

Use appropriate database decimal or numeric types for stored prices. Avoid relying on binary floating-point arithmetic for monetary accounting.

Do not store API keys or other secrets in database snapshots.

12. Frontend Requirements

Create a responsive single-page stock analysis dashboard.

Header
Application name.
Ticker search input.
Analyze button.
Timeframe selector.
Holding horizon selector.
Price section
Candlestick chart.
Volume bars.
EMA20 and EMA50 overlays.
Optional EMA200 overlay.
Indicator values for the selected date.
Data source and last-updated timestamp.
Indicator section

Cards or compact panels for:

RSI14.
MACD and signal line.
MACD histogram.
ATR14.
Relative volume.
Trend classification.
Analysis report

Display:

Summary.
Trend and momentum.
Bullish evidence.
Bearish evidence.
Current setup classification.
Bullish and bearish scenarios.
Support and resistance zones when available.
Invalidation conditions.
Data warnings.
Analysis timestamp.
UX requirements
Loading state.
Empty state before the first analysis.
Clear API and provider errors.
Retry action.
Stale-data warning.
Mock-data warning.
Mobile-friendly layout.
Never show fake confidence percentages.
Never display a recommendation based on invalid or insufficient data.
13. Error Handling and Reliability

Create typed application errors for:

Invalid symbol.
Unsupported timeframe.
Provider timeout.
Provider rate limit.
Invalid provider response.
Insufficient historical data.
Invalid OHLCV.
LLM timeout.
Invalid LLM response.
Database failure.

Requirements:

Use bounded retries for transient provider errors.
Do not retry invalid requests indefinitely.
Cache provider responses for a configurable duration.
Mark stale cached data explicitly.
Avoid duplicate simultaneous provider requests where practical.
Log request IDs and durations.
Redact API keys and sensitive headers.
Never log complete authorization headers or secrets.
Return consistent JSON error responses.

A provider failure must never silently return old data as if it were current.

14. Implementation Phases

Claude Code must implement the project incrementally.

Phase 0 — Inspect and plan
Inspect the current repository and installed tooling.
Identify existing conventions before changing files.
Confirm Node.js, package manager, and available API documentation.
Create or update CLAUDE.md.
Create the workspace structure.
Document unknown provider details.
Do not invent provider endpoints or credentials.

Deliverable: project skeleton and documented assumptions.

Phase 1 — Runnable foundation
Initialize pnpm workspace.
Create Next.js frontend.
Create Fastify backend.
Configure TypeScript and linting.
Configure environment validation.
Add /api/v1/health.
Add PostgreSQL through Docker Compose.
Configure Prisma and the initial migration.

Acceptance criteria:

Frontend starts locally.
Backend starts locally.
Health endpoint works.
Missing environment configuration produces a clear error.
No secrets are committed.
Phase 2 — Market data integration
Implement MarketDataProvider.
Implement mock provider.
Implement the real REST adapter after inspecting actual API documentation or a sample response.
Normalize and validate OHLCV.
Add timeout, retry, and cache behavior.
Implement candle endpoint.

Acceptance criteria:

Mock mode works without external credentials.
Real provider mode uses environment variables.
Candles are chronological and validated.
Invalid responses fail safely.
Data source and timestamps are returned.
Provider integration tests use mocked HTTP responses.
Phase 3 — Technical analysis
Implement EMA20, EMA50, EMA200.
Implement RSI14, MACD, ATR14.
Implement volume SMA20 and relative volume.
Implement support/resistance detection.
Validate indicator initialization and warm-up.
Add unit tests with fixed fixtures.

Acceptance criteria:

Indicator values match independent reference calculations within documented tolerances.
Insufficient history returns missing values instead of fabricated values.
No future candle influences a historical signal.
All calculations use chronological data.
Phase 4 — Decision engine
Implement trend classification.
Implement momentum classification.
Implement volume interpretation.
Implement setup classification.
Generate bullish and bearish scenarios.
Define explicit invalidation conditions.
Document rule thresholds in one configurable location.

Acceptance criteria:

Identical inputs produce identical outputs.
Every classification has explainable reasons.
Insufficient data produces insufficient_data.
Rule changes are covered by tests.
Phase 5 — LLM integration
Implement the LLM provider interface.
Configure the selected model through environment variables.
Construct prompts from validated analysis snapshots.
Validate output using Zod.
Implement bounded retries and deterministic fallback.
Store prompt version and model metadata.
Add prompt-injection and malformed-response tests.

Acceptance criteria:

LLM output follows the schema.
Indicator values cannot be silently overwritten.
Unsupported fields and claims are rejected or removed through explicit validation.
LLM outages do not prevent technical analysis.
No LLM key is exposed to the browser.
Phase 6 — Dashboard
Implement ticker search.
Implement the candlestick chart.
Display volume and EMA overlays.
Display technical indicators.
Display deterministic setup and AI report.
Add loading, error, stale-data, and mock-data states.
Add mobile-responsive styling.

Acceptance criteria:

User can enter a symbol and receive an analysis.
Chart and report use the same market-data snapshot.
The UI shows the source and timestamp.
Failed requests do not leave misleading stale content displayed as current.
Phase 7 — Persistence and hardening
Persist analysis runs.
Implement history lookup.
Add database indexes and uniqueness constraints.
Add API input limits.
Add request logging and rate limiting.
Add end-to-end tests.
Write setup and troubleshooting documentation.

Acceptance criteria:

Historical analyses can be retrieved.
Provider failures are handled safely.
Database migrations work from a clean environment.
Critical flows pass automated tests.
The application can be started from documented commands.
Phase 8 — Backtesting and evaluation

This phase comes after the MVP is operational.

Implement a separate historical simulation engine.
Avoid look-ahead bias.
Include transaction fees, taxes, and slippage assumptions.
Evaluate performance on out-of-sample periods.
Compare against suitable benchmarks.
Track maximum drawdown, net returns, trade count, and risk-adjusted metrics.
Evaluate bull, bear, and sideways market regimes.
Record rule and parameter versions.

Do not describe the system as profitable or predictive until supported by reproducible out-of-sample evaluation.

15. Root Scripts and Local Development

Provide convenient scripts similar to:

pnpm install pnpm dev pnpm test pnpm lint pnpm typecheck pnpm build

Also document:

docker compose up -d pnpm db:migrate pnpm db:generate

Exact script names may be adjusted to match the chosen workspace configuration.

The README must explain:

Prerequisites.
Installation.
Environment setup.
Starting PostgreSQL.
Database migration.
Running the frontend and backend.
Enabling mock mode.
Configuring the real market data provider.
Configuring the LLM.
Running tests.
Common troubleshooting steps.
16. Claude Code Working Instructions

Before implementing, Claude Code must:

Inspect the existing repository.
Read this plan and CLAUDE.md.
Identify missing provider documentation and configuration.
Produce a short implementation checklist.
Implement one phase at a time.
Run relevant tests after each phase.
Run typecheck, lint, and build before declaring a phase complete.
Fix regressions before proceeding.
Report files changed, commands executed, tests passed, and unresolved issues.
Never claim a test passed if it was not executed successfully.

Additional constraints:

Do not overwrite existing user code without inspecting it.
Do not install unnecessary dependencies.
Do not invent real provider endpoints, response schemas, or credentials.
Do not hardcode API keys.
Do not put server secrets in frontend environment variables.
Do not implement automated trading.
Do not fabricate market data.
Keep indicator calculations independent from LLM calls.
Prefer small, reviewable changes.
Ask for the missing API documentation or a sanitized sample response only when it is needed to implement the real provider correctly.
Keep the application runnable in mock mode while real-provider integration is pending.
17. Definition of Done

The MVP is complete when all of the following are true:

Local application starts using documented commands.
User can enter a Vietnamese stock ticker.
Mock mode works without a real market data API.
Real REST provider can be configured without modifying analysis logic.
OHLCV is normalized and validated.
EMA, RSI, MACD, ATR, and volume indicators are tested.
Support/resistance output is explainable and may be empty when evidence is insufficient.
Decision engine returns deterministic, testable classifications.
LLM generates schema-valid Vietnamese analysis.
Deterministic fallback works when the LLM is unavailable.
Dashboard shows chart, indicators, scenarios, timestamps, and data warnings.
Analysis history can be persisted and retrieved.
API keys remain server-side.
Core endpoints and critical user flows have automated tests.
README contains complete setup instructions.
No automated trading functionality exists in the MVP.
18. First Task for Claude Code

Start with Phase 0 and Phase 1 only.

Do not attempt to implement the entire application in one pass.

Inspect the current repository, establish the workspace, configure the development environment, and make the health endpoint and frontend run successfully.

Then report:

Repository structure created.
Dependencies installed.
Commands to run the project.
Tests and checks executed.
Missing provider information.
Exact next steps for Phase 2.

Wait for review before proceeding to subsequent phases if the user is supervising the implementation.
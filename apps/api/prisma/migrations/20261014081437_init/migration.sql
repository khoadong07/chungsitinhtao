-- CreateTable
CREATE TABLE "AnalysisRun" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "analysisType" TEXT NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL,
    "provider" TEXT NOT NULL,
    "isMock" BOOLEAN NOT NULL,
    "isStale" BOOLEAN NOT NULL,
    "inputSnapshot" JSONB NOT NULL,
    "technicalSnapshot" JSONB NOT NULL,
    "decisionSnapshot" JSONB NOT NULL,
    "report" JSONB NOT NULL,
    "model" TEXT,
    "promptVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketCandle" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "open" DECIMAL(20,6) NOT NULL,
    "high" DECIMAL(20,6) NOT NULL,
    "low" DECIMAL(20,6) NOT NULL,
    "close" DECIMAL(20,6) NOT NULL,
    "volume" DECIMAL(30,2) NOT NULL,
    "adjusted" BOOLEAN,
    "provider" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketCandle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalysisRun_symbol_createdAt_idx" ON "AnalysisRun"("symbol", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MarketCandle_symbol_timeframe_timestamp_idx" ON "MarketCandle"("symbol", "timeframe", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "MarketCandle_symbol_timeframe_timestamp_provider_key" ON "MarketCandle"("symbol", "timeframe", "timestamp", "provider");

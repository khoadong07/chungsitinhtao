import { z } from 'zod';

export const trendClassificationSchema = z.enum(['bullish', 'bearish', 'mixed', 'insufficient_data']);
export const momentumClassificationSchema = z.enum(['improving', 'weakening', 'bullish', 'bearish', 'neutral', 'insufficient_data']);
export const setupClassificationSchema = z.enum(['potential_entry', 'wait_for_confirmation', 'hold_watch', 'risk_elevated', 'insufficient_data']);

const tradeLevelSchema = z.object({
  price: z.number().positive(),
  note: z.string(),
});

export const actionPlanSchema = z.object({
  side: z.enum(['long', 'none']),
  entry: z.object({
    lower: z.number().positive(),
    upper: z.number().positive(),
    note: z.string(),
  }).nullable(),
  stopLoss: tradeLevelSchema.nullable(),
  targets: z.array(tradeLevelSchema).max(3),
  rationale: z.string(),
}).nullable();

export const analysisReportSchema = z.object({
  symbol: z.string(),
  asOf: z.string(),
  timeframe: z.literal('1D'),
  summary: z.string().min(10),
  trend: z.object({
    classification: trendClassificationSchema,
    reasons: z.array(z.string()).min(1),
  }),
  momentum: z.object({
    classification: momentumClassificationSchema,
    reasons: z.array(z.string()).min(1),
  }),
  bullishFactors: z.array(z.string()),
  bearishFactors: z.array(z.string()),
  setup: z.object({
    classification: setupClassificationSchema,
    explanation: z.string().min(10),
  }),
  scenarios: z.array(z.object({
    name: z.enum(['bullish', 'bearish']),
    trigger: z.string(),
    invalidation: z.string(),
    rationale: z.array(z.string()),
  })).length(2),
  risks: z.array(z.string()),
  limitations: z.array(z.string()),
  actionPlan: actionPlanSchema.optional(),
});

export type AnalysisReport = z.infer<typeof analysisReportSchema>;

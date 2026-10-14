export type SetupClassification =
  | 'potential_entry'
  | 'wait_for_confirmation'
  | 'hold_watch'
  | 'risk_elevated'
  | 'insufficient_data';

export type TrendClassification = 'bullish' | 'bearish' | 'mixed' | 'insufficient_data';

export type MomentumClassification =
  | 'improving'
  | 'weakening'
  | 'bullish'
  | 'bearish'
  | 'neutral'
  | 'insufficient_data';

export interface AnalysisReport {
  symbol: string;
  asOf: string;
  timeframe: '1D';
  summary: string;
  trend: {
    classification: TrendClassification;
    reasons: string[];
  };
  momentum: {
    classification: MomentumClassification;
    reasons: string[];
  };
  bullishFactors: string[];
  bearishFactors: string[];
  setup: {
    classification: SetupClassification;
    explanation: string;
  };
  scenarios: Array<{
    name: 'bullish' | 'bearish';
    trigger: string;
    invalidation: string;
    rationale: string[];
  }>;
  risks: string[];
  limitations: string[];
}

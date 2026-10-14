'use client';

import { useQuery } from '@tanstack/react-query';
import { runAnalysis, pollAnalysisReport } from '../lib/api-client';
import type { AnalysisOutput } from '../lib/types';
import { useState, useEffect } from 'react';

export function useAnalysis(params: {
  symbol: string;
  holdingHorizon: 'swing' | 'position';
  enabled: boolean;
}) {
  const fastQuery = useQuery({
    queryKey: ['analysis', params.symbol, params.holdingHorizon],
    queryFn: () => runAnalysis({ symbol: params.symbol, holdingHorizon: params.holdingHorizon }),
    enabled: params.enabled && !!params.symbol,
    staleTime: 0,
    gcTime: 0,
    retry: 1,
  });

  // Merge LLM report into fast result once it arrives
  const [merged, setMerged] = useState<AnalysisOutput | undefined>(undefined);

  useEffect(() => {
    if (!fastQuery.data) { setMerged(undefined); return; }
    // Reset merged whenever a fresh fast result arrives
    setMerged(fastQuery.data);

    if (fastQuery.data.report !== null) return; // LLM already included

    const id = fastQuery.data.analysisId;
    let active = true;

    const poll = async () => {
      for (let i = 0; i < 60 && active; i++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
          const result = await pollAnalysisReport(id);
          if (result !== null && result.report !== null && active) {
            setMerged(prev => prev ? { ...prev, report: result.report, model: result.model, promptVersion: result.promptVersion } : prev);
            return;
          }
        } catch { /* keep polling */ }
      }
    };

    poll();
    return () => { active = false; };
  }, [fastQuery.data]);

  return {
    data: merged,
    isLoading: fastQuery.isLoading,
    isError: fastQuery.isError,
    error: fastQuery.error,
    refetch: fastQuery.refetch,
    isReportLoading: merged !== undefined && merged.report === null,
  };
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { runAnalysis, pollAnalysisReport } from '../lib/api-client';
import type { AnalysisOutput } from '../lib/types';
import { useState, useEffect, useRef } from 'react';

export function useAnalysis(params: {
  symbol: string;
  holdingHorizon: 'swing' | 'position';
  enabled: boolean;
}) {
  const fastQuery = useQuery({
    queryKey: ['analysis', params.symbol, params.holdingHorizon],
    queryFn: () => runAnalysis({ symbol: params.symbol, holdingHorizon: params.holdingHorizon }),
    enabled: params.enabled && !!params.symbol,
    // Keep data fresh for 5 minutes — prevents refetch on window focus from re-POST-ing analysis
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const [merged, setMerged] = useState<AnalysisOutput | undefined>(undefined);
  // Track which analysisId the current poll loop is for — avoid duplicate loops
  const pollingIdRef = useRef<string | null>(null);

  const analysisId = fastQuery.data?.analysisId ?? null;
  const hasReport = fastQuery.data?.report !== null;

  useEffect(() => {
    if (!fastQuery.data) { setMerged(undefined); return; }
    setMerged(fastQuery.data);
  }, [fastQuery.data]);

  useEffect(() => {
    if (!analysisId || hasReport) return;
    // Already polling for this id — don't start a second loop
    if (pollingIdRef.current === analysisId) return;

    pollingIdRef.current = analysisId;
    let active = true;

    const poll = async () => {
      for (let i = 0; i < 60 && active; i++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
          const result = await pollAnalysisReport(analysisId);
          if (result !== null && result.report !== null && active) {
            setMerged(prev => prev ? { ...prev, report: result.report, model: result.model, promptVersion: result.promptVersion } : prev);
            pollingIdRef.current = null;
            return;
          }
        } catch { /* keep polling */ }
      }
      pollingIdRef.current = null;
    };

    poll();
    return () => { active = false; };
  }, [analysisId, hasReport]);

  return {
    data: merged,
    isLoading: fastQuery.isLoading,
    isError: fastQuery.isError,
    error: fastQuery.error,
    refetch: fastQuery.refetch,
    isReportLoading: merged !== undefined && merged.report === null,
  };
}

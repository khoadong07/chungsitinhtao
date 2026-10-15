'use client';

import { useQuery } from '@tanstack/react-query';
import { runAnalysis, pollAnalysisReport, triggerAiReport } from '../lib/api-client';
import type { AnalysisOutput } from '../lib/types';
import { useState, useEffect, useRef, useCallback } from 'react';

export function useAnalysis(params: {
  symbol: string;
  holdingHorizon: 'swing' | 'position';
  enabled: boolean;
}) {
  const fastQuery = useQuery({
    queryKey: ['analysis', params.symbol, params.holdingHorizon],
    queryFn: () => runAnalysis({ symbol: params.symbol, holdingHorizon: params.holdingHorizon, withLlm: false }),
    enabled: params.enabled && !!params.symbol,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const [merged, setMerged] = useState<AnalysisOutput | undefined>(undefined);
  const [aiRequested, setAiRequested] = useState(false);
  const pollingIdRef = useRef<string | null>(null);

  const analysisId = fastQuery.data?.analysisId ?? null;
  const mergedReport = merged?.report ?? null;

  useEffect(() => {
    if (!fastQuery.data) { setMerged(undefined); setAiRequested(false); return; }
    setMerged(fastQuery.data);
    setAiRequested(false);
  }, [fastQuery.data]);

  // Poll only when AI was explicitly requested and report not yet arrived
  useEffect(() => {
    if (!analysisId || !aiRequested || mergedReport !== null) return;
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
  }, [analysisId, aiRequested, mergedReport]);

  const startAiAgent = useCallback(async () => {
    if (!analysisId || mergedReport !== null) return;
    setAiRequested(true);
    await triggerAiReport(analysisId).catch(() => {/* server may already be running */});
  }, [analysisId, mergedReport]);

  return {
    data: merged,
    isLoading: fastQuery.isLoading,
    isError: fastQuery.isError,
    error: fastQuery.error,
    refetch: fastQuery.refetch,
    isReportLoading: aiRequested && mergedReport === null,
    startAiAgent,
    aiRequested,
  };
}

import { aiProxyClient } from "@/src/api/aiProxyClient";
import type { HealthReport } from "@/src/features/reports/types/report.types";
import { useCallback, useState } from "react";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useReports() {
  const [report, setReport] = useState<HealthReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLatestReport = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await aiProxyClient.getLatestReport();
      setReport(data.report);
      return data.report;
    } catch (requestError) {
      setError(errorMessage(requestError, "Không thể tải báo cáo."));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshReport = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const data = await aiProxyClient.getLatestReport();
      setReport(data.report);
      return data.report;
    } catch (requestError) {
      setError(errorMessage(requestError, "Không thể làm mới báo cáo."));
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const generateReport = useCallback(async () => {
    try {
      setIsGenerating(true);
      setError(null);
      const data = await aiProxyClient.generateReport();
      setReport(data.report);
      return data.report;
    } catch (requestError) {
      setError(errorMessage(requestError, "Không thể tạo báo cáo."));
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    report,
    isLoading,
    isRefreshing,
    isGenerating,
    error,
    loadLatestReport,
    refreshReport,
    generateReport,
    clearError,
  };
}

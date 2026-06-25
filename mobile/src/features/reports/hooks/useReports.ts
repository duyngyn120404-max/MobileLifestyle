import { aiProxyClient } from "@/src/api/aiProxyClient";
import type { HealthReport } from "@/src/features/reports/types/report.types";
import { useCallback, useState } from "react";

export type ReportFilterMode = "this_week" | "last_4_weeks" | "all" | "custom";

type ReportDateFilters = { fromDate?: string | null; toDate?: string | null };

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatDateForQuery(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useReports() {
  const [report, setReport] = useState<HealthReport | null>(null);
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [filterMode, setFilterMode] = useState<ReportFilterMode>("this_week");
  const [customFilters, setCustomFilters] = useState<ReportDateFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFilterDates = useCallback((mode: ReportFilterMode) => {
    if (mode === "custom") return customFilters;
    if (mode === "all") return {};
    const now = new Date();
    const day = now.getDay() || 7;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - day + 1);
    const from = new Date(monday);
    if (mode === "last_4_weeks") from.setDate(monday.getDate() - 21);
    const to = new Date(monday);
    to.setDate(monday.getDate() + 6);
    return { fromDate: formatDateForQuery(from), toDate: formatDateForQuery(to) };
  }, [customFilters]);

  const loadReports = useCallback(async (mode: ReportFilterMode = filterMode) => {
    try {
      setIsLoading(true);
      setError(null);
      setFilterMode(mode);
      if (mode !== "custom") {
        setCustomFilters((previous) => (
          previous.fromDate || previous.toDate ? {} : previous
        ));
      }
      const data = await aiProxyClient.listReports(getFilterDates(mode));
      setReports(data.reports);
      setReport(data.reports[0] ?? null);
      return data.reports[0] ?? null;
    } catch (requestError) {
      setError(errorMessage(requestError, "Không thể tải báo cáo."));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [filterMode, getFilterDates]);

  const loadReportsByDateRange = useCallback(async (filters: ReportDateFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      setFilterMode("custom");
      setCustomFilters(filters);
      const data = await aiProxyClient.listReports(filters);
      setReports(data.reports);
      setReport(data.reports[0] ?? null);
      return data.reports[0] ?? null;
    } catch (requestError) {
      setError(errorMessage(requestError, "Không thể tải báo cáo."));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadLatestReport = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await aiProxyClient.getLatestReport();
      setReport(data.report);
      setReports(data.report ? [data.report] : []);
      return data.report;
    } catch (requestError) {
      setError(errorMessage(requestError, "Không thể tải báo cáo mới nhất."));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshReport = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const data = await aiProxyClient.listReports(getFilterDates(filterMode));
      setReports(data.reports);
      setReport(data.reports[0] ?? null);
      return data.reports[0] ?? null;
    } catch (requestError) {
      setError(errorMessage(requestError, "Không thể làm mới báo cáo."));
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, [filterMode, getFilterDates]);

  const generateReport = useCallback(async () => {
    try {
      setIsGenerating(true);
      setError(null);
      const data = await aiProxyClient.generateReport();
      setReport(data.report);
      setReports((previous) => {
        const key = data.report.weekStart ?? data.report.id;
        const rest = previous.filter((item) => (item.weekStart ?? item.id) !== key);
        return [data.report, ...rest];
      });
      return data.report;
    } catch (requestError) {
      setError(errorMessage(requestError, "Không thể tạo báo cáo."));
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const selectReport = useCallback((nextReport: HealthReport) => setReport(nextReport), []);

  return {
    report,
    reports,
    filterMode,
    isLoading,
    isRefreshing,
    isGenerating,
    error,
    loadLatestReport,
    loadReports,
    loadReportsByDateRange,
    refreshReport,
    generateReport,
    selectReport,
    setFilterMode,
    clearError,
  };
}

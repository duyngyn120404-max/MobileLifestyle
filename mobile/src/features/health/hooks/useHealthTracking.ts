import { aiProxyClient } from "@/src/api/aiProxyClient";
import type { BpRecord } from "@/src/features/health/types/health.types";
import { useCallback, useState } from "react";

export function useHealthTracking() {
  const [records, setRecords] = useState<BpRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = useCallback(
    async (filters: { fromDate?: string | null; toDate?: string | null } = {}) => {
      try {
        setLoading(true);
        setError(null);
        const data = await aiProxyClient.listBpRecords(filters);
        setRecords(data);
        return data;
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : "Không thể tải dữ liệu";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getRecord = useCallback(async (recordId: string) => {
    return aiProxyClient.getBpRecord(recordId);
  }, []);

  const deleteRecord = useCallback(async (recordId: string) => {
    return aiProxyClient.deleteBpRecord(recordId);
  }, []);

  return { records, loading, error, loadRecords, getRecord, deleteRecord };
}

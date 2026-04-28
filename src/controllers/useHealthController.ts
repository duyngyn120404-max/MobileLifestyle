import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { healthService } from '@/src/services/health.service';
import type { Disease } from '@/src/types';
import type { HealthRecord } from '@/src/repositories/health.repository';

export const useHealthController = () => {
  const router = useRouter();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = useCallback(async (userId: string, days: number = 30) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await healthService.getRecords(userId, days);
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch records');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitRecord = useCallback(async (
    userId: string,
    disease: Disease,
    formData: Record<string, string>
  ): Promise<{ success: boolean; error: string | null }> => {
    const validationError = healthService.validateFormData(disease, formData);
    if (validationError) return { success: false, error: validationError };

    try {
      setIsLoading(true);
      await healthService.submitRecord({ userId, disease, formData });
      return { success: true, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi lưu dữ liệu';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteRecord = useCallback(async (recordId: string) => {
    try {
      setIsLoading(true);
      await healthService.deleteRecord(recordId);
      setRecords(prev => prev.filter(r => r.id !== recordId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete record');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { records, isLoading, error, loadRecords, submitRecord, deleteRecord };
};

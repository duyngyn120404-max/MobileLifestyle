/**
 * Custom hook for health-related operations
 */

import { useState, useCallback } from "react";
import { databases, DATABASE_ID, HEALTH_RECORDS_COLLECTION_ID } from "@/src/services/appwrite";
import { Query } from "react-native-appwrite";
import type { HealthRecord } from "@/src/types";

interface UseHealthReturn {
  records: HealthRecord[];
  isLoading: boolean;
  error: string | null;
  fetchRecords: (userId: string, days?: number) => Promise<void>;
  addRecord: (record: Omit<HealthRecord, "$id">) => Promise<void>;
  deleteRecord: (recordId: string) => Promise<void>;
}

export const useHealth = (): UseHealthReturn => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async (userId: string, days: number = 30) => {
    try {
      setIsLoading(true);
      setError(null);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await databases.listDocuments(
        DATABASE_ID,
        HEALTH_RECORDS_COLLECTION_ID,
        [
          Query.equal("userId", userId),
          Query.greaterThanEqual("recordDate", startDate.toISOString()),
          Query.orderDesc("recordDate"),
        ]
      );

      setRecords(response.documents as HealthRecord[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch records";
      setError(errorMessage);
      console.error("Error fetching health records:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addRecord = useCallback(async (record: Omit<HealthRecord, "$id">) => {
    try {
      setIsLoading(true);
      setError(null);

      const newRecord = await databases.createDocument(
        DATABASE_ID,
        HEALTH_RECORDS_COLLECTION_ID,
        `record_${Date.now()}`,
        record
      );

      setRecords(prev => [newRecord as HealthRecord, ...prev]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add record";
      setError(errorMessage);
      console.error("Error adding health record:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteRecord = useCallback(async (recordId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await databases.deleteDocument(
        DATABASE_ID,
        HEALTH_RECORDS_COLLECTION_ID,
        recordId
      );

      setRecords(prev => prev.filter(r => r.$id !== recordId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete record";
      setError(errorMessage);
      console.error("Error deleting health record:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    records,
    isLoading,
    error,
    fetchRecords,
    addRecord,
    deleteRecord,
  };
};

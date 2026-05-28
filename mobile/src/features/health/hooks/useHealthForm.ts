import { aiProxyClient } from "@/src/api/aiProxyClient";
import type {
  BpRecord,
  BpRecordFormValues,
} from "@/src/features/health/types/health.types";
import { toBpRecordRequest } from "@/src/features/health/validation/health.validation";
import { useCallback, useEffect, useState } from "react";

const EMPTY_FORM: BpRecordFormValues = {
  systolic: "",
  diastolic: "",
  source: "HBPM",
  dayPeriod: "morning",
  position: "sitting",
  restedMinutes: "",
  deviceType: "upper_arm",
  deviceValidated: true,
  measuredAt: "",
};

function toInputDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  const hh = `${date.getHours()}`.padStart(2, "0");
  const min = `${date.getMinutes()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export function useHealthForm(recordId: string | null, isEditMode: boolean) {
  const [values, setValues] = useState<BpRecordFormValues>(EMPTY_FORM);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = useCallback(
    <K extends keyof BpRecordFormValues>(field: K, value: BpRecordFormValues[K]) => {
      setValues((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  useEffect(() => {
    if (!isEditMode || !recordId) return;

    let active = true;
    const loadRecord = async () => {
      try {
        setLoadingInitial(true);
        setError(null);
        const record = await aiProxyClient.getBpRecord(recordId);
        if (!active) return;
        setValues({
          systolic: String(record.systolic),
          diastolic: String(record.diastolic),
          source: record.source,
          dayPeriod: record.dayPeriod,
          position: record.position,
          restedMinutes:
            record.restedMinutes === null ? "" : String(record.restedMinutes),
          deviceType: record.deviceType,
          deviceValidated: record.deviceValidated,
          measuredAt: toInputDateTime(record.measuredAt),
        });
      } catch (requestError) {
        if (!active) return;
        setError(
          requestError instanceof Error ? requestError.message : "Không thể tải bản ghi",
        );
      } finally {
        if (active) setLoadingInitial(false);
      }
    };

    loadRecord();
    return () => {
      active = false;
    };
  }, [isEditMode, recordId]);

  const saveRecord = useCallback(async (): Promise<BpRecord | null> => {
    const validation = toBpRecordRequest(values);
    if (!validation.payload) {
      setError(validation.error ?? "Dữ liệu không hợp lệ");
      return null;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      if (isEditMode && recordId) {
        return await aiProxyClient.updateBpRecord(recordId, validation.payload);
      }
      return await aiProxyClient.createBpRecord(validation.payload);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Không thể lưu dữ liệu",
      );
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [isEditMode, recordId, values]);

  return { values, updateField, loadingInitial, isSubmitting, error, saveRecord };
}

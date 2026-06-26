import { aiProxyClient } from "@/src/api/aiProxyClient";
import type {
  MeasurementSession,
  MeasurementSessionFormValues,
} from "@/src/features/health/types/health.types";
import { toMeasurementSessionRequest } from "@/src/features/health/validation/health.validation";
import { useCallback, useEffect, useState } from "react";

const EMPTY_FORM: MeasurementSessionFormValues = {
  reading1Systolic: "",
  reading1Diastolic: "",
  reading2Systolic: "",
  reading2Diastolic: "",
  source: "HBPM",
  position: "sitting",
  restedMinutes: "",
  deviceType: "upper_arm",
  deviceName: "",
  deviceValidated: true,
  measuredAt: "",
};

function toInputDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

export function useHealthForm(recordId: string | null, isEditMode: boolean) {
  const [values, setValues] = useState<MeasurementSessionFormValues>(EMPTY_FORM);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const updateField = useCallback(
    <K extends keyof MeasurementSessionFormValues>(field: K, value: MeasurementSessionFormValues[K]) => {
      setValues((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  const retryLoadRecord = useCallback(() => {
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  useEffect(() => {
    if (!isEditMode || !recordId) {
      setInitialLoadError(null);
      return;
    }

    let active = true;
    const loadRecord = async () => {
      try {
        setLoadingInitial(true);
        setError(null);
        setInitialLoadError(null);
        const record = await aiProxyClient.getMeasurementSession(recordId);
        if (!active) return;
        setInitialLoadError(null);
        setValues({
          reading1Systolic: record.readings[0] ? String(record.readings[0].systolic) : "",
          reading1Diastolic: record.readings[0] ? String(record.readings[0].diastolic) : "",
          reading2Systolic: record.readings[1] ? String(record.readings[1].systolic) : "",
          reading2Diastolic: record.readings[1] ? String(record.readings[1].diastolic) : "",
          source: record.source === "OBPM" || record.source === "ABPM" ? record.source : "HBPM",
          position: record.position === "standing" || record.position === "lying" ? record.position : "sitting",
          restedMinutes:
            record.restedMinutes === null ? "" : String(record.restedMinutes),
          deviceType: record.deviceType === "wrist" ? "wrist" : "upper_arm",
          deviceName: record.deviceName ?? "",
          deviceValidated: Boolean(record.deviceValidated),
          measuredAt: toInputDateTime(record.measuredAt),
        });
      } catch (requestError) {
        if (!active) return;
        const message =
          requestError instanceof Error ? requestError.message : "Không thể tải bản ghi";
        setInitialLoadError(message);
      } finally {
        if (active) setLoadingInitial(false);
      }
    };

    loadRecord();
    return () => {
      active = false;
    };
  }, [isEditMode, loadAttempt, recordId]);

  const saveRecord = useCallback(async (): Promise<MeasurementSession | null> => {
    const validation = toMeasurementSessionRequest(values);
    if (!validation.payload) {
      setError(validation.error ?? "Dữ liệu không hợp lệ");
      return null;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      if (isEditMode && recordId) {
        return await aiProxyClient.updateMeasurementSession(recordId, validation.payload);
      }
      return await aiProxyClient.createMeasurementSession(validation.payload);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Không thể lưu dữ liệu",
      );
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [isEditMode, recordId, values]);

  return {
    values,
    updateField,
    loadingInitial,
    isSubmitting,
    error,
    initialLoadError,
    retryLoadRecord,
    saveRecord,
  };
}

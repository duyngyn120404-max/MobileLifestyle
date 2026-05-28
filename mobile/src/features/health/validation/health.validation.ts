import type {
  BpRecordFormValues,
  SaveBpRecordRequest,
  SaveRiskProfileRequest,
} from "@/src/features/health/types/health.types";

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function toBpRecordRequest(
  values: BpRecordFormValues,
): { payload?: SaveBpRecordRequest; error?: string } {
  if (!values.systolic.trim() || !values.diastolic.trim()) {
    return { error: "Vui lòng nhập đầy đủ tâm thu và tâm trương" };
  }

  const systolic = Number(values.systolic);
  const diastolic = Number(values.diastolic);
  if (!Number.isFinite(systolic) || !Number.isFinite(diastolic)) {
    return { error: "Chỉ số huyết áp phải là số hợp lệ" };
  }
  if (systolic < 40 || systolic > 300) {
    return { error: "Tâm thu cần nằm trong khoảng hợp lý" };
  }
  if (diastolic < 30 || diastolic > 200) {
    return { error: "Tâm trương cần nằm trong khoảng hợp lý" };
  }
  if (systolic <= diastolic) {
    return { error: "Tâm thu phải lớn hơn tâm trương" };
  }

  const restedMinutes = values.restedMinutes.trim()
    ? Number(values.restedMinutes)
    : null;
  if (
    restedMinutes !== null &&
    (!Number.isFinite(restedMinutes) || restedMinutes < 0 || restedMinutes > 180)
  ) {
    return { error: "Số phút nghỉ cần là số hợp lệ từ 0 đến 180" };
  }

  const parsedMeasuredAt = values.measuredAt.trim()
    ? new Date(values.measuredAt)
    : new Date();
  if (Number.isNaN(parsedMeasuredAt.getTime())) {
    return { error: "Thời gian đo không hợp lệ" };
  }

  return {
    payload: {
      systolic,
      diastolic,
      source: values.source,
      dayPeriod: values.dayPeriod,
      position: values.position,
      restedMinutes,
      deviceType: values.deviceType,
      deviceValidated: values.deviceValidated,
      measuredAt: parsedMeasuredAt.toISOString(),
    },
  };
}

export function normalizeRiskProfileRequest(
  values: SaveRiskProfileRequest,
): SaveRiskProfileRequest {
  return {
    riskFactors: uniqueStrings(values.riskFactors),
    hmodItems: uniqueStrings(values.hmodItems),
    cardiovascularDiseases: uniqueStrings(values.cardiovascularDiseases),
  };
}

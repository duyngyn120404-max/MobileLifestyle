import type {
  BpRecordFormValues,
  MeasurementSessionFormValues,
  SaveBpRecordRequest,
  SaveMeasurementSessionRequest,
  SaveRiskProfileRequest,
} from "@/src/features/health/types/health.types";

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function parseLocalDateTimeInput(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return new Date();

  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/);
  if (!match) return null;

  const [, yyyy, mm, dd, hh = "00", min = "00"] = match;
  const year = Number(yyyy);
  const month = Number(mm);
  const day = Number(dd);
  const hour = Number(hh);
  const minute = Number(min);

  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null;
  }

  return date;
}

function toVietnamIsoString(date: Date): string {
  const vietnamOffsetMs = 7 * 60 * 60 * 1000;
  const vietnamDate = new Date(date.getTime() + vietnamOffsetMs);

  const yyyy = vietnamDate.getUTCFullYear();
  const mm = `${vietnamDate.getUTCMonth() + 1}`.padStart(2, "0");
  const dd = `${vietnamDate.getUTCDate()}`.padStart(2, "0");
  const hh = `${vietnamDate.getUTCHours()}`.padStart(2, "0");
  const min = `${vietnamDate.getUTCMinutes()}`.padStart(2, "0");
  const ss = `${vietnamDate.getUTCSeconds()}`.padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+07:00`;
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

  const parsedMeasuredAt = parseLocalDateTimeInput(values.measuredAt);
  if (!parsedMeasuredAt || Number.isNaN(parsedMeasuredAt.getTime())) {
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
      measuredAt: toVietnamIsoString(parsedMeasuredAt),
    },
  };
}


function parseBpReading(
  systolicText: string,
  diastolicText: string,
  label: string,
): { systolic: number; diastolic: number; error?: string } {
  if (!systolicText.trim() || !diastolicText.trim()) {
    return { systolic: 0, diastolic: 0, error: `Vui lòng nhập đầy đủ tâm thu và tâm trương cho ${label}` };
  }

  const systolic = Number(systolicText);
  const diastolic = Number(diastolicText);
  if (!Number.isFinite(systolic) || !Number.isFinite(diastolic)) {
    return { systolic: 0, diastolic: 0, error: `Chỉ số huyết áp của ${label} phải là số hợp lệ` };
  }
  if (systolic < 40 || systolic > 300) {
    return { systolic, diastolic, error: `Tâm thu của ${label} cần nằm trong khoảng hợp lý` };
  }
  if (diastolic < 30 || diastolic > 200) {
    return { systolic, diastolic, error: `Tâm trương của ${label} cần nằm trong khoảng hợp lý` };
  }
  if (systolic <= diastolic) {
    return { systolic, diastolic, error: `Tâm thu của ${label} phải lớn hơn tâm trương` };
  }

  return { systolic, diastolic };
}

export function toMeasurementSessionRequest(
  values: MeasurementSessionFormValues,
): { payload?: SaveMeasurementSessionRequest; error?: string } {
  const first = parseBpReading(values.reading1Systolic, values.reading1Diastolic, "lần đo 1");
  if (first.error) return { error: first.error };

  const second = parseBpReading(values.reading2Systolic, values.reading2Diastolic, "lần đo 2");
  if (second.error) return { error: second.error };

  const restedMinutes = values.restedMinutes.trim()
    ? Number(values.restedMinutes)
    : null;
  if (
    restedMinutes !== null &&
    (!Number.isFinite(restedMinutes) || restedMinutes < 0 || restedMinutes > 180)
  ) {
    return { error: "Số phút nghỉ cần là số hợp lệ từ 0 đến 180" };
  }

  const parsedMeasuredAt = parseLocalDateTimeInput(values.measuredAt);
  if (!parsedMeasuredAt || Number.isNaN(parsedMeasuredAt.getTime())) {
    return { error: "Thời gian đo không hợp lệ" };
  }

  return {
    payload: {
      measuredAt: toVietnamIsoString(parsedMeasuredAt),
      source: values.source,
      position: values.position,
      restedMinutes,
      deviceType: values.deviceType,
      deviceName: values.deviceName.trim() || null,
      deviceValidated: values.deviceValidated,
      readings: [
        { systolic: first.systolic, diastolic: first.diastolic },
        { systolic: second.systolic, diastolic: second.diastolic },
      ],
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

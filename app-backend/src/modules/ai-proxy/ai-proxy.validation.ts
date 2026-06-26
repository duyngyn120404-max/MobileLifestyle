import { AppError } from "../../shared/errors/app-error.js";
import { ERROR_CODES } from "../../shared/errors/error-codes.js";
import type {
  BpSource,
  CreateConversationRequest,
  DayPeriod,
  DeviceType,
  IntentMode,
  PositionType,
  SaveBpRecordRequest,
  SaveMeasurementSessionRequest,
  SaveRiskProfileRequest,
  SubmitInteractionRequest,
} from "./ai-proxy.types.js";

const INTENT_MODES: IntentMode[] = [
  "auto",
  "personal_medical_qa",
  "general_medical_qa",
  "data_collection",
];
const BP_SOURCES: BpSource[] = ["HBPM", "OBPM", "ABPM"];
const DAY_PERIODS: DayPeriod[] = ["morning", "afternoon", "evening", "night"];
const POSITIONS: PositionType[] = ["sitting", "standing", "lying"];
const DEVICE_TYPES: DeviceType[] = ["upper_arm", "wrist"];

function validationError(message: string): never {
  throw new AppError(message, 400, ERROR_CODES.VALIDATION_ERROR);
}

export function requireId(value: string, name: string): string {
  if (!value.trim()) return validationError(`${name} is required`);
  return value;
}

function requireNumber(
  payload: Record<string, unknown>,
  field: string,
  minimum: number,
  maximum: number,
): number {
  const value = payload[field];
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    return validationError(`${field} must be a number between ${minimum} and ${maximum}`);
  }
  return value;
}

function requireEnum<T extends string>(
  value: unknown,
  values: readonly T[],
  field: string,
): T {
  if (typeof value !== "string" || !values.includes(value as T)) {
    return validationError(`${field} is invalid`);
  }
  return value as T;
}

export function validateBpRecord(body: unknown): SaveBpRecordRequest {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return validationError("Blood pressure payload must be an object");
  }

  const payload = body as Record<string, unknown>;
  const allowedFields = [
    "systolic",
    "diastolic",
    "source",
    "dayPeriod",
    "position",
    "restedMinutes",
    "deviceType",
    "deviceValidated",
    "measuredAt",
  ];
  if (Object.keys(payload).some((field) => !allowedFields.includes(field))) {
    return validationError("Blood pressure payload contains invalid fields");
  }

  const systolic = requireNumber(payload, "systolic", 40, 300);
  const diastolic = requireNumber(payload, "diastolic", 30, 200);
  if (systolic <= diastolic) {
    return validationError("systolic must be greater than diastolic");
  }
  const restedMinutes =
    payload.restedMinutes === null
      ? null
      : requireNumber(payload, "restedMinutes", 0, 180);
  if (typeof payload.deviceValidated !== "boolean") {
    return validationError("deviceValidated must be a boolean");
  }
  if (typeof payload.measuredAt !== "string" || Number.isNaN(Date.parse(payload.measuredAt))) {
    return validationError("measuredAt must be a valid date");
  }

  return {
    systolic,
    diastolic,
    source: requireEnum(payload.source, BP_SOURCES, "source"),
    dayPeriod: requireEnum(payload.dayPeriod, DAY_PERIODS, "dayPeriod"),
    position: requireEnum(payload.position, POSITIONS, "position"),
    restedMinutes,
    deviceType: requireEnum(payload.deviceType, DEVICE_TYPES, "deviceType"),
    deviceValidated: payload.deviceValidated,
    measuredAt: new Date(payload.measuredAt).toISOString(),
  };
}


export function validateMeasurementSession(body: unknown): SaveMeasurementSessionRequest {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return validationError("Measurement session payload must be an object");
  }

  const payload = body as Record<string, unknown>;
  const allowedFields = [
    "measuredAt",
    "source",
    "position",
    "restedMinutes",
    "deviceType",
    "deviceName",
    "deviceValidated",
    "readings",
  ];
  if (Object.keys(payload).some((field) => !allowedFields.includes(field))) {
    return validationError("Measurement session payload contains invalid fields");
  }
  if (typeof payload.measuredAt !== "string" || Number.isNaN(Date.parse(payload.measuredAt))) {
    return validationError("measuredAt must be a valid date");
  }
  if (typeof payload.deviceValidated !== "boolean") {
    return validationError("deviceValidated must be a boolean");
  }
  const restedMinutes =
    payload.restedMinutes === null
      ? null
      : requireNumber(payload, "restedMinutes", 0, 180);
  const deviceName =
    payload.deviceName === undefined || payload.deviceName === null
      ? null
      : typeof payload.deviceName === "string"
        ? payload.deviceName.trim() || null
        : validationError("deviceName must be a string or null");

  if (!Array.isArray(payload.readings) || payload.readings.length < 1) {
    return validationError("readings must contain at least 1 reading");
  }

  const readings = payload.readings.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return validationError(`readings[${index}] must be an object`);
    }
    const reading = entry as Record<string, unknown>;
    const allowedReadingFields = ["systolic", "diastolic"];
    if (Object.keys(reading).some((field) => !allowedReadingFields.includes(field))) {
      return validationError(`readings[${index}] contains invalid fields`);
    }
    const systolic = requireNumber(reading, "systolic", 40, 300);
    const diastolic = requireNumber(reading, "diastolic", 30, 200);
    if (systolic <= diastolic) {
      return validationError(`readings[${index}].systolic must be greater than diastolic`);
    }
    return { systolic, diastolic };
  });

  return {
    measuredAt: new Date(payload.measuredAt).toISOString(),
    source: requireEnum(payload.source, BP_SOURCES, "source"),
    position: requireEnum(payload.position, POSITIONS, "position"),
    restedMinutes,
    deviceType: requireEnum(payload.deviceType, DEVICE_TYPES, "deviceType"),
    deviceName,
    deviceValidated: payload.deviceValidated,
    readings,
  };
}

function validateRiskList(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    return validationError(`${field} must be an array of strings`);
  }
  return [...new Set(value.map((entry) => entry.trim()).filter(Boolean))];
}

export function validateRiskProfile(body: unknown): SaveRiskProfileRequest {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return validationError("Risk profile payload must be an object");
  }
  const payload = body as Record<string, unknown>;
  const allowedFields = ["riskFactors", "hmodItems", "cardiovascularDiseases"];
  if (Object.keys(payload).some((field) => !allowedFields.includes(field))) {
    return validationError("Risk profile payload contains invalid fields");
  }
  return {
    riskFactors: validateRiskList(payload.riskFactors, "riskFactors"),
    hmodItems: validateRiskList(payload.hmodItems, "hmodItems"),
    cardiovascularDiseases: validateRiskList(
      payload.cardiovascularDiseases,
      "cardiovascularDiseases",
    ),
  };
}

export function validateDateFilter(value: unknown, name: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    return validationError(`${name} must be a valid date`);
  }
  return value;
}

export function validateCreateConversation(body: unknown): CreateConversationRequest {
  if (body === undefined || body === null) return {};
  if (typeof body !== "object" || Array.isArray(body)) {
    return validationError("Conversation payload must be an object");
  }

  const payload = body as Record<string, unknown>;
  if (Object.keys(payload).some((key) => key !== "title")) {
    return validationError("Conversation payload contains invalid fields");
  }
  if (payload.title !== undefined && typeof payload.title !== "string") {
    return validationError("title must be a string");
  }

  return payload.title === undefined ? {} : { title: payload.title.trim() };
}

export function validateInteraction(body: unknown): SubmitInteractionRequest {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return validationError("Interaction payload must be an object");
  }

  const payload = body as Record<string, unknown>;
  if (payload.type === "user_message") {
    if (typeof payload.content !== "string" || !payload.content.trim()) {
      return validationError("content is required");
    }
    if (
      payload.intent !== undefined &&
      !INTENT_MODES.includes(payload.intent as IntentMode)
    ) {
      return validationError("intent is invalid");
    }
    return {
      type: "user_message",
      content: payload.content.trim(),
      ...(payload.intent === undefined ? {} : { intent: payload.intent as IntentMode }),
    };
  }

  if (payload.type === "action_response") {
    if (typeof payload.actionId !== "string" || !payload.actionId.trim()) {
      return validationError("actionId is required");
    }
    if (payload.decision !== "accepted" && payload.decision !== "rejected") {
      return validationError("decision must be accepted or rejected");
    }
    return {
      type: "action_response",
      actionId: payload.actionId.trim(),
      decision: payload.decision,
    };
  }

  return validationError("type must be user_message or action_response");
}

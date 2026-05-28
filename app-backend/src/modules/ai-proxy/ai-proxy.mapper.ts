import { AppError } from "../../shared/errors/app-error.js";
import { ERROR_CODES } from "../../shared/errors/error-codes.js";
import type {
  AiServiceBpRecordResponse,
  AiServiceChatMessage,
  AiServiceConversationSummary,
  AiServiceCreateConversationRequest,
  AiServiceInteractionRequest,
  AiServiceInteractionResponse,
  AiServiceGenerateReportResponse,
  AiServiceHealthReport,
  AiServiceLatestReportResponse,
  AiServiceRiskProfileResponse,
  AiServiceSaveBpRecordRequest,
  AiServiceSaveRiskProfileRequest,
} from "./ai-service.types.js";
import type {
  BpRecord,
  ChatMessage,
  ConversationSummary,
  CreateConversationRequest,
  GenerateReportResponse,
  HealthReport,
  LatestReportResponse,
  PendingAction,
  RiskProfile,
  SaveBpRecordRequest,
  SaveRiskProfileRequest,
  SubmitInteractionRequest,
  SubmitInteractionResponse,
} from "./ai-proxy.types.js";

const BP_SOURCES = ["HBPM", "OBPM", "ABPM"] as const;
const DAY_PERIODS = ["morning", "afternoon", "evening", "night"] as const;
const POSITIONS = ["sitting", "standing", "lying"] as const;
const DEVICE_TYPES = ["upper_arm", "wrist"] as const;
const ACTION_STATUSES = ["pending", "accepted", "rejected"] as const;
const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
const RISK_LEVELS = ["low", "medium", "moderate", "high", "very_high"] as const;

function invalidResponse(message: string): never {
  throw new AppError(
    `Invalid AI service response: ${message}`,
    502,
    ERROR_CODES.EXTERNAL_SERVICE_ERROR,
  );
}

function asObject(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return invalidResponse(`${name} must be an object`);
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, name: string): string {
  if (typeof value !== "string") {
    return invalidResponse(`${name} must be a string`);
  }
  return value;
}

function asNumber(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return invalidResponse(`${name} must be a number`);
  }
  return value;
}

function asBoolean(value: unknown, name: string): boolean {
  if (typeof value !== "boolean") {
    return invalidResponse(`${name} must be a boolean`);
  }
  return value;
}

function asEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  name: string,
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    return invalidResponse(`${name} is invalid`);
  }
  return value as T;
}

function asStringArray(value: unknown, name: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return invalidResponse(`${name} must be an array of strings`);
  }
  return value as string[];
}

function optionalStrings(value: unknown, name: string): string[] | undefined {
  return value === undefined ? undefined : asStringArray(value, name);
}

function optionalString(value: unknown, name: string): string | undefined {
  return value === undefined ? undefined : asString(value, name);
}

function optionalNumber(value: unknown, name: string): number | undefined {
  return value === undefined ? undefined : asNumber(value, name);
}

function optionalBoolean(value: unknown, name: string): boolean | undefined {
  return value === undefined ? undefined : asBoolean(value, name);
}

function optionalEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  name: string,
): T | undefined {
  return value === undefined ? undefined : asEnum(value, allowed, name);
}

export function toAiServiceCreateConversationRequest(
  request: CreateConversationRequest,
): AiServiceCreateConversationRequest {
  return request.title === undefined ? {} : { title: request.title };
}

export function toAiServiceInteractionRequest(
  request: SubmitInteractionRequest,
): AiServiceInteractionRequest {
  if (request.type === "user_message") {
    return {
      type: "user_message",
      content: request.content,
      ...(request.intent === undefined ? {} : { intent: request.intent }),
    };
  }
  return {
    type: "action_response",
    actionId: request.actionId,
    decision: request.decision,
  };
}

export function toAiServiceBpRecordRequest(
  request: SaveBpRecordRequest,
): AiServiceSaveBpRecordRequest {
  return {
    systolic: request.systolic,
    diastolic: request.diastolic,
    source: request.source,
    dayPeriod: request.dayPeriod,
    position: request.position,
    restedMinutes: request.restedMinutes,
    deviceType: request.deviceType,
    deviceValidated: request.deviceValidated,
    measuredAt: request.measuredAt,
  };
}

export function toAiServiceRiskProfileRequest(
  request: SaveRiskProfileRequest,
): AiServiceSaveRiskProfileRequest {
  return {
    riskFactors: [...request.riskFactors],
    hmodItems: [...request.hmodItems],
    cardiovascularDiseases: [...request.cardiovascularDiseases],
  };
}

export function toPublicConversationSummary(value: unknown): ConversationSummary {
  const payload = asObject(value, "conversation");
  const parsed: AiServiceConversationSummary = {
    id: asString(payload.id, "conversation.id"),
    title: asString(payload.title, "conversation.title"),
    createdAt: asString(payload.createdAt, "conversation.createdAt"),
    updatedAt: asString(payload.updatedAt, "conversation.updatedAt"),
  };
  return { ...parsed };
}

export function toPublicConversationList(value: unknown): ConversationSummary[] {
  if (!Array.isArray(value)) return invalidResponse("conversations must be an array");
  return value.map(toPublicConversationSummary);
}

function toPublicPendingAction(value: unknown): PendingAction {
  const payload = asObject(value, "action");
  let details: { label: string; value: string }[] | undefined;
  if (payload.details !== undefined) {
    if (!Array.isArray(payload.details)) {
      return invalidResponse("action.details must be an array");
    }
    details = payload.details.map((detail) => {
      const item = asObject(detail, "action.detail");
      return {
        label: asString(item.label, "action.detail.label"),
        value: asString(item.value, "action.detail.value"),
      };
    });
  }
  return {
    id: asString(payload.id, "action.id"),
    type: asEnum(payload.type, ["confirm_health_data"] as const, "action.type"),
    status: asEnum(payload.status, ACTION_STATUSES, "action.status"),
    summary: asString(payload.summary, "action.summary"),
    ...(details === undefined ? {} : { details }),
  };
}

export function toPublicChatMessage(value: unknown): ChatMessage {
  const payload = asObject(value, "message");
  const actions =
    payload.actions === undefined
      ? undefined
      : Array.isArray(payload.actions)
        ? payload.actions.map(toPublicPendingAction)
        : invalidResponse("message.actions must be an array");
  const parsed: AiServiceChatMessage = {
    id: asString(payload.id, "message.id"),
    conversationId: asString(payload.conversationId, "message.conversationId"),
    role: asEnum(payload.role, ["user", "assistant"] as const, "message.role"),
    content: asString(payload.content, "message.content"),
    createdAt: asString(payload.createdAt, "message.createdAt"),
    ...(actions === undefined ? {} : { actions }),
  };
  return { ...parsed };
}

export function toPublicMessageList(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return invalidResponse("messages must be an array");
  return value.map(toPublicChatMessage);
}

export function toPublicInteractionResponse(value: unknown): SubmitInteractionResponse {
  const payload = asObject(value, "interaction response");
  const parsed: AiServiceInteractionResponse = {
    messages: toPublicMessageList(payload.messages),
  };
  return { messages: parsed.messages };
}

export function toPublicBpRecord(value: unknown): BpRecord {
  const payload = asObject(value, "bp record");
  const restedMinutes =
    payload.restedMinutes === null
      ? null
      : asNumber(payload.restedMinutes, "bpRecord.restedMinutes");
  const parsed: AiServiceBpRecordResponse = {
    id: asString(payload.id, "bpRecord.id"),
    systolic: asNumber(payload.systolic, "bpRecord.systolic"),
    diastolic: asNumber(payload.diastolic, "bpRecord.diastolic"),
    source: asEnum(payload.source, BP_SOURCES, "bpRecord.source"),
    dayPeriod: asEnum(payload.dayPeriod, DAY_PERIODS, "bpRecord.dayPeriod"),
    position: asEnum(payload.position, POSITIONS, "bpRecord.position"),
    restedMinutes,
    deviceType: asEnum(payload.deviceType, DEVICE_TYPES, "bpRecord.deviceType"),
    deviceValidated: asBoolean(payload.deviceValidated, "bpRecord.deviceValidated"),
    measuredAt: asString(payload.measuredAt, "bpRecord.measuredAt"),
    ...(payload.warnings === undefined
      ? {}
      : { warnings: optionalStrings(payload.warnings, "bpRecord.warnings") }),
  };
  return { ...parsed };
}

export function toPublicBpRecordList(value: unknown): BpRecord[] {
  if (!Array.isArray(value)) return invalidResponse("bp records must be an array");
  return value.map(toPublicBpRecord);
}

export function toPublicRiskProfile(value: unknown): RiskProfile {
  const payload = asObject(value, "risk profile");
  const parsed: AiServiceRiskProfileResponse = {
    riskFactors: asStringArray(payload.riskFactors, "riskProfile.riskFactors"),
    hmodItems: asStringArray(payload.hmodItems, "riskProfile.hmodItems"),
    cardiovascularDiseases: asStringArray(
      payload.cardiovascularDiseases,
      "riskProfile.cardiovascularDiseases",
    ),
    ...(payload.warnings === undefined
      ? {}
      : { warnings: optionalStrings(payload.warnings, "riskProfile.warnings") }),
  };
  return { ...parsed };
}

function toPublicBpAverage(value: unknown, name: string) {
  const payload = asObject(value, name);
  return {
    systolic:
      payload.systolic === null
        ? null
        : asNumber(payload.systolic, `${name}.systolic`),
    diastolic:
      payload.diastolic === null
        ? null
        : asNumber(payload.diastolic, `${name}.diastolic`),
  };
}

function toPublicReport(value: unknown): HealthReport {
  const payload = asObject(value, "report");
  const classificationPayload = asObject(payload.classification, "report.classification");
  const averagesPayload =
    classificationPayload.averages === undefined
      ? undefined
      : asObject(classificationPayload.averages, "report.classification.averages");
  const measurementQuality =
    classificationPayload.measurementQuality === undefined
      ? undefined
      : Array.isArray(classificationPayload.measurementQuality)
        ? classificationPayload.measurementQuality.map((entry) => {
            const item = asObject(entry, "report.classification.measurementQuality item");
            return {
              source: asString(item.source, "measurementQuality.source"),
              qualityScore: asNumber(item.qualityScore, "measurementQuality.qualityScore"),
              qualityLevel: asEnum(item.qualityLevel, CONFIDENCE_LEVELS, "measurementQuality.qualityLevel"),
              usable: asBoolean(item.usable, "measurementQuality.usable"),
              flags: asStringArray(item.flags, "measurementQuality.flags"),
            };
          })
        : invalidResponse("report.classification.measurementQuality must be an array");

  const classification = {
    ...(optionalEnum(classificationPayload.bpCategory, ["normal", "elevated", "hypertension"] as const, "report.classification.bpCategory") === undefined
      ? {}
      : { bpCategory: asEnum(classificationPayload.bpCategory, ["normal", "elevated", "hypertension"] as const, "report.classification.bpCategory") }),
    ...(optionalString(classificationPayload.bpStage, "report.classification.bpStage") === undefined
      ? {}
      : { bpStage: asString(classificationPayload.bpStage, "report.classification.bpStage") }),
    ...(optionalEnum(classificationPayload.phenotype, ["sustained_hypertension", "white_coat_hypertension", "masked_hypertension", "normal"] as const, "report.classification.phenotype") === undefined
      ? {}
      : { phenotype: asEnum(classificationPayload.phenotype, ["sustained_hypertension", "white_coat_hypertension", "masked_hypertension", "normal"] as const, "report.classification.phenotype") }),
    ...(optionalString(classificationPayload.sourceUsed, "report.classification.sourceUsed") === undefined
      ? {}
      : { sourceUsed: asString(classificationPayload.sourceUsed, "report.classification.sourceUsed") }),
    ...(optionalEnum(classificationPayload.confidence, CONFIDENCE_LEVELS, "report.classification.confidence") === undefined
      ? {}
      : { confidence: asEnum(classificationPayload.confidence, CONFIDENCE_LEVELS, "report.classification.confidence") }),
    ...(optionalEnum(classificationPayload.dataSource, ["live", "stored"] as const, "report.classification.dataSource") === undefined
      ? {}
      : { dataSource: asEnum(classificationPayload.dataSource, ["live", "stored"] as const, "report.classification.dataSource") }),
    ...(optionalString(classificationPayload.dataTimestamp, "report.classification.dataTimestamp") === undefined
      ? {}
      : { dataTimestamp: asString(classificationPayload.dataTimestamp, "report.classification.dataTimestamp") }),
    ...(averagesPayload === undefined
      ? {}
      : {
          averages: {
            ...(averagesPayload.clinic === undefined ? {} : { clinic: toPublicBpAverage(averagesPayload.clinic, "averages.clinic") }),
            ...(averagesPayload.home === undefined ? {} : { home: toPublicBpAverage(averagesPayload.home, "averages.home") }),
            ...(averagesPayload.abpm === undefined ? {} : { abpm: toPublicBpAverage(averagesPayload.abpm, "averages.abpm") }),
          },
        }),
    ...(measurementQuality === undefined ? {} : { measurementQuality }),
  };

  const clinicalReasoning =
    payload.clinicalReasoning === undefined || payload.clinicalReasoning === null
      ? payload.clinicalReasoning
      : (() => {
          const reasoning = asObject(payload.clinicalReasoning, "report.clinicalReasoning");
          return {
            ...(optionalString(reasoning.explanation, "clinicalReasoning.explanation") === undefined ? {} : { explanation: asString(reasoning.explanation, "clinicalReasoning.explanation") }),
            ...(optionalString(reasoning.recommendation, "clinicalReasoning.recommendation") === undefined ? {} : { recommendation: asString(reasoning.recommendation, "clinicalReasoning.recommendation") }),
            ...(optionalEnum(reasoning.confidence, CONFIDENCE_LEVELS, "clinicalReasoning.confidence") === undefined ? {} : { confidence: asEnum(reasoning.confidence, CONFIDENCE_LEVELS, "clinicalReasoning.confidence") }),
          };
        })();
  const risk =
    payload.risk === undefined || payload.risk === null
      ? payload.risk
      : (() => {
          const item = asObject(payload.risk, "report.risk");
          return {
            ...(optionalEnum(item.riskLevel, RISK_LEVELS, "report.risk.riskLevel") === undefined ? {} : { riskLevel: asEnum(item.riskLevel, RISK_LEVELS, "report.risk.riskLevel") }),
            ...(optionalString(item.recommendation, "report.risk.recommendation") === undefined ? {} : { recommendation: asString(item.recommendation, "report.risk.recommendation") }),
            ...(optionalString(item.explanation, "report.risk.explanation") === undefined ? {} : { explanation: asString(item.explanation, "report.risk.explanation") }),
            ...(optionalEnum(item.confidence, CONFIDENCE_LEVELS, "report.risk.confidence") === undefined ? {} : { confidence: asEnum(item.confidence, CONFIDENCE_LEVELS, "report.risk.confidence") }),
            ...(optionalEnum(item.dataSource, ["live", "stored"] as const, "report.risk.dataSource") === undefined ? {} : { dataSource: asEnum(item.dataSource, ["live", "stored"] as const, "report.risk.dataSource") }),
            ...(optionalString(item.dataTimestamp, "report.risk.dataTimestamp") === undefined ? {} : { dataTimestamp: asString(item.dataTimestamp, "report.risk.dataTimestamp") }),
          };
        })();
  const mlRisk =
    payload.mlRisk === undefined || payload.mlRisk === null
      ? payload.mlRisk
      : (() => {
          const item = asObject(payload.mlRisk, "report.mlRisk");
          return {
            ...(optionalNumber(item.riskScore, "report.mlRisk.riskScore") === undefined ? {} : { riskScore: asNumber(item.riskScore, "report.mlRisk.riskScore") }),
            ...(optionalEnum(item.riskLabel, RISK_LEVELS, "report.mlRisk.riskLabel") === undefined ? {} : { riskLabel: asEnum(item.riskLabel, RISK_LEVELS, "report.mlRisk.riskLabel") }),
            ...(optionalString(item.modelVersion, "report.mlRisk.modelVersion") === undefined ? {} : { modelVersion: asString(item.modelVersion, "report.mlRisk.modelVersion") }),
          };
        })();
  let clinicalFacts: Record<string, Record<string, boolean>> | undefined;
  if (payload.clinicalFacts !== undefined) {
    const groups = asObject(payload.clinicalFacts, "report.clinicalFacts");
    clinicalFacts = Object.fromEntries(
      Object.entries(groups).map(([group, entries]) => {
        const facts = asObject(entries, `report.clinicalFacts.${group}`);
        return [
          group,
          Object.fromEntries(
            Object.entries(facts).map(([key, flag]) => [
              key,
              asBoolean(flag, `report.clinicalFacts.${group}.${key}`),
            ]),
          ),
        ];
      }),
    );
  }

  const parsed: AiServiceHealthReport = {
    classification,
    ...(clinicalReasoning === undefined ? {} : { clinicalReasoning }),
    ...(risk === undefined ? {} : { risk }),
    ...(mlRisk === undefined ? {} : { mlRisk }),
    ...(clinicalFacts === undefined ? {} : { clinicalFacts }),
    ...(optionalBoolean(payload.pipelineRan, "report.pipelineRan") === undefined
      ? {}
      : { pipelineRan: asBoolean(payload.pipelineRan, "report.pipelineRan") }),
  };
  return parsed;
}

export function toPublicLatestReportResponse(value: unknown): LatestReportResponse {
  const payload = asObject(value, "latest report response");
  const parsed: AiServiceLatestReportResponse = {
    report: payload.report === null ? null : toPublicReport(payload.report),
  };
  return parsed;
}

export function toPublicGenerateReportResponse(value: unknown): GenerateReportResponse {
  const payload = asObject(value, "generated report response");
  const parsed: AiServiceGenerateReportResponse = {
    report: toPublicReport(payload.report),
  };
  return parsed;
}

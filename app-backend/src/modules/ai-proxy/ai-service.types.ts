export type AiServiceIntentMode =
  | "personal_medical_qa"
  | "general_medical_qa"
  | "data_collection";

export interface AiServiceCreateConversationRequest {
  title?: string;
}

export interface AiServiceConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export type AiServiceInteractionRequest =
  | {
      type: "user_message";
      content: string;
      intent?: AiServiceIntentMode;
    }
  | {
      type: "action_response";
      actionId: string;
      decision: "accepted" | "rejected";
    };

export interface AiServicePendingAction {
  id: string;
  type: "confirm_health_data";
  status: "pending" | "accepted" | "rejected";
  summary: string;
  details?: { label: string; value: string }[];
}

export interface AiServiceChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  actions?: AiServicePendingAction[];
}

export interface AiServiceInteractionResponse {
  messages: AiServiceChatMessage[];
}

export type AiServiceBpSource = "HBPM" | "OBPM" | "ABPM";
export type AiServiceDayPeriod = "morning" | "afternoon" | "evening" | "night";
export type AiServicePositionType = "sitting" | "standing" | "lying";
export type AiServiceDeviceType = "upper_arm" | "wrist";

export interface AiServiceSaveBpRecordRequest {
  systolic: number;
  diastolic: number;
  source: AiServiceBpSource;
  dayPeriod: AiServiceDayPeriod;
  position: AiServicePositionType;
  restedMinutes: number | null;
  deviceType: AiServiceDeviceType;
  deviceValidated: boolean;
  measuredAt: string;
}

export interface AiServiceBpRecordResponse extends AiServiceSaveBpRecordRequest {
  id: string;
  warnings?: string[];
}

export interface AiServiceSaveRiskProfileRequest {
  riskFactors: string[];
  hmodItems: string[];
  cardiovascularDiseases: string[];
}

export interface AiServiceRiskProfileResponse extends AiServiceSaveRiskProfileRequest {
  warnings?: string[];
}

export interface AiServiceMeasurementQualityItem {
  source: string;
  qualityScore: number;
  qualityLevel: "high" | "medium" | "low";
  usable: boolean;
  flags: string[];
}

export interface AiServiceBpAverage {
  systolic: number | null;
  diastolic: number | null;
}

export interface AiServiceBpAverages {
  clinic?: AiServiceBpAverage;
  home?: AiServiceBpAverage;
  abpm?: AiServiceBpAverage;
}

export interface AiServiceReportClassification {
  bpCategory?: "normal" | "elevated" | "hypertension";
  bpStage?: string;
  phenotype?:
    | "sustained_hypertension"
    | "white_coat_hypertension"
    | "masked_hypertension"
    | "normal";
  sourceUsed?: string;
  confidence?: "high" | "medium" | "low";
  dataSource?: "live" | "stored";
  dataTimestamp?: string;
  averages?: AiServiceBpAverages;
  measurementQuality?: AiServiceMeasurementQualityItem[];
}

export interface AiServiceReportRiskAssessment {
  riskLevel?: "low" | "medium" | "moderate" | "high" | "very_high";
  recommendation?: string;
  explanation?: string;
  confidence?: "high" | "medium" | "low";
  dataSource?: "live" | "stored";
  dataTimestamp?: string;
}

export interface AiServiceReportMlRisk {
  riskScore?: number;
  riskLabel?: "low" | "medium" | "moderate" | "high" | "very_high";
  modelVersion?: string;
}

export interface AiServiceHealthReport {
  classification: AiServiceReportClassification;
  clinicalReasoning?: {
    explanation?: string;
    recommendation?: string;
    confidence?: "high" | "medium" | "low";
  } | null;
  risk?: AiServiceReportRiskAssessment | null;
  mlRisk?: AiServiceReportMlRisk | null;
  clinicalFacts?: Record<string, Record<string, boolean>>;
  pipelineRan?: boolean;
}

export interface AiServiceLatestReportResponse {
  report: AiServiceHealthReport | null;
}

export interface AiServiceGenerateReportResponse {
  report: AiServiceHealthReport;
}

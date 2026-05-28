export type IntentMode =
  | "auto"
  | "personal_medical_qa"
  | "general_medical_qa"
  | "data_collection";

export interface CreateConversationRequest {
  title?: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserMessageInteraction {
  type: "user_message";
  content: string;
  intent?: IntentMode;
}

export interface ActionResponseInteraction {
  type: "action_response";
  actionId: string;
  decision: "accepted" | "rejected";
}

export type SubmitInteractionRequest =
  | UserMessageInteraction
  | ActionResponseInteraction;

export interface PendingAction {
  id: string;
  type: "confirm_health_data";
  status: "pending" | "accepted" | "rejected";
  summary: string;
  details?: { label: string; value: string }[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  actions?: PendingAction[];
}

export interface SubmitInteractionResponse {
  messages: ChatMessage[];
}

export type BpSource = "HBPM" | "OBPM" | "ABPM";
export type DayPeriod = "morning" | "afternoon" | "evening" | "night";
export type PositionType = "sitting" | "standing" | "lying";
export type DeviceType = "upper_arm" | "wrist";

export interface SaveBpRecordRequest {
  systolic: number;
  diastolic: number;
  source: BpSource;
  dayPeriod: DayPeriod;
  position: PositionType;
  restedMinutes: number | null;
  deviceType: DeviceType;
  deviceValidated: boolean;
  measuredAt: string;
}

export interface BpRecord extends SaveBpRecordRequest {
  id: string;
  warnings?: string[];
}

export interface SaveRiskProfileRequest {
  riskFactors: string[];
  hmodItems: string[];
  cardiovascularDiseases: string[];
}

export interface RiskProfile extends SaveRiskProfileRequest {
  warnings?: string[];
}

export interface MeasurementQualityItem {
  source: string;
  qualityScore: number;
  qualityLevel: "high" | "medium" | "low";
  usable: boolean;
  flags: string[];
}

export interface BpAverage {
  systolic: number | null;
  diastolic: number | null;
}

export interface BpAverages {
  clinic?: BpAverage;
  home?: BpAverage;
  abpm?: BpAverage;
}

export interface ReportClassification {
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
  averages?: BpAverages;
  measurementQuality?: MeasurementQualityItem[];
}

export interface ReportRiskAssessment {
  riskLevel?: "low" | "medium" | "moderate" | "high" | "very_high";
  recommendation?: string;
  explanation?: string;
  confidence?: "high" | "medium" | "low";
  dataSource?: "live" | "stored";
  dataTimestamp?: string;
}

export interface ReportMlRisk {
  riskScore?: number;
  riskLabel?: "low" | "medium" | "moderate" | "high" | "very_high";
  modelVersion?: string;
}

export interface HealthReport {
  classification: ReportClassification;
  clinicalReasoning?: {
    explanation?: string;
    recommendation?: string;
    confidence?: "high" | "medium" | "low";
  } | null;
  risk?: ReportRiskAssessment | null;
  mlRisk?: ReportMlRisk | null;
  clinicalFacts?: Record<string, Record<string, boolean>>;
  pipelineRan?: boolean;
}

export interface LatestReportResponse {
  report: HealthReport | null;
}

export interface GenerateReportResponse {
  report: HealthReport;
}

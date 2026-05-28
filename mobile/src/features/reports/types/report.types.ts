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

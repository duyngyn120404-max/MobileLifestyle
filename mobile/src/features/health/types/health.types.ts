export type BpSource = "HBPM" | "OBPM" | "ABPM";
export type DayPeriod = "morning" | "afternoon" | "evening" | "night";
export type PositionType = "sitting" | "standing" | "lying";
export type DeviceType = "upper_arm" | "wrist";

export interface BpRecord {
  id: string;
  systolic: number;
  diastolic: number;
  source: BpSource;
  dayPeriod: DayPeriod;
  position: PositionType;
  restedMinutes: number | null;
  deviceType: DeviceType;
  deviceValidated: boolean;
  measuredAt: string;
  warnings?: string[];
}

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

export interface BpRecordFormValues {
  systolic: string;
  diastolic: string;
  source: BpSource;
  dayPeriod: DayPeriod;
  position: PositionType;
  restedMinutes: string;
  deviceType: DeviceType;
  deviceValidated: boolean;
  measuredAt: string;
}

export interface RiskProfile {
  riskFactors: string[];
  hmodItems: string[];
  cardiovascularDiseases: string[];
  warnings?: string[];
}

export type SaveRiskProfileRequest = Pick<
  RiskProfile,
  "riskFactors" | "hmodItems" | "cardiovascularDiseases"
>;

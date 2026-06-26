export type BpSource = "HBPM" | "OBPM" | "ABPM";
export type DayPeriod = "morning" | "afternoon" | "evening" | "night";
export type PositionType = "sitting" | "standing" | "lying";
export type DeviceType = "upper_arm" | "wrist";

export interface SaveBpReadingRequest {
  systolic: number;
  diastolic: number;
}

export interface BpReading extends SaveBpReadingRequest {
  id?: string | null;
  order: number;
}

export interface SaveMeasurementSessionRequest {
  measuredAt: string;
  source: BpSource;
  position: PositionType;
  restedMinutes: number | null;
  deviceType: DeviceType;
  deviceName: string | null;
  deviceValidated: boolean;
  readings: SaveBpReadingRequest[];
}

export interface MeasurementSession {
  id: string;
  measuredAt: string;
  measuredDate: string;
  dayPeriod: DayPeriod | string;
  source: BpSource | string | null;
  position: PositionType | string | null;
  restedMinutes: number | null;
  deviceType: DeviceType | string | null;
  deviceName: string | null;
  deviceValidated: boolean | null;
  readings: BpReading[];
  warnings?: string[];
}

export interface MeasurementSessionFormValues {
  reading1Systolic: string;
  reading1Diastolic: string;
  reading2Systolic: string;
  reading2Diastolic: string;
  source: BpSource;
  position: PositionType;
  restedMinutes: string;
  deviceType: DeviceType;
  deviceName: string;
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

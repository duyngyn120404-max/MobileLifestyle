import {
  homeHealthRepository,
  type BpRecord,
  type ClinicalFact,
} from '@/src/repositories/home-health.repository';
import type {
  BpRecordInsert,
  ClinicalFactInsert,
  HealthDataSource,
} from '@/src/config/supabaseApi';

export type BpSource = 'HBPM' | 'OBPM' | 'ABPM';
export type DayPeriod = 'morning' | 'evening' | 'day' | 'night';
export type PositionType = 'sitting' | 'standing' | 'lying';
export type DeviceType = 'upper_arm' | 'wrist';

export interface HomeHealthFormInput {
  userId: string;
  systolic: string;
  diastolic: string;
  bpSource: BpSource;
  dayPeriod: DayPeriod;
  position: PositionType;
  restedMinutes: string;
  deviceType: DeviceType;
  deviceValidated: boolean;
  measuredAt: string;
  riskFactors: string[];
  hmodItems: string[];
  cardiovascularDiseases: string[];
  symptoms: string[];
  medications: string[];
  source: HealthDataSource | string;
}

const FACT_GROUPS = [
  'risk_factors',
  'hmod',
  'cardiovascular_disease',
  'symptoms',
  'medications',
] as const;

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

function toIsoOrNow(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return new Date().toISOString();
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

export const homeHealthService = {
  getSeverityFromBp(systolic: number, diastolic: number): string {
    if (systolic > 180 || diastolic > 120) return 'crisis';
    if (systolic >= 140 || diastolic >= 90) return 'stage_2';
    if (systolic >= 130 || diastolic >= 80) return 'stage_1';
    if (systolic >= 120 && diastolic < 80) return 'elevated';
    if (systolic < 90 || diastolic < 60) return 'low';
    return 'normal';
  },

  validateInput(input: HomeHealthFormInput): string | null {
    if (!input.systolic.trim() || !input.diastolic.trim()) {
      return 'Vui lòng nhập đầy đủ huyết áp tâm thu và tâm trương';
    }

    const systolic = Number(input.systolic);
    const diastolic = Number(input.diastolic);

    if (Number.isNaN(systolic) || Number.isNaN(diastolic)) {
      return 'Giá trị huyết áp phải là số hợp lệ';
    }

    if (systolic < 40 || systolic > 300) {
      return 'Huyết áp tâm thu nằm ngoài khoảng hợp lý';
    }

    if (diastolic < 30 || diastolic > 200) {
      return 'Huyết áp tâm trương nằm ngoài khoảng hợp lý';
    }

    return null;
  },

  buildBpRecord(input: HomeHealthFormInput): BpRecordInsert {
    const systolic = Number(input.systolic);
    const diastolic = Number(input.diastolic);

    return {
      user_id: input.userId,
      systolic,
      diastolic,
      source: input.bpSource,
      day_period: input.dayPeriod,
      position: input.position,
      rested_minutes: parseOptionalNumber(input.restedMinutes),
      device_type: input.deviceType,
      device_validated: input.deviceValidated,
      status: 'accepted',
      severity: this.getSeverityFromBp(systolic, diastolic),
      created_at: toIsoOrNow(input.measuredAt),
    };
  },

  buildClinicalFacts(input: HomeHealthFormInput): ClinicalFactInsert[] {
    const rows: ClinicalFactInsert[] = [];
    const now = new Date().toISOString();

    uniqueStrings(input.riskFactors).forEach((factKey) => {
      rows.push({
        user_id: input.userId,
        fact_group: 'risk_factors',
        fact_key: factKey,
        value: true,
        status: 'accepted',
        severity: null,
        source: input.source,
        updated_at: now,
      });
    });

    uniqueStrings(input.hmodItems).forEach((factKey) => {
      rows.push({
        user_id: input.userId,
        fact_group: 'hmod',
        fact_key: factKey,
        value: true,
        status: 'accepted',
        severity: null,
        source: input.source,
        updated_at: now,
      });
    });

    uniqueStrings(input.cardiovascularDiseases).forEach((factKey) => {
      rows.push({
        user_id: input.userId,
        fact_group: 'cardiovascular_disease',
        fact_key: factKey,
        value: true,
        status: 'accepted',
        severity: null,
        source: input.source,
        updated_at: now,
      });
    });

    uniqueStrings(input.symptoms).forEach((factKey) => {
      rows.push({
        user_id: input.userId,
        fact_group: 'symptoms',
        fact_key: factKey,
        value: true,
        status: 'accepted',
        severity: null,
        source: input.source,
        updated_at: now,
      });
    });

    uniqueStrings(input.medications).forEach((factKey) => {
      rows.push({
        user_id: input.userId,
        fact_group: 'medications',
        fact_key: factKey,
        value: true,
        status: 'accepted',
        severity: null,
        source: input.source,
        updated_at: now,
      });
    });

    return rows;
  },

  async submitSimpleForm(input: HomeHealthFormInput): Promise<{
    bpRecords: BpRecord[];
    clinicalFacts: ClinicalFact[];
  }> {
    const validationError = this.validateInput(input);
    if (validationError) {
      throw new Error(validationError);
    }

    const bpRecord = this.buildBpRecord(input);
    const clinicalFacts = this.buildClinicalFacts(input);

    const bpResult = await homeHealthRepository.createBpRecords([bpRecord]);
    if (bpResult.error) throw bpResult.error;

    const factsResult = await homeHealthRepository.replaceClinicalFacts({
      userId: input.userId,
      groups: [...FACT_GROUPS],
      facts: clinicalFacts,
    });
    if (factsResult.error) throw factsResult.error;

    return {
      bpRecords: bpResult.data ?? [],
      clinicalFacts: factsResult.data ?? [],
    };
  },
};
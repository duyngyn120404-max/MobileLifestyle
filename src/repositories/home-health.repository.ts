import {
  supabaseHealthApi,
  type BpRecordInsert,
  type ClinicalFactInsert,
} from "@/src/config/supabaseApi";

export interface BpRecord {
  id: string;
  user_id: string;
  systolic: number;
  diastolic: number;
  source: string;
  day_period: string | null;
  position: string | null;
  rested_minutes: number | null;
  device_type: string | null;
  device_validated: boolean | null;
  status: string;
  severity: string | null;
  created_at: string;
}

export interface ClinicalFact {
  id: string;
  user_id: string;
  fact_group: string;
  fact_key: string;
  value: boolean | string | number;
  status: string;
  severity: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface ReplaceClinicalFactsParams {
  userId: string;
  groups: string[];
  facts: ClinicalFactInsert[];
}

export const homeHealthRepository = {
  async createBpRecords(
    records: BpRecordInsert[],
  ): Promise<{ data: BpRecord[] | null; error: unknown }> {
    try {
      const { data, error } = await supabaseHealthApi.createBpRecords(records);
      if (error) throw error;
      return { data: (data ?? []) as BpRecord[], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async findBpRecordsByUserId(
    userId: string,
    days: number = 30,
  ): Promise<{ data: BpRecord[] | null; error: unknown }> {
    try {
      const { data, error } = await supabaseHealthApi.findBpRecordsByUserId(
        userId,
        days,
      );
      if (error) throw error;
      return { data: (data ?? []) as BpRecord[], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async insertClinicalFacts(
    facts: ClinicalFactInsert[],
  ): Promise<{ data: ClinicalFact[] | null; error: unknown }> {
    try {
      if (!facts.length) {
        return { data: [], error: null };
      }

      const { data, error } =
        await supabaseHealthApi.insertClinicalFacts(facts);
      if (error) throw error;
      return { data: (data ?? []) as ClinicalFact[], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async deleteClinicalFactsByGroups(
    userId: string,
    groups: string[],
  ): Promise<{ error: unknown }> {
    try {
      const { error } = await supabaseHealthApi.deleteClinicalFactsByGroups(
        userId,
        groups,
      );
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  async replaceClinicalFacts(
    params: ReplaceClinicalFactsParams,
  ): Promise<{ data: ClinicalFact[] | null; error: unknown }> {
    try {
      const { data, error } =
        await supabaseHealthApi.replaceClinicalFactsByGroups(params);
      if (error) throw error;
      return { data: (data ?? []) as ClinicalFact[], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async findClinicalFactsByUserId(
    userId: string,
    groups?: string[],
  ): Promise<{ data: ClinicalFact[] | null; error: unknown }> {
    try {
      const { data, error } = await supabaseHealthApi.findClinicalFactsByUserId(
        userId,
        groups,
      );
      if (error) throw error;
      return { data: (data ?? []) as ClinicalFact[], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};

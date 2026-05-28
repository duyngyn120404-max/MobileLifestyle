import { supabaseHealthApi } from '@/src/config/supabaseApi';

export interface HealthRecord {
  id: string;
  user_id: string;
  disease_id: string;
  disease_name: string;
  value1: number;
  value2?: number;
  value3?: number;
  value4?: number;
  unit1: string;
  unit2?: string;
  unit3?: string;
  unit4?: string;
  notes?: string;
  record_date: string;
  created_at: string;
}

export type CreateHealthRecord = Omit<HealthRecord, 'id' | 'created_at'>;

export const healthRepository = {
  async findByUserId(userId: string, days: number = 30): Promise<{ data: HealthRecord[] | null; error: unknown }> {
    try {
      const { data, error } = await supabaseHealthApi.findByUserId(userId, days);
      if (error) throw error;
      return { data: data as HealthRecord[], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async create(record: CreateHealthRecord): Promise<{ data: HealthRecord | null; error: unknown }> {
    try {
      const { data, error } = await supabaseHealthApi.create(record);
      if (error) throw error;
      return { data: data?.[0] as HealthRecord, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async delete(recordId: string): Promise<{ error: unknown }> {
    try {
      const { error } = await supabaseHealthApi.delete(recordId);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },
};

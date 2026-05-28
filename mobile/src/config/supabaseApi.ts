import type { CreateHealthRecord } from "@/src/repositories/health.repository";
import { supabase, TABLES } from "@/src/config/supabase";

export type HealthDataSource =
  | "user"
  | "assistant"
  | "system"
  | "device"
  | "import";

export type BpRecordInsert = {
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
  created_at?: string;
};

export type BpRecordUpdate = Partial<
  Omit<BpRecordInsert, "user_id" | "created_at">
>;

export type ClinicalFactInsert = {
  user_id: string;
  fact_group: string;
  fact_key: string;
  value: boolean | string | number;
  status: string;
  source: HealthDataSource | string;
  updated_at?: string;
};

export type ReplaceClinicalFactsInput = {
  userId: string;
  groups: string[];
  facts: ClinicalFactInsert[];
};

export type BpRecordDateRangeInput = {
  userId: string;
  fromDate?: string | null;
  toDate?: string | null;
};

export const HEALTH_RISK_GROUPS = [
  "risk_factors",
  "hmod",
  "cardiovascular_disease",
] as const;

// ============================================================================
// HEALTH
// ============================================================================

export const supabaseHealthApi = {
  findByUserId(userId: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return supabase
      .from(TABLES.BP_RECORDS)
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });
  },

  create(record: CreateHealthRecord) {
    return supabase.from(TABLES.BP_RECORDS).insert([record]).select();
  },

  delete(recordId: string) {
    return supabase.from(TABLES.BP_RECORDS).delete().eq("id", recordId);
  },

  createBpRecord(record: BpRecordInsert) {
    return supabase.from(TABLES.BP_RECORDS).insert([record]).select();
  },

  createBpRecords(records: BpRecordInsert[]) {
    return supabase.from(TABLES.BP_RECORDS).insert(records).select();
  },

  updateBpRecord(recordId: string, payload: BpRecordUpdate) {
    return supabase
      .from(TABLES.BP_RECORDS)
      .update(payload)
      .eq("id", recordId)
      .select();
  },

  findBpRecordsByUserId(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return supabase
      .from(TABLES.BP_RECORDS)
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });
  },

  findBpRecordsByDateRange(input: BpRecordDateRangeInput) {
    let query = supabase
      .from(TABLES.BP_RECORDS)
      .select("*")
      .eq("user_id", input.userId)
      .order("created_at", { ascending: false });

    if (input.fromDate) {
      query = query.gte("created_at", input.fromDate);
    }

    if (input.toDate) {
      query = query.lte("created_at", input.toDate);
    }

    return query;
  },

  findBpRecordById(recordId: string) {
    return supabase
      .from(TABLES.BP_RECORDS)
      .select("*")
      .eq("id", recordId)
      .single();
  },

  deleteBpRecord(recordId: string) {
    return supabase.from(TABLES.BP_RECORDS).delete().eq("id", recordId);
  },

  deleteClinicalFactsByGroups(userId: string, groups: string[]) {
    return supabase
      .from(TABLES.CLINICAL_FACTS)
      .delete()
      .eq("user_id", userId)
      .in("fact_group", groups);
  },

  insertClinicalFacts(facts: ClinicalFactInsert[]) {
    return supabase.from(TABLES.CLINICAL_FACTS).insert(facts).select();
  },

  findClinicalFactsByUserId(userId: string, groups?: string[]) {
    let query = supabase
      .from(TABLES.CLINICAL_FACTS)
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (groups?.length) {
      query = query.in("fact_group", groups);
    }

    return query;
  },

  async replaceClinicalFactsByGroups(input: ReplaceClinicalFactsInput) {
    const { userId, groups, facts } = input;

    const deleteResult = await supabase
      .from(TABLES.CLINICAL_FACTS)
      .delete()
      .eq("user_id", userId)
      .in("fact_group", groups);

    if (deleteResult.error) {
      return { data: null, error: deleteResult.error };
    }

    if (!facts.length) {
      return { data: [], error: null };
    }

    return supabase.from(TABLES.CLINICAL_FACTS).insert(facts).select();
  },
};
// ============================================================================
// CHAT
// ============================================================================

export const supabaseChatApi = {
  findSessionsByUserId(userId: string) {
    return supabase
      .from(TABLES.CONVERSATIONS)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
  },

  createSession(userId: string, title: string) {
    return supabase
      .from(TABLES.CONVERSATIONS)
      .insert([{ user_id: userId, title: title || "New Conversation" }])
      .select();
  },

  findMessagesBySessionId(conversationId: string) {
    return supabase
      .from(TABLES.MESSAGES)
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
  },

  saveMessage(
    conversationId: string,
    role: "user" | "assistant" | "system",
    content: string,
  ) {
    return supabase
      .from(TABLES.MESSAGES)
      .insert([{ conversation_id: conversationId, role, content }])
      .select();
  },
};

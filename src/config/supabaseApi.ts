// import { supabase, TABLES } from '@/src/services/supabase';
// import type { HealthRecord, CreateHealthRecord } from '@/src/repositories/health.repository';
// import type { ChatSessionRecord, ChatMessageRecord } from '@/src/repositories/chat.repository';
// import type { UserProfile, UpdateUserProfile } from '@/src/repositories/user.repository';

// // ============================================================================
// // HEALTH
// // ============================================================================

// export const supabaseHealthApi = {
//   findByUserId(userId: string, days: number) {
//     const startDate = new Date();
//     startDate.setDate(startDate.getDate() - days);

//     return supabase
//       .from(TABLES.BP_RECORDS)
//       .select('*')
//       .eq('user_id', userId)
//       .gte('record_date', startDate.toISOString())
//       .order('record_date', { ascending: false });
//   },

//   create(record: CreateHealthRecord) {
//     return supabase
//       .from(TABLES.BP_RECORDS)
//       .insert([record])
//       .select();
//   },

//   delete(recordId: string) {
//     return supabase
//       .from(TABLES.BP_RECORDS)
//       .delete()
//       .eq('id', recordId);
//   },
// };

// // ============================================================================
// // CHAT
// // ============================================================================

// export const supabaseChatApi = {
//   findSessionsByUserId(userId: string) {
//     return supabase
//       .from(TABLES.CONVERSATIONS)
//       .select('*')
//       .eq('user_id', userId)
//       .order('created_at', { ascending: false });
//   },

//   createSession(userId: string, title: string) {
//     return supabase
//       .from(TABLES.CONVERSATIONS)
//       .insert([{ user_id: userId, title: title || 'New Conversation' }])
//       .select();
//   },

//   findMessagesBySessionId(conversationId: string) {
//     return supabase
//       .from(TABLES.MESSAGES)
//       .select('*')
//       .eq('conversation_id', conversationId)
//       .order('created_at', { ascending: true });
//   },

//   saveMessage(conversationId: string, role: 'user' | 'assistant' | 'system', content: string) {
//     return supabase
//       .from(TABLES.MESSAGES)
//       .insert([{ conversation_id: conversationId, role, content }])
//       .select();
//   },
// };

// // ============================================================================
// // USER
// // ============================================================================

// export const supabaseUserApi = {
//   create(userId: string, email: string, fullName?: string) {
//     return supabase
//       .from(TABLES.USERS)
//       .insert([{ id: userId, email, full_name: fullName || email }])
//       .select();
//   },

//   update(userId: string, updates: Partial<UpdateUserProfile>) {
//     return supabase
//       .from(TABLES.USERS)
//       .update(updates)
//       .eq('id', userId)
//       .select();
//   },
// };

import type { CreateHealthRecord } from "@/src/repositories/health.repository";
import type { UpdateUserProfile } from "@/src/repositories/user.repository";
import { supabase, TABLES } from "@/src/services/supabase";

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
  severity: string | null;
  created_at?: string;
};

export type ClinicalFactInsert = {
  user_id: string;
  fact_group: string;
  fact_key: string;
  value: boolean | string | number;
  status: string;
  severity: string | null;
  source: HealthDataSource | string;
  updated_at?: string;
};

export type ReplaceClinicalFactsInput = {
  userId: string;
  groups: string[];
  facts: ClinicalFactInsert[];
};

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

  createBpRecords(records: BpRecordInsert[]) {
    return supabase.from(TABLES.BP_RECORDS).insert(records).select();
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

// ============================================================================
// USER
// ============================================================================

export const supabaseUserApi = {
  create(userId: string, email: string, fullName?: string) {
    return supabase
      .from(TABLES.USERS)
      .insert([{ id: userId, email, full_name: fullName || email }])
      .select();
  },

  update(userId: string, updates: Partial<UpdateUserProfile>) {
    return supabase
      .from(TABLES.USERS)
      .update(updates)
      .eq("id", userId)
      .select();
  },
};

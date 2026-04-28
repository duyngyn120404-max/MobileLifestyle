import { supabase, TABLES } from '@/src/services/supabase';
import type { HealthRecord, CreateHealthRecord } from '@/src/repositories/health.repository';
import type { ChatSessionRecord, ChatMessageRecord } from '@/src/repositories/chat.repository';
import type { UserProfile, UpdateUserProfile } from '@/src/repositories/user.repository';

// ============================================================================
// HEALTH
// ============================================================================

export const supabaseHealthApi = {
  findByUserId(userId: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return supabase
      .from(TABLES.BP_RECORDS)
      .select('*')
      .eq('user_id', userId)
      .gte('record_date', startDate.toISOString())
      .order('record_date', { ascending: false });
  },

  create(record: CreateHealthRecord) {
    return supabase
      .from(TABLES.BP_RECORDS)
      .insert([record])
      .select();
  },

  delete(recordId: string) {
    return supabase
      .from(TABLES.BP_RECORDS)
      .delete()
      .eq('id', recordId);
  },
};

// ============================================================================
// CHAT
// ============================================================================

export const supabaseChatApi = {
  findSessionsByUserId(userId: string) {
    return supabase
      .from(TABLES.CONVERSATIONS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  },

  createSession(userId: string, title: string) {
    return supabase
      .from(TABLES.CONVERSATIONS)
      .insert([{ user_id: userId, title: title || 'New Conversation' }])
      .select();
  },

  findMessagesBySessionId(conversationId: string) {
    return supabase
      .from(TABLES.MESSAGES)
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
  },

  saveMessage(conversationId: string, role: 'user' | 'assistant' | 'system', content: string) {
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
      .eq('id', userId)
      .select();
  },
};

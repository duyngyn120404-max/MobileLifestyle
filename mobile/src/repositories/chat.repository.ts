import { supabaseChatApi } from '@/src/config/supabaseApi';

export interface ChatSessionRecord {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export interface ChatMessageRecord {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export const chatRepository = {
  async findSessionsByUserId(userId: string): Promise<{ data: ChatSessionRecord[] | null; error: unknown }> {
    try {
      const { data, error } = await supabaseChatApi.findSessionsByUserId(userId);
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async createSession(userId: string, title: string): Promise<{ data: ChatSessionRecord | null; error: unknown }> {
    try {
      const { data, error } = await supabaseChatApi.createSession(userId, title);
      if (error) throw error;
      return { data: data?.[0] as ChatSessionRecord, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async findMessagesBySessionId(conversationId: string): Promise<{ data: ChatMessageRecord[] | null; error: unknown }> {
    try {
      const { data, error } = await supabaseChatApi.findMessagesBySessionId(conversationId);
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async saveMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string
  ): Promise<{ data: ChatMessageRecord | null; error: unknown }> {
    try {
      const { data, error } = await supabaseChatApi.saveMessage(conversationId, role, content);
      if (error) throw error;
      return { data: data?.[0] as ChatMessageRecord, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};

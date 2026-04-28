import { API_BASE_URL, API_ROUTES } from './api';
import { supabase } from '@/src/services/supabase';

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return { Authorization: `Bearer ${session.access_token}` };
}

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
  withAuth = true
): Promise<T> {
  const authHeaders = withAuth ? await getAuthHeader() : {};
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...DEFAULT_HEADERS, ...authHeaders, ...options.headers },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`[${response.status}] ${path}: ${errorText}`);
  }

  return response.json() as Promise<T>;
}

// ── Conversation types ─────────────────────────────────────────────────────

export interface ConversationRecord {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface SendMessageResponse {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  ingestion_result?: IngestionResult;
}

export interface IngestionResult {
  severity: string;
  requires_review: boolean;
  requires_immediate_confirmation: boolean;
  inserted: {
    bp_records: string[];
    clinical_facts: string[];
  };
  extraction?: Record<string, unknown>;
}

// ── API client ─────────────────────────────────────────────────────────────

export const apiClient = {
  // Conversations
  async listConversations(): Promise<ConversationRecord[]> {
    return request(API_ROUTES.CONVERSATIONS);
  },

  async createConversation(title: string): Promise<ConversationRecord> {
    return request(API_ROUTES.CONVERSATIONS, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  async getConversation(id: string): Promise<ConversationRecord> {
    return request(API_ROUTES.CONVERSATION(id));
  },

  async updateConversation(id: string, title: string): Promise<ConversationRecord> {
    return request(API_ROUTES.CONVERSATION(id), {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  },

  async deleteConversation(id: string): Promise<void> {
    return request(API_ROUTES.CONVERSATION(id), { method: 'DELETE' });
  },

  // Messages
  async getMessages(conversationId: string): Promise<MessageRecord[]> {
    return request(API_ROUTES.MESSAGES(conversationId));
  },

  async sendMessage(
    conversationId: string,
    content: string,
    intent?: string
  ): Promise<SendMessageResponse> {
    const body: Record<string, string> = { content };
    if (intent && intent !== 'auto') body.intent = intent;
    return request(API_ROUTES.MESSAGES(conversationId), {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Ingest review
  async reviewRecord(
    table: 'bp_records' | 'clinical_facts',
    recordId: string,
    decision: 'accepted' | 'rejected'
  ): Promise<{ updated: boolean }> {
    return request(API_ROUTES.INGEST_REVIEW, {
      method: 'PATCH',
      body: JSON.stringify({ table, record_id: recordId, decision }),
    });
  },
};

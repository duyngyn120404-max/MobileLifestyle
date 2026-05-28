import { API_BASE_URL, API_ROUTES } from './api';
import { supabase } from '@/src/config/supabase';

async function getAuthHeader(): Promise<Record<string, string>> {
  console.log('[apiClient] getAuthHeader called');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('[apiClient] getSession session:', session?.user?.id ?? null, 'error:', error);
    if (!session?.access_token) throw new Error('Not authenticated');
    return { Authorization: `Bearer ${session.access_token}` };
  } catch (e) {
    console.log('[apiClient] getAuthHeader exception:', e);
    throw e;
  }
}

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
};

async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
  withAuth = true
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  console.log('[apiClient] request', options.method ?? 'GET', url);
  const authHeaders = withAuth ? await getAuthHeader() : {};
  const response = await fetch(url, {
    ...options,
    headers: { ...DEFAULT_HEADERS, ...authHeaders, ...options.headers },
  });

  console.log('[apiClient] response status:', response.status, url);
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

export interface BPReading {
  systolic: number;
  diastolic: number;
  source?: string;
  day_period?: string;
}

export interface BPRecordRequest {
  user_id: string;
  systolic: number;
  diastolic: number;
  source?: 'HBPM' | 'OBPM' | 'ABPM';
  position?: 'sitting' | 'standing' | 'lying';
  day_period?: 'morning' | 'afternoon' | 'evening' | 'night';
  rested_minutes?: number;
  device_type?: 'upper_arm' | 'wrist';
  device_validated?: boolean;
  measured_at?: string;
  patient_info?: { age?: number; gender?: 'male' | 'female' };
  risk_factors?: Record<string, boolean>;
  hmod?: Record<string, boolean>;
  cardiovascular_disease?: Record<string, boolean>;
  symptoms?: string[];
}

export interface BPRecordResponse {
  status: 'accepted' | 'pending';
  record_id: string;
  safety: { is_valid: boolean; flags: string[] };
}

export interface ClinicalFactRecord {
  id: string;
  fact_key: string;
}

export interface IngestionResult {
  status: 'accepted' | 'pending' | 'needs_clarification';
  needs_clarification: boolean;
  clarification_questions: string[];
  inserted: {
    bp_records: string[];
    clinical_facts: ClinicalFactRecord[];
  };
  extraction?: {
    bp_readings?: BPReading[];
    risk_factors?: Record<string, boolean>;
    [key: string]: unknown;
  };
  safety?: {
    is_valid: boolean;
    flags: string[];
  };
}

export interface DiffField {
  from?: unknown;
  to?: unknown;
  direction?: string;
  delta?: number;
}

export interface AssessmentDiff {
  overall_direction?: string;
  classification?: Record<string, DiffField>;
  ml_risk?: Record<string, DiffField>;
  quality?: Record<string, unknown>;
  stage2_risk?: Record<string, DiffField>;
}

export interface AssessmentSession {
  classification?: Record<string, unknown>;
  measurement_evaluations?: unknown[];
  clinical_reasoning?: unknown;
  risk_assessment?: unknown;
  ml_risk?: { risk_score?: number; risk_label?: string } | null;
}

export interface AssessmentComparisonResponse {
  session_a: AssessmentSession;
  session_b: AssessmentSession;
  diff: AssessmentDiff;
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

  // Transcribe (audio → text)
  async transcribe(audio: string, format: string): Promise<{ text?: string; transcription?: string }> {
    return request('/transcribe', {
      method: 'POST',
      body: JSON.stringify({ audio, format }),
    }, false);
  },

  async getAssessmentComparison(sessionAId?: string, sessionBId?: string): Promise<AssessmentComparisonResponse> {
    const params = new URLSearchParams();
    if (sessionAId) params.set('session_a_id', sessionAId);
    if (sessionBId) params.set('session_b_id', sessionBId);
    const query = params.toString();
    return request(`${API_ROUTES.ASSESSMENT_COMPARISON}${query ? `?${query}` : ''}`);
  },

  // Ingest BP form
  async ingestBP(data: BPRecordRequest): Promise<BPRecordResponse> {
    return request(API_ROUTES.INGEST_BP, {
      method: 'POST',
      body: JSON.stringify(data),
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

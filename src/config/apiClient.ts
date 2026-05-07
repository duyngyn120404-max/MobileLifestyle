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

export interface BPReading {
  systolic: number;
  diastolic: number;
  source?: string;
  day_period?: string;
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

// ── Healthcare report types ────────────────────────────────────────────────

export interface MeasurementQualityItem {
  source: string;
  quality_score: number;
  quality_level: string;
  usable: boolean;
  flags: string[];
}

export interface BpAverages {
  clinic?: { sys?: number | null; dia?: number | null };
  home?: { sys?: number | null; dia?: number | null };
  abpm?: { sys?: number | null; dia?: number | null };
}

export interface HealthcareReport {
  user_id: string;
  classification: {
    bp_category?: string;
    bp_stage?: string;
    phenotype?: string;
    source_used?: string;
    confidence?: string;
    data_source?: string;
    data_timestamp?: string;
    averages?: BpAverages;
    measurement_quality?: MeasurementQualityItem[];
    [key: string]: unknown;
  };
  clinical_reasoning?: { explanation?: string; recommendation?: string; confidence?: string } | null;
  risk?: {
    risk_level?: string;
    recommendation?: string;
    explanation?: string;
    confidence?: string;
    data_source?: string;
    data_timestamp?: string;
  } | null;
  ml_risk?: { risk_score?: number; risk_label?: string; model_version?: string } | null;
  clinical_facts?: Record<string, Record<string, boolean>>;
  pipeline_ran?: boolean;
}

export interface LatestReportResponse {
  report: HealthcareReport | null;
}

export interface GenerateReportResponse {
  report: HealthcareReport;
  pipeline_ran: boolean;
}

export interface AskReportResponse {
  answer: string;
  report: HealthcareReport;
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

  // Healthcare report
  async getLatestReport(): Promise<LatestReportResponse> {
    return request(API_ROUTES.HEALTHCARE_REPORT);
  },

  async generateReport(): Promise<GenerateReportResponse> {
    return request(API_ROUTES.GENERATE_HEALTHCARE_REPORT, {
      method: 'POST',
      body: JSON.stringify({ readings: [] }),
    });
  },

  async getAssessmentComparison(sessionAId?: string, sessionBId?: string): Promise<AssessmentComparisonResponse> {
    const params = new URLSearchParams();
    if (sessionAId) params.set('session_a_id', sessionAId);
    if (sessionBId) params.set('session_b_id', sessionBId);
    const query = params.toString();
    return request(`${API_ROUTES.ASSESSMENT_COMPARISON}${query ? `?${query}` : ''}`);
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

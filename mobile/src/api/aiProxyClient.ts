import { apiClient } from "@/src/api/apiClient";
import { API_ROUTES } from "@/src/config/apiRoutes";
import type {
  ChatMessageDto,
  ConversationSummary,
  SubmitInteractionRequest,
  SubmitInteractionResponse,
} from "@/src/features/chatbot/types/chatbot.types";
import type {
  BpRecord,
  MeasurementSession,
  RiskProfile,
  SaveBpRecordRequest,
  SaveMeasurementSessionRequest,
  SaveRiskProfileRequest,
} from "@/src/features/health/types/health.types";
import type {
  GenerateReportResponse,
  LatestReportResponse,
  ReportsListResponse,
} from "@/src/features/reports/types/report.types";

export const aiProxyClient = {
  listConversations() {
    return apiClient.get<ConversationSummary[]>(API_ROUTES.ai.conversations);
  },

  createConversation(payload: { title?: string }) {
    return apiClient.post<ConversationSummary>(API_ROUTES.ai.conversations, payload);
  },

  deleteConversation(conversationId: string) {
    return apiClient.delete<{ deleted: true }>(API_ROUTES.ai.conversation(conversationId));
  },

  listMessages(conversationId: string) {
    return apiClient.get<ChatMessageDto[]>(API_ROUTES.ai.messages(conversationId));
  },

  submitInteraction(conversationId: string, payload: SubmitInteractionRequest) {
    return apiClient.post<SubmitInteractionResponse>(
      API_ROUTES.ai.interactions(conversationId),
      payload,
    );
  },

  listBpRecords(filters: { fromDate?: string | null; toDate?: string | null } = {}) {
    const query = new URLSearchParams();
    if (filters.fromDate) query.set("fromDate", filters.fromDate);
    if (filters.toDate) query.set("toDate", filters.toDate);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiClient.get<BpRecord[]>(`${API_ROUTES.ai.bpRecords}${suffix}`);
  },

  getBpRecord(recordId: string) {
    return apiClient.get<BpRecord>(API_ROUTES.ai.bpRecord(recordId));
  },

  createBpRecord(payload: SaveBpRecordRequest) {
    return apiClient.post<BpRecord>(API_ROUTES.ai.bpRecords, payload);
  },

  updateBpRecord(recordId: string, payload: SaveBpRecordRequest) {
    return apiClient.patch<BpRecord>(API_ROUTES.ai.bpRecord(recordId), payload);
  },

  deleteBpRecord(recordId: string) {
    return apiClient.delete<{ deleted: true }>(API_ROUTES.ai.bpRecord(recordId));
  },


  listMeasurementSessions(filters: { fromDate?: string | null; toDate?: string | null } = {}) {
    const query = new URLSearchParams();
    if (filters.fromDate) query.set("fromDate", filters.fromDate);
    if (filters.toDate) query.set("toDate", filters.toDate);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiClient.get<MeasurementSession[]>(`${API_ROUTES.ai.measurementSessions}${suffix}`);
  },

  getMeasurementSession(sessionId: string) {
    return apiClient.get<MeasurementSession>(API_ROUTES.ai.measurementSession(sessionId));
  },

  createMeasurementSession(payload: SaveMeasurementSessionRequest) {
    return apiClient.post<MeasurementSession>(API_ROUTES.ai.measurementSessions, payload);
  },

  updateMeasurementSession(sessionId: string, payload: SaveMeasurementSessionRequest) {
    return apiClient.patch<MeasurementSession>(API_ROUTES.ai.measurementSession(sessionId), payload);
  },

  deleteMeasurementSession(sessionId: string) {
    return apiClient.delete<{ deleted: true }>(API_ROUTES.ai.measurementSession(sessionId));
  },

  getRiskProfile() {
    return apiClient.get<RiskProfile>(API_ROUTES.ai.riskProfile);
  },

  saveRiskProfile(payload: SaveRiskProfileRequest) {
    return apiClient.put<RiskProfile>(API_ROUTES.ai.riskProfile, payload);
  },

  getLatestReport() {
    return apiClient.get<LatestReportResponse>(API_ROUTES.ai.latestReport);
  },

  listReports(filters: { fromDate?: string | null; toDate?: string | null } = {}) {
    const query = new URLSearchParams();
    if (filters.fromDate) query.set("fromDate", filters.fromDate);
    if (filters.toDate) query.set("toDate", filters.toDate);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiClient.get<ReportsListResponse>(`${API_ROUTES.ai.reports}${suffix}`);
  },

  generateReport() {
    return apiClient.post<GenerateReportResponse>(API_ROUTES.ai.reports);
  },
};

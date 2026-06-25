import {
  toAiServiceBpRecordRequest,
  toAiServiceCreateConversationRequest,
  toAiServiceInteractionRequest,
  toAiServiceMeasurementSessionRequest,
  toAiServiceRiskProfileRequest,
  toPublicBpRecord,
  toPublicBpRecordList,
  toPublicConversationList,
  toPublicConversationSummary,
  toPublicGenerateReportResponse,
  toPublicInteractionResponse,
  toPublicLatestReportResponse,
  toPublicReportsListResponse,
  toPublicMeasurementSession,
  toPublicMeasurementSessionList,
  toPublicMessageList,
  toPublicRiskProfile,
} from "./ai-proxy.mapper.js";
import { aiServiceClient } from "./ai-service.client.js";
import {
  requireId,
  validateBpRecord,
  validateCreateConversation,
  validateDateFilter,
  validateInteraction,
  validateMeasurementSession,
  validateRiskProfile,
} from "./ai-proxy.validation.js";
import { logger } from "../../shared/logger.js";

function logReportMappingError(endpoint: string, error: unknown, result: unknown) {
  logger.error("aiProxyService", `Failed to map AI report response from ${endpoint}`, error, {
    endpoint,
    responsePreview: JSON.stringify(result).slice(0, 2000),
  });
}

export const aiProxyService = {
  async listConversations(accessToken: string) {
    const result = await aiServiceClient.get<unknown>("/conversations", accessToken);
    return toPublicConversationList(result);
  },

  async createConversation(body: unknown, accessToken: string) {
    const request = toAiServiceCreateConversationRequest(
      validateCreateConversation(body),
    );
    const result = await aiServiceClient.post<unknown>("/conversations", request, accessToken);
    return toPublicConversationSummary(result);
  },

  async deleteConversation(conversationId: string, accessToken: string) {
    await aiServiceClient.delete(`/conversations/${requireId(conversationId, "conversationId")}`, accessToken);
    return { deleted: true };
  },

  async listMessages(conversationId: string, accessToken: string) {
    const result = await aiServiceClient.get<unknown>(
      `/conversations/${requireId(conversationId, "conversationId")}/messages`,
      accessToken,
    );
    return toPublicMessageList(result);
  },

  async submitInteraction(conversationId: string, body: unknown, accessToken: string) {
    const request = toAiServiceInteractionRequest(validateInteraction(body));
    const result = await aiServiceClient.post<unknown>(
      `/conversations/${requireId(conversationId, "conversationId")}/interactions`,
      request,
      accessToken,
    );
    return toPublicInteractionResponse(result);
  },

  async listBpRecords(query: Record<string, unknown>, accessToken: string) {
    const parameters = new URLSearchParams();
    const fromDate = validateDateFilter(query.fromDate, "fromDate");
    const toDate = validateDateFilter(query.toDate, "toDate");
    if (fromDate) parameters.set("fromDate", fromDate);
    if (toDate) parameters.set("toDate", toDate);
    const suffix = parameters.size ? `?${parameters.toString()}` : "";
    const result = await aiServiceClient.get<unknown>(
      `/health-data/bp-records${suffix}`,
      accessToken,
    );
    return toPublicBpRecordList(result);
  },

  async getBpRecord(recordId: string, accessToken: string) {
    const result = await aiServiceClient.get<unknown>(
      `/health-data/bp-records/${encodeURIComponent(requireId(recordId, "recordId"))}`,
      accessToken,
    );
    return toPublicBpRecord(result);
  },

  async createBpRecord(body: unknown, accessToken: string) {
    const request = toAiServiceBpRecordRequest(validateBpRecord(body));
    const result = await aiServiceClient.post<unknown>(
      "/health-data/bp-records",
      request,
      accessToken,
    );
    return toPublicBpRecord(result);
  },

  async updateBpRecord(recordId: string, body: unknown, accessToken: string) {
    const request = toAiServiceBpRecordRequest(validateBpRecord(body));
    const result = await aiServiceClient.patch<unknown>(
      `/health-data/bp-records/${encodeURIComponent(requireId(recordId, "recordId"))}`,
      request,
      accessToken,
    );
    return toPublicBpRecord(result);
  },

  async deleteBpRecord(recordId: string, accessToken: string) {
    await aiServiceClient.delete(
      `/health-data/bp-records/${encodeURIComponent(requireId(recordId, "recordId"))}`,
      accessToken,
    );
    return { deleted: true };
  },


  async listMeasurementSessions(query: Record<string, unknown>, accessToken: string) {
    const parameters = new URLSearchParams();
    const fromDate = validateDateFilter(query.fromDate, "fromDate");
    const toDate = validateDateFilter(query.toDate, "toDate");
    if (fromDate) parameters.set("fromDate", fromDate);
    if (toDate) parameters.set("toDate", toDate);
    const suffix = parameters.size ? `?${parameters.toString()}` : "";
    const result = await aiServiceClient.get<unknown>(
      `/health-data/measurement-sessions${suffix}`,
      accessToken,
    );
    return toPublicMeasurementSessionList(result);
  },

  async getMeasurementSession(sessionId: string, accessToken: string) {
    const result = await aiServiceClient.get<unknown>(
      `/health-data/measurement-sessions/${encodeURIComponent(requireId(sessionId, "sessionId"))}`,
      accessToken,
    );
    return toPublicMeasurementSession(result);
  },

  async createMeasurementSession(body: unknown, accessToken: string) {
    const request = toAiServiceMeasurementSessionRequest(validateMeasurementSession(body));
    const result = await aiServiceClient.post<unknown>(
      "/health-data/measurement-sessions",
      request,
      accessToken,
    );
    return toPublicMeasurementSession(result);
  },

  async updateMeasurementSession(sessionId: string, body: unknown, accessToken: string) {
    const request = toAiServiceMeasurementSessionRequest(validateMeasurementSession(body));
    const result = await aiServiceClient.patch<unknown>(
      `/health-data/measurement-sessions/${encodeURIComponent(requireId(sessionId, "sessionId"))}`,
      request,
      accessToken,
    );
    return toPublicMeasurementSession(result);
  },

  async deleteMeasurementSession(sessionId: string, accessToken: string) {
    await aiServiceClient.delete(
      `/health-data/measurement-sessions/${encodeURIComponent(requireId(sessionId, "sessionId"))}`,
      accessToken,
    );
    return { deleted: true };
  },

  async getRiskProfile(accessToken: string) {
    const result = await aiServiceClient.get<unknown>(
      "/health-data/risk-profile",
      accessToken,
    );
    return toPublicRiskProfile(result);
  },

  async saveRiskProfile(body: unknown, accessToken: string) {
    const request = toAiServiceRiskProfileRequest(validateRiskProfile(body));
    const result = await aiServiceClient.put<unknown>(
      "/health-data/risk-profile",
      request,
      accessToken,
    );
    return toPublicRiskProfile(result);
  },

  async getLatestReport(accessToken: string) {
    const result = await aiServiceClient.get<unknown>("/reports/latest", accessToken);
    try {
      return toPublicLatestReportResponse(result);
    } catch (error) {
      logReportMappingError("/reports/latest", error, result);
      throw error;
    }
  },

  async listReports(query: Record<string, unknown>, accessToken: string) {
    const parameters = new URLSearchParams();
    const fromDate = validateDateFilter(query.fromDate, "fromDate");
    const toDate = validateDateFilter(query.toDate, "toDate");
    if (fromDate) parameters.set("fromDate", fromDate);
    if (toDate) parameters.set("toDate", toDate);
    const suffix = parameters.size ? `?${parameters.toString()}` : "";
    let result: unknown;
    try {
      result = await aiServiceClient.get<unknown>(`/reports${suffix}`, accessToken);
    } catch (error) {
      if (error instanceof Error && error.message === "Method Not Allowed") {
        logger.warn("aiProxyService", "AI Service does not support list reports yet; falling back to latest report", error);
        const latest = toPublicLatestReportResponse(
          await aiServiceClient.get<unknown>("/reports/latest", accessToken),
        );
        return { reports: latest.report ? [latest.report] : [] };
      }
      logger.error("aiProxyService", "Failed to fetch AI reports list", error, {
        endpoint: `/reports${suffix}`,
      });
      throw error;
    }
    try {
      return toPublicReportsListResponse(result);
    } catch (error) {
      logReportMappingError("/reports", error, result);
      throw error;
    }
  },

  async generateReport(accessToken: string) {
    const result = await aiServiceClient.post<unknown>("/reports", undefined, accessToken);
    try {
      return toPublicGenerateReportResponse(result);
    } catch (error) {
      logReportMappingError("/reports", error, result);
      throw error;
    }
  },
};

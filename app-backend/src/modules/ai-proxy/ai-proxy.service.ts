import {
  toAiServiceBpRecordRequest,
  toAiServiceCreateConversationRequest,
  toAiServiceInteractionRequest,
  toAiServiceRiskProfileRequest,
  toPublicBpRecord,
  toPublicBpRecordList,
  toPublicConversationList,
  toPublicConversationSummary,
  toPublicGenerateReportResponse,
  toPublicInteractionResponse,
  toPublicLatestReportResponse,
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
  validateRiskProfile,
} from "./ai-proxy.validation.js";

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
    return toPublicLatestReportResponse(result);
  },

  async generateReport(accessToken: string) {
    const result = await aiServiceClient.post<unknown>("/reports", undefined, accessToken);
    return toPublicGenerateReportResponse(result);
  },
};

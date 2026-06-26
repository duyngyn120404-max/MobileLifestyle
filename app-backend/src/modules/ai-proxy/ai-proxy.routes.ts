import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import {
  createConversation,
  createMeasurementSession,
  deleteMeasurementSession,
  deleteConversation,
  getRiskProfile,
  getLatestReport,
  generateReport,
  getMeasurementSession,
  listReports,
  listMeasurementSessions,
  listConversations,
  listMessages,
  saveRiskProfile,
  submitInteraction,
  updateMeasurementSession,
} from "./ai-proxy.controller.js";

export const aiProxyRoutes = Router();

aiProxyRoutes.use(authMiddleware);
aiProxyRoutes.get("/conversations", asyncHandler(listConversations));
aiProxyRoutes.post("/conversations", asyncHandler(createConversation));
aiProxyRoutes.delete("/conversations/:conversationId", asyncHandler(deleteConversation));
aiProxyRoutes.get("/conversations/:conversationId/messages", asyncHandler(listMessages));
aiProxyRoutes.post("/conversations/:conversationId/interactions", asyncHandler(submitInteraction));
aiProxyRoutes.get("/health-data/measurement-sessions", asyncHandler(listMeasurementSessions));
aiProxyRoutes.get("/health-data/measurement-sessions/:sessionId", asyncHandler(getMeasurementSession));
aiProxyRoutes.post("/health-data/measurement-sessions", asyncHandler(createMeasurementSession));
aiProxyRoutes.patch("/health-data/measurement-sessions/:sessionId", asyncHandler(updateMeasurementSession));
aiProxyRoutes.delete("/health-data/measurement-sessions/:sessionId", asyncHandler(deleteMeasurementSession));
aiProxyRoutes.get("/health-data/risk-profile", asyncHandler(getRiskProfile));
aiProxyRoutes.put("/health-data/risk-profile", asyncHandler(saveRiskProfile));
aiProxyRoutes.get("/reports", asyncHandler(listReports));
aiProxyRoutes.get("/reports/latest", asyncHandler(getLatestReport));
aiProxyRoutes.post("/reports", asyncHandler(generateReport));

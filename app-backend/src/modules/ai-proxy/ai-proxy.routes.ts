import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import {
  createBpRecord,
  createConversation,
  deleteBpRecord,
  deleteConversation,
  getBpRecord,
  getRiskProfile,
  getLatestReport,
  generateReport,
  listBpRecords,
  listConversations,
  listMessages,
  saveRiskProfile,
  submitInteraction,
  updateBpRecord,
} from "./ai-proxy.controller.js";

export const aiProxyRoutes = Router();

aiProxyRoutes.use(authMiddleware);
aiProxyRoutes.get("/conversations", asyncHandler(listConversations));
aiProxyRoutes.post("/conversations", asyncHandler(createConversation));
aiProxyRoutes.delete("/conversations/:conversationId", asyncHandler(deleteConversation));
aiProxyRoutes.get("/conversations/:conversationId/messages", asyncHandler(listMessages));
aiProxyRoutes.post("/conversations/:conversationId/interactions", asyncHandler(submitInteraction));
aiProxyRoutes.get("/health-data/bp-records", asyncHandler(listBpRecords));
aiProxyRoutes.get("/health-data/bp-records/:recordId", asyncHandler(getBpRecord));
aiProxyRoutes.post("/health-data/bp-records", asyncHandler(createBpRecord));
aiProxyRoutes.patch("/health-data/bp-records/:recordId", asyncHandler(updateBpRecord));
aiProxyRoutes.delete("/health-data/bp-records/:recordId", asyncHandler(deleteBpRecord));
aiProxyRoutes.get("/health-data/risk-profile", asyncHandler(getRiskProfile));
aiProxyRoutes.put("/health-data/risk-profile", asyncHandler(saveRiskProfile));
aiProxyRoutes.get("/reports/latest", asyncHandler(getLatestReport));
aiProxyRoutes.post("/reports", asyncHandler(generateReport));

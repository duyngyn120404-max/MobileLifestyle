import { Router } from "express";

import { services } from "../config/services.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { aiProxyRoutes } from "../modules/ai-proxy/ai-proxy.routes.js";
import { profileRoutes } from "../modules/profile/profile.routes.js";
import { sendSuccess } from "../shared/http/response.js";

export const routes = Router();

routes.get("/health", (_request, response) => {
  sendSuccess(response, {
    status: "ok",
    service: "app-backend",
    aiService: {
      baseUrl: services.aiService.baseUrl,
      timeoutMs: services.aiService.timeoutMs,
      configured: Boolean(services.aiService.apiKey),
    },
  });
});

routes.get("/me", authMiddleware, (request, response) => {
  sendSuccess(response, {
    user: request.currentUser,
  });
});

routes.use("/profile", profileRoutes);
routes.use("/ai", aiProxyRoutes);

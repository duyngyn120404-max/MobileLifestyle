import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import {
  getCurrentProfile,
  updateCurrentProfile,
} from "./profile.controller.js";

export const profileRoutes = Router();

profileRoutes.get("/me", authMiddleware, asyncHandler(getCurrentProfile));
profileRoutes.patch("/me", authMiddleware, asyncHandler(updateCurrentProfile));

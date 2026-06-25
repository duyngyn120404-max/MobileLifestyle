import { Router } from "express";

import { asyncHandler } from "../../middlewares/async-handler.js";
import { syncReviewCase } from "./odoo-review.controller.js";

export const odooReviewRoutes = Router();

odooReviewRoutes.post("/review-cases", asyncHandler(syncReviewCase));

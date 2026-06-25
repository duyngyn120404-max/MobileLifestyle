import type { Request, Response } from "express";

import { services } from "../../config/services.js";
import { AppError } from "../../shared/errors/app-error.js";
import { ERROR_CODES } from "../../shared/errors/error-codes.js";
import { sendSuccess } from "../../shared/http/response.js";
import { odooReviewService } from "./odoo-review.service.js";
import { validateOdooReviewCasePayload } from "./odoo-review.validation.js";

function assertInternalApiKey(request: Request): void {
  const apiKey = request.header("x-internal-api-key");
  if (!apiKey || apiKey !== services.odooWebhook.apiKey) {
    throw new AppError("Invalid internal API key", 401, ERROR_CODES.UNAUTHORIZED);
  }
}

export async function syncReviewCase(request: Request, response: Response) {
  assertInternalApiKey(request);
  const payload = validateOdooReviewCasePayload(request.body);
  const row = await odooReviewService.syncReviewCase(payload);
  return sendSuccess(response, row);
}

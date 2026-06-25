import { services } from "../../config/services.js";
import { AppError } from "../../shared/errors/app-error.js";
import { ERROR_CODES } from "../../shared/errors/error-codes.js";
import type { DoctorReviewCaseRow, OdooReviewCasePayload } from "./odoo-review.types.js";

function aiServiceUrl(path: string): string {
  return `${services.aiService.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export const odooReviewRepository = {
  async upsertReviewCase(payload: OdooReviewCasePayload): Promise<DoctorReviewCaseRow> {
    const url = aiServiceUrl("/doctor-review-cases");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Api-Key": services.odooWebhook.apiKey,
      },
      body: JSON.stringify(payload),
    });

    const body = (await response.json().catch(() => null)) as DoctorReviewCaseRow | { error?: string } | null;
    if (!response.ok) {
      throw new AppError(
        body && "error" in body && body.error ? body.error : "AI service doctor review sync failed",
        response.status >= 500 ? 502 : response.status,
        response.status === 401 ? ERROR_CODES.UNAUTHORIZED : ERROR_CODES.EXTERNAL_SERVICE_ERROR,
        body,
      );
    }

    return body as DoctorReviewCaseRow;
  },
};

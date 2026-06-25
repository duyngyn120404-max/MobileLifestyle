import type { DoctorReviewCaseRow, OdooReviewCasePayload } from "./odoo-review.types.js";
import { odooReviewRepository } from "./odoo-review.repository.js";

export const odooReviewService = {
  syncReviewCase(payload: OdooReviewCasePayload): Promise<DoctorReviewCaseRow> {
    return odooReviewRepository.upsertReviewCase(payload);
  },
};

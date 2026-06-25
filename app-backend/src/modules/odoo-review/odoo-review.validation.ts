import { AppError } from "../../shared/errors/app-error.js";
import { ERROR_CODES } from "../../shared/errors/error-codes.js";
import type { OdooReviewCasePayload } from "./odoo-review.types.js";

const STATES = new Set(["new", "in_review", "reviewed", "cancelled"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError("Payload must be an object", 400, ERROR_CODES.VALIDATION_ERROR);
  }
  return value as Record<string, unknown>;
}

function optionalString(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new AppError(`${field} must be a string`, 400, ERROR_CODES.VALIDATION_ERROR);
  }
  return value;
}

function requiredUuid(value: unknown, field: string): string {
  const raw = optionalString(value, field);
  if (!raw || !UUID_PATTERN.test(raw)) {
    throw new AppError(`${field} must be a UUID`, 400, ERROR_CODES.VALIDATION_ERROR);
  }
  return raw;
}

function optionalUuid(value: unknown, field: string): string | null {
  const raw = optionalString(value, field);
  if (raw && !UUID_PATTERN.test(raw)) {
    throw new AppError(`${field} must be a UUID`, 400, ERROR_CODES.VALIDATION_ERROR);
  }
  return raw;
}

function optionalDate(value: unknown, field: string): string | null {
  const raw = optionalString(value, field);
  if (!raw) return null;
  if (Number.isNaN(Date.parse(raw))) {
    throw new AppError(`${field} must be an ISO date string`, 400, ERROR_CODES.VALIDATION_ERROR);
  }
  return raw;
}

export function validateOdooReviewCasePayload(value: unknown): OdooReviewCasePayload {
  const payload = requireObject(value);
  const odooCaseId = payload.odooCaseId;
  if (!Number.isInteger(odooCaseId) || Number(odooCaseId) <= 0) {
    throw new AppError("odooCaseId must be a positive integer", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const state = optionalString(payload.state, "state");
  if (!state || !STATES.has(state)) {
    throw new AppError("state is invalid", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  return {
    odooCaseId: Number(odooCaseId),
    odooCaseName: optionalString(payload.odooCaseName, "odooCaseName"),
    externalClassificationId: optionalString(payload.externalClassificationId, "externalClassificationId"),
    healthcareReportId: optionalUuid(payload.healthcareReportId, "healthcareReportId"),
    userId: requiredUuid(payload.userId, "userId"),
    externalHealthRecordId: optionalString(payload.externalHealthRecordId, "externalHealthRecordId"),
    state: state as OdooReviewCasePayload["state"],
    aiRiskLevel: optionalString(payload.aiRiskLevel, "aiRiskLevel"),
    finalRiskLevel: optionalString(payload.finalRiskLevel, "finalRiskLevel"),
    doctorDecision: optionalString(payload.doctorDecision, "doctorDecision"),
    reviewNote: optionalString(payload.reviewNote, "reviewNote"),
    assignedDoctorName: optionalString(payload.assignedDoctorName, "assignedDoctorName"),
    reviewedByName: optionalString(payload.reviewedByName, "reviewedByName"),
    reviewedAt: optionalDate(payload.reviewedAt, "reviewedAt"),
    isReferred: Boolean(payload.isReferred),
    referralDepartment: optionalString(payload.referralDepartment, "referralDepartment"),
    referralReason: optionalString(payload.referralReason, "referralReason"),
    referredByName: optionalString(payload.referredByName, "referredByName"),
    referredAt: optionalDate(payload.referredAt, "referredAt"),
  };
}

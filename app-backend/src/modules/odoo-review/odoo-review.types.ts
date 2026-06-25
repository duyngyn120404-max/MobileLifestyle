export interface OdooReviewCasePayload {
  odooCaseId: number;
  odooCaseName?: string | null;
  externalClassificationId?: string | null;
  healthcareReportId?: string | null;
  userId: string;
  externalHealthRecordId?: string | null;
  state: "new" | "in_review" | "reviewed" | "cancelled";
  aiRiskLevel?: string | null;
  finalRiskLevel?: string | null;
  doctorDecision?: string | null;
  reviewNote?: string | null;
  assignedDoctorName?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  isReferred?: boolean;
  referralDepartment?: string | null;
  referralReason?: string | null;
  referredByName?: string | null;
  referredAt?: string | null;
}

export interface DoctorReviewCaseRow {
  id: string;
  odoo_case_id: number;
  healthcare_report_id: string | null;
  user_id: string;
  state: string;
  doctor_decision: string | null;
  final_risk_level: string | null;
  reviewed_at: string | null;
  is_referred: boolean;
  updated_at: string;
}

export interface Disease {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  fields: DiseaseField[];
}

export interface DiseaseField {
  name: string;
  unit: string;
  placeholder: string;
  type: "decimal" | "number" | "text";
}

export interface HealthWarning {
  type: "warning" | "info" | "success";
  title: string;
  description: string;
  color: string;
  icon: string;
}

export interface HealthStat {
  label: string;
  value: string;
  color: string;
  icon: string;
}

export interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  image?: string;
  liked?: boolean;
  disliked?: boolean;
  // DataCollection flow
  pendingConfirm?: {
    reviewItems: ReviewRecord[];
    autoAcceptIds: { table: "bp_records" | "clinical_facts"; recordId: string }[];
  };
  reviewItems?: ReviewRecord[];
  autoAcceptIds?: { table: "bp_records" | "clinical_facts"; recordId: string }[];
}

export interface ChatSession {
  id: string;
  title: string;
  date: string;
}

export type IntentMode =
  | "auto"
  | "personal_medical_qa"
  | "general_medical_qa"
  | "data_collection";

export interface ReviewRecord {
  table: "bp_records" | "clinical_facts";
  recordId: string;
  decision: "accepted" | "rejected" | null;
}

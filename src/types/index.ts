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
}

export interface ChatSession {
  id: string;
  title: string;
  date: string;
}

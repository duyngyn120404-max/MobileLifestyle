const API_BASE_URL = "https://55f6-14-161-1-203.ngrok-free.app/api/v1";

export const API_ROUTES = {
  // Conversations
  CONVERSATIONS: "/conversations",
  CONVERSATION: (id: string) => `/conversations/${id}`,
  MESSAGES: (conversationId: string) => `/conversations/${conversationId}/messages`,

  // Healthcare
  GENERATE_HEALTHCARE_REPORT: "/generate_healthcare_report",
  HEALTHCARE_REPORT: "/healthcare_report",
  ASSESSMENT_COMPARISON: "/assessment_comparison",

  // Ingestion
  INGEST: "/ingest",
  INGEST_REVIEW: "/ingest/review",
} as const;

export { API_BASE_URL };

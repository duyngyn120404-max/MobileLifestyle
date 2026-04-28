const API_BASE_URL = "http://localhost:8001/api/v1";

export const API_ROUTES = {
  // Conversations
  CONVERSATIONS: "/conversations",
  CONVERSATION: (id: string) => `/conversations/${id}`,
  MESSAGES: (conversationId: string) => `/conversations/${conversationId}/messages`,

  // Healthcare
  GENERATE_HEALTHCARE_REPORT: "/generate_healthcare_report",

  // Ingestion
  INGEST: "/ingest",
  INGEST_REVIEW: "/ingest/review",
} as const;

export { API_BASE_URL };

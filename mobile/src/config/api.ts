const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

export const API_ROUTES = {
  // Conversations
  CONVERSATIONS: "/conversations",
  CONVERSATION: (id: string) => `/conversations/${id}`,
  MESSAGES: (conversationId: string) => `/conversations/${conversationId}/messages`,

  // Healthcare
  ASSESSMENT_COMPARISON: "/assessment_comparison",

  // Ingestion
  INGEST: "/ingest",
  INGEST_REVIEW: "/ingest/review",
  INGEST_BP: "/ingest/bp",
} as const;

export { API_BASE_URL };

export const API_ROUTES = {
  health: "/health",
  auth: {
    me: "/me",
  },
  profile: {
    me: "/profile/me",
  },
  ai: {
    conversations: "/ai/conversations",
    conversation: (id: string) => `/ai/conversations/${id}`,
    messages: (conversationId: string) => `/ai/conversations/${conversationId}/messages`,
    interactions: (conversationId: string) => `/ai/conversations/${conversationId}/interactions`,
    bpRecords: "/ai/health-data/bp-records",
    bpRecord: (recordId: string) => `/ai/health-data/bp-records/${recordId}`,
    riskProfile: "/ai/health-data/risk-profile",
    reports: "/ai/reports",
    latestReport: "/ai/reports/latest",
  },
} as const;

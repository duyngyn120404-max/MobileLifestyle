import { env } from "./env.js";

export const services = {
  supabase: {
    url: env.supabaseUrl,
    anonKey: env.supabaseAnonKey,
  },
  aiService: {
    baseUrl: env.aiServiceBaseUrl,
    apiKey: env.aiServiceApiKey,
    timeoutMs: env.aiServiceTimeoutMs,
  },
} as const;

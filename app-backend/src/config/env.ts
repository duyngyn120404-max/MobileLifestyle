import path from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(currentDir, "../..");
const projectRoot = path.resolve(backendRoot, "..");

config({
  path: [
    path.join(backendRoot, ".env"),
    path.join(projectRoot, "mobile/.env.local"),
  ],
});

const isProduction = process.env.NODE_ENV === "production";

function readString(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function readNumber(name: string, fallback: number): number {
  const rawValue = process.env[name];
  if (!rawValue) return fallback;

  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }
  return value;
}

function readUrl(name: string, fallback?: string): string {
  const value = readString(name, fallback);
  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`Environment variable ${name} must be a valid URL`);
  }
}

function readCsv(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: readNumber("PORT", 8000),
  corsAllowedOrigins: readCsv("CORS_ALLOWED_ORIGINS"),
  supabaseUrl: readUrl("SUPABASE_URL", process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: readString("SUPABASE_ANON_KEY", process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  aiServiceBaseUrl: readUrl("AI_SERVICE_BASE_URL", "http://localhost:8001/api/v1"),
  aiServiceApiKey: readString(
    "AI_SERVICE_API_KEY",
    isProduction ? undefined : "development-ai-service-key",
  ),
  aiServiceTimeoutMs: readNumber("AI_SERVICE_TIMEOUT_MS", 30000),
} as const;

const required = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const env = {
  supabaseUrl: required("EXPO_PUBLIC_SUPABASE_URL", process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required(
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  ),
  appBackendUrl:
    process.env.EXPO_PUBLIC_APP_BACKEND_URL ??
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    "http://localhost:8000/api/v1",
} as const;

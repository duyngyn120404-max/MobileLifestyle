import { env } from "@/src/config/env";
import { API_ROUTES } from "@/src/config/apiRoutes";
import { supabase } from "@/src/config/supabase";

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

const joinUrl = (baseUrl: string, path: string) =>
  `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }

  return { Authorization: `Bearer ${session.access_token}` };
}

async function request<T>(path: string, options: RequestInit = {}, withAuth = true): Promise<T> {
  const authHeaders = withAuth ? await getAuthHeader() : {};
  const url = joinUrl(env.appBackendUrl, path);

  const response = await fetch(url, {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...authHeaders,
      ...options.headers,
    },
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !payload?.success) {
    const message =
      payload && "error" in payload ? payload.error.message : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload.data;
}

export const apiClient = {
  get<T>(path: string, withAuth = true) {
    return request<T>(path, { method: "GET" }, withAuth);
  },

  post<T>(path: string, body?: unknown, withAuth = true) {
    return request<T>(
      path,
      {
        method: "POST",
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      withAuth,
    );
  },

  patch<T>(path: string, body?: unknown, withAuth = true) {
    return request<T>(
      path,
      {
        method: "PATCH",
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      withAuth,
    );
  },

  put<T>(path: string, body?: unknown, withAuth = true) {
    return request<T>(
      path,
      {
        method: "PUT",
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      withAuth,
    );
  },

  delete<T>(path: string, withAuth = true) {
    return request<T>(path, { method: "DELETE" }, withAuth);
  },

  transcribe(audio: string, format: string) {
    return request<{ text?: string; transcription?: string }>(
      API_ROUTES.transcribe,
      {
        method: "POST",
        body: JSON.stringify({ audio, format }),
      },
      false,
    );
  },
};

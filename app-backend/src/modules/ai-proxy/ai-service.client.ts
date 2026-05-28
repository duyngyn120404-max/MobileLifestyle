import { services } from "../../config/services.js";
import { AppError } from "../../shared/errors/app-error.js";
import { ERROR_CODES } from "../../shared/errors/error-codes.js";

function serviceUrl(path: string): string {
  return `${services.aiService.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

async function readResponseBody(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function downstreamError(response: Response, payload: unknown): AppError {
  const message =
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
      ? payload.message
      : "AI service request failed";

  if (response.status === 400) {
    return new AppError(message, 400, ERROR_CODES.VALIDATION_ERROR);
  }
  if (response.status === 404) {
    return new AppError(message, 404, ERROR_CODES.NOT_FOUND);
  }
  if (response.status === 409) {
    return new AppError(message, 409, ERROR_CODES.CONFLICT);
  }

  return new AppError("Unable to complete AI request", 502, ERROR_CODES.EXTERNAL_SERVICE_ERROR);
}

async function request<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), services.aiService.timeoutMs);

  try {
    const response = await fetch(serviceUrl(path), {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...options.headers,
      },
    });
    const payload = await readResponseBody(response);

    if (!response.ok) {
      throw downstreamError(response, payload);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new AppError(
        "AI service request timed out",
        504,
        ERROR_CODES.EXTERNAL_SERVICE_TIMEOUT,
      );
    }

    throw new AppError(
      "Unable to connect to AI service",
      502,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export const aiServiceClient = {
  get<T>(path: string, accessToken: string) {
    return request<T>(path, accessToken, { method: "GET" });
  },

  post<T>(path: string, body: unknown, accessToken: string) {
    return request<T>(path, accessToken, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  patch<T>(path: string, body: unknown, accessToken: string) {
    return request<T>(path, accessToken, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  put<T>(path: string, body: unknown, accessToken: string) {
    return request<T>(path, accessToken, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  delete<T>(path: string, accessToken: string) {
    return request<T>(path, accessToken, { method: "DELETE" });
  },
};

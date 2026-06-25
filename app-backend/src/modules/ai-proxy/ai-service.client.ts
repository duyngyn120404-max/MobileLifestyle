import { services } from "../../config/services.js";
import { AppError } from "../../shared/errors/app-error.js";
import { ERROR_CODES } from "../../shared/errors/error-codes.js";

function serviceUrl(path: string): string {
  return `${services.aiService.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

async function readResponseBody(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function extractErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "AI service request failed";
  }

  if ("message" in payload && typeof payload.message === "string") {
    return payload.message;
  }

  if ("error" in payload && typeof payload.error === "string") {
    return payload.error;
  }

  if (!("detail" in payload)) {
    return "AI service request failed";
  }

  const { detail } = payload;
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item && typeof item.msg === "string") {
          return item.msg;
        }
        return null;
      })
      .filter((item): item is string => Boolean(item));

    if (messages.length) {
      return messages.join("; ");
    }
  }

  return "AI service request failed";
}

function downstreamError(response: Response, payload: unknown, url: string): AppError {
  const message = extractErrorMessage(payload);
  console.error("[aiServiceClient] Downstream AI service error", {
    status: response.status,
    url,
    payload,
  });

  if (response.status === 401) {
    return new AppError(message, 401, ERROR_CODES.UNAUTHORIZED, payload);
  }
  if (response.status === 403) {
    return new AppError(message, 403, ERROR_CODES.FORBIDDEN, payload);
  }
  if (response.status === 400) {
    return new AppError(message, 400, ERROR_CODES.VALIDATION_ERROR, payload);
  }
  if (response.status === 404) {
    return new AppError(message, 404, ERROR_CODES.NOT_FOUND, payload);
  }
  if (response.status === 409) {
    return new AppError(message, 409, ERROR_CODES.CONFLICT, payload);
  }
  if (response.status === 422) {
    return new AppError(message, 422, ERROR_CODES.VALIDATION_ERROR, payload);
  }

  return new AppError(
    message,
    502,
    ERROR_CODES.EXTERNAL_SERVICE_ERROR,
    {
      status: response.status,
      payload,
    },
  );
}

async function request<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), services.aiService.timeoutMs);

  try {
    const url = serviceUrl(path);
    const response = await fetch(url, {
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
      throw downstreamError(response, payload, url);
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

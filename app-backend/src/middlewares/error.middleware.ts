import type { ErrorRequestHandler } from "express";

import { normalizeError } from "../shared/errors/normalize-error.js";
import { sendError } from "../shared/http/response.js";

export const errorMiddleware: ErrorRequestHandler = (error, request, response, _next) => {
  const normalizedError = normalizeError(error);

  if (!normalizedError.isOperational) {
    console.error("[errorMiddleware] Unexpected error", {
      method: request.method,
      path: request.originalUrl,
      error,
    });
  }

  if (response.headersSent) {
    return;
  }

  sendError(
    response,
    normalizedError.statusCode,
    normalizedError.code,
    normalizedError.message,
    normalizedError.details,
  );
};

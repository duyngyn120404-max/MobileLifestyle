import type { ErrorRequestHandler } from "express";

import { logger } from "../shared/logger.js";
import { normalizeError } from "../shared/errors/normalize-error.js";
import { sendError } from "../shared/http/response.js";

export const errorMiddleware: ErrorRequestHandler = (error, request, response, _next) => {
  const normalizedError = normalizeError(error);

  if (!normalizedError.isOperational || normalizedError.statusCode >= 500) {
    logger.error("errorMiddleware", "unexpected error", error, {
      method: request.method,
      path: request.originalUrl,
      statusCode: normalizedError.statusCode,
      errorCode: normalizedError.code,
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

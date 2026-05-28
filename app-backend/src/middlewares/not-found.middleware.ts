import type { RequestHandler } from "express";

import { AppError } from "../shared/errors/app-error.js";
import { ERROR_CODES } from "../shared/errors/error-codes.js";

export const notFoundMiddleware: RequestHandler = (request, _response, next) => {
  next(new AppError(`Route not found: ${request.method} ${request.originalUrl}`, 404, ERROR_CODES.NOT_FOUND));
};

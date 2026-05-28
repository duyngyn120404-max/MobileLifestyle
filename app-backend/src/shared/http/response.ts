import type { Response } from "express";

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function sendSuccess<T>(
  response: Response,
  data: T,
  meta?: Record<string, unknown>,
  statusCode = 200,
) {
  const body: SuccessResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };

  return response.status(statusCode).json(body);
}

export function sendError(
  response: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
) {
  const body: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  };

  return response.status(statusCode).json(body);
}

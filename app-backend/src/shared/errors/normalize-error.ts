import { env } from "../../config/env.js";
import { AppError } from "./app-error.js";
import { ERROR_CODES, type ErrorCode } from "./error-codes.js";

export interface NormalizedError {
  statusCode: number;
  code: ErrorCode;
  message: string;
  details?: unknown;
  isOperational: boolean;
}

function isBodyParserError(error: unknown): error is Error & { status?: number; type?: string } {
  return error instanceof SyntaxError && "status" in error && "type" in error;
}

function isAbortError(error: unknown): error is Error {
  return error instanceof Error && error.name === "AbortError";
}

export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
      isOperational: error.isOperational,
    };
  }

  if (isBodyParserError(error)) {
    return {
      statusCode: 400,
      code: ERROR_CODES.BAD_REQUEST,
      message: "Invalid JSON request body",
      isOperational: true,
    };
  }

  if (isAbortError(error)) {
    return {
      statusCode: 504,
      code: ERROR_CODES.EXTERNAL_SERVICE_TIMEOUT,
      message: "External service request timed out",
      isOperational: true,
    };
  }

  return {
    statusCode: 500,
    code: ERROR_CODES.INTERNAL_ERROR,
    message: env.nodeEnv === "production" ? "Unexpected internal error" : getErrorMessage(error),
    isOperational: false,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unexpected error";
}

type LogContext = Record<string, unknown>;

function normalizeError(error: unknown): LogContext {
  if (error instanceof Error) {
    const maybeAppError = error as Error & {
      code?: unknown;
      statusCode?: unknown;
    };

    return {
      errorName: error.name,
      errorMessage: error.message,
      ...(typeof maybeAppError.code === "string"
        ? { errorCode: maybeAppError.code }
        : {}),
      ...(typeof maybeAppError.statusCode === "number"
        ? { statusCode: maybeAppError.statusCode }
        : {}),
    };
  }

  if (typeof error === "string") {
    return {
      errorName: "Error",
      errorMessage: error,
    };
  }

  return {
    errorName: "UnknownError",
    errorMessage: "Unknown error",
  };
}

function withError(error?: unknown, context?: LogContext): LogContext {
  return {
    ...(context ?? {}),
    ...(error === undefined ? {} : normalizeError(error)),
  };
}

export const logger = {
  info(scope: string, message: string, context?: LogContext) {
    console.log(`[backend][${scope}] ${message}`, context ?? {});
  },

  warn(scope: string, message: string, error?: unknown, context?: LogContext) {
    console.warn(`[backend][${scope}] ${message}`, withError(error, context));
  },

  error(scope: string, message: string, error?: unknown, context?: LogContext) {
    console.error(`[backend][${scope}] ${message}`, withError(error, context));
  },
};

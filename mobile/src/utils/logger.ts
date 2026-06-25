type LogContext = Record<string, unknown>;

function normalizeError(error: unknown): LogContext {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
    };
  }

  if (typeof error === "string") {
    return {
      errorName: "Error",
      errorMessage: error,
    };
  }

  if (error && typeof error === "object") {
    const maybeError = error as { name?: unknown; message?: unknown };

    return {
      errorName:
        typeof maybeError.name === "string" ? maybeError.name : "UnknownError",
      errorMessage:
        typeof maybeError.message === "string"
          ? maybeError.message
          : "Unknown error",
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
    console.info(`[mobile][${scope}] ${message}`, context ?? {});
  },

  warn(scope: string, message: string, context?: LogContext) {
    console.warn(`[mobile][${scope}] WARN ${message}`, context ?? {});
  },

  error(scope: string, message: string, error?: unknown, context?: LogContext) {
    console.error(`[mobile][${scope}] ERROR ${message}`, withError(error, context));
  },
};

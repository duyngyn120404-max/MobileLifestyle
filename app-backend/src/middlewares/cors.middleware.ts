import type { RequestHandler } from "express";

import { env } from "../config/env.js";

const ALLOWED_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const ALLOWED_HEADERS = "Authorization,Content-Type";
const isDevelopment = env.nodeEnv !== "production";

function isAllowedOrigin(origin: string): boolean {
  if (env.corsAllowedOrigins.includes(origin)) return true;
  if (!isDevelopment) return false;

  try {
    const url = new URL(origin);
    return (
      (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
      (url.protocol === "http:" || url.protocol === "https:")
    );
  } catch {
    return false;
  }
}

export const corsMiddleware: RequestHandler = (request, response, next) => {
  const origin = request.headers.origin;

  if (origin && isAllowedOrigin(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS);
    response.setHeader("Access-Control-Allow-Headers", ALLOWED_HEADERS);
  }

  if (request.method === "OPTIONS") {
    return response.sendStatus(204);
  }

  next();
};

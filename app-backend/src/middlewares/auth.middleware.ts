import type { NextFunction, Request, Response } from "express";

import { services } from "../config/services.js";
import { logger } from "../shared/logger.js";
import { AppError } from "../shared/errors/app-error.js";
import { ERROR_CODES } from "../shared/errors/error-codes.js";
import type { CurrentUser } from "../types/current-user.js";

interface SupabaseUserResponse {
  id?: string;
  email?: string;
  role?: string;
}

function getBearerToken(request: Request): string {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError("Missing bearer token", 401, ERROR_CODES.UNAUTHORIZED);
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    throw new AppError("Missing bearer token", 401, ERROR_CODES.UNAUTHORIZED);
  }

  return token;
}

async function verifySupabaseAccessToken(accessToken: string): Promise<CurrentUser> {
  const response = await fetch(`${services.supabase.url}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: services.supabase.anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new AppError("Invalid or expired access token", 401, ERROR_CODES.UNAUTHORIZED);
  }

  const payload = (await response.json()) as SupabaseUserResponse;

  if (!payload.id) {
    throw new AppError("Invalid access token payload", 401, ERROR_CODES.UNAUTHORIZED);
  }

  return {
    id: payload.id,
    email: payload.email ?? null,
    role: payload.role ?? null,
  };
}

export async function authMiddleware(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    const accessToken = getBearerToken(request);
    request.currentUser = await verifySupabaseAccessToken(accessToken);
    request.authAccessToken = accessToken;
    next();
  } catch (error) {
    const context = {
      method: request.method,
      path: request.originalUrl,
    };

    if (error instanceof AppError) {
      logger.warn("authMiddleware", error.message, error, context);
    } else {
      logger.error("authMiddleware", "token verify exception", error, context);
    }

    next(error);
  }
}

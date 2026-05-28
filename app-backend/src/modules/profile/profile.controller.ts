import type { Request, Response } from "express";

import { AppError } from "../../shared/errors/app-error.js";
import { ERROR_CODES } from "../../shared/errors/error-codes.js";
import { sendSuccess } from "../../shared/http/response.js";
import { profileService } from "./profile.service.js";

function requireAuthContext(request: Request) {
  if (!request.currentUser || !request.authAccessToken) {
    throw new AppError("Missing authenticated user", 401, ERROR_CODES.UNAUTHORIZED);
  }

  return {
    currentUser: request.currentUser,
    accessToken: request.authAccessToken,
  };
}

export async function getCurrentProfile(request: Request, response: Response) {
  const { currentUser, accessToken } = requireAuthContext(request);
  const profile = await profileService.getProfile(currentUser, accessToken);
  return sendSuccess(response, profile);
}

export async function updateCurrentProfile(request: Request, response: Response) {
  const { currentUser, accessToken } = requireAuthContext(request);
  const profile = await profileService.updateProfile(
    currentUser,
    accessToken,
    request.body,
  );
  return sendSuccess(response, profile);
}

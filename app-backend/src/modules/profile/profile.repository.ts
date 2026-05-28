import { services } from "../../config/services.js";
import { AppError } from "../../shared/errors/app-error.js";
import { ERROR_CODES } from "../../shared/errors/error-codes.js";
import type { ProfileRow, UpdateProfileRow } from "./profile.types.js";

const PROFILE_COLUMNS =
  "id,full_name,phone_number,gender,age,height,weight";

function profileUrl(userId: string): string {
  const query = new URLSearchParams({
    id: `eq.${userId}`,
    select: PROFILE_COLUMNS,
  });

  return `${services.supabase.url}/rest/v1/users?${query.toString()}`;
}

function requestHeaders(accessToken: string): Record<string, string> {
  return {
    apikey: services.supabase.anonKey,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

async function parseProfileRows(response: Response): Promise<ProfileRow[]> {
  if (!response.ok) {
    throw new AppError(
      "Unable to access profile persistence",
      502,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR,
    );
  }

  return (await response.json()) as ProfileRow[];
}

export const profileRepository = {
  async findCurrentUserProfile(
    userId: string,
    accessToken: string,
  ): Promise<ProfileRow | null> {
    try {
      const response = await fetch(profileUrl(userId), {
        method: "GET",
        headers: requestHeaders(accessToken),
      });
      const rows = await parseProfileRows(response);
      return rows[0] ?? null;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Unable to access profile persistence",
        502,
        ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      );
    }
  },

  async updateCurrentUserProfile(
    userId: string,
    update: UpdateProfileRow,
    accessToken: string,
  ): Promise<ProfileRow | null> {
    try {
      const response = await fetch(profileUrl(userId), {
        method: "PATCH",
        headers: {
          ...requestHeaders(accessToken),
          Prefer: "return=representation",
        },
        body: JSON.stringify(update),
      });
      const rows = await parseProfileRows(response);
      return rows[0] ?? null;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Unable to update profile persistence",
        502,
        ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      );
    }
  },
};

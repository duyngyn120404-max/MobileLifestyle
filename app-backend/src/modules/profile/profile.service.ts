import { AppError } from "../../shared/errors/app-error.js";
import { ERROR_CODES } from "../../shared/errors/error-codes.js";
import type { CurrentUser } from "../../types/current-user.js";
import { profileRepository } from "./profile.repository.js";
import type {
  GenderValue,
  Profile,
  ProfileRow,
  UpdateProfileRequest,
} from "./profile.types.js";

const UPDATE_FIELDS = [
  "fullName",
  "phoneNumber",
  "gender",
  "age",
  "height",
  "weight",
] as const;

function notFound(): AppError {
  return new AppError("Profile not found", 404, ERROR_CODES.NOT_FOUND);
}

function mapProfile(row: ProfileRow, currentUser: CurrentUser): Profile {
  const gender =
    row.gender === "male" || row.gender === "female" || row.gender === "other"
      ? row.gender
      : null;

  return {
    id: row.id,
    email: currentUser.email,
    fullName: row.full_name,
    phoneNumber: row.phone_number,
    gender,
    age: row.age,
    height: row.height,
    weight: row.weight,
  };
}

function validationError(message: string): never {
  throw new AppError(message, 400, ERROR_CODES.VALIDATION_ERROR);
}

function readNullableString(value: unknown, name: string): string | null {
  if (value === null) return null;
  if (typeof value !== "string") {
    return validationError(`${name} must be a string or null`);
  }

  return value.trim() || null;
}

function readNullableNumber(value: unknown, name: string): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return validationError(`${name} must be a finite number or null`);
  }

  return value;
}

function readGender(value: unknown): GenderValue {
  if (value === null) return null;
  if (value === "male" || value === "female" || value === "other") {
    return value;
  }

  return validationError("gender must be male, female, other, or null");
}

function validateUpdatePayload(body: unknown): UpdateProfileRequest {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return validationError("Profile update payload must be an object");
  }

  const payload = body as Record<string, unknown>;
  const keys = Object.keys(payload);
  if (
    keys.some((key) => !UPDATE_FIELDS.includes(key as (typeof UPDATE_FIELDS)[number])) ||
    UPDATE_FIELDS.some((field) => !(field in payload))
  ) {
    return validationError("Profile update payload contains invalid or missing fields");
  }

  if (typeof payload.fullName !== "string" || !payload.fullName.trim()) {
    return validationError("fullName is required");
  }

  return {
    fullName: payload.fullName.trim(),
    phoneNumber: readNullableString(payload.phoneNumber, "phoneNumber"),
    gender: readGender(payload.gender),
    age: readNullableNumber(payload.age, "age"),
    height: readNullableNumber(payload.height, "height"),
    weight: readNullableNumber(payload.weight, "weight"),
  };
}

export const profileService = {
  async getProfile(currentUser: CurrentUser, accessToken: string): Promise<Profile> {
    const row = await profileRepository.findCurrentUserProfile(
      currentUser.id,
      accessToken,
    );

    if (!row) throw notFound();
    return mapProfile(row, currentUser);
  },

  async updateProfile(
    currentUser: CurrentUser,
    accessToken: string,
    body: unknown,
  ): Promise<Profile> {
    const payload = validateUpdatePayload(body);
    const row = await profileRepository.updateCurrentUserProfile(
      currentUser.id,
      {
        full_name: payload.fullName,
        phone_number: payload.phoneNumber,
        gender: payload.gender,
        age: payload.age,
        height: payload.height,
        weight: payload.weight,
      },
      accessToken,
    );

    if (!row) throw notFound();
    return mapProfile(row, currentUser);
  },
};

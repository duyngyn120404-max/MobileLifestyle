import type {
  ProfileFormState,
  UpdateProfileRequest,
} from "../types/profile.types";

function optionalNumber(value: string, label: string): number | null {
  if (!value.trim()) return null;

  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`${label} phải là số.`);
  }

  return number;
}

export function buildProfileUpdateRequest(
  form: ProfileFormState,
): UpdateProfileRequest {
  const fullName = form.fullName.trim();
  if (!fullName) {
    throw new Error("Vui lòng nhập họ và tên.");
  }

  return {
    fullName,
    phoneNumber: form.phoneNumber.trim() || null,
    gender: form.gender || null,
    age: optionalNumber(form.age, "Tuổi"),
    height: optionalNumber(form.height, "Chiều cao"),
    weight: optionalNumber(form.weight, "Cân nặng"),
  };
}

export type GenderValue = "male" | "female" | "other" | null;

export interface Profile {
  id: string;
  email: string | null;
  fullName: string | null;
  phoneNumber: string | null;
  gender: GenderValue;
  age: number | null;
  height: number | null;
  weight: number | null;
}

export interface ProfileFormState {
  fullName: string;
  phoneNumber: string;
  gender: Exclude<GenderValue, null> | "";
  age: string;
  height: string;
  weight: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber: string | null;
  gender: GenderValue;
  age: number | null;
  height: number | null;
  weight: number | null;
}

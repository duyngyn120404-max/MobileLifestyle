export type GenderValue = "male" | "female" | "other" | null;

export interface ProfileRow {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  gender: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
}

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

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber: string | null;
  gender: GenderValue;
  age: number | null;
  height: number | null;
  weight: number | null;
}

export interface UpdateProfileRow {
  full_name: string;
  phone_number: string | null;
  gender: GenderValue;
  age: number | null;
  height: number | null;
  weight: number | null;
}

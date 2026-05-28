export type AuthMode = "sign-in" | "sign-up";

export type AuthFormState = {
  email: string;
  password: string;
  confirmPassword: string;
};

export type AuthFieldErrors = Partial<Record<keyof AuthFormState, string>>;

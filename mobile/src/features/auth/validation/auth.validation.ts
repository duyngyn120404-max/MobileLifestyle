import {
  AuthFieldErrors,
  AuthFormState,
  AuthMode,
} from "../types/auth.types";

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateAuthForm(
  form: AuthFormState,
  mode: AuthMode,
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const email = normalizeEmail(form.email);

  if (!email) {
    errors.email = "Vui lòng nhập email.";
  } else if (!isValidEmail(email)) {
    errors.email = "Email không đúng định dạng.";
  }

  if (!form.password) {
    errors.password = "Vui lòng nhập mật khẩu.";
  } else if (form.password.length < 6) {
    errors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
  }

  if (mode === "sign-up") {
    if (!form.confirmPassword) {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
    } else if (form.confirmPassword !== form.password) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }
  }

  return errors;
}

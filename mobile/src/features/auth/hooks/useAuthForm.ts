import { useAuth } from "@/src/contexts/auth-context";
import { useRouter } from "expo-router";
import { useState } from "react";

import {
  AuthFieldErrors,
  AuthFormState,
  AuthMode,
} from "../types/auth.types";
import {
  normalizeEmail,
  validateAuthForm,
} from "../validation/auth.validation";

const INITIAL_AUTH_FORM: AuthFormState = {
  email: "",
  password: "",
  confirmPassword: "",
};

export function useAuthForm() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [form, setForm] = useState<AuthFormState>(INITIAL_AUTH_FORM);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);

  const isSignUp = mode === "sign-up";
  const title = isSignUp ? "Tạo tài khoản" : "Chào mừng quay lại";
  const subtitle = isSignUp
    ? "Đăng ký để bắt đầu quản lý sức khỏe tại nhà."
    : "Đăng nhập để tiếp tục theo dõi huyết áp và hồ sơ nguy cơ.";

  const resetMessages = () => {
    setSubmitError("");
    setSuccessMessage("");
  };

  const updateField = (field: keyof AuthFormState, value: string) => {
    /*
    Làm 3 việc:
    - Cập nhật giá trị của 1 field trong form
    - Xóa lỗi của field đó nếu có
    - Reset các thông báo lỗi khi người dùng bắt đầu chỉnh sửa form
    */
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (fieldErrors[field]) {
      setFieldErrors((previous) => ({
        ...previous,
        [field]: undefined,
      }));
    }

    resetMessages();
  };

  const switchMode = () => {
    setMode((previous) =>
      previous === "sign-in" ? "sign-up" : "sign-in",
    );
    setForm(INITIAL_AUTH_FORM);
    setFieldErrors({});
    resetMessages();
    setSecurePassword(true);
    setSecureConfirmPassword(true);
  };

  const submit = async () => {
    if (loading) return;

    resetMessages();
    const nextErrors = validateAuthForm(form, mode);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);

    try {
      const email = normalizeEmail(form.email);

      if (isSignUp) {
        const signUpError = await signUp(email, form.password);

        if (signUpError) {
          setSubmitError(signUpError);
          return;
        }

        setSuccessMessage(
          "Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản trước khi đăng nhập.",
        );
        setMode("sign-in");
        setFieldErrors({});
        setForm({
          email,
          password: "",
          confirmPassword: "",
        });
        return;
      }

      const signInError = await signIn(email, form.password);

      if (signInError) {
        setSubmitError(signInError);
        return;
      }

      router.replace("/");
    } catch {
      setSubmitError("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return {
    fieldErrors,
    form,
    isSignUp,
    loading,
    secureConfirmPassword,
    securePassword,
    submitError,
    subtitle,
    successMessage,
    title,
    setSecureConfirmPassword,
    setSecurePassword,
    submit,
    switchMode,
    updateField,
  };
}

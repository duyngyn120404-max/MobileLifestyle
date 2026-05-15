import { useAuth } from "@/src/contexts/auth-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type AuthMode = "sign-in" | "sign-up";

type FormState = {
  email: string;
  password: string;
  confirmPassword: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const MEDICAL_COLORS = {
  background: "#F4F8F8",
  surface: "#FCFEFE",
  surfaceSoft: "#EEF6F6",
  surfaceSoft2: "#E7F1F2",
  primary: "#0E7490",
  primaryDark: "#0B5F73",
  text: "#16323A",
  textMuted: "#5B737B",
  border: "#D8E7E8",
  successBg: "#E8F6F4",
  successText: "#0B5F73",
  errorBg: "#FDECEC",
  errorText: "#B42318",
};

const initialForm: FormState = {
  email: "",
  password: "",
  confirmPassword: "",
};

function PulseArtwork() {
  return (
    <View style={styles.artworkWrap}>
      <View style={styles.artworkCircleLarge} />
      <View style={styles.artworkCircleSmall} />
      <View style={styles.artworkCard}>
        <MaterialCommunityIcons
          name="heart-pulse"
          size={30}
          color={MEDICAL_COLORS.primaryDark}
        />
        <View style={styles.artworkLine} />
        <View style={[styles.artworkLine, styles.artworkLineShort]} />
      </View>
    </View>
  );
}

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [form, setForm] = useState<FormState>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);

  const isSignUp = mode === "sign-up";

  const title = useMemo(() => {
    return isSignUp ? "Tạo tài khoản" : "Chào mừng quay lại";
  }, [isSignUp]);

  const subtitle = useMemo(() => {
    return isSignUp
      ? "Đăng ký để bắt đầu quản lý sức khỏe tại nhà."
      : "Đăng nhập để tiếp tục theo dõi huyết áp và hồ sơ nguy cơ.";
  }, [isSignUp]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }

    if (submitError) setSubmitError("");
    if (successMessage) setSuccessMessage("");
  };

  const normalizeEmail = (value: string) => value.trim().toLowerCase();

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const validateForm = () => {
    const nextErrors: FieldErrors = {};
    const email = normalizeEmail(form.email);
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (!email) {
      nextErrors.email = "Vui lòng nhập email.";
    } else if (!isValidEmail(email)) {
      nextErrors.email = "Email không đúng định dạng.";
    }

    if (!password) {
      nextErrors.password = "Vui lòng nhập mật khẩu.";
    } else if (password.length < 6) {
      nextErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    if (isSignUp) {
      if (!confirmPassword) {
        nextErrors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
      } else if (confirmPassword !== password) {
        nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetMessages = () => {
    setSubmitError("");
    setSuccessMessage("");
  };

  const handleSwitchMode = () => {
    setMode((prev) => (prev === "sign-in" ? "sign-up" : "sign-in"));
    setForm(initialForm);
    setFieldErrors({});
    resetMessages();
    setLoading(false);
    setSecurePassword(true);
    setSecureConfirmPassword(true);
  };

  const handleSubmit = async () => {
    if (loading) return;

    resetMessages();

    const valid = validateForm();
    if (!valid) return;

    setLoading(true);

    try {
      const email = normalizeEmail(form.email);
      const password = form.password;

      if (isSignUp) {
        const signUpError = await signUp(email, password);

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

      const signInError = await signIn(email, password);

      if (signInError) {
        setSubmitError(signInError);
        return;
      }

      router.replace("/");
    } catch (error) {
      setSubmitError("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareScrollView
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={24}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: Math.max(insets.top, 12) + 8,
            paddingBottom: Math.max(insets.bottom, 20) + 24,
          },
        ]}
      >
        <View style={styles.headerBlock}>
          <PulseArtwork />

          <View style={styles.iconRow}>
            <View style={[styles.iconBadge, { backgroundColor: "#E3F2F3" }]}>
              <MaterialCommunityIcons
                name="heart-pulse"
                size={20}
                color={MEDICAL_COLORS.primaryDark}
              />
            </View>

            <View style={[styles.iconBadge, { backgroundColor: "#E8F6F4" }]}>
              <MaterialCommunityIcons
                name="shield-plus"
                size={20}
                color={MEDICAL_COLORS.primaryDark}
              />
            </View>

            <View style={[styles.iconBadge, { backgroundColor: "#EEF6F6" }]}>
              <MaterialCommunityIcons
                name="stethoscope"
                size={20}
                color={MEDICAL_COLORS.primaryDark}
              />
            </View>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.formCard}>
          <TextInput
            label="Email"
            value={form.email}
            onChangeText={(value) => updateField("email", value)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            style={styles.input}
            mode="outlined"
            outlineStyle={styles.inputOutline}
            activeOutlineColor={MEDICAL_COLORS.primary}
            error={!!fieldErrors.email}
            disabled={loading}
          />
          <HelperText type="error" visible={!!fieldErrors.email}>
            {fieldErrors.email}
          </HelperText>

          <TextInput
            label="Mật khẩu"
            value={form.password}
            onChangeText={(value) => updateField("password", value)}
            secureTextEntry={securePassword}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            style={styles.input}
            mode="outlined"
            outlineStyle={styles.inputOutline}
            activeOutlineColor={MEDICAL_COLORS.primary}
            error={!!fieldErrors.password}
            disabled={loading}
            right={
              <TextInput.Icon
                icon={securePassword ? "eye-off" : "eye"}
                onPress={() => setSecurePassword((prev) => !prev)}
              />
            }
          />
          <HelperText type="error" visible={!!fieldErrors.password}>
            {fieldErrors.password}
          </HelperText>

          {isSignUp && (
            <>
              <TextInput
                label="Xác nhận mật khẩu"
                value={form.confirmPassword}
                onChangeText={(value) => updateField("confirmPassword", value)}
                secureTextEntry={secureConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                style={styles.input}
                mode="outlined"
                outlineStyle={styles.inputOutline}
                activeOutlineColor={MEDICAL_COLORS.primary}
                error={!!fieldErrors.confirmPassword}
                disabled={loading}
                right={
                  <TextInput.Icon
                    icon={secureConfirmPassword ? "eye-off" : "eye"}
                    onPress={() => setSecureConfirmPassword((prev) => !prev)}
                  />
                }
              />
              <HelperText type="error" visible={!!fieldErrors.confirmPassword}>
                {fieldErrors.confirmPassword}
              </HelperText>
            </>
          )}

          {!!submitError && (
            <View style={[styles.messageBox, styles.errorBox]}>
              <Text style={styles.errorText}>{submitError}</Text>
            </View>
          )}

          {!!successMessage && (
            <View style={[styles.messageBox, styles.successBox]}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            buttonColor={MEDICAL_COLORS.primary}
            labelStyle={styles.submitButtonLabel}
          >
            {isSignUp ? "Tạo tài khoản" : "Đăng nhập"}
          </Button>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {isSignUp ? "Đã có tài khoản?" : "Chưa có tài khoản?"}
            </Text>

            <Pressable onPress={handleSwitchMode} disabled={loading}>
              <Text style={styles.switchLink}>
                {isSignUp ? " Đăng nhập" : " Đăng ký"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MEDICAL_COLORS.background,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  headerBlock: {
    alignItems: "center",
    marginBottom: 18,
  },
  artworkWrap: {
    width: 180,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  artworkCircleLarge: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E7F1F2",
  },
  artworkCircleSmall: {
    position: "absolute",
    top: 14,
    right: 26,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#DDF3F0",
  },
  artworkCard: {
    width: 110,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: MEDICAL_COLORS.surface,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
    alignItems: "center",
    shadowColor: "#0B5F73",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  artworkLine: {
    width: 56,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E7F1F2",
    marginTop: 10,
  },
  artworkLineShort: {
    width: 40,
  },
  iconRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
  },
  title: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: "900",
    color: MEDICAL_COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: MEDICAL_COLORS.textMuted,
    textAlign: "center",
    maxWidth: 320,
  },
  formCard: {
    backgroundColor: MEDICAL_COLORS.surface,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
    borderRadius: 24,
    padding: 18,
    shadowColor: "#0B5F73",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  input: {
    backgroundColor: MEDICAL_COLORS.surface,
    marginBottom: 2,
  },
  inputOutline: {
    borderRadius: 18,
    borderColor: MEDICAL_COLORS.border,
  },
  messageBox: {
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
    marginBottom: 10,
  },
  successBox: {
    backgroundColor: MEDICAL_COLORS.successBg,
  },
  successText: {
    color: MEDICAL_COLORS.successText,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
  },
  errorBox: {
    backgroundColor: MEDICAL_COLORS.errorBg,
  },
  errorText: {
    color: MEDICAL_COLORS.errorText,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 18,
  },
  submitButtonContent: {
    height: 52,
  },
  submitButtonLabel: {
    fontSize: 15,
    fontWeight: "800",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
    flexWrap: "wrap",
  },
  switchText: {
    color: MEDICAL_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  switchLink: {
    color: MEDICAL_COLORS.primaryDark,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },
});

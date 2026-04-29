import { useAuth } from "@/src/contexts/auth-context";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    View,
} from "react-native";
import {
    Button,
    HelperText,
    Text,
    TextInput,
    useTheme,
} from "react-native-paper";

type AuthMode = "sign-in" | "sign-up";

type FormState = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function AuthScreen() {
  const router = useRouter();
  const theme = useTheme();
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
    return isSignUp ? "Create your account" : "Welcome back";
  }, [isSignUp]);

  const subtitle = useMemo(() => {
    return isSignUp
      ? "Sign up to start using your workspace."
      : "Sign in to continue to your workspace.";
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

  const validateForm = (): boolean => {
    const nextErrors: FieldErrors = {};
    const fullName = form.fullName.trim();
    const email = normalizeEmail(form.email);
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (isSignUp && !fullName) {
      nextErrors.fullName = "Please enter your full name.";
    }

    if (!email) {
      nextErrors.email = "Please enter your email.";
    } else if (!isValidEmail(email)) {
      nextErrors.email = "Email format is invalid.";
    }

    if (!password) {
      nextErrors.password = "Please enter your password.";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    if (isSignUp) {
      if (!confirmPassword) {
        nextErrors.confirmPassword = "Please confirm your password.";
      } else if (confirmPassword !== password) {
        nextErrors.confirmPassword = "Passwords do not match.";
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
      const fullName = form.fullName.trim();

      if (isSignUp) {
        const signUpError = await signUp(email, password, fullName);

        if (signUpError) {
          setSubmitError(signUpError);
          return;
        }

        setSuccessMessage(
          "Registration successful. Please check your email to verify your account.",
        );
        setForm({
          fullName: "",
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
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text variant="headlineMedium" style={styles.title}>
            {title}
          </Text>

          <Text
            variant="bodyMedium"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            {subtitle}
          </Text>

          {isSignUp && (
            <>
              <TextInput
                mode="outlined"
                label="Full name"
                placeholder="Tran Luong"
                value={form.fullName}
                onChangeText={(value) => updateField("fullName", value)}
                autoCapitalize="words"
                autoCorrect={false}
                style={styles.input}
                error={!!fieldErrors.fullName}
                disabled={loading}
              />
              <HelperText type="error" visible={!!fieldErrors.fullName}>
                {fieldErrors.fullName}
              </HelperText>
            </>
          )}

          <TextInput
            mode="outlined"
            label="Email"
            placeholder="you@example.com"
            value={form.email}
            onChangeText={(value) => updateField("email", value)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            style={styles.input}
            error={!!fieldErrors.email}
            disabled={loading}
          />
          <HelperText type="error" visible={!!fieldErrors.email}>
            {fieldErrors.email}
          </HelperText>

          <TextInput
            mode="outlined"
            label="Password"
            value={form.password}
            onChangeText={(value) => updateField("password", value)}
            secureTextEntry={securePassword}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            style={styles.input}
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
                mode="outlined"
                label="Confirm password"
                value={form.confirmPassword}
                onChangeText={(value) => updateField("confirmPassword", value)}
                secureTextEntry={secureConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                style={styles.input}
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
            <View
              style={[
                styles.messageBox,
                {
                  backgroundColor: theme.colors.errorContainer,
                },
              ]}
            >
              <Text style={{ color: theme.colors.onErrorContainer }}>
                {submitError}
              </Text>
            </View>
          )}

          {!!successMessage && (
            <View
              style={[
                styles.messageBox,
                {
                  backgroundColor: theme.colors.primaryContainer,
                },
              ]}
            >
              <Text style={{ color: theme.colors.onPrimaryContainer }}>
                {successMessage}
              </Text>
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          >
            {isSignUp ? "Create account" : "Sign in"}
          </Button>

          <View style={styles.switchRow}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
            </Text>

            <Pressable onPress={handleSwitchMode} disabled={loading}>
              <Text style={{ color: theme.colors.primary, fontWeight: "700" }}>
                {isSignUp ? " Sign in" : " Sign up"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    elevation: 2,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "700",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    marginBottom: 2,
  },
  messageBox: {
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  submitButtonContent: {
    height: 48,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    flexWrap: "wrap",
  },
});

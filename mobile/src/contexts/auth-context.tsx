import { authClient } from "@/src/api/authClient";
import { logger } from "@/src/utils/logger";
import { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  user: User | null;
  isLoadingUser: boolean;
  signUp: (email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const NETWORK_ERROR_MESSAGE =
  "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.";

function getUserFacingAuthError(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") return fallback;

  const authError = error as { name?: unknown; message?: unknown };
  const errorName = typeof authError.name === "string" ? authError.name : "";
  const errorMessage =
    typeof authError.message === "string" ? authError.message : "";

  const message = errorMessage.toLowerCase();
  if (
    errorName === "TypeError" ||
    message.includes("network request failed") ||
    message.includes("failed to fetch")
  ) {
    return NETWORK_ERROR_MESSAGE;
  }

  return errorMessage || fallback;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    restoreSession();

    const {
      data: { subscription },
    } = authClient.onAuthStateChange(async (_event, session) => {
      logger.info("auth.state", "changed", {
        event: _event,
        userId: session?.user?.id ?? null,
      });
      setUser(session?.user ?? null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const restoreSession = async () => {
    try {
      const {
        data: { session },
        error,
      } = await authClient.getSession();

      if (error) {
        throw error;
      }

      setUser(session?.user ?? null);
    } catch (error) {
      logger.error("auth.restoreSession", "failed", error);
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const {
        data: { session, user: newUser },
        error: signUpError,
      } = await authClient.signUp(email, password);

      if (signUpError) {
        logger.warn("auth.signUp", "failed", {
          errorName: signUpError.name,
          errorMessage: signUpError.message,
        });
        return getUserFacingAuthError(
          signUpError,
          "Không thể đăng ký tài khoản. Vui lòng thử lại.",
        );
      }

      if (!newUser?.id) {
        logger.error("auth.signUp", "failed", "Failed to create user account");
        return "Failed to create user account";
      }

      if (session) {
        const { error: signOutError } = await authClient.signOut();
        if (signOutError) {
          logger.error("auth.signUp", "post sign-up sign out failed", signOutError);
          return getUserFacingAuthError(
            signOutError,
            "Đăng ký thành công nhưng không thể kết thúc phiên tự động. Vui lòng thử lại.",
          );
        }
        setUser(null);
      }

      return null;
    } catch (error) {
      logger.error("auth.signUp", "failed", error);
      return getUserFacingAuthError(
        error,
        "Không thể đăng ký tài khoản. Vui lòng thử lại.",
      );
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const {
        data: { user: signInUser },
        error,
      } = await authClient.signIn(email, password);

      if (error) {
        logger.warn("auth.signIn", "failed", {
          errorName: error.name,
          errorMessage: error.message,
        });
        return getUserFacingAuthError(
          error,
          "Không thể đăng nhập. Vui lòng thử lại.",
        );
      }

      setUser(signInUser);
      return null;
    } catch (error) {
      logger.error("auth.signIn", "failed", error);
      return getUserFacingAuthError(
        error,
        "Không thể đăng nhập. Vui lòng thử lại.",
      );
    }
  };

  const signOut = async () => {
    try {
      logger.info("auth.signOut", "started", { userId: user?.id ?? null });
      const { error } = await authClient.signOut();
      if (error) {
        logger.error("auth.signOut", "failed", error);
      }
      setUser(null);
    } catch (error) {
      logger.error("auth.signOut", "failed", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoadingUser,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

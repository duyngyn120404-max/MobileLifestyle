import { authClient } from "@/src/api/authClient";
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    restoreSession();

    const {
      data: { subscription },
    } = authClient.onAuthStateChange(async (_event, session) => {
      console.log(
        "[auth] onAuthStateChange event:",
        _event,
        "user:",
        session?.user?.id ?? null,
      );
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
    } catch {
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const {
        data: { user: newUser },
        error: signUpError,
      } = await authClient.signUp(email, password);

      if (signUpError) {
        return signUpError.message;
      }

      if (!newUser?.id) {
        return "Failed to create user account";
      }

      return null;
    } catch (error) {
      if (error instanceof Error) {
        return error.message;
      }

      return "An error occurred during sign up.";
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const {
        data: { user: signInUser },
        error,
      } = await authClient.signIn(email, password);

      if (error) {
        return error.message;
      }

      setUser(signInUser);
      return null;
    } catch (error) {
      if (error instanceof Error) {
        return error.message;
      }
      return "An error occurred during sign in.";
    }
  };

  const signOut = async () => {
    try {
      console.log("[auth] signOut called");
      const { error } = await authClient.signOut();
      console.log("[auth] supabase.auth.signOut result, error:", error);
      setUser(null);
    } catch (error) {
      console.log("[auth] signOut exception:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoadingUser, signUp, signIn, signOut }}
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

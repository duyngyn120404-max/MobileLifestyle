import { supabase } from "@/src/config/supabase";

import { apiClient } from "./apiClient";
import { API_ROUTES } from "../config/apiRoutes";

export interface BackendCurrentUser {
  user: {
    id: string;
    email: string | null;
    role: string | null;
  };
}

export const authClient = {
  signUp(email: string, password: string) {
    return supabase.auth.signUp({ email, password });
  },

  signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  signOut() {
    return supabase.auth.signOut();
  },

  getSession() {
    return supabase.auth.getSession();
  },

  getUser() {
    return supabase.auth.getUser();
  },

  getBackendCurrentUser() {
    return apiClient.get<BackendCurrentUser>(API_ROUTES.auth.me);
  },

  onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

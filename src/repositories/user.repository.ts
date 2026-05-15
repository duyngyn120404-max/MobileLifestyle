import { supabaseUserApi } from "@/src/config/supabaseApi";

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  phone_number?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  birth_year?: number | null;
  age?: number | null;
  height?: number | null;
  weight?: number | null;
}

export type UpdateUserProfile = Omit<UserProfile, "id">;

export const userRepository = {
  async getById(
    userId: string,
  ): Promise<{ data: UserProfile | null; error: unknown }> {
    try {
      const { data, error } = await supabaseUserApi.findById(userId);
      if (error) throw error;
      return { data: (data as UserProfile) ?? null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async create(
    userId: string,
    email: string,
    fullName?: string,
  ): Promise<{ data: UserProfile | null; error: unknown }> {
    try {
      const { data, error } = await supabaseUserApi.create(
        userId,
        email,
        fullName,
      );
      if (error) throw error;
      return { data: (data?.[0] as UserProfile) ?? null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async update(
    userId: string,
    updates: Partial<UpdateUserProfile>,
  ): Promise<{ data: UserProfile | null; error: unknown }> {
    try {
      const { data, error } = await supabaseUserApi.update(userId, updates);
      if (error) throw error;
      return { data: (data?.[0] as UserProfile) ?? null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};

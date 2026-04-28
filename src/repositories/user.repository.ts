import { supabaseUserApi } from '@/src/config/supabaseApi';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
  birth_year?: number;
}

export type UpdateUserProfile = Omit<UserProfile, 'id'>;

export const userRepository = {
  async create(userId: string, email: string, fullName?: string): Promise<{ data: UserProfile | null; error: unknown }> {
    try {
      const { data, error } = await supabaseUserApi.create(userId, email, fullName);
      if (error) throw error;
      return { data: data?.[0] as UserProfile, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async update(userId: string, updates: Partial<UpdateUserProfile>): Promise<{ data: UserProfile | null; error: unknown }> {
    try {
      const { data, error } = await supabaseUserApi.update(userId, updates);
      if (error) throw error;
      return { data: data?.[0] as UserProfile, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};

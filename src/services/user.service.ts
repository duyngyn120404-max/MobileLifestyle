import { userRepository, UserProfile, UpdateUserProfile } from '@/src/repositories/user.repository';

export const userService = {
  async createProfile(userId: string, email: string, fullName?: string): Promise<UserProfile> {
    const { data, error } = await userRepository.create(userId, email, fullName);
    if (error) throw error;
    if (!data) throw new Error('Failed to create user profile');
    return data;
  },

  async updateProfile(userId: string, updates: Partial<UpdateUserProfile>): Promise<UserProfile> {
    const { data, error } = await userRepository.update(userId, updates);
    if (error) throw error;
    if (!data) throw new Error('Failed to update user profile');
    return data;
  },
};

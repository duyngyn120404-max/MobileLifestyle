import {
  userRepository,
  type UpdateUserProfile,
} from "@/src/repositories/user.repository";

export const userService = {
  async getProfile(userId: string) {
    const { data, error } = await userRepository.getById(userId);

    if (error) {
      throw error instanceof Error
        ? error
        : new Error("Không thể tải hồ sơ người dùng.");
    }

    return data;
  },

  async updateProfile(userId: string, updates: Partial<UpdateUserProfile>) {
    const { data, error } = await userRepository.update(userId, updates);

    if (error) {
      throw error instanceof Error
        ? error
        : new Error("Không thể cập nhật hồ sơ người dùng.");
    }

    return data;
  },
};

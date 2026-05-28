import { apiClient } from "@/src/api/apiClient";
import { API_ROUTES } from "@/src/config/apiRoutes";
import type {
  Profile,
  UpdateProfileRequest,
} from "@/src/features/profile/types/profile.types";

export const profileClient = {
  getMe() {
    return apiClient.get<Profile>(API_ROUTES.profile.me);
  },

  updateMe(payload: UpdateProfileRequest) {
    return apiClient.patch<Profile>(API_ROUTES.profile.me, payload);
  },
};

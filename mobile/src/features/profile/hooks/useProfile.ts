import { profileClient } from "@/src/api/profileClient";
import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

import type {
  GenderValue,
  Profile,
  ProfileFormState,
} from "../types/profile.types";
import { buildProfileUpdateRequest } from "../validation/profile.validation";

const EMPTY_FORM: ProfileFormState = {
  fullName: "",
  phoneNumber: "",
  gender: "",
  age: "",
  height: "",
  weight: "",
};

export function useProfile(user: User | null) {
  const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [email, setEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyProfile = useCallback(
    (profile: Profile | null) => {
      setEmail(profile?.email ?? user?.email ?? "");
      setForm({
        fullName:
          profile?.fullName ??
          (user?.user_metadata?.full_name as string | undefined) ??
          (user?.user_metadata?.name as string | undefined) ??
          user?.email ??
          "User",
        phoneNumber: profile?.phoneNumber ?? "",
        gender: profile?.gender ?? "",
        age: profile?.age === null || profile?.age === undefined ? "" : String(profile.age),
        height:
          profile?.height === null || profile?.height === undefined
            ? ""
            : String(profile.height),
        weight:
          profile?.weight === null || profile?.weight === undefined
            ? ""
            : String(profile.weight),
      });
    },
    [user],
  );

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const profile = await profileClient.getMe();
      applyProfile(profile);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải hồ sơ người dùng.";
      setError(message);
      applyProfile(null);
      Alert.alert("Không thể tải hồ sơ", message);
    } finally {
      setIsLoading(false);
    }
  }, [applyProfile, user?.id]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const updateField = <K extends keyof ProfileFormState>(
    field: K,
    value: ProfileFormState[K],
  ) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError(null);
  };

  const saveProfile = useCallback(async () => {
    let payload;
    try {
      payload = buildProfileUpdateRequest(form);
    } catch (validationError) {
      const message =
        validationError instanceof Error
          ? validationError.message
          : "Dữ liệu hồ sơ không hợp lệ.";
      Alert.alert("Dữ liệu không hợp lệ", message);
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      const profile = await profileClient.updateMe(payload);
      applyProfile(profile);
      setIsEditing(false);
      Alert.alert("Thành công", "Cập nhật thông tin thành công!");
      return true;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Không thể cập nhật thông tin.";
      setError(message);
      Alert.alert("Lỗi", message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [applyProfile, form]);

  const toggleEdit = useCallback(async () => {
    if (isEditing) {
      return saveProfile();
    }

    setIsEditing(true);
    return true;
  }, [isEditing, saveProfile]);

  return {
    age: form.age,
    email,
    error,
    fullName: form.fullName,
    gender: form.gender,
    height: form.height,
    isEditing,
    isLoading,
    isSaving,
    phoneNumber: form.phoneNumber,
    weight: form.weight,
    loadProfile,
    setAge: (value: string) => updateField("age", value),
    setFullName: (value: string) => updateField("fullName", value),
    setGender: (value: Exclude<GenderValue, null> | "") => updateField("gender", value),
    setHeight: (value: string) => updateField("height", value),
    setPhoneNumber: (value: string) => updateField("phoneNumber", value),
    setWeight: (value: string) => updateField("weight", value),
    toggleEdit,
  };
}

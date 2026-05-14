import { userService } from "@/src/services/user.service";
import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

type GenderValue = "male" | "female" | "other" | "";

export const useProfileController = (user: User | null) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<GenderValue>("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");

  const applyProfileData = useCallback(
    (profile: any | null) => {
      setFullName(
        profile?.full_name ||
          (user?.user_metadata?.full_name as string | undefined) ||
          (user?.user_metadata?.name as string | undefined) ||
          user?.email ||
          "User",
      );

      setEmail(profile?.email || user?.email || "");
      setPhone(profile?.phone_number || "");

      const dbGender = (profile?.gender || "").toLowerCase();
      if (
        dbGender === "male" ||
        dbGender === "female" ||
        dbGender === "other"
      ) {
        setGender(dbGender);
      } else {
        setGender("");
      }

      setAge(
        profile?.age !== null && profile?.age !== undefined
          ? String(profile.age)
          : "",
      );
      setHeight(
        profile?.height !== null && profile?.height !== undefined
          ? String(profile.height)
          : "",
      );
      setWeight(
        profile?.weight !== null && profile?.weight !== undefined
          ? String(profile.weight)
          : "",
      );
    },
    [user],
  );

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const profile = await userService.getProfile(user.id);
      applyProfileData(profile);
    } catch (error) {
      applyProfileData(null);
    } finally {
      setIsLoading(false);
    }
  }, [user, applyProfileData]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const validateProfile = useCallback(() => {
    if (!fullName.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập họ và tên.");
      return false;
    }

    if (age.trim() && Number.isNaN(Number(age))) {
      Alert.alert("Dữ liệu không hợp lệ", "Tuổi phải là số.");
      return false;
    }

    if (height.trim() && Number.isNaN(Number(height))) {
      Alert.alert("Dữ liệu không hợp lệ", "Chiều cao phải là số.");
      return false;
    }

    if (weight.trim() && Number.isNaN(Number(weight))) {
      Alert.alert("Dữ liệu không hợp lệ", "Cân nặng phải là số.");
      return false;
    }

    return true;
  }, [fullName, age, height, weight]);

  const saveProfile = useCallback(async () => {
    if (!user?.id) {
      throw new Error("Không tìm thấy người dùng hiện tại.");
    }

    if (!validateProfile()) return false;

    try {
      setIsSaving(true);

      const updatedProfile = await userService.updateProfile(user.id, {
        full_name: fullName.trim(),
        email: email.trim() || user.email || "",
        phone_number: phone.trim() || null,
        gender: gender || null,
        age: age.trim() ? Number(age) : null,
        height: height.trim() ? Number(height) : null,
        weight: weight.trim() ? Number(weight) : null,
      });

      applyProfileData(updatedProfile);
      setIsEditing(false);
      Alert.alert("Thành công", "Cập nhật thông tin thành công!");
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể cập nhật thông tin";
      Alert.alert("Lỗi", message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [
    user,
    fullName,
    email,
    phone,
    gender,
    age,
    height,
    weight,
    validateProfile,
    applyProfileData,
  ]);

  const toggleEdit = useCallback(async () => {
    if (isEditing) {
      return await saveProfile();
    }

    setIsEditing(true);
    return true;
  }, [isEditing, saveProfile]);

  return {
    isEditing,
    isSaving,
    isLoading,
    fullName,
    email,
    phone,
    gender,
    height,
    weight,
    age,
    setFullName,
    setEmail,
    setPhone,
    setGender,
    setHeight,
    setWeight,
    setAge,
    toggleEdit,
    reloadProfile: loadProfile,
  };
};

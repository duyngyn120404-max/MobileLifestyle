import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { userService } from '@/src/services/user.service';
import type { User } from '@supabase/supabase-js';

export const useProfileController = (user: User | null) => {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || user?.email || 'User');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const saveProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsSaving(true);
      await userService.updateProfile(user.id, {
        full_name: fullName,
        email,
        phone_number: phone,
      });
      setIsEditing(false);
      Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể cập nhật thông tin');
    } finally {
      setIsSaving(false);
    }
  }, [user, fullName, email, phone]);

  const toggleEdit = useCallback(() => {
    if (isEditing) {
      saveProfile();
    } else {
      setIsEditing(true);
    }
  }, [isEditing, saveProfile]);

  return {
    isEditing,
    fullName,
    email,
    phone,
    height,
    weight,
    age,
    isSaving,
    setFullName,
    setEmail,
    setPhone,
    setHeight,
    setWeight,
    setAge,
    toggleEdit,
  };
};

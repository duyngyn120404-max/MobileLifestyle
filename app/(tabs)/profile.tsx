import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Chip, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useProfileController } from "@/src/controllers/useProfileController";
import { useAuth } from "../../src/contexts/auth-context";

const MEDICAL_COLORS = {
  background: "#F4F8F8",
  surface: "#FCFEFE",
  surfaceSoft: "#EEF6F6",
  surfaceSoft2: "#E7F1F2",
  primary: "#0E7490",
  primaryDark: "#0B5F73",
  text: "#16323A",
  textMuted: "#5B737B",
  border: "#D8E7E8",
  white: "#FFFFFF",
  danger: "#D9485F",
  dangerSoft: "#FDECEE",
};

const GENDER_OPTIONS = [
  { label: "Nam", value: "male" },
  { label: "Nữ", value: "female" },
  { label: "Khác", value: "other" },
] as const;

type SettingLinkProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle?: string;
  backgroundColor: string;
  onPress: () => void;
  isLast?: boolean;
};

type SwitchRowProps = {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
};

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  editable?: boolean;
  helperText?: string;
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const {
    isEditing,
    fullName,
    email,
    phone,
    gender,
    height,
    weight,
    age,
    isSaving,
    setFullName,
    setEmail,
    setPhone,
    setGender,
    setHeight,
    setWeight,
    setAge,
    toggleEdit,
  } = useProfileController(user);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showPrivacySecurity, setShowPrivacySecurity] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [settings, setSettings] = useState({
    pushNotifications: true,
    reminders: true,
    emailNotifications: true,
    twoFactorAuth: false,
  });

  const displayName =
    fullName?.trim() ||
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    "Người dùng";

  const displayEmail = email?.trim() || user?.email || "Chưa cập nhật email";

  const displayGender =
    GENDER_OPTIONS.find((item) => item.value === gender)?.label || "--";

  const initials = useMemo(() => {
    const source = displayName.trim();
    if (!source) return "U";

    const parts = source.split(" ").filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }, [displayName]);

  const validateProfileData = () => {
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
  };

  const handleToggleEdit = async () => {
    if (isEditing && !validateProfileData()) return;

    try {
      await toggleEdit();
    } catch (error: any) {
      Alert.alert(
        "Không thể cập nhật thông tin",
        error?.message || "Không thể lưu thông tin hồ sơ.",
      );
    }
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất không?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/(auth)");
          } catch (error) {
            Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
          }
        },
      },
    ]);
  };

  const renderInputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    editable = isEditing,
    helperText,
  }: InputFieldProps) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={MEDICAL_COLORS.textMuted}
        keyboardType={keyboardType}
      />
      {!!helperText && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );

  const renderSettingLink = ({
    icon,
    title,
    subtitle,
    backgroundColor,
    onPress,
    isLast = false,
  }: SettingLinkProps) => (
    <TouchableOpacity
      style={[styles.settingItem, isLast && styles.settingItemLast]}
      onPress={onPress}
      activeOpacity={0.92}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIconWrap, { backgroundColor }]}>
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={MEDICAL_COLORS.primaryDark}
          />
        </View>

        <View style={styles.settingContent}>
          <Text style={styles.settingText}>{title}</Text>
          {!!subtitle && <Text style={styles.settingSubtext}>{subtitle}</Text>}
        </View>
      </View>

      <View style={styles.chevronWrap}>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={MEDICAL_COLORS.textMuted}
        />
      </View>
    </TouchableOpacity>
  );

  const renderSwitchRow = ({
    label,
    description,
    value,
    onValueChange,
    isLast = false,
  }: SwitchRowProps) => (
    <View style={[styles.modalSettingRow, isLast && styles.settingItemLast]}>
      <View style={styles.modalSettingContent}>
        <Text style={styles.modalSettingLabel}>{label}</Text>
        <Text style={styles.modalSettingDescription}>{description}</Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#C6D6D8", true: "#8CCFDB" }}
        thumbColor={value ? MEDICAL_COLORS.primary : "#F4F4F4"}
      />
    </View>
  );

  const renderGenderSelector = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>Giới tính</Text>

      <View style={styles.genderRow}>
        {GENDER_OPTIONS.map((item) => {
          const active = gender === item.value;

          return (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.genderChip,
                active && styles.genderChipActive,
                !isEditing && styles.genderChipDisabled,
              ]}
              onPress={() => {
                if (!isEditing) return;
                setGender(item.value);
              }}
              activeOpacity={0.92}
            >
              <Text
                style={[
                  styles.genderChipText,
                  active && styles.genderChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!isEditing && (
        <Text style={styles.helperText}>
          Giới tính hiện tại: {displayGender}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <Chip
              compact
              style={styles.heroChip}
              textStyle={styles.heroChipText}
            >
              Tài khoản cá nhân
            </Chip>
          </View>

          <Text style={styles.heroEyebrow}>Hồ sơ sức khỏe</Text>
          <Text style={styles.heroTitle}>{displayName}</Text>
          <Text style={styles.heroSubtitle}>{displayEmail}</Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{age || "--"}</Text>
              <Text style={styles.heroStatLabel}>Tuổi</Text>
            </View>

            <View style={styles.heroStatDivider} />

            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{height || "--"}</Text>
              <Text style={styles.heroStatLabel}>Chiều cao</Text>
            </View>

            <View style={styles.heroStatDivider} />

            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{weight || "--"}</Text>
              <Text style={styles.heroStatLabel}>Cân nặng</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleToggleEdit}
          activeOpacity={0.92}
        >
          <MaterialCommunityIcons
            name={isEditing ? "content-save-outline" : "account-edit-outline"}
            size={20}
            color={MEDICAL_COLORS.white}
          />
          <Text style={styles.primaryButtonText}>
            {isSaving
              ? "Đang lưu..."
              : isEditing
                ? "Lưu thay đổi"
                : "Chỉnh sửa hồ sơ"}
          </Text>
        </TouchableOpacity>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          <Text style={styles.sectionSubtitle}>
            Bạn có thể cập nhật họ tên, số điện thoại và giới tính tại đây.
          </Text>

          {renderInputField({
            label: "Họ và tên",
            value: fullName,
            onChangeText: setFullName,
            placeholder: "Nhập họ và tên",
            editable: isEditing,
          })}

          {renderInputField({
            label: "Email",
            value: displayEmail,
            placeholder: "Email",
            editable: false,
            helperText:
              "Email đăng nhập không chỉnh sửa trực tiếp tại màn hình hồ sơ.",
          })}

          {renderInputField({
            label: "Số điện thoại",
            value: phone,
            onChangeText: setPhone,
            placeholder: "Nhập số điện thoại",
            keyboardType: "phone-pad",
            editable: isEditing,
          })}

          {renderGenderSelector()}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Chỉ số sức khỏe</Text>
          <Text style={styles.sectionSubtitle}>
            Tuổi, chiều cao và cân nặng có thể cập nhật khi bật chỉnh sửa.
          </Text>

          <View style={styles.rowContainer}>
            <View style={styles.halfWidth}>
              {renderInputField({
                label: "Chiều cao (cm)",
                value: height,
                onChangeText: setHeight,
                placeholder: "Ví dụ: 170",
                keyboardType: "numeric",
                editable: isEditing,
              })}
            </View>

            <View style={styles.halfWidth}>
              {renderInputField({
                label: "Cân nặng (kg)",
                value: weight,
                onChangeText: setWeight,
                placeholder: "Ví dụ: 65",
                keyboardType: "numeric",
                editable: isEditing,
              })}
            </View>
          </View>

          {renderInputField({
            label: "Tuổi",
            value: age,
            onChangeText: setAge,
            placeholder: "Ví dụ: 28",
            keyboardType: "numeric",
            editable: isEditing,
          })}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Thiết lập tài khoản</Text>
          <Text style={styles.sectionSubtitle}>
            Quản lý thông báo, bảo mật và các mục hỗ trợ khác.
          </Text>

          {renderSettingLink({
            icon: "bell-outline",
            title: "Thông báo",
            subtitle: "Quản lý nhắc nhở và cập nhật sức khỏe",
            backgroundColor: "#E8F6F4",
            onPress: () => setShowNotifications(true),
          })}

          {renderSettingLink({
            icon: "shield-lock-outline",
            title: "Quyền riêng tư & bảo mật",
            subtitle: "Mật khẩu và bảo vệ tài khoản",
            backgroundColor: "#E7F1F2",
            onPress: () => setShowPrivacySecurity(true),
          })}

          {renderSettingLink({
            icon: "help-circle-outline",
            title: "Trợ giúp & hỗ trợ",
            subtitle: "FAQ, hỗ trợ và thông tin phiên bản",
            backgroundColor: "#EEF6F6",
            onPress: () => setShowHelp(true),
            isLast: true,
          })}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.92}
        >
          <MaterialCommunityIcons
            name="logout"
            size={20}
            color={MEDICAL_COLORS.danger}
          />
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>

        <View style={styles.footerSpace} />
      </ScrollView>

      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowNotifications(false)}
      >
        <SafeAreaView style={styles.modalScreen}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Thông báo</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowNotifications(false)}
            >
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={MEDICAL_COLORS.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            <View style={styles.modalCard}>
              {renderSwitchRow({
                label: "Push Notifications",
                description: "Nhận cảnh báo sức khỏe và cập nhật từ hệ thống",
                value: settings.pushNotifications,
                onValueChange: (value) =>
                  setSettings({ ...settings, pushNotifications: value }),
              })}

              {renderSwitchRow({
                label: "Nhắc nhở hằng ngày",
                description: "Nhắc bạn nhập dữ liệu sức khỏe mỗi ngày",
                value: settings.reminders,
                onValueChange: (value) =>
                  setSettings({ ...settings, reminders: value }),
              })}

              {renderSwitchRow({
                label: "Email Notifications",
                description: "Nhận báo cáo tổng hợp sức khỏe qua email",
                value: settings.emailNotifications,
                onValueChange: (value) =>
                  setSettings({ ...settings, emailNotifications: value }),
                isLast: true,
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showPrivacySecurity}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowPrivacySecurity(false)}
      >
        <SafeAreaView style={styles.modalScreen}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Quyền riêng tư & bảo mật</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPrivacySecurity(false)}
            >
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={MEDICAL_COLORS.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            <View style={styles.modalCard}>
              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.92}
              >
                <MaterialCommunityIcons
                  name="lock-reset"
                  size={20}
                  color={MEDICAL_COLORS.primary}
                />
                <Text style={styles.actionButtonText}>Đổi mật khẩu</Text>
              </TouchableOpacity>

              {renderSwitchRow({
                label: "Xác thực hai lớp",
                description: "Thêm một lớp bảo vệ cho tài khoản của bạn",
                value: settings.twoFactorAuth,
                onValueChange: (value) =>
                  setSettings({ ...settings, twoFactorAuth: value }),
                isLast: true,
              })}

              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                activeOpacity={0.92}
                onPress={() =>
                  Alert.alert(
                    "Xóa tài khoản",
                    "Bạn có chắc muốn xóa tài khoản? Hành động này không thể hoàn tác.",
                    [
                      { text: "Hủy", style: "cancel" },
                      {
                        text: "Xóa",
                        style: "destructive",
                        onPress: () =>
                          Alert.alert(
                            "Thông báo",
                            "Đã xử lý yêu cầu xóa tài khoản.",
                          ),
                      },
                    ],
                  )
                }
              >
                <MaterialCommunityIcons
                  name="delete-outline"
                  size={20}
                  color={MEDICAL_COLORS.danger}
                />
                <Text style={styles.dangerButtonText}>Xóa tài khoản</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showHelp}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowHelp(false)}
      >
        <SafeAreaView style={styles.modalScreen}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Trợ giúp & hỗ trợ</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowHelp(false)}
            >
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={MEDICAL_COLORS.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            <View style={styles.modalCard}>
              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.92}
              >
                <MaterialCommunityIcons
                  name="frequently-asked-questions"
                  size={20}
                  color={MEDICAL_COLORS.primary}
                />
                <Text style={styles.actionButtonText}>FAQ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.92}
              >
                <MaterialCommunityIcons
                  name="message-processing-outline"
                  size={20}
                  color={MEDICAL_COLORS.primary}
                />
                <Text style={styles.actionButtonText}>Liên hệ hỗ trợ</Text>
              </TouchableOpacity>

              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>App Version</Text>
                <Text style={styles.infoValue}>v1.0.0</Text>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Build</Text>
                <Text style={styles.infoValue}>1</Text>
              </View>

              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.92}
              >
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={20}
                  color={MEDICAL_COLORS.primary}
                />
                <Text style={styles.actionButtonText}>
                  Chính sách quyền riêng tư
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.92}
              >
                <MaterialCommunityIcons
                  name="scale-balance"
                  size={20}
                  color={MEDICAL_COLORS.primary}
                />
                <Text style={styles.actionButtonText}>Điều khoản sử dụng</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MEDICAL_COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: MEDICAL_COLORS.background,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },

  heroCard: {
    backgroundColor: MEDICAL_COLORS.surface,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
    borderRadius: 28,
    padding: 20,
    marginBottom: 18,
    shadowColor: "#0B5F73",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  avatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#E3F2F3",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "900",
    color: MEDICAL_COLORS.primaryDark,
  },
  heroChip: {
    backgroundColor: "#E8F6F4",
  },
  heroChipText: {
    color: MEDICAL_COLORS.primaryDark,
    fontSize: 12,
    fontWeight: "800",
  },
  heroEyebrow: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: MEDICAL_COLORS.primaryDark,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "900",
    color: MEDICAL_COLORS.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: MEDICAL_COLORS.textMuted,
    marginBottom: 18,
  },
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: MEDICAL_COLORS.surfaceSoft,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DCE9EA",
    overflow: "hidden",
  },
  heroStatCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: MEDICAL_COLORS.border,
  },
  heroStatValue: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
    color: MEDICAL_COLORS.text,
    marginBottom: 4,
    textAlign: "center",
  },
  heroStatLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: MEDICAL_COLORS.textMuted,
    textAlign: "center",
  },

  primaryButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: MEDICAL_COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
    shadowColor: "#0B5F73",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  primaryButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: MEDICAL_COLORS.white,
  },

  sectionCard: {
    backgroundColor: MEDICAL_COLORS.surface,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "900",
    color: MEDICAL_COLORS.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: MEDICAL_COLORS.textMuted,
    marginBottom: 16,
  },

  fieldContainer: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: MEDICAL_COLORS.primaryDark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: MEDICAL_COLORS.surfaceSoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    lineHeight: 20,
    color: MEDICAL_COLORS.text,
  },
  inputDisabled: {
    opacity: 0.72,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
    color: MEDICAL_COLORS.textMuted,
    marginTop: 6,
  },
  rowContainer: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },

  genderRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  genderChip: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
    backgroundColor: MEDICAL_COLORS.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  genderChipActive: {
    backgroundColor: "#D9F0F3",
    borderColor: MEDICAL_COLORS.primary,
  },
  genderChipDisabled: {
    opacity: 0.92,
  },
  genderChipText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: MEDICAL_COLORS.textMuted,
  },
  genderChipTextActive: {
    color: MEDICAL_COLORS.primaryDark,
    fontWeight: "800",
  },

  settingItem: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF3F3",
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
    paddingRight: 10,
  },
  settingContent: {
    flex: 1,
  },
  settingIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  settingText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: MEDICAL_COLORS.text,
    marginBottom: 3,
  },
  settingSubtext: {
    fontSize: 13,
    lineHeight: 18,
    color: MEDICAL_COLORS.textMuted,
  },
  chevronWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#F5F9F9",
    alignItems: "center",
    justifyContent: "center",
  },

  logoutButton: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F5CDD3",
    backgroundColor: MEDICAL_COLORS.dangerSoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 2,
  },
  logoutButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: MEDICAL_COLORS.danger,
  },

  footerSpace: {
    height: 28,
  },

  modalScreen: {
    flex: 1,
    backgroundColor: MEDICAL_COLORS.background,
  },
  modalHeader: {
    backgroundColor: MEDICAL_COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: MEDICAL_COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "900",
    color: MEDICAL_COLORS.text,
  },
  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: MEDICAL_COLORS.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    padding: 16,
  },
  modalCard: {
    backgroundColor: MEDICAL_COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
    padding: 16,
  },

  modalSettingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF3F3",
    gap: 12,
  },
  modalSettingContent: {
    flex: 1,
    paddingRight: 8,
  },
  modalSettingLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: MEDICAL_COLORS.text,
    marginBottom: 4,
  },
  modalSettingDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: MEDICAL_COLORS.textMuted,
  },

  actionButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: MEDICAL_COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
    paddingHorizontal: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: MEDICAL_COLORS.primary,
  },
  dangerButton: {
    backgroundColor: MEDICAL_COLORS.dangerSoft,
    borderColor: "#F5CDD3",
    marginTop: 8,
    marginBottom: 0,
  },
  dangerButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: MEDICAL_COLORS.danger,
  },

  infoBox: {
    backgroundColor: MEDICAL_COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: MEDICAL_COLORS.textMuted,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "900",
    color: MEDICAL_COLORS.text,
  },
});

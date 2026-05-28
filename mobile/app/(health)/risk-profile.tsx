import { useRiskProfile } from "@/src/features/health/hooks/useRiskProfile";
import type { RiskProfile } from "@/src/features/health/types/health.types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Snackbar, Text, TextInput } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

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
  success: "#1F9D73",
  danger: "#C75656",
  warning: "#E08A2E",
};

const riskOptions = [
  { key: "diabetes", label: "Đái tháo đường" },
  { key: "smoking", label: "Hút thuốc lá" },
  { key: "overweight", label: "Thừa cân hoặc béo phì" },
  { key: "heartRateOver80", label: "Nhịp tim trên 80 lần/phút" },
  { key: "highLDLOrTriglyceride", label: "Mỡ máu cao" },
  { key: "familyHistoryOfHypertension", label: "Gia đình có THA" },
];

const hmodOptions = [
  { key: "leftVentricularHypertrophy", label: "Phì đại thất trái" },
  { key: "brainDamage", label: "Tổn thương não" },
  { key: "heartDamage", label: "Tổn thương tim" },
  { key: "kidneyDamage", label: "Tổn thương thận" },
];

const cvdOptions = [
  { key: "coronaryArteryDisease", label: "Bệnh động mạch vành" },
  { key: "heartFailure", label: "Suy tim" },
  { key: "stroke", label: "Đột quỵ" },
  { key: "atrialFibrillation", label: "Rung nhĩ" },
];

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function SelectChip({
  label,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.selectChipPressable,
        pressed && !disabled ? styles.selectChipPressed : undefined,
      ]}
    >
      <View
        style={[
          styles.selectChip,
          selected && styles.selectChipActive,
          disabled && styles.selectChipDisabled,
        ]}
      >
        <Text
          style={[
            styles.selectChipText,
            selected && styles.selectChipTextActive,
            disabled && styles.selectChipTextDisabled,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function SectionHeading({
  title,
  subtitle,
  count,
}: {
  title: string;
  subtitle: string;
  count?: number;
}) {
  return (
    <View style={styles.sectionHeadingWrap}>
      <View style={styles.sectionHeadingTop}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {typeof count === "number" ? (
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{count}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function MultiSelectSection({
  title,
  subtitle,
  options,
  values,
  onToggle,
  disabled,
}: {
  title: string;
  subtitle: string;
  options: { key: string; label: string }[];
  values: string[];
  onToggle: (key: string) => void;
  disabled?: boolean;
}) {
  const optionKeys = options.map((item) => item.key);

  const customValues = values.filter((item) => !optionKeys.includes(item));

  return (
    <View>
      <SectionHeading title={title} subtitle={subtitle} count={values.length} />

      <View style={styles.choiceWrap}>
        {options.map((item) => (
          <SelectChip
            key={item.key}
            label={item.label}
            selected={values.includes(item.key)}
            onPress={() => onToggle(item.key)}
            disabled={disabled}
          />
        ))}
      </View>

      {customValues.length > 0 ? (
        <View style={styles.customGroupWrap}>
          <Text style={styles.customGroupLabel}>Mục tự thêm</Text>

          <View style={styles.choiceWrap}>
            {customValues.map((item) => (
              <SelectChip
                key={item}
                label={item}
                selected
                onPress={() => onToggle(item)}
                disabled={disabled}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function CustomAddRow({
  value,
  onChangeText,
  onAdd,
  onClear,
  placeholder,
  disabled,
}: {
  value: string;
  onChangeText: (value: string) => void;
  onAdd: () => void;
  onClear: () => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <View style={styles.inlineInputBlock}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        mode="outlined"
        placeholder={placeholder}
        style={[styles.textInput, styles.inlineInput]}
        outlineStyle={styles.inputOutline}
        editable={!disabled}
        right={
          value.trim() ? (
            <TextInput.Icon icon="close" onPress={onClear} />
          ) : undefined
        }
      />

      <Button
        mode="contained-tonal"
        onPress={onAdd}
        style={styles.addButton}
        disabled={disabled || !value.trim()}
      >
        Thêm nhanh
      </Button>
    </View>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  accent,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <View style={styles.summaryStatItem}>
      <View style={[styles.summaryStatIcon, { backgroundColor: accent }]}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={MEDICAL_COLORS.primaryDark}
        />
      </View>
      <Text style={styles.summaryStatValue}>{value}</Text>
      <Text style={styles.summaryStatLabel}>{label}</Text>
    </View>
  );
}

export default function RiskProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    profile,
    loading,
    error,
    loadProfile,
    setField,
    resetChanges,
    saveProfile,
    hasChanges,
  } = useRiskProfile();
  const { riskFactors, hmodItems, cardiovascularDiseases } = profile;

  const [isEditing, setIsEditing] = useState(false);

  const [customRisk, setCustomRisk] = useState("");
  const [customHmod, setCustomHmod] = useState("");
  const [customCvd, setCustomCvd] = useState("");

  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [snackError, setSnackError] = useState(false);

  const showMessage = (message: string, isError = false) => {
    setSnackMessage(message);
    setSnackError(isError);
    setSnackVisible(true);
  };

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (error) showMessage(error, true);
  }, [error]);

  const summaryCount = useMemo(
    () => riskFactors.length + hmodItems.length + cardiovascularDiseases.length,
    [riskFactors.length, hmodItems.length, cardiovascularDiseases.length],
  );

  const toggleItem = (
    value: string,
    field: keyof Pick<
      RiskProfile,
      "riskFactors" | "hmodItems" | "cardiovascularDiseases"
    >,
  ) => {
    const values = profile[field];
    setField(
      field,
      values.includes(value)
        ? values.filter((item) => item !== value)
        : uniqueStrings([...values, value]),
    );
  };

  const addCustomItem = (
    value: string,
    field: keyof Pick<
      RiskProfile,
      "riskFactors" | "hmodItems" | "cardiovascularDiseases"
    >,
    reset: () => void,
  ) => {
    const normalized = value.trim();
    if (!normalized) return;

    setField(field, uniqueStrings([...profile[field], normalized]));
    reset();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    resetChanges();

    setCustomRisk("");
    setCustomHmod("");
    setCustomCvd("");
    setIsEditing(false);
  };

  const handleSave = async () => {
    const savedProfile = await saveProfile();
    if (!savedProfile) return;
    setIsEditing(false);
    showMessage(
      savedProfile.warnings?.length
        ? savedProfile.warnings.join("\n")
        : "Đã lưu hồ sơ nguy cơ",
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: Math.max(insets.top * 0.25, 8),
            paddingBottom: isEditing
              ? Math.max(insets.bottom + 118, 128)
              : Math.max(insets.bottom + 36, 44),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeading}>
          <Text style={styles.pageTitle}>Hồ sơ nguy cơ</Text>
          <Text style={styles.pageSubtitle}>
            Quản lý và cập nhật nguy cơ hiện có.
          </Text>
        </View>

        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.summaryEyebrow}>
              {isEditing ? "Đang chỉnh sửa" : "Tổng quan hiện tại"}
            </Text>

            <Text style={styles.summaryTitle}>
              {summaryCount} thông tin nguy cơ
            </Text>

            <Text style={styles.summaryText}>
              Hồ sơ này lưu yếu tố nguy cơ, HMOD và bệnh tim mạch liên quan để
              theo dõi lâu dài.
            </Text>

            <View style={styles.summaryStatsRow}>
              <SummaryStat
                icon="alert-circle-outline"
                label="Nguy cơ"
                value={riskFactors.length}
                accent="#DDF3F0"
              />
              <SummaryStat
                icon="heart-broken-outline"
                label="HMOD"
                value={hmodItems.length}
                accent="#E7F1F2"
              />
              <SummaryStat
                icon="heart-multiple-outline"
                label="CVD"
                value={cardiovascularDiseases.length}
                accent="#EEF4FA"
              />
            </View>

            {!isEditing ? (
              <View style={styles.summaryActionWrap}>
                <Button
                  mode="contained"
                  style={styles.primaryButtonSingle}
                  buttonColor={MEDICAL_COLORS.primary}
                  onPress={handleEdit}
                  disabled={loading}
                  icon="pencil-outline"
                >
                  Chỉnh sửa hồ sơ
                </Button>
              </View>
            ) : (
              <View style={styles.editModeInfoRow}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={18}
                  color={MEDICAL_COLORS.primaryDark}
                />
                <Text style={styles.editModeInfoText}>
                  Chọn hoặc bỏ chọn từng mục. Các thay đổi chỉ được ghi lại khi
                  bạn bấm lưu.
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.stageCard}>
          <Card.Content>
            <MultiSelectSection
              title="Yếu tố nguy cơ"
              subtitle="Các yếu tố nền làm tăng nguy cơ tim mạch hoặc tăng huyết áp."
              options={riskOptions}
              values={riskFactors}
              onToggle={(key) => toggleItem(key, "riskFactors")}
              disabled={!isEditing || loading}
            />

            {isEditing ? (
              <CustomAddRow
                value={customRisk}
                onChangeText={setCustomRisk}
                onAdd={() =>
                  addCustomItem(customRisk, "riskFactors", () =>
                    setCustomRisk(""),
                  )
                }
                onClear={() => setCustomRisk("")}
                placeholder="Thêm nguy cơ khác"
                disabled={loading}
              />
            ) : null}
          </Card.Content>
        </Card>

        <Card style={styles.stageCard}>
          <Card.Content>
            <MultiSelectSection
              title="Tổn thương cơ quan đích"
              subtitle="Các biểu hiện tổn thương cơ quan liên quan đến tăng huyết áp."
              options={hmodOptions}
              values={hmodItems}
              onToggle={(key) => toggleItem(key, "hmodItems")}
              disabled={!isEditing || loading}
            />

            {isEditing ? (
              <CustomAddRow
                value={customHmod}
                onChangeText={setCustomHmod}
                onAdd={() =>
                  addCustomItem(customHmod, "hmodItems", () =>
                    setCustomHmod(""),
                  )
                }
                onClear={() => setCustomHmod("")}
                placeholder="Thêm HMOD khác"
                disabled={loading}
              />
            ) : null}
          </Card.Content>
        </Card>

        <Card style={styles.stageCard}>
          <Card.Content>
            <MultiSelectSection
              title="Bệnh tim mạch liên quan"
              subtitle="Các bệnh tim mạch hoặc biến cố liên quan cần lưu trong hồ sơ nền."
              options={cvdOptions}
              values={cardiovascularDiseases}
              onToggle={(key) => toggleItem(key, "cardiovascularDiseases")}
              disabled={!isEditing || loading}
            />

            {isEditing ? (
              <CustomAddRow
                value={customCvd}
                onChangeText={setCustomCvd}
                onAdd={() =>
                  addCustomItem(customCvd, "cardiovascularDiseases", () =>
                    setCustomCvd(""),
                  )
                }
                onClear={() => setCustomCvd("")}
                placeholder="Thêm bệnh tim mạch khác"
                disabled={loading}
              />
            ) : null}
          </Card.Content>
        </Card>
      </ScrollView>

      {isEditing ? (
        <View
          style={[
            styles.stickyActionBar,
            {
              paddingBottom: Math.max(insets.bottom + 12, 16),
            },
          ]}
        >
          <Button
            mode="outlined"
            style={styles.secondaryButton}
            onPress={handleCancelEdit}
            disabled={loading}
          >
            Hủy thay đổi
          </Button>

          <Button
            mode="contained"
            style={styles.primaryButton}
            buttonColor={MEDICAL_COLORS.primary}
            onPress={handleSave}
            loading={loading}
            disabled={loading || !hasChanges}
          >
            Lưu hồ sơ
          </Button>
        </View>
      ) : null}

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={snackError ? 3500 : 2500}
        style={{
          backgroundColor: snackError
            ? MEDICAL_COLORS.danger
            : MEDICAL_COLORS.success,
          marginBottom: isEditing
            ? Math.max(insets.bottom + 88, 96)
            : Math.max(insets.bottom + 12, 16),
        }}
      >
        {snackMessage}
      </Snackbar>
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
  },
  pageHeading: {
    marginBottom: 12,
  },
  pageTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
    color: MEDICAL_COLORS.text,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: MEDICAL_COLORS.textMuted,
  },
  summaryCard: {
    marginBottom: 14,
    borderRadius: 24,
    backgroundColor: "#EAF5F4",
    borderWidth: 1,
    borderColor: "#CFE7E4",
  },
  summaryEyebrow: {
    fontSize: 13,
    fontWeight: "800",
    color: MEDICAL_COLORS.primaryDark,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    color: MEDICAL_COLORS.text,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 23,
    color: MEDICAL_COLORS.textMuted,
    marginBottom: 16,
  },
  summaryStatsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  summaryStatItem: {
    flex: 1,
    backgroundColor: "#F7FBFB",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D8E7E8",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  summaryStatIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  summaryStatValue: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
    color: MEDICAL_COLORS.text,
    marginBottom: 2,
  },
  summaryStatLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: MEDICAL_COLORS.textMuted,
  },
  summaryActionWrap: {
    marginTop: 4,
  },
  primaryButtonSingle: {
    borderRadius: 16,
  },
  editModeInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 2,
  },
  editModeInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: MEDICAL_COLORS.primaryDark,
    fontWeight: "600",
  },
  stageCard: {
    marginBottom: 14,
    borderRadius: 24,
    backgroundColor: MEDICAL_COLORS.surface,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
    overflow: "hidden",
  },
  sectionHeadingWrap: {
    marginBottom: 16,
  },
  sectionHeadingTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: MEDICAL_COLORS.text,
    flex: 1,
    paddingRight: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: MEDICAL_COLORS.textMuted,
  },
  countPill: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: MEDICAL_COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: "#D8E8E8",
    alignItems: "center",
    justifyContent: "center",
  },
  countPillText: {
    fontSize: 13,
    fontWeight: "800",
    color: MEDICAL_COLORS.primaryDark,
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 6,
  },
  selectChipPressable: {
    borderRadius: 16,
  },
  selectChipPressed: {
    opacity: 0.96,
  },
  selectChip: {
    minHeight: 46,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#EEF4F5",
    borderWidth: 1,
    borderColor: "#D9E8E8",
    justifyContent: "center",
  },
  selectChipActive: {
    backgroundColor: "#DDF3F0",
    borderColor: "#82D4C8",
  },
  selectChipDisabled: {
    opacity: 0.72,
  },
  selectChipText: {
    fontSize: 15,
    fontWeight: "700",
    color: MEDICAL_COLORS.text,
  },
  selectChipTextActive: {
    color: MEDICAL_COLORS.primaryDark,
  },
  selectChipTextDisabled: {
    color: MEDICAL_COLORS.textMuted,
  },
  inlineInputBlock: {
    marginTop: 8,
    gap: 10,
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    marginBottom: 0,
  },
  inlineInput: {
    flex: 1,
  },
  inputOutline: {
    borderRadius: 16,
    borderColor: "#D7E5E5",
  },
  addButton: {
    borderRadius: 14,
    alignSelf: "flex-start",
  },
  stickyActionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(244,248,248,0.98)",
    borderTopWidth: 1,
    borderTopColor: "#DDE9EA",
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
  },
  primaryButton: {
    flex: 1.25,
    borderRadius: 16,
  },

  customGroupWrap: {
    marginTop: 8,
  },

  customGroupLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: MEDICAL_COLORS.primaryDark,
    marginBottom: 8,
  },
});

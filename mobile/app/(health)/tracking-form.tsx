import { useHealthForm } from "@/src/features/health/hooks/useHealthForm";
import type {
  BpSource,
  DayPeriod,
  DeviceType,
  PositionType,
} from "@/src/features/health/types/health.types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import {
  Button,
  Card,
  HelperText,
  Snackbar,
  Text,
  TextInput,
} from "react-native-paper";
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
};

function SelectChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.selectChipPressable}>
      <View style={[styles.selectChip, selected && styles.selectChipActive]}>
        <Text
          style={[
            styles.selectChipText,
            selected && styles.selectChipTextActive,
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
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeadingWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

export default function TrackingFormScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string; id?: string }>();

  const isEditMode = params.mode === "edit" && typeof params.id === "string";
  const recordId = typeof params.id === "string" ? params.id : null;
  const { values, updateField, loadingInitial, isSubmitting, error, saveRecord } =
    useHealthForm(recordId, isEditMode);
  const {
    systolic,
    diastolic,
    source: bpSource,
    dayPeriod,
    position,
    restedMinutes,
    deviceType,
    deviceValidated,
    measuredAt,
  } = values;
  const setSystolic = (value: string) => updateField("systolic", value);
  const setDiastolic = (value: string) => updateField("diastolic", value);
  const setBpSource = (value: BpSource) => updateField("source", value);
  const setDayPeriod = (value: DayPeriod) => updateField("dayPeriod", value);
  const setPosition = (value: PositionType) => updateField("position", value);
  const setRestedMinutes = (value: string) => updateField("restedMinutes", value);
  const setDeviceType = (value: DeviceType) => updateField("deviceType", value);
  const setDeviceValidated = (value: boolean) => updateField("deviceValidated", value);
  const setMeasuredAt = (value: string) => updateField("measuredAt", value);

  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [snackError, setSnackError] = useState(false);
  const [navigatingAfterWarning, setNavigatingAfterWarning] = useState(false);

  const title = useMemo(
    () => (isEditMode ? "Chỉnh sửa lần đo" : "Tạo lần đo mới"),
    [isEditMode],
  );

  const subtitle = useMemo(
    () =>
      isEditMode
        ? "Cập nhật chỉ số đo và bối cảnh đo của bản ghi hiện tại."
        : "Nhập chỉ số đo và bối cảnh đo trong cùng một màn hình.",
    [isEditMode],
  );

  const showMessage = (message: string, isError = false) => {
    setSnackMessage(message);
    setSnackError(isError);
    setSnackVisible(true);
  };

  const goAfterCancel = () => {
    if (isEditMode && recordId) {
      router.replace({
        pathname: "/(health)/tracking-detail",
        params: { id: recordId },
      });
      return;
    }

    router.replace("/(health)/tracking");
  };

  const goAfterSubmit = () => {
    if (isEditMode && recordId) {
      router.replace({
        pathname: "/(health)/tracking-detail",
        params: { id: recordId },
      });
      return;
    }

    router.replace("/(health)/tracking");
  };

  useEffect(() => {
    if (!navigatingAfterWarning) return;
    const timeout = setTimeout(() => {
      if (isEditMode && recordId) {
        router.replace({
          pathname: "/(health)/tracking-detail",
          params: { id: recordId },
        });
      } else {
        router.replace("/(health)/tracking");
      }
    }, 2500);
    return () => clearTimeout(timeout);
  }, [isEditMode, navigatingAfterWarning, recordId]);

  useEffect(() => {
    if (error) showMessage(error, true);
  }, [error]);

  const handleSubmit = async () => {
    const savedRecord = await saveRecord();
    if (!savedRecord) return;
    if (savedRecord.warnings?.length) {
      showMessage(savedRecord.warnings.join("\n"));
      setNavigatingAfterWarning(true);
    } else {
      goAfterSubmit();
    }
  };

  const formDisabled = loadingInitial || isSubmitting || navigatingAfterWarning;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: Math.max(insets.top * 0.25, 8),
            paddingBottom: Math.max(insets.bottom + 40, 48),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeading}>
          <Text style={styles.pageTitle}>{title}</Text>
          <Text style={styles.pageSubtitle}>{subtitle}</Text>
        </View>

        <Card style={styles.stageCard}>
          <Card.Content>
            <SectionHeading
              title="Thông tin lần đo"
              subtitle="Nhập chỉ số chính và thời gian đo nếu bạn muốn lưu cụ thể."
            />

            <View style={styles.bpRow}>
              <View style={styles.bpField}>
                <Text style={styles.fieldLabel}>Tâm thu</Text>
                <TextInput
                  value={systolic}
                  onChangeText={setSystolic}
                  mode="outlined"
                  keyboardType="number-pad"
                  placeholder="Ví dụ 120"
                  style={styles.textInput}
                  outlineStyle={styles.inputOutline}
                  editable={!formDisabled}
                />
              </View>

              <View style={styles.bpField}>
                <Text style={styles.fieldLabel}>Tâm trương</Text>
                <TextInput
                  value={diastolic}
                  onChangeText={setDiastolic}
                  mode="outlined"
                  keyboardType="number-pad"
                  placeholder="Ví dụ 80"
                  style={styles.textInput}
                  outlineStyle={styles.inputOutline}
                  editable={!formDisabled}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Thời gian đo cụ thể</Text>
            <TextInput
              value={measuredAt}
              onChangeText={setMeasuredAt}
              mode="outlined"
              placeholder="YYYY-MM-DD HH:mm"
              style={styles.textInput}
              outlineStyle={styles.inputOutline}
              editable={!formDisabled && !isEditMode}
              right={<TextInput.Icon icon="clock-outline" />}
            />
            <HelperText type="info" style={styles.helperText}>
              {isEditMode
                ? "Ngày giờ được giữ nguyên khi chỉnh sửa bản ghi."
                : "Bạn có thể để trống nếu muốn dùng thời điểm lưu hiện tại."}
            </HelperText>
          </Card.Content>
        </Card>

        <Card style={styles.stageCard}>
          <Card.Content>
            <SectionHeading
              title="Bối cảnh đo"
              subtitle="Những thông tin này giúp bản ghi có ngữ cảnh tốt hơn về sau."
            />

            <Text style={styles.groupLabel}>Nguồn đo</Text>
            <View style={styles.choiceWrap}>
              {(["HBPM", "OBPM", "ABPM"] as BpSource[]).map((item) => (
                <SelectChip
                  key={item}
                  label={item}
                  selected={bpSource === item}
                  onPress={() => setBpSource(item)}
                />
              ))}
            </View>

            <Text style={styles.groupLabel}>Thời điểm đo</Text>
            <View style={styles.choiceWrap}>
              {[
                { label: "Sáng", value: "morning" as DayPeriod },
                { label: "Chiều", value: "afternoon" as DayPeriod },
                { label: "Tối", value: "evening" as DayPeriod },
                { label: "Ban đêm", value: "night" as DayPeriod },
              ].map((item) => (
                <SelectChip
                  key={item.value}
                  label={item.label}
                  selected={dayPeriod === item.value}
                  onPress={() => setDayPeriod(item.value)}
                />
              ))}
            </View>

            <Text style={styles.groupLabel}>Tư thế đo</Text>
            <View style={styles.choiceWrap}>
              {[
                { label: "Ngồi", value: "sitting" as PositionType },
                { label: "Đứng", value: "standing" as PositionType },
                { label: "Nằm", value: "lying" as PositionType },
              ].map((item) => (
                <SelectChip
                  key={item.value}
                  label={item.label}
                  selected={position === item.value}
                  onPress={() => setPosition(item.value)}
                />
              ))}
            </View>

            <Text style={styles.groupLabel}>Loại máy</Text>
            <View style={styles.choiceWrap}>
              {[
                { label: "Bắp tay", value: "upper_arm" as DeviceType },
                { label: "Cổ tay", value: "wrist" as DeviceType },
              ].map((item) => (
                <SelectChip
                  key={item.value}
                  label={item.label}
                  selected={deviceType === item.value}
                  onPress={() => setDeviceType(item.value)}
                />
              ))}
            </View>

            <Text style={styles.fieldLabel}>Số phút nghỉ trước khi đo</Text>
            <TextInput
              value={restedMinutes}
              onChangeText={setRestedMinutes}
              mode="outlined"
              keyboardType="number-pad"
              placeholder="Ví dụ 5"
              style={styles.textInput}
              outlineStyle={styles.inputOutline}
              editable={!formDisabled}
            />

            <View style={styles.switchRow}>
              <View style={styles.switchTextWrap}>
                <Text style={styles.switchTitle}>Máy đã được kiểm định</Text>
                <Text style={styles.switchSubtitle}>
                  Bật nếu đây là thiết bị đáng tin cậy bạn thường dùng.
                </Text>
              </View>

              <Switch
                value={deviceValidated}
                onValueChange={setDeviceValidated}
                disabled={formDisabled}
                trackColor={{
                  false: "#D7E5E5",
                  true: "#8FD9CD",
                }}
                thumbColor={
                  deviceValidated ? MEDICAL_COLORS.primary : "#FFFFFF"
                }
              />
            </View>
          </Card.Content>
        </Card>

        <View style={styles.footerActions}>
          <Button
            mode="outlined"
            style={styles.secondaryButton}
            onPress={goAfterCancel}
            disabled={formDisabled}
          >
            Hủy
          </Button>

          <Button
            mode="contained"
            style={styles.primaryButton}
            contentStyle={styles.primaryButtonContent}
            buttonColor={MEDICAL_COLORS.primary}
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={formDisabled}
          >
            {isEditMode ? "Lưu thay đổi" : "Tạo bản ghi"}
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={snackError ? 3500 : 2500}
        style={{
          backgroundColor: snackError
            ? MEDICAL_COLORS.danger
            : MEDICAL_COLORS.success,
          marginBottom: Math.max(insets.bottom + 12, 16),
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: MEDICAL_COLORS.text,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: MEDICAL_COLORS.textMuted,
  },
  bpRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 6,
  },
  bpField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: MEDICAL_COLORS.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
  },
  inputOutline: {
    borderRadius: 16,
    borderColor: "#D7E5E5",
  },
  helperText: {
    color: MEDICAL_COLORS.textMuted,
    marginBottom: 4,
  },
  groupLabel: {
    marginTop: 6,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: "800",
    color: MEDICAL_COLORS.text,
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  selectChipPressable: {
    borderRadius: 16,
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
  selectChipText: {
    fontSize: 15,
    fontWeight: "700",
    color: MEDICAL_COLORS.text,
  },
  selectChipTextActive: {
    color: MEDICAL_COLORS.primaryDark,
  },
  switchRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  switchTextWrap: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: MEDICAL_COLORS.text,
    marginBottom: 4,
  },
  switchSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: MEDICAL_COLORS.textMuted,
  },
  noteCard: {
    marginTop: 4,
    marginBottom: 14,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: MEDICAL_COLORS.surfaceSoft2,
    borderWidth: 1,
    borderColor: "#D6E7E9",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: MEDICAL_COLORS.primaryDark,
    fontWeight: "600",
  },
  footerActions: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
  },
  primaryButton: {
    flex: 1.4,
    borderRadius: 18,
    backgroundColor: MEDICAL_COLORS.primary,
  },
  primaryButtonContent: {
    height: 56,
  },
});

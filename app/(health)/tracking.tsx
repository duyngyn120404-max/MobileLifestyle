import { useAuth } from "@/src/contexts/auth-context";
import type { BpRecord } from "@/src/repositories/home-health.repository";
import { homeHealthService } from "@/src/services/home-health.service";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Card,
  FAB,
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

type PickerField = "from" | "to" | null;

function formatDayPeriod(value: string | null) {
  switch (value) {
    case "morning":
      return "Sáng";
    case "afternoon":
      return "Chiều";
    case "evening":
      return "Tối";
    case "day":
      return "Ban ngày";
    case "night":
      return "Ban đêm";
    default:
      return value || "—";
  }
}

function formatPosition(value: string | null) {
  switch (value) {
    case "sitting":
      return "Ngồi";
    case "standing":
      return "Đứng";
    case "lying":
      return "Nằm";
    default:
      return value || "—";
  }
}

function formatDeviceType(value: string | null) {
  switch (value) {
    case "upper_arm":
      return "Bắp tay";
    case "wrist":
      return "Cổ tay";
    default:
      return value || "—";
  }
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString(
    "vi-VN",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  )}`;
}

function formatDateForQuery(date: Date | null) {
  if (!date) return null;

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(date: Date | null) {
  if (!date) return "";
  return date.toLocaleDateString("vi-VN");
}

function getBpStatusColor(systolic: number, diastolic: number) {
  if (systolic >= 180 || diastolic >= 120) return MEDICAL_COLORS.danger;
  if (systolic >= 140 || diastolic >= 90) return "#E08A2E";
  if (systolic < 90 || diastolic < 60) return "#4D84C4";
  return MEDICAL_COLORS.success;
}

export default function TrackingScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [records, setRecords] = useState<BpRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerField, setPickerField] = useState<PickerField>(null);

  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [snackError, setSnackError] = useState(false);

  const showMessage = useCallback((message: string, isError = false) => {
    setSnackMessage(message);
    setSnackError(isError);
    setSnackVisible(true);
  }, []);

  const loadRecords = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const data = await homeHealthService.getBpRecordsByDateRange({
        userId: user.id,
        fromDate: formatDateForQuery(fromDate),
        toDate: formatDateForQuery(toDate),
      });

      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể tải dữ liệu";
      showMessage(message, true);
    } finally {
      setLoading(false);
    }
  }, [user?.id, fromDate, toDate, showMessage]);

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [loadRecords]),
  );

  const headingText = useMemo(() => {
    if (loading) return "Đang tải dữ liệu...";
    return `${records.length} bản ghi`;
  }, [loading, records.length]);

  const hasActiveFilter = Boolean(fromDate || toDate);

  const handleApplyFilter = async () => {
    if (fromDate && toDate && fromDate > toDate) {
      showMessage("Ngày bắt đầu không được lớn hơn ngày kết thúc", true);
      return;
    }

    await loadRecords();
  };

  const handleClearFilter = () => {
    setFromDate(null);
    setToDate(null);
  };

  const handleQuickRange = (days: number) => {
    const now = new Date();
    const start = new Date();
    start.setDate(now.getDate() - (days - 1));

    setFromDate(start);
    setToDate(now);
  };

  const handleOpenFilterInfo = () => {
    Alert.alert(
      "Bộ lọc thời gian",
      "Chọn ngày bắt đầu và ngày kết thúc từ lịch để lọc bản ghi dễ hơn.",
    );
  };

  const openPicker = (field: PickerField) => {
    setPickerField(field);
    setPickerVisible(true);
  };

  const closePicker = () => {
    setPickerVisible(false);
    setPickerField(null);
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (event.type === "dismissed") {
      closePicker();
      return;
    }

    if (!selectedDate || !pickerField) return;

    if (pickerField === "from") {
      setFromDate(selectedDate);
    } else {
      setToDate(selectedDate);
    }

    if (Platform.OS === "android") {
      closePicker();
    }
  };

  const currentPickerValue =
    pickerField === "to" ? (toDate ?? new Date()) : (fromDate ?? new Date());

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: Math.max(insets.top * 0.25, 8),
            paddingBottom: Math.max(insets.bottom + 112, 120),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeading}>
          <Text style={styles.pageTitle}>Theo dõi THA</Text>
          <Text style={styles.pageSubtitle}>
            Lọc và quản lý các lần đo huyết áp đã lưu.
          </Text>
        </View>

        <Card style={styles.filterCard}>
          <Card.Content>
            <View style={styles.filterTitleRow}>
              <Text style={styles.sectionTitle}>Bộ lọc thời gian</Text>
              <Button mode="text" compact onPress={handleOpenFilterInfo}>
                Hướng dẫn
              </Button>
            </View>

            <View style={styles.quickFilterRow}>
              <Pressable
                onPress={() => handleQuickRange(7)}
                style={styles.quickChip}
              >
                <Text style={styles.quickChipText}>7 ngày</Text>
              </Pressable>

              <Pressable
                onPress={() => handleQuickRange(30)}
                style={styles.quickChip}
              >
                <Text style={styles.quickChipText}>30 ngày</Text>
              </Pressable>

              <Pressable
                onPress={handleClearFilter}
                style={styles.quickChipMuted}
              >
                <Text style={styles.quickChipMutedText}>Tất cả</Text>
              </Pressable>
            </View>

            <Pressable onPress={() => openPicker("from")}>
              <View pointerEvents="none">
                <TextInput
                  label="Từ ngày"
                  value={formatDateForDisplay(fromDate)}
                  placeholder="Chọn ngày bắt đầu"
                  mode="outlined"
                  style={styles.textInput}
                  outlineStyle={styles.inputOutline}
                  editable={false}
                  right={<TextInput.Icon icon="calendar-month-outline" />}
                />
              </View>
            </Pressable>

            <Pressable onPress={() => openPicker("to")}>
              <View pointerEvents="none">
                <TextInput
                  label="Đến ngày"
                  value={formatDateForDisplay(toDate)}
                  placeholder="Chọn ngày kết thúc"
                  mode="outlined"
                  style={styles.textInput}
                  outlineStyle={styles.inputOutline}
                  editable={false}
                  right={<TextInput.Icon icon="calendar-month-outline" />}
                />
              </View>
            </Pressable>

            <View style={styles.filterFooterRow}>
              <Text style={styles.filterHint}>
                {hasActiveFilter
                  ? "Đang áp dụng bộ lọc thời gian."
                  : "Hiển thị toàn bộ bản ghi đã lưu."}
              </Text>
            </View>

            <View style={styles.filterActions}>
              <Button
                mode="outlined"
                style={styles.secondaryButton}
                onPress={handleClearFilter}
                disabled={loading}
              >
                Xóa lọc
              </Button>

              <Button
                mode="contained"
                style={styles.primaryButton}
                buttonColor={MEDICAL_COLORS.primary}
                onPress={handleApplyFilter}
                loading={loading}
                disabled={loading}
              >
                Áp dụng
              </Button>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.listSection}>
          <View style={styles.listHeadingRow}>
            <Text style={styles.sectionTitle}>Lần đo đã lưu</Text>
            <Text style={styles.recordCount}>{headingText}</Text>
          </View>

          {!loading && records.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <View style={styles.emptyIconWrap}>
                  <MaterialCommunityIcons
                    name="heart-off-outline"
                    size={26}
                    color={MEDICAL_COLORS.textMuted}
                  />
                </View>

                <Text style={styles.emptyTitle}>Chưa có bản ghi phù hợp</Text>
                <Text style={styles.emptySubtitle}>
                  Hãy đổi khoảng ngày hoặc tạo mới một lần đo huyết áp.
                </Text>
              </Card.Content>
            </Card>
          ) : (
            records.map((record) => {
              const statusColor = getBpStatusColor(
                record.systolic,
                record.diastolic,
              );

              return (
                <Pressable
                  key={record.id}
                  style={styles.recordPressable}
                  onPress={() =>
                    router.push({
                      pathname: "/(health)/tracking-detail",
                      params: { id: record.id },
                    })
                  }
                >
                  {({ pressed }) => {
                    const cardStyle = pressed
                      ? [styles.recordCard, styles.recordCardPressed]
                      : styles.recordCard;

                    return (
                      <Card style={cardStyle}>
                        <Card.Content>
                          <View style={styles.recordTopRow}>
                            <View style={styles.recordMainInfo}>
                              <Text style={styles.bpValue}>
                                {record.systolic}/{record.diastolic} mmHg
                              </Text>
                              <Text style={styles.bpMeta}>
                                {formatDateTime(record.created_at)}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.recordSummary}>
                            {record.source} •{" "}
                            {formatDayPeriod(record.day_period)} •{" "}
                            {formatPosition(record.position)}
                          </Text>

                          <View style={styles.recordBottomRow}>
                            <Text style={styles.recordSummaryMuted}>
                              {formatDeviceType(record.device_type)} •{" "}
                              {record.device_validated
                                ? "Đã kiểm định"
                                : "Chưa kiểm định"}
                            </Text>

                            <MaterialCommunityIcons
                              name="chevron-right"
                              size={20}
                              color={MEDICAL_COLORS.textMuted}
                            />
                          </View>
                        </Card.Content>
                      </Card>
                    );
                  }}
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {pickerVisible && pickerField ? (
        <DateTimePicker
          value={currentPickerValue}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      ) : null}

      <FAB
        icon="plus"
        label="Tạo mới"
        style={[
          styles.fab,
          {
            bottom: Math.max(insets.bottom + 16, 22),
          },
        ]}
        color="#FFFFFF"
        customSize={58}
        onPress={() => router.push("/(health)/tracking-form")}
      />

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={snackError ? 3500 : 2500}
        style={{
          backgroundColor: snackError
            ? MEDICAL_COLORS.danger
            : MEDICAL_COLORS.success,
          marginBottom: Math.max(insets.bottom + 70, 78),
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
  filterCard: {
    backgroundColor: MEDICAL_COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
    marginBottom: 16,
  },
  filterTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
    color: MEDICAL_COLORS.text,
  },
  quickFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  quickChip: {
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: "#EAF6F5",
    borderWidth: 1,
    borderColor: "#D5E9E6",
    justifyContent: "center",
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: "800",
    color: MEDICAL_COLORS.primaryDark,
  },
  quickChipMuted: {
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: MEDICAL_COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
    justifyContent: "center",
  },
  quickChipMutedText: {
    fontSize: 13,
    fontWeight: "800",
    color: MEDICAL_COLORS.textMuted,
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
  },
  inputOutline: {
    borderRadius: 16,
    borderColor: "#D7E5E5",
  },
  filterFooterRow: {
    marginTop: 2,
    marginBottom: 10,
  },
  filterHint: {
    fontSize: 13,
    lineHeight: 19,
    color: MEDICAL_COLORS.textMuted,
  },
  filterActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 14,
  },
  primaryButton: {
    flex: 1.1,
    borderRadius: 16,
  },
  listSection: {
    gap: 12,
  },
  listHeadingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recordCount: {
    fontSize: 13,
    fontWeight: "700",
    color: MEDICAL_COLORS.primaryDark,
  },
  emptyCard: {
    backgroundColor: MEDICAL_COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: MEDICAL_COLORS.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: MEDICAL_COLORS.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: MEDICAL_COLORS.textMuted,
  },
  recordPressable: {
    borderRadius: 22,
  },
  recordCard: {
    backgroundColor: MEDICAL_COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
  },
  recordCardPressed: {
    opacity: 0.96,
  },
  recordTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  recordMainInfo: {
    flex: 1,
  },
  bpValue: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    color: MEDICAL_COLORS.text,
    marginBottom: 2,
  },
  bpMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: MEDICAL_COLORS.textMuted,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
  },
  recordSummary: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
    color: MEDICAL_COLORS.text,
    marginBottom: 6,
  },
  recordBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  recordSummaryMuted: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: MEDICAL_COLORS.textMuted,
  },
  fab: {
    position: "absolute",
    right: 18,
    backgroundColor: MEDICAL_COLORS.primary,
  },
});

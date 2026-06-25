import { useHealthTracking } from "@/src/features/health/hooks/useHealthTracking";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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
type DateDraft = { day: string; month: string; year: string };

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

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return `${date.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  })} ${date.toLocaleTimeString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}


function formatReadings(readings: { systolic: number; diastolic: number }[]) {
  if (!readings.length) return "—";
  const firstTwo = readings.slice(0, 2).map((item) => `${item.systolic}/${item.diastolic}`);
  if (readings.length > 2) {
    return `${firstTwo.join(" • ")} • +${readings.length - 2} lần`;
  }
  return `${firstTwo.join(" • ")} mmHg`;
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

function buildDateDraft(date: Date): DateDraft {
  return {
    day: `${date.getDate()}`.padStart(2, "0"),
    month: `${date.getMonth() + 1}`.padStart(2, "0"),
    year: `${date.getFullYear()}`,
  };
}

function parseDateDraft(draft: DateDraft): Date | null {
  const day = Number(draft.day);
  const month = Number(draft.month);
  const year = Number(draft.year);

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return null;
  }
  if (year < 1900 || month < 1 || month > 12 || day < 1) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (date > today) return null;

  return date;
}

function onlyDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export default function TrackingScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ refreshAt?: string }>();
  const {
    records,
    loading,
    error,
    loadRecords: fetchRecords,
  } = useHealthTracking();

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerField, setPickerField] = useState<PickerField>(null);
  const [dateDraft, setDateDraft] = useState<DateDraft>(() => buildDateDraft(new Date()));

  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [snackError, setSnackError] = useState(false);

  const showMessage = useCallback((message: string, isError = false) => {
    setSnackMessage(message);
    setSnackError(isError);
    setSnackVisible(true);
  }, []);

  useEffect(() => {
    if (error) showMessage(error, true);
  }, [error, showMessage]);

  const getDateRangeError = useCallback(
    (nextFromDate: Date | null, nextToDate: Date | null) => {
      const fromQuery = formatDateForQuery(nextFromDate);
      const toQuery = formatDateForQuery(nextToDate);

      if (fromQuery && toQuery && fromQuery > toQuery) {
        return "Ngày bắt đầu không được lớn hơn ngày kết thúc";
      }

      return null;
    },
    [],
  );

  const loadRecords = useCallback(async () => {
    const dateRangeError = getDateRangeError(fromDate, toDate);
    if (dateRangeError) {
      showMessage(dateRangeError, true);
      return;
    }

    await fetchRecords({
      fromDate: formatDateForQuery(fromDate),
      toDate: formatDateForQuery(toDate),
    });
  }, [fetchRecords, fromDate, getDateRangeError, showMessage, toDate]);

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [loadRecords]),
  );

  useEffect(() => {
    if (params.refreshAt) {
      loadRecords();
    }
  }, [loadRecords, params.refreshAt]);

  const headingText = useMemo(() => {
    if (loading) return "Đang tải dữ liệu...";
    return `${records.length} buổi đo`;
  }, [loading, records.length]);

  const hasActiveFilter = Boolean(fromDate || toDate);

  const handleApplyFilter = async () => {
    const dateRangeError = getDateRangeError(fromDate, toDate);
    if (dateRangeError) {
      showMessage(dateRangeError, true);
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

  const applySelectedDate = useCallback((field: Exclude<PickerField, null>, date: Date) => {
    if (field === "from") {
      setFromDate(date);
    } else {
      setToDate(date);
    }
  }, []);

  const getPickerValue = useCallback(
    (field: Exclude<PickerField, null>) =>
      field === "to" ? (toDate ?? new Date()) : (fromDate ?? new Date()),
    [fromDate, toDate],
  );

  const openPicker = (field: Exclude<PickerField, null>) => {
    setPickerField(field);
    setDateDraft(buildDateDraft(getPickerValue(field)));
    setPickerVisible(true);
  };

  const closePicker = () => {
    Keyboard.dismiss();
    setPickerVisible(false);
    setPickerField(null);
  };

  const updateDateDraft = (field: keyof DateDraft, value: string) => {
    const maxLength = field === "year" ? 4 : 2;
    setDateDraft((current) => ({ ...current, [field]: onlyDigits(value, maxLength) }));
  };

  const handleConfirmDate = () => {
    if (!pickerField) return;

    const selectedDate = parseDateDraft(dateDraft);
    if (!selectedDate) {
      showMessage("Ngày không hợp lệ", true);
      return;
    }

    Keyboard.dismiss();
    const nextFromDate = pickerField === "from" ? selectedDate : fromDate;
    const nextToDate = pickerField === "to" ? selectedDate : toDate;
    const dateRangeError = getDateRangeError(nextFromDate, nextToDate);

    if (dateRangeError) {
      showMessage(dateRangeError, true);
      return;
    }

    applySelectedDate(pickerField, selectedDate);
    closePicker();
  };

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
            <Text style={styles.sectionTitle}>Buổi đo đã lưu</Text>
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
                  Hãy đổi khoảng ngày hoặc tạo mới một buổi đo huyết áp.
                </Text>
              </Card.Content>
            </Card>
          ) : (
            records.map((record) => {
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
                                {formatReadings(record.readings)}
                              </Text>
                              <Text style={styles.bpMeta}>
                                {formatDateTime(record.measuredAt)}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.recordSummary}>
                            {formatDateTime(record.measuredAt)} • {formatDayPeriod(record.dayPeriod)}
                          </Text>

                          <View style={styles.recordBottomRow}>
                            <Text style={styles.recordSummaryMuted}>
                              {record.source || "—"} • {formatPosition(record.position)} • {record.readings.length} readings
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
        <Modal
          transparent
          animationType="fade"
          visible={pickerVisible}
          onRequestClose={closePicker}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalBackdrop}
          >
            <Pressable style={styles.modalDismissArea} onPress={closePicker} />
            <View style={styles.datePickerSheet}>
              <View style={styles.datePickerHeader}>
                <Button mode="text" onPress={closePicker}>
                  Hủy
                </Button>
                <Text style={styles.datePickerTitle}>
                  {pickerField === "from" ? "Chọn ngày bắt đầu" : "Chọn ngày kết thúc"}
                </Text>
                <Button mode="text" onPress={handleConfirmDate}>
                  Xong
                </Button>
              </View>

              <View style={styles.dateInputRow}>
                <TextInput
                  label="Ngày"
                  value={dateDraft.day}
                  mode="outlined"
                  keyboardType="number-pad"
                  maxLength={2}
                  style={styles.dateInput}
                  outlineStyle={styles.inputOutline}
                  onChangeText={(value) => updateDateDraft("day", value)}
                />
                <TextInput
                  label="Tháng"
                  value={dateDraft.month}
                  mode="outlined"
                  keyboardType="number-pad"
                  maxLength={2}
                  style={styles.dateInput}
                  outlineStyle={styles.inputOutline}
                  onChangeText={(value) => updateDateDraft("month", value)}
                />
                <TextInput
                  label="Năm"
                  value={dateDraft.year}
                  mode="outlined"
                  keyboardType="number-pad"
                  maxLength={4}
                  style={styles.yearInput}
                  outlineStyle={styles.inputOutline}
                  onChangeText={(value) => updateDateDraft("year", value)}
                />
              </View>

              <Text style={styles.datePickerHint}>Nhập ngày theo định dạng DD / MM / YYYY.</Text>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(10, 30, 35, 0.32)",
  },
  modalDismissArea: {
    flex: 1,
  },
  datePickerSheet: {
    backgroundColor: MEDICAL_COLORS.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 18,
  },
  datePickerHeader: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  datePickerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "800",
    color: MEDICAL_COLORS.text,
  },
  dateInputRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  dateInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  yearInput: {
    flex: 1.35,
    backgroundColor: "#FFFFFF",
  },
  datePickerHint: {
    paddingHorizontal: 6,
    paddingTop: 10,
    fontSize: 13,
    lineHeight: 18,
    color: MEDICAL_COLORS.textMuted,
  },
  fab: {
    position: "absolute",
    right: 18,
    backgroundColor: MEDICAL_COLORS.primary,
  },
});

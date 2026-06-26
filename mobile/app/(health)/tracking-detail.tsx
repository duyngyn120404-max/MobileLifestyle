import { useHealthTracking } from "@/src/features/health/hooks/useHealthTracking";
import type { MeasurementSession } from "@/src/features/health/types/health.types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Snackbar, Text } from "react-native-paper";
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

function formatDayPeriod(value: string | null) {
  switch (value) {
    case "morning":
      return "Sáng";
    case "afternoon":
      return "Chiều";
    case "evening":
      return "Tối";
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

function DetailRow({
  label,
  value,
  icon,
  isLast = false,
}: {
  label: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.detailRow, isLast && styles.detailRowLast]}>
      <View style={styles.detailIconWrap}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={MEDICAL_COLORS.primaryDark}
        />
      </View>

      <View style={styles.detailTextWrap}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function TrackingDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const { getRecord, deleteRecord } = useHealthTracking();

  const [record, setRecord] = useState<MeasurementSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [snackError, setSnackError] = useState(false);

  const showMessage = (message: string, isError = false) => {
    setSnackMessage(message);
    setSnackError(isError);
    setSnackVisible(true);
  };

  useEffect(() => {
    const loadDetail = async () => {
      if (!params.id) return;

      try {
        setLoading(true);
        const data = await getRecord(params.id);
        setRecord(data ?? null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Không thể tải chi tiết";
        showMessage(message, true);
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [getRecord, params.id]);

  const handleEdit = () => {
    if (!params.id || !record) return;

    router.replace({
      pathname: "/(health)/tracking-form",
      params: {
        mode: "edit",
        id: params.id as string,
      },
    });
  };

  const handleDelete = () => {
    if (!params.id || deleting) return;

    Alert.alert("Xóa buổi đo", "Bạn có chắc muốn xóa buổi đo này không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            setDeleting(true);
            await deleteRecord(params.id as string);
            router.replace("/(health)/tracking");
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Không thể xóa bản ghi";
            showMessage(message, true);
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: Math.max(insets.top * 0.25, 8),
            paddingBottom: Math.max(insets.bottom + 36, 44),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeading}>
          <Text style={styles.pageTitle}>Chi tiết buổi đo</Text>
          <Text style={styles.pageSubtitle}>
            Xem lại dữ liệu thô của từng lần đo trong buổi.
          </Text>
        </View>

        <Card style={styles.mainCard}>
          <Card.Content>
            <View style={styles.heroRow}>
              <View style={styles.heroIconWrap}>
                <MaterialCommunityIcons
                  name="heart-pulse"
                  size={26}
                  color={MEDICAL_COLORS.primary}
                />
              </View>
            </View>

            <Text style={styles.bpTitle}>
              {record ? `${record.readings.length} lần đo huyết áp` : "Đang tải..."}
            </Text>

            <Text style={styles.bpSubtitle}>
              {record ? `Buổi đo #${record.id}` : "Vui lòng chờ tải dữ liệu"}
            </Text>

            {record ? (
              <View style={styles.detailGroup}>

                {record.readings.map((reading, index) => (
                  <DetailRow
                    key={reading.id ?? `${record.id}-${index}`}
                    label={`Lần đo ${reading.order || index + 1}`}
                    value={`${reading.systolic}/${reading.diastolic} mmHg`}
                    icon="heart-pulse"
                  />
                ))}
                <DetailRow
                  label="Thời gian đo"
                  value={formatDateTime(record.measuredAt)}
                  icon="clock-outline"
                />
                <DetailRow
                  label="Nguồn đo"
                  value={record.source || "—"}
                  icon="stethoscope"
                />
                <DetailRow
                  label="Thời điểm đo"
                  value={formatDayPeriod(record.dayPeriod)}
                  icon="weather-sunset"
                />
                <DetailRow
                  label="Tư thế đo"
                  value={formatPosition(record.position)}
                  icon="human-male-height"
                />
                <DetailRow
                  label="Số phút nghỉ"
                  value={
                    record.restedMinutes != null
                      ? `${record.restedMinutes} phút`
                      : "—"
                  }
                  icon="timer-outline"
                />
                <DetailRow
                  label="Loại máy"
                  value={formatDeviceType(record.deviceType)}
                  icon="medical-bag"
                />
                <DetailRow
                  label="Tên thiết bị"
                  value={record.deviceName || "—"}
                  icon="card-account-details-outline"
                />
                <DetailRow
                  label="Tình trạng kiểm định"
                  value={
                    record.deviceValidated ? "Đã kiểm định" : "Chưa kiểm định"
                  }
                  icon="check-decagram-outline"
                  isLast
                />
              </View>
            ) : (
              <View style={styles.loadingWrap}>
                <Text style={styles.loadingText}>
                  Đang tải thông tin buổi đo...
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <View style={styles.actionRow}>
          <Button
            mode="outlined"
            style={styles.editButton}
            onPress={handleEdit}
            disabled={!record || loading || deleting}
          >
            Chỉnh sửa
          </Button>

          <Button
            mode="contained"
            buttonColor={MEDICAL_COLORS.danger}
            style={styles.deleteButton}
            onPress={handleDelete}
            loading={deleting}
            disabled={!record || loading || deleting}
          >
            Xóa
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
  mainCard: {
    backgroundColor: MEDICAL_COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
    marginBottom: 16,
  },
  heroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  heroIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#E7F3F4",
    alignItems: "center",
    justifyContent: "center",
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
  bpTitle: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "900",
    color: MEDICAL_COLORS.text,
    marginBottom: 4,
  },
  bpSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: MEDICAL_COLORS.textMuted,
    marginBottom: 18,
  },
  detailGroup: {
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: "#EDF4F4",
    paddingTop: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D7E6E7",
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: MEDICAL_COLORS.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  detailTextWrap: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: MEDICAL_COLORS.textMuted,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: MEDICAL_COLORS.text,
  },
  loadingWrap: {
    paddingVertical: 6,
  },
  loadingText: {
    fontSize: 14,
    lineHeight: 21,
    color: MEDICAL_COLORS.textMuted,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  editButton: {
    flex: 1,
    borderRadius: 16,
  },
  deleteButton: {
    flex: 1,
    borderRadius: 16,
  },
});

import { useAuth } from "@/src/contexts/auth-context";
import type { BpRecord } from "@/src/repositories/home-health.repository";
import { homeHealthService } from "@/src/services/home-health.service";
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

  return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString(
    "vi-VN",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  )}`;
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
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();

  const [record, setRecord] = useState<BpRecord | null>(null);
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
        const data = await homeHealthService.getBpRecordById(params.id);
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
  }, [params.id]);

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
    if (!params.id || !user?.id || deleting) return;

    Alert.alert("Xóa bản ghi", "Bạn có chắc muốn xóa bản ghi này không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            setDeleting(true);
            await homeHealthService.deleteBpRecord(params.id as string);
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
          <Text style={styles.pageTitle}>Chi tiết lần đo</Text>
          <Text style={styles.pageSubtitle}>
            Xem lại đầy đủ thông tin và thao tác trên bản ghi.
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
              {record
                ? `${record.systolic}/${record.diastolic} mmHg`
                : "Đang tải..."}
            </Text>

            <Text style={styles.bpSubtitle}>
              {record ? `Bản ghi #${record.id}` : "Vui lòng chờ tải dữ liệu"}
            </Text>

            {record ? (
              <View style={styles.detailGroup}>
                <DetailRow
                  label="Thời gian đo"
                  value={formatDateTime(record.created_at)}
                  icon="clock-outline"
                />
                <DetailRow
                  label="Nguồn đo"
                  value={record.source || "—"}
                  icon="stethoscope"
                />
                <DetailRow
                  label="Thời điểm đo"
                  value={formatDayPeriod(record.day_period)}
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
                    record.rested_minutes != null
                      ? `${record.rested_minutes} phút`
                      : "—"
                  }
                  icon="timer-outline"
                />
                <DetailRow
                  label="Loại máy"
                  value={formatDeviceType(record.device_type)}
                  icon="medical-bag"
                />
                <DetailRow
                  label="Tình trạng kiểm định"
                  value={
                    record.device_validated ? "Đã kiểm định" : "Chưa kiểm định"
                  }
                  icon="check-decagram-outline"
                  isLast
                />
              </View>
            ) : (
              <View style={styles.loadingWrap}>
                <Text style={styles.loadingText}>
                  Đang tải thông tin bản ghi...
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

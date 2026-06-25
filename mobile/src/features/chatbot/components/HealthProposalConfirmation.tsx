import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { PendingAction } from "../types/chatbot.types";

const COLORS = {
  surface: "#FFFFFF",
  surfaceMuted: "#F5F8F8",
  primary: "#0E7490",
  primarySoft: "#E6F4F6",
  text: "#173238",
  textMuted: "#60777D",
  border: "#D8E5E7",
  success: "#16845F",
  danger: "#B95050",
  white: "#FFFFFF",
};

interface HealthProposalConfirmationProps {
  actions: PendingAction[];
  onDecision: (actionId: string, decision: "accepted" | "rejected") => void;
  disabled?: boolean;
  processingActionId?: string | null;
}

function isReading(label: string) {
  return label.toLowerCase().startsWith("lần đo");
}

function splitDetails(action: PendingAction) {
  const details = action.details ?? [];
  return {
    readings: details.filter((detail) => isReading(detail.label)),
    metadata: details.filter((detail) => !isReading(detail.label)),
  };
}

export function HealthProposalConfirmation({
  actions,
  onDecision,
  disabled = false,
  processingActionId = null,
}: HealthProposalConfirmationProps) {
  const pendingActions = actions.filter((action) => action.status === "pending");

  if (!pendingActions.length) return null;

  return (
    <View style={styles.stack}>
      {pendingActions.map((action) => {
        const { readings, metadata } = splitDetails(action);
        const isProcessing = processingActionId === action.id;

        return (
          <View key={action.id} style={styles.card}>
            <View style={styles.header}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="clipboard-check-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>Kiểm tra trước khi lưu</Text>
                <Text style={styles.subtitle}>Dữ liệu sẽ chỉ được lưu sau khi bạn xác nhận</Text>
              </View>
            </View>

            <Text style={styles.summary}>{action.summary}</Text>

            {!!readings.length && (
              <View style={styles.readingGrid}>
                {readings.map((detail) => (
                  <View key={`${action.id}-${detail.label}`} style={styles.readingItem}>
                    <Text style={styles.readingLabel}>{detail.label}</Text>
                    <Text style={styles.readingValue}>{detail.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {!!metadata.length && (
              <View style={styles.metadata}>
                {metadata.map((detail) => (
                  <View key={`${action.id}-${detail.label}`} style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>{detail.label}</Text>
                    <Text style={styles.metadataValue}>{detail.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {isProcessing && <Text style={styles.processingText}>Đang xử lý xác nhận...</Text>}

            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.button, styles.reject, disabled && styles.buttonDisabled]}
                onPress={() => onDecision(action.id, "rejected")}
                disabled={disabled}
                accessibilityLabel="Bỏ qua dữ liệu sức khỏe"
              >
                <MaterialCommunityIcons name="close" size={16} color={COLORS.danger} />
                <Text style={[styles.buttonText, styles.rejectText]}>Bỏ qua</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.accept, disabled && styles.buttonDisabled]}
                onPress={() => onDecision(action.id, "accepted")}
                disabled={disabled}
                accessibilityLabel="Xác nhận lưu dữ liệu sức khỏe"
              >
                <MaterialCommunityIcons name="check" size={16} color={COLORS.white} />
                <Text style={[styles.buttonText, styles.acceptText]}>
                  {isProcessing ? "Đang xử lý..." : "Xác nhận lưu"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 8,
    marginTop: 8,
    marginHorizontal: 4,
  },
  card: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primarySoft,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text,
    fontWeight: "600",
  },
  readingGrid: {
    flexDirection: "row",
    gap: 8,
  },
  readingItem: {
    flex: 1,
    minHeight: 62,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: "center",
  },
  readingLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "700",
  },
  readingValue: {
    marginTop: 4,
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: "900",
  },
  metadata: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  metadataRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  metadataLabel: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  metadataValue: {
    flex: 1.25,
    textAlign: "right",
    fontSize: 12,
    color: COLORS.text,
    fontWeight: "800",
  },
  processingText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "700",
  },
  buttons: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flex: 1,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  accept: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  reject: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  buttonDisabled: {
    opacity: 0.62,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "800",
  },
  acceptText: {
    color: COLORS.white,
  },
  rejectText: {
    color: COLORS.danger,
  },
});

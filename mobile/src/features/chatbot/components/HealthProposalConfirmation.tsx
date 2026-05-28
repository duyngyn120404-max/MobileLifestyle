import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { PendingAction } from "../types/chatbot.types";

const COLORS = {
  surface: "#FCFEFE",
  surfaceSoft: "#EFF6F6",
  primary: "#0E7490",
  primaryDark: "#0B5F73",
  text: "#173238",
  textMuted: "#61787D",
  border: "#D9E7E8",
  success: "#1E9B73",
  danger: "#D95C5C",
  white: "#FFFFFF",
};

interface HealthProposalConfirmationProps {
  actions: PendingAction[];
  onDecision: (actionId: string, decision: "accepted" | "rejected") => void;
}

export function HealthProposalConfirmation({
  actions,
  onDecision,
}: HealthProposalConfirmationProps) {
  const pendingActions = actions.filter((action) => action.status === "pending");

  if (!pendingActions.length) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="clipboard-check-outline" size={16} color={COLORS.primary} />
        <Text style={styles.title}>Xác nhận dữ liệu sức khỏe</Text>
      </View>
      {pendingActions.map((action) => (
        <View key={action.id} style={styles.row}>
          <Text style={styles.summary}>{action.summary}</Text>
          {!!action.details?.length && (
            <View style={styles.details}>
              {action.details.map((detail) => (
                <View key={detail.label} style={styles.detail}>
                  <Text style={styles.detailKey}>{detail.label}: </Text>
                  <Text style={styles.detailValue}>{detail.value}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.accept]}
              onPress={() => onDecision(action.id, "accepted")}
            >
              <MaterialCommunityIcons name="check" size={14} color="#fff" />
              <Text style={styles.buttonText}>Xác nhận</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.reject]}
              onPress={() => onDecision(action.id, "rejected")}
            >
              <MaterialCommunityIcons name="close" size={14} color="#fff" />
              <Text style={styles.buttonText}>Bỏ qua</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 8,
    marginHorizontal: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  title: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
  row: { gap: 6, marginBottom: 10 },
  summary: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  details: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 },
  detail: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  detailKey: { fontSize: 11, color: COLORS.textMuted },
  detailValue: { fontSize: 11, color: COLORS.primaryDark, fontWeight: "700" },
  buttons: { flexDirection: "row", gap: 8, marginTop: 2 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  accept: { backgroundColor: COLORS.success },
  reject: { backgroundColor: COLORS.danger },
  buttonText: { fontSize: 12, color: COLORS.white, fontWeight: "700" },
});

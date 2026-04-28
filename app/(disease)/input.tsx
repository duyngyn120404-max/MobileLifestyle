import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Button, TextInput, Snackbar } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { DISEASE_LIST } from "@/src/constants/diseases";
import { useAuth } from "@/src/contexts/auth-context";
import { useHealthController } from "@/src/controllers/useHealthController";

export default function DiseaseInputScreen() {
  const { diseaseId, diseaseName } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { submitRecord, isLoading } = useHealthController();

  const id = (diseaseId as string) || "blood-pressure";
  const name = (diseaseName as string) || "Huyết áp";
  const disease = DISEASE_LIST.find(d => d.id === id);

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async () => {
    if (!user) {
      setSnackMessage("Vui lòng đăng nhập trước");
      setIsError(true);
      setSnackVisible(true);
      return;
    }

    if (!disease) return;

    const result = await submitRecord(user.id, disease, formData);

    if (!result.success) {
      setSnackMessage(result.error || "Lỗi khi lưu dữ liệu");
      setIsError(true);
      setSnackVisible(true);
      return;
    }

    setSnackMessage(`✅ Lưu thành công ${name}`);
    setIsError(false);
    setSnackVisible(true);
    setTimeout(() => router.back(), 1500);
  };

  const getKeyboardType = (type: string) => {
    switch (type) {
      case "decimal": return "decimal-pad";
      case "number": return "number-pad";
      default: return "default";
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Button icon="arrow-left" mode="text" onPress={() => router.back()} style={styles.backButton}>
            Trở về
          </Button>
          <Text style={styles.title}>{disease?.name || name}</Text>
          <Text style={styles.subtitle}>Nhập các chỉ số chi tiết</Text>
        </View>

        <View style={styles.form}>
          {disease?.fields.map((field, index) => (
            <View key={index} style={styles.inputGroup}>
              <Text style={styles.label}>{field.name}</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder={field.placeholder}
                  value={formData[field.name] || ""}
                  onChangeText={(value) => handleInputChange(field.name, value)}
                  keyboardType={getKeyboardType(field.type)}
                  style={styles.input}
                />
                <Text style={styles.unit}>{field.unit}</Text>
              </View>
            </View>
          ))}

          <Button
            mode="contained"
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
            loading={isLoading}
          >
            {isLoading ? "Đang lưu..." : "Lưu dữ liệu"}
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={isError ? 3000 : 2000}
        style={{ backgroundColor: isError ? "#d32f2f" : "#4caf50" }}
      >
        {snackMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scrollView: { padding: 16 },
  header: { marginBottom: 24, marginTop: 8 },
  backButton: { alignSelf: "flex-start", marginTop: 40, marginLeft: -8, transform: [{ scale: 1.2 }] },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 8, color: "#333" },
  subtitle: { fontSize: 14, color: "#666" },
  form: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 },
  inputContainer: { flexDirection: "row", alignItems: "center" },
  input: { flex: 1, marginRight: 8, borderRadius: 20 },
  unit: { fontSize: 12, color: "#999", fontWeight: "500", minWidth: 50, textAlign: "right" },
  submitButton: { marginTop: 16, paddingVertical: 8 },
});

export const screenOptions = { headerShown: false };

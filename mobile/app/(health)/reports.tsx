import { useReports } from "@/src/features/reports/hooks/useReports";
import type { ReportFilterMode } from "@/src/features/reports/hooks/useReports";
import type { HealthReport } from "@/src/features/reports/types/report.types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Card, FAB, Snackbar, Text, TextInput } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ClinicalReportCard, ReportListScreen } from "../(tabs)/stat";

const COLORS = {
  background: "#F4F8F8",
  surface: "#FCFEFE",
  primary: "#0E7490",
  primaryDark: "#0B5F73",
  text: "#16323A",
  textMuted: "#5B737B",
  border: "#D8E7E8",
};

const QUICK_FILTERS: { key: Exclude<ReportFilterMode, "custom">; label: string }[] = [
  { key: "this_week", label: "Tuần này" },
  { key: "last_4_weeks", label: "4 tuần gần đây" },
  { key: "all", label: "Tất cả" },
];

function formatDateForQuery(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPresetRange(mode: Exclude<ReportFilterMode, "custom">) {
  if (mode === "all") return { fromDate: "", toDate: "" };
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - day + 1);
  const from = new Date(monday);
  if (mode === "last_4_weeks") from.setDate(monday.getDate() - 21);
  const to = new Date(monday);
  to.setDate(monday.getDate() + 6);
  return { fromDate: formatDateForQuery(from), toDate: formatDateForQuery(to) };
}

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && formatDateForQuery(date) === value;
}

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const [detailVisible, setDetailVisible] = useState(false);
  const initialRange = getPresetRange("this_week");
  const [fromDate, setFromDate] = useState(initialRange.fromDate);
  const [toDate, setToDate] = useState(initialRange.toDate);
  const {
    report,
    reports,
    filterMode,
    isLoading,
    isRefreshing,
    isGenerating,
    error,
    loadReports,
    loadReportsByDateRange,
    refreshReport,
    generateReport,
    selectReport,
    clearError,
  } = useReports();

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  const openReport = useCallback((nextReport: HealthReport) => {
    selectReport(nextReport);
    setDetailVisible(true);
  }, [selectReport]);

  const goBack = () => {
    if (detailVisible) {
      setDetailVisible(false);
      return;
    }
    router.back();
  };

  const applyQuickFilter = (mode: Exclude<ReportFilterMode, "custom">) => {
    const range = getPresetRange(mode);
    setFromDate(range.fromDate);
    setToDate(range.toDate);
    void loadReports(mode);
  };

  const applyCustomFilter = () => {
    const trimmedFrom = fromDate.trim();
    const trimmedTo = toDate.trim();
    const nextFilters = {
      fromDate: trimmedFrom || null,
      toDate: trimmedTo || null,
    };
    if ((trimmedFrom && !isValidDateInput(trimmedFrom)) || (trimmedTo && !isValidDateInput(trimmedTo))) {
      return;
    }
    void loadReportsByDateRange(nextFilters);
  };

  const customDateInvalid = Boolean(
    (fromDate.trim() && !isValidDateInput(fromDate.trim())) ||
    (toDate.trim() && !isValidDateInput(toDate.trim()))
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {!detailVisible && (
        <View style={[styles.header, { paddingTop: Math.max(insets.top * 0.2, 6) }]}> 
          <Pressable style={styles.backButton} onPress={goBack}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.primaryDark} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Báo cáo huyết áp</Text>
            <Text style={styles.subtitle}>Danh sách báo cáo theo tuần</Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 28, 36) }]}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshReport} />}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải báo cáo...</Text>
          </View>
        ) : detailVisible && report ? (
          <ClinicalReportCard
            report={report}
            generating={isGenerating}
            onGenerate={generateReport}
            onBack={() => setDetailVisible(false)}
          />
        ) : (
          <View style={{ gap: 14 }}>
            <Card style={styles.filterCard}>
              <Card.Content style={styles.filterContent}>
                <View style={styles.filterHeaderRow}>
                  <View>
                    <Text style={styles.filterTitle}>Khoảng thời gian</Text>
                    <Text style={styles.filterSubtitle}>Lọc báo cáo theo tuần bắt đầu/kết thúc</Text>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFilterRow}>
                  {QUICK_FILTERS.map((item) => {
                    const active = filterMode === item.key;
                    return (
                      <Pressable key={item.key} style={[styles.quickFilter, active && styles.quickFilterActive]} onPress={() => applyQuickFilter(item.key)}>
                        <Text style={[styles.quickFilterText, active && styles.quickFilterTextActive]}>{item.label}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <View style={styles.dateInputRow}>
                  <TextInput
                    label="Từ ngày"
                    value={fromDate}
                    mode="outlined"
                    placeholder="YYYY-MM-DD"
                    style={styles.dateInput}
                    outlineStyle={styles.inputOutline}
                    error={Boolean(fromDate.trim() && !isValidDateInput(fromDate.trim()))}
                    onChangeText={setFromDate}
                  />
                  <TextInput
                    label="Đến ngày"
                    value={toDate}
                    mode="outlined"
                    placeholder="YYYY-MM-DD"
                    style={styles.dateInput}
                    outlineStyle={styles.inputOutline}
                    error={Boolean(toDate.trim() && !isValidDateInput(toDate.trim()))}
                    onChangeText={setToDate}
                  />
                </View>
                <Button
                  mode="contained"
                  icon="calendar-filter"
                  style={styles.applyButton}
                  buttonColor={COLORS.primary}
                  disabled={customDateInvalid}
                  onPress={applyCustomFilter}
                >
                  Áp dụng khoảng ngày
                </Button>
              </Card.Content>
            </Card>
            <ReportListScreen reports={reports} onOpenReport={openReport} />
          </View>
        )}
      </ScrollView>
      {!detailVisible && (
        <FAB
          icon="refresh"
          label={isGenerating ? "Đang tạo" : "Tạo báo cáo"}
          style={[styles.fab, { bottom: Math.max(insets.bottom + 16, 22) }]}
          color="#FFFFFF"
          customSize={58}
          loading={isGenerating}
          disabled={isGenerating}
          onPress={generateReport}
        />
      )}
      <Snackbar visible={Boolean(error)} onDismiss={clearError}>{error}</Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F3F4",
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "900",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textMuted,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 16,
  },
  filterCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterContent: {
    gap: 12,
  },
  filterHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "900",
    color: COLORS.text,
  },
  filterSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textMuted,
  },
  quickFilterRow: {
    gap: 8,
  },
  quickFilter: {
    minHeight: 36,
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  quickFilterActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickFilterText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  quickFilterTextActive: {
    color: "#FFFFFF",
  },
  dateInputRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  inputOutline: {
    borderRadius: 14,
  },
  applyButton: {
    borderRadius: 14,
  },
  fab: {
    position: "absolute",
    right: 18,
    backgroundColor: COLORS.primary,
  },
  centerWrap: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});

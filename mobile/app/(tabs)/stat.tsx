import { useReports } from "@/src/features/reports/hooks/useReports";
import type {
  BpAverages,
  HealthReport,
  MeasurementQualityItem,
} from "@/src/features/reports/types/report.types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Card, Chip, Divider, Snackbar, Text } from "react-native-paper";

const CLINICAL_FACT_LABELS: Record<string, string> = {
  diabetes: 'Tiểu đường', smoking: 'Hút thuốc', overweight: 'Thừa cân/béo phì',
  heartRateOver80: 'Nhịp tim > 80', highLDLOrTriglyceride: 'Mỡ máu cao',
  familialHypercholesterolemia: 'Tăng cholesterol gia đình',
  familyHistoryOfHypertension: 'Tiền sử gia đình tăng huyết áp',
  sedentaryLifestyle: 'Ít vận động', ageOver65: 'Tuổi > 65', male: 'Giới tính nam',
  earlyMenopause: 'Mãn kinh sớm', menopause: 'Mãn kinh',
  environmentalSocioeconomicFactors: 'Yếu tố môi trường/kinh tế xã hội',
  leftVentricularHypertrophy: 'Phì đại thất trái', kidneyDamage: 'Tổn thương thận',
  pulsePressureOver60: 'Áp lực mạch > 60', brainDamage: 'Tổn thương não',
  heartDamage: 'Tổn thương tim', vascularDamage: 'Tổn thương mạch máu',
  ckdStage3: 'Bệnh thận mạn giai đoạn 3', coronaryArteryDisease: 'Bệnh động mạch vành',
  heartFailure: 'Suy tim', stroke: 'Đột quỵ',
  peripheralVascularDisease: 'Bệnh mạch máu ngoại vi',
  atrialFibrillation: 'Rung nhĩ', ckdStage4: 'Bệnh thận mạn giai đoạn 4',
  ckdStage5: 'Bệnh thận mạn giai đoạn 5',
};

const COLORS = {
  background: "#F3F7F7",
  surface: "#FCFEFE",
  surfaceSoft: "#EFF6F6",
  surfaceStrong: "#E3F1F2",
  primary: "#0E7490",
  primaryDark: "#0B5F73",
  text: "#173238",
  textMuted: "#61787D",
  border: "#D9E7E8",
  success: "#1E9B73",
  warning: "#E7A33C",
  danger: "#D95C5C",
  info: "#4E8CFA",
};


export default function StatScreen() {
  const {
    report,
    isLoading,
    isRefreshing,
    isGenerating,
    error,
    loadLatestReport,
    refreshReport,
    generateReport,
    clearError,
  } = useReports();

  useFocusEffect(
    useCallback(() => {
      loadLatestReport();
    }, [loadLatestReport])
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải tổng quan sức khỏe...</Text>
        </View>
        <Snackbar visible={Boolean(error)} onDismiss={clearError}>{error}</Snackbar>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerWrap}>
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons name="chart-line" size={42} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có báo cáo</Text>
          <Text style={styles.emptySubtitle}>
            Nhấn bên dưới để tạo báo cáo lâm sàng từ dữ liệu huyết áp của bạn.
          </Text>
          <Pressable
            style={[styles.generateBtn, isGenerating && styles.generateBtnDisabled]}
            onPress={generateReport}
            disabled={isGenerating}
          >
            {isGenerating
              ? <ActivityIndicator size="small" color="#fff" />
              : <MaterialCommunityIcons name="file-chart-outline" size={20} color="#fff" />
            }
            <Text style={styles.generateBtnText}>
              {isGenerating ? "Đang tạo báo cáo..." : "Tạo báo cáo mới"}
            </Text>
          </Pressable>
        </View>
        <Snackbar visible={Boolean(error)} onDismiss={clearError}>{error}</Snackbar>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshReport} />
        }
        showsVerticalScrollIndicator={false}
      >
        <ClinicalReportCard
          report={report}
          generating={isGenerating}
          onGenerate={generateReport}
        />
      </ScrollView>
      <Snackbar visible={Boolean(error)} onDismiss={clearError}>{error}</Snackbar>
    </SafeAreaView>
  );
}


function SectionHeader({ icon, title }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name={icon} size={18} color={COLORS.primary} />
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function getBpCategoryLabel(v?: string) {
  switch (v) {
    case "normal": return "Bình thường";
    case "elevated": return "Tiền tăng huyết áp";
    case "hypertension": return "Tăng huyết áp";
    default: return v ?? "—";
  }
}

function getBpCategoryColor(v?: string) {
  switch (v) {
    case "normal": return COLORS.success;
    case "elevated": return COLORS.warning;
    case "hypertension": return COLORS.danger;
    default: return COLORS.textMuted;
  }
}

function getRiskLabel(v?: string) {
  switch (v) {
    case "low": return "Thấp";
    case "moderate":
    case "medium": return "Trung bình";
    case "high": return "Cao";
    case "very_high": return "Rất cao";
    default: return v ?? "—";
  }
}

function getRiskColor(v?: string) {
  switch (v) {
    case "low": return COLORS.success;
    case "moderate":
    case "medium": return COLORS.warning;
    case "high": return COLORS.danger;
    case "very_high": return "#A61E2A";
    default: return COLORS.textMuted;
  }
}

function getPhenotypeLabel(v?: string) {
  switch (v) {
    case "sustained_hypertension": return "Tăng huyết áp bền vững";
    case "white_coat_hypertension": return "Tăng huyết áp áo trắng";
    case "masked_hypertension": return "Tăng huyết áp ẩn";
    case "normal": return "Bình thường";
    default: return v ?? "—";
  }
}

function getConfidenceLabel(v?: string) {
  switch (v) {
    case "high": return "Cao";
    case "medium": return "Trung bình";
    case "low": return "Thấp";
    default: return v ?? "—";
  }
}

function getQualityColor(level?: string) {
  switch (level) {
    case "high": return COLORS.success;
    case "medium": return COLORS.warning;
    case "low": return COLORS.danger;
    default: return COLORS.textMuted;
  }
}

function getQualityLevelLabel(level?: string) {
  switch (level) {
    case "high": return "Cao";
    case "medium": return "Trung bình";
    case "low": return "Thấp";
    default: return level ?? "—";
  }
}

function getSourceLabel(source: string) {
  switch (source.toLowerCase()) {
    case "clinic": return "Đo tại phòng khám";
    case "home": return "Đo tại nhà";
    case "abpm_24h": return "ABPM 24 giờ";
    default: return source;
  }
}

function formatBp(sys?: number | null, dia?: number | null) {
  if (sys == null && dia == null) return null;
  const fmt = (v: number | null | undefined) => {
    if (v == null) return "?";
    const n = Number(v);
    return Number.isNaN(n) ? "?" : Number.isInteger(n) ? String(n) : n.toFixed(1);
  };
  return `${fmt(sys)} / ${fmt(dia)} mmHg`;
}

function MeasurementQualityCard({ items, averages }: { items: MeasurementQualityItem[]; averages?: BpAverages }) {
  return (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <SectionHeader icon="gauge" title="Chất lượng đo lường" />
        {items.map((item) => {
          const avgKey = item.source === "abpm_24h" ? "abpm" : item.source as keyof BpAverages;
          const avg = averages?.[avgKey];
          const bpStr = avg ? formatBp(avg.systolic, avg.diastolic) : null;
          return (
            <View key={item.source} style={styles.qualityItem}>
              <View style={styles.qualityItemHeader}>
                <Text style={styles.qualitySourceLabel}>{getSourceLabel(item.source)}</Text>
                <View style={[styles.qualityBadge, { backgroundColor: `${getQualityColor(item.qualityLevel)}18`, borderColor: `${getQualityColor(item.qualityLevel)}50` }]}>
                  <Text style={[styles.qualityBadgeText, { color: getQualityColor(item.qualityLevel) }]}>
                    {getQualityLevelLabel(item.qualityLevel)}
                  </Text>
                </View>
              </View>
              <View style={styles.qualityMeta}>
                <Text style={styles.qualityScore}>Điểm: {(item.qualityScore * 100).toFixed(0)}/100</Text>
                {bpStr && <Text style={styles.qualityBpAvg}>TB: {bpStr}</Text>}
                {!item.usable && <Text style={styles.qualityUnusable}>Không sử dụng được</Text>}
              </View>
              {item.flags.length > 0 && (
                <View style={styles.flagsWrap}>
                  {item.flags.map((flag) => (
                    <View key={flag} style={styles.flagPill}>
                      <Text style={styles.flagPillText}>{flag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </Card.Content>
    </Card>
  );
}


function formatTimestamp(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ClinicalReportCard({
  report,
  generating,
  onGenerate,
}: {
  report: HealthReport;
  generating: boolean;
  onGenerate: () => void;
}) {
  const cls = report.classification ?? {};
  const risk = report.risk;
  const ml = report.mlRisk;
  const reasoning = report.clinicalReasoning;
  const facts = report.clinicalFacts ?? {};
  const measurementQuality = cls.measurementQuality;
  const averages = cls.averages;

  const allFacts = Object.entries(facts).flatMap(([group, keys]) =>
    Object.entries(keys)
      .filter(([, val]) => val)
      .map(([key]) => ({ group, key }))
  );

  return (
    <View style={{ gap: 14 }}>
      {/* Header */}
      <View style={styles.reportHeader}>
        <View style={styles.reportHeaderIcon}>
          <MaterialCommunityIcons name="stethoscope" size={24} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reportHeaderTitle}>Báo cáo lâm sàng</Text>
          {!!cls.dataTimestamp && (
            <Text style={styles.reportHeaderSub}>Cập nhật: {formatTimestamp(cls.dataTimestamp)}</Text>
          )}
          {report.pipelineRan && (
            <Chip style={styles.liveChip} textStyle={styles.liveChipText}>Vừa phân tích</Chip>
          )}
        </View>
        <Pressable
          style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
          onPress={onGenerate}
          disabled={generating}
        >
          {generating
            ? <ActivityIndicator size="small" color="#fff" />
            : <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
          }
          <Text style={styles.generateBtnText}>
            {generating ? "Đang tạo..." : "Tạo mới"}
          </Text>
        </Pressable>
      </View>

      {/* Phân loại huyết áp */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <SectionHeader icon="heart-pulse" title="Phân loại huyết áp" />
          <View style={styles.categoryBadgeRow}>
            <View style={[styles.categoryBadge, { backgroundColor: `${getBpCategoryColor(cls.bpCategory)}18`, borderColor: `${getBpCategoryColor(cls.bpCategory)}50` }]}>
              <Text style={[styles.categoryBadgeText, { color: getBpCategoryColor(cls.bpCategory) }]}>
                {getBpCategoryLabel(cls.bpCategory)}
              </Text>
            </View>
            {!!cls.bpStage && (
              <View style={styles.stageBadge}>
                <Text style={styles.stageBadgeText}>{cls.bpStage}</Text>
              </View>
            )}
          </View>
          <Divider style={styles.divider} />
          {!!cls.phenotype && <InfoRow label="Kiểu hình" value={getPhenotypeLabel(cls.phenotype)} />}
          {!!cls.sourceUsed && <InfoRow label="Nguồn đo dùng phân tích" value={cls.sourceUsed} />}
          {!!cls.confidence && <InfoRow label="Độ tin cậy" value={getConfidenceLabel(cls.confidence)} />}
          {!!cls.dataSource && <InfoRow label="Dữ liệu từ" value={cls.dataSource === "live" ? "Phân tích mới" : "Lần đo lưu trữ"} />}
        </Card.Content>
      </Card>

      {/* Chất lượng đo lường */}
      {measurementQuality && measurementQuality.length > 0 && (
        <MeasurementQualityCard items={measurementQuality} averages={averages} />
      )}

      {/* Lý giải lâm sàng */}
      {!!reasoning && (
        <Card style={styles.sectionCard}>
          <Card.Content>
            <SectionHeader icon="text-box-outline" title="Lý giải lâm sàng" />
            {!!reasoning.explanation && <Text style={styles.bodyText}>{reasoning.explanation}</Text>}
            {!!reasoning.recommendation && (
              <View style={styles.recommendationBox}>
                <MaterialCommunityIcons name="lightbulb-outline" size={16} color={COLORS.primary} style={{ marginTop: 2 }} />
                <Text style={styles.recommendationText}>{reasoning.recommendation}</Text>
              </View>
            )}
            {!!reasoning.confidence && <InfoRow label="Độ tin cậy lý giải" value={getConfidenceLabel(reasoning.confidence)} />}
          </Card.Content>
        </Card>
      )}

      {/* Nguy cơ tim mạch (Stage 2) */}
      {!!risk && (
        <Card style={styles.sectionCard}>
          <Card.Content>
            <SectionHeader icon="heart-cog-outline" title="Nguy cơ tim mạch" />
            <View style={[styles.categoryBadge, { backgroundColor: `${getRiskColor(risk.riskLevel)}18`, borderColor: `${getRiskColor(risk.riskLevel)}50`, marginBottom: 12 }]}>
              <Text style={[styles.categoryBadgeText, { color: getRiskColor(risk.riskLevel) }]}>
                {getRiskLabel(risk.riskLevel)}
              </Text>
            </View>
            {!!risk.explanation && <Text style={styles.bodyText}>{risk.explanation}</Text>}
            {!!risk.recommendation && (
              <View style={styles.recommendationBox}>
                <MaterialCommunityIcons name="lightbulb-outline" size={16} color={COLORS.primary} style={{ marginTop: 2 }} />
                <Text style={styles.recommendationText}>{risk.recommendation}</Text>
              </View>
            )}
            {!!risk.confidence && <InfoRow label="Độ tin cậy" value={getConfidenceLabel(risk.confidence)} />}
            {!!risk.dataSource && <InfoRow label="Dữ liệu từ" value={risk.dataSource === "live" ? "Phân tích mới" : "Lần đánh giá lưu trữ"} />}
            {!!risk.dataTimestamp && <InfoRow label="Thời điểm đánh giá" value={formatTimestamp(risk.dataTimestamp) ?? "—"} />}
          </Card.Content>
        </Card>
      )}

      {/* Nguy cơ ML */}
      {!!ml && (
        <Card style={styles.sectionCard}>
          <Card.Content>
            <SectionHeader icon="brain" title="Đánh giá nguy cơ (AI)" />
            <View style={styles.mlRow}>
              <View style={styles.mlScoreBox}>
                <Text style={styles.mlScoreLabel}>Điểm nguy cơ</Text>
                <Text style={[styles.mlScoreValue, { color: getRiskColor(ml.riskLabel) }]}>
                  {ml.riskScore !== undefined ? `${(ml.riskScore * 100).toFixed(0)}%` : "—"}
                </Text>
              </View>
              <View style={styles.mlLabelBox}>
                <Text style={styles.mlScoreLabel}>Phân loại</Text>
                <View style={[styles.categoryBadge, { backgroundColor: `${getRiskColor(ml.riskLabel)}18`, borderColor: `${getRiskColor(ml.riskLabel)}50` }]}>
                  <Text style={[styles.categoryBadgeText, { color: getRiskColor(ml.riskLabel) }]}>
                    {getRiskLabel(ml.riskLabel)}
                  </Text>
                </View>
              </View>
            </View>
            {!!ml.modelVersion && <InfoRow label="Phiên bản mô hình" value={ml.modelVersion} />}
          </Card.Content>
        </Card>
      )}

      {/* Yếu tố lâm sàng */}
      {allFacts.length > 0 && (
        <Card style={styles.sectionCard}>
          <Card.Content>
            <SectionHeader icon="clipboard-list-outline" title="Yếu tố lâm sàng đã ghi nhận" />
            <View style={styles.pillWrap}>
              {allFacts.map(({ group, key }) => (
                <View key={`${group}-${key}`} style={styles.factPill}>
                  <Text style={styles.factPillText}>{CLINICAL_FACT_LABELS[key] ?? key}</Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
  contentContainer: { padding: 16, paddingBottom: 36 },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, fontSize: 16, color: COLORS.textMuted },
  emptyIconWrap: { width: 86, height: 86, borderRadius: 24, backgroundColor: COLORS.surfaceSoft, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 24, fontWeight: "800", color: COLORS.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 16, lineHeight: 24, color: COLORS.textMuted, textAlign: "center", maxWidth: 320 },

  // Report header
  reportHeader: { flexDirection: "row", alignItems: "flex-start", gap: 14, backgroundColor: COLORS.surface, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: COLORS.border },
  reportHeaderIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: `${COLORS.primary}14`, alignItems: "center", justifyContent: "center" },
  reportHeaderTitle: { fontSize: 22, fontWeight: "900", color: COLORS.text, marginBottom: 4 },
  reportHeaderSub: { fontSize: 13, color: COLORS.textMuted },
  liveChip: { alignSelf: "flex-start", marginTop: 6, backgroundColor: `${COLORS.success}20` },
  liveChipText: { color: COLORS.success, fontSize: 11, fontWeight: "800" },
  generateBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },

  // Section card
  sectionCard: { borderRadius: 22, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionHeaderText: { fontSize: 17, fontWeight: "900", color: COLORS.text },

  // Info row
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  infoLabel: { fontSize: 13, color: COLORS.textMuted, flex: 1 },
  infoValue: { fontSize: 13, fontWeight: "700", color: COLORS.text, flex: 1, textAlign: "right" },

  // Category/stage badges
  categoryBadgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 12 },
  categoryBadge: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  categoryBadgeText: { fontSize: 15, fontWeight: "800" },
  stageBadge: { borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.surfaceSoft },
  stageBadgeText: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  divider: { backgroundColor: COLORS.border, marginVertical: 10 },

  // Body text & recommendation
  bodyText: { fontSize: 14, lineHeight: 22, color: COLORS.text, marginBottom: 12 },
  recommendationBox: { flexDirection: "row", gap: 10, backgroundColor: `${COLORS.primary}10`, borderRadius: 14, padding: 12, marginTop: 4, marginBottom: 12, alignItems: "flex-start" },
  recommendationText: { flex: 1, fontSize: 14, lineHeight: 22, color: COLORS.text },

  // ML section
  mlRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  mlScoreBox: { flex: 1, backgroundColor: COLORS.surfaceSoft, borderRadius: 16, padding: 14 },
  mlLabelBox: { flex: 1, backgroundColor: COLORS.surfaceSoft, borderRadius: 16, padding: 14 },
  mlScoreLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6, fontWeight: "600" },
  mlScoreValue: { fontSize: 28, fontWeight: "900" },

  // Facts
  pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  factPill: { backgroundColor: COLORS.surfaceSoft, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 8 },
  factPillText: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  factPillGroup: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  // Measurement quality
  qualityItem: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  qualityItemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  qualitySourceLabel: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  qualityBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  qualityBadgeText: { fontSize: 12, fontWeight: "800" },
  qualityMeta: { flexDirection: "row", gap: 12, alignItems: "center", flexWrap: "wrap" },
  qualityScore: { fontSize: 13, color: COLORS.textMuted },
  qualityBpAvg: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  qualityUnusable: { fontSize: 12, color: COLORS.danger, fontWeight: "700" },
  flagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  flagPill: { backgroundColor: `${COLORS.warning}18`, borderRadius: 8, borderWidth: 1, borderColor: `${COLORS.warning}40`, paddingHorizontal: 8, paddingVertical: 3 },
  flagPillText: { fontSize: 11, color: COLORS.warning, fontWeight: "700" },
});

import { useAuth } from "@/src/contexts/auth-context";
import { apiClient, BpAverages, HealthcareReport, MeasurementQualityItem } from "@/src/config/apiClient";
import { Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Card, Chip, Divider, Text } from "react-native-paper";

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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [clinicalReport, setClinicalReport] = useState<HealthcareReport | null>(null);

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    const res = await apiClient.getLatestReport().catch(() => null);
    if (res) setClinicalReport(res.report);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        await fetchDashboardData();
      } catch (error) {
        console.error("LOAD_STAT_DASHBOARD_ERROR", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchDashboardData();
    } catch (error) {
      console.error("REFRESH_STAT_DASHBOARD_ERROR", error);
    } finally {
      setRefreshing(false);
    }
  };

  const onGenerate = async () => {
    try {
      setGenerating(true);
      const res = await apiClient.generateReport();
      setClinicalReport(res.report);
    } catch (error) {
      console.error("GENERATE_REPORT_ERROR", error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải tổng quan sức khỏe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!clinicalReport) {
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
            style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
            onPress={onGenerate}
            disabled={generating}
          >
            {generating
              ? <ActivityIndicator size="small" color="#fff" />
              : <MaterialCommunityIcons name="file-chart-outline" size={20} color="#fff" />
            }
            <Text style={styles.generateBtnText}>
              {generating ? "Đang tạo báo cáo..." : "Tạo báo cáo mới"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <ClinicalReportCard
          report={clinicalReport}
          generating={generating}
          onGenerate={onGenerate}
        />
      </ScrollView>
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
          const bpStr = avg ? formatBp(avg.sys, avg.dia) : null;
          return (
            <View key={item.source} style={styles.qualityItem}>
              <View style={styles.qualityItemHeader}>
                <Text style={styles.qualitySourceLabel}>{getSourceLabel(item.source)}</Text>
                <View style={[styles.qualityBadge, { backgroundColor: `${getQualityColor(item.quality_level)}18`, borderColor: `${getQualityColor(item.quality_level)}50` }]}>
                  <Text style={[styles.qualityBadgeText, { color: getQualityColor(item.quality_level) }]}>
                    {getQualityLevelLabel(item.quality_level)}
                  </Text>
                </View>
              </View>
              <View style={styles.qualityMeta}>
                <Text style={styles.qualityScore}>Điểm: {(item.quality_score * 100).toFixed(0)}/100</Text>
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
  report: HealthcareReport;
  generating: boolean;
  onGenerate: () => void;
}) {
  const cls = report.classification ?? {};
  const risk = report.risk;
  const ml = report.ml_risk;
  const reasoning = report.clinical_reasoning;
  const facts = report.clinical_facts ?? {};
  const measurementQuality = cls.measurement_quality as MeasurementQualityItem[] | undefined;
  const averages = cls.averages as BpAverages | undefined;

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
          {!!cls.data_timestamp && (
            <Text style={styles.reportHeaderSub}>Cập nhật: {formatTimestamp(cls.data_timestamp as string)}</Text>
          )}
          {report.pipeline_ran && (
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
            <View style={[styles.categoryBadge, { backgroundColor: `${getBpCategoryColor(cls.bp_category)}18`, borderColor: `${getBpCategoryColor(cls.bp_category)}50` }]}>
              <Text style={[styles.categoryBadgeText, { color: getBpCategoryColor(cls.bp_category) }]}>
                {getBpCategoryLabel(cls.bp_category)}
              </Text>
            </View>
            {!!cls.bp_stage && (
              <View style={styles.stageBadge}>
                <Text style={styles.stageBadgeText}>{cls.bp_stage}</Text>
              </View>
            )}
          </View>
          <Divider style={styles.divider} />
          {!!cls.phenotype && <InfoRow label="Kiểu hình" value={getPhenotypeLabel(cls.phenotype as string)} />}
          {!!cls.source_used && <InfoRow label="Nguồn đo dùng phân tích" value={cls.source_used as string} />}
          {!!cls.confidence && <InfoRow label="Độ tin cậy" value={getConfidenceLabel(cls.confidence as string)} />}
          {!!cls.data_source && <InfoRow label="Dữ liệu từ" value={cls.data_source === "live" ? "Phân tích mới" : "Lần đo lưu trữ"} />}
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
            <View style={[styles.categoryBadge, { backgroundColor: `${getRiskColor(risk.risk_level)}18`, borderColor: `${getRiskColor(risk.risk_level)}50`, marginBottom: 12 }]}>
              <Text style={[styles.categoryBadgeText, { color: getRiskColor(risk.risk_level) }]}>
                {getRiskLabel(risk.risk_level)}
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
            {!!risk.data_source && <InfoRow label="Dữ liệu từ" value={risk.data_source === "live" ? "Phân tích mới" : "Lần đánh giá lưu trữ"} />}
            {!!risk.data_timestamp && <InfoRow label="Thời điểm đánh giá" value={formatTimestamp(risk.data_timestamp) ?? "—"} />}
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
                <Text style={[styles.mlScoreValue, { color: getRiskColor(ml.risk_label) }]}>
                  {ml.risk_score !== undefined ? `${(ml.risk_score * 100).toFixed(0)}%` : "—"}
                </Text>
              </View>
              <View style={styles.mlLabelBox}>
                <Text style={styles.mlScoreLabel}>Phân loại</Text>
                <View style={[styles.categoryBadge, { backgroundColor: `${getRiskColor(ml.risk_label)}18`, borderColor: `${getRiskColor(ml.risk_label)}50` }]}>
                  <Text style={[styles.categoryBadgeText, { color: getRiskColor(ml.risk_label) }]}>
                    {getRiskLabel(ml.risk_label)}
                  </Text>
                </View>
              </View>
            </View>
            {!!ml.model_version && <InfoRow label="Phiên bản mô hình" value={ml.model_version} />}
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

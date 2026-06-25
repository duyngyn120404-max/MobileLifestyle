import { useReports } from "@/src/features/reports/hooks/useReports";
import type {
  BpAverages,
  HealthReport,
  MeasurementQualityItem,
} from "@/src/features/reports/types/report.types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
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
import { Card, Chip, Snackbar, Text } from "react-native-paper";

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
  white: "#FFFFFF",
};


export default function StatScreen() {
  const {
    report,
    isLoading,
    isGenerating,
    error,
    loadLatestReport,
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => void loadLatestReport()} />
        }
        showsVerticalScrollIndicator={false}
      >
        {report ? (
          <ClinicalReportCard
            report={report}
            generating={isGenerating}
            onGenerate={generateReport}
          />
        ) : (
          <Card style={styles.sectionCard}>
            <Card.Content style={styles.emptyReportCard}>
              <MaterialCommunityIcons name="chart-line" size={42} color={COLORS.primary} />
              <Text style={styles.emptyTitle}>Chưa có báo cáo</Text>
              <Text style={styles.emptySubtitle}>Tạo báo cáo tuần này từ dữ liệu đo huyết áp đã ghi nhận.</Text>
              <Pressable style={styles.generateBtn} onPress={generateReport} disabled={isGenerating}>
                {isGenerating ? <ActivityIndicator size="small" color="#fff" /> : <MaterialCommunityIcons name="refresh" size={16} color="#fff" />}
                <Text style={styles.generateBtnText}>{isGenerating ? "Đang tạo..." : "Tạo báo cáo"}</Text>
              </Pressable>
            </Card.Content>
          </Card>
        )}
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
    case "white_coat": return "Tăng huyết áp áo trắng";
    case "masked": return "Tăng huyết áp ẩn";
    case "sustained": return "Tăng huyết áp bền vững";
    case "none": return "Không ghi nhận kiểu hình tăng huyết áp";
    case "unknown": return "Chưa xác định";
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

function getQualityColor(level?: string | null) {
  switch (level) {
    case "high": return COLORS.success;
    case "medium": return COLORS.warning;
    case "low": return COLORS.danger;
    default: return COLORS.textMuted;
  }
}

function getQualityLevelLabel(level?: string | null) {
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
    case "hbpm": return "Đo tại nhà";
    case "obpm": return "Đo tại phòng khám";
    case "abpm": return "ABPM 24 giờ";
    default: return source;
  }
}

function getSourceUsedLabel(source?: string) {
  if (!source) return null;
  return getSourceLabel(source);
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
        <SectionHeader icon="gauge" title="Độ tin cậy dữ liệu đo" />
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
                <Text style={styles.qualityScore}>
                  Điểm: {item.qualityScore == null ? "—" : `${(item.qualityScore * 100).toFixed(0)}/100`}
                </Text>
                {bpStr && <Text style={styles.qualityBpAvg}>Tổng hợp: {bpStr}</Text>}
                {item.usable === false && <Text style={styles.qualityUnusable}>Không sử dụng được</Text>}
                {item.usable === null && <Text style={styles.qualityUnknown}>Chưa xác định khả dụng</Text>}
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

function getAverageForSource(averages?: BpAverages, source?: string) {
  if (!averages) return null;
  const key = source === "abpm_24h" || source === "ABPM" ? "abpm" : source === "clinic" || source === "OBPM" ? "clinic" : "home";
  return averages[key as keyof BpAverages] ?? null;
}

function getPatientSummaryText(category?: string) {
  switch (category) {
    case "normal":
      return "Các chỉ số hiện tại nằm trong vùng bình thường. Hãy tiếp tục duy trì thói quen đo đều đặn.";
    case "elevated":
      return "Chỉ số có xu hướng cao hơn mức tối ưu. Đây là thời điểm phù hợp để theo dõi sát hơn và điều chỉnh lối sống.";
    case "hypertension":
      return "Chỉ số phù hợp với tăng huyết áp. Bạn nên theo dõi đều và trao đổi với nhân viên y tế nếu kết quả lặp lại nhiều lần.";
    default:
      return "Chưa đủ dữ liệu để kết luận chắc chắn. Hãy tiếp tục ghi nhận các buổi đo sáng và tối.";
  }
}

function getDataConfidenceText(level?: string) {
  switch (level) {
    case "high": return "Dữ liệu đo khá đầy đủ, kết quả có thể dùng để tham khảo tốt.";
    case "medium": return "Dữ liệu có thể dùng để tham khảo, nhưng đo thêm vài ngày sẽ giúp kết quả chắc chắn hơn.";
    case "low": return "Dữ liệu còn ít hoặc chưa đủ đều. Kết quả chỉ nên xem là gợi ý ban đầu.";
    default: return "Chưa đủ thông tin để đánh giá độ tin cậy của dữ liệu đo.";
  }
}

const REPORT_TABS = [
  { key: "overview", label: "Tổng quan", icon: "heart-pulse" },
  { key: "advice", label: "Khuyến nghị", icon: "lightbulb-outline" },
  { key: "risk", label: "Nguy cơ", icon: "heart-cog-outline" },
  { key: "data", label: "Dữ liệu", icon: "database-eye-outline" },
] as const;

type ReportTab = typeof REPORT_TABS[number]["key"];

function formatDateShort(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function formatWeekRange(report: HealthReport) {
  if (report.weekStart && report.weekEnd) {
    return `Tuần ${formatDateShort(report.weekStart)} - ${formatDateShort(report.weekEnd)}`;
  }
  return formatTimestamp(report.createdAt ?? report.classification?.dataTimestamp) ?? "Báo cáo huyết áp";
}

function getReportAverageText(report: HealthReport) {
  const avg = getAverageForSource(report.classification?.averages, report.classification?.sourceUsed);
  return avg ? formatBp(avg.systolic, avg.diastolic) : null;
}

function getReportPrimaryQuality(report: HealthReport) {
  const quality = report.classification?.measurementQuality;
  return quality?.find((item) => item.source === report.classification?.sourceUsed)
    ?? quality?.find((item) => item.usable)
    ?? quality?.[0]
    ?? null;
}

export function ReportListScreen({
  reports,
  onOpenReport,
}: {
  reports: HealthReport[];
  onOpenReport: (report: HealthReport) => void;
}) {
  return (
    <View style={{ gap: 14 }}>
      {reports.length === 0 ? (
        <Card style={styles.sectionCard}>
          <Card.Content style={styles.emptyReportCard}>
            <MaterialCommunityIcons name="chart-line" size={42} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>Chưa có báo cáo</Text>
            <Text style={styles.emptySubtitle}>Tạo báo cáo tuần này từ dữ liệu đo huyết áp đã ghi nhận.</Text>
          </Card.Content>
        </Card>
      ) : reports.map((item) => {
        const avgText = getReportAverageText(item);
        const quality = getReportPrimaryQuality(item);
        return (
          <Pressable key={item.id ?? `${item.weekStart}-${item.createdAt}`} onPress={() => onOpenReport(item)}>
            <Card style={styles.reportListCard}>
              <Card.Content>
                <View style={styles.reportCardHeader}>
                  <Text style={styles.reportWeekTitle}>{formatWeekRange(item)}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textMuted} />
                </View>
                <Text style={[styles.reportCategoryTitle, { color: getBpCategoryColor(item.classification?.bpCategory) }]}>{getBpCategoryLabel(item.classification?.bpCategory)}</Text>
                <View style={styles.reportListMeta}>
                  <Text style={styles.reportListMetaText}>Huyết áp: {avgText ?? "—"}</Text>
                  <Text style={styles.reportListMetaText}>Độ tin cậy: {getQualityLevelLabel(quality?.qualityLevel)}</Text>
                  <Text style={styles.reportListMetaText}>Cập nhật: {formatTimestamp(item.updatedAt ?? item.createdAt) ?? "—"}</Text>
                </View>
              </Card.Content>
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ClinicalReportCard({
  report,
  generating,
  onGenerate,
  onBack,
}: {
  report: HealthReport;
  generating: boolean;
  onGenerate: () => void;
  onBack?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const cls = report.classification ?? {};
  const risk = report.risk;
  const ml = report.mlRisk;
  const reasoning = report.clinicalReasoning;
  const facts = report.clinicalFacts ?? {};
  const measurementQuality = cls.measurementQuality;
  const averages = cls.averages;
  const sourceLabel = getSourceUsedLabel(cls.sourceUsed) ?? "dữ liệu đã ghi nhận";
  const mainAverage = getAverageForSource(averages, cls.sourceUsed);
  const mainAverageText = mainAverage ? formatBp(mainAverage.systolic, mainAverage.diastolic) : null;
  const primaryQuality = measurementQuality?.find((item) => item.source === cls.sourceUsed)
    ?? measurementQuality?.find((item) => item.usable)
    ?? measurementQuality?.[0];

  const allFacts = Object.entries(facts).flatMap(([group, keys]) =>
    Object.entries(keys)
      .filter(([, val]) => val)
      .map(([key]) => ({ group, key }))
  );

  return (
    <View style={{ gap: 14 }}>
      <View style={styles.reportHeader}>
        {onBack && (
          <Pressable style={styles.backButton} onPress={onBack}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.primary} />
          </Pressable>
        )}
        <View style={styles.reportHeaderIcon}>
          <MaterialCommunityIcons name="heart-pulse" size={24} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reportHeaderTitle}>Báo cáo sức khỏe của bạn</Text>
          <Text style={styles.reportHeaderSub}>{formatWeekRange(report)}</Text>
          {!!cls.dataTimestamp && (
            <Text style={styles.reportHeaderSub}>Cập nhật: {formatTimestamp(cls.dataTimestamp)}</Text>
          )}
          {report.pipelineRan && (
            <Chip style={styles.liveChip} textStyle={styles.liveChipText}>Đã phân tích dữ liệu mới</Chip>
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {REPORT_TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable key={tab.key} style={[styles.tabButton, active && styles.tabButtonActive]} onPress={() => setActiveTab(tab.key)}>
              <MaterialCommunityIcons name={tab.icon as never} size={16} color={active ? COLORS.white : COLORS.primary} />
              <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {activeTab === "overview" && (
        <>
          <Card style={[styles.sectionCard, styles.summaryCard]}>
            <Card.Content>
              <Text style={styles.summaryLabel}>Kết quả tổng quan</Text>
              <Text style={[styles.summaryTitle, { color: getBpCategoryColor(cls.bpCategory) }]}>{getBpCategoryLabel(cls.bpCategory)}</Text>
              <Text style={styles.summaryText}>{getPatientSummaryText(cls.bpCategory)}</Text>
              <View style={styles.summaryMetricRow}>
                <View style={styles.summaryMetricBox}>
                  <Text style={styles.summaryMetricLabel}>Huyết áp tổng hợp</Text>
                  <Text style={styles.summaryMetricValue}>{mainAverageText ?? "—"}</Text>
                </View>
                <View style={styles.summaryMetricBox}>
                  <Text style={styles.summaryMetricLabel}>Dựa trên</Text>
                  <Text style={styles.summaryMetricValueSmall}>{sourceLabel}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
          {!!reasoning && (
            <Card style={styles.sectionCard}>
              <Card.Content>
                <SectionHeader icon="text-box-outline" title="Kết quả này có nghĩa là gì?" />
                {!!reasoning.explanation && <Text style={styles.bodyText}>{reasoning.explanation}</Text>}
                {!!cls.phenotype && <InfoRow label="Kiểu huyết áp" value={getPhenotypeLabel(cls.phenotype)} />}
                {!!cls.confidence && <InfoRow label="Mức chắc chắn" value={getConfidenceLabel(cls.confidence)} />}
              </Card.Content>
            </Card>
          )}
        </>
      )}

      {activeTab === "advice" && (
        <Card style={styles.sectionCard}>
          <Card.Content>
            <SectionHeader icon="lightbulb-outline" title="Bạn nên làm gì tiếp?" />
            <View style={styles.recommendationBox}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color={COLORS.primary} style={{ marginTop: 2 }} />
              <Text style={styles.recommendationText}>{reasoning?.recommendation ?? "Tiếp tục đo huyết áp đều đặn vào buổi sáng và buổi tối. Khi có thêm dữ liệu, hãy tạo lại báo cáo để kết quả chính xác hơn."}</Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {activeTab === "risk" && (
        <>
          {!!risk && <Card style={styles.sectionCard}><Card.Content><SectionHeader icon="heart-cog-outline" title="Nguy cơ tim mạch" />
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
          </Card.Content></Card>}
          {!!ml && <Card style={styles.sectionCard}><Card.Content>
            <SectionHeader icon="brain" title="Ước tính nguy cơ bổ sung" />
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
          </Card.Content></Card>}
          {!risk && !ml && <Text style={styles.emptyTabText}>Chưa có phần đánh giá nguy cơ trong báo cáo này.</Text>}
        </>
      )}

      {activeTab === "data" && (
        <>
          {primaryQuality && <Card style={styles.sectionCard}><Card.Content><SectionHeader icon="shield-check-outline" title="Độ tin cậy của kết quả" />
            <View style={styles.confidenceRow}>
              <View style={[styles.qualityBadge, { backgroundColor: `${getQualityColor(primaryQuality.qualityLevel)}18`, borderColor: `${getQualityColor(primaryQuality.qualityLevel)}50` }]}><Text style={[styles.qualityBadgeText, { color: getQualityColor(primaryQuality.qualityLevel) }]}>{getQualityLevelLabel(primaryQuality.qualityLevel)}</Text></View>
              <Text style={styles.qualityScore}>{primaryQuality.qualityScore == null ? "Chưa có điểm" : `${(primaryQuality.qualityScore * 100).toFixed(0)}/100`}</Text>
            </View>
            <Text style={styles.bodyText}>{getDataConfidenceText(primaryQuality.qualityLevel ?? cls.confidence)}</Text>
          </Card.Content></Card>}
          {measurementQuality && measurementQuality.length > 0 && <MeasurementQualityCard items={measurementQuality} averages={averages} />}
          {allFacts.length > 0 && <Card style={styles.sectionCard}><Card.Content><SectionHeader icon="clipboard-list-outline" title="Yếu tố sức khỏe đã ghi nhận" />
            <View style={styles.pillWrap}>
              {allFacts.map(({ group, key }) => (
                <View key={`${group}-${key}`} style={styles.factPill}>
                  <Text style={styles.factPillText}>{CLINICAL_FACT_LABELS[key] ?? key}</Text>
                </View>
              ))}
            </View>
          </Card.Content></Card>}
        </>
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
  backButton: { width: 38, height: 38, borderRadius: 14, backgroundColor: COLORS.surfaceSoft, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  reportHeaderIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: `${COLORS.primary}14`, alignItems: "center", justifyContent: "center" },
  reportHeaderTitle: { fontSize: 22, fontWeight: "900", color: COLORS.text, marginBottom: 4 },
  reportHeaderSub: { fontSize: 13, color: COLORS.textMuted },
  liveChip: { alignSelf: "flex-start", marginTop: 6, backgroundColor: `${COLORS.success}20` },
  liveChipText: { color: COLORS.success, fontSize: 11, fontWeight: "800" },
  generateBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },

  // Report filters & tabs
  reportListCard: { borderRadius: 18, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  reportCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 },
  reportWeekTitle: { flex: 1, fontSize: 14, fontWeight: "900", color: COLORS.text },
  reportCategoryTitle: { fontSize: 22, fontWeight: "900", marginBottom: 10 },
  reportListMeta: { gap: 5 },
  reportListMetaText: { fontSize: 13, color: COLORS.textMuted, fontWeight: "700" },
  emptyReportCard: { alignItems: "center", paddingVertical: 24 },
  tabRow: { gap: 8, paddingRight: 8 },
  tabButton: { minHeight: 38, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 19, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, paddingHorizontal: 13 },
  tabButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabButtonText: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
  tabButtonTextActive: { color: COLORS.white },
  emptyTabText: { fontSize: 14, lineHeight: 22, color: COLORS.textMuted, textAlign: "center", padding: 18 },

  // Section card
  sectionCard: { borderRadius: 22, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionHeaderText: { fontSize: 17, fontWeight: "900", color: COLORS.text },

  // Patient summary
  summaryCard: { borderColor: `${COLORS.primary}35`, backgroundColor: COLORS.surface },
  summaryLabel: { fontSize: 13, fontWeight: "800", color: COLORS.textMuted, marginBottom: 6 },
  summaryTitle: { fontSize: 30, fontWeight: "900", marginBottom: 8 },
  summaryText: { fontSize: 15, lineHeight: 23, color: COLORS.text, marginBottom: 14 },
  summaryMetricRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  summaryMetricBox: { flex: 1, minWidth: 130, backgroundColor: COLORS.surfaceSoft, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  summaryMetricLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: "700", marginBottom: 5 },
  summaryMetricValue: { fontSize: 18, color: COLORS.text, fontWeight: "900" },
  summaryMetricValueSmall: { fontSize: 14, color: COLORS.text, fontWeight: "800" },

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
  confidenceRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  qualityItem: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  qualityItemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  qualitySourceLabel: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  qualityBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  qualityBadgeText: { fontSize: 12, fontWeight: "800" },
  qualityMeta: { flexDirection: "row", gap: 12, alignItems: "center", flexWrap: "wrap" },
  qualityScore: { fontSize: 13, color: COLORS.textMuted },
  qualityBpAvg: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  qualityUnusable: { fontSize: 12, color: COLORS.danger, fontWeight: "700" },
  qualityUnknown: { fontSize: 12, color: COLORS.textMuted, fontWeight: "700" },
  flagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  flagPill: { backgroundColor: `${COLORS.warning}18`, borderRadius: 8, borderWidth: 1, borderColor: `${COLORS.warning}40`, paddingHorizontal: 8, paddingVertical: 3 },
  flagPillText: { fontSize: 11, color: COLORS.warning, fontWeight: "700" },
});

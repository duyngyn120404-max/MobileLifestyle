import { useAuth } from "@/src/contexts/auth-context";
import { supabase, TABLES } from "@/src/services/supabase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Card, Chip, Divider, Text } from "react-native-paper";

type BpRecord = {
  id: string;
  user_id: string;
  systolic: number;
  diastolic: number;
  source: string;
  day_period: string | null;
  position: string | null;
  rested_minutes: number | null;
  device_type: string | null;
  device_validated: boolean | null;
  status: string;
  severity: string | null;
  created_at: string;
};

type ClinicalFact = {
  id: string;
  user_id: string;
  fact_group: string;
  fact_key: string;
  value: boolean | string | number;
  status: string;
  severity: string | null;
  source: string;
  created_at?: string;
  updated_at?: string;
};

const { width } = Dimensions.get("window");
const chartWidth = width - 40;

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

const FACT_LABELS: Record<string, string> = {
  diabetes: "Đái tháo đường",
  smoking: "Hút thuốc lá",
  overweight: "Thừa cân hoặc béo phì",
  heartRateOver80: "Nhịp tim thường trên 80 lần/phút",
  highLDLOrTriglyceride: "Mỡ máu cao hoặc triglyceride cao",
  familialHypercholesterolemia: "Tăng cholesterol máu có tính gia đình",
  familyHistoryOfHypertension: "Gia đình có người bị tăng huyết áp",
  earlyMenopause: "Mãn kinh sớm",
  menopause: "Đã mãn kinh",
  sedentaryLifestyle: "Ít vận động",
  environmentalSocioeconomicFactors:
    "Yếu tố môi trường hoặc kinh tế xã hội bất lợi",
  leftVentricularHypertrophy: "Phì đại thất trái",
  brainDamage: "Tổn thương não",
  heartDamage: "Tổn thương tim",
  kidneyDamage: "Tổn thương thận",
  vascularDamage: "Tổn thương mạch máu",
  ckdStage3: "Bệnh thận mạn giai đoạn 3",
  pulsePressureOver60: "Hiệu áp trên 60 mmHg",
  coronaryArteryDisease: "Bệnh động mạch vành",
  heartFailure: "Suy tim",
  stroke: "Đột quỵ",
  peripheralVascularDisease: "Bệnh mạch máu ngoại biên",
  atrialFibrillation: "Rung nhĩ",
  ckdStage4: "Bệnh thận mạn giai đoạn 4",
  ckdStage5: "Bệnh thận mạn giai đoạn 5",
};

function getSeverityLabel(severity: string | null) {
  switch (severity) {
    case "normal":
      return "Huyết áp không tăng";
    case "elevated":
      return "Tiền tăng huyết áp";
    case "stage_1":
      return "Tăng huyết áp độ 1";
    case "stage_2":
      return "Tăng huyết áp độ 2";
    case "crisis":
      return "Mức nguy hiểm";
    case "low":
      return "Rủi ro thấp";
    case "high":
      return "Rủi ro cao";
    default:
      return "Chưa phân loại";
  }
}

function getSeverityColor(severity: string | null) {
  switch (severity) {
    case "normal":
      return COLORS.success;
    case "elevated":
      return COLORS.warning;
    case "stage_1":
      return "#F57C00";
    case "stage_2":
      return COLORS.danger;
    case "crisis":
      return "#A61E2A";
    case "low":
      return COLORS.info;
    default:
      return COLORS.textMuted;
  }
}

function getSeverityMessage(severity: string | null) {
  switch (severity) {
    case "normal":
      return "Kết quả đo gần đây đang ở ngưỡng ổn định.";
    case "elevated":
      return "Huyết áp đang nhỉnh hơn bình thường, nên tiếp tục theo dõi đều.";
    case "stage_1":
      return "Bạn đang có mức tăng huyết áp cần được theo dõi sát hơn.";
    case "stage_2":
      return "Chỉ số đang cao rõ rệt, nên kiểm tra và theo dõi thường xuyên.";
    case "crisis":
      return "Chỉ số rất cao và cần được ưu tiên đánh giá sớm.";
    case "low":
      return "Huyết áp đang thấp hơn bình thường, nên lưu ý triệu chứng đi kèm.";
    default:
      return "Cần thêm dữ liệu để đánh giá rõ ràng hơn.";
  }
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

function mapDayPeriod(value: string | null) {
  switch (value) {
    case "morning":
      return "Buổi sáng";
    case "evening":
      return "Buổi tối";
    case "day":
      return "Ban ngày";
    case "night":
      return "Ban đêm";
    default:
      return "Chưa rõ";
  }
}

function mapPosition(value: string | null) {
  switch (value) {
    case "sitting":
      return "Ngồi";
    case "standing":
      return "Đứng";
    case "lying":
      return "Nằm";
    default:
      return "Chưa rõ";
  }
}

function mapDeviceType(value: string | null) {
  switch (value) {
    case "upper_arm":
      return "Máy đo bắp tay";
    case "wrist":
      return "Máy đo cổ tay";
    default:
      return "Chưa rõ";
  }
}

function getFactLabel(key: string) {
  return FACT_LABELS[key] || key;
}

function getTruthyFacts(facts: ClinicalFact[], group: string) {
  return facts
    .filter((item) => item.fact_group === group && Boolean(item.value))
    .map((item) => ({
      ...item,
      label: getFactLabel(item.fact_key),
    }));
}

function buildRiskNarrative(
  riskCount: number,
  hmodCount: number,
  cvdCount: number,
  symptomCount: number,
) {
  if (riskCount === 0 && hmodCount === 0 && cvdCount === 0) {
    return "Hồ sơ hiện tại chưa ghi nhận yếu tố nguy cơ hoặc tổn thương nổi bật, nhưng bạn vẫn nên tiếp tục đo đều để theo dõi xu hướng theo thời gian.";
  }

  if (cvdCount > 0 || hmodCount > 0) {
    return "Hồ sơ đang cho thấy không chỉ có thay đổi huyết áp mà còn có bệnh lý hoặc tổn thương liên quan, vì vậy việc theo dõi đều đặn có ý nghĩa rất quan trọng.";
  }

  if (riskCount >= 4) {
    return "Bạn đang có khá nhiều yếu tố nguy cơ nền, nên kết quả huyết áp cần được nhìn trong bối cảnh theo dõi sát và duy trì lối sống, điều trị ổn định.";
  }

  if (symptomCount > 0) {
    return "Ngoài chỉ số đo, bạn còn có các triệu chứng đi kèm đã được ghi nhận, điều này giúp việc đánh giá tình trạng trở nên thực tế và đầy đủ hơn.";
  }

  return "Hiện tại đã có một số yếu tố nguy cơ được ghi nhận, vì vậy việc đo huyết áp đều và xem xu hướng theo thời gian sẽ hữu ích hơn nhiều so với chỉ nhìn một lần đo đơn lẻ.";
}

export default function StatScreen() {
  const { user } = useAuth();
  const [records, setRecords] = useState<BpRecord[]>([]);
  const [facts, setFacts] = useState<ClinicalFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BpRecord | null>(null);

  const fetchDashboardData = async () => {
    if (!user?.id) return;

    const [bpRes, factRes] = await Promise.all([
      supabase
        .from(TABLES.BP_RECORDS)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),

      supabase
        .from(TABLES.CLINICAL_FACTS)
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
    ]);

    if (bpRes.error) throw bpRes.error;
    if (factRes.error) throw factRes.error;

    setRecords((bpRes.data ?? []) as BpRecord[]);
    setFacts((factRes.data ?? []) as ClinicalFact[]);
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

  const latestRecord = records[0] ?? null;

  const riskFacts = useMemo(
    () => getTruthyFacts(facts, "risk_factors"),
    [facts],
  );
  const hmodFacts = useMemo(() => getTruthyFacts(facts, "hmod"), [facts]);
  const cvdFacts = useMemo(
    () => getTruthyFacts(facts, "cardiovascular_disease"),
    [facts],
  );
  const symptomFacts = useMemo(
    () => getTruthyFacts(facts, "symptoms"),
    [facts],
  );
  const medicationFacts = useMemo(
    () => getTruthyFacts(facts, "medications"),
    [facts],
  );

  const summary = useMemo(() => {
    if (!records.length) {
      return {
        avgSys: 0,
        avgDia: 0,
        highestSys: 0,
        lowestDia: 0,
        abnormalCount: 0,
      };
    }

    const avgSys = Math.round(
      records.reduce((sum, item) => sum + Number(item.systolic || 0), 0) /
        records.length,
    );
    const avgDia = Math.round(
      records.reduce((sum, item) => sum + Number(item.diastolic || 0), 0) /
        records.length,
    );
    const highestSys = Math.max(
      ...records.map((item) => Number(item.systolic || 0)),
    );
    const lowestDia = Math.min(
      ...records.map((item) => Number(item.diastolic || 0)),
    );
    const abnormalCount = records.filter((item) =>
      ["elevated", "stage_1", "stage_2", "crisis", "low"].includes(
        item.severity || "",
      ),
    ).length;

    return { avgSys, avgDia, highestSys, lowestDia, abnormalCount };
  }, [records]);

  const trendData = useMemo(() => {
    const sorted = [...records].slice(0, 7).reverse();

    return {
      labels: sorted.map((item) => formatShortDate(item.created_at)),
      systolic: sorted.map((item) => item.systolic),
      diastolic: sorted.map((item) => item.diastolic),
    };
  }, [records]);

  const narrative = useMemo(
    () =>
      buildRiskNarrative(
        riskFacts.length,
        hmodFacts.length,
        cvdFacts.length,
        symptomFacts.length,
      ),
    [riskFacts.length, hmodFacts.length, cvdFacts.length, symptomFacts.length],
  );

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

  if (!records.length && !facts.length) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerWrap}>
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons
              name="chart-line"
              size={42}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.emptyTitle}>Chưa có dữ liệu thống kê</Text>
          <Text style={styles.emptySubtitle}>
            Khi bạn lưu kết quả đo và hồ sơ sức khỏe, màn này sẽ hiển thị biểu
            đồ, phân tích và báo cáo chi tiết.
          </Text>
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
        <View style={styles.heroCardCompact}>
          <View style={styles.heroCompactTop}>
            <View style={styles.heroMiniIcon}>
              <MaterialCommunityIcons
                name="heart-pulse"
                size={22}
                color={COLORS.primary}
              />
            </View>

            <Chip
              style={styles.heroMiniChip}
              textStyle={styles.heroMiniChipText}
            >
              Hồ sơ cá nhân
            </Chip>
          </View>

          <Text style={styles.heroCompactTitle}>Tổng quan sức khỏe</Text>
          <Text style={styles.heroCompactSubtitle}>
            Dựa trên kết quả đo gần nhất và hồ sơ nguy cơ hiện tại.
          </Text>

          {latestRecord && (
            <View style={styles.heroCompactReading}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroCompactReadingLabel}>
                  Lần đo gần nhất
                </Text>
                <Text style={styles.heroCompactReadingValue}>
                  {latestRecord.systolic}/{latestRecord.diastolic} mmHg
                </Text>
                <Text style={styles.heroCompactReadingNote}>
                  {formatDateTime(latestRecord.created_at)}
                </Text>
              </View>

              <Chip
                style={[
                  styles.severityChip,
                  {
                    backgroundColor: `${getSeverityColor(latestRecord.severity)}20`,
                  },
                ]}
                textStyle={{
                  color: getSeverityColor(latestRecord.severity),
                  fontWeight: "800",
                }}
              >
                {getSeverityLabel(latestRecord.severity)}
              </Chip>
            </View>
          )}
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            icon="arrow-up-thin"
            title="SYS trung bình"
            value={String(summary.avgSys)}
            subtitle="mmHg"
            color={COLORS.danger}
          />
          <MetricCard
            icon="arrow-down-thin"
            title="DIA trung bình"
            value={String(summary.avgDia)}
            subtitle="mmHg"
            color={COLORS.info}
          />
          <MetricCard
            icon="trending-up"
            title="SYS cao nhất"
            value={String(summary.highestSys)}
            subtitle="mmHg"
            color={COLORS.warning}
          />
          <MetricCard
            icon="alert-circle-outline"
            title="Đo bất thường"
            value={String(summary.abnormalCount)}
            subtitle="bản ghi"
            color={COLORS.primary}
          />
        </View>

        {!!records.length && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>
                Xu hướng 7 lần đo gần nhất
              </Text>
              <Text style={styles.sectionSubtitle}>
                Biểu đồ giúp bạn nhìn rõ sự thay đổi của huyết áp tâm thu và tâm
                trương theo thời gian.
              </Text>

              <LineChart
                data={{
                  labels: trendData.labels,
                  datasets: [
                    {
                      data: trendData.systolic.length
                        ? trendData.systolic
                        : [0],
                      color: () => COLORS.danger,
                      strokeWidth: 3,
                    },
                    {
                      data: trendData.diastolic.length
                        ? trendData.diastolic
                        : [0],
                      color: () => COLORS.info,
                      strokeWidth: 3,
                    },
                  ],
                  legend: ["Tâm thu", "Tâm trương"],
                }}
                width={chartWidth - 16}
                height={270}
                withDots
                withShadow={false}
                withInnerLines
                withOuterLines={false}
                fromZero={false}
                bezier
                chartConfig={{
                  backgroundColor: COLORS.surface,
                  backgroundGradientFrom: COLORS.surface,
                  backgroundGradientTo: COLORS.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(23, 50, 56, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(97, 120, 125, ${opacity})`,
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: "#fff",
                  },
                  propsForBackgroundLines: {
                    stroke: "#E5F0F0",
                  },
                }}
                style={styles.chart}
              />
            </Card.Content>
          </Card>
        )}

        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Hiểu về tình trạng của bạn</Text>
            <Text style={styles.sectionSubtitle}>
              Hồ sơ dưới đây giúp bạn nhìn kết quả đo trong bối cảnh nguy cơ,
              bệnh liên quan và điều trị hiện tại.
            </Text>

            <View style={styles.insightGrid}>
              <InsightBox
                icon="alert-circle-outline"
                title="Yếu tố nguy cơ"
                value={`${riskFacts.length}`}
                note={
                  riskFacts.length
                    ? "Có yếu tố nền cần tiếp tục theo dõi"
                    : "Chưa ghi nhận nổi bật"
                }
                color={COLORS.warning}
              />
              <InsightBox
                icon="heart-plus-outline"
                title="Tổn thương cơ quan đích"
                value={`${hmodFacts.length}`}
                note={
                  hmodFacts.length
                    ? "Đã có dấu hiệu cần lưu ý"
                    : "Chưa ghi nhận trong hồ sơ"
                }
                color={COLORS.danger}
              />
              <InsightBox
                icon="heart-cog-outline"
                title="Bệnh tim mạch liên quan"
                value={`${cvdFacts.length}`}
                note={
                  cvdFacts.length
                    ? "Có bệnh sử liên quan"
                    : "Chưa ghi nhận trong hồ sơ"
                }
                color={COLORS.primary}
              />
              <InsightBox
                icon="pill"
                title="Thuốc đang dùng"
                value={`${medicationFacts.length}`}
                note={
                  medicationFacts.length
                    ? "Đang có điều trị bằng thuốc"
                    : "Chưa ghi nhận thuốc"
                }
                color={COLORS.info}
              />
            </View>
          </Card.Content>
        </Card>

        <FactSection
          title="Yếu tố nguy cơ"
          subtitle="Những yếu tố này có thể làm tăng nguy cơ tăng huyết áp hoặc biến cố tim mạch về sau."
          icon="alert-circle-outline"
          color={COLORS.warning}
          items={riskFacts.map((item) => item.label)}
        />

        <FactSection
          title="Tổn thương cơ quan đích"
          subtitle="Đây là các dấu hiệu cho thấy huyết áp có thể đã ảnh hưởng đến cơ quan quan trọng trong cơ thể."
          icon="heart-plus-outline"
          color={COLORS.danger}
          items={hmodFacts.map((item) => item.label)}
        />

        <FactSection
          title="Bệnh tim mạch liên quan"
          subtitle="Các bệnh lý nền này giúp giải thích vì sao việc kiểm soát huyết áp cần được theo dõi sát hơn."
          icon="heart-cog-outline"
          color={COLORS.primary}
          items={cvdFacts.map((item) => item.label)}
        />

        <FactSection
          title="Triệu chứng đang ghi nhận"
          subtitle="Các biểu hiện hiện tại giúp đặt kết quả đo vào bối cảnh thực tế hơn thay vì chỉ nhìn vào con số."
          icon="sticker-text-outline"
          color={COLORS.info}
          items={symptomFacts.map((item) => item.label)}
        />

        <FactSection
          title="Thuốc đang sử dụng"
          subtitle="Danh sách này giúp người dùng theo dõi điều trị hiện tại và quan sát sự thay đổi của huyết áp theo thời gian."
          icon="pill"
          color={COLORS.success}
          items={medicationFacts.map((item) => item.label)}
        />

        {!!records.length && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Báo cáo đo gần đây</Text>
              <Text style={styles.sectionSubtitle}>
                Chạm vào từng báo cáo để xem chi tiết hoàn cảnh và thông số của
                lần đo đó.
              </Text>

              <View style={styles.reportList}>
                {records.slice(0, 12).map((item, index) => (
                  <View key={item.id}>
                    <Pressable
                      onPress={() => setSelectedRecord(item)}
                      style={styles.reportCard}
                    >
                      <View style={styles.reportLeft}>
                        <View
                          style={[
                            styles.reportIconWrap,
                            {
                              backgroundColor: `${getSeverityColor(item.severity)}16`,
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="file-document-outline"
                            size={24}
                            color={getSeverityColor(item.severity)}
                          />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.reportValue}>
                            {item.systolic}/{item.diastolic} mmHg
                          </Text>
                          <Text style={styles.reportMeta}>
                            {formatDateTime(item.created_at)}
                          </Text>
                          <Text style={styles.reportSubMeta}>
                            {item.source} • {mapDayPeriod(item.day_period)} •{" "}
                            {mapPosition(item.position)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.reportRight}>
                        <Chip
                          compact
                          style={[
                            styles.smallSeverityChip,
                            {
                              backgroundColor: `${getSeverityColor(item.severity)}20`,
                            },
                          ]}
                          textStyle={{
                            color: getSeverityColor(item.severity),
                            fontWeight: "800",
                            fontSize: 12,
                          }}
                        >
                          {getSeverityLabel(item.severity)}
                        </Chip>

                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={22}
                          color={COLORS.textMuted}
                        />
                      </View>
                    </Pressable>

                    {index < Math.min(records.slice(0, 12).length - 1, 11) && (
                      <Divider style={styles.divider} />
                    )}
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <MeasurementDetailModal
        visible={!!selectedRecord}
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </SafeAreaView>
  );
}

function MetricCard({
  icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIconWrap, { backgroundColor: `${color}14` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
    </View>
  );
}

function InsightBox({
  icon,
  title,
  value,
  note,
  color,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  value: string;
  note: string;
  color: string;
}) {
  return (
    <View style={styles.insightBox}>
      <View style={[styles.insightIconWrap, { backgroundColor: `${color}14` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.insightValue}>{value}</Text>
      <Text style={styles.insightTitle}>{title}</Text>
      <Text style={styles.insightNote}>{note}</Text>
    </View>
  );
}

function FactSection({
  title,
  subtitle,
  icon,
  color,
  items,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  items: string[];
}) {
  return (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <View style={styles.factHeader}>
          <View
            style={[styles.factHeaderIcon, { backgroundColor: `${color}14` }]}
          >
            <MaterialCommunityIcons name={icon} size={22} color={color} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>
          </View>
        </View>

        {items.length ? (
          <View style={styles.factList}>
            {items.map((item) => (
              <View key={item} style={styles.factPill}>
                <Text style={styles.factPillText}>{item}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyFactText}>
            Chưa ghi nhận dữ liệu ở nhóm này.
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIconWrap}>
        <MaterialCommunityIcons name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function MeasurementDetailModal({
  visible,
  record,
  onClose,
}: {
  visible: boolean;
  record: BpRecord | null;
  onClose: () => void;
}) {
  if (!record) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Báo cáo đo chi tiết</Text>
              <Text style={styles.modalSubtitle}>
                {formatDateTime(record.created_at)}
              </Text>
            </View>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={COLORS.text}
              />
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.detailHero}>
              <View style={styles.detailHeroTop}>
                <View>
                  <Text style={styles.detailHeroLabel}>Kết quả đo</Text>
                  <Text style={styles.detailHeroReading}>
                    {record.systolic}/{record.diastolic}
                  </Text>
                  <Text style={styles.detailHeroUnit}>mmHg</Text>
                </View>

                <Chip
                  style={[
                    styles.detailSeverityChip,
                    {
                      backgroundColor: `${getSeverityColor(record.severity)}20`,
                    },
                  ]}
                  textStyle={{
                    color: getSeverityColor(record.severity),
                    fontWeight: "800",
                  }}
                >
                  {getSeverityLabel(record.severity)}
                </Chip>
              </View>

              <Text style={styles.detailHeroMessage}>
                {getSeverityMessage(record.severity)}
              </Text>
            </View>

            <Card style={styles.detailSectionCard}>
              <Card.Content>
                <Text style={styles.detailSectionTitle}>Thông tin lần đo</Text>

                <DetailRow
                  icon="calendar-clock"
                  label="Ngày giờ đo"
                  value={formatDateTime(record.created_at)}
                />
                <DetailRow
                  icon="home-heart"
                  label="Nguồn đo"
                  value={record.source || "Chưa rõ"}
                />
                <DetailRow
                  icon="weather-sunset"
                  label="Thời điểm đo"
                  value={mapDayPeriod(record.day_period)}
                />
                <DetailRow
                  icon="human-male"
                  label="Tư thế đo"
                  value={mapPosition(record.position)}
                />
                <DetailRow
                  icon="timer-sand"
                  label="Nghỉ trước đo"
                  value={
                    record.rested_minutes !== null &&
                    record.rested_minutes !== undefined
                      ? `${record.rested_minutes} phút`
                      : "Chưa ghi nhận"
                  }
                />
              </Card.Content>
            </Card>

            <Card style={styles.detailSectionCard}>
              <Card.Content>
                <Text style={styles.detailSectionTitle}>Thiết bị sử dụng</Text>

                <DetailRow
                  icon="stethoscope"
                  label="Loại thiết bị"
                  value={mapDeviceType(record.device_type)}
                />
                <DetailRow
                  icon="shield-check-outline"
                  label="Tình trạng kiểm định"
                  value={
                    record.device_validated ? "Đã kiểm định" : "Chưa kiểm định"
                  }
                />
                <DetailRow
                  icon="clipboard-check-outline"
                  label="Trạng thái lưu trữ"
                  value={record.status || "accepted"}
                />
              </Card.Content>
            </Card>

            <Card style={styles.detailSectionCard}>
              <Card.Content>
                <Text style={styles.detailSectionTitle}>Nhận định nhanh</Text>
                <Text style={styles.noteText}>
                  - Huyết áp tâm thu phản ánh áp lực khi tim co bóp.{"\n"}-
                  Huyết áp tâm trương phản ánh áp lực khi tim nghỉ giữa các
                  nhịp.{"\n"}- Một lần đo đơn lẻ rất hữu ích, nhưng chuỗi nhiều
                  lần đo mới phản ánh xu hướng đáng tin cậy hơn.
                </Text>
              </Card.Content>
            </Card>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 36,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  emptyIconWrap: {
    width: 86,
    height: 86,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textMuted,
    textAlign: "center",
    maxWidth: 320,
  },
  heroCardCompact: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroCompactTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  heroMiniIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E3F2F3",
  },
  heroMiniChip: {
    backgroundColor: "#E8F6F4",
  },
  heroMiniChipText: {
    color: COLORS.primaryDark,
    fontWeight: "800",
    fontSize: 12,
  },
  heroCompactTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 6,
  },
  heroCompactSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textMuted,
    marginBottom: 14,
  },
  heroCompactReading: {
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  heroCompactReadingLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  heroCompactReadingValue: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text,
  },
  heroCompactReadingNote: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  severityChip: {
    borderRadius: 999,
  },
  messageCard: {
    marginBottom: 16,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 8,
  },
  messageBody: {
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.text,
    marginBottom: 8,
  },
  messageBodySecondary: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textMuted,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    width: "47%",
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.text,
  },
  metricSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  sectionCard: {
    marginBottom: 16,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textMuted,
    marginBottom: 14,
  },
  chart: {
    borderRadius: 18,
    marginTop: 4,
  },
  insightGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  insightBox: {
    width: "47%",
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: 20,
    padding: 14,
  },
  insightIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  insightValue: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.text,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 4,
    marginBottom: 4,
  },
  insightNote: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textMuted,
  },
  factHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  factHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  factList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  factPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  factPillText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "700",
  },
  emptyFactText: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 21,
  },
  reportList: {
    gap: 0,
  },
  reportCard: {
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  reportLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  reportIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  reportValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  reportMeta: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  reportSubMeta: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  reportRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  smallSeverityChip: {
    borderRadius: 999,
  },
  divider: {
    backgroundColor: "#E7EFEF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10, 20, 24, 0.28)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    height: "84%",
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  modalHeader: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSoft,
  },
  modalContent: {
    padding: 16,
    paddingBottom: 32,
  },
  detailHero: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailHeroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  detailHeroLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  detailHeroReading: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "900",
    color: COLORS.text,
  },
  detailHeroUnit: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  detailHeroMessage: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
  },
  detailSeverityChip: {
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  detailSectionCard: {
    marginBottom: 14,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
    alignItems: "flex-start",
  },
  detailIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.text,
    fontWeight: "700",
  },
  noteText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.text,
  },
});

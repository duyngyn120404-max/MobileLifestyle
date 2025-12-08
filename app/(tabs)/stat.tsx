import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from "react-native";
import { Card, SegmentedButtons } from "react-native-paper";
import { useState, useEffect } from "react";
import { useAuth } from "@/src/contexts/auth-context";
import { databases, DATABASE_ID, HEALTH_RECORDS_COLLECTION_ID } from "@/src/services/appwrite";
import { Query } from "react-native-appwrite";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

interface HealthRecord {
  $id: string;
  userId: string;
  diseaseId: string;
  diseaseName: string;
  value1: number;
  value2?: number;
  value3?: number;
  value4?: number;
  unit1: string;
  unit2?: string;
  unit3?: string;
  unit4?: string;
  recordDate: string;
}

interface StatisticData {
  diseaseId: string;
  diseaseName: string;
  count: number;
  average: number;
  min: number;
  max: number;
  latest: HealthRecord | null;
}

export default function StatScreen() {
  const { user } = useAuth();
  const [filterRange, setFilterRange] = useState<"day" | "week" | "month">("week");
  const [statistics, setStatistics] = useState<StatisticData[]>([]);
  const [allRecords, setAllRecords] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStatistics();
    }
  }, [user, filterRange]);

  const getDateRange = () => {
    const now = new Date();
    const start = new Date();

    switch (filterRange) {
      case "day":
        start.setDate(now.getDate() - 1);
        break;
      case "week":
        start.setDate(now.getDate() - 7);
        break;
      case "month":
        start.setDate(now.getDate() - 30);
        break;
    }

    return start.toISOString();
  };

  const fetchStatistics = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const startDate = getDateRange();
      const query = [
        Query.equal("userId", user.$id),
        Query.greaterThanEqual("recordDate", startDate),
        Query.orderDesc("recordDate"),
      ];

      const response = await databases.listDocuments(
        DATABASE_ID,
        HEALTH_RECORDS_COLLECTION_ID,
        query
      );

      setAllRecords(response.documents as any);

      // Group by diseaseId and calculate statistics
      const groupedData: { [key: string]: HealthRecord[] } = {};
      response.documents.forEach((record: any) => {
        if (!groupedData[record.diseaseId]) {
          groupedData[record.diseaseId] = [];
        }
        groupedData[record.diseaseId].push(record);
      });

      const stats: StatisticData[] = Object.entries(groupedData).map(
        ([diseaseId, records]) => {
          const values = records.map((r) => r.value1);
          const average = values.reduce((a, b) => a + b, 0) / values.length;
          const min = Math.min(...values);
          const max = Math.max(...values);

          return {
            diseaseId,
            diseaseName: records[0].diseaseName,
            count: records.length,
            average: parseFloat(average.toFixed(2)),
            min,
            max,
            latest: records[0],
          };
        }
      );

      setStatistics(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilterLabel = () => {
    switch (filterRange) {
      case "day":
        return "Hôm nay";
      case "week":
        return "7 ngày";
      case "month":
        return "30 ngày";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thống kê sức khỏe</Text>
        <Text style={styles.headerSubtitle}>Trực quan hóa sức khỏe của bạn</Text>
      </View>

      {/* Filter Buttons */}
      <SegmentedButtons
        value={filterRange}
        onValueChange={(value) => setFilterRange(value as "day" | "week" | "month")}
        buttons={[
          { value: "day", label: "1 ngày" },
          { value: "week", label: "7 ngày" },
          { value: "month", label: "30 ngày" },
        ]}
        style={styles.filterButtons}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : statistics.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chưa có dữ liệu ({getFilterLabel()})</Text>
          <Text style={styles.emptySubtext}>Nhập dữ liệu sức khỏe để xem thống kê</Text>
        </View>
      ) : (
        // MAIN VIEW - Statistics + Charts
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Overall Stats */}
          <View style={styles.overallStats}>
            <Card style={styles.statCard}>
              <Card.Content>
                <Text style={styles.statLabel}>Tổng bản ghi</Text>
                <Text style={styles.statValue}>
                  {statistics.reduce((sum, s) => sum + s.count, 0)}
                </Text>
              </Card.Content>
            </Card>
            <Card style={styles.statCard}>
              <Card.Content>
                <Text style={styles.statLabel}>Loại bệnh</Text>
                <Text style={styles.statValue}>{statistics.length}</Text>
              </Card.Content>
            </Card>
          </View>

          {/* Disease Statistics */}
          <Text style={styles.sectionTitle}>Thống kê theo bệnh</Text>
          {statistics.map((stat) => (
            <Card key={stat.diseaseId} style={styles.diseaseCard}>
              <Card.Content>
                {/* Disease Name */}
                <Text style={styles.diseaseName}>{stat.diseaseName}</Text>

                {/* Records Count */}
                <View style={styles.statsRow}>
                  <Text style={styles.statKey}>Bản ghi:</Text>
                  <Text style={styles.statVal}>{stat.count}</Text>
                </View>

                {/* Average */}
                <View style={styles.statsRow}>
                  <Text style={styles.statKey}>Trung bình:</Text>
                  <Text style={styles.statVal}>
                    {stat.average} {stat.latest?.unit1}
                  </Text>
                </View>

                {/* Min - Max */}
                <View style={styles.statsRow}>
                  <Text style={styles.statKey}>Tối thiểu - Tối đa:</Text>
                  <Text style={styles.statVal}>
                    {stat.min} - {stat.max} {stat.latest?.unit1}
                  </Text>
                </View>

                {/* Latest Value */}
                <View style={[styles.statsRow, styles.latestRow]}>
                  <Text style={styles.statKey}>Lần cuối:</Text>
                  <Text style={styles.statVal}>
                    {stat.latest?.value1} {stat.latest?.unit1}
                  </Text>
                </View>

                <Text style={styles.timeText}>
                  {stat.latest?.recordDate
                    ? new Date(stat.latest.recordDate).toLocaleDateString("vi-VN")
                    : ""}
                </Text>
              </Card.Content>
            </Card>
          ))}

          {/* Trend Line Charts */}
          <Text style={styles.sectionTitle}>� Xu hướng theo từng bệnh</Text>
          {statistics.length > 0 && (
            <>
              {statistics.map((stat) => {
                // Filter records for this disease
                const diseaseRecords = allRecords
                  .filter((r) => r.diseaseId === stat.diseaseId)
                  .slice(0, 10)
                  .reverse();

                if (diseaseRecords.length === 0) return null;

                // Colors for different diseases
                const colors = [
                  "#0066cc",
                  "#ff6b6b",
                  "#ffa500",
                  "#4ecdc4",
                  "#95e1d3",
                ];
                const colorIndex = statistics.indexOf(stat) % colors.length;
                const lineColor = colors[colorIndex];

                return (
                  <Card key={stat.diseaseId} style={styles.chartCard}>
                    <Text style={styles.diseaseTrendTitle}>{stat.diseaseName}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <LineChart
                        data={{
                          labels: diseaseRecords
                            .map((r) =>
                              new Date(r.recordDate).toLocaleDateString("vi-VN", {
                                month: "2-digit",
                                day: "2-digit",
                              })
                            ),
                          datasets: [
                            {
                              data: diseaseRecords.map((r) => r.value1),
                              color: () => lineColor,
                              strokeWidth: 2,
                            },
                          ],
                        }}
                        width={screenWidth - 60}
                        height={200}
                        yAxisLabel=""
                        yAxisSuffix=""
                        withDots={true}
                        withInnerLines={true}
                        withOuterLines={true}
                        withHorizontalLines={true}
                        chartConfig={{
                          backgroundColor: "#fff",
                          backgroundGradientFrom: "#fff",
                          backgroundGradientTo: "#fff",
                          decimalPlaces: 0,
                          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.15})`,
                          labelColor: () => "#666",
                          style: {
                            borderRadius: 8,
                          },
                          propsForDots: {
                            r: "4",
                            strokeWidth: "2",
                            stroke: lineColor,
                          },
                          propsForBackgroundLines: {
                            strokeDasharray: "0",
                            stroke: "#e0e0e0",
                            strokeWidth: 1,
                          },
                        }}
                        style={{
                          marginVertical: 8,
                          borderRadius: 8,
                        }}
                        bezier
                        fromZero
                      />
                    </ScrollView>
                  </Card>
                );
              })}
            </>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  tabButtons: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },
  filterButtons: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chartContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  overallStats: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0066cc",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 12,
    marginBottom: 8,
  },
  diseaseCard: {
    backgroundColor: "#fff",
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#0066cc",
  },
  chartCard: {
    backgroundColor: "#fff",
    marginBottom: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  diseaseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  diseaseTrendTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    marginLeft: 16,
    marginTop: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  latestRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  statKey: {
    fontSize: 13,
    color: "#666",
  },
  statVal: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  timeText: {
    fontSize: 11,
    color: "#999",
    marginTop: 6,
  },
  bottomSpacer: {
    height: 20,
  },
  diseaseSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  countBadge: {
    backgroundColor: "#0066cc",
    color: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "600",
  },
  summaryChart: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0066cc",
  },
  summaryUnit: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  chartInfo: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginTop: 8,
  },
});

import { useAuth } from "@/src/contexts/auth-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Card, Chip, Text } from "react-native-paper";
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
};

const actions = [
  {
    key: "tracking",
    title: "Quản lý THA",
    subtitle:
      "Theo dõi danh sách lần đo, lọc theo ngày và cập nhật bản ghi huyết áp.",
    icon: "heart-pulse" as const,
    accent: "#DDF3F0",
    onPress: () => router.push("/(health)/tracking"),
  },
  {
    key: "risk-profile",
    title: "Hồ sơ nguy cơ",
    subtitle:
      "Lưu yếu tố nguy cơ, tổn thương cơ quan đích và bệnh tim mạch liên quan.",
    icon: "head-heart" as const,
    accent: "#E7F1F2",
    onPress: () => router.push("/(health)/risk-profile"),
  },
  {
    key: "reports",
    title: "Báo cáo huyết áp",
    subtitle:
      "Xem danh sách báo cáo theo tuần, lọc thời gian và mở chi tiết phân tích.",
    icon: "file-chart-outline" as const,
    accent: "#EAF2FF",
    onPress: () => router.push("/(health)/reports"),
  },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    "bạn";

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: Math.max(insets.top * 0.25, 8),
            paddingBottom: Math.max(insets.bottom + 28, 36),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.heroCard,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons
                name="stethoscope"
                size={28}
                color={MEDICAL_COLORS.primary}
              />
            </View>

            <Chip style={styles.heroChip} textStyle={styles.heroChipText}>
              Sức khỏe tại nhà
            </Chip>
          </View>

          <Text style={styles.heroEyebrow}>{greeting}</Text>

          <Text style={styles.heroTitle}>Quản lý sức khỏe của {displayName}</Text>

          <Text style={styles.heroSubtitle}>
            Chọn nhóm chức năng bạn cần thao tác để tiếp
            tục theo dõi huyết áp và hồ sơ nguy cơ.
          </Text>
        </Animated.View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Tính năng chính</Text>
          <Text style={styles.sectionSubtitle}>
            Chọn đúng luồng bạn muốn làm việc để vào màn tương ứng nhanh hơn.
          </Text>
        </View>

        <View style={styles.cardList}>
          {actions.map((item, index) => (
            <Animated.View
              key={item.key}
              style={{
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [28 + index * 8, 0],
                    }),
                  },
                ],
              }}
            >
              <Pressable onPress={item.onPress} style={styles.pressableCard}>
                {({ pressed }) => {
                  const cardStyle = pressed
                    ? [styles.featureCard, styles.featureCardPressed]
                    : styles.featureCard;

                  return (
                    <Card style={cardStyle}>
                      <Card.Content style={styles.featureContent}>
                        <View style={styles.featureTopRow}>
                          <View
                            style={[
                              styles.featureIconWrap,
                              { backgroundColor: item.accent },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={item.icon}
                              size={24}
                              color={MEDICAL_COLORS.primaryDark}
                            />
                          </View>

                          <View style={styles.chevronWrap}>
                            <MaterialCommunityIcons
                              name="chevron-right"
                              size={22}
                              color={MEDICAL_COLORS.textMuted}
                            />
                          </View>
                        </View>

                        <Text style={styles.featureTitle}>{item.title}</Text>
                        <Text style={styles.featureSubtitle}>{item.subtitle}</Text>

                        <View style={styles.featureFooter}>
                          <Text style={styles.featureFooterText}>Mở màn hình</Text>
                          <MaterialCommunityIcons
                            name="arrow-top-right"
                            size={16}
                            color={MEDICAL_COLORS.primaryDark}
                          />
                        </View>
                      </Card.Content>
                    </Card>
                  );
                }}
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
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
  heroCard: {
    backgroundColor: MEDICAL_COLORS.surface,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
    borderRadius: 28,
    padding: 20,
    marginBottom: 18,
    shadowColor: "#0B5F73",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#E3F2F3",
    alignItems: "center",
    justifyContent: "center",
  },
  heroChip: {
    backgroundColor: "#E8F6F4",
  },
  heroChipText: {
    color: MEDICAL_COLORS.primaryDark,
    fontSize: 12,
    fontWeight: "800",
  },
  heroEyebrow: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: MEDICAL_COLORS.primaryDark,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "900",
    color: MEDICAL_COLORS.text,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: MEDICAL_COLORS.textMuted,
    marginBottom: 18,
  },
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: MEDICAL_COLORS.surfaceSoft,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DCE9EA",
    overflow: "hidden",
  },
  heroStatCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: MEDICAL_COLORS.border,
  },
  heroStatValue: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
    color: MEDICAL_COLORS.text,
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: MEDICAL_COLORS.textMuted,
  },
  sectionHeading: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "900",
    color: MEDICAL_COLORS.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: MEDICAL_COLORS.textMuted,
  },
  cardList: {
    gap: 14,
  },
  pressableCard: {
    borderRadius: 24,
  },
  featureCard: {
    backgroundColor: MEDICAL_COLORS.surface,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
    borderRadius: 24,
  },
  featureCardPressed: {
    opacity: 0.96,
  },
  featureContent: {
    paddingVertical: 18,
  },
  featureTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  featureIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  chevronWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#F5F9F9",
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "900",
    color: MEDICAL_COLORS.text,
    marginBottom: 6,
  },
  featureSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: MEDICAL_COLORS.textMuted,
    marginBottom: 14,
  },
  featureFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featureFooterText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: MEDICAL_COLORS.primaryDark,
  },
});

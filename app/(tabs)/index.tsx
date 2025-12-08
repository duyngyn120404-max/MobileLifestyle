import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, ImageBackground } from "react-native";
import { Card } from "react-native-paper";
import { useAuth } from "@/src/contexts/auth-context";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DISEASE_LIST, HEALTH_STATS, HEALTH_WARNINGS } from "@/src/constants/diseases";
import type { Disease } from "@/src/types";

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
  const [showHealthStatus, setShowHealthStatus] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fabScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "white-balance-sunny"; // Morning sun
    if (hour < 17) return "weather-partly-cloudy"; // Afternoon
    return "moon-waning-crescent"; // Evening moon
  };

  const getGreetingBackground = () => {
    const hour = new Date().getHours();
    if (hour < 12) return require("@/assets/images/morning.png");
    if (hour < 17) return require("@/assets/images/afternoon.png");
    return require("@/assets/images/evening.png");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 17) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  const getGreetingColor = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "#FFD700"; // Gold for morning
    if (hour < 17) return "#FF8C00"; // Dark orange for afternoon
    return "#9C27B0"; // Purple for evening
  };

  const getTimeString = () => {
    return new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const capitalizeName = (name: string) => {
    if (!name) return "User";
    return name
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleFABPress = () => {
    Animated.sequence([
      Animated.timing(fabScaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fabScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    setShowHealthStatus(true);
  };

  const handleDiseaseSelect = (disease: Disease) => {
    setSelectedDisease(disease);
    router.push({
      pathname: "/(disease)/input",
      params: { diseaseId: disease.id, diseaseName: disease.name },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Animated Greeting Header */}c
      <Animated.View
        style={[
          styles.greetingSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ImageBackground
          source={getGreetingBackground()}
          style={styles.greetingBackground}
          imageStyle={styles.greetingBackgroundImage}
        >
          <View style={styles.greetingOverlay}>
            <View style={styles.greetingContainer}>
              <Text style={styles.userName}>{capitalizeName(user?.name || "User")}</Text>
            </View>
          </View>
        </ImageBackground>
      </Animated.View>

      {/* Latest Alert/Notification Banner */}
      <View style={[styles.alertBannerSection, { marginTop: 16 }]}>
        <Card style={styles.alertBanner}>
          <Card.Content>
            {HEALTH_WARNINGS.length > 0 ? (
              <>
                <View style={styles.alertHeader}>
                  <MaterialCommunityIcons
                    name={HEALTH_WARNINGS[0].icon as any}
                    size={24}
                    color={HEALTH_WARNINGS[0].color}
                  />
                  <Text style={[styles.alertTitle, { color: HEALTH_WARNINGS[0].color }]}>
                    {HEALTH_WARNINGS[0].title}
                  </Text>
                </View>
                <Text style={styles.alertTimestamp}>
                  {new Date().toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })} {new Date().toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                <Text style={styles.alertDescription}>
                  {HEALTH_WARNINGS[0].description}
                </Text>
              </>
            ) : (
              <View style={styles.noAlertContainer}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={24}
                  color="#34C759"
                />
                <Text style={styles.noAlertText}>Không có ghi chú quan trọng nào</Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </View>

      {/* Quick Action Section */}
      <View style={styles.quickActionSection}>
        <Text style={styles.sectionTitle}>Theo dõi sức khỏe hôm nay</Text>
        <Text style={styles.sectionSubtitle}>Chọn loại chỉ số để nhập dữ liệu</Text>
      </View>

      {/* Disease Grid */}
      <View style={styles.diseaseGrid}>
        {DISEASE_LIST.map((disease) => (
          <TouchableOpacity
            key={disease.id}
            style={styles.diseaseCard}
            onPress={() => handleDiseaseSelect(disease)}
          >
            <Card style={[styles.card, { borderLeftColor: disease.color, borderLeftWidth: 4 }]}>
              <Card.Content style={styles.cardContent}>
                <MaterialCommunityIcons
                  name={disease.icon as any}
                  size={40}
                  color={disease.color}
                  style={styles.cardIcon}
                />
                <Text style={styles.diseaseName}>{disease.name}</Text>
                <Text style={styles.diseaseDescription}>{disease.description}</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer - University Info */}
      <View style={styles.footerSection}>
        <MaterialCommunityIcons name="school" size={24} color="#007AFF" />
        <Text style={styles.footerText}>Ứng dụng được phát triển bởi</Text>
        <Text style={styles.universityName}>Trường Đại học Quốc tế Sài Gòn</Text>
      </View>
    </ScrollView>

    {/* Floating Action Button */}
    <Animated.View
      style={[
        styles.fabContainer,
        {
          transform: [{ scale: fabScaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.fab}
        onPress={handleFABPress}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="heart-plus" size={28} color="#fff" />
      </TouchableOpacity>
    </Animated.View>

    {/* Health Status Modal */}
    {showHealthStatus && (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tình hình sức khỏe</Text>
            <TouchableOpacity onPress={() => setShowHealthStatus(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.warningsContainer} showsVerticalScrollIndicator={false}>
            {HEALTH_WARNINGS.map((warning: any, index: number) => (
              <View key={index} style={styles.warningCard}>
                <View style={[styles.warningIcon, { backgroundColor: warning.color + "20" }]}>
                  <MaterialCommunityIcons
                    name={warning.icon as any}
                    size={24}
                    color={warning.color}
                  />
                </View>
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>{warning.title}</Text>
                  <Text style={styles.warningDescription}>{warning.description}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowHealthStatus(false)}
          >
            <Text style={styles.closeButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    )}
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flex: 1,
  },
  greetingSection: {
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  greetingBackground: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    height: 150,
    borderRadius: 16,
    overflow: "hidden",
  },
  greetingBackgroundImage: {
    borderRadius: 16,
  },
  greetingOverlay: {
    backgroundColor: "transparent",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  greetingContainer: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 2,
    paddingHorizontal: 0,
  },
  greeting: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
    color: "#fff",
  },
  timeDisplay: {
    fontSize: 13,
    fontWeight: "500",
    color: "#007AFF",
    marginBottom: 8,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 0,
  },
  date: {
    fontSize: 12,
    color: "#666",
    fontWeight: "400",
    marginTop: 4,
  },
  dateTime: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    marginTop: 6,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
  },
  quickActionSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#999",
    marginBottom: 12,
  },
  diseaseGrid: {
    paddingHorizontal: 16,
    paddingBottom: 5,
  },
  diseaseCard: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  cardContent: {
    alignItems: "center",
    paddingVertical: 16,
  },
  cardIcon: {
    marginBottom: 8,
  },
  diseaseName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  diseaseDescription: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
  fabContainer: {
    position: "absolute",
    bottom: 24,
    right: 24,
    zIndex: 100,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    zIndex: 101,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  warningsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 400,
  },
  warningCard: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "flex-start",
    gap: 12,
  },
  warningIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  warningDescription: {
    fontSize: 12,
    color: "#999",
    lineHeight: 18,
  },
  alertBannerSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  alertBanner: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  alertTimestamp: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
    marginLeft: 32,
    fontWeight: "400",
  },
  alertDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginLeft: 32,
    marginTop: 8,
  },
  noAlertContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  noAlertText: {
    fontSize: 14,
    color: "#34C759",
    fontWeight: "500",
  },
  closeButton: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: "#007AFF",
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footerSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
    marginTop: 25,
  },
  footerText: {
    fontSize: 13,
    color: "#666",
    marginTop: 8,
  },
  universityName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#007AFF",
    marginTop: 4,
  },
});

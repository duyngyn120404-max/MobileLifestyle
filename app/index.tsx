import { useAuth } from "@/src/contexts/auth-context";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Text } from "react-native-paper";

const { width, height } = Dimensions.get("window");
const WELCOME_DURATION = 2800;

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, isLoadingUser } = useAuth();

  const pulseScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.6);

  useEffect(() => {
    pulseScale.value = withSequence(
      withTiming(1.1, { duration: 600, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 400, easing: Easing.in(Easing.ease) }),
      withTiming(1.08, { duration: 500, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 400, easing: Easing.in(Easing.ease) })
    );
    ringOpacity.value = withDelay(
      300,
      withSequence(
        withTiming(0.4, { duration: 400 }),
        withTiming(0, { duration: 900 })
      )
    );
    ringScale.value = withDelay(
      300,
      withTiming(1.8, { duration: 1300, easing: Easing.out(Easing.ease) })
    );
  }, []);

  useEffect(() => {
    if (isLoadingUser) return;
    const timer = setTimeout(() => {
      if (user) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)");
      }
    }, WELCOME_DURATION);
    return () => clearTimeout(timer);
  }, [isLoadingUser, user]);

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const ringAnimStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />
      <View style={[styles.decorCircle, styles.decorCircle1]} />
      <View style={[styles.decorCircle, styles.decorCircle2]} />
      <View style={[styles.decorCircle, styles.decorCircle3]} />

      <Animated.View entering={FadeIn.duration(600)} style={styles.logoContainer}>
        <Animated.View style={[styles.ring, ringAnimStyle]} />
        <Animated.View style={[styles.iconWrapper, iconAnimStyle]}>
          <Text style={styles.iconEmoji}>💗</Text>
        </Animated.View>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(700).delay(300).easing(Easing.out(Easing.exp))}
        style={styles.titleContainer}
      >
        <Text style={styles.appName}>Nhịp Tim</Text>
        <View style={styles.titleDivider} />
        <Text style={styles.tagline}>Sức khỏe của bạn, ưu tiên của chúng tôi</Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(700).delay(600).easing(Easing.out(Easing.exp))}
        style={styles.featuresRow}
      >
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featureItem}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureLabel}>{f.label}</Text>
          </View>
        ))}
      </Animated.View>

      <Animated.View entering={FadeIn.duration(500).delay(1000)} style={styles.loadingRow}>
        <LoadingDots />
      </Animated.View>
    </View>
  );
}

const FEATURES = [
  { icon: "🩸", label: "Huyết áp" },
  { icon: "🤖", label: "AI tư vấn" },
  { icon: "📊", label: "Thống kê" },
];

function LoadingDots() {
  const dot1 = useSharedValue<number>(0.3);
  const dot2 = useSharedValue<number>(0.3);
  const dot3 = useSharedValue<number>(0.3);

  useEffect(() => {
    const animate = (sv: SharedValue<number>, delay: number) => {
      sv.value = withDelay(
        delay,
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        )
      );
    };
    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, []);

  const s1 = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: dot3.value }));

  return (
    <View style={styles.dotsRow}>
      <Animated.View style={[styles.dot, s1]} />
      <Animated.View style={[styles.dot, s2]} />
      <Animated.View style={[styles.dot, s3]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  bgTop: {
    position: "absolute",
    top: -height * 0.15,
    left: -width * 0.3,
    width: width * 1.2,
    height: height * 0.6,
    backgroundColor: "#DAEEFF",
    borderRadius: width,
    opacity: 0.7,
  },
  bgBottom: {
    position: "absolute",
    bottom: -height * 0.1,
    right: -width * 0.2,
    width: width * 0.9,
    height: height * 0.5,
    backgroundColor: "#E8F4FF",
    borderRadius: width,
    opacity: 0.9,
  },
  decorCircle: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0, 122, 255, 0.12)",
  },
  decorCircle1: {
    width: 280,
    height: 280,
    top: height * 0.08,
    right: -60,
  },
  decorCircle2: {
    width: 200,
    height: 200,
    bottom: height * 0.12,
    left: -50,
    borderColor: "rgba(0, 180, 130, 0.12)",
  },
  decorCircle3: {
    width: 120,
    height: 120,
    top: height * 0.65,
    right: 40,
    borderColor: "rgba(0, 122, 255, 0.08)",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },
  ring: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#007AFF",
    backgroundColor: "transparent",
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "rgba(0, 122, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  iconEmoji: {
    fontSize: 48,
    lineHeight: 58,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  appName: {
    fontSize: 36,
    fontWeight: "700",
    color: "#0A1628",
    letterSpacing: 0.5,
  },
  titleDivider: {
    width: 40,
    height: 3,
    backgroundColor: "#007AFF",
    borderRadius: 2,
    marginVertical: 12,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(10, 22, 40, 0.5)",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  featuresRow: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 64,
  },
  featureItem: {
    alignItems: "center",
    gap: 6,
  },
  featureIcon: {
    fontSize: 28,
    width: 56,
    height: 56,
    lineHeight: 56,
    textAlign: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 122, 255, 0.15)",
  },
  featureLabel: {
    fontSize: 12,
    color: "rgba(10, 22, 40, 0.55)",
    fontWeight: "500",
  },
  loadingRow: {
    position: "absolute",
    bottom: 60,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#007AFF",
  },
});

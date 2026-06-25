import { AuthProvider, useAuth } from "@/src/contexts/auth-context";
import { logger } from "@/src/utils/logger";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

LogBox.ignoreLogs([
  "TypeError: Network request failed",
  "Network request failed",
]);

function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoadingUser } = useAuth();
  const segments = useSegments();
  const seg0 = segments[0] as string | undefined;
  const inAuthGroup = seg0 === "(auth)";
  const inWelcome = !seg0 || seg0 === "index";
  const shouldBlockPrivateRoute = !isLoadingUser && !user && !inAuthGroup && !inWelcome;

  useEffect(() => {
    // Welcome screen tự xử lý navigation, không can thiệp
    if (inWelcome) return;

    if (isLoadingUser) {
      return;
    }

    if (user && inAuthGroup) {
      logger.info("routeGuard", "redirect", {
        reason: "authenticated_user_on_auth_screen",
        target: "/(tabs)",
        userId: user.id,
      });
      router.replace("/(tabs)");
    }
    else if (!user && !inAuthGroup) {
      logger.warn("routeGuard", "redirect", {
        reason: "unauthenticated_private_route",
        target: "/(auth)",
        segment: seg0 ?? null,
      });
      router.replace("/(auth)");
    }
  }, [user, seg0, inAuthGroup, inWelcome, isLoadingUser, router]);

  if (shouldBlockPrivateRoute) {
    return null;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <PaperProvider>
          <SafeAreaProvider>
            <RouteGuard>
              <Stack screenOptions={{headerShown: true}}>
                <Stack.Screen name="index" options={{headerShown: false, animation: "none"}} />
                <Stack.Screen name="(tabs)" options={{headerShown: false}} />
                <Stack.Screen name="(auth)" options={{headerShown: false}} />
                <Stack.Screen name="(health)" options={{headerShown: false}} />
              </Stack>
            </RouteGuard>
          </SafeAreaProvider>
        </PaperProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

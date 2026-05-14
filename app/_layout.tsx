import { AuthProvider, useAuth } from "@/src/contexts/auth-context";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoadingUser } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";
    console.log(
      "[RouteGuard] user:",
      user?.id ?? null,
      "isLoadingUser:",
      isLoadingUser,
      "inAuthGroup:",
      inAuthGroup,
    );

    if (isLoadingUser) {
      return;
    }

    if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
    else if (!user && !inAuthGroup) {
      console.log("[RouteGuard] no user, redirecting to /(auth)");
      router.replace("/(auth)");
    }
  }, [user, segments, isLoadingUser]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <PaperProvider>
          <SafeAreaProvider>
            <RouteGuard>
              <Stack screenOptions={{ headerShown: true }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="(disease)"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="(health)"
                  options={{ headerShown: false }}
                />
              </Stack>
            </RouteGuard>
          </SafeAreaProvider>
        </PaperProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

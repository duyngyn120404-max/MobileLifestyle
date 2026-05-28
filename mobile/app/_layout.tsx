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
    const inAuthGroup = segments[0] === "(auth)"
    const seg0 = segments[0] as string | undefined
    const inWelcome = !seg0 || seg0 === "index"
    console.log('[RouteGuard] user:', user?.id ?? null, 'isLoadingUser:', isLoadingUser, 'inAuthGroup:', inAuthGroup, 'inWelcome:', inWelcome);

    // Welcome screen tự xử lý navigation, không can thiệp
    if (inWelcome) return;

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
  }, [user, segments, isLoadingUser, router]);

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
                <Stack.Screen name="(disease)" options={{headerShown: false}} />
                <Stack.Screen name="(health)" options={{headerShown: false}} />
              </Stack>
            </RouteGuard>
          </SafeAreaProvider>
        </PaperProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

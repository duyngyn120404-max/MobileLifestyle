import { Stack } from "expo-router";

const HEALTH_NAV_THEME = {
  background: "#F4F8F8",
};

export default function HealthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: HEALTH_NAV_THEME.background,
        },
        animation: "slide_from_right",
        animationDuration: 220,
        fullScreenGestureEnabled: true,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="tracking"
        options={{
          animation: "fade",
        }}
      />

      <Stack.Screen
        name="tracking-form"
        options={{
          presentation: "card",
          animation: "slide_from_right",
        }}
      />

      <Stack.Screen
        name="tracking-detail"
        options={{
          presentation: "card",
          animation: "slide_from_right",
        }}
      />

      <Stack.Screen
        name="risk-profile"
        options={{
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}

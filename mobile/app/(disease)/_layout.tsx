import { Stack } from "expo-router";

export default function DiseaseLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="input" />
    </Stack>
  );
}

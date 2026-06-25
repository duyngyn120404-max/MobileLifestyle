import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

const TAB_COLORS = {
  primary: "#0E7490",
  inactive: "#7A8F95",
  background: "#FCFEFE",
  border: "#D8E7E8",
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: TAB_COLORS.primary,
        tabBarInactiveTintColor: TAB_COLORS.inactive,
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: TAB_COLORS.background,
          borderTopColor: TAB_COLORS.border,
          height: 78,
          paddingTop: 8,
          paddingBottom: 22,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({
            color,
            size,
            focused,
          }: {
            color: string;
            size: number;
            focused: boolean;
          }) => (
            <MaterialCommunityIcons
              name={focused ? "home" : "home-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="stat"
        options={{
          title: "Thống kê",
          tabBarIcon: ({
            color,
            size,
            focused,
          }: {
            color: string;
            size: number;
            focused: boolean;
          }) => (
            <MaterialCommunityIcons
              name={focused ? "chart-line" : "chart-line-variant"}
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="bot"
        options={{
          title: "Bot",
          tabBarIcon: ({
            color,
            size,
            focused,
          }: {
            color: string;
            size: number;
            focused: boolean;
          }) => (
            <MaterialCommunityIcons
              name={focused ? "robot" : "robot-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Hồ sơ",
          tabBarIcon: ({
            color,
            size,
            focused,
          }: {
            color: string;
            size: number;
            focused: boolean;
          }) => (
            <MaterialCommunityIcons
              name={focused ? "account" : "account-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}

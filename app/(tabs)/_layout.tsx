import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../lib/theme";

export default function TabsLayout() {
  const { isDark } = useTheme();
  const palette = {
    tabBg: isDark ? "#13171D" : "#F8F2EA",
    tabBorder: isDark ? "#2A313A" : "#E9DED1",
    active: isDark ? "#B68A7B" : "#714E43",
    inactive: isDark ? "#98A2AE" : "#7A828E",
  };

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: palette.active,
        tabBarInactiveTintColor: palette.inactive,
        tabBarStyle: {
          height: 74,
          paddingBottom: 10,
          paddingTop: 8,
          paddingHorizontal: 12,
          backgroundColor: palette.tabBg,
          borderTopColor: palette.tabBorder,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            home: "home-outline",
            cart: "cart-outline",
            orders: "receipt-outline",
            account: "person-circle-outline",
          };

          const iconName = iconMap[route.name] ?? "ellipse-outline";
          return <Ionicons name={iconName} size={size + 2} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="menu" options={{ href: null }} />
      <Tabs.Screen name="cart" options={{ title: "Mi Orden" }} />
      <Tabs.Screen name="orders" options={{ title: "Ordenes" }} />
      <Tabs.Screen name="account" options={{ title: "Perfil" }} />
    </Tabs>
  );
}

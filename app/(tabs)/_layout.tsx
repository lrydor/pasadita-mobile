import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../lib/theme";

export default function TabsLayout() {
  const { isDark } = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: isDark ? "#f5f5f5" : "#111",
        tabBarInactiveTintColor: isDark ? "#8e8e93" : "#8e8e93",
        tabBarStyle: {
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
          backgroundColor: isDark ? "#121212" : "#f8f8f8",
          borderTopColor: isDark ? "#1f1f1f" : "#dcdcdc",
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            home: "home-outline",
            menu: "restaurant-outline",
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
      <Tabs.Screen name="menu" options={{ title: "Menu" }} />
      <Tabs.Screen name="cart" options={{ title: "Cart" }} />
      <Tabs.Screen name="orders" options={{ title: "Orders" }} />
      <Tabs.Screen name="account" options={{ title: "Account" }} />
    </Tabs>
  );
}

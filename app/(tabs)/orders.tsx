import { StyleSheet, Text } from "react-native";
import { useTheme } from "../../lib/theme";
import ScreenView from "../../components/ScreenView";

export default function Screen() {
  const { isDark } = useTheme();

  return (
    <ScreenView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#0f0f0f" : "#f2f2f7" },
      ]}
    >
      <Text style={[styles.title, { color: isDark ? "#f5f5f5" : "#1c1c1e" }]}>
        Orders
      </Text>
      <Text style={[styles.subtitle, { color: isDark ? "#9a9a9a" : "#636366" }]}>
        Sigue tu estado
      </Text>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "500",
  },
});

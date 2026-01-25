import { StyleSheet, Switch, Text, View } from "react-native";
import { useTheme } from "../../lib/theme";

export default function Screen() {
  const { isDark, toggleMode } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#0f0f0f" : "#f2f2f7" },
      ]}
    >
      <Text style={[styles.title, { color: isDark ? "#f5f5f5" : "#111" }]}>
        My Account
      </Text>
      <Text
        style={[styles.sectionLabel, { color: isDark ? "#8e8e93" : "#6e6e73" }]}
      >
        Configuración
      </Text>
      <View
        style={[
          styles.settingsGroup,
          {
            backgroundColor: isDark ? "#1c1c1e" : "#fff",
            borderColor: isDark ? "#2c2c2e" : "#e5e5ea",
          },
        ]}
      >
        <View style={styles.settingRow}>
          <Text
            style={[
              styles.settingLabel,
              { color: isDark ? "#f5f5f5" : "#1c1c1e" },
            ]}
          >
            Dark mode
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleMode}
            thumbColor={isDark ? "#f5f5f5" : "#fff"}
            trackColor={{ false: "#c7c7cc", true: "#4a4a4a" }}
          />
        </View>
      </View>
    </View>
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
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  settingsGroup: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
});

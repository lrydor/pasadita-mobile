import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ScreenView from "../../components/ScreenView";
import { useTheme } from "../../lib/theme";

export default function Screen() {
  const { isDark } = useTheme();
  const router = useRouter();

  const palette = {
    bg: isDark ? "#101216" : "#F8F2EA",
    card: isDark ? "#1A1E24" : "#FFFDF9",
    border: isDark ? "#2A313A" : "#E9DED1",
    text: isDark ? "#F5F6F8" : "#1E232B",
    textMuted: isDark ? "#A5AFBC" : "#606A77",
    accent: isDark ? "#B68A7B" : "#714E43",
  };

  return (
    <ScreenView style={[styles.container, { backgroundColor: palette.bg }]}>
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}> 
        <View style={[styles.iconWrap, { backgroundColor: isDark ? "#2B221C" : "#FFE8D6" }]}> 
          <Ionicons name="checkmark" size={34} color={palette.accent} />
        </View>

        <Text style={[styles.title, { color: palette.text }]}>Orden exitosa</Text>
        <Text style={[styles.subtitle, { color: palette.textMuted }]}>Estamos preparando tu pedido. Revisa el estado en Orders.</Text>

        <Pressable style={[styles.primaryBtn, { backgroundColor: palette.accent }]} onPress={() => router.replace("/(tabs)/orders")}> 
          <Text style={styles.primaryBtnText}>Ver mis pedidos</Text>
        </Pressable>

        <Pressable style={[styles.secondaryBtn, { borderColor: palette.border }]} onPress={() => router.replace("/(tabs)/home")}> 
          <Text style={[styles.secondaryBtnText, { color: palette.text }]}>Ir al inicio</Text>
        </Pressable>
      </View>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 20,
    alignItems: "center",
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 14,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 20,
  },
  primaryBtn: {
    marginTop: 16,
    width: "100%",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryBtn: {
    marginTop: 10,
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
});

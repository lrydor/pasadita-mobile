import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../lib/theme";
import ScreenView from "../../components/ScreenView";

export default function Screen() {
  const { isDark } = useTheme();

  const palette = {
    bg: isDark ? "#101216" : "#F8F2EA",
    card: isDark ? "#1A1E24" : "#FFFDF9",
    border: isDark ? "#2A313A" : "#E9DED1",
    text: isDark ? "#F5F6F8" : "#1E232B",
    textMuted: isDark ? "#A5AFBC" : "#606A77",
    accent: isDark ? "#B68A7B" : "#714E43",
    accentSoft: isDark ? "#2D2521" : "#EFE5E0",
    success: isDark ? "#6BE2A3" : "#23855D",
  };

  return (
    <ScreenView style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.brand, { color: palette.text }]}>La Pasadita</Text>
            <Text style={[styles.tagline, { color: palette.textMuted }]}>Brunch chapin para recoger</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: palette.card, borderColor: palette.border }]}> 
            <View style={[styles.dot, { backgroundColor: palette.success }]} />
            <Text style={[styles.statusText, { color: palette.text }]}>Abierto</Text>
          </View>
        </View>

        <View style={[styles.hero, { backgroundColor: palette.card, borderColor: palette.border }]}> 
          <View style={[styles.heroBadge, { backgroundColor: palette.accentSoft }]}> 
            <Ionicons name="bag-handle-outline" size={16} color={palette.accent} />
            <Text style={[styles.heroBadgeText, { color: palette.accent }]}>Solo pickup</Text>
          </View>
          <Text style={[styles.heroTitle, { color: palette.text }]}>Ordena rapido, recoge sin filas</Text>
          <Text style={[styles.heroSubtitle, { color: palette.textMuted }]}>Paga en linea o paga en caja cuando llegues.</Text>
          <View style={styles.paymentRow}>
            <View style={[styles.paymentChip, { backgroundColor: isDark ? "#232830" : "#F5EEE5" }]}> 
              <Ionicons name="card-outline" size={14} color={palette.text} />
              <Text style={[styles.paymentText, { color: palette.text }]}>Pago en app</Text>
            </View>
            <View style={[styles.paymentChip, { backgroundColor: isDark ? "#232830" : "#F5EEE5" }]}> 
              <Ionicons name="cash-outline" size={14} color={palette.text} />
              <Text style={[styles.paymentText, { color: palette.text }]}>Pago en caja</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: palette.text }]}>Lo mas pedido hoy</Text>
        <View style={styles.featureGrid}>
          <View style={[styles.featureCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
            <Text style={[styles.featureEmoji, { color: palette.text }]}>🍳</Text>
            <Text style={[styles.featureName, { color: palette.text }]}>Desayunos</Text>
            <Text style={[styles.featureDesc, { color: palette.textMuted }]}>Clasicos chapines</Text>
          </View>
          <View style={[styles.featureCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
            <Text style={[styles.featureEmoji, { color: palette.text }]}>🥤</Text>
            <Text style={[styles.featureName, { color: palette.text }]}>Malteadas</Text>
            <Text style={[styles.featureDesc, { color: palette.textMuted }]}>Frutas y chocolate</Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
          <Text style={[styles.infoTitle, { color: palette.text }]}>Horario</Text>
          <Text style={[styles.infoText, { color: palette.textMuted }]}>Lunes a domingo · 7:00 AM - 7:00 PM</Text>
        </View>
      </ScrollView>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  tagline: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "500",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  hero: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  heroTitle: {
    marginTop: 12,
    fontSize: 23,
    fontWeight: "700",
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  paymentRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
  },
  paymentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    marginTop: 22,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  featureGrid: {
    marginTop: 10,
    flexDirection: "row",
    gap: 10,
  },
  featureCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  featureEmoji: {
    fontSize: 22,
  },
  featureName: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "700",
  },
  featureDesc: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
  },
  infoCard: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  infoText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "500",
  },
});

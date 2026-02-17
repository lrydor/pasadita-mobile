import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../lib/theme";
import { supabase } from "../../lib/supabase";
import ScreenView from "../../components/ScreenView";

type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
};

type Order = {
  id: string;
  status: string | null;
  payment_method: string | null;
  total: number | null;
  created_at: string | null;
};

export default function Screen() {
  const { isDark, toggleMode } = useTheme();
  const brandColor = isDark ? "#B68A7B" : "#714E43";
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadAccount = async () => {
      setLoading(true);
      setErrorMessage(null);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setUserId(null);
        setProfile(null);
        setOrders([]);
        setLoading(false);
        return;
      }

      const userId = userData.user.id;
      setUserId(userId);
      const [profileResult, ordersResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, email, first_name, last_name")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("orders")
          .select("id, status, payment_method, total, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      if (profileResult.error) {
        setErrorMessage(profileResult.error.message);
      } else {
        setProfile(profileResult.data ?? null);
      }

      if (ordersResult.error) {
        setErrorMessage(ordersResult.error.message);
        setOrders([]);
      } else {
        setOrders(ordersResult.data ?? []);
      }

      setLoading(false);
    };

    loadAccount();
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    setErrorMessage(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setErrorMessage(error.message);
    } else {
      setUserId(null);
      setProfile(null);
      setOrders([]);
    }
    setSigningOut(false);
  };

  const handleNotificationsToggle = (value: boolean) => {
    setNotificationsEnabled(value);
    setSuccessMessage("Se actualizo tu informacion.");
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  if (!loading && !userId) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <ScreenView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#0f0f0f" : "#f2f2f7" },
      ]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: isDark ? "#f5f5f5" : "#111" }]}>
          Mi cuenta
        </Text>
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={isDark ? "#f5f5f5" : "#1c1c1e"} />
          <Text style={[styles.loadingText, { color: isDark ? "#8e8e93" : "#6e6e73" }]}>
            Cargando perfil...
          </Text>
        </View>
      ) : null}
      {errorMessage ? (
        <Text style={[styles.errorText, { color: isDark ? "#ffb3b3" : "#b00020" }]}>
          {errorMessage}
        </Text>
      ) : null}
      {successMessage ? (
        <View
          style={[
            styles.successBanner,
            {
              backgroundColor: isDark ? "#112116" : "#e9f7ee",
              borderColor: isDark ? "#1d3a24" : "#cfe9d8",
            },
          ]}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={18}
            color={isDark ? "#7ad99b" : "#2e7d32"}
          />
          <Text
            style={[
              styles.successText,
              { color: isDark ? "#c9f3d5" : "#2e7d32" },
            ]}
          >
            {successMessage}
          </Text>
        </View>
      ) : null}
      <Text
        style={[
          styles.sectionLabel,
          styles.firstSectionLabel,
          { color: isDark ? "#8e8e93" : "#6e6e73" },
        ]}
      >
        Perfil
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
            Nombre
          </Text>
          <Text
            style={[styles.valueText, { color: isDark ? "#9a9a9a" : "#6e6e73" }]}
          >
            {profile
              ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
                "Sin nombre"
              : "Invitado"}
          </Text>
        </View>
        <View
          style={[
            styles.divider,
            {
              backgroundColor: isDark ? "#2c2c2e" : "#e5e5ea",
              opacity: isDark ? 0.35 : 1,
            },
          ]}
        />
        <View style={styles.settingRow}>
          <Text
            style={[
              styles.settingLabel,
              { color: isDark ? "#f5f5f5" : "#1c1c1e" },
            ]}
          >
            Correo
          </Text>
          <Text
            style={[styles.valueText, { color: isDark ? "#9a9a9a" : "#6e6e73" }]}
          >
            {profile?.email ?? "No has iniciado sesión"}
          </Text>
        </View>
        <View
          style={[
            styles.divider,
            {
              backgroundColor: isDark ? "#2c2c2e" : "#e5e5ea",
              opacity: isDark ? 0.35 : 1,
            },
          ]}
        />
        <Pressable
          onPress={() => router.push("/account/edit")}
          style={styles.settingRow}
        >
          <Text
            style={[
              styles.settingLabel,
              { color: isDark ? "#f5f5f5" : "#1c1c1e" },
            ]}
          >
            Editar perfil
          </Text>
          <Text
            style={[styles.chevron, { color: isDark ? "#8e8e93" : "#c7c7cc" }]}
          >
            ›
          </Text>
        </Pressable>
      </View>
      <Text
        style={[styles.sectionLabel, { color: isDark ? "#8e8e93" : "#6e6e73" }]}
      >
        Pedidos
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
            Historial de pedidos
          </Text>
          <Text
            style={[styles.chevron, { color: isDark ? "#8e8e93" : "#c7c7cc" }]}
          >
            ›
          </Text>
        </View>
        {orders.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text
              style={[styles.valueText, { color: isDark ? "#9a9a9a" : "#6e6e73" }]}
            >
              Aun no tienes pedidos
            </Text>
          </View>
        ) : (
          orders.map((order, index) => (
            <View key={order.id}>
              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: isDark ? "#2c2c2e" : "#e5e5ea",
                    opacity: isDark ? 0.35 : 1,
                  },
                ]}
              />
              <View style={styles.orderRow}>
                <View>
                  <Text
                    style={[
                      styles.settingLabel,
                      { color: isDark ? "#f5f5f5" : "#1c1c1e" },
                    ]}
                  >
                    Pedido #{String(order.id).slice(0, 6)}
                  </Text>
                  <Text
                    style={[
                      styles.valueText,
                      { color: isDark ? "#9a9a9a" : "#6e6e73" },
                    ]}
                  >
                    {order.status ?? "Sin estado"} · {order.payment_method ?? "N/A"}
                  </Text>
                </View>
                <Text
                  style={[styles.amountText, { color: isDark ? "#f5f5f5" : "#1c1c1e" }]}
                >
                  {order.total != null ? `Q${order.total}` : "Q0.00"}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
      <Text
        style={[styles.sectionLabel, { color: isDark ? "#8e8e93" : "#6e6e73" }]}
      >
        Configuracion
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
            Modo oscuro
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleMode}
            thumbColor={isDark ? "#f5f5f5" : "#fff"}
            trackColor={{ false: "#c7c7cc", true: brandColor }}
          />
        </View>
        <View
          style={[
            styles.divider,
            {
              backgroundColor: isDark ? "#2c2c2e" : "#e5e5ea",
              opacity: isDark ? 0.35 : 1,
            },
          ]}
        />
        <View style={styles.settingRow}>
          <Text
            style={[
              styles.settingLabel,
              { color: isDark ? "#f5f5f5" : "#1c1c1e" },
            ]}
          >
            Notificaciones
          </Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationsToggle}
            thumbColor={isDark ? "#f5f5f5" : "#fff"}
            trackColor={{ false: "#c7c7cc", true: brandColor }}
          />
        </View>
      </View>
      <View
        style={[
          styles.settingsGroup,
          {
            backgroundColor: isDark ? "#1c1c1e" : "#fff",
            borderColor: isDark ? "#2c2c2e" : "#e5e5ea",
          },
        ]}
      >
        <Pressable
          onPress={handleSignOut}
          disabled={signingOut}
          style={[
            styles.destructiveButton,
            {
              borderColor: signingOut ? (isDark ? "#3a3a3c" : "#d1d1d6") : brandColor,
              backgroundColor: signingOut ? (isDark ? "#3a3a3c" : "#d1d1d6") : brandColor,
            },
          ]}
        >
          <Text style={[styles.destructiveButtonText, { color: "#fff" }]}>
            {signingOut ? "Saliendo..." : "Cerrar sesion"}
          </Text>
        </Pressable>
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  successBanner: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  successText: {
    fontSize: 13,
    fontWeight: "600",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 20,
  },
  firstSectionLabel: {
    marginTop: 0,
  },
  settingsGroup: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
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
  emptyRow: {
    paddingBottom: 12,
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  divider: {
    height: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  valueText: {
    fontSize: 14,
    fontWeight: "500",
  },
  destructiveButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  destructiveButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  amountText: {
    fontSize: 15,
    fontWeight: "600",
  },
  chevron: {
    fontSize: 22,
    fontWeight: "600",
    marginLeft: 12,
  },
});

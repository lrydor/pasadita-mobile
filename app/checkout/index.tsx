import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenView from "../../components/ScreenView";
import { useTheme } from "../../lib/theme";
import { supabase } from "../../lib/supabase";

type CartRow = {
  id: number;
  quantity: number;
  product_id: number;
};

type Product = {
  id: number;
  name: string;
  price: number | null;
};

export default function Screen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { method } = useLocalSearchParams<{ method?: string }>();
  const paymentMethod = method === "CAJA" ? "CAJA" : "PAYPAL";

  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<CartRow[]>([]);
  const [productsMap, setProductsMap] = useState<Map<number, Product>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const palette = {
    bg: isDark ? "#101216" : "#F8F2EA",
    card: isDark ? "#1A1E24" : "#FFFDF9",
    border: isDark ? "#2A313A" : "#E9DED1",
    text: isDark ? "#F5F6F8" : "#1E232B",
    textMuted: isDark ? "#A5AFBC" : "#606A77",
    accent: isDark ? "#B68A7B" : "#714E43",
    accentSoft: isDark ? "#2D2521" : "#EFE5E0",
    error: isDark ? "#FFB3B3" : "#B00020",
    paypal: "#0070BA",
  };

  const loadCheckout = async () => {
    setLoading(true);
    setErrorMessage(null);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setUserId(null);
      setRows([]);
      setLoading(false);
      return;
    }

    setUserId(userData.user.id);

    const { data, error } = await supabase
      .from("cart_items")
      .select("id, quantity, product_id")
      .eq("user_id", userData.user.id)
      .order("id", { ascending: true });

    if (error) {
      setErrorMessage(error.message);
      setRows([]);
      setLoading(false);
      return;
    }

    const cartRows = (data ?? []) as CartRow[];
    setRows(cartRows);

    const ids = Array.from(new Set(cartRows.map((r) => r.product_id)));
    const map = new Map<number, Product>();
    if (ids.length > 0) {
      const { data: productData } = await supabase
        .from("products")
        .select("id, name, price")
        .in("id", ids);

      (productData ?? []).forEach((product) => {
        map.set((product as Product).id, product as Product);
      });
    }

    setProductsMap(map);
    setLoading(false);
  };

  useEffect(() => {
    loadCheckout();
  }, []);

  const subtotal = useMemo(
    () =>
      rows.reduce((sum, row) => {
        const price = productsMap.get(row.product_id)?.price ?? 0;
        return sum + price * row.quantity;
      }, 0),
    [rows, productsMap],
  );

  const fee = 0;
  const total = subtotal + fee;

  const createOrder = async () => {
    if (rows.length === 0) return;
    setPaying(true);
    setErrorMessage(null);

    let rpcResult = await supabase.rpc("create_local_order");

    if (rpcResult.error) {
      const msg = rpcResult.error.message.toLowerCase();
      const isSignatureIssue =
        msg.includes("does not exist") ||
        msg.includes("function") ||
        msg.includes("parameter");
      if (isSignatureIssue) {
        rpcResult = await supabase.rpc("create_local_order", {
          p_table_number: null,
        });
      }
    }

    if (rpcResult.error) {
      const msg = rpcResult.error.message.toLowerCase();
      const needsTable =
        msg.includes("mesa") ||
        msg.includes("table") ||
        msg.includes("numero de mesa");
      if (needsTable) {
        rpcResult = await supabase.rpc("create_local_order", {
          p_table_number: 1,
        });
      }
    }

    if (rpcResult.error) {
      setErrorMessage(rpcResult.error.message);
      setPaying(false);
      return;
    }

    setPaying(false);
    router.replace("/checkout/success");
  };

  if (!loading && !userId) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <ScreenView style={[styles.container, { backgroundColor: palette.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={palette.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: palette.text }]}>
          Checkout
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={palette.accent} />
            <Text style={[styles.loadingText, { color: palette.textMuted }]}>
              Cargando...
            </Text>
          </View>
        ) : null}

        {errorMessage ? (
          <Text style={[styles.errorText, { color: palette.error }]}>
            {errorMessage}
          </Text>
        ) : null}

        {/* Payment Method */}
        <View
          style={[
            styles.card,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: palette.text }]}>
            Metodo de pago
          </Text>
          <View
            style={[
              styles.payOption,
              {
                borderColor: palette.accent,
                backgroundColor: palette.accentSoft,
              },
            ]}
          >
            <View style={styles.payLeft}>
              <View
                style={[styles.payIconWrap, { borderColor: palette.accent }]}
              >
                <Ionicons
                  name={
                    paymentMethod === "PAYPAL" ? "logo-paypal" : "cash-outline"
                  }
                  size={15}
                  color={palette.accent}
                />
              </View>
              <Text style={[styles.payLabel, { color: palette.accent }]}>
                {paymentMethod === "PAYPAL" ? "PayPal" : "Pagar en caja"}
              </Text>
            </View>
            <Ionicons name="radio-button-on" size={18} color={palette.accent} />
          </View>
        </View>

        {/* Order Details */}
        <View
          style={[
            styles.card,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: palette.text }]}>
            Detalle de orden
          </Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: palette.textMuted }]}>
              Subtotal
            </Text>
            <Text style={[styles.summaryValue, { color: palette.text }]}>
              Q{subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: palette.textMuted }]}>
              Servicio
            </Text>
            <Text style={[styles.summaryValue, { color: palette.text }]}>
              Q{fee.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: palette.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: palette.text }]}>
              Total
            </Text>
            <Text style={[styles.totalValue, { color: palette.text }]}>
              Q{total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Pay Button */}
        {paymentMethod === "PAYPAL" ? (
          <Pressable
            disabled={paying || rows.length === 0}
            onPress={createOrder}
            style={[
              styles.payButton,
              {
                backgroundColor:
                  paying || rows.length === 0 ? palette.border : palette.paypal,
              },
            ]}
          >
            <Ionicons
              name="logo-paypal"
              size={18}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.payButtonText}>
              {paying ? "Procesando..." : "Pagar con PayPal"}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            disabled={paying || rows.length === 0}
            onPress={createOrder}
            style={[
              styles.payButton,
              {
                backgroundColor:
                  paying || rows.length === 0 ? palette.border : palette.accent,
              },
            ]}
          >
            <Text style={styles.payButtonText}>
              {paying ? "Procesando..." : "Confirmar orden"}
            </Text>
          </Pressable>
        )}

        {paymentMethod === "CAJA" ? (
          <Text style={[styles.cajaNote, { color: palette.textMuted }]}>
            Pagaras directamente en caja al recoger tu pedido.
          </Text>
        ) : null}
      </ScrollView>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerRight: {
    width: 22,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "500",
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  payOption: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  payLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  payIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  payLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 19,
    fontWeight: "700",
  },
  payButton: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  payButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  cajaNote: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
});

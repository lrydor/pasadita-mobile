import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../lib/theme";
import ScreenView from "../../components/ScreenView";
import { supabase } from "../../lib/supabase";

type Product = {
  id: number;
  name: string;
  price: number | null;
  image_url: string | null;
};

type CartRow = {
  id: number;
  quantity: number;
  product_id: number;
};

type CartItem = {
  id: number;
  quantity: number;
  product: Product;
};

export default function Screen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyItemId, setBusyItemId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"PAYPAL" | "CAJA">(
    "PAYPAL",
  );

  const palette = {
    bg: isDark ? "#101216" : "#F8F2EA",
    card: isDark ? "#1A1E24" : "#FFFDF9",
    border: isDark ? "#2A313A" : "#E9DED1",
    text: isDark ? "#F5F6F8" : "#1E232B",
    textMuted: isDark ? "#A5AFBC" : "#606A77",
    accent: isDark ? "#B68A7B" : "#714E43",
    accentSoft: isDark ? "#2D2521" : "#EFE5E0",
    error: isDark ? "#FFB3B3" : "#B00020",
  };

  const loadCart = async () => {
    setLoading(true);
    setErrorMessage(null);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setUserId(null);
      setItems([]);
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
      setItems([]);
      setLoading(false);
      return;
    }

    const cartRows = (data ?? []) as CartRow[];
    const productIds = Array.from(
      new Set(cartRows.map((row) => row.product_id)),
    );

    const fallbackProducts = new Map<number, Product>();
    productIds.forEach((productId) => {
      fallbackProducts.set(productId, {
        id: productId,
        name: `Producto #${productId}`,
        price: 0,
        image_url: null,
      });
    });

    if (productIds.length > 0) {
      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, price, image_url")
        .in("id", productIds);

      (productsData ?? []).forEach((product) => {
        fallbackProducts.set((product as Product).id, product as Product);
      });
    }

    const normalized = cartRows.map((row) => ({
      id: row.id,
      quantity: row.quantity,
      product: fallbackProducts.get(row.product_id)!,
    }));

    setItems(normalized);
    setLoading(false);
  };

  useEffect(() => {
    loadCart();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, []),
  );

  const updateQuantity = async (itemId: number, nextQuantity: number) => {
    if (nextQuantity < 1) return;
    setBusyItemId(itemId);
    setErrorMessage(null);

    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: nextQuantity })
      .eq("id", itemId);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, quantity: nextQuantity } : item,
        ),
      );
    }

    setBusyItemId(null);
  };

  const removeItem = async (itemId: number) => {
    setBusyItemId(itemId);
    setErrorMessage(null);

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    }

    setBusyItemId(null);
  };

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (item.product.price ?? 0) * item.quantity,
        0,
      ),
    [items],
  );

  const serviceFee = 0;
  const total = subtotal + serviceFee;

  if (!loading && !userId) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <ScreenView style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: palette.text }]}>Carrito</Text>
        <Text style={[styles.subtitle, { color: palette.textMuted }]}>
          Revisa tu pedido para recoger
        </Text>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={palette.accent} />
            <Text style={[styles.loadingText, { color: palette.textMuted }]}>
              Cargando carrito...
            </Text>
          </View>
        ) : null}

        {errorMessage ? (
          <Text style={[styles.errorText, { color: palette.error }]}>
            {errorMessage}
          </Text>
        ) : null}
        {successMessage ? (
          <Text style={[styles.successText, { color: palette.accent }]}>
            {successMessage}
          </Text>
        ) : null}

        {!loading && items.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: palette.card, borderColor: palette.border },
            ]}
          >
            <Ionicons name="cart-outline" size={24} color={palette.textMuted} />
            <Text style={[styles.emptyTitle, { color: palette.text }]}>
              Tu carrito esta vacio
            </Text>
            <Text style={[styles.emptyText, { color: palette.textMuted }]}>
              Agrega productos desde Menu para continuar.
            </Text>
          </View>
        ) : null}

        {items.map((item) => {
          const lineTotal = (item.product.price ?? 0) * item.quantity;
          const busy = busyItemId === item.id;

          return (
            <View
              key={item.id}
              style={[
                styles.itemCard,
                { backgroundColor: palette.card, borderColor: palette.border },
              ]}
            >
              {item.product.image_url ? (
                <Image
                  source={{ uri: item.product.image_url }}
                  style={styles.itemImage}
                />
              ) : (
                <View
                  style={[
                    styles.itemImageFallback,
                    { backgroundColor: palette.accentSoft },
                  ]}
                >
                  <Ionicons
                    name="restaurant-outline"
                    size={20}
                    color={palette.accent}
                  />
                </View>
              )}

              <View style={styles.itemBody}>
                <Text
                  numberOfLines={1}
                  style={[styles.itemName, { color: palette.text }]}
                >
                  {item.product.name}
                </Text>
                <Text style={[styles.itemPrice, { color: palette.textMuted }]}>
                  {item.product.price != null
                    ? `Q${item.product.price}`
                    : "Q0.00"}
                </Text>

                <View style={styles.itemFooter}>
                  <View style={styles.stepper}>
                    <Pressable
                      disabled={busy}
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      style={[
                        styles.stepBtn,
                        {
                          borderColor: palette.border,
                          backgroundColor: palette.bg,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.stepBtnText, { color: palette.text }]}
                      >
                        -
                      </Text>
                    </Pressable>
                    <Text style={[styles.qtyText, { color: palette.text }]}>
                      {item.quantity}
                    </Text>
                    <Pressable
                      disabled={busy}
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      style={[
                        styles.stepBtn,
                        {
                          borderColor: palette.border,
                          backgroundColor: palette.bg,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.stepBtnText, { color: palette.text }]}
                      >
                        +
                      </Text>
                    </Pressable>
                  </View>

                  <Pressable
                    disabled={busy}
                    onPress={() => removeItem(item.id)}
                  >
                    <Text style={[styles.removeText, { color: palette.error }]}>
                      {busy ? "..." : "Quitar"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Text style={[styles.lineTotal, { color: palette.text }]}>
                Q{lineTotal.toFixed(2)}
              </Text>
            </View>
          );
        })}

        <View
          style={[
            styles.summaryCard,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.summaryTitle, { color: palette.text }]}>
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
              Q{serviceFee.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: palette.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryTotalLabel, { color: palette.text }]}>
              Total
            </Text>
            <Text style={[styles.summaryTotalValue, { color: palette.text }]}>
              Q{total.toFixed(2)}
            </Text>
          </View>

          <Text style={[styles.paymentTitle, { color: palette.text }]}>
            Metodo de pago
          </Text>
          <View style={styles.paymentRow}>
            <Pressable
              onPress={() => setPaymentMethod("PAYPAL")}
              style={[
                styles.paymentOption,
                {
                  backgroundColor:
                    paymentMethod === "PAYPAL"
                      ? palette.accentSoft
                      : palette.bg,
                  borderColor:
                    paymentMethod === "PAYPAL"
                      ? palette.accent
                      : palette.border,
                },
              ]}
            >
              <Ionicons
                name="logo-paypal"
                size={14}
                color={
                  paymentMethod === "PAYPAL"
                    ? palette.accent
                    : palette.textMuted
                }
              />
              <Text
                style={[
                  styles.paymentText,
                  {
                    color:
                      paymentMethod === "PAYPAL"
                        ? palette.accent
                        : palette.textMuted,
                  },
                ]}
              >
                Pagar con PayPal
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setPaymentMethod("CAJA")}
              style={[
                styles.paymentOption,
                {
                  backgroundColor:
                    paymentMethod === "CAJA" ? palette.accentSoft : palette.bg,
                  borderColor:
                    paymentMethod === "CAJA" ? palette.accent : palette.border,
                },
              ]}
            >
              <Ionicons
                name="cash-outline"
                size={14}
                color={
                  paymentMethod === "CAJA" ? palette.accent : palette.textMuted
                }
              />
              <Text
                style={[
                  styles.paymentText,
                  {
                    color:
                      paymentMethod === "CAJA"
                        ? palette.accent
                        : palette.textMuted,
                  },
                ]}
              >
                Pagar en caja
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push(`/checkout?method=${paymentMethod}`)}
            disabled={items.length === 0}
            style={[
              styles.placeOrderBtn,
              {
                backgroundColor:
                  items.length === 0 ? palette.border : palette.accent,
              },
            ]}
          >
            <Text style={styles.placeOrderText}>Continuar al checkout</Text>
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
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  loadingRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  successText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyCard: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  itemCard: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  itemImageFallback: {
    width: 72,
    height: 72,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  itemBody: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
  },
  itemPrice: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "500",
  },
  itemFooter: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "600",
  },
  qtyText: {
    fontSize: 14,
    fontWeight: "700",
    minWidth: 16,
    textAlign: "center",
  },
  removeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  lineTotal: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  summaryCard: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
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
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  paymentTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
  },
  paymentRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  paymentOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
  },
  paymentText: {
    fontSize: 12,
    fontWeight: "700",
  },
  placeOrderBtn: {
    marginTop: 14,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  placeOrderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});

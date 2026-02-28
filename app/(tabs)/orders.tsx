import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../lib/theme";
import ScreenView from "../../components/ScreenView";
import { supabase } from "../../lib/supabase";

type Order = {
  id: number;
  status: string | null;
  payment_method: string | null;
  total: number | null;
  created_at: string | null;
};

type OrderItem = {
  id: number;
  quantity: number;
  product_name: string;
  product_price: number | null;
  product_image: string | null;
};

const STEPS = [
  {
    key: "recibida",
    label: "Orden recibida",
    icon: "receipt-outline" as const,
  },
  {
    key: "preparando",
    label: "Preparando",
    icon: "restaurant-outline" as const,
  },
  {
    key: "listo",
    label: "Listo para recoger",
    icon: "bag-check-outline" as const,
  },
];

function getStepIndex(status: string | null) {
  if (!status) return 0;
  const s = status.toUpperCase();
  if (s === "ENTREGADO") return 3; // all done
  return 1; // PENDIENTE = still preparing
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-GT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Screen() {
  const { isDark } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<Map<number, OrderItem[]>>(
    new Map(),
  );
  const [loadingItems, setLoadingItems] = useState<number | null>(null);

  const palette = {
    bg: isDark ? "#101216" : "#F8F2EA",
    card: isDark ? "#1A1E24" : "#FFFDF9",
    border: isDark ? "#2A313A" : "#E9DED1",
    text: isDark ? "#F5F6F8" : "#1E232B",
    textMuted: isDark ? "#A5AFBC" : "#606A77",
    accent: isDark ? "#B68A7B" : "#714E43",
    accentSoft: isDark ? "#2D2521" : "#EFE5E0",
    error: isDark ? "#FFB3B3" : "#B00020",
    green: isDark ? "#66BB6A" : "#2E7D32",
    greenSoft: isDark ? "#1B2E1B" : "#E8F5E9",
    lineMuted: isDark ? "#2A313A" : "#D6CFC5",
  };

  const loadOrders = async () => {
    setLoading(true);
    setErrorMessage(null);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setUserId(null);
      setOrders([]);
      setLoading(false);
      return;
    }

    setUserId(userData.user.id);

    const { data, error } = await supabase
      .from("orders")
      .select("id, status, payment_method, total, created_at")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setOrders([]);
    } else {
      setOrders((data ?? []) as Order[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, []),
  );

  const toggleExpand = async (orderId: number) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(orderId);

    if (orderItems.has(orderId)) return;

    setLoadingItems(orderId);

    // Try order_items joined with products
    const { data, error } = await supabase
      .from("order_items")
      .select("id, quantity, product:products(name, price, image_url)")
      .eq("order_id", orderId);

    if (!error && data && data.length > 0) {
      const items: OrderItem[] = data.map((row: any) => ({
        id: row.id,
        quantity: row.quantity ?? 1,
        product_name: row.product?.name ?? "Producto",
        product_price: row.product?.price ?? null,
        product_image: row.product?.image_url ?? null,
      }));
      setOrderItems((prev) => new Map(prev).set(orderId, items));
    } else {
      // Fallback: table might not exist or be empty
      setOrderItems((prev) => new Map(prev).set(orderId, []));
    }

    setLoadingItems(null);
  };

  if (!loading && !userId) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <ScreenView style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: palette.text }]}>Ordenes</Text>
        <Text style={[styles.subtitle, { color: palette.textMuted }]}>
          Sigue el estado de tus pedidos
        </Text>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={palette.accent} />
            <Text style={[styles.loadingText, { color: palette.textMuted }]}>
              Cargando ordenes...
            </Text>
          </View>
        ) : null}

        {errorMessage ? (
          <Text style={[styles.errorText, { color: palette.error }]}>
            {errorMessage}
          </Text>
        ) : null}

        {!loading && orders.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: palette.card, borderColor: palette.border },
            ]}
          >
            <Ionicons
              name="receipt-outline"
              size={28}
              color={palette.textMuted}
            />
            <Text style={[styles.emptyTitle, { color: palette.text }]}>
              Sin ordenes
            </Text>
            <Text style={[styles.emptyText, { color: palette.textMuted }]}>
              Tus pedidos apareceran aqui.
            </Text>
          </View>
        ) : null}

        {orders.map((order) => {
          const stepIndex = getStepIndex(order.status);
          const isDelivered = stepIndex === 3;
          const isExpanded = expandedId === order.id;
          const items = orderItems.get(order.id);
          const isLoadingThisOrder = loadingItems === order.id;

          return (
            <View
              key={order.id}
              style={[
                styles.orderCard,
                { backgroundColor: palette.card, borderColor: palette.border },
              ]}
            >
              {/* Order Header */}
              <View style={styles.orderHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.orderNumber, { color: palette.text }]}>
                    Orden #{order.id}
                  </Text>
                  <Text
                    style={[styles.orderDate, { color: palette.textMuted }]}
                  >
                    {formatDate(order.created_at)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: isDelivered
                        ? palette.greenSoft
                        : palette.accentSoft,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: isDelivered ? palette.green : palette.accent },
                    ]}
                  >
                    {order.status ?? "PENDIENTE"}
                  </Text>
                </View>
              </View>

              {/* Progress Tracker */}
              <View style={styles.tracker}>
                {STEPS.map((step, i) => {
                  const isDone = i < stepIndex;
                  const isCurrent = i === stepIndex && !isDelivered;
                  const isActive = isDone || isCurrent || isDelivered;
                  const lineColor =
                    isDone || isDelivered ? palette.green : palette.lineMuted;

                  return (
                    <View key={step.key} style={styles.stepRow}>
                      <View style={styles.stepIconCol}>
                        <View
                          style={[
                            styles.stepCircle,
                            {
                              backgroundColor: isActive
                                ? palette.green
                                : palette.lineMuted,
                            },
                          ]}
                        >
                          <Ionicons
                            name={step.icon}
                            size={14}
                            color={isActive ? "#fff" : palette.textMuted}
                          />
                        </View>
                        {i < STEPS.length - 1 ? (
                          <View
                            style={[
                              styles.stepLine,
                              { backgroundColor: lineColor },
                            ]}
                          />
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.stepLabel,
                          {
                            color: isActive ? palette.text : palette.textMuted,
                            fontWeight: isCurrent ? "700" : "500",
                          },
                        ]}
                      >
                        {step.label}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Order total + payment */}
              <View
                style={[styles.orderMeta, { borderTopColor: palette.border }]}
              >
                <View style={styles.metaRow}>
                  <Text
                    style={[styles.metaLabel, { color: palette.textMuted }]}
                  >
                    Total
                  </Text>
                  <Text style={[styles.metaValue, { color: palette.text }]}>
                    Q{(order.total ?? 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text
                    style={[styles.metaLabel, { color: palette.textMuted }]}
                  >
                    Pago
                  </Text>
                  <Text style={[styles.metaValue, { color: palette.text }]}>
                    {order.payment_method ?? "—"}
                  </Text>
                </View>
              </View>

              {/* Items in order - expandable */}
              <Pressable
                onPress={() => toggleExpand(order.id)}
                style={[styles.itemsToggle, { borderTopColor: palette.border }]}
              >
                <Text style={[styles.itemsTitle, { color: palette.text }]}>
                  Items en orden
                </Text>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-forward"}
                  size={20}
                  color={palette.textMuted}
                />
              </Pressable>

              {isExpanded ? (
                <View style={styles.itemsList}>
                  {isLoadingThisOrder ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color={palette.accent} />
                      <Text
                        style={[
                          styles.loadingText,
                          { color: palette.textMuted },
                        ]}
                      >
                        Cargando items...
                      </Text>
                    </View>
                  ) : null}

                  {items && items.length > 0
                    ? items.map((item) => (
                        <View
                          key={item.id}
                          style={[
                            styles.itemRow,
                            { borderBottomColor: palette.border },
                          ]}
                        >
                          {item.product_image ? (
                            <Image
                              source={{ uri: item.product_image }}
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
                                size={14}
                                color={palette.accent}
                              />
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text
                              numberOfLines={1}
                              style={[styles.itemName, { color: palette.text }]}
                            >
                              {item.product_name}
                            </Text>
                            <Text
                              style={[
                                styles.itemQty,
                                { color: palette.textMuted },
                              ]}
                            >
                              x{item.quantity}
                            </Text>
                          </View>
                          <Text
                            style={[styles.itemPrice, { color: palette.text }]}
                          >
                            {item.product_price != null
                              ? `Q${(item.product_price * item.quantity).toFixed(2)}`
                              : "—"}
                          </Text>
                        </View>
                      ))
                    : null}

                  {items && items.length === 0 && !isLoadingThisOrder ? (
                    <Text
                      style={[styles.noItemsText, { color: palette.textMuted }]}
                    >
                      No se encontraron items detallados.
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}
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
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "500",
  },

  /* Loading / Error */
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
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

  /* Empty */
  emptyCard: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
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

  /* Order Card */
  orderCard: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },

  /* Order Header */
  orderHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 14,
    paddingBottom: 10,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "700",
  },
  orderDate: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "500",
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  /* Progress Tracker */
  tracker: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepIconCol: {
    alignItems: "center",
    width: 28,
    marginRight: 10,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLine: {
    width: 2,
    height: 18,
  },
  stepLabel: {
    fontSize: 13,
    paddingTop: 6,
  },

  /* Order Meta */
  orderMeta: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "700",
  },

  /* Items Toggle */
  itemsToggle: {
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemsTitle: {
    fontSize: 15,
    fontWeight: "700",
  },

  /* Items List */
  itemsList: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  itemImageFallback: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: {
    fontSize: 13,
    fontWeight: "600",
  },
  itemQty: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "700",
  },
  noItemsText: {
    fontSize: 13,
    fontWeight: "500",
    paddingVertical: 8,
  },
});

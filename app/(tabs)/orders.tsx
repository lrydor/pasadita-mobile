import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  Switch,
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

type ProductAdmin = {
  id: number;
  name: string;
  price: number | null;
  image_url: string | null;
  available: boolean | null;
};

type AdminStats = {
  totalOrders: number;
  totalRevenue: number;
  ordersToday: number;
  pending: number;
  preparing: number;
  ready: number;
  delivered: number;
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

function getStatusHeadline(status: string | null) {
  if (!status) return "Preparando tu pedido";
  const s = status.toUpperCase();
  if (s === "ENTREGADO") return "Pedido entregado";
  return "Preparando tu pedido";
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

function computeAdminStats(orders: Order[]): AdminStats {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  return orders.reduce<AdminStats>(
    (acc, order) => {
      acc.totalOrders += 1;
      acc.totalRevenue += order.total ?? 0;

      if (order.created_at) {
        const key = new Date(order.created_at).toISOString().slice(0, 10);
        if (key === todayKey) {
          acc.ordersToday += 1;
        }
      }

      const status = (order.status ?? "PENDIENTE").toUpperCase();

      if (status === "ENTREGADO") {
        acc.delivered += 1;
      } else if (status === "LISTO") {
        acc.ready += 1;
      } else if (status === "PREPARANDO") {
        acc.preparing += 1;
      } else {
        acc.pending += 1;
      }

      return acc;
    },
    {
      totalOrders: 0,
      totalRevenue: 0,
      ordersToday: 0,
      pending: 0,
      preparing: 0,
      ready: 0,
      delivered: 0,
    },
  );
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
  const [refreshing, setRefreshing] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [adminProducts, setAdminProducts] = useState<ProductAdmin[]>([]);
  const [updatingProductId, setUpdatingProductId] = useState<number | null>(
    null,
  );
  const [productsSectionExpanded, setProductsSectionExpanded] = useState(false);

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
    setAdminStats(null);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setUserId(null);
      setOrders([]);
      setLoading(false);
      return;
    }

    setUserId(userData.user.id);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();

    const currentRole =
      (profile?.role as string | null | undefined) ?? null;
    setRole(currentRole);

    let query = supabase
      .from("orders")
      .select("id, status, payment_method, total, created_at");

    if (currentRole !== "admin") {
      query = query.eq("user_id", userData.user.id);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      setErrorMessage(error.message);
      setOrders([]);
    } else {
      setOrders((data ?? []) as Order[]);

      if (currentRole === "admin" && data) {
        setAdminStats(computeAdminStats(data as Order[]));

        const { data: productsData } = await supabase
          .from("products")
          .select("id, name, price, image_url, available")
          .order("name", { ascending: true });
        setAdminProducts((productsData ?? []) as ProductAdmin[]);
      }
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, []);

  const toggleProductAvailability = async (
    productId: number,
    nextValue: boolean,
  ) => {
    setUpdatingProductId(productId);

    const { error } = await supabase
      .from("products")
      .update({ available: nextValue })
      .eq("id", productId);

    if (!error) {
      setAdminProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, available: nextValue } : p,
        ),
      );
    }

    setUpdatingProductId(null);
  };

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.accent}
            colors={[palette.accent]}
          />
        }
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: palette.text }]}>
              {role === "admin" ? "Dashboard de órdenes" : "Ordenes"}
            </Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              {role === "admin"
                ? "Resumen de pedidos y estados del restaurante"
                : "Sigue el estado de tus pedidos"}
            </Text>
          </View>
          {role === "admin" ? (
            <View
              style={[
                styles.adminBadge,
                { backgroundColor: palette.accentSoft, borderColor: palette.border },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color={palette.accent}
              />
              <Text style={[styles.adminBadgeText, { color: palette.accent }]}>
                Admin
              </Text>
            </View>
          ) : null}
        </View>

        {role === "admin" && adminStats ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.adminCarousel}
          >
            <View
              style={[
                styles.adminCard,
                styles.adminCardPrimary,
                { backgroundColor: palette.accentSoft },
              ]}
            >
              <Text style={[styles.adminLabel, { color: palette.textMuted }]}>
                Órdenes totales
              </Text>
              <Text style={[styles.adminValue, { color: palette.text }]}>
                {adminStats.totalOrders}
              </Text>
              <Text style={[styles.adminSub, { color: palette.textMuted }]}>
                Hoy: {adminStats.ordersToday}
              </Text>
            </View>
            <View
              style={[
                styles.adminCard,
                { backgroundColor: palette.greenSoft },
              ]}
            >
              <Text style={[styles.adminLabel, { color: palette.textMuted }]}>
                Ingreso total
              </Text>
              <Text style={[styles.adminValue, { color: palette.green }]}>
                Q{adminStats.totalRevenue.toFixed(2)}
              </Text>
              <Text style={[styles.adminSub, { color: palette.textMuted }]}>
                Ticket prom.:{" "}
                {adminStats.totalOrders > 0
                  ? `Q${(adminStats.totalRevenue / adminStats.totalOrders).toFixed(2)}`
                  : "Q0.00"}
              </Text>
            </View>
            <View
              style={[
                styles.adminCard,
                { backgroundColor: palette.card },
              ]}
            >
              <Text style={[styles.adminLabel, { color: palette.textMuted }]}>
                Pendientes
              </Text>
              <Text style={[styles.adminValue, { color: palette.text }]}>
                {adminStats.pending}
              </Text>
              <Text style={[styles.adminSub, { color: palette.textMuted }]}>
                Preparando: {adminStats.preparing}
              </Text>
            </View>
            <View
              style={[
                styles.adminCard,
                { backgroundColor: palette.card },
              ]}
            >
              <Text style={[styles.adminLabel, { color: palette.textMuted }]}>
                Listas / entregadas
              </Text>
              <Text style={[styles.adminValue, { color: palette.text }]}>
                {adminStats.ready + adminStats.delivered}
              </Text>
              <Text style={[styles.adminSub, { color: palette.textMuted }]}>
                Entregadas: {adminStats.delivered}
              </Text>
            </View>
          </ScrollView>
        ) : null}

        {role === "admin" && adminProducts.length > 0 ? (
          <View style={styles.adminProductsSection}>
            <Pressable
              onPress={() =>
                setProductsSectionExpanded((prev) => !prev)
              }
              style={[
                styles.productsSectionHeader,
                { borderColor: palette.border, backgroundColor: palette.card },
              ]}
            >
              <View>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>
                  Gestión de productos
                </Text>
                <Text
                  style={[styles.sectionSubtitle, { color: palette.textMuted }]}
                >
                  Marca qué platos están disponibles hoy en el menú.
                </Text>
              </View>
              <Ionicons
                name={
                  productsSectionExpanded ? "chevron-up" : "chevron-down"
                }
                size={22}
                color={palette.textMuted}
              />
            </Pressable>
            {productsSectionExpanded
              ? adminProducts.map((product) => (
              <View
                key={product.id}
                style={[
                  styles.productRow,
                  { borderColor: palette.border, backgroundColor: palette.card },
                ]}
              >
                <View style={styles.productInfo}>
                  {product.image_url ? (
                    <Image
                      source={{ uri: product.image_url }}
                      style={styles.productThumb}
                    />
                  ) : (
                    <View
                      style={[
                        styles.productThumbFallback,
                        { backgroundColor: palette.accentSoft },
                      ]}
                    >
                      <Ionicons
                        name="restaurant-outline"
                        size={16}
                        color={palette.accent}
                      />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={[styles.productNameAdmin, { color: palette.text }]}
                    >
                      {product.name}
                    </Text>
                    <Text
                      style={[
                        styles.productMetaAdmin,
                        { color: palette.textMuted },
                      ]}
                    >
                      {product.price != null
                        ? `Q${product.price.toFixed(2)}`
                        : "Sin precio"}
                    </Text>
                  </View>
                </View>
                <View style={styles.productToggle}>
                  <Text
                    style={[
                      styles.toggleLabel,
                      { color: palette.textMuted },
                    ]}
                  >
                    {product.available === false ? "Oculto" : "Visible"}
                  </Text>
                  <Switch
                    value={product.available !== false}
                    onValueChange={(value) =>
                      toggleProductAvailability(product.id, value)
                    }
                    thumbColor={
                      product.available === false ? "#ccc" : palette.addBtnText
                    }
                    trackColor={{
                      false: palette.lineMuted,
                      true: palette.accent,
                    }}
                    disabled={updatingProductId === product.id}
                  />
                </View>
              </View>
            ))
              : null}
          </View>
        ) : null}

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
                    {getStatusHeadline(order.status)}
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

              {/* Items en orden - expandable solo si está entregado */}
              {isDelivered ? (
                <>
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
                </>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
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
  adminCarousel: {
    paddingVertical: 16,
    paddingRight: 20,
    gap: 12,
  },
  adminCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginRight: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  adminCardPrimary: {
    minWidth: 180,
  },
  adminLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  adminValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  adminSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  adminProductsSection: {
    marginTop: 24,
    gap: 10,
  },
  productsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  productRow: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  productInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  productThumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  productThumbFallback: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  productNameAdmin: {
    fontSize: 14,
    fontWeight: "600",
  },
  productMetaAdmin: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  productToggle: {
    alignItems: "flex-end",
    gap: 4,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});

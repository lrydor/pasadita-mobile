import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../lib/theme";
import { supabase } from "../../lib/supabase";

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function Screen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const palette = {
    bg: isDark ? "#101216" : "#F8F2EA",
    card: isDark ? "#1A1E24" : "#FFFDF9",
    border: isDark ? "#2A313A" : "#E9DED1",
    text: isDark ? "#F5F6F8" : "#1E232B",
    textMuted: isDark ? "#A5AFBC" : "#606A77",
    accent: isDark ? "#B68A7B" : "#714E43",
    accentSoft: isDark ? "#2D2521" : "#EFE5E0",
    error: isDark ? "#FFB3B3" : "#B00020",
    black: isDark ? "#F5F6F8" : "#1E232B",
    ctaBg: isDark ? "#F5F6F8" : "#1E232B",
    ctaText: isDark ? "#101216" : "#FFFFFF",
    stepperBg: isDark ? "#2A313A" : "#F0EBE4",
  };

  const productId = useMemo(() => {
    const parsed = Number(id);
    return Number.isNaN(parsed) ? null : parsed;
  }, [id]);

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) {
        setErrorMessage("Producto invalido.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, image_url")
        .eq("id", productId)
        .maybeSingle();

      if (error) {
        setErrorMessage(error.message);
      } else {
        setProduct((data as Product) ?? null);
      }

      setLoading(false);
    };

    loadProduct();
  }, [productId]);

  const handleAddToCart = async () => {
    if (!productId) return;
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setErrorMessage("Debes iniciar sesion para agregar al carrito.");
      setSaving(false);
      return;
    }

    const { data: existing, error: existingError } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", userData.user.id)
      .eq("product_id", productId)
      .maybeSingle();

    if (existingError) {
      setErrorMessage(existingError.message);
      setSaving(false);
      return;
    }

    if (existing) {
      const currentQty =
        typeof existing.quantity === "number"
          ? existing.quantity
          : Number(existing.quantity ?? 0);
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: currentQty + quantity })
        .eq("id", existing.id);

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage("Agregado al carrito.");
        setSaving(false);
        setTimeout(() => router.back(), 800);
        return;
      }
    } else {
      const { error } = await supabase.from("cart_items").insert({
        user_id: userData.user.id,
        product_id: productId,
        quantity,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage("Agregado al carrito.");
        setSaving(false);
        setTimeout(() => router.back(), 800);
        return;
      }
    }

    setSaving(false);
  };

  const totalAmount = product?.price != null ? product.price * quantity : 0;

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: palette.bg },
        ]}
      >
        <ActivityIndicator size="small" color={palette.accent} />
        <Text style={[styles.loadingText, { color: palette.textMuted }]}>
          Cargando...
        </Text>
      </View>
    );
  }

  if (errorMessage && !product) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: palette.bg },
        ]}
      >
        <Text style={[styles.errorText, { color: palette.error }]}>
          {errorMessage}
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={[styles.backLink, { color: palette.accent }]}>
            Volver
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!product) return null;

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* Back button overlay */}
      <Pressable
        onPress={() => router.back()}
        style={[styles.backBtn, { backgroundColor: palette.card }]}
        hitSlop={10}
      >
        <Ionicons name="chevron-back" size={22} color={palette.text} />
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Image */}
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.heroImage} />
        ) : (
          <View
            style={[
              styles.heroImagePlaceholder,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Ionicons
              name="restaurant-outline"
              size={48}
              color={palette.accent}
            />
          </View>
        )}

        {/* Product Info */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.productName, { color: palette.text }]}>
                {product.name}
              </Text>
              <Text style={[styles.subtitle, { color: palette.textMuted }]}>
                La Pasadita
              </Text>
            </View>

            {/* Quantity Stepper */}
            <View style={styles.stepper}>
              <Pressable
                style={[styles.stepBtn, { backgroundColor: palette.stepperBg }]}
                onPress={() => setQuantity((prev) => Math.max(1, prev - 1))}
              >
                <Ionicons name="remove" size={18} color={palette.text} />
              </Pressable>
              <Text style={[styles.qtyValue, { color: palette.text }]}>
                {quantity}
              </Text>
              <Pressable
                style={[styles.stepBtn, { backgroundColor: palette.ctaBg }]}
                onPress={() => setQuantity((prev) => prev + 1)}
              >
                <Ionicons name="add" size={18} color={palette.ctaText} />
              </Pressable>
            </View>
          </View>

          {/* Info Badges */}
          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Ionicons name="star-outline" size={14} color={palette.accent} />
              <Text style={[styles.badgeText, { color: palette.text }]}>
                4.5
              </Text>
            </View>
            <View style={[styles.badgeDivider, { backgroundColor: palette.border }]} />
            <View style={styles.badge}>
              <Ionicons name="time-outline" size={14} color={palette.accent} />
              <Text style={[styles.badgeText, { color: palette.text }]}>
                8-10 min
              </Text>
            </View>
            <View style={[styles.badgeDivider, { backgroundColor: palette.border }]} />
            <View style={styles.badge}>
              <Ionicons name="flame-outline" size={14} color={palette.accent} />
              <Text style={[styles.badgeText, { color: palette.text }]}>
                124 Kcal
              </Text>
            </View>
          </View>

          {/* Description */}
          {product.description ? (
            <Text style={[styles.description, { color: palette.textMuted }]}>
              {product.description}
            </Text>
          ) : null}

          {/* Messages */}
          {errorMessage ? (
            <Text style={[styles.messageText, { color: palette.error }]}>
              {errorMessage}
            </Text>
          ) : null}
          {successMessage ? (
            <Text style={[styles.messageText, { color: palette.accent }]}>
              {successMessage}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: palette.bg, borderTopColor: palette.border },
        ]}
      >
        <View>
          <Text style={[styles.totalLabel, { color: palette.textMuted }]}>
            Total
          </Text>
          <Text style={[styles.totalAmount, { color: palette.text }]}>
            Q{totalAmount.toFixed(2)}
          </Text>
        </View>
        <Pressable
          style={[styles.ctaBtn, { backgroundColor: palette.ctaBg }]}
          onPress={handleAddToCart}
          disabled={saving}
        >
          <Text style={[styles.ctaText, { color: palette.ctaText }]}>
            {saving ? "Agregando..." : "Agregar al carrito"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 14,
    fontWeight: "600",
  },
  backLink: {
    fontSize: 15,
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 120,
  },

  /* Back button */
  backBtn: {
    position: "absolute",
    top: 54,
    left: 20,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  /* Hero Image */
  heroImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.85,
    resizeMode: "cover",
  },
  heroImagePlaceholder: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.85,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Info Section */
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  productName: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "500",
  },

  /* Stepper */
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyValue: {
    fontSize: 17,
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center",
  },

  /* Badges */
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  badgeDivider: {
    width: 1,
    height: 16,
  },

  /* Description */
  description: {
    marginTop: 20,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 22,
  },

  /* Messages */
  messageText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
  },

  /* Bottom Bar */
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 34,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 2,
  },
  ctaBtn: {
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "700",
  },
});

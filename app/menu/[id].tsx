import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenView from "../../components/ScreenView";
import { useTheme } from "../../lib/theme";
import { supabase } from "../../lib/supabase";

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
};

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
        typeof existing.quantity === "number" ? existing.quantity : Number(existing.quantity ?? 0);
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: currentQty + quantity })
        .eq("id", existing.id);

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage("Agregado al carrito.");
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
      }
    }

    setSaving(false);
  };

  return (
    <ScreenView style={[styles.container, { backgroundColor: palette.bg }]}> 
      <View style={styles.handleWrap}>
        <View style={[styles.handle, { backgroundColor: palette.border }]} />
      </View>

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Detalle</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={24} color={palette.text} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.stateWrap}>
          <ActivityIndicator size="small" color={palette.accent} />
          <Text style={[styles.stateText, { color: palette.textMuted }]}>Cargando...</Text>
        </View>
      ) : null}

      {errorMessage ? (
        <View style={styles.stateWrap}>
          <Text style={[styles.errorText, { color: palette.error }]}>{errorMessage}</Text>
        </View>
      ) : null}
      {successMessage ? (
        <View style={styles.stateWrap}>
          <Text style={[styles.successText, { color: palette.accent }]}>{successMessage}</Text>
        </View>
      ) : null}

      {product ? (
        <ScrollView contentContainerStyle={styles.content}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.image} />
          ) : (
            <View
              style={[
                styles.imagePlaceholder,
                { backgroundColor: palette.accentSoft, borderColor: palette.border },
              ]}
            >
              <Ionicons name="restaurant-outline" size={24} color={palette.accent} />
            </View>
          )}

          <Text style={[styles.name, { color: palette.text }]}>{product.name}</Text>

          {product.description ? (
            <Text style={[styles.description, { color: palette.textMuted }]}>{product.description}</Text>
          ) : null}

          <Text style={[styles.price, { color: palette.text }]}> 
            {product.price != null ? `Q${product.price}` : "Q0.00"}
          </Text>

          <View style={styles.qtyRow}>
            <Text style={[styles.qtyLabel, { color: palette.text }]}>Cantidad</Text>
            <View style={styles.stepper}>
              <Pressable
                style={[styles.stepBtn, { backgroundColor: palette.card, borderColor: palette.border }]}
                onPress={() => setQuantity((prev) => Math.max(1, prev - 1))}
              >
                <Text style={[styles.stepBtnText, { color: palette.text }]}>-</Text>
              </Pressable>
              <Text style={[styles.qtyValue, { color: palette.text }]}>{quantity}</Text>
              <Pressable
                style={[styles.stepBtn, { backgroundColor: palette.card, borderColor: palette.border }]}
                onPress={() => setQuantity((prev) => prev + 1)}
              >
                <Text style={[styles.stepBtnText, { color: palette.text }]}>+</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.cta, { backgroundColor: palette.accent }]}
            onPress={handleAddToCart}
            disabled={saving}
          >
            <Text style={styles.ctaText}>{saving ? "Agregando..." : "Agregar al carrito"}</Text>
          </Pressable>
        </ScrollView>
      ) : null}
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 999,
  },
  header: {
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  stateWrap: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stateText: {
    fontSize: 14,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 14,
    fontWeight: "600",
  },
  successText: {
    fontSize: 14,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginBottom: 14,
  },
  imagePlaceholder: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  price: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "700",
  },
  qtyRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  qtyLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 22,
  },
  qtyValue: {
    fontSize: 17,
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center",
  },
  cta: {
    marginTop: 20,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});

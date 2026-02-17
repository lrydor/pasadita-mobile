import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../lib/theme";
import ScreenView from "../../components/ScreenView";
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
  const [products, setProducts] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Todo");

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

  const getCategory = (name: string) => {
    const value = name.toLowerCase();
    if (value.includes("desayuno")) return "Desayunos";
    if (value.includes("malteada")) return "Malteadas";
    if (value.includes("caldo")) return "Sopas";
    if (value.includes("alitas") || value.includes("pan con carne")) return "Antojitos";
    if (
      value.includes("postre") ||
      value.includes("crepa") ||
      value.includes("panqueques") ||
      value.includes("choco banano")
    ) {
      return "Postres";
    }
    return "Otros";
  };

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, image_url")
        .order("name", { ascending: true });

      if (error) {
        setErrorMessage(error.message);
        setProducts([]);
      } else {
        setProducts((data ?? []) as Product[]);
      }

      setLoading(false);
    };

    loadProducts();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map((product) => getCategory(product.name)));
    return ["Todo", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !term || `${product.name} ${product.description ?? ""}`.toLowerCase().includes(term);
      const matchesCategory =
        selectedCategory === "Todo" || getCategory(product.name) === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchText, selectedCategory]);

  return (
    <ScreenView style={[styles.container, { backgroundColor: palette.bg }]}>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <Text style={[styles.title, { color: palette.text }]}>Menu</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>Antojitos y brunch para recoger</Text>

            <View style={[styles.searchWrap, { backgroundColor: palette.card, borderColor: palette.border }]}> 
              <Ionicons name="search" size={18} color={palette.textMuted} />
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Buscar en el menu"
                placeholderTextColor={palette.textMuted}
                style={[styles.searchInput, { color: palette.text }]}
              />
            </View>

            <FlatList
              data={categories}
              keyExtractor={(item) => item}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              renderItem={({ item }) => {
                const isActive = item === selectedCategory;
                return (
                  <Pressable
                    onPress={() => setSelectedCategory(item)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isActive ? palette.accent : palette.card,
                        borderColor: isActive ? palette.accent : palette.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isActive ? "#FFFFFF" : palette.text },
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              }}
            />

            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={palette.accent} />
                <Text style={[styles.loadingText, { color: palette.textMuted }]}>Cargando menu...</Text>
              </View>
            ) : null}
            {errorMessage ? (
              <Text style={[styles.errorText, { color: palette.error }]}>{errorMessage}</Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/menu/${item.id}`)}
            style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
          >
            <View style={styles.cardRow}>
              <View style={styles.cardText}>
                <Text style={[styles.categoryLabel, { color: palette.accent }]}> 
                  {getCategory(item.name)}
                </Text>
                <Text style={[styles.cardTitle, { color: palette.text }]}>{item.name}</Text>
                {item.description ? (
                  <Text numberOfLines={2} style={[styles.cardSubtitle, { color: palette.textMuted }]}>
                    {item.description}
                  </Text>
                ) : null}
                <Text style={[styles.cardPrice, { color: palette.text }]}> 
                  {item.price != null ? `Q${item.price}` : "Q0.00"}
                </Text>
              </View>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumbPlaceholder, { backgroundColor: palette.accentSoft }]}> 
                  <Ionicons name="restaurant-outline" size={20} color={palette.accent} />
                </View>
              )}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={[styles.emptyText, { color: palette.textMuted }]}>No hay productos para mostrar.</Text>
          ) : null
        }
      />
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
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
  searchWrap: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },
  chipRow: {
    paddingTop: 12,
    paddingBottom: 10,
    gap: 8,
  },
  chip: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardText: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: 12,
  },
  thumbPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "700",
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "500",
  },
  cardPrice: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 12,
  },
});

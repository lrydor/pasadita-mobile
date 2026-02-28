import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewToken,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const BANNER_GAP = 12;
const BANNER_WIDTH = Dimensions.get("window").width - 40; // 20px padding each side
const BANNER_SNAP = BANNER_WIDTH + BANNER_GAP;

type BannerSlide = {
  id: string;
  label: string;
  title: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const SLIDES: BannerSlide[] = [
  {
    id: "1",
    label: "Brunch chapin",
    title: "Ordena rapido,\nrecoge sin filas",
    sub: "Paga en app o en caja",
    icon: "bag-handle",
  },
  {
    id: "2",
    label: "Horario",
    title: "Lunes a domingo\n7:00 AM - 7:00 PM",
    sub: "Te esperamos todos los dias",
    icon: "time",
  },
  {
    id: "3",
    label: "Solo pickup",
    title: "Sin colas,\nsin espera",
    sub: "Ordena desde tu telefono",
    icon: "phone-portrait",
  },
];
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

const getCategory = (name: string) => {
  const value = name.toLowerCase();
  if (value.includes("desayuno")) return "Desayunos";
  if (value.includes("malteada")) return "Malteadas";
  if (value.includes("caldo")) return "Sopas";
  if (value.includes("alitas") || value.includes("pan con carne"))
    return "Antojitos";
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

export default function Screen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Todo");
  const [activeSlide, setActiveSlide] = useState(0);
  const bannerRef = useRef<FlatList<BannerSlide>>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveSlide(viewableItems[0].index);
      }
    },
    [],
  );
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  // Auto-advance every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % SLIDES.length;
        bannerRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const palette = {
    bg: isDark ? "#101216" : "#F8F2EA",
    card: isDark ? "#1A1E24" : "#FFFDF9",
    border: isDark ? "#2A313A" : "#E9DED1",
    text: isDark ? "#F5F6F8" : "#1E232B",
    textMuted: isDark ? "#A5AFBC" : "#606A77",
    accent: isDark ? "#B68A7B" : "#714E43",
    accentSoft: isDark ? "#2D2521" : "#EFE5E0",
    error: isDark ? "#FFB3B3" : "#B00020",
    promoBg: isDark ? "#2D2521" : "#EFE5E0",
    promoText: isDark ? "#B68A7B" : "#714E43",
    black: isDark ? "#F5F6F8" : "#1E232B",
    addBtn: isDark ? "#F5F6F8" : "#1E232B",
    addBtnText: isDark ? "#101216" : "#FFFFFF",
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
        !term ||
        `${product.name} ${product.description ?? ""}`
          .toLowerCase()
          .includes(term);
      const matchesCategory =
        selectedCategory === "Todo" ||
        getCategory(product.name) === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchText, selectedCategory]);

  const popularProducts = useMemo(
    () => filteredProducts.slice(0, 6),
    [filteredProducts],
  );
  const recommendedProducts = useMemo(
    () => filteredProducts.slice(6),
    [filteredProducts],
  );

  const renderProductCard = (item: Product) => (
    <Pressable
      key={item.id}
      onPress={() => router.push(`/menu/${item.id}`)}
      style={[
        styles.productCard,
        { backgroundColor: palette.card, borderColor: palette.border },
      ]}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.productImage} />
      ) : (
        <View
          style={[
            styles.productImagePlaceholder,
            { backgroundColor: palette.accentSoft },
          ]}
        >
          <Ionicons
            name="restaurant-outline"
            size={28}
            color={palette.accent}
          />
        </View>
      )}
      <Text
        numberOfLines={1}
        style={[styles.productName, { color: palette.text }]}
      >
        {item.name}
      </Text>
      <View style={styles.productBottom}>
        <Text style={[styles.productPrice, { color: palette.text }]}>
          {item.price != null ? `Q${item.price.toFixed(2)}` : "Q0.00"}
        </Text>
        <View style={[styles.addBtn, { backgroundColor: palette.addBtn }]}>
          <Ionicons name="add" size={18} color={palette.addBtnText} />
        </View>
      </View>
    </Pressable>
  );

  return (
    <ScreenView style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.brand, { color: palette.text }]}>
              La Pasadita
            </Text>
          </View>
          <Pressable
            style={[
              styles.iconBtn,
              { backgroundColor: palette.card, borderColor: palette.border },
            ]}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={palette.text}
            />
          </Pressable>
        </View>

        {/* Search */}
        <View
          style={[
            styles.searchWrap,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
        >
          <Ionicons name="search" size={18} color={palette.textMuted} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar..."
            placeholderTextColor={palette.textMuted}
            style={[styles.searchInput, { color: palette.text }]}
          />
        </View>

        {/* Promo Banner Carousel */}
        <FlatList
          ref={bannerRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          snapToInterval={BANNER_SNAP}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          contentContainerStyle={{ gap: BANNER_GAP }}
          getItemLayout={(_, index) => ({
            length: BANNER_WIDTH,
            offset: BANNER_SNAP * index,
            index,
          })}
          style={styles.bannerList}
          renderItem={({ item }) => (
            <View
              style={[
                styles.promoBanner,
                { backgroundColor: palette.promoBg, width: BANNER_WIDTH },
              ]}
            >
              <View style={styles.promoContent}>
                <Text style={[styles.promoLabel, { color: palette.promoText }]}>
                  {item.label}
                </Text>
                <Text style={[styles.promoTitle, { color: palette.promoText }]}>
                  {item.title}
                </Text>
                <Text style={[styles.promoSub, { color: palette.promoText }]}>
                  {item.sub}
                </Text>
              </View>
              <View style={styles.promoImageWrap}>
                <Ionicons
                  name={item.icon}
                  size={48}
                  color={palette.promoText}
                  style={{ opacity: 0.4 }}
                />
              </View>
            </View>
          )}
        />

        {/* Carousel dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((slide, i) => (
            <View
              key={slide.id}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === activeSlide ? palette.text : palette.border,
                },
              ]}
            />
          ))}
        </View>

        {/* Category Chips */}
        <FlatList
          data={categories}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          scrollEnabled
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
            <Text style={[styles.loadingText, { color: palette.textMuted }]}>
              Cargando menu...
            </Text>
          </View>
        ) : null}
        {errorMessage ? (
          <Text style={[styles.errorText, { color: palette.error }]}>
            {errorMessage}
          </Text>
        ) : null}

        {/* Lo mas pedido - Horizontal scroll */}
        {!loading && popularProducts.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>
                Lo mas pedido
              </Text>
              <Pressable onPress={() => setSelectedCategory("Todo")}>
                <Text style={[styles.viewAll, { color: palette.accent }]}>
                  Ver todo
                </Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {popularProducts.map(renderProductCard)}
            </ScrollView>
          </>
        ) : null}

        {/* Recomendados - Horizontal scroll */}
        {!loading && recommendedProducts.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>
                Recomendados
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {recommendedProducts.map(renderProductCard)}
            </ScrollView>
          </>
        ) : null}

        {/* If no products at all */}
        {!loading && filteredProducts.length === 0 ? (
          <Text style={[styles.emptyText, { color: palette.textMuted }]}>
            No hay productos para mostrar.
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  /* Header */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Search */
  searchWrap: {
    marginTop: 16,
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

  /* Promo Banner */
  bannerList: {
    marginTop: 16,
    overflow: "visible",
  },
  promoBanner: {
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  promoContent: {
    flex: 1,
  },
  promoLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  promoTitle: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
  },
  promoSub: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "500",
    opacity: 0.8,
  },
  promoImageWrap: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Dots */
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  /* Category Chips */
  chipRow: {
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },

  /* Loading / Error */
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },

  /* Section Headers */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: "600",
  },

  /* Horizontal Product List */
  horizontalList: {
    gap: 12,
    paddingRight: 4,
  },

  /* Product Card */
  productCard: {
    width: 160,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  productImage: {
    width: "100%",
    height: 110,
    borderRadius: 12,
    marginBottom: 10,
  },
  productImagePlaceholder: {
    width: "100%",
    height: 110,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  productBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "700",
  },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Empty */
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 20,
    textAlign: "center",
  },
});

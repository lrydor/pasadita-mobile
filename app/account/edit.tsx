import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

export default function Screen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const brandColor = isDark ? "#B68A7B" : "#714E43";
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setErrorMessage(null);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setUserId(null);
        setLoading(false);
        return;
      }

      setUserId(userData.user.id);
      setEmail(userData.user.email ?? null);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (error) {
        setErrorMessage(error.message);
      } else if (data) {
        const profile = data as Profile;
        setFirstName(profile.first_name ?? "");
        setLastName(profile.last_name ?? "");
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setErrorMessage("Debes iniciar sesion para guardar cambios.");
      setSaving(false);
      return;
    }

    const updates = {
      id: userData.user.id,
      email: userData.user.email ?? null,
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(updates, { onConflict: "id" });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage("Se actualizo tu informacion.");
      setTimeout(() => setSuccessMessage(null), 2500);
    }

    setSaving(false);
  };

  if (!loading && !userId) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <ScreenView
      style={[styles.container, { backgroundColor: isDark ? "#0f0f0f" : "#f2f2f7" }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Text style={[styles.backText, { color: isDark ? "#9a9a9a" : "#6e6e73" }]}>‹</Text>
        <Text style={[styles.backLabel, { color: isDark ? "#9a9a9a" : "#6e6e73" }]}>Volver</Text>
      </Pressable>
      <Text style={[styles.title, { color: isDark ? "#f5f5f5" : "#111" }]}>Editar perfil</Text>
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
          <Text style={[styles.successText, { color: isDark ? "#c9f3d5" : "#2e7d32" }]}>
            {successMessage}
          </Text>
        </View>
      ) : null}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? "#1c1c1e" : "#fff",
            borderColor: isDark ? "#2c2c2e" : "#e5e5ea",
          },
        ]}
      >
        <Text style={[styles.label, { color: isDark ? "#9a9a9a" : "#6e6e73" }]}>Correo</Text>
        <TextInput
          value={email ?? ""}
          editable={false}
          placeholder="Correo"
          placeholderTextColor={isDark ? "#8e8e93" : "#c7c7cc"}
          style={[
            styles.input,
            {
              color: isDark ? "#f5f5f5" : "#1c1c1e",
              backgroundColor: isDark ? "#2c2c2e" : "#f2f2f7",
            },
          ]}
        />
        <Text style={[styles.label, { color: isDark ? "#9a9a9a" : "#6e6e73" }]}>Nombre</Text>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Nombre"
          placeholderTextColor={isDark ? "#8e8e93" : "#c7c7cc"}
          style={[
            styles.input,
            {
              color: isDark ? "#f5f5f5" : "#1c1c1e",
              backgroundColor: isDark ? "#2c2c2e" : "#f2f2f7",
            },
          ]}
        />
        <Text style={[styles.label, { color: isDark ? "#9a9a9a" : "#6e6e73" }]}>Apellido</Text>
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          placeholder="Apellido"
          placeholderTextColor={isDark ? "#8e8e93" : "#c7c7cc"}
          style={[
            styles.input,
            {
              color: isDark ? "#f5f5f5" : "#1c1c1e",
              backgroundColor: isDark ? "#2c2c2e" : "#f2f2f7",
            },
          ]}
        />
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[
            styles.primaryButton,
            {
              backgroundColor: saving ? (isDark ? "#3a3a3c" : "#d1d1d6") : brandColor,
            },
          ]}
        >
          <Text style={[styles.primaryButtonText, { color: "#fff" }]}>
            {saving ? "Guardando..." : "Guardar cambios"}
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
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  backText: {
    fontSize: 22,
    fontWeight: "600",
  },
  backLabel: {
    fontSize: 14,
    fontWeight: "600",
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
  card: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

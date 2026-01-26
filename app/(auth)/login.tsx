import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../lib/theme";
import { supabase } from "../../lib/supabase";
import ScreenView from "../../components/ScreenView";

export default function Screen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const logoSource = require("../../assets/logo.png");

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    router.replace("/(tabs)/home");
  };

  return (
    <ScreenView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#0f0f0f" : "#f2f2f7" },
      ]}
    >
      <View
        style={[
          styles.heroGlow,
          { backgroundColor: isDark ? "#1f1f1f" : "#ffe6d5" },
        ]}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <Image source={logoSource} style={styles.logo} />
          <Text style={[styles.title, { color: isDark ? "#f5f5f5" : "#111" }]}>
            La Pasadita
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? "#9a9a9a" : "#636366" }]}>
            Antojitos chapines y desayunos sorpresa
          </Text>
        </View>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? "#1c1c1e" : "#fff",
              borderColor: isDark ? "#2c2c2e" : "#e5e5ea",
            },
          ]}
        >
          <Text
            style={[styles.cardTitle, { color: isDark ? "#f5f5f5" : "#1c1c1e" }]}
          >
            Inicia sesion
          </Text>
          {errorMessage ? (
            <Text
              style={[styles.errorText, { color: isDark ? "#ffb3b3" : "#b00020" }]}
            >
              {errorMessage}
            </Text>
          ) : null}
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="Correo"
            placeholderTextColor={isDark ? "#8e8e93" : "#9aa0a6"}
            value={email}
            onChangeText={setEmail}
            style={[
              styles.input,
              {
                color: isDark ? "#f5f5f5" : "#1c1c1e",
                backgroundColor: isDark ? "#2c2c2e" : "#f2f2f7",
              },
            ]}
          />
          <TextInput
            placeholder="Contrasena"
            placeholderTextColor={isDark ? "#8e8e93" : "#9aa0a6"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[
              styles.input,
              {
                color: isDark ? "#f5f5f5" : "#1c1c1e",
                backgroundColor: isDark ? "#2c2c2e" : "#f2f2f7",
              },
            ]}
          />
          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={[
              styles.primaryButton,
              {
                backgroundColor: loading
                  ? isDark
                    ? "#3a3a3c"
                    : "#d1d1d6"
                  : isDark
                  ? "#f5f5f5"
                  : "#1c1c1e",
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={isDark ? "#111" : "#fff"} />
            ) : (
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: isDark ? "#111" : "#fff" },
                ]}
              >
                Entrar
              </Text>
            )}
          </Pressable>
          <Pressable onPress={() => router.push("/(auth)/reset-password")}>
            <Text style={[styles.linkText, { color: isDark ? "#8e8e93" : "#6e6e73" }]}>
              Olvidaste tu contrasena?
            </Text>
          </Pressable>
        </View>
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: isDark ? "#8e8e93" : "#6e6e73" }]}>
            No tienes cuenta?
          </Text>
          <Pressable onPress={() => router.push("/(auth)/register")}>
            <Text style={[styles.footerLink, { color: isDark ? "#f5f5f5" : "#1c1c1e" }]}>
              Registrate
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
  heroGlow: {
    position: "absolute",
    top: -120,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.6,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  brand: {
    alignItems: "center",
    marginBottom: 28,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
    borderRadius: 60,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
  linkText: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  footer: {
    marginTop: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    fontWeight: "500",
  },
  footerLink: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "600",
  },
});

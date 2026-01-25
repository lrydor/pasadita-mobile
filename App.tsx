import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { supabase } from "./lib/supabase";

export default function App() {
  useEffect(() => {
    const testConnection = async () => {
      console.log(
        "Supabase env set:",
        Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL),
        Boolean(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
      );
      const { data, error } = await supabase.auth.getSession();
      console.log("Supabase getSession:", { data, error });
    };

    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Check the console for Supabase connection logs.</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

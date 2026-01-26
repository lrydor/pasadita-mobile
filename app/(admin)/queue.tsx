import { StyleSheet, Text } from "react-native";
import ScreenView from "../../components/ScreenView";

export default function Screen() {
  return (
    <ScreenView style={styles.container}>
      <Text style={styles.title}>queue</Text>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});

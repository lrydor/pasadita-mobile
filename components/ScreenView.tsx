import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenViewProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function ScreenView({ children, style }: ScreenViewProps) {
  return <SafeAreaView style={[{ flex: 1 }, style]}>{children}</SafeAreaView>;
}

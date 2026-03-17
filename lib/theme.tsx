import { createContext, useContext, useCallback, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import "expo-sqlite/localStorage/install";

const THEME_STORAGE_KEY = "pasadita_theme_mode";

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredMode(): ThemeMode | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {}
  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = getStoredMode();
    if (stored) return stored;
    return systemScheme === "dark" ? "dark" : "light";
  });

  const setModeAndPersist = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === "dark",
      setMode: setModeAndPersist,
      toggleMode: () =>
        setModeAndPersist(mode === "dark" ? "light" : "dark"),
    }),
    [mode, setModeAndPersist]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

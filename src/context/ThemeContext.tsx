
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = "theme";
const DEFAULT_THEME: Theme = "dark";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Subscribers allow React to observe changes to the browser's theme store.
const themeSubscribers = new Set<() => void>();

function isTheme(value: string | null): value is Theme {
  return value === "dark" || value === "light";
}

function getThemeSnapshot(): Theme {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  return isTheme(storedTheme) ? storedTheme : DEFAULT_THEME;
}

// The server and initial hydration render must use the same deterministic value.
function getServerThemeSnapshot(): Theme {
  return DEFAULT_THEME;
}

function subscribeToTheme(onStoreChange: () => void) {
  themeSubscribers.add(onStoreChange);

  // Storage events synchronize changes made in other tabs.
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorageChange);

  return () => {
    themeSubscribers.delete(onStoreChange);
    window.removeEventListener("storage", handleStorageChange);
  };
}

function notifyThemeSubscribers() {
  themeSubscribers.forEach((subscriber) => subscriber());
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  // Keep the document's styling synchronized with the React theme state.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";

    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    notifyThemeSubscribers();
  }, [theme]);

  const contextValue = useMemo(
    () => ({
      theme,
      toggleTheme,
    }),
    [theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}

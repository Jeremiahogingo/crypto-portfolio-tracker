
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

export type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = "theme";
const DEFAULT_THEME: Theme = "dark";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themeSubscribers = new Set<() => void>();

let memoryTheme: Theme = DEFAULT_THEME;

function isTheme(value: string | null): value is Theme {
  return value === "dark" || value === "light";
}

function readStoredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (isTheme(stored)) {
      memoryTheme = stored;
      return stored;
    }
  } catch {
    // Browser storage may be disabled or inaccessible.
  }

  return memoryTheme;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;

  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;

  const themeColor = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]'
  );

  if (themeColor) {
    themeColor.content =
      theme === "dark" ? "#0B1220" : "#F4F7FC";
  }
}

function notifySubscribers() {
  themeSubscribers.forEach((subscriber) => subscriber());
}

function getThemeSnapshot(): Theme {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  return readStoredTheme();
}

function getServerThemeSnapshot(): Theme {
  return DEFAULT_THEME;
}

function subscribeToTheme(onStoreChange: () => void) {
  themeSubscribers.add(onStoreChange);

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      memoryTheme = isTheme(event.newValue)
        ? event.newValue
        : DEFAULT_THEME;

      applyTheme(memoryTheme);
      onStoreChange();
    }

    if (event.key === null) {
      memoryTheme = DEFAULT_THEME;
      applyTheme(DEFAULT_THEME);
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorageChange);

  return () => {
    themeSubscribers.delete(onStoreChange);
    window.removeEventListener("storage", handleStorageChange);
  };
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

  const setTheme = useCallback((nextTheme: Theme) => {
    memoryTheme = nextTheme;

    try {
      window.localStorage.setItem(
        THEME_STORAGE_KEY,
        nextTheme
      );
    } catch {
      // Keep the current session usable even without persistent storage.
    }

    applyTheme(nextTheme);
    notifySubscribers();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const contextValue = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
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

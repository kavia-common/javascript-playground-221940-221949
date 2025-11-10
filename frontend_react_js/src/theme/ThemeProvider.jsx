import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";

/**
 * PUBLIC_INTERFACE
 * ThemeContext provides the current theme and a toggle function.
 */
export const ThemeContext = createContext({
  theme: "light",
  setTheme: (t) => {},
  toggleTheme: () => {},
});

const STORAGE_KEY = "ui.theme";

function getInitialTheme() {
  // default to light, optionally read OS preference if nothing stored
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {}
  return "light";
}

/**
 * PUBLIC_INTERFACE
 * ThemeProvider wraps the app, sets data-theme attribute, and persists preference.
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  const setTheme = useCallback((t) => {
    setThemeState(t === "dark" ? "dark" : "light");
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  // Apply and persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
    // Set on <html> for CSS variable switching
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

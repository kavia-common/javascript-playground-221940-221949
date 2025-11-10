import React, { useContext } from "react";
import { ThemeContext } from "../theme/ThemeProvider";

/**
 * PUBLIC_INTERFACE
 * ThemeToggle renders a button to switch between light and dark themes.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="button icon secondary"
      aria-label="Toggle theme"
      onClick={toggleTheme}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span aria-hidden="true" style={{ display: "inline-flex" }}>
        {isDark ? "🌙" : "🌞"}
      </span>
      <span style={{ fontWeight: 600 }}>{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}

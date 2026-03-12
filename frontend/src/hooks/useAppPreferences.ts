import { useEffect, useState } from "react";

import { deriveAccentTokens } from "../utils/colorTheme";

const THEME_STORAGE_KEY = "kanban_theme";
const ACCENT_STORAGE_KEY = "kanban_accent";
const DESCRIPTIONS_STORAGE_KEY = "kanban_show_all_descriptions";

export function useAppPreferences() {
  const [theme, setTheme] = useState(localStorage.getItem(THEME_STORAGE_KEY) ?? "system");
  const [accentColor, setAccentColor] = useState(localStorage.getItem(ACCENT_STORAGE_KEY) ?? "#305252");
  const [showFullDescriptions, setShowFullDescriptions] = useState(
    localStorage.getItem(DESCRIPTIONS_STORAGE_KEY) === "true",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = theme === "dark" || (theme === "system" && prefersDark);
    const {
      bg,
      bgStrong,
      panel,
      panelStrong,
      border,
      shadow,
      accent,
      accentSoft,
      accentContrast,
      accentGlow,
      accentWash,
    } = deriveAccentTokens(accentColor, isDark);

    document.documentElement.style.setProperty("--bg", bg);
    document.documentElement.style.setProperty("--bg-strong", bgStrong);
    document.documentElement.style.setProperty("--panel", panel);
    document.documentElement.style.setProperty("--panel-strong", panelStrong);
    document.documentElement.style.setProperty("--border", border);
    document.documentElement.style.setProperty("--shadow", shadow);
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--accent-soft", accentSoft);
    document.documentElement.style.setProperty("--accent-contrast", accentContrast);
    document.documentElement.style.setProperty("--accent-glow", accentGlow);
    document.documentElement.style.setProperty("--accent-wash", accentWash);
    localStorage.setItem(ACCENT_STORAGE_KEY, accent);
  }, [accentColor, theme]);

  useEffect(() => {
    localStorage.setItem(DESCRIPTIONS_STORAGE_KEY, String(showFullDescriptions));
  }, [showFullDescriptions]);

  return {
    accentColor,
    setAccentColor,
    setShowFullDescriptions,
    setTheme,
    showFullDescriptions,
    theme,
  };
}

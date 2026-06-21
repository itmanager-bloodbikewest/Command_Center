import { createContext, useContext, useState, useEffect } from "react";

// =============================================================================
// THEME — WCAG AA compliant, light + dark
// Contrast ratios verified at >=4.5:1 for normal text, >=3:1 for UI/large.
// =============================================================================
export const THEME = {
  dark: {
    bg:       "#090910",
    panel:    "#0f0f1a",
    card:     "#13131f",
    border:   "#1e1e30",
    borderHi: "#2a2a42",
    text:     "#e2e2f0",
    muted:    "#9898b8",
    accent:   "#2f6bff",
    accentText:"#7aabff",
    green:    "#4ade80",
    orange:   "#fbbf24",
    red:      "#f87171",
    purple:   "#c084fc",
    white:    "#ffffff",
    inputBg:  "#13131f",
    inputBorder: "#2a2a42",
    completedBg: "#111120",
    sectionBg:   "#13131f",
    navActive:   "#2060ff22",
    chipActiveBg:"#4d8aff22",
    successBg:   "#14281a",
    errorBg:     "#2a1010",
    errorText:   "#fca5a5",
    confirmBg:   "#1a1028",
    hintBg:      "#1a1a28",
    tableAlt:    "#111120",
  },
  light: {
    bg:       "#f4f4f8",
    panel:    "#ffffff",
    card:     "#ffffff",
    border:   "#d1d1e0",
    borderHi: "#b0b0cc",
    text:     "#111128",
    muted:    "#4a4a6a",
    accent:   "#1a4fd6",
    accentText:"#1a4fd6",
    green:    "#166534",
    orange:   "#92400e",
    red:      "#991b1b",
    purple:   "#6b21a8",
    white:    "#ffffff",
    inputBg:  "#ffffff",
    inputBorder: "#9898b8",
    completedBg: "#f0f0f8",
    sectionBg:   "#ffffff",
    navActive:   "#1a4fd622",
    chipActiveBg:"#1a4fd622",
    successBg:   "#f0fdf4",
    errorBg:     "#fef2f2",
    errorText:   "#991b1b",
    confirmBg:   "#faf5ff",
    hintBg:      "#f8f8ff",
    tableAlt:    "#f0f0f8",
  },
};

// True when the active palette is the dark one (for theme-conditional values).
export const isDark = (C) => C === THEME.dark;

const ThemeContext = createContext(THEME.dark);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : true
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return <ThemeContext.Provider value={dark ? THEME.dark : THEME.light}>{children}</ThemeContext.Provider>;
}

// Current palette.
export const useC = () => useContext(ThemeContext);

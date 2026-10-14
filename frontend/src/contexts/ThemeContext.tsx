import { createContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark-blue";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = "cashflow_theme";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark-blue" || saved === "light") {
      return saved;
    }
    return "light";
  });

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === "dark-blue") {
      root.classList.add("dark");
      root.classList.add("dark-blue");
      root.setAttribute("data-theme", "dark-blue");
    } else {
      root.classList.remove("dark");
      root.classList.remove("dark-blue");
      root.setAttribute("data-theme", "light");
    }
  };

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark-blue" : "light"));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === "dark-blue",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

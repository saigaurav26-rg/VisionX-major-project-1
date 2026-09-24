"use client";

import { useEffect } from "react";

const KEY = "visionx.settings";

export function ThemeInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const updateTheme = () => {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.theme === "light") {
            document.documentElement.classList.remove("dark");
          } else {
            document.documentElement.classList.add("dark");
          }
        } else {
          document.documentElement.classList.add("dark");
        }
      } catch {
        document.documentElement.classList.add("dark");
      }
    };

    updateTheme();

    // Settings change event listener
    window.addEventListener("storage", updateTheme);
    return () => window.removeEventListener("storage", updateTheme);
  }, []);

  return <>{children}</>;
}
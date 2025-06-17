"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Circle, CircleCheckBig } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, themes } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const themeColors: Record<string, string> = {
    light: "#000000",
    red: "#ef4444",
    rose: "#f43f5e",
    orange: "#f97316",
    green: "#22c55e",
    blue: "#3b82f6",
    yellow: "#eab308",
    violet: "#8b5cf6",
    pink: "#ec4899",
  };

  if (!mounted) return null;

  return (
    <ul className="flex gap-2 list-none p-0 m-0">
      {[...new Set(Array.isArray(themes) ? themes : [])]
        .filter((t) => t !== "system")
        .map((t) => (
          <li key={t}>
            <Button
              variant="outline"
              data-state={theme === t ? "active" : undefined}
              onClick={() => setTheme(t)}
            >
              {theme === t ? (
                <CircleCheckBig
                  fill={themeColors[t] || "#a3a3a3"}
                  color={t === "light" ? "#fff" : "#000"}
                  className="mr-1"
                />
              ) : (
                <Circle
                  fill={themeColors[t] || "#a3a3a3"}
                  color={t === "light" ? "#fff" : themeColors[t] || "#a3a3a3"}
                  className="mr-1"
                />
              )}
              {t === "light"
                ? "Default"
                : t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          </li>
        ))}
    </ul>
  );
}

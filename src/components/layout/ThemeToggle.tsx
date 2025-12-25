"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity px-2 py-1 rounded"
        aria-label="Toggle theme"
        disabled
      >
        <Monitor className="w-4 h-4" />
        <span className="hidden sm:inline">Theme</span>
      </button>
    );
  }

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  const getIcon = () => {
    if (theme === "system") {
      return <Monitor className="w-4 h-4" />;
    } else if (theme === "dark") {
      return <Moon className="w-4 h-4" />;
    } else {
      return <Sun className="w-4 h-4" />;
    }
  };

  const getLabel = () => {
    if (theme === "system") {
      return "System";
    } else if (theme === "dark") {
      return "Dark";
    } else {
      return "Light";
    }
  };

  const getAriaLabel = () => {
    if (theme === "system") {
      return "Switch to light theme";
    } else if (theme === "light") {
      return "Switch to dark theme";
    } else {
      return "Switch to system theme";
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      aria-label={getAriaLabel()}
      title={getAriaLabel()}
    >
      {getIcon()}
      <span className="hidden sm:inline">{getLabel()}</span>
    </button>
  );
}

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface MotionPrefsContextValue {
  reduced: boolean;
  setReduced: (reduced: boolean) => void;
}

export const MotionPrefsContext = createContext<
  MotionPrefsContextValue | undefined
>(undefined);

const STORAGE_KEY = "motion-reduced-override";

export function MotionPrefsProvider({ children }: { children: ReactNode }) {
  const [reduced, setReducedState] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check system preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const systemPrefersReduced = mediaQuery.matches;

    // Check localStorage override
    const stored = localStorage.getItem(STORAGE_KEY);
    const override = stored !== null ? stored === "true" : null;

    // Use override if exists, otherwise use system preference
    const initialReduced = override !== null ? override : systemPrefersReduced;
    setReducedState(initialReduced);

    // Listen for system preference changes (only if no override)
    const handleChange = (e: MediaQueryListEvent) => {
      const currentOverride = localStorage.getItem(STORAGE_KEY);
      if (currentOverride === null) {
        setReducedState(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setReduced = (value: boolean) => {
    setReducedState(value);
    if (value) {
      localStorage.setItem(STORAGE_KEY, "true");
    } else {
      localStorage.removeItem(STORAGE_KEY);
      // Fall back to system preference
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedState(mediaQuery.matches);
    }
  };

  // Avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <MotionPrefsContext.Provider value={{ reduced, setReduced }}>
      {children}
    </MotionPrefsContext.Provider>
  );
}

export function useMotionPrefs() {
  const context = useContext(MotionPrefsContext);
  if (context === undefined) {
    throw new Error("useMotionPrefs must be used within MotionPrefsProvider");
  }
  return context;
}

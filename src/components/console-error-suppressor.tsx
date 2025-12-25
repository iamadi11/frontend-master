"use client";

import { useEffect } from "react";

/**
 * Suppresses benign browser extension errors in the console.
 * This is optional - these errors are harmless and come from browser extensions
 * (React DevTools, Redux DevTools, ad blockers, etc.).
 */
export function ConsoleErrorSuppressor() {
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || "";
      // Suppress known benign browser extension errors
      if (
        message.includes("runtime.lastError") ||
        message.includes("message port closed")
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    // Cleanup: restore original console.error on unmount
    return () => {
      console.error = originalError;
    };
  }, []);

  return null;
}

"use client";

import { ReactNode } from "react";

interface Fallback2DProps {
  children: ReactNode;
  message?: string;
}

/**
 * Fallback component that renders the 2D demo when 3D is unavailable.
 * Shows a small note indicating 3D is unavailable.
 */
export function Fallback2D({ children, message }: Fallback2DProps) {
  return (
    <div className="space-y-2">
      {message && (
        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">
          {message}
        </div>
      )}
      {children}
    </div>
  );
}

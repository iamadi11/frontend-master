"use client";

import { useMotionPrefs } from "./MotionPrefsProvider";
import { Move } from "lucide-react";
import { useContext } from "react";
import { MotionPrefsContext } from "./MotionPrefsProvider";

export function ReduceMotionToggle() {
  const context = useContext(MotionPrefsContext);

  // Gracefully handle missing provider (e.g., during SSG)
  if (!context) {
    return null;
  }

  const { reduced, setReduced } = context;

  return (
    <button
      onClick={() => setReduced(!reduced)}
      className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      aria-label={reduced ? "Enable animations" : "Reduce motion"}
      title={reduced ? "Enable animations" : "Reduce motion"}
    >
      <Move className={`w-4 h-4 ${reduced ? "opacity-50" : ""}`} />
      <span className="hidden sm:inline">
        {reduced ? "Motion: Reduced" : "Motion: Full"}
      </span>
    </button>
  );
}

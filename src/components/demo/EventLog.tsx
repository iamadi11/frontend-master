"use client";

import { useMotionPrefs } from "../motion/MotionPrefsProvider";
import { motion, AnimatePresence } from "framer-motion";

export interface EventLogEntry {
  id: string;
  timestamp: number;
  cause: string;
  decision: string;
  explanation: string;
}

interface EventLogProps {
  entries: EventLogEntry[];
}

export function EventLog({ entries }: EventLogProps) {
  const { reduced } = useMotionPrefs();

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
      <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
        Decision Log
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {entries.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No decisions yet. Adjust constraints to see architecture
              decisions.
            </p>
          ) : (
            entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={reduced ? false : { opacity: 0, y: -8 }}
                animate={reduced ? {} : { opacity: 1, y: 0 }}
                exit={reduced ? {} : { opacity: 0, x: -8 }}
                transition={reduced ? {} : { duration: 0.3 }}
                className="text-sm p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start gap-2">
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {entry.cause}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {entry.decision}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs">
                  {entry.explanation}
                </p>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

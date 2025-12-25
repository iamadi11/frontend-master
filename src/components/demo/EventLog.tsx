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
    <div className="space-y-2 max-h-[500px] overflow-y-auto">
      <AnimatePresence mode="popLayout">
        {entries.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">
            No events yet. Interact with the demo to see events.
          </p>
        ) : (
          entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={reduced ? false : { opacity: 0, y: -4 }}
              animate={reduced ? {} : { opacity: 1, y: 0 }}
              exit={reduced ? {} : { opacity: 0, x: -8 }}
              transition={reduced ? {} : { duration: 0.2 }}
              className="text-sm p-3 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start gap-2 mb-1">
                <span className="text-xs font-mono text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                  #{index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {entry.cause}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {entry.decision}
                    </span>
                  </div>
                  {entry.explanation && (
                    <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs leading-relaxed">
                      {entry.explanation}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}

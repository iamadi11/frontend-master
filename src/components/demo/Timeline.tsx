"use client";

import { useMotionPrefs } from "../motion/MotionPrefsProvider";
import { motion } from "framer-motion";

export interface TimelinePhase {
  id: string;
  label: string;
  duration: number; // in ms
  highlighted?: boolean;
}

interface TimelineProps {
  phases: TimelinePhase[];
  totalDuration: number;
  userSeesContentAt?: number; // ms when user first sees content
}

export function Timeline({
  phases,
  totalDuration,
  userSeesContentAt,
}: TimelineProps) {
  const { reduced } = useMotionPrefs();

  const maxDuration = Math.max(...phases.map((p) => p.duration), totalDuration);

  return (
    <div className="space-y-4">
      <div className="relative h-32 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-hidden">
        {/* Timeline bar */}
        <div className="absolute bottom-4 left-4 right-4 h-2 bg-gray-300 dark:bg-gray-700 rounded-full">
          {phases.map((phase, index) => {
            const widthPercent = (phase.duration / maxDuration) * 100;
            const leftPercent =
              (phases.slice(0, index).reduce((sum, p) => sum + p.duration, 0) /
                maxDuration) *
              100;

            return (
              <motion.div
                key={phase.id}
                initial={reduced ? false : { scaleX: 0 }}
                animate={
                  reduced
                    ? {}
                    : {
                        scaleX: 1,
                        backgroundColor: phase.highlighted
                          ? "rgb(59, 130, 246)"
                          : "rgb(99, 102, 241)",
                      }
                }
                transition={
                  reduced
                    ? {}
                    : {
                        duration: 0.5,
                        delay: index * 0.1,
                        ease: "easeOut",
                      }
                }
                className={`absolute bottom-0 h-full rounded-full ${
                  phase.highlighted
                    ? "bg-blue-500 dark:bg-blue-400"
                    : "bg-indigo-500 dark:bg-indigo-400"
                }`}
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  transformOrigin: "left",
                }}
              />
            );
          })}

          {/* User sees content marker */}
          {userSeesContentAt !== undefined && (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: -10 }}
              animate={reduced ? {} : { opacity: 1, y: 0 }}
              transition={reduced ? {} : { duration: 0.4, delay: 0.3 }}
              className="absolute bottom-0 w-1 h-6 bg-green-500 dark:bg-green-400 rounded-full"
              style={{
                left: `${(userSeesContentAt / maxDuration) * 100}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs font-medium text-green-700 dark:text-green-300">
                User sees content
              </div>
            </motion.div>
          )}
        </div>

        {/* Phase labels */}
        <div className="absolute top-2 left-4 right-4 flex justify-between text-xs">
          {phases.map((phase) => (
            <div
              key={phase.id}
              className={`text-center ${
                phase.highlighted
                  ? "font-semibold text-blue-700 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <div>{phase.label}</div>
              <div className="text-xs opacity-75">{phase.duration}ms</div>
            </div>
          ))}
        </div>
      </div>

      {/* Total duration */}
      <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
        Total: {totalDuration}ms
      </div>
    </div>
  );
}

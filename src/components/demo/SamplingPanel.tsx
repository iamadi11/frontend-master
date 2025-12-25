"use client";

import { useMotionPrefs } from "../motion/MotionPrefsProvider";
import { motion } from "framer-motion";
import { SpotlightTarget } from "./Spotlight";

interface SamplingPanelProps {
  sampleRate: number;
  droppedEventsPct: number;
  totalEvents: number;
  redactPII: boolean;
  replayEnabled: boolean;
  privacyNotes: string[];
}

export function SamplingPanel({
  sampleRate,
  droppedEventsPct,
  totalEvents,
  redactPII,
  replayEnabled,
  privacyNotes,
}: SamplingPanelProps) {
  const { reduced } = useMotionPrefs();
  const keptEvents = Math.floor(totalEvents * sampleRate);
  const droppedEvents = totalEvents - keptEvents;

  return (
    <div className="space-y-4">
      <SpotlightTarget id="sampling" className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Sampling & Dropped Events
        </h4>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300">
              Sample Rate: {(sampleRate * 100).toFixed(0)}%
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Dropped: {droppedEventsPct.toFixed(1)}%
            </span>
          </div>
          <div className="relative h-8 bg-gray-200 dark:bg-gray-800 rounded overflow-hidden">
            <motion.div
              className="h-full bg-green-500 flex items-center justify-center text-xs text-white font-medium"
              initial={false}
              animate={
                reduced
                  ? {}
                  : {
                      width: `${sampleRate * 100}%`,
                    }
              }
              transition={reduced ? {} : { duration: 0.5 }}
            >
              {keptEvents} kept
            </motion.div>
            <motion.div
              className="absolute top-0 right-0 h-full bg-red-500 flex items-center justify-center text-xs text-white font-medium"
              initial={false}
              animate={
                reduced
                  ? {}
                  : {
                      width: `${(1 - sampleRate) * 100}%`,
                    }
              }
              transition={reduced ? {} : { duration: 0.5 }}
            >
              {droppedEvents} dropped
            </motion.div>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {totalEvents} total events → {keptEvents} sampled, {droppedEvents}{" "}
            dropped
          </div>
        </div>
      </SpotlightTarget>

      <SpotlightTarget id="privacy.panel" className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Privacy & Session Replay
        </h4>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                redactPII ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              PII Redaction: {redactPII ? "ON" : "OFF"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                replayEnabled ? "bg-yellow-500" : "bg-gray-400"
              }`}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Session Replay: {replayEnabled ? "ENABLED" : "DISABLED"}
            </span>
            {replayEnabled && (
              <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                Privacy Risk
              </span>
            )}
          </div>
          {privacyNotes.length > 0 && (
            <div className="mt-3 space-y-1">
              {privacyNotes.map((note, index) => (
                <motion.div
                  key={index}
                  initial={reduced ? false : { opacity: 0, x: -8 }}
                  animate={reduced ? {} : { opacity: 1, x: 0 }}
                  transition={
                    reduced ? {} : { duration: 0.3, delay: index * 0.1 }
                  }
                  className="text-xs text-gray-600 dark:text-gray-400"
                >
                  • {note}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </SpotlightTarget>
    </div>
  );
}

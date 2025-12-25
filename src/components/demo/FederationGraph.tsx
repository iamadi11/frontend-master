"use client";

import { useMotionPrefs } from "../motion/MotionPrefsProvider";
import { motion, AnimatePresence } from "framer-motion";

interface Remote {
  name: string;
  exposes: string[];
  deps: string[];
}

interface SharedDep {
  pkg: string;
  singleton: boolean;
  strictVersion: boolean;
}

interface FederationGraphProps {
  remotes: Remote[];
  sharedDeps: SharedDep[];
  duplicationKb: number;
  loadOrderEvents: string[];
  network: "FAST" | "SLOW";
  preloadRemotes: boolean;
}

export function FederationGraph({
  remotes,
  sharedDeps,
  duplicationKb,
  loadOrderEvents,
  network,
  preloadRemotes,
}: FederationGraphProps) {
  const { reduced } = useMotionPrefs();

  const hasDuplication = duplicationKb > 0;
  const duplicationColor =
    duplicationKb > 100 ? "red" : duplicationKb > 50 ? "yellow" : "green";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Module Federation Architecture
        </h4>
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Network: <span className="font-medium">{network}</span>
          </div>
          {preloadRemotes && (
            <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              Preload ON
            </span>
          )}
        </div>
      </div>

      {/* Host + Remotes visualization */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Host */}
          <motion.div
            initial={reduced ? false : { opacity: 0, scale: 0.9 }}
            animate={reduced ? {} : { opacity: 1, scale: 1 }}
            transition={reduced ? {} : { duration: 0.3 }}
            className="p-4 rounded-lg border-2 border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
          >
            <div className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-2">
              HOST
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Orchestrates remotes
            </div>
          </motion.div>

          {/* Remotes */}
          {remotes.map((remote, index) => (
            <motion.div
              key={remote.name}
              initial={reduced ? false : { opacity: 0, x: -20 }}
              animate={reduced ? {} : { opacity: 1, x: 0 }}
              transition={reduced ? {} : { duration: 0.3, delay: index * 0.1 }}
              className="p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2">
                {remote.name}
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Exposes: {remote.exposes.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Deps: {remote.deps.length}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Shared dependencies */}
        {sharedDeps.length > 0 && (
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Shared Dependencies
            </div>
            <div className="space-y-1">
              {sharedDeps.map((dep) => (
                <div
                  key={dep.pkg}
                  className="text-xs px-2 py-1 rounded bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-between"
                >
                  <span className="font-mono">{dep.pkg}</span>
                  <div className="flex items-center gap-2">
                    {dep.singleton && (
                      <span className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px]">
                        Singleton
                      </span>
                    )}
                    {dep.strictVersion && (
                      <span className="px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-[10px]">
                        Strict
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Duplication indicator */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={reduced ? {} : { opacity: 1 }}
          transition={reduced ? {} : { duration: 0.3 }}
          className={`p-3 rounded-lg border-2 ${
            duplicationColor === "red"
              ? "border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20"
              : duplicationColor === "yellow"
                ? "border-yellow-500 dark:border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
                : "border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">
              Duplication: {duplicationKb.toFixed(1)} KB
            </span>
            {hasDuplication && (
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {duplicationColor === "red"
                  ? "⚠️ High duplication risk"
                  : duplicationColor === "yellow"
                    ? "⚠️ Moderate duplication"
                    : "✓ Low duplication"}
              </span>
            )}
          </div>
        </motion.div>

        {/* Load order events */}
        {loadOrderEvents.length > 0 && (
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Load Order
            </div>
            <div className="space-y-1">
              <AnimatePresence mode="popLayout">
                {loadOrderEvents.map((event, index) => (
                  <motion.div
                    key={`${event}-${index}`}
                    initial={reduced ? false : { opacity: 0, x: -8 }}
                    animate={reduced ? {} : { opacity: 1, x: 0 }}
                    exit={reduced ? {} : { opacity: 0, x: 8 }}
                    transition={reduced ? {} : { duration: 0.2 }}
                    className="text-xs px-2 py-1 rounded bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-mono"
                  >
                    {index + 1}. {event}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

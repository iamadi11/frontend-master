"use client";

import { useMotionPrefs } from "../motion/MotionPrefsProvider";
import { motion, AnimatePresence } from "framer-motion";
import { SpotlightTarget } from "./Spotlight";

interface ErrorFlowStep {
  phase: string;
  uiState: string;
  note: string;
}

interface ErrorBoundarySimProps {
  errorType: "NONE" | "RENDER_ERROR" | "EVENT_HANDLER_ERROR" | "ASYNC_ERROR";
  boundaryStrategy: "NONE" | "PAGE_BOUNDARY" | "WIDGET_BOUNDARY";
  errorFlow: ErrorFlowStep[];
  hasError: boolean;
}

export function ErrorBoundarySim({
  errorType,
  boundaryStrategy,
  errorFlow,
  hasError,
}: ErrorBoundarySimProps) {
  const { reduced } = useMotionPrefs();

  const currentFlowStep =
    errorFlow.find((step) => step.phase === "current") || errorFlow[0];
  const showFallback = hasError && boundaryStrategy !== "NONE";
  const showPageLevel = boundaryStrategy === "PAGE_BOUNDARY";
  const showWidgetLevel = boundaryStrategy === "WIDGET_BOUNDARY";

  return (
    <SpotlightTarget id="error.sim" className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Error Boundary Simulation
      </h4>
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-4">
        {/* UI Components Area */}
        <div className="border-2 border-gray-300 dark:border-gray-700 rounded-lg p-4 min-h-[200px] bg-white dark:bg-gray-800">
          {showPageLevel && showFallback ? (
            <motion.div
              initial={reduced ? false : { opacity: 0, scale: 0.95 }}
              animate={reduced ? {} : { opacity: 1, scale: 1 }}
              transition={reduced ? {} : { duration: 0.3 }}
              className="text-center py-8"
            >
              <div className="text-red-500 text-4xl mb-2">⚠️</div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Page Error Boundary
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Entire page caught by boundary
              </p>
            </motion.div>
          ) : showWidgetLevel && showFallback ? (
            <div className="space-y-2">
              <motion.div
                initial={reduced ? false : { opacity: 0, scale: 0.95 }}
                animate={reduced ? {} : { opacity: 1, scale: 1 }}
                transition={reduced ? {} : { duration: 0.3 }}
                className="border-2 border-red-500 rounded p-3 bg-red-50 dark:bg-red-900/20"
              >
                <div className="text-red-500 text-2xl mb-1">⚠️</div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Widget Error Boundary
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Widget caught, page continues
                </p>
              </motion.div>
              <div className="border border-gray-200 dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-900">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Other widgets still working
                </p>
              </div>
            </div>
          ) : hasError && boundaryStrategy === "NONE" ? (
            <motion.div
              initial={reduced ? false : { opacity: 0 }}
              animate={reduced ? {} : { opacity: 1 }}
              transition={reduced ? {} : { duration: 0.3 }}
              className="text-center py-8"
            >
              <div className="text-red-500 text-4xl mb-2">💥</div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Uncaught Error - Page Crashed
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                No boundary to catch this error
              </p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <div className="border border-gray-200 dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-900">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Widget 1: Normal
                </p>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-900">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Widget 2: Normal
                </p>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-900">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Widget 3: Normal
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error Flow Steps */}
        {errorFlow.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Recovery Flow
            </h5>
            <div className="space-y-1">
              {errorFlow.map((step, index) => (
                <motion.div
                  key={index}
                  initial={reduced ? false : { opacity: 0, x: -8 }}
                  animate={reduced ? {} : { opacity: 1, x: 0 }}
                  transition={
                    reduced ? {} : { duration: 0.3, delay: index * 0.1 }
                  }
                  className={`text-xs p-2 rounded ${
                    step.phase === "current"
                      ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"
                      : "bg-gray-100 dark:bg-gray-800"
                  }`}
                >
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {step.phase}:
                  </span>{" "}
                  <span className="text-gray-600 dark:text-gray-400">
                    {step.uiState}
                  </span>
                  <div className="text-gray-500 dark:text-gray-500 mt-1">
                    {step.note}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Async Error Note */}
        {errorType === "ASYNC_ERROR" && (
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={reduced ? {} : { opacity: 1 }}
            transition={reduced ? {} : { duration: 0.3 }}
            className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-2 rounded"
          >
            ⚠️ Async errors are not automatically caught by error boundaries.
            Report manually to telemetry pipeline.
          </motion.div>
        )}
      </div>
    </SpotlightTarget>
  );
}

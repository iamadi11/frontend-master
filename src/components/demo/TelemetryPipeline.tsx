"use client";

import { useMotionPrefs } from "../motion/MotionPrefsProvider";
import { motion, AnimatePresence } from "framer-motion";
import { SpotlightTarget } from "./Spotlight";

interface PipelineStep {
  id: string;
  label: string;
  status: "PENDING" | "PROCESSING" | "COMPLETE" | "ERROR";
}

interface TelemetryPipelineProps {
  steps: PipelineStep[];
  activeStepId?: string | null;
  eventPackets?: Array<{
    id: string;
    stepId: string;
    signalType: "LOG" | "METRIC" | "TRACE";
  }>;
}

export function TelemetryPipeline({
  steps,
  activeStepId,
  eventPackets = [],
}: TelemetryPipelineProps) {
  const { reduced } = useMotionPrefs();

  return (
    <SpotlightTarget id="pipeline" className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Telemetry Pipeline
      </h4>
      <div className="relative bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <div className="flex items-center justify-between gap-4 overflow-x-auto">
          {steps.map((step, index) => {
            const isActive = activeStepId === step.id;
            const isProcessing =
              step.status === "PROCESSING" || step.status === "COMPLETE";
            const stepPackets = eventPackets.filter(
              (p) => p.stepId === step.id
            );

            return (
              <div
                key={step.id}
                className="flex items-center gap-2 min-w-[120px]"
              >
                <div className="flex flex-col items-center gap-2">
                  <motion.div
                    className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center text-xs font-medium transition-colors ${
                      isActive
                        ? "border-blue-500 bg-blue-100 dark:bg-blue-900/30"
                        : isProcessing
                          ? "border-green-500 bg-green-100 dark:bg-green-900/30"
                          : step.status === "ERROR"
                            ? "border-red-500 bg-red-100 dark:bg-red-900/30"
                            : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                    }`}
                    animate={
                      reduced
                        ? {}
                        : isActive
                          ? {
                              scale: [1, 1.1, 1],
                              boxShadow: [
                                "0 0 0 0 rgba(59, 130, 246, 0)",
                                "0 0 0 8px rgba(59, 130, 246, 0.3)",
                                "0 0 0 0 rgba(59, 130, 246, 0)",
                              ],
                            }
                          : {}
                    }
                    transition={
                      reduced
                        ? {}
                        : {
                            duration: 1.5,
                            repeat: isActive ? Infinity : 0,
                            ease: "easeInOut",
                          }
                    }
                  >
                    {step.status === "COMPLETE" && "✓"}
                    {step.status === "ERROR" && "✗"}
                    {step.status === "PROCESSING" && "⟳"}
                  </motion.div>
                  <span className="text-xs text-center text-gray-700 dark:text-gray-300">
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <motion.div
                    className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-700 relative"
                    initial={false}
                    animate={
                      reduced
                        ? {}
                        : isProcessing
                          ? {
                              backgroundColor: [
                                "rgb(209, 213, 219)",
                                "rgb(59, 130, 246)",
                                "rgb(34, 197, 94)",
                              ],
                            }
                          : {}
                    }
                    transition={
                      reduced
                        ? {}
                        : {
                            duration: 0.5,
                            repeat: isProcessing ? Infinity : 0,
                            ease: "easeInOut",
                          }
                    }
                  >
                    <AnimatePresence>
                      {stepPackets.map((packet) => (
                        <motion.div
                          key={packet.id}
                          className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${
                            packet.signalType === "LOG"
                              ? "bg-blue-500"
                              : packet.signalType === "METRIC"
                                ? "bg-green-500"
                                : "bg-purple-500"
                          }`}
                          initial={reduced ? false : { x: 0, opacity: 0 }}
                          animate={
                            reduced
                              ? {}
                              : {
                                  x: "100%",
                                  opacity: [0, 1, 1, 0],
                                }
                          }
                          exit={reduced ? {} : { opacity: 0 }}
                          transition={
                            reduced
                              ? {}
                              : {
                                  duration: 1,
                                  ease: "linear",
                                }
                          }
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex gap-4">
            <span>
              <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1" />
              Logs
            </span>
            <span>
              <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1" />
              Metrics
            </span>
            <span>
              <span className="inline-block w-3 h-3 rounded-full bg-purple-500 mr-1" />
              Traces
            </span>
          </div>
        </div>
      </div>
    </SpotlightTarget>
  );
}

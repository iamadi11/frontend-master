"use client";

import type { Timeline2DBlock } from "@/modules/theoryAnimations/schema";
import { motion } from "framer-motion";

interface Timeline2DBlockProps {
  block: Timeline2DBlock;
  currentStep: number;
  reduced: boolean;
}

export function Timeline2DBlock({
  block,
  currentStep,
  reduced,
}: Timeline2DBlockProps) {
  const lanes = ["default", "server", "client", "edge"] as const;

  return (
    <div className="w-full">
      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300 dark:bg-gray-700" />

        {/* Steps */}
        <div className="relative flex justify-between items-center py-8">
          {block.steps.map((step, index) => {
            const isActive = index === currentStep;
            const isPast = index < currentStep;
            const lane = step.lane || "default";
            const laneOffset = lanes.indexOf(lane) * 40 - 60;

            return (
              <div
                key={step.id}
                className="relative flex flex-col items-center"
                style={{ transform: `translateY(${laneOffset}px)` }}
              >
                {/* Step circle */}
                <motion.div
                  initial={reduced ? {} : false}
                  animate={
                    reduced
                      ? {}
                      : {
                          scale: isActive ? 1.2 : 1,
                          opacity: isActive || isPast ? 1 : 0.4,
                        }
                  }
                  transition={reduced ? {} : { duration: 0.3 }}
                  className={`
                    w-12 h-12 rounded-full border-4 flex items-center justify-center text-sm font-semibold
                    ${
                      isActive
                        ? "bg-blue-600 border-blue-600 text-white"
                        : isPast
                          ? "bg-blue-200 dark:bg-blue-900 border-blue-400 dark:border-blue-700 text-blue-900 dark:text-blue-100"
                          : "bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-gray-600 dark:text-gray-400"
                    }
                  `}
                >
                  {index + 1}
                </motion.div>

                {/* Step label */}
                <div
                  className={`
                    mt-2 text-xs text-center max-w-[100px]
                    ${
                      isActive
                        ? "font-semibold text-gray-900 dark:text-gray-100"
                        : "text-gray-600 dark:text-gray-400"
                    }
                  `}
                >
                  {step.label}
                </div>

                {/* Lane indicator */}
                {lane !== "default" && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-500 uppercase">
                    {lane}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current step description */}
      {block.steps[currentStep]?.description && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            {block.steps[currentStep].description}
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useMotionPrefs } from "@/components/motion/MotionPrefsProvider";
import type { Timeline2DSpec } from "@/modules/animatedExamples/specSchema";

interface Timeline2DExampleProps {
  spec: Timeline2DSpec;
  title: string;
  description: string;
  whatToNotice: string[];
  controls?: {
    mode: "stepper" | "toggle" | "play";
    initialStep?: number;
  };
}

export function Timeline2DExample({
  spec,
  title,
  description,
  whatToNotice,
  controls,
}: Timeline2DExampleProps) {
  const { reduced } = useMotionPrefs();
  const [currentStep, setCurrentStep] = useState(controls?.initialStep || 0);
  const mode = controls?.mode || "stepper";

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, spec.steps.length - 1));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const currentStepData = spec.steps[currentStep];

  return (
    <div className="w-full border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>

      {/* Controls */}
      {mode === "stepper" && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous step"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
            Step {currentStep + 1} of {spec.steps.length}
          </span>
          <button
            onClick={handleNext}
            disabled={currentStep === spec.steps.length - 1}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next step"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Visualization */}
      <div className="p-6 bg-white dark:bg-gray-900 min-h-[300px]">
        {/* Timeline with lanes */}
        <div className="relative">
          {/* Lane labels */}
          <div className="flex mb-4 gap-4">
            {spec.lanes.map((lane, index) => (
              <div
                key={lane}
                className="flex-1 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase"
              >
                {lane}
              </div>
            ))}
          </div>

          {/* Timeline line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300 dark:bg-gray-700" />

          {/* Steps */}
          <div className="relative flex justify-between items-center py-8">
            {spec.steps.map((step, index) => {
              const isActive = index === currentStep;
              const isPast = index < currentStep;

              // Find lane for this step (from highlights if available)
              const stepHighlight = currentStepData?.highlights?.find(
                (h) =>
                  h.nodeId === step.label.toLowerCase().replace(/\s+/g, "-")
              );
              const laneIndex = stepHighlight
                ? spec.lanes.indexOf(stepHighlight.lane)
                : 0;
              const laneOffset = (laneIndex - spec.lanes.length / 2 + 0.5) * 60;

              return (
                <div
                  key={index}
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
                </div>
              );
            })}
          </div>
        </div>

        {/* Current step explanation */}
        {currentStepData?.explanation && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              {currentStepData.explanation}
            </p>
          </div>
        )}
      </div>

      {/* What to Notice */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
          What to Notice
        </h4>
        <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
          {whatToNotice.map((notice, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>{notice}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

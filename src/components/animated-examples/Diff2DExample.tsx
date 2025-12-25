"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMotionPrefs } from "@/components/motion/MotionPrefsProvider";
import type { Diff2DSpec } from "@/modules/animatedExamples/specSchema";

interface Diff2DExampleProps {
  spec: Diff2DSpec;
  title: string;
  description: string;
  whatToNotice: string[];
  controls?: {
    mode: "stepper" | "toggle" | "play";
    toggleLabels?: string[];
  };
}

export function Diff2DExample({
  spec,
  title,
  description,
  whatToNotice,
  controls,
}: Diff2DExampleProps) {
  const { reduced } = useMotionPrefs();
  const [activeToggleIndex, setActiveToggleIndex] = useState(0);
  const activeToggle = spec.toggles[activeToggleIndex];

  const toggleLabels =
    controls?.toggleLabels || spec.toggles.map((t) => t.label);

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

      {/* Toggle controls */}
      {spec.toggles.length > 1 && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex flex-wrap gap-2">
          {toggleLabels.map((label, index) => (
            <button
              key={index}
              onClick={() => setActiveToggleIndex(index)}
              className={`px-3 py-1.5 text-sm border rounded transition-colors ${
                activeToggleIndex === index
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Visualization */}
      <div className="p-6 bg-white dark:bg-gray-900">
        <div className="grid grid-cols-2 gap-4">
          {/* Left side */}
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50 relative">
            <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
              {spec.leftTitle}
            </h4>

            {/* Highlight overlays */}
            {activeToggle.leftHighlights &&
              activeToggle.leftHighlights.length > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                  {activeToggle.leftHighlights.map((highlight, i) => (
                    <motion.div
                      key={i}
                      initial={reduced ? {} : { opacity: 0 }}
                      animate={reduced ? {} : { opacity: 0.3 }}
                      transition={reduced ? {} : { duration: 0.3 }}
                      className="absolute bg-yellow-400 dark:bg-yellow-600 border-2 border-yellow-500 dark:border-yellow-400 rounded"
                      style={{
                        left: `${(highlight.x / 800) * 100}%`,
                        top: `${(highlight.y / 400) * 100}%`,
                        width: `${(highlight.width / 800) * 100}%`,
                        height: `${(highlight.height / 400) * 100}%`,
                      }}
                    />
                  ))}
                </div>
              )}

            <div className="text-sm text-gray-700 dark:text-gray-300">
              {/* Content would be rendered here based on spec - simplified for now */}
              <p className="p-2">Left side content</p>
            </div>
          </div>

          {/* Right side */}
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50 relative">
            <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
              {spec.rightTitle}
            </h4>

            {/* Highlight overlays */}
            {activeToggle.rightHighlights &&
              activeToggle.rightHighlights.length > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                  {activeToggle.rightHighlights.map((highlight, i) => (
                    <motion.div
                      key={i}
                      initial={reduced ? {} : { opacity: 0 }}
                      animate={reduced ? {} : { opacity: 0.3 }}
                      transition={reduced ? {} : { duration: 0.3 }}
                      className="absolute bg-green-400 dark:bg-green-600 border-2 border-green-500 dark:border-green-400 rounded"
                      style={{
                        left: `${(highlight.x / 800) * 100}%`,
                        top: `${(highlight.y / 400) * 100}%`,
                        width: `${(highlight.width / 800) * 100}%`,
                        height: `${(highlight.height / 400) * 100}%`,
                      }}
                    />
                  ))}
                </div>
              )}

            <div className="text-sm text-gray-700 dark:text-gray-300">
              {/* Content would be rendered here based on spec - simplified for now */}
              <p className="p-2">Right side content</p>
            </div>
          </div>
        </div>

        {/* Toggle explanation */}
        {activeToggle.explanation && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              {activeToggle.explanation}
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

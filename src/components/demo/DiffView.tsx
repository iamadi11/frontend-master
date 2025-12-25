"use client";

import { useMotionPrefs } from "../motion/MotionPrefsProvider";
import { motion, AnimatePresence } from "framer-motion";

interface DiffViewProps {
  htmlPreview: string;
  domPreview: string;
  highlightedLines?: number[]; // line numbers to highlight
}

export function DiffView({
  htmlPreview,
  domPreview,
  highlightedLines = [],
}: DiffViewProps) {
  const { reduced } = useMotionPrefs();

  const htmlLines = htmlPreview.split("\n");
  const domLines = domPreview.split("\n");

  const renderCodeBlock = (
    title: string,
    lines: string[],
    side: "left" | "right"
  ) => (
    <div className="flex-1">
      <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
        {title}
      </h4>
      <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-auto max-h-64">
        <pre className="text-xs font-mono">
          {lines.map((line, index) => {
            const isHighlighted = highlightedLines.includes(index + 1);
            return (
              <motion.div
                key={index}
                initial={
                  reduced || !isHighlighted
                    ? false
                    : { backgroundColor: "rgba(59, 130, 246, 0)" }
                }
                animate={
                  reduced || !isHighlighted
                    ? {}
                    : {
                        backgroundColor: [
                          "rgba(59, 130, 246, 0)",
                          "rgba(59, 130, 246, 0.3)",
                          "rgba(59, 130, 246, 0)",
                        ],
                      }
                }
                transition={
                  reduced || !isHighlighted
                    ? {}
                    : {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                }
                className={`${
                  isHighlighted ? "bg-blue-500/30 dark:bg-blue-400/30" : ""
                } px-2 py-0.5 rounded`}
              >
                <span className="text-gray-400 select-none mr-2">
                  {String(index + 1).padStart(3, " ")}
                </span>
                <span
                  className={
                    isHighlighted
                      ? "text-blue-300 dark:text-blue-200"
                      : "text-gray-300"
                  }
                >
                  {line || " "}
                </span>
              </motion.div>
            );
          })}
        </pre>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        {renderCodeBlock("View Source (HTML)", htmlLines, "left")}
        {renderCodeBlock("After Hydration (DOM)", domLines, "right")}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Highlighted lines appear during hydration/streaming
      </div>
    </div>
  );
}

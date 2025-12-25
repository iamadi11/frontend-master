"use client";

import { useMotionPrefs } from "../motion/MotionPrefsProvider";
import { motion } from "framer-motion";
import type { TokenSet } from "./demoSchema";

interface TokenDiffProps {
  oldTokens: TokenSet;
  newTokens: TokenSet;
  highlightPaths?: string[]; // e.g., ["color.accent", "radius.md"]
}

export function TokenDiff({
  oldTokens,
  newTokens,
  highlightPaths = [],
}: TokenDiffProps) {
  const { reduced } = useMotionPrefs();

  const getNestedValue = (
    obj: Record<string, unknown>,
    path: string
  ): string => {
    try {
      const value = path
        .split(".")
        .reduce(
          (curr: unknown, key: string) =>
            curr && typeof curr === "object" && key in curr
              ? (curr as Record<string, unknown>)[key]
              : undefined,
          obj
        );
      return value != null ? String(value) : "";
    } catch {
      return "";
    }
  };

  const renderTokenSection = (
    title: string,
    paths: string[],
    category: keyof TokenSet["tokens"]
  ) => {
    if (paths.length === 0) return null;

    return (
      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
          {title}
        </h5>
        <div className="space-y-1">
          {paths.map((path) => {
            const oldValue = getNestedValue(oldTokens.tokens, path);
            const newValue = getNestedValue(newTokens.tokens, path);
            const isChanged = oldValue !== newValue;
            const isHighlighted = highlightPaths.includes(path);

            return (
              <motion.div
                key={path}
                initial={
                  reduced || !isHighlighted
                    ? false
                    : { backgroundColor: "rgba(250, 204, 21, 0)" }
                }
                animate={
                  reduced || !isHighlighted
                    ? {}
                    : {
                        backgroundColor: [
                          "rgba(250, 204, 21, 0)",
                          "rgba(250, 204, 21, 0.2)",
                          "rgba(250, 204, 21, 0)",
                        ],
                      }
                }
                transition={
                  reduced || !isHighlighted
                    ? {}
                    : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                }
                className={`p-2 rounded border ${
                  isChanged
                    ? "border-yellow-400 dark:border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-gray-600 dark:text-gray-400">
                    {path}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono ${
                        isChanged
                          ? "text-red-600 dark:text-red-400 line-through"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {oldValue}
                    </span>
                    {isChanged && (
                      <motion.span
                        initial={reduced ? false : { opacity: 0, x: -8 }}
                        animate={reduced ? {} : { opacity: 1, x: 0 }}
                        transition={reduced ? {} : { duration: 0.3 }}
                        className="font-mono text-green-600 dark:text-green-400 font-semibold"
                      >
                        → {newValue}
                      </motion.span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const allPaths: string[] = [];
  Object.keys(oldTokens.tokens).forEach((category) => {
    const categoryObj = oldTokens.tokens[category as keyof TokenSet["tokens"]];
    if (typeof categoryObj === "object" && categoryObj !== null) {
      Object.keys(categoryObj).forEach((key) => {
        const value = (categoryObj as Record<string, unknown>)[key];
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          Object.keys(value).forEach((nestedKey) => {
            allPaths.push(`${category}.${key}.${nestedKey}`);
          });
        } else {
          allPaths.push(`${category}.${key}`);
        }
      });
    }
  });

  const changedPaths = allPaths.filter(
    (path) =>
      getNestedValue(oldTokens.tokens, path) !==
      getNestedValue(newTokens.tokens, path)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Token Changes
        </h4>
        {changedPaths.length > 0 && (
          <span className="text-xs text-yellow-600 dark:text-yellow-400">
            {changedPaths.length} changed
          </span>
        )}
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {renderTokenSection(
          "Colors",
          changedPaths.filter((p) => p.startsWith("color")),
          "color"
        )}
        {renderTokenSection(
          "Radius",
          changedPaths.filter((p) => p.startsWith("radius")),
          "radius"
        )}
        {renderTokenSection(
          "Spacing",
          changedPaths.filter((p) => p.startsWith("space")),
          "space"
        )}
        {renderTokenSection(
          "Font",
          changedPaths.filter((p) => p.startsWith("font")),
          "font"
        )}
        {changedPaths.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">
            No token changes
          </p>
        )}
      </div>
    </div>
  );
}

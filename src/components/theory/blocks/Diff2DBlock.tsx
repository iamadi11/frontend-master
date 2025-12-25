"use client";

import type { Diff2DBlock } from "@/modules/theoryAnimations/schema";

interface Diff2DBlockProps {
  block: Diff2DBlock;
  reduced: boolean;
}

export function Diff2DBlock({ block, reduced }: Diff2DBlockProps) {
  const getHighlightClass = (itemIndex: number, side: "before" | "after") => {
    const highlight = block.highlights?.find(
      (h) => h.side === side && h.itemIndex === itemIndex
    );
    if (!highlight) return "";

    switch (highlight.type) {
      case "added":
        return "bg-green-100 dark:bg-green-900 border-green-500 dark:border-green-400";
      case "removed":
        return "bg-red-100 dark:bg-red-900 border-red-500 dark:border-red-400 line-through";
      case "changed":
        return "bg-yellow-100 dark:bg-yellow-900 border-yellow-500 dark:border-yellow-400";
      default:
        return "";
    }
  };

  return (
    <div className="w-full grid grid-cols-2 gap-4">
      {/* Before */}
      <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
        <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
          {block.before.title}
        </h4>
        <ul className="space-y-2">
          {block.before.items.map((item, index) => (
            <li
              key={index}
              className={`
                p-2 rounded border
                ${getHighlightClass(index, "before")}
                ${!getHighlightClass(index, "before") ? "border-transparent" : ""}
                text-sm text-gray-700 dark:text-gray-300
              `}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* After */}
      <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
        <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
          {block.after.title}
        </h4>
        <ul className="space-y-2">
          {block.after.items.map((item, index) => (
            <li
              key={index}
              className={`
                p-2 rounded border
                ${getHighlightClass(index, "after")}
                ${!getHighlightClass(index, "after") ? "border-transparent" : ""}
                text-sm text-gray-700 dark:text-gray-300
              `}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

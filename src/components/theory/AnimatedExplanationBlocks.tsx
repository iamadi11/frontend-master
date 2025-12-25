"use client";

import { parseTheoryAnimations } from "@/modules/theoryAnimations/schema";
import { AnimatedExplanationBlock } from "./AnimatedExplanationBlock";

interface AnimatedExplanationBlocksProps {
  blocks: unknown;
  onPracticeLink?: (anchor: string) => void;
}

export function AnimatedExplanationBlocks({
  blocks,
  onPracticeLink,
}: AnimatedExplanationBlocksProps) {
  const parseResult = parseTheoryAnimations(blocks);

  if (!parseResult.success) {
    if (process.env.NODE_ENV === "development") {
      return (
        <div className="my-4 p-3 border border-yellow-300 dark:border-yellow-700 rounded bg-yellow-50 dark:bg-yellow-900/20 text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Invalid animation blocks:</strong> {parseResult.error}
        </div>
      );
    }
    // In production, silently skip invalid blocks
    return null;
  }

  if (parseResult.data.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {parseResult.data.map((block, index) => (
        <AnimatedExplanationBlock
          key={block.id || `block-${index}`}
          block={block}
          onPracticeLink={onPracticeLink}
        />
      ))}
    </div>
  );
}

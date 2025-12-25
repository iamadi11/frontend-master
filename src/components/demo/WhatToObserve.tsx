"use client";

import type { Topic } from "@/lib/types";

interface WhatToObserveProps {
  topic: Topic;
  currentStep?: number;
}

export function WhatToObserve({ topic, currentStep = 0 }: WhatToObserveProps) {
  // Try to get whatToObserve from practice steps
  const stepFocusTarget = topic.practiceSteps?.[currentStep]?.focusTarget;

  // Try to get whatToNotice from theory animation blocks
  const theoryBlocks = Array.isArray(topic.theoryAnimations)
    ? topic.theoryAnimations
    : [];

  // Find blocks that link to practice
  const linkedBlocks = theoryBlocks.filter(
    (block: any) => block.linkedPracticeAnchor
  );

  // Extract whatToNotice from linked blocks
  const theoryNotices: string[] = [];
  linkedBlocks.forEach((block: any) => {
    if (Array.isArray(block.whatToNotice)) {
      theoryNotices.push(...block.whatToNotice);
    }
  });

  // Combine sources
  const notices: string[] = [];

  if (stepFocusTarget) {
    notices.push(`Focus on: ${stepFocusTarget}`);
  }

  if (theoryNotices.length > 0) {
    notices.push(...theoryNotices);
  }

  // Fallback generic notices if nothing specific found
  if (notices.length === 0) {
    notices.push(
      "Watch how state changes affect the visualization",
      "Check the Event Log for causal explanations",
      "Observe the relationship between controls and outcomes"
    );
  }

  if (notices.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
      {notices.map((notice, index) => (
        <li key={index} className="flex items-start gap-2">
          <span className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0">
            •
          </span>
          <span>{notice}</span>
        </li>
      ))}
    </ul>
  );
}

"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Play, RotateCcw } from "lucide-react";
import { useMotionPrefs } from "@/components/motion/MotionPrefsProvider";
import type { TheoryAnimationBlock } from "@/modules/theoryAnimations/schema";
import { Timeline2DBlock } from "./blocks/Timeline2DBlock";
import { Flow2DBlock } from "./blocks/Flow2DBlock";
import { Diff2DBlock } from "./blocks/Diff2DBlock";

interface AnimatedExplanationBlockProps {
  block: TheoryAnimationBlock;
}

export function AnimatedExplanationBlock({
  block,
}: AnimatedExplanationBlockProps) {
  const { reduced } = useMotionPrefs();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleNext = () => {
    if (block.kind === "timeline2d") {
      setCurrentStep((prev) => Math.min(prev + 1, block.steps.length - 1));
    }
  };

  const handlePrev = () => {
    if (block.kind === "timeline2d") {
      setCurrentStep((prev) => Math.max(prev - 1, 0));
    }
  };

  const handlePlay = () => {
    if (block.kind === "timeline2d") {
      setIsPlaying(true);
      let step = 0;
      const interval = setInterval(() => {
        step++;
        if (step >= block.steps.length) {
          clearInterval(interval);
          setIsPlaying(false);
          return;
        }
        setCurrentStep(step);
      }, 1000);
      return () => clearInterval(interval);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const renderVisualization = () => {
    switch (block.kind) {
      case "timeline2d":
        return (
          <Timeline2DBlock
            block={block}
            currentStep={currentStep}
            reduced={reduced}
          />
        );
      case "flow2d":
        return <Flow2DBlock block={block} reduced={reduced} />;
      case "diff2d":
        return <Diff2DBlock block={block} reduced={reduced} />;
      default:
        return (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            Unknown block type
          </div>
        );
    }
  };

  const canStep = block.kind === "timeline2d";
  const canPlay = block.kind === "timeline2d" && block.steps.length > 1;
  const canToggle = block.kind === "flow2d" || block.kind === "diff2d";

  return (
    <div className="my-8 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <h3 className="text-lg font-semibold mb-1">{block.title}</h3>
        {block.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {block.description}
          </p>
        )}
      </div>

      {/* Controls */}
      {canStep && (
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
            Step {currentStep + 1} of {block.steps.length}
          </span>
          <button
            onClick={handleNext}
            disabled={currentStep === block.steps.length - 1}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next step"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {canPlay && (
            <>
              <div className="flex-1" />
              <button
                onClick={handlePlay}
                disabled={isPlaying}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                aria-label="Play animation"
              >
                <Play className="w-4 h-4" />
                Play
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Visualization */}
      <div className="p-6 bg-white dark:bg-gray-900 min-h-[200px] flex items-center justify-center">
        {renderVisualization()}
      </div>

      {/* What to Notice */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
          What to Notice
        </h4>
        <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
          {block.whatToNotice.map((notice, i) => (
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

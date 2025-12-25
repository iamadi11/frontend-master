"use client";

import { useState } from "react";
import type { Three3DBlock } from "@/modules/theoryAnimations/schema";
import { Fallback2D } from "@/components/three/Fallback2D";

interface Three3DBlockProps {
  block: Three3DBlock;
  reduced: boolean;
}

export function Three3DBlock({ block, reduced }: Three3DBlockProps) {
  const [error, setError] = useState<string | null>(null);
  const [currentPreset, setCurrentPreset] = useState(0);

  // Try to dynamically import the scene component
  // For now, show fallback since we don't have a mapping system
  // This would need to be expanded to map sceneComponent names to actual components

  if (error || reduced) {
    return (
      <div className="w-full p-8 text-center border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900/50">
        <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
          {block.title}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          3D visualization unavailable. This concept is better understood
          through the 2D diagrams above.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Camera preset buttons */}
      {block.cameraPresets && block.cameraPresets.length > 0 && (
        <div className="mb-4 flex gap-2 justify-center">
          {block.cameraPresets.map((preset, index) => (
            <button
              key={index}
              onClick={() => setCurrentPreset(index)}
              className={`px-3 py-1 text-sm rounded border transition-colors ${
                currentPreset === index
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}

      {/* 3D Scene placeholder */}
      <div className="w-full h-96 bg-gray-100 dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-700 flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm mb-2">3D Scene: {block.sceneComponent}</p>
          <p className="text-xs">
            Scene component mapping not yet implemented. Use 2D blocks for now.
          </p>
        </div>
      </div>
    </div>
  );
}

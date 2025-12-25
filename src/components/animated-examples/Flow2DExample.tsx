"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMotionPrefs } from "@/components/motion/MotionPrefsProvider";
import type { Flow2DSpec } from "@/modules/animatedExamples/specSchema";

interface Flow2DExampleProps {
  spec: Flow2DSpec;
  title: string;
  description: string;
  whatToNotice: string[];
  controls?: {
    mode: "stepper" | "toggle" | "play";
    initialStep?: number;
  };
}

export function Flow2DExample({
  spec,
  title,
  description,
  whatToNotice,
  controls,
}: Flow2DExampleProps) {
  const { reduced } = useMotionPrefs();
  const mode = controls?.mode || "stepper";

  // If steps are defined, use stepper mode; otherwise allow click interaction
  const hasSteps = spec.steps && spec.steps.length > 0;
  const [currentStep, setCurrentStep] = useState(controls?.initialStep || 0);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(
    spec.nodes[0]?.id || null
  );

  const currentStepData = hasSteps ? spec.steps?.[currentStep] : null;
  const activeNodes =
    currentStepData?.activeNodes || (activeNodeId ? [activeNodeId] : []);
  const activeEdges = currentStepData?.activeEdges || [];

  // Calculate bounds for viewBox
  const maxX = Math.max(...spec.nodes.map((n) => n.x), 100);
  const maxY = Math.max(...spec.nodes.map((n) => n.y), 100);
  const viewBox = `0 0 ${maxX + 100} ${maxY + 100}`;

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

      {/* Visualization */}
      <div className="p-6 bg-white dark:bg-gray-900 min-h-[400px] flex items-center justify-center">
        <svg
          viewBox={viewBox}
          className="w-full h-auto"
          style={{ maxHeight: "500px" }}
        >
          {/* Arrow marker */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#9ca3af" />
            </marker>
            <marker
              id="arrowhead-active"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
            </marker>
          </defs>

          {/* Edges */}
          {spec.edges.map((edge) => {
            const fromNode = spec.nodes.find((n) => n.id === edge.from);
            const toNode = spec.nodes.find((n) => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            const isActive =
              activeEdges.includes(edge.id) ||
              (activeNodes.includes(edge.from) &&
                activeNodes.includes(edge.to));

            return (
              <g key={edge.id}>
                <motion.line
                  initial={reduced ? {} : { pathLength: 0 }}
                  animate={
                    reduced
                      ? {}
                      : {
                          pathLength: isActive ? 1 : 0.3,
                          opacity: isActive ? 1 : 0.3,
                        }
                  }
                  transition={reduced ? {} : { duration: 0.5 }}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={isActive ? "#3b82f6" : "#9ca3af"}
                  strokeWidth={isActive ? 3 : 1}
                  markerEnd={
                    isActive ? "url(#arrowhead-active)" : "url(#arrowhead)"
                  }
                />
              </g>
            );
          })}

          {/* Nodes */}
          {spec.nodes.map((node) => {
            const isActive = activeNodes.includes(node.id);
            const groupColor = node.group
              ? `hsl(${(node.group.charCodeAt(0) * 137.5) % 360}, 70%, 80%)`
              : undefined;

            return (
              <g key={node.id}>
                <motion.circle
                  initial={reduced ? {} : false}
                  animate={
                    reduced
                      ? {}
                      : {
                          scale: isActive ? 1.2 : 1,
                          opacity: isActive ? 1 : 0.6,
                        }
                  }
                  transition={reduced ? {} : { duration: 0.3 }}
                  cx={node.x}
                  cy={node.y}
                  r={isActive ? 35 : 30}
                  fill={groupColor || (isActive ? "#3b82f6" : "#e5e7eb")}
                  stroke={isActive ? "#3b82f6" : "#9ca3af"}
                  strokeWidth={isActive ? 4 : 2}
                  className={
                    isActive ? "ring-4 ring-blue-400 dark:ring-blue-600" : ""
                  }
                  onClick={() => {
                    if (!hasSteps) setActiveNodeId(node.id);
                  }}
                  style={{ cursor: hasSteps ? "default" : "pointer" }}
                />
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`text-sm font-semibold pointer-events-none ${
                    isActive ? "fill-white" : "fill-gray-900 dark:fill-gray-100"
                  }`}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Step explanation (if stepper mode with steps) */}
      {hasSteps && currentStepData?.explanation && (
        <div className="px-6 pb-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              {currentStepData.explanation}
            </p>
          </div>
        </div>
      )}

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

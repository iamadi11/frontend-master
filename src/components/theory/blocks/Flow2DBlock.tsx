"use client";

import { useState } from "react";
import type { Flow2DBlock } from "@/modules/theoryAnimations/schema";
import { motion, AnimatePresence } from "framer-motion";

interface Flow2DBlockProps {
  block: Flow2DBlock;
  reduced: boolean;
}

export function Flow2DBlock({ block, reduced }: Flow2DBlockProps) {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(
    block.defaultState?.activeNodeId || block.nodes[0]?.id || null
  );

  const getNodeTypeStyles = (type?: string) => {
    switch (type) {
      case "source":
        return "bg-green-100 dark:bg-green-900 border-green-500 dark:border-green-400";
      case "sink":
        return "bg-red-100 dark:bg-red-900 border-red-500 dark:border-red-400";
      case "process":
        return "bg-blue-100 dark:bg-blue-900 border-blue-500 dark:border-blue-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 border-gray-400 dark:border-gray-600";
    }
  };

  return (
    <div className="w-full">
      <svg
        viewBox="0 0 800 400"
        className="w-full h-auto"
        style={{ maxHeight: "400px" }}
      >
        {/* Edges */}
        {block.edges.map((edge, index) => {
          const fromNode = block.nodes.find((n) => n.id === edge.from);
          const toNode = block.nodes.find((n) => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          // Simple positioning (grid-based for now)
          const fromIndex = block.nodes.indexOf(fromNode);
          const toIndex = block.nodes.indexOf(toNode);
          const fromX = 100 + (fromIndex % 4) * 150;
          const fromY = 100 + Math.floor(fromIndex / 4) * 150;
          const toX = 100 + (toIndex % 4) * 150;
          const toY = 100 + Math.floor(toIndex / 4) * 150;

          const isActive =
            activeNodeId === edge.from || activeNodeId === edge.to;

          return (
            <g key={`edge-${index}`}>
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
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                stroke={isActive ? "#3b82f6" : "#9ca3af"}
                strokeWidth={isActive ? 3 : 1}
                markerEnd="url(#arrowhead)"
              />
              {edge.label && (
                <text
                  x={(fromX + toX) / 2}
                  y={(fromY + toY) / 2 - 5}
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                  textAnchor="middle"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

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
        </defs>

        {/* Nodes */}
        {block.nodes.map((node, index) => {
          const x = 100 + (index % 4) * 150;
          const y = 100 + Math.floor(index / 4) * 150;
          const isActive = activeNodeId === node.id;

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
                cx={x}
                cy={y}
                r={isActive ? 35 : 30}
                className={`
                  ${getNodeTypeStyles(node.type)}
                  ${isActive ? "ring-4 ring-blue-400 dark:ring-blue-600" : ""}
                `}
                fill="currentColor"
                stroke="currentColor"
                strokeWidth={2}
                onClick={() => setActiveNodeId(node.id)}
                style={{ cursor: "pointer" }}
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-sm font-semibold fill-gray-900 dark:fill-gray-100 pointer-events-none"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

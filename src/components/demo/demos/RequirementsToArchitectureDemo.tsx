"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useMotionPrefs } from "../../motion/MotionPrefsProvider";
import { motion, AnimatePresence } from "framer-motion";
import { DemoShell } from "../DemoShell";
import { EventLog, EventLogEntry } from "../EventLog";
import { Spotlight, SpotlightTarget } from "../Spotlight";
import {
  requirementsToArchitectureConfigSchema,
  type RequirementsToArchitectureConfig,
} from "../demoSchema";
import { ThreeCanvasShell } from "../../three/ThreeCanvasShell";
import { ArchitectureGraphScene } from "../../three/ArchitectureGraphScene";
import { Fallback2D } from "../../three/Fallback2D";
import type { GraphNode, GraphEdge } from "../../three/types";

interface RequirementsToArchitectureDemoProps {
  demoConfig: unknown;
  focusTarget?: string | null;
}

const NODE_IDS = [
  "rendering-strategy",
  "data-caching",
  "state-approach",
  "delivery-cdn",
  "observability",
  "security-baseline",
] as const;

type NodeId = (typeof NODE_IDS)[number];

interface NodeState {
  id: NodeId;
  label: string;
  decision: string;
  reasoning: string;
  highlighted: boolean;
}

export function RequirementsToArchitectureDemo({
  demoConfig,
  focusTarget,
}: RequirementsToArchitectureDemoProps) {
  const { reduced } = useMotionPrefs();
  const [constraints, setConstraints] = useState<Record<string, string>>({});
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [showPreviousState, setShowPreviousState] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [changedNodeIds, setChangedNodeIds] = useState<string[]>([]);
  const previousNodeStatesRef = useRef<NodeState[]>([]);

  // Validate and parse demo config
  const config = useMemo(() => {
    try {
      // If demoType is missing but we have the right structure, add it
      const configToValidate = demoConfig as any;
      if (configToValidate && !configToValidate.demoType) {
        configToValidate.demoType = "requirementsToArchitecture";
      }
      return requirementsToArchitectureConfigSchema.parse(configToValidate);
    } catch (error) {
      console.error("Invalid demo config:", error);
      return null;
    }
  }, [demoConfig]);

  // Initialize constraints with defaults
  useMemo(() => {
    if (!config) return;
    const initial: Record<string, string> = {};
    config.constraints.forEach((c) => {
      initial[c.id] = constraints[c.id] ?? c.defaultValue;
    });
    if (Object.keys(constraints).length === 0) {
      setConstraints(initial);
    }
  }, [config, constraints]);

  // Compute node states based on constraints and rules
  const nodeStates = useMemo((): NodeState[] => {
    if (!config) return [];

    const nodes: NodeState[] = config.nodes.map((node) => ({
      id: node.id as NodeId,
      label: node.label,
      decision: "Not determined",
      reasoning: "Adjust constraints to see decisions",
      highlighted: false,
    }));

    // Apply rules based on current constraints
    const affectedNodes = new Set<string>();
    config.rules.forEach((rule) => {
      const constraintValue = constraints[rule.constraintId];
      if (constraintValue === rule.constraintValue) {
        rule.affectedNodes.forEach((nodeId) => {
          affectedNodes.add(nodeId);
          const node = nodes.find((n) => n.id === nodeId);
          if (node) {
            node.decision = rule.decision;
            node.reasoning = rule.explanation;
            node.highlighted = true;
          }
        });
      }
    });

    return nodes;
  }, [config, constraints]);

  // Track changed nodes for 3D animation
  useEffect(() => {
    if (previousNodeStatesRef.current.length === 0) {
      previousNodeStatesRef.current = nodeStates;
      return;
    }

    const changed: string[] = [];
    nodeStates.forEach((node) => {
      const prev = previousNodeStatesRef.current.find((n) => n.id === node.id);
      if (prev && prev.decision !== node.decision) {
        changed.push(node.id);
      }
    });

    if (changed.length > 0) {
      setChangedNodeIds(changed);
      // Clear after animation completes
      setTimeout(() => setChangedNodeIds([]), 2000);
    }

    previousNodeStatesRef.current = nodeStates;
  }, [nodeStates]);

  // Convert to 3D graph format
  const graphNodes: GraphNode[] = useMemo(() => {
    return nodeStates.map((node) => ({
      id: node.id,
      label: node.label,
      decision: node.decision,
      reasoning: node.reasoning,
      highlighted: node.highlighted,
    }));
  }, [nodeStates]);

  const graphEdges: GraphEdge[] = useMemo(() => {
    if (!config) return [];
    const edges: GraphEdge[] = [];
    const edgeSet = new Set<string>();

    // Create edges between nodes that are affected by the same constraint
    config.rules.forEach((rule) => {
      const constraintValue = constraints[rule.constraintId];
      if (
        constraintValue === rule.constraintValue &&
        rule.affectedNodes.length > 1
      ) {
        // Connect all affected nodes in a chain (simplified: connect each to the next)
        for (let i = 0; i < rule.affectedNodes.length - 1; i++) {
          const from = rule.affectedNodes[i];
          const to = rule.affectedNodes[i + 1];
          const key = `${from}-${to}`;
          const reverseKey = `${to}-${from}`;

          // Avoid duplicate edges
          if (!edgeSet.has(key) && !edgeSet.has(reverseKey)) {
            edgeSet.add(key);
            edges.push({
              from,
              to,
              constraintId: rule.constraintId,
            });
          }
        }
      }
    });
    return edges;
  }, [config, constraints]);

  // Map focusTarget to node IDs (e.g., "graph.rendering-strategy" -> "rendering-strategy")
  const focusedNodeIds = useMemo(() => {
    if (!focusTarget) return [];
    const match = focusTarget.match(/graph\.(.+)/);
    if (match) {
      return [match[1]];
    }
    // Also check if focusTarget matches a node ID directly
    if (nodeStates.some((n) => n.id === focusTarget)) {
      return [focusTarget];
    }
    return [];
  }, [focusTarget, nodeStates]);

  const handleConstraintChange = useCallback(
    (constraintId: string, value: string) => {
      const oldValue = constraints[constraintId];
      if (oldValue === value) return;

      setConstraints((prev) => ({ ...prev, [constraintId]: value }));

      // Find the rule that applies
      if (!config) return;
      const rule = config.rules.find(
        (r) => r.constraintId === constraintId && r.constraintValue === value
      );

      if (rule) {
        const constraint = config.constraints.find(
          (c) => c.id === constraintId
        );
        const cause = constraint
          ? `${constraint.label}: ${value}`
          : `Constraint changed: ${value}`;

        const newEntry: EventLogEntry = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          cause,
          decision: rule.decision,
          explanation: rule.explanation,
        };

        setEventLog((prev) => [...prev, newEntry]);
      }
    },
    [constraints, config]
  );

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(selectedNodeId === nodeId ? null : nodeId);
    },
    [selectedNodeId]
  );

  if (!config) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <p>Demo unavailable: Invalid configuration</p>
      </div>
    );
  }

  const controls = (
    <div className="space-y-4">
      {config.constraints.map((constraint) => (
        <div key={constraint.id} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {constraint.label}
          </label>
          {constraint.type === "select" && constraint.options ? (
            <select
              value={constraints[constraint.id] ?? constraint.defaultValue}
              onChange={(e) =>
                handleConstraintChange(constraint.id, e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {constraint.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={
                  (constraints[constraint.id] ?? constraint.defaultValue) ===
                  "true"
                }
                onChange={(e) =>
                  handleConstraintChange(
                    constraint.id,
                    e.target.checked ? "true" : "false"
                  )
                }
                className="rounded border-gray-300 dark:border-gray-700"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Enabled
              </span>
            </label>
          )}
        </div>
      ))}
    </div>
  );

  const visualization2D = (
    <Spotlight targetId={focusTarget || null}>
      <div className="grid grid-cols-2 gap-4">
        {nodeStates.map((node) => (
          <SpotlightTarget
            key={node.id}
            id={node.id}
            className={`p-4 rounded-lg border-2 transition-all ${
              node.highlighted
                ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            }`}
          >
            <motion.div
              initial={false}
              animate={
                reduced ? {} : node.highlighted ? { scale: [1, 1.02, 1] } : {}
              }
              transition={reduced ? {} : { duration: 0.4 }}
            >
              <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-gray-100">
                {node.label}
              </h4>
              <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                {node.decision}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {node.reasoning}
              </p>
            </motion.div>
          </SpotlightTarget>
        ))}
      </div>
    </Spotlight>
  );

  const visualization3D = (
    <div className="relative min-h-[400px] bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
      <ThreeCanvasShell
        className="w-full h-full min-h-[400px]"
        fallback={
          <Fallback2D message="3D unavailable; showing 2D.">
            {visualization2D}
          </Fallback2D>
        }
      >
        <ArchitectureGraphScene
          nodes={graphNodes}
          edges={graphEdges}
          changedNodeIds={changedNodeIds}
          focusedNodeIds={focusedNodeIds}
          showPreviousState={showPreviousState}
          onNodeClick={handleNodeClick}
        />
      </ThreeCanvasShell>

      {/* View mode toggle */}
      <div className="absolute top-2 right-2 flex gap-2 z-10">
        <button
          onClick={() => setViewMode("2d")}
          className={`px-3 py-1 text-xs rounded border ${
            viewMode === "2d"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"
          }`}
        >
          2D
        </button>
        <button
          onClick={() => setViewMode("3d")}
          className={`px-3 py-1 text-xs rounded border ${
            viewMode === "3d"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"
          }`}
        >
          3D
        </button>
      </div>

      {/* Show previous state toggle (3D only) */}
      {viewMode === "3d" && (
        <div className="absolute top-2 left-2 z-10">
          <label className="flex items-center gap-2 px-3 py-1 text-xs bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showPreviousState}
              onChange={(e) => setShowPreviousState(e.target.checked)}
              className="rounded"
            />
            <span className="text-gray-700 dark:text-gray-300">
              Show previous state
            </span>
          </label>
        </div>
      )}

      {/* Node details side panel */}
      {selectedNodeId && (
        <div className="absolute top-12 right-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-10 max-h-96 overflow-y-auto">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              {nodeStates.find((n) => n.id === selectedNodeId)?.label}
            </h4>
            <button
              onClick={() => setSelectedNodeId(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Decision:
              </span>
              <p className="text-green-600 dark:text-green-400 mt-1">
                {nodeStates.find((n) => n.id === selectedNodeId)?.decision}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Reasoning:
              </span>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {nodeStates.find((n) => n.id === selectedNodeId)?.reasoning}
              </p>
            </div>
            {config && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Affected by:
                </span>
                <ul className="mt-1 space-y-1">
                  {config.rules
                    .filter((r) => r.affectedNodes.includes(selectedNodeId))
                    .map((rule, i) => {
                      const constraint = config.constraints.find(
                        (c) => c.id === rule.constraintId
                      );
                      return (
                        <li
                          key={i}
                          className="text-gray-600 dark:text-gray-400"
                        >
                          {constraint?.label || rule.constraintId}:{" "}
                          {rule.constraintValue}
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const visualization = viewMode === "3d" ? visualization3D : visualization2D;

  return (
    <DemoShell
      controls={controls}
      visualization={visualization}
      eventLog={<EventLog entries={eventLog} />}
    />
  );
}

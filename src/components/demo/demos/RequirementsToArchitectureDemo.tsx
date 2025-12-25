"use client";

import { useState, useMemo, useCallback } from "react";
import { useMotionPrefs } from "../../motion/MotionPrefsProvider";
import { motion, AnimatePresence } from "framer-motion";
import { DemoShell } from "../DemoShell";
import { EventLog, EventLogEntry } from "../EventLog";
import { Spotlight, SpotlightTarget } from "../Spotlight";
import {
  requirementsToArchitectureConfigSchema,
  type RequirementsToArchitectureConfig,
} from "../demoSchema";

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

  const visualization = (
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

  return (
    <DemoShell
      controls={controls}
      visualization={visualization}
      eventLog={<EventLog entries={eventLog} />}
    />
  );
}

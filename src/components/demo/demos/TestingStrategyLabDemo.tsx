"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useMotionPrefs } from "../../motion/MotionPrefsProvider";
import { motion, AnimatePresence } from "framer-motion";
import { DemoShell } from "../DemoShell";
import { EventLog, EventLogEntry } from "../EventLog";
import { Spotlight, SpotlightTarget } from "../Spotlight";
import {
  testingStrategyLabConfigSchema,
  type TestingStrategyLabConfig,
} from "../demoSchema";
import { ThreeCanvasShell } from "../../three/ThreeCanvasShell";
import { TestingLabScene } from "../../three/TestingLabScene";
import { Fallback2D } from "../../three/Fallback2D";

interface TestingStrategyLabDemoProps {
  demoConfig: unknown;
  focusTarget?: string | null;
}

type Mode = "PYRAMID" | "CONTRACT" | "VISUAL";
type TeamSize = "SMALL" | "MEDIUM" | "LARGE";
type ReleaseCadence = "WEEKLY" | "DAILY" | "CONTINUOUS";
type ApiChange =
  | "NONE"
  | "ADD_FIELD"
  | "REMOVE_FIELD"
  | "RENAME_FIELD"
  | "TYPE_CHANGE";
type ConsumerStrictness = "LENIENT" | "STRICT";
type VisualState = "A" | "B";

export function TestingStrategyLabDemo({
  demoConfig,
  focusTarget,
}: TestingStrategyLabDemoProps) {
  const { reduced } = useMotionPrefs();
  const [activeMode, setActiveMode] = useState<Mode>("PYRAMID");
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);

  // Pyramid mode state
  const [teamSize, setTeamSize] = useState<TeamSize>("MEDIUM");
  const [releaseCadence, setReleaseCadence] = useState<ReleaseCadence>("DAILY");

  // Contract mode state
  const [apiChange, setApiChange] = useState<ApiChange>("NONE");
  const [consumerStrictness, setConsumerStrictness] =
    useState<ConsumerStrictness>("STRICT");
  const [contractChecked, setContractChecked] = useState(false);
  const [contractResult, setContractResult] = useState<{
    pass: boolean;
    breakingReasons: string[];
  } | null>(null);

  // Visual regression mode state
  const [baseline, setBaseline] = useState<{
    layout: VisualState;
    color: VisualState;
    spacing: VisualState;
  }>({ layout: "A", color: "A", spacing: "A" });
  const [current, setCurrent] = useState<{
    layout: VisualState;
    color: VisualState;
    spacing: VisualState;
  }>({ layout: "A", color: "A", spacing: "A" });
  const [visualDiff, setVisualDiff] = useState<{
    changed: string[];
    severity: "LOW" | "MEDIUM" | "HIGH";
  } | null>(null);

  // Validate and parse demo config
  const config = useMemo(() => {
    try {
      return testingStrategyLabConfigSchema.parse(demoConfig);
    } catch (error) {
      console.error("Invalid demo config:", error);
      return null;
    }
  }, [demoConfig]);

  // Initialize defaults from config
  useEffect(() => {
    if (config?.defaults) {
      setActiveMode(config.defaults.mode);
      setTeamSize(config.defaults.teamSize);
      setReleaseCadence(config.defaults.releaseCadence);
      setApiChange(config.defaults.apiChange);
      setConsumerStrictness(config.defaults.consumerStrictness);
      setBaseline(config.defaults.baseline);
      setCurrent(config.defaults.current);
    }
  }, [config]);

  const addEvent = useCallback(
    (cause: string, decision: string, explanation: string) => {
      const newEntry: EventLogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        cause,
        decision,
        explanation,
      };
      setEventLog((prev) => [...prev, newEntry]);
    },
    []
  );

  // Find matching rule for pyramid mode
  const pyramidRule = useMemo(() => {
    if (!config) return null;
    return (
      config.rules.find((rule) => {
        if (rule.teamSize && rule.teamSize !== teamSize) return false;
        if (rule.releaseCadence && rule.releaseCadence !== releaseCadence)
          return false;
        return true;
      }) || config.rules[0]
    );
  }, [config, teamSize, releaseCadence]);

  // Find matching rule for contract mode
  const contractRule = useMemo(() => {
    if (!config || !contractChecked) return null;
    return (
      config.contractRules.find((rule) => {
        if (rule.apiChange && rule.apiChange !== apiChange) return false;
        if (
          rule.consumerStrictness &&
          rule.consumerStrictness !== consumerStrictness
        )
          return false;
        return true;
      }) || config.contractRules[0]
    );
  }, [config, apiChange, consumerStrictness, contractChecked]);

  // Find matching rule for visual mode
  const visualRule = useMemo(() => {
    if (!config) return null;
    return (
      config.visualRules.find((rule) => {
        if (
          rule.baseline &&
          JSON.stringify(rule.baseline) !== JSON.stringify(baseline)
        )
          return false;
        if (
          rule.current &&
          JSON.stringify(rule.current) !== JSON.stringify(current)
        )
          return false;
        return true;
      }) || config.visualRules[0]
    );
  }, [config, baseline, current]);

  // Compute visual diff when current changes
  useEffect(() => {
    if (activeMode === "VISUAL" && visualRule) {
      const changed: string[] = [];
      if (baseline.layout !== current.layout) changed.push("layout");
      if (baseline.color !== current.color) changed.push("color");
      if (baseline.spacing !== current.spacing) changed.push("spacing");

      let severity: "LOW" | "MEDIUM" | "HIGH" = "LOW";
      if (changed.includes("layout")) severity = "HIGH";
      else if (changed.includes("spacing")) severity = "MEDIUM";
      else if (changed.includes("color")) severity = "LOW";

      setVisualDiff({ changed, severity });
    }
  }, [activeMode, baseline, current, visualRule]);

  // Update event log when pyramid settings change
  useEffect(() => {
    if (activeMode === "PYRAMID" && pyramidRule) {
      const eventLines = pyramidRule.eventLines || [];
      if (eventLines.length > 0) {
        addEvent(
          `Team: ${teamSize}, Cadence: ${releaseCadence}`,
          `Recommended mix: ${pyramidRule.recommendedMix.unitPct}% Unit, ${pyramidRule.recommendedMix.integrationPct}% Integration, ${pyramidRule.recommendedMix.e2ePct}% E2E`,
          eventLines.join(" ")
        );
      }
    }
  }, [activeMode, teamSize, releaseCadence, pyramidRule, addEvent]);

  const handleRunContractCheck = useCallback(() => {
    setContractChecked(true);
    if (contractRule) {
      setContractResult(contractRule.contractResult);
      const eventLines = contractRule.eventLines || [];
      if (eventLines.length > 0) {
        addEvent(
          `API change: ${apiChange}, Consumer: ${consumerStrictness}`,
          contractRule.contractResult.pass
            ? "Contract: PASS"
            : "Contract: FAIL",
          eventLines.join(" ")
        );
      }
    }
  }, [apiChange, consumerStrictness, contractRule, addEvent]);

  const handleVisualCompare = useCallback(() => {
    if (visualRule && visualDiff) {
      const eventLines = visualRule.eventLines || [];
      if (eventLines.length > 0) {
        addEvent(
          `Visual comparison: ${visualDiff.changed.join(", ")} changed`,
          `Severity: ${visualDiff.severity}`,
          eventLines.join(" ")
        );
      }
    }
  }, [visualRule, visualDiff, addEvent]);

  if (!config) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <p>Demo unavailable: Invalid configuration</p>
      </div>
    );
  }

  const controls = (
    <div className="space-y-4">
      <SpotlightTarget id="controls.mode">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2 flex-wrap items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {(["PYRAMID", "CONTRACT", "VISUAL"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setActiveMode(mode);
                    setContractChecked(false);
                    setContractResult(null);
                  }}
                  className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                    activeMode === mode
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {mode === "PYRAMID"
                    ? "Pyramid"
                    : mode === "CONTRACT"
                      ? "Contract"
                      : "Visual Regression"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                View:
              </span>
              <button
                onClick={() => setViewMode(viewMode === "2D" ? "3D" : "2D")}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  viewMode === "3D"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                {viewMode === "2D" ? "2D" : "3D"}
              </button>
            </div>
          </div>
        </div>
      </SpotlightTarget>

      {/* Pyramid Mode Controls */}
      {activeMode === "PYRAMID" && (
        <div className="space-y-4">
          <SpotlightTarget id="pyramid">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Team Size
              </label>
              <select
                value={teamSize}
                onChange={(e) => {
                  setTeamSize(e.target.value as TeamSize);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
              >
                <option value="SMALL">Small (1-5)</option>
                <option value="MEDIUM">Medium (6-15)</option>
                <option value="LARGE">Large (16+)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Release Cadence
              </label>
              <select
                value={releaseCadence}
                onChange={(e) => {
                  setReleaseCadence(e.target.value as ReleaseCadence);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="DAILY">Daily</option>
                <option value="CONTINUOUS">Continuous</option>
              </select>
            </div>
          </SpotlightTarget>
        </div>
      )}

      {/* Contract Mode Controls */}
      {activeMode === "CONTRACT" && (
        <div className="space-y-4">
          <SpotlightTarget id="contract.flow">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                API Change
              </label>
              <select
                value={apiChange}
                onChange={(e) => {
                  setApiChange(e.target.value as ApiChange);
                  setContractChecked(false);
                  setContractResult(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
              >
                <option value="NONE">None</option>
                <option value="ADD_FIELD">Add Field</option>
                <option value="REMOVE_FIELD">Remove Field</option>
                <option value="RENAME_FIELD">Rename Field</option>
                <option value="TYPE_CHANGE">Type Change</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Consumer Strictness
              </label>
              <select
                value={consumerStrictness}
                onChange={(e) => {
                  setConsumerStrictness(e.target.value as ConsumerStrictness);
                  setContractChecked(false);
                  setContractResult(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
              >
                <option value="LENIENT">Lenient</option>
                <option value="STRICT">Strict</option>
              </select>
            </div>
            <button
              onClick={handleRunContractCheck}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Run contract check
            </button>
          </SpotlightTarget>
        </div>
      )}

      {/* Visual Regression Mode Controls */}
      {activeMode === "VISUAL" && (
        <div className="space-y-4">
          <SpotlightTarget id="visual.diff">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Baseline
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Layout
                    </label>
                    <select
                      value={baseline.layout}
                      onChange={(e) =>
                        setBaseline({
                          ...baseline,
                          layout: e.target.value as VisualState,
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Color
                    </label>
                    <select
                      value={baseline.color}
                      onChange={(e) =>
                        setBaseline({
                          ...baseline,
                          color: e.target.value as VisualState,
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Spacing
                    </label>
                    <select
                      value={baseline.spacing}
                      onChange={(e) =>
                        setBaseline({
                          ...baseline,
                          spacing: e.target.value as VisualState,
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Current
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Layout
                    </label>
                    <select
                      value={current.layout}
                      onChange={(e) =>
                        setCurrent({
                          ...current,
                          layout: e.target.value as VisualState,
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Color
                    </label>
                    <select
                      value={current.color}
                      onChange={(e) =>
                        setCurrent({
                          ...current,
                          color: e.target.value as VisualState,
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Spacing
                    </label>
                    <select
                      value={current.spacing}
                      onChange={(e) =>
                        setCurrent({
                          ...current,
                          spacing: e.target.value as VisualState,
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                    </select>
                  </div>
                </div>
              </div>
              <button
                onClick={handleVisualCompare}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                Compare
              </button>
            </div>
          </SpotlightTarget>
        </div>
      )}
    </div>
  );

  const visualization2D = (
    <div className="space-y-6">
      {/* Pyramid Mode Visualization */}
      {activeMode === "PYRAMID" && pyramidRule && (
        <SpotlightTarget id="pyramid">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Pyramid</h3>
            <div className="relative">
              <div className="flex flex-col items-center gap-2">
                {/* E2E Layer */}
                <motion.div
                  initial={reduced ? {} : { scale: 0.8, opacity: 0 }}
                  animate={
                    reduced
                      ? {}
                      : {
                          scale: 1,
                          opacity: 1,
                          width: `${pyramidRule.recommendedMix.e2ePct}%`,
                        }
                  }
                  transition={reduced ? {} : { duration: 0.5 }}
                  className="bg-red-500 dark:bg-red-600 text-white text-center py-3 px-6 rounded-t-lg font-medium"
                  style={{
                    width: `${pyramidRule.recommendedMix.e2ePct}%`,
                    minWidth: "120px",
                  }}
                >
                  E2E: {pyramidRule.recommendedMix.e2ePct}%
                </motion.div>
                {/* Integration Layer */}
                <motion.div
                  initial={reduced ? {} : { scale: 0.8, opacity: 0 }}
                  animate={
                    reduced
                      ? {}
                      : {
                          scale: 1,
                          opacity: 1,
                          width: `${pyramidRule.recommendedMix.integrationPct}%`,
                        }
                  }
                  transition={reduced ? {} : { duration: 0.5, delay: 0.1 }}
                  className="bg-yellow-500 dark:bg-yellow-600 text-white text-center py-3 px-6 font-medium"
                  style={{
                    width: `${pyramidRule.recommendedMix.integrationPct}%`,
                    minWidth: "120px",
                  }}
                >
                  Integration: {pyramidRule.recommendedMix.integrationPct}%
                </motion.div>
                {/* Unit Layer */}
                <motion.div
                  initial={reduced ? {} : { scale: 0.8, opacity: 0 }}
                  animate={
                    reduced
                      ? {}
                      : {
                          scale: 1,
                          opacity: 1,
                          width: `${pyramidRule.recommendedMix.unitPct}%`,
                        }
                  }
                  transition={reduced ? {} : { duration: 0.5, delay: 0.2 }}
                  className="bg-green-500 dark:bg-green-600 text-white text-center py-3 px-6 rounded-b-lg font-medium"
                  style={{
                    width: `${pyramidRule.recommendedMix.unitPct}%`,
                    minWidth: "120px",
                  }}
                >
                  Unit: {pyramidRule.recommendedMix.unitPct}%
                </motion.div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold">Trade-off Notes</h4>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {pyramidRule.pyramidNotes.map((note, i) => (
                  <motion.li
                    key={i}
                    initial={reduced ? {} : { opacity: 0, x: -10 }}
                    animate={reduced ? {} : { opacity: 1, x: 0 }}
                    transition={
                      reduced ? {} : { duration: 0.3, delay: i * 0.1 }
                    }
                    className="flex items-start gap-2"
                  >
                    <span className="text-blue-500">•</span>
                    <span>{note}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </SpotlightTarget>
      )}

      {/* Contract Mode Visualization */}
      {activeMode === "CONTRACT" && (
        <SpotlightTarget id="contract.flow">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contract Testing Flow</h3>
            <div className="flex items-center justify-between gap-4">
              <motion.div
                initial={reduced ? {} : { opacity: 0, x: -20 }}
                animate={reduced ? {} : { opacity: 1, x: 0 }}
                transition={reduced ? {} : { duration: 0.4 }}
                className="flex-1 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <h4 className="text-sm font-semibold mb-2">Consumer Schema</h4>
                <pre className="text-xs font-mono bg-white dark:bg-gray-800 p-2 rounded">
                  {`{
  "id": string,
  "name": string${apiChange === "ADD_FIELD" ? ',\n  "email": string' : ""}${apiChange === "REMOVE_FIELD" ? "" : ""}${apiChange === "RENAME_FIELD" ? ',\n  "fullName": string' : ""}${apiChange === "TYPE_CHANGE" ? ',\n  "id": number' : ""}
}`}
                </pre>
              </motion.div>
              <motion.div
                initial={reduced ? {} : { opacity: 0, scale: 0.8 }}
                animate={reduced ? {} : { opacity: 1, scale: 1 }}
                transition={reduced ? {} : { duration: 0.4, delay: 0.2 }}
                className="text-2xl text-gray-400"
              >
                →
              </motion.div>
              <motion.div
                initial={reduced ? {} : { opacity: 0 }}
                animate={reduced ? {} : { opacity: 1 }}
                transition={reduced ? {} : { duration: 0.4, delay: 0.3 }}
                className="flex-1 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
              >
                <h4 className="text-sm font-semibold mb-2">Contract</h4>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Validating compatibility...
                </div>
              </motion.div>
              <motion.div
                initial={reduced ? {} : { opacity: 0, scale: 0.8 }}
                animate={reduced ? {} : { opacity: 1, scale: 1 }}
                transition={reduced ? {} : { duration: 0.4, delay: 0.4 }}
                className="text-2xl text-gray-400"
              >
                →
              </motion.div>
              <motion.div
                initial={reduced ? {} : { opacity: 0, x: 20 }}
                animate={reduced ? {} : { opacity: 1, x: 0 }}
                transition={reduced ? {} : { duration: 0.4, delay: 0.5 }}
                className="flex-1 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
              >
                <h4 className="text-sm font-semibold mb-2">
                  Provider Response
                </h4>
                <pre className="text-xs font-mono bg-white dark:bg-gray-800 p-2 rounded">
                  {`{
  "id": "123",
  "name": "Test"
}`}
                </pre>
              </motion.div>
            </div>
            {contractChecked && contractResult && (
              <motion.div
                initial={reduced ? {} : { opacity: 0, y: 10 }}
                animate={reduced ? {} : { opacity: 1, y: 0 }}
                transition={reduced ? {} : { duration: 0.3 }}
                className={`p-4 rounded-lg border-2 ${
                  contractResult.pass
                    ? "bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-500"
                    : "bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-500"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-lg font-semibold ${
                      contractResult.pass
                        ? "text-green-700 dark:text-green-400"
                        : "text-red-700 dark:text-red-400"
                    }`}
                  >
                    {contractResult.pass ? "✓ PASS" : "✗ FAIL"}
                  </span>
                </div>
                {contractResult.breakingReasons.length > 0 && (
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {contractResult.breakingReasons.map((reason, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </div>
        </SpotlightTarget>
      )}

      {/* Visual Regression Mode Visualization */}
      {activeMode === "VISUAL" && (
        <SpotlightTarget id="visual.diff">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Visual Comparison</h3>
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={reduced ? {} : { opacity: 0, x: -20 }}
                animate={reduced ? {} : { opacity: 1, x: 0 }}
                transition={reduced ? {} : { duration: 0.4 }}
                className="space-y-2"
              >
                <h4 className="text-sm font-semibold">Baseline</h4>
                <div
                  className={`p-6 rounded-lg border-2 ${
                    baseline.layout === "A"
                      ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700"
                      : "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700"
                  }`}
                  style={{
                    backgroundColor:
                      baseline.color === "A"
                        ? baseline.layout === "A"
                          ? "#dbeafe"
                          : "#e9d5ff"
                        : baseline.layout === "A"
                          ? "#fef3c7"
                          : "#fce7f3",
                    padding: baseline.spacing === "A" ? "1.5rem" : "2.5rem",
                  }}
                >
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Layout: {baseline.layout}, Color: {baseline.color}, Spacing:{" "}
                    {baseline.spacing}
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={reduced ? {} : { opacity: 0, x: 20 }}
                animate={reduced ? {} : { opacity: 1, x: 0 }}
                transition={reduced ? {} : { duration: 0.4, delay: 0.1 }}
                className="space-y-2"
              >
                <h4 className="text-sm font-semibold">Current</h4>
                <div
                  className={`p-6 rounded-lg border-2 ${
                    current.layout === "A"
                      ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700"
                      : "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700"
                  } ${
                    visualDiff && visualDiff.changed.length > 0
                      ? "ring-4 ring-yellow-400 dark:ring-yellow-500"
                      : ""
                  }`}
                  style={{
                    backgroundColor:
                      current.color === "A"
                        ? current.layout === "A"
                          ? "#dbeafe"
                          : "#e9d5ff"
                        : current.layout === "A"
                          ? "#fef3c7"
                          : "#fce7f3",
                    padding: current.spacing === "A" ? "1.5rem" : "2.5rem",
                  }}
                >
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Layout: {current.layout}, Color: {current.color}, Spacing:{" "}
                    {current.spacing}
                  </div>
                </div>
              </motion.div>
            </div>
            {visualDiff && visualDiff.changed.length > 0 && (
              <motion.div
                initial={reduced ? {} : { opacity: 0, y: 10 }}
                animate={reduced ? {} : { opacity: 1, y: 0 }}
                transition={reduced ? {} : { duration: 0.3 }}
                className={`p-4 rounded-lg border-2 ${
                  visualDiff.severity === "HIGH"
                    ? "bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-500"
                    : visualDiff.severity === "MEDIUM"
                      ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 dark:border-yellow-500"
                      : "bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-500"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-sm font-semibold ${
                      visualDiff.severity === "HIGH"
                        ? "text-red-700 dark:text-red-400"
                        : visualDiff.severity === "MEDIUM"
                          ? "text-yellow-700 dark:text-yellow-400"
                          : "text-blue-700 dark:text-blue-400"
                    }`}
                  >
                    Severity: {visualDiff.severity}
                  </span>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Changed: {visualDiff.changed.join(", ")}
                </div>
              </motion.div>
            )}
          </div>
        </SpotlightTarget>
      )}
    </div>
  );

  // 3D Visualization
  const visualization3D = (
    <div className="h-[500px] w-full">
      <ThreeCanvasShell
        fallback={
          <Fallback2D message="3D mode unavailable, showing 2D view">
            {visualization2D}
          </Fallback2D>
        }
      >
        <TestingLabScene
          mode={activeMode}
          focusTarget={focusTarget}
          recommendedMix={
            activeMode === "PYRAMID" && pyramidRule
              ? pyramidRule.recommendedMix
              : undefined
          }
          pyramidNotes={
            activeMode === "PYRAMID" && pyramidRule
              ? pyramidRule.pyramidNotes
              : undefined
          }
          contractResult={
            activeMode === "CONTRACT" ? contractResult : undefined
          }
          apiChange={activeMode === "CONTRACT" ? apiChange : undefined}
          visualDiff={activeMode === "VISUAL" ? visualDiff : undefined}
          baseline={activeMode === "VISUAL" ? baseline : undefined}
          current={activeMode === "VISUAL" ? current : undefined}
        />
      </ThreeCanvasShell>
    </div>
  );

  return (
    <Spotlight targetId={focusTarget || null}>
      <DemoShell
        controls={controls}
        visualization={viewMode === "3D" ? visualization3D : visualization2D}
        eventLog={<EventLog entries={eventLog} />}
      />
    </Spotlight>
  );
}

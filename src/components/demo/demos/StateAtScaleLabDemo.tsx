"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useMotionPrefs } from "../../motion/MotionPrefsProvider";
import { motion, AnimatePresence } from "framer-motion";
import { DemoShell } from "../DemoShell";
import { EventLog, EventLogEntry } from "../EventLog";
import { Spotlight, SpotlightTarget } from "../Spotlight";
import { Timeline, TimelinePhase } from "../Timeline";
import {
  stateAtScaleLabConfigSchema,
  type StateAtScaleLabConfig,
} from "../demoSchema";
import { z } from "zod";
import { ThreeCanvasShell } from "../../three/ThreeCanvasShell";
import {
  StatePipelineScene,
  triggerPipelineAction,
} from "../../three/StatePipelineScene";
import { Fallback2D } from "../../three/Fallback2D";

interface StateAtScaleLabDemoProps {
  demoConfig: unknown;
  focusTarget?: string | null;
}

type Network = "ONLINE" | "FLAKY" | "OFFLINE";
type CacheMode = "FRESH_ONLY" | "STALE_WHILE_REVALIDATE";
type ConflictMode = "NONE" | "LAST_WRITE_WINS" | "MANUAL_MERGE";

interface QueueItem {
  id: string;
  value: string;
  status: "queued" | "replaying" | "acked" | "failed";
  timestamp: number;
}

interface StateSnapshot {
  label: string;
  clientValue: string;
  serverValue: string;
  status: string;
}

export function StateAtScaleLabDemo({
  demoConfig,
  focusTarget,
}: StateAtScaleLabDemoProps) {
  const { reduced } = useMotionPrefs();
  const [network, setNetwork] = useState<Network>("ONLINE");
  const [serverLatencyMs, setServerLatencyMs] = useState(500);
  const [failureRate, setFailureRate] = useState(0);
  const [cacheMode, setCacheMode] = useState<CacheMode>("FRESH_ONLY");
  const [optimistic, setOptimistic] = useState(true);
  const [conflictMode, setConflictMode] = useState<ConflictMode>("NONE");
  const [clientValue, setClientValue] = useState("");
  const [editValue, setEditValue] = useState("");
  const [showEditInput, setShowEditInput] = useState(false);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<"fresh" | "stale">("fresh");
  const [serverVersion, setServerVersion] = useState(1);
  const [clientVersion, setClientVersion] = useState(1);
  const [cacheValue, setCacheValue] = useState("");
  const [serverValue, setServerValue] = useState("");
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  const pipelineActionRef = useRef<string | null>(null);

  // Validate and parse demo config
  const config = useMemo(() => {
    try {
      return stateAtScaleLabConfigSchema.parse(demoConfig);
    } catch (error) {
      console.error("Invalid demo config:", error);
      return null;
    }
  }, [demoConfig]);

  // Initialize defaults
  useEffect(() => {
    if (config?.defaults) {
      setNetwork(config.defaults.network);
      setServerLatencyMs(config.defaults.serverLatencyMs);
      setFailureRate(config.defaults.failureRate);
      setCacheMode(config.defaults.cacheMode);
      setOptimistic(config.defaults.optimistic);
      setConflictMode(config.defaults.conflictMode);
      if (config.entity) {
        setClientValue(config.entity.value);
        setCacheValue(config.entity.value);
        setServerValue(config.serverState?.value || config.entity.value);
        setClientVersion(config.entity.version);
        setServerVersion(config.serverState?.version || config.entity.version);
      }
    }
  }, [config]);

  // Find matching rule based on current settings
  const currentRule = useMemo(() => {
    if (!config) return null;

    return (
      config.rules.find((rule) => {
        if (rule.network && rule.network !== network) return false;
        if (rule.optimistic !== undefined && rule.optimistic !== optimistic)
          return false;
        if (rule.cacheMode && rule.cacheMode !== cacheMode) return false;
        if (
          rule.conflictMode &&
          rule.conflictMode !== conflictMode &&
          network === "OFFLINE"
        )
          return false;
        return true;
      }) || config.rules[0]
    );
  }, [config, network, optimistic, cacheMode, conflictMode]);

  // Compute timeline phases
  const timelinePhases = useMemo((): TimelinePhase[] => {
    if (!currentRule || !config) {
      return [];
    }

    const phases = config.timelinePhases || [];
    return phases
      .filter((phaseId) => {
        // Filter out phases that don't apply to current scenario
        if (phaseId === "QUEUE" && network !== "OFFLINE" && !isPlaying)
          return false;
        if (phaseId === "OPTIMISTIC_APPLY" && !optimistic) return false;
        return true;
      })
      .map((phaseId) => {
        const duration = currentRule.phaseDurations[phaseId] || 0;
        const isHighlighted =
          focusTarget === "timeline" || currentPhase === phaseId;

        return {
          id: phaseId,
          label: phaseId.replace(/_/g, " "),
          duration,
          highlighted: isHighlighted,
        };
      });
  }, [
    currentRule,
    config,
    focusTarget,
    currentPhase,
    network,
    optimistic,
    isPlaying,
  ]);

  const totalDuration = useMemo(() => {
    return timelinePhases.reduce((sum, phase) => sum + phase.duration, 0);
  }, [timelinePhases]);

  // Simulate mutation flow
  const handleSaveMutation = useCallback(async () => {
    if (!editValue.trim() || !config) return;

    setIsPlaying(true);
    const newValue = editValue;
    setEditValue("");
    setShowEditInput(false);

    // Determine if mutation will fail
    const willFail = Math.random() < failureRate;

    // Add event log entry
    const addLogEntry = (
      cause: string,
      decision: string,
      explanation: string
    ) => {
      setEventLog((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          cause,
          decision,
          explanation,
        },
      ]);
    };

    // Trigger 3D animation
    if (viewMode === "3D") {
      triggerPipelineAction("SAVE_MUTATION");
    }

    // Phase 1: ACTION
    setCurrentPhase("ACTION");
    await new Promise((resolve) => setTimeout(resolve, 100));
    addLogEntry(
      "User clicked Save",
      "Mutation initiated",
      "Starting mutation flow"
    );

    // Phase 2: OPTIMISTIC_APPLY (if enabled)
    if (optimistic) {
      setCurrentPhase("OPTIMISTIC_APPLY");
      await new Promise((resolve) => setTimeout(resolve, 200));
      setClientValue(newValue);
      setClientVersion((prev) => prev + 1);
      addLogEntry(
        "Optimistic update ON",
        "UI updated immediately",
        "UI shows new value before server confirmation"
      );
    }

    // Phase 3: QUEUE (if offline)
    if (network === "OFFLINE") {
      setCurrentPhase("QUEUE");
      await new Promise((resolve) => setTimeout(resolve, 300));
      const queueItem: QueueItem = {
        id: `${Date.now()}`,
        value: newValue,
        status: "queued",
        timestamp: Date.now(),
      };
      setQueue((prev) => [...prev, queueItem]);
      addLogEntry(
        "Network OFFLINE",
        "Mutation queued",
        "Mutation added to offline queue; will replay when online"
      );
      setCurrentPhase(null);
      setIsPlaying(false);
      return;
    }

    // Phase 4: REQUEST
    setCurrentPhase("REQUEST");
    await new Promise((resolve) => setTimeout(resolve, 100));
    addLogEntry(
      "Sending request",
      "Network request initiated",
      "Request sent to server"
    );

    // Phase 5: SERVER_APPLY
    setCurrentPhase("SERVER_APPLY");
    await new Promise((resolve) => setTimeout(resolve, serverLatencyMs / 2));

    // Phase 6: RESPONSE
    setCurrentPhase("RESPONSE");
    await new Promise((resolve) => setTimeout(resolve, serverLatencyMs / 2));

    if (willFail) {
      // ROLLBACK
      setCurrentPhase("ROLLBACK_OR_CONFIRM");
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (optimistic) {
        setClientValue(cacheValue); // Rollback to cached value
        setClientVersion((prev) => prev - 1);
      }
      setCacheStatus("stale");
      addLogEntry(
        "Server rejected mutation",
        "Rollback applied",
        "Server returned error; optimistic update rolled back"
      );
      // Trigger 3D rollback animation
      if (viewMode === "3D") {
        setTimeout(() => triggerPipelineAction("MUTATION_FAILURE"), 1200);
      }
    } else {
      // CONFIRM
      setCurrentPhase("ROLLBACK_OR_CONFIRM");
      await new Promise((resolve) => setTimeout(resolve, 100));
      setServerValue(newValue);
      setServerVersion((prev) => prev + 1);
      addLogEntry(
        "Server confirmed mutation",
        "Mutation successful",
        "Server accepted changes; state updated"
      );
      // Trigger 3D success animation
      if (viewMode === "3D") {
        setTimeout(() => triggerPipelineAction("MUTATION_SUCCESS"), 1200);
      }
    }

    // Phase 7: CACHE_UPDATE
    setCurrentPhase("CACHE_UPDATE");
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (!willFail) {
      setCacheValue(newValue);
      setClientValue(newValue);
      setCacheStatus("fresh");
      addLogEntry(
        "Cache updated",
        "Cache refreshed",
        cacheMode === "STALE_WHILE_REVALIDATE"
          ? "Cache updated; SWR: served stale then revalidated"
          : "Cache invalidated and updated with fresh data"
      );
    }

    // Phase 8: RENDER
    setCurrentPhase("RENDER");
    await new Promise((resolve) => setTimeout(resolve, 100));
    addLogEntry(
      "UI rendered",
      "Final state rendered",
      "UI reflects final state"
    );

    await new Promise((resolve) => setTimeout(resolve, 300));
    setCurrentPhase(null);
    setIsPlaying(false);
  }, [
    editValue,
    config,
    optimistic,
    network,
    failureRate,
    serverLatencyMs,
    cacheMode,
    cacheValue,
    viewMode,
  ]);

  // Handle refetch
  const handleRefetch = useCallback(async () => {
    if (!config) return;

    // Trigger 3D animation
    if (viewMode === "3D") {
      triggerPipelineAction("REFETCH");
    }

    setIsPlaying(true);
    setCurrentPhase("REQUEST");
    setCacheStatus(cacheMode === "STALE_WHILE_REVALIDATE" ? "stale" : "fresh");

    setEventLog((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        cause: "User clicked Refetch",
        decision: "Cache refresh initiated",
        explanation:
          cacheMode === "STALE_WHILE_REVALIDATE"
            ? "SWR: serving stale cache, revalidating in background"
            : "Fetching fresh data from server",
      },
    ]);

    await new Promise((resolve) => setTimeout(resolve, serverLatencyMs));
    setCurrentPhase("CACHE_UPDATE");
    setCacheValue(serverValue);
    setClientValue(serverValue);
    setClientVersion(serverVersion);
    setCacheStatus("fresh");

    setEventLog((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        cause: "Refetch completed",
        decision: "Cache updated",
        explanation: "Fresh data loaded from server and cached",
      },
    ]);

    await new Promise((resolve) => setTimeout(resolve, 200));
    setCurrentPhase(null);
    setIsPlaying(false);
  }, [
    config,
    serverLatencyMs,
    cacheMode,
    serverValue,
    serverVersion,
    viewMode,
  ]);

  // Handle queue replay (when going online)
  useEffect(() => {
    if (network === "ONLINE" && queue.length > 0) {
      const replayQueue = async () => {
        const item = queue.find((q) => q.status === "queued");
        if (!item) return;

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: "replaying" } : q
          )
        );

        setEventLog((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            cause: "Network ONLINE",
            decision: "Replaying queued mutation",
            explanation: "Processing queued mutation from offline period",
          },
        ]);

        await new Promise((resolve) => setTimeout(resolve, serverLatencyMs));

        const willFail = Math.random() < failureRate;
        if (willFail) {
          setQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: "failed" } : q))
          );
          setEventLog((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random()}`,
              timestamp: Date.now(),
              cause: "Replay failed",
              decision: "Mutation rejected",
              explanation: "Server rejected replayed mutation",
            },
          ]);
        } else {
          setQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: "acked" } : q))
          );
          setServerValue(item.value);
          setCacheValue(item.value);
          setClientValue(item.value);
          setServerVersion((prev) => prev + 1);
          setClientVersion((prev) => prev + 1);
          setEventLog((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random()}`,
              timestamp: Date.now(),
              cause: "Replay successful",
              decision: "Mutation applied",
              explanation: "Queued mutation successfully applied",
            },
          ]);
        }
      };

      replayQueue();
    }
  }, [network, queue, serverLatencyMs, failureRate, viewMode]);

  if (!config) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <p>Demo unavailable: Invalid configuration</p>
      </div>
    );
  }

  const controls = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Network
        </label>
        <select
          value={network}
          onChange={(e) => {
            const newNetwork = e.target.value as Network;
            const wasOffline = network === "OFFLINE";
            setNetwork(newNetwork);
            if (newNetwork === "ONLINE" && wasOffline) {
              setEventLog((prev) => [
                ...prev,
                {
                  id: `${Date.now()}-${Math.random()}`,
                  timestamp: Date.now(),
                  cause: "Network: ONLINE",
                  decision: "Connection restored",
                  explanation:
                    "Network is now online; queued mutations will replay",
                },
              ]);
              // Trigger 3D replay animation
              if (viewMode === "3D" && queue.length > 0) {
                triggerPipelineAction("GO_ONLINE");
              }
            } else if (newNetwork === "OFFLINE" && viewMode === "3D") {
              triggerPipelineAction("GO_OFFLINE");
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ONLINE">Online</option>
          <option value="FLAKY">Flaky</option>
          <option value="OFFLINE">Offline</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Server Latency: {serverLatencyMs}ms
        </label>
        <input
          type="range"
          min="200"
          max="2000"
          step="100"
          value={serverLatencyMs}
          onChange={(e) => setServerLatencyMs(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Failure Rate: {(failureRate * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.05"
          value={failureRate}
          onChange={(e) => setFailureRate(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Cache Mode
        </label>
        <select
          value={cacheMode}
          onChange={(e) => setCacheMode(e.target.value as CacheMode)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="FRESH_ONLY">Fresh Only</option>
          <option value="STALE_WHILE_REVALIDATE">Stale-While-Revalidate</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={optimistic}
            onChange={(e) => setOptimistic(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-700"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Optimistic Updates
          </span>
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Conflict Mode
        </label>
        <select
          value={conflictMode}
          onChange={(e) => setConflictMode(e.target.value as ConflictMode)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="NONE">None</option>
          <option value="LAST_WRITE_WINS">Last Write Wins</option>
          <option value="MANUAL_MERGE">Manual Merge</option>
        </select>
      </div>

      <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setShowEditInput(!showEditInput)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          Edit Value
        </button>
        {showEditInput && (
          <div className="space-y-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Enter new value"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
            />
            <button
              onClick={handleSaveMutation}
              disabled={isPlaying || !editValue.trim()}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Save Mutation
            </button>
          </div>
        )}
        <button
          onClick={handleRefetch}
          disabled={isPlaying}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          Refetch
        </button>
      </div>
    </div>
  );

  const visualization2D = (
    <Spotlight targetId={focusTarget || null}>
      <div className="space-y-6">
        {/* Timeline */}
        <SpotlightTarget id="timeline" className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Mutation Timeline
          </h4>
          <Timeline
            phases={timelinePhases}
            totalDuration={totalDuration}
            userSeesContentAt={undefined}
          />
        </SpotlightTarget>

        {/* Cache & Server State Panel */}
        <SpotlightTarget id="cache.panel" className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Cache & Server State
          </h4>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Cache Status:
              </span>
              <motion.span
                key={cacheStatus}
                initial={reduced ? false : { scale: 1.2 }}
                animate={reduced ? {} : { scale: 1 }}
                transition={reduced ? {} : { duration: 0.3 }}
                className={`text-sm font-semibold ${
                  cacheStatus === "fresh"
                    ? "text-green-600 dark:text-green-400"
                    : "text-yellow-600 dark:text-yellow-400"
                }`}
              >
                {cacheStatus.toUpperCase()}
              </motion.span>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Cached Value:
                </span>
                <motion.div
                  key={cacheValue}
                  initial={reduced ? false : { x: -8, opacity: 0.5 }}
                  animate={reduced ? {} : { x: 0, opacity: 1 }}
                  transition={reduced ? {} : { duration: 0.3 }}
                  className="text-sm font-mono bg-white dark:bg-gray-800 p-2 rounded mt-1"
                >
                  {cacheValue || "(empty)"}
                </motion.div>
              </div>
              <div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Server Value:
                </span>
                <motion.div
                  key={serverValue}
                  initial={reduced ? false : { x: -8, opacity: 0.5 }}
                  animate={reduced ? {} : { x: 0, opacity: 1 }}
                  transition={reduced ? {} : { duration: 0.3 }}
                  className="text-sm font-mono bg-white dark:bg-gray-800 p-2 rounded mt-1"
                >
                  {serverValue || "(empty)"}
                </motion.div>
              </div>
              <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                <span>Cache v{clientVersion}</span>
                <span>Server v{serverVersion}</span>
              </div>
            </div>
            {currentRule?.cacheEvents && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
                {currentRule.cacheEvents.map((event, index) => (
                  <motion.div
                    key={index}
                    initial={reduced ? false : { opacity: 0, x: -8 }}
                    animate={reduced ? {} : { opacity: 1, x: 0 }}
                    transition={
                      reduced ? {} : { duration: 0.3, delay: index * 0.1 }
                    }
                    className="text-xs text-gray-700 dark:text-gray-300"
                  >
                    {event}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </SpotlightTarget>

        {/* Offline Queue Panel */}
        {(network === "OFFLINE" || queue.length > 0) && (
          <SpotlightTarget id="queue.panel" className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Offline Queue
            </h4>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
              {queue.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Queue empty
                </p>
              ) : (
                <AnimatePresence>
                  {queue.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={reduced ? false : { opacity: 0, x: -20 }}
                      animate={reduced ? {} : { opacity: 1, x: 0 }}
                      exit={reduced ? {} : { opacity: 0, x: 20 }}
                      transition={reduced ? {} : { duration: 0.3 }}
                      className={`p-2 rounded border text-sm ${
                        item.status === "queued"
                          ? "border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20"
                          : item.status === "replaying"
                            ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
                            : item.status === "acked"
                              ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
                              : "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs">{item.value}</span>
                        <span className="text-xs capitalize">
                          {item.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </SpotlightTarget>
        )}

        {/* Current Client Value */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Current Client Value
          </h4>
          <motion.div
            key={clientValue}
            initial={
              reduced
                ? false
                : { scale: 1.05, backgroundColor: "rgb(59, 130, 246)" }
            }
            animate={
              reduced ? {} : { scale: 1, backgroundColor: "transparent" }
            }
            transition={reduced ? {} : { duration: 0.4 }}
            className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800"
          >
            <div className="text-lg font-mono">{clientValue || "(empty)"}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Version: {clientVersion}
            </div>
          </motion.div>
        </div>
      </div>
    </Spotlight>
  );

  const visualization3D = (
    <div className="w-full h-[600px] bg-gray-900 rounded-lg overflow-hidden">
      <ThreeCanvasShell
        className="w-full h-full"
        fallback={
          <Fallback2D message="3D mode unavailable. Showing 2D view.">
            {visualization2D}
          </Fallback2D>
        }
      >
        <StatePipelineScene
          network={network}
          optimistic={optimistic}
          cacheMode={cacheMode}
          queueCount={queue.length}
          cacheStatus={cacheStatus}
          focusTarget={focusTarget}
          onAction={(action) => {
            // Handle station clicks or other actions if needed
            console.log("Pipeline action:", action);
          }}
        />
      </ThreeCanvasShell>
    </div>
  );

  const visualization = (
    <div className="space-y-4">
      {/* 2D/3D Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Visualization
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("2D")}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              viewMode === "2D"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            2D
          </button>
          <button
            onClick={() => setViewMode("3D")}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              viewMode === "3D"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            3D
          </button>
        </div>
      </div>

      {/* Render selected view */}
      {viewMode === "2D" ? visualization2D : visualization3D}
    </div>
  );

  return (
    <DemoShell
      controls={controls}
      visualization={visualization}
      eventLog={<EventLog entries={eventLog} />}
    />
  );
}

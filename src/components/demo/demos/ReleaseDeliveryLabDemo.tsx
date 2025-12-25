"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useMotionPrefs } from "../../motion/MotionPrefsProvider";
import { motion, AnimatePresence } from "framer-motion";
import { DemoShell } from "../DemoShell";
import { EventLog, EventLogEntry } from "../EventLog";
import { Spotlight, SpotlightTarget } from "../Spotlight";
import {
  releaseDeliveryLabConfigSchema,
  type ReleaseDeliveryLabConfig,
} from "../demoSchema";

interface ReleaseDeliveryLabDemoProps {
  demoConfig: unknown;
  focusTarget?: string | null;
}

type StageMode = "PIPELINE" | "FLAGS_AB" | "CANARY_ROLLBACK" | "CDN_EDGE";

export function ReleaseDeliveryLabDemo({
  demoConfig,
  focusTarget,
}: ReleaseDeliveryLabDemoProps) {
  const { reduced } = useMotionPrefs();
  const [activeMode, setActiveMode] = useState<StageMode>("PIPELINE");
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);

  // Pipeline mode state
  const [runTests, setRunTests] = useState(true);
  const [visualRegression, setVisualRegression] = useState(true);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState<string | null>(null);

  // Flags & A/B mode state
  const [flagEnabled, setFlagEnabled] = useState(false);
  const [abSplit, setAbSplit] = useState(50);
  const [targeting, setTargeting] = useState<
    "ALL" | "MOBILE_ONLY" | "COUNTRY_IN" | "BETA_USERS"
  >("ALL");

  // Canary & Rollback mode state
  const [trafficPercent, setTrafficPercent] = useState(10);
  const [errorRateNew, setErrorRateNew] = useState(0.05);
  const [latencyNewMs, setLatencyNewMs] = useState(200);
  const [canaryActive, setCanaryActive] = useState(false);
  const [sloPass, setSloPass] = useState(true);

  // CDN & Edge mode state
  const [cacheTTLSeconds, setCacheTTLSeconds] = useState(60);
  const [cacheInvalidation, setCacheInvalidation] = useState<
    "NONE" | "PURGE_PATH" | "VERSIONED_ASSETS"
  >("NONE");
  const [edgeCompute, setEdgeCompute] = useState(false);
  const [cacheHitRate, setCacheHitRate] = useState(0.7);

  // Validate and parse demo config
  const config = useMemo(() => {
    try {
      return releaseDeliveryLabConfigSchema.parse(demoConfig);
    } catch (error) {
      console.error("Invalid demo config:", error);
      return null;
    }
  }, [demoConfig]);

  // Initialize defaults from config
  useEffect(() => {
    if (config?.defaults) {
      setFlagEnabled(config.defaults.flagEnabled);
      setAbSplit(config.defaults.abSplit);
      setTargeting(config.defaults.targeting);
      setTrafficPercent(config.defaults.trafficPercent);
      setErrorRateNew(config.defaults.errorRateNew);
      setLatencyNewMs(config.defaults.latencyNewMs);
      setCacheTTLSeconds(config.defaults.cacheTTLSeconds);
      setCacheInvalidation(config.defaults.cacheInvalidation);
      setEdgeCompute(config.defaults.edgeCompute);
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

  const handleRunPipeline = useCallback(() => {
    setPipelineRunning(true);
    setCurrentStage("BUILD");
    addEvent(
      "Pipeline started",
      "Build stage",
      "Starting CI/CD pipeline execution"
    );

    const stages = ["BUILD", "UNIT", "INTEGRATION", "E2E", "DEPLOY"];
    let stageIndex = 0;

    const interval = setInterval(
      () => {
        if (stageIndex < stages.length - 1) {
          stageIndex++;
          setCurrentStage(stages[stageIndex]);
          addEvent(
            `Stage: ${stages[stageIndex - 1]} completed`,
            `Stage: ${stages[stageIndex]}`,
            `Moving to ${stages[stageIndex]} stage`
          );
        } else {
          clearInterval(interval);
          setPipelineRunning(false);
          setCurrentStage(null);
          addEvent(
            "Pipeline completed",
            "Deployment successful",
            "All stages passed, deployment complete"
          );
        }
      },
      reduced ? 100 : 1500
    );
  }, [addEvent, reduced]);

  const handleStartCanary = useCallback(() => {
    setCanaryActive(true);
    const errorThreshold = 0.1;
    const latencyThreshold = 500;
    const pass =
      errorRateNew < errorThreshold && latencyNewMs < latencyThreshold;
    setSloPass(pass);

    addEvent(
      `Canary started at ${trafficPercent}%`,
      pass ? "SLO check: PASS" : "SLO check: FAIL",
      `Error rate: ${(errorRateNew * 100).toFixed(1)}%, Latency: ${latencyNewMs}ms. ${
        pass
          ? "Metrics within thresholds"
          : "Threshold breached - recommend rollback"
      }`
    );
  }, [trafficPercent, errorRateNew, latencyNewMs, addEvent]);

  const handleRollback = useCallback(() => {
    setCanaryActive(false);
    setTrafficPercent(0);
    addEvent(
      "Rollback triggered",
      "Traffic returned to v1",
      "All traffic shifted back to stable version"
    );
  }, [addEvent]);

  const handleRequestAsset = useCallback(() => {
    const hit = Math.random() < cacheHitRate;
    if (hit) {
      addEvent(
        "Asset requested",
        "Cache HIT",
        `Served from CDN cache (TTL: ${cacheTTLSeconds}s)`
      );
    } else {
      addEvent("Asset requested", "Cache MISS", "Fetched from origin server");
    }
  }, [cacheHitRate, cacheTTLSeconds, addEvent]);

  const handleDeployNewBuild = useCallback(() => {
    if (cacheInvalidation === "NONE") {
      addEvent(
        "New build deployed",
        "Stale content risk",
        "No invalidation strategy - users may see stale content until TTL expires"
      );
    } else if (cacheInvalidation === "PURGE_PATH") {
      addEvent(
        "New build deployed",
        "Cache purged",
        "CDN cache purged for affected paths - fresh content served"
      );
    } else {
      addEvent(
        "New build deployed",
        "Versioned assets",
        "Versioned assets ensure correct content without cache purging"
      );
    }
  }, [cacheInvalidation, addEvent]);

  if (!config) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <p>Demo unavailable: Invalid configuration</p>
      </div>
    );
  }

  const controls = (
    <div className="space-y-4">
      {/* Mode Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2 flex-wrap">
          {(
            ["PIPELINE", "FLAGS_AB", "CANARY_ROLLBACK", "CDN_EDGE"] as const
          ).map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeMode === mode
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {mode === "FLAGS_AB"
                ? "Flags & A/B"
                : mode === "CANARY_ROLLBACK"
                  ? "Canary & Rollback"
                  : mode === "CDN_EDGE"
                    ? "CDN & Edge"
                    : mode}
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline Mode Controls */}
      {activeMode === "PIPELINE" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={runTests}
                onChange={(e) => setRunTests(e.target.checked)}
                className="rounded"
              />
              Run tests
            </label>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={visualRegression}
                onChange={(e) => setVisualRegression(e.target.checked)}
                className="rounded"
              />
              Visual regression gate
            </label>
          </div>
          <button
            onClick={handleRunPipeline}
            disabled={pipelineRunning}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {pipelineRunning ? "Running..." : "Run pipeline"}
          </button>
        </div>
      )}

      {/* Flags & A/B Mode Controls */}
      {activeMode === "FLAGS_AB" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={flagEnabled}
                onChange={(e) => {
                  setFlagEnabled(e.target.checked);
                  addEvent(
                    `Feature flag: ${e.target.checked ? "enabled" : "disabled"}`,
                    e.target.checked ? "Feature active" : "Feature inactive",
                    e.target.checked
                      ? "Users matching targeting will see the feature"
                      : "Feature hidden from all users"
                  );
                }}
                className="rounded"
              />
              Feature flag enabled
            </label>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              A/B Split: {abSplit}% (Variant B)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={abSplit}
              onChange={(e) => {
                const val = Number(e.target.value);
                setAbSplit(val);
                addEvent(
                  `A/B split: ${val}%`,
                  `${100 - val}% Control (A), ${val}% Variant (B)`,
                  `Traffic routing updated`
                );
              }}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Targeting
            </label>
            <select
              value={targeting}
              onChange={(e) => {
                const val = e.target.value as typeof targeting;
                setTargeting(val);
                addEvent(
                  `Targeting: ${val}`,
                  val === "ALL"
                    ? "All users"
                    : val === "MOBILE_ONLY"
                      ? "Mobile cohort only"
                      : val === "COUNTRY_IN"
                        ? "Specific countries"
                        : "Beta users only",
                  `Only ${val === "ALL" ? "all" : val.toLowerCase().replace("_", " ")} users receive variant B`
                );
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
            >
              <option value="ALL">All users</option>
              <option value="MOBILE_ONLY">Mobile only</option>
              <option value="COUNTRY_IN">Country-based</option>
              <option value="BETA_USERS">Beta users</option>
            </select>
          </div>
        </div>
      )}

      {/* Canary & Rollback Mode Controls */}
      {activeMode === "CANARY_ROLLBACK" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Traffic % to new version: {trafficPercent}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={trafficPercent}
              onChange={(e) => setTrafficPercent(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              New version error rate: {(errorRateNew * 100).toFixed(1)}%
            </label>
            <input
              type="range"
              min="0"
              max="30"
              value={errorRateNew * 100}
              onChange={(e) => setErrorRateNew(Number(e.target.value) / 100)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              New version latency: {latencyNewMs}ms
            </label>
            <input
              type="range"
              min="0"
              max="800"
              value={latencyNewMs}
              onChange={(e) => setLatencyNewMs(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleStartCanary}
              disabled={canaryActive}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Start canary
            </button>
            <button
              onClick={handleRollback}
              disabled={!canaryActive}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Rollback
            </button>
          </div>
        </div>
      )}

      {/* CDN & Edge Mode Controls */}
      {activeMode === "CDN_EDGE" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Cache TTL: {cacheTTLSeconds}s
            </label>
            <input
              type="range"
              min="0"
              max="300"
              value={cacheTTLSeconds}
              onChange={(e) => {
                const val = Number(e.target.value);
                setCacheTTLSeconds(val);
                addEvent(
                  `TTL: ${val}s`,
                  val > 0
                    ? "Higher hit rate but risk stale HTML"
                    : "No caching",
                  `Cache TTL set to ${val} seconds`
                );
              }}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Invalidation strategy
            </label>
            <select
              value={cacheInvalidation}
              onChange={(e) => {
                const val = e.target.value as typeof cacheInvalidation;
                setCacheInvalidation(val);
                addEvent(
                  `Invalidation: ${val}`,
                  val === "VERSIONED_ASSETS"
                    ? "Safe caching for static assets"
                    : val === "PURGE_PATH"
                      ? "Cache purged on deploy"
                      : "No invalidation",
                  val === "VERSIONED_ASSETS"
                    ? "Versioned assets ensure correctness without purging"
                    : val === "PURGE_PATH"
                      ? "CDN cache purged for affected paths"
                      : "Users may see stale content until TTL expires"
                );
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
            >
              <option value="NONE">None</option>
              <option value="PURGE_PATH">Purge path</option>
              <option value="VERSIONED_ASSETS">Versioned assets</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={edgeCompute}
                onChange={(e) => setEdgeCompute(e.target.checked)}
                className="rounded"
              />
              Edge compute
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRequestAsset}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Request asset
            </button>
            <button
              onClick={handleDeployNewBuild}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              Deploy new build
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const visualization = (
    <Spotlight targetId={focusTarget || null}>
      <div className="space-y-6">
        {/* Pipeline Visualization */}
        {activeMode === "PIPELINE" && (
          <SpotlightTarget id="pipeline" className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              CI/CD Pipeline
            </h4>
            <div className="flex gap-2 items-center">
              {["BUILD", "UNIT", "INTEGRATION", "E2E", "DEPLOY"].map(
                (stage, index) => {
                  const isActive = currentStage === stage;
                  const isCompleted =
                    currentStage &&
                    ["BUILD", "UNIT", "INTEGRATION", "E2E", "DEPLOY"].indexOf(
                      currentStage
                    ) > index;
                  return (
                    <div key={stage} className="flex items-center">
                      <motion.div
                        initial={false}
                        animate={
                          reduced ? {} : isActive ? { scale: [1, 1.1, 1] } : {}
                        }
                        transition={
                          reduced ? {} : { duration: 0.5, repeat: Infinity }
                        }
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          isActive
                            ? "bg-blue-500 text-white"
                            : isCompleted
                              ? "bg-green-500 text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {stage}
                      </motion.div>
                      {index < 4 && (
                        <div
                          className={`h-0.5 w-8 ${
                            isCompleted
                              ? "bg-green-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        />
                      )}
                    </div>
                  );
                }
              )}
            </div>
            {!runTests && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Tests disabled - risk of deploying broken code
              </div>
            )}
          </SpotlightTarget>
        )}

        {/* Flags & A/B Visualization */}
        {activeMode === "FLAGS_AB" && (
          <SpotlightTarget id="traffic" className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Traffic Routing
            </h4>
            <div className="space-y-2">
              <div className="flex gap-2 h-8">
                <motion.div
                  initial={false}
                  animate={
                    reduced
                      ? {}
                      : {
                          width: `${100 - abSplit}%`,
                        }
                  }
                  transition={reduced ? {} : { duration: 0.3 }}
                  className="bg-blue-500 rounded-l-md flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${100 - abSplit}%` }}
                >
                  Control (A): {100 - abSplit}%
                </motion.div>
                <motion.div
                  initial={false}
                  animate={
                    reduced
                      ? {}
                      : {
                          width: `${abSplit}%`,
                        }
                  }
                  transition={reduced ? {} : { duration: 0.3 }}
                  className="bg-purple-500 rounded-r-md flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${abSplit}%` }}
                >
                  Variant (B): {abSplit}%
                </motion.div>
              </div>
              {!flagEnabled && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Feature flag disabled - all users see Control (A)
                </div>
              )}
              {flagEnabled && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Targeting: {targeting.replace("_", " ")} → Variant (B) active
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h5 className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Simulated Metrics
              </h5>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Error rate:
                  </span>
                  <span className="font-medium">
                    {flagEnabled ? "0.02%" : "0.01%"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Latency:
                  </span>
                  <span className="font-medium">
                    {flagEnabled ? "180ms" : "150ms"}
                  </span>
                </div>
              </div>
            </div>
          </SpotlightTarget>
        )}

        {/* Canary & Rollback Visualization */}
        {activeMode === "CANARY_ROLLBACK" && (
          <SpotlightTarget id="metrics" className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Canary Rollout
            </h4>
            <div className="space-y-2">
              <div className="flex gap-2 h-8">
                <motion.div
                  initial={false}
                  animate={
                    reduced
                      ? {}
                      : {
                          width: `${100 - trafficPercent}%`,
                        }
                  }
                  transition={reduced ? {} : { duration: 0.3 }}
                  className="bg-green-500 rounded-l-md flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${100 - trafficPercent}%` }}
                >
                  v1 (stable): {100 - trafficPercent}%
                </motion.div>
                <motion.div
                  initial={false}
                  animate={
                    reduced
                      ? {}
                      : {
                          width: `${trafficPercent}%`,
                        }
                  }
                  transition={reduced ? {} : { duration: 0.3 }}
                  className={`rounded-r-md flex items-center justify-center text-white text-xs font-medium ${
                    canaryActive && !sloPass ? "bg-red-500" : "bg-orange-500"
                  }`}
                  style={{ width: `${trafficPercent}%` }}
                >
                  v2 (new): {trafficPercent}%
                </motion.div>
              </div>
              {canaryActive && (
                <motion.div
                  initial={reduced ? false : { opacity: 0, scale: 0.95 }}
                  animate={reduced ? {} : { opacity: 1, scale: 1 }}
                  transition={reduced ? {} : { duration: 0.3 }}
                  className={`p-3 rounded-md text-sm ${
                    sloPass
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                      : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
                  }`}
                >
                  {sloPass ? (
                    "✓ SLO check: PASS - Metrics within thresholds"
                  ) : (
                    <div>
                      ⚠️ SLO check: FAIL - Threshold breached
                      <div className="text-xs mt-1">
                        Error: {(errorRateNew * 100).toFixed(1)}% (threshold:
                        10%), Latency: {latencyNewMs}ms (threshold: 500ms)
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </SpotlightTarget>
        )}

        {/* CDN & Edge Visualization */}
        {activeMode === "CDN_EDGE" && (
          <SpotlightTarget id="cdn.map" className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              CDN Cache Flow
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Client
                  </span>
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-0.5 bg-gray-300 dark:bg-gray-600" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    CDN
                  </span>
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-0.5 bg-gray-300 dark:bg-gray-600" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Origin
                  </span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h5 className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Cache Metrics
                </h5>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Hit rate:
                    </span>
                    <span className="font-medium">
                      {(cacheHitRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      TTL:
                    </span>
                    <span className="font-medium">{cacheTTLSeconds}s</span>
                  </div>
                  {edgeCompute && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Edge compute:
                      </span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        Enabled
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SpotlightTarget>
        )}
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

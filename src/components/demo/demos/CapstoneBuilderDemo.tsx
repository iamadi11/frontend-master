"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useMotionPrefs } from "../../motion/MotionPrefsProvider";
import { motion, AnimatePresence } from "framer-motion";
import { DemoShell } from "../DemoShell";
import { EventLog, EventLogEntry } from "../EventLog";
import { Spotlight, SpotlightTarget } from "../Spotlight";
import { ThreeCanvasShell } from "../../three/ThreeCanvasShell";
import { CapstoneAtlasScene } from "../../three/CapstoneAtlasScene";
import {
  capstoneBuilderConfigSchema,
  type CapstoneBuilderConfig,
} from "../demoSchema";

interface CapstoneBuilderDemoProps {
  demoConfig: unknown;
  focusTarget?: string | null;
}

type Scenario = "ECOMMERCE" | "DASHBOARD" | "CHAT_COLLAB" | "MEDIA_UI";
type View = "ARCH_MAP" | "INTERACTIVE_SIM";
type Emphasis = "PERF" | "RELIABILITY" | "SECURITY" | "DX";
type Rendering = "CSR" | "SSR" | "SSG" | "ISR" | "STREAMING";
type Caching = "NONE" | "BROWSER" | "CDN" | "APP";
type Realtime = "NONE" | "SSE" | "WEBSOCKET";

export function CapstoneBuilderDemo({
  demoConfig,
  focusTarget,
}: CapstoneBuilderDemoProps) {
  const { reduced } = useMotionPrefs();
  const [scenario, setScenario] = useState<Scenario>("ECOMMERCE");
  const [view, setView] = useState<View>("ARCH_MAP");
  const [emphasis, setEmphasis] = useState<Emphasis>("PERF");
  const [rendering, setRendering] = useState<Rendering>("SSR");
  const [caching, setCaching] = useState<Caching>("CDN");
  const [realtime, setRealtime] = useState<Realtime>("WEBSOCKET");
  const [optimistic, setOptimistic] = useState(true);
  const [offline, setOffline] = useState(false);
  const [sampling, setSampling] = useState(1.0);
  const [cspStrict, setCspStrict] = useState(true);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [isSimRunning, setIsSimRunning] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  const [isPlayingFlow, setIsPlayingFlow] = useState(false);

  // Validate and parse demo config
  const config = useMemo(() => {
    try {
      return capstoneBuilderConfigSchema.parse(demoConfig);
    } catch (error) {
      console.error("Invalid demo config:", error);
      return null;
    }
  }, [demoConfig]);

  // Initialize defaults
  useEffect(() => {
    if (config?.defaults) {
      setScenario(config.defaults.scenario);
      setView(config.defaults.view);
      setEmphasis(config.defaults.emphasis);
    }
  }, [config]);

  // Get current scenario data
  const currentScenarioData = useMemo(() => {
    if (!config) return null;
    return (
      config.scenarios.find((s) => s.id === scenario) || config.scenarios[0]
    );
  }, [config, scenario]);

  // Find matching sim rule
  const currentSimRule = useMemo(() => {
    if (!config || view !== "INTERACTIVE_SIM") return null;

    return (
      config.sim.rules.find((rule) => {
        if (rule.rendering && rule.rendering !== rendering) return false;
        if (rule.caching && rule.caching !== caching) return false;
        if (rule.realtime && rule.realtime !== realtime) return false;
        if (rule.optimistic !== undefined && rule.optimistic !== optimistic)
          return false;
        if (rule.offline !== undefined && rule.offline !== offline)
          return false;
        if (rule.cspStrict !== undefined && rule.cspStrict !== cspStrict)
          return false;
        return true;
      }) || config.sim.rules[0]
    );
  }, [
    config,
    view,
    rendering,
    caching,
    realtime,
    optimistic,
    offline,
    cspStrict,
  ]);

  // Add event log entry
  const addLogEntry = useCallback(
    (cause: string, decision: string, explanation: string) => {
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
    },
    []
  );

  // Handle scenario change
  const handleScenarioChange = (newScenario: Scenario) => {
    setScenario(newScenario);
    setEventLog([]);
    if (currentScenarioData) {
      const rec = currentScenarioData.recommendedChoices;
      addLogEntry(
        `${newScenario}: Architecture map`,
        `${rec.rendering}/${rec.caching}`,
        `${newScenario}: ${rec.rendering}/${rec.caching} for rendering/caching; ${rec.state} for state; ${rec.observability} for observability; ${rec.security} for security; ${rec.deployment} for deployment.`
      );
    }
  };

  // Handle emphasis change
  const handleEmphasisChange = (newEmphasis: Emphasis) => {
    setEmphasis(newEmphasis);
  };

  // Handle play critical flow
  const handlePlayFlow = useCallback(() => {
    if (!currentScenarioData) return;
    setIsPlayingFlow(true);
    addLogEntry(
      "Play critical flow",
      `${emphasis} emphasis`,
      `Animating critical path for ${emphasis} emphasis`
    );

    // Log flow steps
    const criticalEdges = currentScenarioData.flows.filter((flow) => {
      const criticalPathNodes =
        emphasis === "PERF"
          ? currentScenarioData.modules.filter(
              (m) => m.type === "CACHE" || m.type === "EDGE"
            )
          : emphasis === "SECURITY"
            ? currentScenarioData.modules.filter(
                (m) => m.type === "AUTH" || m.type === "API"
              )
            : emphasis === "RELIABILITY"
              ? currentScenarioData.modules.filter(
                  (m) => m.type === "API" || m.type === "REALTIME"
                )
              : currentScenarioData.modules.filter((m) => m.type === "UI");
      const fromCritical = criticalPathNodes.some((m) => m.id === flow.from);
      const toCritical = criticalPathNodes.some((m) => m.id === flow.to);
      return fromCritical && toCritical;
    });

    criticalEdges.forEach((edge, index) => {
      setTimeout(() => {
        const fromModule = currentScenarioData.modules.find(
          (m) => m.id === edge.from
        );
        const toModule = currentScenarioData.modules.find(
          (m) => m.id === edge.to
        );
        if (fromModule && toModule) {
          addLogEntry(
            "Flow step",
            `${fromModule.label} → ${toModule.label}`,
            `${edge.kind} flow: ${edge.label}`
          );
        }
      }, index * 500);
    });

    setTimeout(
      () => {
        setIsPlayingFlow(false);
      },
      criticalEdges.length * 500 + 500
    );
  }, [currentScenarioData, emphasis, addLogEntry]);

  // Run simulation
  const runSimulation = useCallback(() => {
    if (!currentSimRule) return;
    setIsSimRunning(true);
    addLogEntry(
      "Simulation started",
      `${rendering}/${caching}/${realtime}`,
      `Running simulation with ${rendering} rendering, ${caching} caching, ${realtime} realtime, optimistic=${optimistic}, offline=${offline}, sampling=${sampling}, CSP strict=${cspStrict}`
    );

    // Simulate timeline events
    currentSimRule.simTimelineEvents.forEach((event, index) => {
      setTimeout(() => {
        addLogEntry(
          "Simulation event",
          event,
          currentSimRule.simNotes[index] || ""
        );
      }, index * 500);
    });

    setTimeout(() => {
      setIsSimRunning(false);
      addLogEntry(
        "Simulation complete",
        `Metrics: ${currentSimRule.simMetrics.latencyMs}ms latency, ${(currentSimRule.simMetrics.errorRate * 100).toFixed(1)}% errors, ${(currentSimRule.simMetrics.cacheHitRate * 100).toFixed(1)}% cache hits${currentSimRule.simMetrics.droppedMsgsPct !== undefined ? `, ${currentSimRule.simMetrics.droppedMsgsPct.toFixed(1)}% dropped messages` : ""}`,
        currentSimRule.simNotes.join("; ")
      );
    }, currentSimRule.simTimelineEvents.length * 500);
  }, [
    currentSimRule,
    rendering,
    caching,
    realtime,
    optimistic,
    offline,
    sampling,
    cspStrict,
    addLogEntry,
  ]);

  // Handle sim complete callback
  const handleSimComplete = useCallback(() => {
    // Already handled in runSimulation timeout
  }, []);

  // Render architecture map
  const renderArchitectureMap = () => {
    if (!currentScenarioData) return null;

    const criticalPathNodes =
      emphasis === "PERF"
        ? currentScenarioData.modules.filter(
            (m) => m.type === "CACHE" || m.type === "EDGE"
          )
        : emphasis === "SECURITY"
          ? currentScenarioData.modules.filter(
              (m) => m.type === "AUTH" || m.type === "API"
            )
          : emphasis === "RELIABILITY"
            ? currentScenarioData.modules.filter(
                (m) => m.type === "API" || m.type === "REALTIME"
              )
            : currentScenarioData.modules.filter((m) => m.type === "UI");

    const tradeoffsToShow = currentScenarioData.tradeoffs.filter((t) => {
      if (emphasis === "PERF") {
        return (
          t.label.includes("cache") ||
          t.label.includes("CDN") ||
          t.label.includes("streaming")
        );
      }
      if (emphasis === "SECURITY") {
        return (
          t.label.includes("auth") ||
          t.label.includes("CSP") ||
          t.label.includes("token")
        );
      }
      if (emphasis === "RELIABILITY") {
        return (
          t.label.includes("retry") ||
          t.label.includes("fallback") ||
          t.label.includes("rollback")
        );
      }
      return (
        t.label.includes("module") ||
        t.label.includes("test") ||
        t.label.includes("design")
      );
    });

    // 3D mode visualization
    if (is3DMode && config) {
      return (
        <div className="space-y-6">
          <SpotlightTarget id="arch.map" className="relative">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Architecture Map (3D)
                </h4>
                <button
                  onClick={handlePlayFlow}
                  disabled={isPlayingFlow}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlayingFlow ? "Playing..." : "Play critical flow"}
                </button>
              </div>
              <div className="relative min-h-[400px] w-full">
                <ThreeCanvasShell
                  className="w-full h-[400px] rounded"
                  fallback={renderArchitectureMap2D()}
                >
                  <CapstoneAtlasScene
                    config={config}
                    view="ARCH_MAP"
                    scenario={scenario}
                    emphasis={emphasis}
                    onNodeClick={(moduleId) => {
                      const module = currentScenarioData.modules.find(
                        (m) => m.id === moduleId
                      );
                      if (module) {
                        addLogEntry(
                          "Module clicked",
                          module.label,
                          `Type: ${module.type}`
                        );
                      }
                    }}
                    onFlowPlay={handlePlayFlow}
                    isPlayingFlow={isPlayingFlow}
                    rendering={rendering}
                    caching={caching}
                    realtime={realtime}
                    optimistic={optimistic}
                    offline={offline}
                    sampling={sampling}
                    cspStrict={cspStrict}
                    isSimRunning={isSimRunning}
                    onSimComplete={handleSimComplete}
                    focusTarget={focusTarget}
                  />
                </ThreeCanvasShell>
              </div>
            </div>
          </SpotlightTarget>
          {renderTradeoffsPanel(tradeoffsToShow)}
          {renderRecommendedChoices()}
        </div>
      );
    }

    // 2D mode visualization
    return (
      <div className="space-y-6">
        <SpotlightTarget id="arch.map" className="relative">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Architecture Map
              </h4>
              <button
                onClick={handlePlayFlow}
                disabled={isPlayingFlow}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlayingFlow ? "Playing..." : "Play critical flow"}
              </button>
            </div>
            {renderArchitectureMap2D()}
          </div>
        </SpotlightTarget>
        {renderTradeoffsPanel(tradeoffsToShow)}
        {renderRecommendedChoices()}
      </div>
    );
  };

  // Render 2D architecture map (fallback and 2D mode)
  const renderArchitectureMap2D = () => {
    if (!currentScenarioData) return null;

    const criticalPathNodes =
      emphasis === "PERF"
        ? currentScenarioData.modules.filter(
            (m) => m.type === "CACHE" || m.type === "EDGE"
          )
        : emphasis === "SECURITY"
          ? currentScenarioData.modules.filter(
              (m) => m.type === "AUTH" || m.type === "API"
            )
          : emphasis === "RELIABILITY"
            ? currentScenarioData.modules.filter(
                (m) => m.type === "API" || m.type === "REALTIME"
              )
            : currentScenarioData.modules.filter((m) => m.type === "UI");

    return (
      <div className="relative min-h-[400px]">
        {/* Module nodes */}
        <svg viewBox="0 0 800 400" className="w-full h-full">
          {currentScenarioData.modules.map((module, index) => {
            const x = 100 + (index % 4) * 180;
            const y = 80 + Math.floor(index / 4) * 150;
            const isCritical = criticalPathNodes.some(
              (m) => m.id === module.id
            );

            return (
              <g key={module.id}>
                <motion.circle
                  initial={reduced ? {} : { scale: 0, opacity: 0 }}
                  animate={reduced ? {} : { scale: 1, opacity: 1 }}
                  transition={
                    reduced ? {} : { delay: index * 0.1, duration: 0.3 }
                  }
                  cx={x}
                  cy={y}
                  r={30}
                  fill={
                    isCritical
                      ? "rgb(59, 130, 246)"
                      : module.type === "UI"
                        ? "rgb(168, 85, 247)"
                        : module.type === "API"
                          ? "rgb(34, 197, 94)"
                          : module.type === "CACHE"
                            ? "rgb(251, 191, 36)"
                            : "rgb(156, 163, 175)"
                  }
                  stroke={isCritical ? "rgb(250, 204, 21)" : "none"}
                  strokeWidth={isCritical ? 3 : 0}
                  className="cursor-pointer"
                />
                <motion.text
                  initial={reduced ? {} : { opacity: 0 }}
                  animate={reduced ? {} : { opacity: 1 }}
                  transition={
                    reduced ? {} : { delay: index * 0.1 + 0.2, duration: 0.3 }
                  }
                  x={x}
                  y={y + 50}
                  textAnchor="middle"
                  className="text-xs fill-gray-700 dark:fill-gray-300"
                >
                  {module.label}
                </motion.text>
              </g>
            );
          })}

          {/* Flows */}
          {currentScenarioData.flows.map((flow, index) => {
            const fromModule = currentScenarioData.modules.find(
              (m) => m.id === flow.from
            );
            const toModule = currentScenarioData.modules.find(
              (m) => m.id === flow.to
            );
            if (!fromModule || !toModule) return null;

            const fromIndex = currentScenarioData.modules.indexOf(fromModule);
            const toIndex = currentScenarioData.modules.indexOf(toModule);
            const fromX = 100 + (fromIndex % 4) * 180;
            const fromY = 80 + Math.floor(fromIndex / 4) * 150;
            const toX = 100 + (toIndex % 4) * 180;
            const toY = 80 + Math.floor(toIndex / 4) * 150;

            return (
              <g key={`${flow.from}-${flow.to}`}>
                <motion.line
                  initial={reduced ? {} : { pathLength: 0 }}
                  animate={reduced ? {} : { pathLength: 1 }}
                  transition={
                    reduced ? {} : { delay: index * 0.15, duration: 0.5 }
                  }
                  x1={fromX}
                  y1={fromY}
                  x2={toX}
                  y2={toY}
                  stroke={
                    flow.kind === "AUTH"
                      ? "rgb(239, 68, 68)"
                      : flow.kind === "EVENT"
                        ? "rgb(168, 85, 247)"
                        : "rgb(59, 130, 246)"
                  }
                  strokeWidth={2}
                  strokeDasharray={flow.kind === "EVENT" ? "5,5" : "0"}
                />
                <motion.text
                  initial={reduced ? {} : { opacity: 0 }}
                  animate={reduced ? {} : { opacity: 1 }}
                  transition={
                    reduced ? {} : { delay: index * 0.15 + 0.3, duration: 0.3 }
                  }
                  x={(fromX + toX) / 2}
                  y={(fromY + toY) / 2 - 10}
                  textAnchor="middle"
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                >
                  {flow.label}
                </motion.text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // Render tradeoffs panel
  const renderTradeoffsPanel = (
    tradeoffsToShow: NonNullable<typeof currentScenarioData>["tradeoffs"]
  ) => {
    if (!currentScenarioData) return null;

    return (
      <SpotlightTarget
        id="tradeoffs.panel"
        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
      >
        <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
          Trade-offs ({emphasis})
        </h4>
        <div className="space-y-3">
          {tradeoffsToShow.map((tradeoff, index) => (
            <motion.div
              key={index}
              initial={reduced ? {} : { opacity: 0, x: -20 }}
              animate={reduced ? {} : { opacity: 1, x: 0 }}
              transition={reduced ? {} : { delay: index * 0.1, duration: 0.3 }}
              className="p-3 bg-gray-50 dark:bg-gray-900 rounded"
            >
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {tradeoff.label}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Good for: {tradeoff.goodFor.join(", ")}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Risks: {tradeoff.risks.join(", ")}
              </p>
            </motion.div>
          ))}
        </div>
      </SpotlightTarget>
    );
  };

  // Render recommended choices
  const renderRecommendedChoices = () => {
    if (!currentScenarioData) return null;

    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
        <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
          Recommended Choices
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Rendering:</span>{" "}
            <span className="font-medium">
              {currentScenarioData.recommendedChoices.rendering}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Caching:</span>{" "}
            <span className="font-medium">
              {currentScenarioData.recommendedChoices.caching}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">State:</span>{" "}
            <span className="font-medium">
              {currentScenarioData.recommendedChoices.state}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">
              Observability:
            </span>{" "}
            <span className="font-medium">
              {currentScenarioData.recommendedChoices.observability}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Security:</span>{" "}
            <span className="font-medium">
              {currentScenarioData.recommendedChoices.security}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">
              Deployment:
            </span>{" "}
            <span className="font-medium">
              {currentScenarioData.recommendedChoices.deployment}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Render interactive simulation
  const renderInteractiveSim = () => {
    if (!config || !currentSimRule) return null;

    // 3D mode visualization
    if (is3DMode && config) {
      return (
        <div className="space-y-6">
          <SpotlightTarget
            id="sim.panel"
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800"
          >
            <h4 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">
              Interactive Simulation (3D) ({config.sim.demoScenario})
            </h4>
            {renderSimToggles()}
            <button
              onClick={runSimulation}
              disabled={isSimRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm mb-6"
            >
              {isSimRunning ? "Running..." : "Run Simulation"}
            </button>
            <div className="relative min-h-[400px] w-full">
              <ThreeCanvasShell
                className="w-full h-[400px] rounded"
                fallback={renderInteractiveSim2D()}
              >
                <CapstoneAtlasScene
                  config={config}
                  view="INTERACTIVE_SIM"
                  scenario={scenario}
                  emphasis={emphasis}
                  onNodeClick={() => {}}
                  onFlowPlay={() => {}}
                  isPlayingFlow={false}
                  rendering={rendering}
                  caching={caching}
                  realtime={realtime}
                  optimistic={optimistic}
                  offline={offline}
                  sampling={sampling}
                  cspStrict={cspStrict}
                  isSimRunning={isSimRunning}
                  onSimComplete={handleSimComplete}
                  focusTarget={focusTarget}
                />
              </ThreeCanvasShell>
            </div>
            {renderSimTimeline()}
          </SpotlightTarget>
          {renderSimMetrics()}
        </div>
      );
    }

    // 2D mode visualization
    return (
      <div className="space-y-6">
        <SpotlightTarget
          id="sim.panel"
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800"
        >
          <h4 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">
            Interactive Simulation ({config.sim.demoScenario})
          </h4>
          {renderSimToggles()}
          <button
            onClick={runSimulation}
            disabled={isSimRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm mb-6"
          >
            {isSimRunning ? "Running..." : "Run Simulation"}
          </button>
          {renderInteractiveSim2D()}
          {renderSimTimeline()}
        </SpotlightTarget>
        {renderSimMetrics()}
      </div>
    );
  };

  // Render sim toggles
  const renderSimToggles = () => {
    if (!config) return null;

    return (
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">
            Rendering
          </label>
          <select
            value={rendering}
            onChange={(e) => setRendering(e.target.value as Rendering)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
          >
            {config.sim.toggles.rendering.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">
            Caching
          </label>
          <select
            value={caching}
            onChange={(e) => setCaching(e.target.value as Caching)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
          >
            {config.sim.toggles.caching.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">
            Realtime
          </label>
          <select
            value={realtime}
            onChange={(e) => setRealtime(e.target.value as Realtime)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
          >
            {config.sim.toggles.realtime.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">
            Sampling Rate
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={sampling}
            onChange={(e) => setSampling(parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {(sampling * 100).toFixed(0)}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="optimistic"
            checked={optimistic}
            onChange={(e) => setOptimistic(e.target.checked)}
            className="w-4 h-4"
          />
          <label
            htmlFor="optimistic"
            className="text-xs text-gray-700 dark:text-gray-300"
          >
            Optimistic Updates
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="offline"
            checked={offline}
            onChange={(e) => setOffline(e.target.checked)}
            className="w-4 h-4"
          />
          <label
            htmlFor="offline"
            className="text-xs text-gray-700 dark:text-gray-300"
          >
            Offline Support
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="cspStrict"
            checked={cspStrict}
            onChange={(e) => setCspStrict(e.target.checked)}
            className="w-4 h-4"
          />
          <label
            htmlFor="cspStrict"
            className="text-xs text-gray-700 dark:text-gray-300"
          >
            CSP Strict
          </label>
        </div>
      </div>
    );
  };

  // Render 2D interactive sim (fallback and 2D mode)
  const renderInteractiveSim2D = () => {
    if (!config || !currentSimRule) return null;

    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 min-h-[300px] flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">2D simulation view</p>
          <p className="text-xs mt-2">
            Use 3D mode for interactive visualization
          </p>
        </div>
      </div>
    );
  };

  // Render sim timeline
  const renderSimTimeline = () => {
    if (!currentSimRule) return null;

    return (
      currentSimRule.simTimelineEvents.length > 0 && (
        <div className="mt-6 space-y-2">
          <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Timeline Events
          </h5>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {currentSimRule.simTimelineEvents.map((event, index) => (
              <motion.div
                key={index}
                initial={reduced ? {} : { opacity: 0, x: -10 }}
                animate={reduced ? {} : { opacity: 1, x: 0 }}
                transition={
                  reduced ? {} : { delay: index * 0.1, duration: 0.2 }
                }
                className="text-xs p-2 bg-gray-50 dark:bg-gray-900 rounded"
              >
                {event}
              </motion.div>
            ))}
          </div>
        </div>
      )
    );
  };

  // Render sim metrics
  const renderSimMetrics = () => {
    if (!currentSimRule) return null;

    return (
      <SpotlightTarget
        id="metrics"
        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
      >
        <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
          Simulation Metrics
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Latency:</span>{" "}
            <span className="font-medium">
              {currentSimRule.simMetrics.latencyMs}ms
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">
              Error Rate:
            </span>{" "}
            <span className="font-medium">
              {(currentSimRule.simMetrics.errorRate * 100).toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">
              Cache Hit Rate:
            </span>{" "}
            <span className="font-medium">
              {(currentSimRule.simMetrics.cacheHitRate * 100).toFixed(1)}%
            </span>
          </div>
          {currentSimRule.simMetrics.droppedMsgsPct !== undefined && (
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                Dropped Messages:
              </span>{" "}
              <span className="font-medium">
                {currentSimRule.simMetrics.droppedMsgsPct.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </SpotlightTarget>
    );
  };

  if (!config) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <p>Demo unavailable: Invalid configuration</p>
      </div>
    );
  }

  const controls = (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">
          Scenario
        </label>
        <select
          value={scenario}
          onChange={(e) => handleScenarioChange(e.target.value as Scenario)}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
          data-spotlight="controls.scenario"
        >
          {config.scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">
          View
        </label>
        <select
          value={view}
          onChange={(e) => setView(e.target.value as View)}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
        >
          <option value="ARCH_MAP">Architecture Map</option>
          <option value="INTERACTIVE_SIM">Interactive Simulation</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">
          Emphasis
        </label>
        <select
          value={emphasis}
          onChange={(e) => handleEmphasisChange(e.target.value as Emphasis)}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
        >
          <option value="PERF">Performance</option>
          <option value="RELIABILITY">Reliability</option>
          <option value="SECURITY">Security</option>
          <option value="DX">Developer Experience</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">
          Visualization Mode
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIs3DMode(false)}
            className={`flex-1 px-3 py-2 text-xs rounded ${
              !is3DMode
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            2D
          </button>
          <button
            onClick={() => setIs3DMode(true)}
            className={`flex-1 px-3 py-2 text-xs rounded ${
              is3DMode
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            3D
          </button>
        </div>
      </div>
    </div>
  );

  const visualization =
    view === "ARCH_MAP" ? renderArchitectureMap() : renderInteractiveSim();

  return (
    <Spotlight targetId={focusTarget || null}>
      <DemoShell
        controls={controls}
        visualization={visualization}
        eventLog={<EventLog entries={eventLog} />}
      />
    </Spotlight>
  );
}

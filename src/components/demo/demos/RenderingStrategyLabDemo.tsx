"use client";

import { useState, useMemo, useCallback } from "react";
import { useMotionPrefs } from "../../motion/MotionPrefsProvider";
import { motion } from "framer-motion";
import { DemoShell } from "../DemoShell";
import { EventLog, EventLogEntry } from "../EventLog";
import { Spotlight, SpotlightTarget } from "../Spotlight";
import { Timeline, TimelinePhase } from "../Timeline";
import { DiffView } from "../DiffView";
import {
  renderingStrategyLabConfigSchema,
  type RenderingStrategyLabConfig,
} from "../demoSchema";
import { z } from "zod";

interface RenderingStrategyLabDemoProps {
  demoConfig: unknown;
  focusTarget?: string | null;
}

type Strategy = "CSR" | "SSR" | "SSG" | "ISR" | "STREAMING";
type Network = "FAST" | "SLOW";
type Device = "DESKTOP" | "MOBILE";
type DataFetch = "SERVER" | "CLIENT" | "MIXED";
type CacheMode = "NONE" | "BROWSER" | "CDN" | "APP";

export function RenderingStrategyLabDemo({
  demoConfig,
  focusTarget,
}: RenderingStrategyLabDemoProps) {
  const { reduced } = useMotionPrefs();
  const [strategy, setStrategy] = useState<Strategy>("CSR");
  const [network, setNetwork] = useState<Network>("FAST");
  const [device, setDevice] = useState<Device>("DESKTOP");
  const [dataFetch, setDataFetch] = useState<DataFetch>("CLIENT");
  const [cacheMode, setCacheMode] = useState<CacheMode>("NONE");
  const [revalidateSeconds, setRevalidateSeconds] = useState(0);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);

  // Validate and parse demo config
  const config = useMemo(() => {
    try {
      return renderingStrategyLabConfigSchema.parse(demoConfig);
    } catch (error) {
      console.error("Invalid demo config:", error);
      return null;
    }
  }, [demoConfig]);

  // Find matching rule based on current settings
  const currentRule = useMemo(() => {
    if (!config) return null;

    return (
      config.rules.find((rule) => {
        if (rule.strategy && rule.strategy !== strategy) return false;
        if (rule.network && rule.network !== network) return false;
        if (rule.device && rule.device !== device) return false;
        if (rule.dataFetch && rule.dataFetch !== dataFetch) return false;
        if (rule.cacheMode && rule.cacheMode !== cacheMode) return false;
        return true;
      }) || config.rules[0]
    );
  }, [config, strategy, network, device, dataFetch, cacheMode]);

  // Compute timeline phases
  const timelinePhases = useMemo((): TimelinePhase[] => {
    if (!currentRule || !config) {
      return [];
    }

    return config.timelinePhases.map((phaseId) => {
      const duration = currentRule.phaseDurations[phaseId] || 0;
      const isHighlighted =
        focusTarget === "timeline" ||
        (strategy === "CSR" &&
          ["JS", "HYDRATE", "DATA", "INTERACTIVE"].includes(phaseId)) ||
        (strategy === "SSR" && ["TTFB", "HTML"].includes(phaseId)) ||
        (strategy === "SSG" && ["HTML"].includes(phaseId)) ||
        (strategy === "ISR" && ["HTML", "DATA"].includes(phaseId)) ||
        (strategy === "STREAMING" && ["HTML", "DATA"].includes(phaseId));

      return {
        id: phaseId,
        label: phaseId,
        duration,
        highlighted: isHighlighted,
      };
    });
  }, [currentRule, config, strategy, focusTarget]);

  const totalDuration = useMemo(() => {
    return timelinePhases.reduce((sum, phase) => sum + phase.duration, 0);
  }, [timelinePhases]);

  // Calculate when user sees content
  const userSeesContentAt = useMemo(() => {
    if (!currentRule) return undefined;

    let cumulative = 0;
    for (const phase of timelinePhases) {
      if (phase.id === "HTML" || phase.id === "TTFB") {
        return cumulative + phase.duration / 2;
      }
      cumulative += phase.duration;
    }
    return cumulative;
  }, [timelinePhases, currentRule]);

  // Get highlighted lines for diff view
  const highlightedLines = useMemo(() => {
    if (strategy === "CSR") return [5, 6, 7]; // JS, hydration, data
    if (strategy === "SSR") return [2, 3, 4]; // HTML, initial render
    if (strategy === "SSG") return [2, 3]; // HTML
    if (strategy === "ISR") return [2, 3, 5]; // HTML, data
    if (strategy === "STREAMING") return [2, 3, 4, 5]; // Streaming chunks
    return [];
  }, [strategy]);

  const handleChange = useCallback(
    (
      field: "strategy" | "network" | "device" | "dataFetch" | "cacheMode",
      value: string
    ) => {
      if (field === "strategy") setStrategy(value as Strategy);
      if (field === "network") setNetwork(value as Network);
      if (field === "device") setDevice(value as Device);
      if (field === "dataFetch") setDataFetch(value as DataFetch);
      if (field === "cacheMode") setCacheMode(value as CacheMode);

      // Add event log entry
      if (currentRule) {
        const explanation =
          field === "strategy"
            ? `Strategy=${value} → ${currentRule.notes.join(" ")}`
            : `${field}=${value} → affects timeline and cache behavior`;

        const newEntry: EventLogEntry = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          cause: `${field}: ${value}`,
          decision: currentRule.notes[0] || "Configuration updated",
          explanation,
        };

        setEventLog((prev) => [...prev, newEntry]);
      }
    },
    [currentRule]
  );

  if (!config) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <p>Demo unavailable: Invalid configuration</p>
      </div>
    );
  }

  // Initialize defaults
  useMemo(() => {
    if (config.defaults) {
      setStrategy(config.defaults.strategy);
      setNetwork(config.defaults.network);
      setDevice(config.defaults.device);
      setDataFetch(config.defaults.dataFetch);
      setCacheMode(config.defaults.cacheMode);
      setRevalidateSeconds(config.defaults.revalidateSeconds);
    }
  }, [config]);

  const handlePhaseClick = useCallback(
    (phaseId: string, notes: string[]) => {
      const phase = timelinePhases.find((p) => p.id === phaseId);
      if (phase) {
        const explanation = `Phase: ${phase.label} (${phase.duration}ms) - ${notes.join(" ")}`;
        const newEntry: EventLogEntry = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          cause: `Phase clicked: ${phase.label}`,
          decision: notes[0] || "Phase details",
          explanation,
        };
        setEventLog((prev) => [...prev, newEntry]);
      }
    },
    [timelinePhases]
  );

  const controls = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Strategy
        </label>
        <select
          value={strategy}
          onChange={(e) => handleChange("strategy", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="CSR">CSR (Client-Side Rendering)</option>
          <option value="SSR">SSR (Server-Side Rendering)</option>
          <option value="SSG">SSG (Static Site Generation)</option>
          <option value="ISR">ISR (Incremental Static Regeneration)</option>
          <option value="STREAMING">Streaming</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Network
        </label>
        <select
          value={network}
          onChange={(e) => handleChange("network", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="FAST">Fast</option>
          <option value="SLOW">Slow</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Device
        </label>
        <select
          value={device}
          onChange={(e) => handleChange("device", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="DESKTOP">Desktop</option>
          <option value="MOBILE">Mobile</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Cache Mode
        </label>
        <select
          value={cacheMode}
          onChange={(e) => handleChange("cacheMode", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="NONE">None</option>
          <option value="BROWSER">Browser</option>
          <option value="CDN">CDN</option>
          <option value="APP">App</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Revalidate (seconds) {strategy !== "ISR" && "(ISR only)"}
        </label>
        <input
          type="range"
          min="0"
          max="60"
          value={revalidateSeconds}
          onChange={(e) => setRevalidateSeconds(Number(e.target.value))}
          disabled={strategy !== "ISR"}
          className="w-full"
        />
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {revalidateSeconds}s{strategy !== "ISR" && " (only applies to ISR)"}
        </div>
      </div>
    </div>
  );

  const visualization = (
    <Spotlight targetId={focusTarget || null}>
      <div className="space-y-6">
        {/* Timeline - 2D or 3D */}
        <SpotlightTarget id="timeline" className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            User-Perceived Timeline
          </h4>
          <Timeline
            phases={timelinePhases}
            totalDuration={totalDuration}
            userSeesContentAt={userSeesContentAt}
          />
        </SpotlightTarget>

        {/* Diff View */}
        <SpotlightTarget id="diff" className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            HTML vs Hydrated DOM
          </h4>
          {currentRule && (
            <DiffView
              htmlPreview={currentRule.htmlPreview}
              domPreview={currentRule.domPreview}
              highlightedLines={highlightedLines}
            />
          )}
        </SpotlightTarget>

        {/* Cache/Revalidation Panel */}
        <SpotlightTarget id="cache.panel" className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Cache & Revalidation
          </h4>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
            {currentRule?.cacheEvents.map((event, index) => (
              <motion.div
                key={index}
                initial={reduced ? false : { opacity: 0, x: -8 }}
                animate={reduced ? {} : { opacity: 1, x: 0 }}
                transition={
                  reduced ? {} : { duration: 0.3, delay: index * 0.1 }
                }
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                {event}
              </motion.div>
            ))}
            {strategy === "ISR" && revalidateSeconds > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                Revalidation scheduled in {revalidateSeconds}s
              </div>
            )}
          </div>
        </SpotlightTarget>
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

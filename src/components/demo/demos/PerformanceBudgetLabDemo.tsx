"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useMotionPrefs } from "../../motion/MotionPrefsProvider";
import { motion, AnimatePresence } from "framer-motion";
import { DemoShell } from "../DemoShell";
import { EventLog, EventLogEntry } from "../EventLog";
import { Spotlight, SpotlightTarget } from "../Spotlight";
import {
  performanceBudgetLabConfigSchema,
  type PerformanceBudgetLabConfig,
} from "../demoSchema";
import { z } from "zod";

interface PerformanceBudgetLabDemoProps {
  demoConfig: unknown;
  focusTarget?: string | null;
}

type Network = "FAST_4G" | "SLOW_4G";
type Device = "DESKTOP" | "MOBILE";
type ImageMode = "UNOPTIMIZED_JPEG" | "RESPONSIVE_WEBP" | "AVIF";
type Video = "NONE" | "MP4" | "HLS";
type Caching = "NONE" | "BROWSER" | "CDN" | "APP";
type Loading =
  | "DEFAULT"
  | "PRELOAD_KEY_ASSET"
  | "DEFER_NONCRITICAL"
  | "ROUTE_SPLIT";
type CLSRisk = "LOW" | "MEDIUM" | "HIGH";

interface Metrics {
  LCP_ms: number;
  INP_ms: number;
  CLS_score: number;
}

interface Breakdown {
  html_ms: number;
  css_ms: number;
  js_ms: number;
  images_ms: number;
  video_ms: number;
  mainThread_ms: number;
}

// Deterministic metric calculation based on current state
function calculateMetrics(
  network: Network,
  device: Device,
  jsKb: number,
  cssKb: number,
  imageMode: ImageMode,
  imageCount: number,
  video: Video,
  caching: Caching,
  loading: Loading,
  longTaskMs: number,
  clsRisk: CLSRisk
): { metrics: Metrics; breakdown: Breakdown; recommendations: string[] } {
  // Base network speeds (KB/s)
  const networkSpeed = network === "FAST_4G" ? 2000 : 400;
  const deviceFactor = device === "MOBILE" ? 1.5 : 1.0;

  // Calculate breakdown times
  const html_ms = 50 + (caching === "CDN" ? -20 : 0);
  const css_ms = Math.max(0, (cssKb / networkSpeed) * 1000 * deviceFactor);
  const js_ms =
    Math.max(0, (jsKb / networkSpeed) * 1000 * deviceFactor) +
    (loading === "DEFER_NONCRITICAL" ? -100 : 0) +
    (loading === "ROUTE_SPLIT" ? -150 : 0);

  // Image loading time
  let imageSizeKb = 0;
  if (imageMode === "UNOPTIMIZED_JPEG") imageSizeKb = 200;
  else if (imageMode === "RESPONSIVE_WEBP") imageSizeKb = 80;
  else if (imageMode === "AVIF") imageSizeKb = 50;

  const images_ms = Math.max(
    0,
    ((imageSizeKb * imageCount) / networkSpeed) * 1000 * deviceFactor
  );

  // Video loading time
  const video_ms =
    video === "NONE"
      ? 0
      : video === "MP4"
        ? Math.max(0, (1000 / networkSpeed) * 1000 * deviceFactor)
        : Math.max(0, (500 / networkSpeed) * 1000 * deviceFactor);

  // Main thread blocking (parsing + execution + long tasks)
  const mainThread_ms =
    js_ms * 0.3 + // JS parsing/execution overhead
    longTaskMs + // Long tasks
    (loading === "PRELOAD_KEY_ASSET" ? -50 : 0);

  // Calculate Core Web Vitals
  // LCP: Largest Contentful Paint (target: < 2500ms)
  let LCP_ms = html_ms + css_ms + images_ms;
  if (loading === "PRELOAD_KEY_ASSET") LCP_ms -= 100;
  if (caching === "CDN" || caching === "BROWSER") LCP_ms -= 150;
  if (imageMode === "AVIF") LCP_ms -= 200;
  LCP_ms = Math.max(500, LCP_ms);

  // INP: Interaction to Next Paint (target: < 200ms)
  let INP_ms = mainThread_ms + 50; // Base interaction delay
  if (loading === "ROUTE_SPLIT") INP_ms -= 80;
  if (longTaskMs > 50) INP_ms += longTaskMs * 0.5;
  INP_ms = Math.max(50, INP_ms);

  // CLS: Cumulative Layout Shift (target: < 0.1)
  let CLS_score = 0;
  if (clsRisk === "HIGH") CLS_score = 0.25;
  else if (clsRisk === "MEDIUM") CLS_score = 0.15;
  else CLS_score = 0.05;
  if (imageMode === "UNOPTIMIZED_JPEG" && imageCount > 6) CLS_score += 0.1;
  CLS_score = Math.min(1.0, CLS_score);

  // Generate recommendations
  const recommendations: string[] = [];
  if (LCP_ms > 2500)
    recommendations.push("LCP is too high. Optimize images or enable caching.");
  if (INP_ms > 200)
    recommendations.push("INP is too high. Reduce JavaScript or split routes.");
  if (CLS_score > 0.1)
    recommendations.push(
      "CLS is too high. Set image dimensions and avoid layout shifts."
    );
  if (jsKb > 300 && loading === "DEFAULT")
    recommendations.push("Large JS bundle. Consider code splitting.");
  if (imageMode === "UNOPTIMIZED_JPEG" && imageCount > 3)
    recommendations.push(
      "Use modern image formats (WebP/AVIF) for better compression."
    );
  if (longTaskMs > 100)
    recommendations.push(
      "Long tasks detected. Break up heavy JavaScript work."
    );
  if (caching === "NONE")
    recommendations.push("Enable caching (Browser/CDN) for repeat visits.");

  if (recommendations.length === 0) {
    recommendations.push("Performance looks good! All metrics within targets.");
  }

  return {
    metrics: { LCP_ms, INP_ms, CLS_score },
    breakdown: {
      html_ms,
      css_ms,
      js_ms,
      images_ms,
      video_ms,
      mainThread_ms,
    },
    recommendations,
  };
}

export function PerformanceBudgetLabDemo({
  demoConfig,
  focusTarget,
}: PerformanceBudgetLabDemoProps) {
  const { reduced } = useMotionPrefs();
  const [network, setNetwork] = useState<Network>("FAST_4G");
  const [device, setDevice] = useState<Device>("DESKTOP");
  const [jsKb, setJsKb] = useState(200);
  const [cssKb, setCssKb] = useState(50);
  const [imageMode, setImageMode] = useState<ImageMode>("UNOPTIMIZED_JPEG");
  const [imageCount, setImageCount] = useState(6);
  const [video, setVideo] = useState<Video>("NONE");
  const [caching, setCaching] = useState<Caching>("NONE");
  const [loading, setLoading] = useState<Loading>("DEFAULT");
  const [longTaskMs, setLongTaskMs] = useState(0);
  const [clsRisk, setClsRisk] = useState<CLSRisk>("LOW");
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  const [cameraPreset, setCameraPreset] = useState<
    "overview" | "closeup" | "side"
  >("overview");
  const [shouldRunSimulation, setShouldRunSimulation] = useState(false);
  const [lastChangedField, setLastChangedField] = useState<string | null>(null);

  // Validate and parse demo config
  const config = useMemo(() => {
    try {
      return performanceBudgetLabConfigSchema.parse(demoConfig);
    } catch (error) {
      console.error("Invalid demo config:", error);
      return null;
    }
  }, [demoConfig]);

  // Initialize defaults
  useEffect(() => {
    if (config?.defaults) {
      setNetwork(config.defaults.network);
      setDevice(config.defaults.device);
      setJsKb(config.defaults.jsKb);
      setCssKb(config.defaults.cssKb);
      setImageMode(config.defaults.imageMode);
      setImageCount(config.defaults.imageCount);
      setVideo(config.defaults.video);
      setCaching(config.defaults.caching);
      setLoading(config.defaults.loading);
      setLongTaskMs(config.defaults.longTaskMs);
      setClsRisk(config.defaults.clsRisk);
    }
  }, [config]);

  // Calculate metrics
  const { metrics, breakdown, recommendations } = useMemo(
    () =>
      calculateMetrics(
        network,
        device,
        jsKb,
        cssKb,
        imageMode,
        imageCount,
        video,
        caching,
        loading,
        longTaskMs,
        clsRisk
      ),
    [
      network,
      device,
      jsKb,
      cssKb,
      imageMode,
      imageCount,
      video,
      caching,
      loading,
      longTaskMs,
      clsRisk,
    ]
  );

  // Generate event lines
  const eventLines = useMemo(() => {
    const lines: string[] = [];
    if (jsKb > 300)
      lines.push(`JS ${jsKb}KB increases main thread parsing → INP worsened.`);
    if (imageMode === "AVIF")
      lines.push(`AVIF reduced image bytes → LCP improved.`);
    if (caching === "CDN" || caching === "BROWSER")
      lines.push(
        `${caching} caching improved repeat visit; first visit unchanged.`
      );
    if (loading === "ROUTE_SPLIT")
      lines.push(`Route splitting deferred non-critical JS → INP improved.`);
    if (longTaskMs > 50)
      lines.push(
        `Long task ${longTaskMs}ms blocking main thread → INP worsened.`
      );
    if (clsRisk === "HIGH")
      lines.push(
        `High CLS risk from missing dimensions → CLS score increased.`
      );
    return lines;
  }, [jsKb, imageMode, caching, loading, longTaskMs, clsRisk]);

  const handleChange = useCallback(
    (
      field:
        | "network"
        | "device"
        | "jsKb"
        | "cssKb"
        | "imageMode"
        | "imageCount"
        | "video"
        | "caching"
        | "loading"
        | "longTaskMs"
        | "clsRisk",
      value: string | number
    ) => {
      if (field === "network") setNetwork(value as Network);
      if (field === "device") setDevice(value as Device);
      if (field === "jsKb") setJsKb(value as number);
      if (field === "cssKb") setCssKb(value as number);
      if (field === "imageMode") setImageMode(value as ImageMode);
      if (field === "imageCount") setImageCount(value as number);
      if (field === "video") setVideo(value as Video);
      if (field === "caching") setCaching(value as Caching);
      if (field === "loading") setLoading(value as Loading);
      if (field === "longTaskMs") setLongTaskMs(value as number);
      if (field === "clsRisk") setClsRisk(value as CLSRisk);

      setLastChangedField(field);
      setShouldRunSimulation(true);

      // Add event log entry
      const explanation = `${field}=${value} → affects performance metrics`;
      const newEntry: EventLogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        cause: `${field}: ${value}`,
        decision: "Metrics recalculated",
        explanation,
      };
      setEventLog((prev) => [...prev, newEntry]);
    },
    []
  );

  const handleRunSimulation = useCallback(() => {
    setShouldRunSimulation(true);
    const newEntry: EventLogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      cause: "Run simulation",
      decision: "Simulation triggered",
      explanation: "Updating 3D visualization with current metrics",
    };
    setEventLog((prev) => [...prev, newEntry]);
  }, []);

  const handleSegmentClick = useCallback(
    (category: string, ms: number) => {
      // Find relevant recommendation
      const relevantRec = recommendations.find((rec) =>
        rec.toLowerCase().includes(category.toLowerCase())
      );
      const newEntry: EventLogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        cause: `Clicked ${category} segment`,
        decision: relevantRec || `How to improve ${category}`,
        explanation: `${category} takes ${ms.toFixed(0)}ms. ${relevantRec || "Consider optimization."}`,
      };
      setEventLog((prev) => [...prev, newEntry]);
    },
    [recommendations]
  );

  if (!config) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <p>Demo unavailable: Invalid configuration</p>
      </div>
    );
  }

  const totalDuration =
    breakdown.html_ms +
    breakdown.css_ms +
    breakdown.js_ms +
    breakdown.images_ms +
    breakdown.video_ms;

  const controls = (
    <div className="space-y-4">
      {/* View mode toggle */}
      <div className="space-y-2 pb-4 border-b border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          View Mode
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("2D")}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === "2D"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            2D
          </button>
          <button
            onClick={() => setViewMode("3D")}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === "3D"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            3D
          </button>
        </div>
        {viewMode === "3D" && (
          <button
            onClick={handleRunSimulation}
            className="w-full mt-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium transition-colors"
          >
            Run Simulation
          </button>
        )}
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
          <option value="FAST_4G">Fast 4G</option>
          <option value="SLOW_4G">Slow 4G</option>
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
          JS Size: {jsKb} KB
        </label>
        <input
          type="range"
          min="0"
          max="800"
          value={jsKb}
          onChange={(e) => handleChange("jsKb", Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          CSS Size: {cssKb} KB
        </label>
        <input
          type="range"
          min="0"
          max="300"
          value={cssKb}
          onChange={(e) => handleChange("cssKb", Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Image Mode
        </label>
        <select
          value={imageMode}
          onChange={(e) => handleChange("imageMode", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="UNOPTIMIZED_JPEG">JPEG (unoptimized)</option>
          <option value="RESPONSIVE_WEBP">WebP (responsive)</option>
          <option value="AVIF">AVIF</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Image Count: {imageCount}
        </label>
        <input
          type="range"
          min="1"
          max="12"
          value={imageCount}
          onChange={(e) => handleChange("imageCount", Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Video
        </label>
        <select
          value={video}
          onChange={(e) => handleChange("video", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="NONE">None</option>
          <option value="MP4">MP4</option>
          <option value="HLS">HLS</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Caching
        </label>
        <select
          value={caching}
          onChange={(e) => handleChange("caching", e.target.value)}
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
          Loading Strategy
        </label>
        <select
          value={loading}
          onChange={(e) => handleChange("loading", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="DEFAULT">Default</option>
          <option value="PRELOAD_KEY_ASSET">Preload key asset</option>
          <option value="DEFER_NONCRITICAL">Defer noncritical</option>
          <option value="ROUTE_SPLIT">Route split</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Long Task: {longTaskMs}ms
        </label>
        <input
          type="range"
          min="0"
          max="2000"
          value={longTaskMs}
          onChange={(e) => handleChange("longTaskMs", Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          CLS Risk
        </label>
        <select
          value={clsRisk}
          onChange={(e) => handleChange("clsRisk", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </div>
    </div>
  );

  // Metric gauge component (simple bar)
  const MetricGauge = ({
    label,
    value,
    target,
    unit,
    isGood,
  }: {
    label: string;
    value: number;
    target: number;
    unit: string;
    isGood: boolean;
  }) => {
    const percentage = Math.min(100, (value / target) * 100);
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          <span
            className={`text-sm font-bold ${
              isGood
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {value.toFixed(0)}
            {unit}
          </span>
        </div>
        <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={reduced ? false : { width: 0 }}
            animate={reduced ? {} : { width: `${percentage}%` }}
            transition={reduced ? {} : { duration: 0.5, ease: "easeOut" }}
            className={`h-full ${
              isGood
                ? "bg-green-500 dark:bg-green-400"
                : "bg-red-500 dark:bg-red-400"
            }`}
          />
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-yellow-500"
            style={{ left: `${(target / target) * 100}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Target: &lt;{target}
          {unit}
        </div>
      </div>
    );
  };

  // 2D Visualization
  const visualization2D = (
    <Spotlight targetId={focusTarget || null}>
      <div className="space-y-6">
        {/* Metrics Panel */}
        <SpotlightTarget id="metrics" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Core Web Vitals (Simulated Model)
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Values are simulated for educational purposes
            </span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-4">
            <MetricGauge
              label="LCP (Largest Contentful Paint)"
              value={metrics.LCP_ms}
              target={2500}
              unit="ms"
              isGood={metrics.LCP_ms < 2500}
            />
            <MetricGauge
              label="INP (Interaction to Next Paint)"
              value={metrics.INP_ms}
              target={200}
              unit="ms"
              isGood={metrics.INP_ms < 200}
            />
            <MetricGauge
              label="CLS (Cumulative Layout Shift)"
              value={metrics.CLS_score}
              target={0.1}
              unit=""
              isGood={metrics.CLS_score < 0.1}
            />
          </div>
          {recommendations.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h5 className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">
                Recommendations
              </h5>
              <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
                {recommendations.map((rec, i) => (
                  <li key={i}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </SpotlightTarget>

        {/* Waterfall/Breakdown Panel */}
        <SpotlightTarget id="waterfall" className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Resource Loading Breakdown
          </h4>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="space-y-3">
              {[
                { label: "HTML", ms: breakdown.html_ms, color: "bg-blue-500" },
                { label: "CSS", ms: breakdown.css_ms, color: "bg-purple-500" },
                { label: "JS", ms: breakdown.js_ms, color: "bg-yellow-500" },
                {
                  label: "Images",
                  ms: breakdown.images_ms,
                  color: "bg-green-500",
                },
                { label: "Video", ms: breakdown.video_ms, color: "bg-red-500" },
              ].map((item) => {
                const widthPercent =
                  totalDuration > 0 ? (item.ms / totalDuration) * 100 : 0;
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-700 dark:text-gray-300">
                        {item.label}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {item.ms.toFixed(0)}ms
                      </span>
                    </div>
                    <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                      <motion.div
                        initial={reduced ? false : { width: 0 }}
                        animate={reduced ? {} : { width: `${widthPercent}%` }}
                        transition={
                          reduced ? {} : { duration: 0.4, ease: "easeOut" }
                        }
                        className={`h-full ${item.color} dark:opacity-80`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
              Total: {totalDuration.toFixed(0)}ms
            </div>
          </div>
        </SpotlightTarget>

        {/* Main Thread Long Task Panel */}
        <SpotlightTarget id="mainthread" className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Main Thread Long Tasks
          </h4>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-700 dark:text-gray-300">
                  Main Thread Blocking
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {breakdown.mainThread_ms.toFixed(0)}ms
                </span>
              </div>
              <div className="relative h-12 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-1 bg-gray-300 dark:bg-gray-600" />
                </div>
                {longTaskMs > 0 && (
                  <motion.div
                    initial={reduced ? false : { width: 0, opacity: 0 }}
                    animate={
                      reduced
                        ? {}
                        : {
                            width: `${Math.min(100, (longTaskMs / 2000) * 100)}%`,
                            opacity: 1,
                          }
                    }
                    transition={
                      reduced ? {} : { duration: 0.4, ease: "easeOut" }
                    }
                    className="absolute top-2 bottom-2 left-0 bg-red-500 dark:bg-red-400 rounded"
                  />
                )}
                {longTaskMs > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-red-600 dark:text-red-400">
                    Long Task: {longTaskMs}ms
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Long tasks (&gt;50ms) block the main thread and worsen INP. This
                simulated task shows the impact.
              </div>
            </div>
          </div>
        </SpotlightTarget>
      </div>
    </Spotlight>
  );

  // 3D Visualization
  const visualization3D = (
    <div className="w-full h-[600px] bg-gray-900 rounded-lg overflow-hidden">
      <ThreeCanvasShell
        fallback={
          <Fallback2D message="3D visualization unavailable. Showing 2D view.">
            {visualization2D}
          </Fallback2D>
        }
      >
        <PerformanceTheaterScene
          metrics={metrics}
          breakdown={breakdown}
          longTaskMs={longTaskMs}
          caching={caching}
          imageMode={imageMode}
          focusTarget={focusTarget || null}
          onSegmentClick={handleSegmentClick}
          recommendations={recommendations}
          cameraPreset={cameraPreset}
          onCameraPresetChange={setCameraPreset}
        />
      </ThreeCanvasShell>
    </div>
  );

  return (
    <DemoShell
      controls={controls}
      visualization={viewMode === "3D" ? visualization3D : visualization2D}
      eventLog={<EventLog entries={eventLog} />}
    />
  );
}

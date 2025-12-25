"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useMotionPrefs } from "../../motion/MotionPrefsProvider";
import { motion, AnimatePresence } from "framer-motion";
import { DemoShell } from "../DemoShell";
import { EventLog, EventLogEntry } from "../EventLog";
import { Spotlight, SpotlightTarget } from "../Spotlight";
import {
  largeScaleUXLabConfigSchema,
  type LargeScaleUXLabConfig,
} from "../demoSchema";
import { z } from "zod";
import { ThreeCanvasShell } from "../../three/ThreeCanvasShell";
import { UXMegacityScene } from "../../three/UXMegacityScene";
import { Fallback2D } from "../../three/Fallback2D";

interface LargeScaleUXLabDemoProps {
  demoConfig: unknown;
  focusTarget?: string | null;
}

type Mode =
  | "VIRTUALIZATION"
  | "PAGINATION_SCROLL"
  | "SEARCH_RACES"
  | "FORMS_AUTOSAVE";
type RenderMode = "FULL_DOM" | "VIRTUALIZED";
type Strategy = "PAGINATION" | "INFINITE_SCROLL";
type Cancellation = "NONE" | "ABORT" | "IGNORE_STALE";
type ValidationMode = "ON_CHANGE" | "ON_BLUR" | "ON_SUBMIT";
type TypingSpeed = "SLOW" | "FAST";

interface SearchRequest {
  id: string;
  query: string;
  startTime: number;
  endTime?: number;
  canceled: boolean;
  ignored: boolean;
}

interface AutosaveEvent {
  id: string;
  timestamp: number;
  status: "saving" | "saved" | "queued" | "failed";
}

export function LargeScaleUXLabDemo({
  demoConfig,
  focusTarget,
}: LargeScaleUXLabDemoProps) {
  const { reduced } = useMotionPrefs();
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  const [cameraPreset, setCameraPreset] = useState<
    "overview" | "closeup" | "side"
  >("overview");
  const [mode, setMode] = useState<Mode>("VIRTUALIZATION");

  // Virtualization state
  const [itemCount, setItemCount] = useState(1000);
  const [renderMode, setRenderMode] = useState<RenderMode>("FULL_DOM");
  const [rowHeight, setRowHeight] = useState(40);
  const [overscan, setOverscan] = useState(5);
  const [scrollTop, setScrollTop] = useState(0);

  // Pagination/Infinite state
  const [strategy, setStrategy] = useState<Strategy>("PAGINATION");
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(500);
  const [currentPage, setCurrentPage] = useState(1);

  // Search races state
  const [queryLatencyMs, setQueryLatencyMs] = useState(500);
  const [typingSpeed, setTypingSpeed] = useState<TypingSpeed>("FAST");
  const [cancellation, setCancellation] = useState<Cancellation>("NONE");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchRequests, setSearchRequests] = useState<SearchRequest[]>([]);
  const [searchResults, setSearchResults] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  // Forms/Autosave state
  const [validationMode, setValidationMode] =
    useState<ValidationMode>("ON_CHANGE");
  const [autosave, setAutosave] = useState(true);
  const [autosaveIntervalMs, setAutosaveIntervalMs] = useState(2000);
  const [offline, setOffline] = useState(false);
  const [recovery, setRecovery] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [autosaveEvents, setAutosaveEvents] = useState<AutosaveEvent[]>([]);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const queuedSavesRef = useRef<
    Array<{ data: typeof formData; timestamp: number }>
  >([]);

  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);

  // Validate and parse demo config
  const config = useMemo(() => {
    try {
      return largeScaleUXLabConfigSchema.parse(demoConfig);
    } catch (error) {
      console.error("Invalid demo config:", error);
      return null;
    }
  }, [demoConfig]);

  // Initialize defaults
  useEffect(() => {
    if (config?.defaults) {
      setMode(config.defaults.mode);
      setItemCount(config.defaults.itemCount);
      setRenderMode(config.defaults.renderMode);
      setRowHeight(config.defaults.rowHeight);
      setOverscan(config.defaults.overscan);
      setStrategy(config.defaults.strategy);
      setPageSize(config.defaults.pageSize);
      setTotalItems(config.defaults.totalItems);
      setQueryLatencyMs(config.defaults.queryLatencyMs);
      setTypingSpeed(config.defaults.typingSpeed);
      setCancellation(config.defaults.cancellation);
      setValidationMode(config.defaults.validationMode);
      setAutosave(config.defaults.autosave);
      setAutosaveIntervalMs(config.defaults.autosaveIntervalMs);
      setOffline(config.defaults.offline);
      setRecovery(config.defaults.recovery);
    }
  }, [config]);

  // Find matching rule
  const currentRule = useMemo(() => {
    if (!config) return null;
    return (
      config.rules.find((rule) => {
        if (rule.mode && rule.mode !== mode) return false;
        if (rule.renderMode && rule.renderMode !== renderMode) return false;
        if (rule.strategy && rule.strategy !== strategy) return false;
        if (rule.cancellation && rule.cancellation !== cancellation)
          return false;
        if (rule.validationMode && rule.validationMode !== validationMode)
          return false;
        return true;
      }) || config.rules[0]
    );
  }, [config, mode, renderMode, strategy, cancellation, validationMode]);

  // Calculate virtualization stats
  const virtualizationStats = useMemo(() => {
    if (renderMode === "FULL_DOM") {
      return {
        domNodes: itemCount,
        renderCost: itemCount * 0.1,
        memoryScore: Math.max(0, 100 - itemCount / 100),
      };
    } else {
      const viewportHeight = 400;
      const visibleCount = Math.ceil(viewportHeight / rowHeight);
      const renderedCount = visibleCount + overscan * 2;
      return {
        domNodes: renderedCount,
        renderCost: renderedCount * 0.1,
        memoryScore: 100,
      };
    }
  }, [renderMode, itemCount, rowHeight, overscan]);

  // Calculate pagination stats
  const paginationStats = useMemo(() => {
    const totalPages = Math.ceil(totalItems / pageSize);
    return {
      currentPage,
      totalPages,
      startIndex: (currentPage - 1) * pageSize + 1,
      endIndex: Math.min(currentPage * pageSize, totalItems),
    };
  }, [currentPage, pageSize, totalItems]);

  // Handle search with race conditions
  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults("");
        return;
      }

      // Cancel previous request if needed
      if (cancellation === "ABORT" && abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const requestId = `req-${Date.now()}-${Math.random()}`;
      const startTime = Date.now();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const request: SearchRequest = {
        id: requestId,
        query,
        startTime,
        canceled: false,
        ignored: false,
      };

      setSearchRequests((prev) => [...prev, request]);

      // Simulate request
      setTimeout(() => {
        if (controller.signal.aborted) {
          setSearchRequests((prev) =>
            prev.map((r) =>
              r.id === requestId
                ? { ...r, canceled: true, endTime: Date.now() }
                : r
            )
          );
          return;
        }

        const endTime = Date.now();

        // Check if this request is stale (newer requests exist)
        setSearchRequests((prev) => {
          const isStale = prev.some(
            (r) =>
              r.id !== requestId &&
              r.startTime > startTime &&
              !r.canceled &&
              !r.ignored
          );

          if (cancellation === "IGNORE_STALE" && isStale) {
            return prev.map((r) =>
              r.id === requestId ? { ...r, ignored: true, endTime } : r
            );
          }

          const updated = prev.map((r) =>
            r.id === requestId ? { ...r, endTime } : r
          );

          // Only update results if this is the latest non-canceled, non-ignored request
          const latestRequest = updated
            .filter((r) => !r.canceled && !r.ignored && r.endTime)
            .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))[0];

          if (latestRequest && latestRequest.id === requestId) {
            setSearchResults(
              `Results for "${query}" (${endTime - startTime}ms)`
            );
          }

          return updated;
        });
      }, queryLatencyMs);
    },
    [cancellation, queryLatencyMs]
  );

  // Form validation
  const validateForm = useCallback((data: typeof formData) => {
    const errors: Record<string, string> = {};
    if (!data.name.trim()) errors.name = "Name is required";
    if (!data.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = "Invalid email format";
    }
    if (!data.message.trim()) errors.message = "Message is required";
    return errors;
  }, []);

  // Autosave logic
  useEffect(() => {
    if (!autosave || mode !== "FORMS_AUTOSAVE") return;

    const save = () => {
      if (offline) {
        queuedSavesRef.current.push({ data: formData, timestamp: Date.now() });
        setAutosaveEvents((prev) => [
          ...prev,
          { id: `save-${Date.now()}`, timestamp: Date.now(), status: "queued" },
        ]);
      } else {
        setAutosaveEvents((prev) => [
          ...prev,
          { id: `save-${Date.now()}`, timestamp: Date.now(), status: "saving" },
        ]);
        setTimeout(() => {
          setAutosaveEvents((prev) => {
            const last = prev[prev.length - 1];
            if (last) {
              return prev.map((e) =>
                e.id === last.id ? { ...e, status: "saved" as const } : e
              );
            }
            return prev;
          });
          setLastSaved(Date.now());
        }, 300);
      }
    };

    autosaveTimerRef.current = setInterval(save, autosaveIntervalMs);
    return () => {
      if (autosaveTimerRef.current) {
        clearInterval(autosaveTimerRef.current);
      }
    };
  }, [autosave, autosaveIntervalMs, formData, offline, mode]);

  // Handle offline recovery
  useEffect(() => {
    if (offline || !recovery) return;
    if (queuedSavesRef.current.length > 0) {
      const queued = queuedSavesRef.current;
      queuedSavesRef.current = [];
      queued.forEach((item) => {
        setAutosaveEvents((prev) => [
          ...prev,
          {
            id: `replay-${Date.now()}`,
            timestamp: Date.now(),
            status: "saving",
          },
        ]);
        setTimeout(() => {
          setAutosaveEvents((prev) => {
            const last = prev[prev.length - 1];
            if (last) {
              return prev.map((e) =>
                e.id === last.id ? { ...e, status: "saved" as const } : e
              );
            }
            return prev;
          });
        }, 300);
      });
    }
  }, [offline, recovery]);

  // Update event log
  useEffect(() => {
    if (!currentRule) return;
    const newEntries: EventLogEntry[] = [];

    if (mode === "VIRTUALIZATION") {
      newEntries.push({
        id: `virt-${Date.now()}`,
        timestamp: Date.now(),
        cause: `${renderMode} mode with ${itemCount} items`,
        decision: `${virtualizationStats.domNodes} DOM nodes`,
        explanation:
          currentRule.eventLines[0] ||
          "Virtualization reduces DOM nodes; overscan improves scroll smoothness but increases work.",
      });
    } else if (mode === "PAGINATION_SCROLL") {
      newEntries.push({
        id: `pag-${Date.now()}`,
        timestamp: Date.now(),
        cause: `${strategy} strategy`,
        decision: `Page ${currentPage} of ${paginationStats.totalPages}`,
        explanation:
          currentRule.eventLines[0] ||
          "Infinite scroll needs state restoration for back navigation.",
      });
    } else if (mode === "SEARCH_RACES") {
      if (searchRequests.length > 0) {
        const lastReq = searchRequests[searchRequests.length - 1];
        newEntries.push({
          id: `search-${Date.now()}`,
          timestamp: Date.now(),
          cause: `Query: "${lastReq.query}" (${cancellation})`,
          decision: lastReq.canceled
            ? "Canceled"
            : lastReq.ignored
              ? "Ignored (stale)"
              : "Completed",
          explanation:
            currentRule.eventLines[0] ||
            "Abort prevents wasted work; ignore-stale prevents UI regression but still costs network.",
        });
      }
    } else if (mode === "FORMS_AUTOSAVE") {
      if (autosaveEvents.length > 0) {
        const lastEvent = autosaveEvents[autosaveEvents.length - 1];
        newEntries.push({
          id: `form-${Date.now()}`,
          timestamp: Date.now(),
          cause: `Validation: ${validationMode}, Autosave: ${autosave ? "ON" : "OFF"}`,
          decision:
            lastEvent.status === "saved"
              ? "Saved"
              : lastEvent.status === "queued"
                ? "Queued"
                : "Saving",
          explanation:
            currentRule.eventLines[0] ||
            "OnChange validation gives immediate feedback but can be noisy. Autosave reduces loss; offline queue prevents data loss but needs conflict handling.",
        });
      }
    }

    if (newEntries.length > 0) {
      setEventLog((prev) => [...prev, ...newEntries].slice(-10));
    }
  }, [
    mode,
    renderMode,
    itemCount,
    strategy,
    currentPage,
    cancellation,
    searchRequests,
    validationMode,
    autosave,
    autosaveEvents,
    currentRule,
    virtualizationStats,
    paginationStats,
  ]);

  // Render controls
  const renderControls = () => {
    return (
      <div className="space-y-6">
        {/* View Mode Toggle (2D / 3D) */}
        <div>
          <label className="block text-sm font-medium mb-2">View Mode</label>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("2D")}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                viewMode === "2D"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              2D
            </button>
            <button
              onClick={() => setViewMode("3D")}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                viewMode === "3D"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              3D
            </button>
          </div>
        </div>

        {/* Mode selector */}
        <div>
          <label className="block text-sm font-medium mb-2">Mode</label>
          <div className="flex flex-col gap-2">
            {(
              [
                "VIRTUALIZATION",
                "PAGINATION_SCROLL",
                "SEARCH_RACES",
                "FORMS_AUTOSAVE",
              ] as Mode[]
            ).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-2 text-sm rounded border transition-colors ${
                  mode === m
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                }`}
              >
                {m.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Virtualization controls */}
        {mode === "VIRTUALIZATION" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">
                Item Count: {itemCount.toLocaleString()}
              </label>
              <input
                type="range"
                min="100"
                max="50000"
                step="100"
                value={itemCount}
                onChange={(e) => setItemCount(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Render Mode
              </label>
              <select
                value={renderMode}
                onChange={(e) => setRenderMode(e.target.value as RenderMode)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="FULL_DOM">Full DOM</option>
                <option value="VIRTUALIZED">Virtualized</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Row Height: {rowHeight}px
              </label>
              <input
                type="range"
                min="24"
                max="80"
                step="4"
                value={rowHeight}
                onChange={(e) => setRowHeight(Number(e.target.value))}
                className="w-full"
              />
            </div>
            {renderMode === "VIRTUALIZED" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Overscan: {overscan}
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={overscan}
                  onChange={(e) => setOverscan(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </>
        )}

        {/* Pagination/Infinite controls */}
        {mode === "PAGINATION_SCROLL" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Strategy</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as Strategy)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="PAGINATION">Pagination</option>
                <option value="INFINITE_SCROLL">Infinite Scroll</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Page Size: {pageSize}
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Total Items: {totalItems}
              </label>
              <input
                type="range"
                min="100"
                max="5000"
                step="50"
                value={totalItems}
                onChange={(e) => setTotalItems(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </>
        )}

        {/* Search races controls */}
        {mode === "SEARCH_RACES" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">
                Query Latency: {queryLatencyMs}ms
              </label>
              <input
                type="range"
                min="50"
                max="2000"
                step="50"
                value={queryLatencyMs}
                onChange={(e) => setQueryLatencyMs(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Typing Speed
              </label>
              <select
                value={typingSpeed}
                onChange={(e) => setTypingSpeed(e.target.value as TypingSpeed)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="SLOW">Slow</option>
                <option value="FAST">Fast</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Cancellation
              </label>
              <select
                value={cancellation}
                onChange={(e) =>
                  setCancellation(e.target.value as Cancellation)
                }
                className="w-full px-3 py-2 border rounded"
              >
                <option value="NONE">None</option>
                <option value="ABORT">Abort</option>
                <option value="IGNORE_STALE">Ignore Stale</option>
              </select>
            </div>
            <button
              onClick={() => {
                const demoQuery =
                  typingSpeed === "FAST"
                    ? "react hooks"
                    : "r...e...a...c...t...";
                let currentQuery = "";
                const chars = demoQuery.split("");
                chars.forEach((char, i) => {
                  setTimeout(
                    () => {
                      currentQuery += char;
                      setSearchQuery(currentQuery);
                      handleSearch(currentQuery);
                    },
                    i * (typingSpeed === "FAST" ? 100 : 300)
                  );
                });
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Type Demo Query
            </button>
          </>
        )}

        {/* Forms/Autosave controls */}
        {mode === "FORMS_AUTOSAVE" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">
                Validation Mode
              </label>
              <select
                value={validationMode}
                onChange={(e) =>
                  setValidationMode(e.target.value as ValidationMode)
                }
                className="w-full px-3 py-2 border rounded"
              >
                <option value="ON_CHANGE">On Change</option>
                <option value="ON_BLUR">On Blur</option>
                <option value="ON_SUBMIT">On Submit</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autosave"
                checked={autosave}
                onChange={(e) => setAutosave(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="autosave" className="text-sm">
                Autosave
              </label>
            </div>
            {autosave && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Autosave Interval: {autosaveIntervalMs}ms
                </label>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="100"
                  value={autosaveIntervalMs}
                  onChange={(e) =>
                    setAutosaveIntervalMs(Number(e.target.value))
                  }
                  className="w-full"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="offline"
                checked={offline}
                onChange={(e) => setOffline(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="offline" className="text-sm">
                Offline
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recovery"
                checked={recovery}
                onChange={(e) => setRecovery(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="recovery" className="text-sm">
                Recovery
              </label>
            </div>
          </>
        )}
      </div>
    );
  };

  // Render visualization
  const renderVisualization = () => {
    if (mode === "VIRTUALIZATION") {
      const viewportHeight = 400;
      const visibleCount = Math.ceil(viewportHeight / rowHeight);
      const renderedCount =
        renderMode === "FULL_DOM" ? itemCount : visibleCount + overscan * 2;
      const startIndex =
        renderMode === "VIRTUALIZED"
          ? Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
          : 0;

      return (
        <div className="space-y-4">
          <SpotlightTarget id="virtual.list">
            <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800">
              <div
                className="overflow-auto"
                style={{ height: viewportHeight }}
                onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
              >
                <div
                  style={{
                    height:
                      renderMode === "FULL_DOM"
                        ? itemCount * rowHeight
                        : itemCount * rowHeight,
                    position: "relative",
                  }}
                >
                  {Array.from({ length: renderedCount }).map((_, i) => {
                    const index =
                      renderMode === "VIRTUALIZED" ? startIndex + i : i;
                    if (index >= itemCount) return null;
                    return (
                      <motion.div
                        key={index}
                        initial={reduced ? false : { opacity: 0 }}
                        animate={reduced ? {} : { opacity: 1 }}
                        transition={reduced ? {} : { duration: 0.2 }}
                        style={{
                          height: rowHeight,
                          position:
                            renderMode === "VIRTUALIZED"
                              ? "absolute"
                              : "relative",
                          top:
                            renderMode === "VIRTUALIZED"
                              ? index * rowHeight
                              : undefined,
                          borderBottom: "1px solid #e5e7eb",
                          padding: "8px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        Item {index + 1}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </SpotlightTarget>
          <SpotlightTarget id="perf.panel">
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded">
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  DOM Nodes
                </div>
                <div className="text-lg font-bold">
                  {virtualizationStats.domNodes.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Render Cost
                </div>
                <div className="text-lg font-bold">
                  {virtualizationStats.renderCost.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Memory Score
                </div>
                <div className="text-lg font-bold">
                  {virtualizationStats.memoryScore.toFixed(0)}
                </div>
              </div>
            </div>
          </SpotlightTarget>
        </div>
      );
    }

    if (mode === "PAGINATION_SCROLL") {
      return (
        <div className="space-y-4">
          <SpotlightTarget id="scroll.strategy">
            {strategy === "PAGINATION" ? (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                  <div className="space-y-2">
                    {Array.from({
                      length: Math.min(
                        pageSize,
                        totalItems - (currentPage - 1) * pageSize
                      ),
                    }).map((_, i) => {
                      const index = (currentPage - 1) * pageSize + i;
                      return (
                        <motion.div
                          key={index}
                          initial={reduced ? false : { opacity: 0, x: -10 }}
                          animate={reduced ? {} : { opacity: 1, x: 0 }}
                          transition={reduced ? {} : { duration: 0.3 }}
                          className="p-2 border rounded"
                        >
                          Item {index + 1}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {currentPage} of {paginationStats.totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(paginationStats.totalPages, p + 1)
                      )
                    }
                    disabled={currentPage === paginationStats.totalPages}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 max-h-96 overflow-auto">
                <div className="space-y-2">
                  {Array.from({
                    length: Math.min(currentPage * pageSize, totalItems),
                  }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={reduced ? false : { opacity: 0, y: 10 }}
                      animate={reduced ? {} : { opacity: 1, y: 0 }}
                      transition={reduced ? {} : { duration: 0.2 }}
                      className="p-2 border rounded"
                    >
                      Item {i + 1}
                    </motion.div>
                  ))}
                  {currentPage * pageSize < totalItems && (
                    <button
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="w-full p-4 border-2 border-dashed rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Load More
                    </button>
                  )}
                </div>
              </div>
            )}
          </SpotlightTarget>
          {currentRule?.uxNotes && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
              <div className="text-sm font-medium mb-2">UX Notes</div>
              <ul className="text-sm space-y-1">
                {currentRule.uxNotes.map((note, i) => (
                  <li key={i}>• {note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (mode === "SEARCH_RACES") {
      return (
        <div className="space-y-4">
          <SpotlightTarget id="search.timeline">
            <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
              <div className="mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  placeholder="Type to search..."
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="space-y-2">
                {searchRequests.map((req) => (
                  <motion.div
                    key={req.id}
                    initial={reduced ? false : { opacity: 0, x: -20 }}
                    animate={
                      reduced
                        ? {}
                        : req.canceled
                          ? { opacity: 0.3, x: 0 }
                          : req.ignored
                            ? { opacity: 0.5, x: 0 }
                            : { opacity: 1, x: 0 }
                    }
                    transition={reduced ? {} : { duration: 0.3 }}
                    className={`p-3 border rounded ${
                      req.canceled
                        ? "bg-gray-100 dark:bg-gray-700 opacity-50"
                        : req.ignored
                          ? "bg-yellow-50 dark:bg-yellow-900/20"
                          : "bg-blue-50 dark:bg-blue-900/20"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{req.query}</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {req.canceled
                          ? "Canceled"
                          : req.ignored
                            ? "Ignored (stale)"
                            : req.endTime
                              ? `${req.endTime - req.startTime}ms`
                              : "Pending..."}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
              {searchResults && (
                <motion.div
                  initial={reduced ? false : { opacity: 0, y: 10 }}
                  animate={reduced ? {} : { opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded"
                >
                  {searchResults}
                </motion.div>
              )}
            </div>
          </SpotlightTarget>
        </div>
      );
    }

    if (mode === "FORMS_AUTOSAVE") {
      return (
        <div className="space-y-4">
          <SpotlightTarget id="form.panel">
            <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const newData = { ...formData, name: e.target.value };
                    setFormData(newData);
                    if (validationMode === "ON_CHANGE") {
                      setFormErrors(validateForm(newData));
                    }
                  }}
                  onBlur={() => {
                    if (validationMode === "ON_BLUR") {
                      setFormErrors(validateForm(formData));
                    }
                  }}
                  className="w-full px-3 py-2 border rounded"
                />
                {formErrors.name && (
                  <motion.p
                    initial={reduced ? false : { opacity: 0 }}
                    animate={reduced ? {} : { opacity: 1 }}
                    className="text-sm text-red-600 dark:text-red-400 mt-1"
                  >
                    {formErrors.name}
                  </motion.p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    const newData = { ...formData, email: e.target.value };
                    setFormData(newData);
                    if (validationMode === "ON_CHANGE") {
                      setFormErrors(validateForm(newData));
                    }
                  }}
                  onBlur={() => {
                    if (validationMode === "ON_BLUR") {
                      setFormErrors(validateForm(formData));
                    }
                  }}
                  className="w-full px-3 py-2 border rounded"
                />
                {formErrors.email && (
                  <motion.p
                    initial={reduced ? false : { opacity: 0 }}
                    animate={reduced ? {} : { opacity: 1 }}
                    className="text-sm text-red-600 dark:text-red-400 mt-1"
                  >
                    {formErrors.email}
                  </motion.p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => {
                    const newData = { ...formData, message: e.target.value };
                    setFormData(newData);
                    if (validationMode === "ON_CHANGE") {
                      setFormErrors(validateForm(newData));
                    }
                  }}
                  onBlur={() => {
                    if (validationMode === "ON_BLUR") {
                      setFormErrors(validateForm(formData));
                    }
                  }}
                  className="w-full px-3 py-2 border rounded"
                  rows={4}
                />
                {formErrors.message && (
                  <motion.p
                    initial={reduced ? false : { opacity: 0 }}
                    animate={reduced ? {} : { opacity: 1 }}
                    className="text-sm text-red-600 dark:text-red-400 mt-1"
                  >
                    {formErrors.message}
                  </motion.p>
                )}
              </div>
              <button
                onClick={() => {
                  const errors = validateForm(formData);
                  setFormErrors(errors);
                  if (Object.keys(errors).length === 0) {
                    alert("Form submitted!");
                  }
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit
              </button>
              {autosave && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {lastSaved
                    ? `Last saved: ${new Date(lastSaved).toLocaleTimeString()}`
                    : "Not saved yet"}
                  {offline && queuedSavesRef.current.length > 0 && (
                    <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                      ({queuedSavesRef.current.length} queued)
                    </span>
                  )}
                </div>
              )}
            </div>
          </SpotlightTarget>
          {autosaveEvents.length > 0 && (
            <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
              <div className="text-sm font-medium mb-2">Autosave Timeline</div>
              <div className="space-y-1">
                {autosaveEvents.slice(-5).map((event) => (
                  <motion.div
                    key={event.id}
                    initial={reduced ? false : { opacity: 0, x: -10 }}
                    animate={reduced ? {} : { opacity: 1, x: 0 }}
                    className={`text-xs p-2 rounded ${
                      event.status === "saved"
                        ? "bg-green-50 dark:bg-green-900/20"
                        : event.status === "queued"
                          ? "bg-yellow-50 dark:bg-yellow-900/20"
                          : "bg-gray-50 dark:bg-gray-700"
                    }`}
                  >
                    {new Date(event.timestamp).toLocaleTimeString()} -{" "}
                    {event.status}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // Render 3D visualization
  const renderVisualization3D = () => {
    return (
      <ThreeCanvasShell
        className="w-full h-[600px] rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700"
        fallback={
          <Fallback2D message="3D unavailable, showing 2D view">
            {renderVisualization()}
          </Fallback2D>
        }
      >
        <UXMegacityScene
          mode={mode}
          focusTarget={focusTarget}
          renderMode={renderMode}
          itemCount={itemCount}
          rowHeight={rowHeight}
          overscan={overscan}
          scrollTop={scrollTop}
          perfStats={virtualizationStats}
          strategy={strategy}
          currentPage={currentPage}
          totalPages={paginationStats.totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          searchRequests={searchRequests}
          cancellation={cancellation}
          queryLatencyMs={queryLatencyMs}
          autosaveEvents={autosaveEvents}
          offline={offline}
          recovery={recovery}
          queuedCount={queuedSavesRef.current.length}
          lastSaved={lastSaved}
          onScroll={() => {
            // Trigger scroll animation
            setScrollTop((prev) => Math.min(prev + 100, itemCount * rowHeight));
          }}
          onNextPage={() => {
            setCurrentPage((p) => Math.min(paginationStats.totalPages, p + 1));
          }}
          onLoadMore={() => {
            setCurrentPage((p) => p + 1);
          }}
          onRequestBurst={() => {
            const demoQuery =
              typingSpeed === "FAST" ? "react hooks" : "r...e...a...c...t...";
            let currentQuery = "";
            const chars = demoQuery.split("");
            chars.forEach((char, i) => {
              setTimeout(
                () => {
                  currentQuery += char;
                  setSearchQuery(currentQuery);
                  handleSearch(currentQuery);
                },
                i * (typingSpeed === "FAST" ? 100 : 300)
              );
            });
          }}
          onEditField={() => {
            setFormData((prev) => ({
              ...prev,
              name: prev.name + "x",
            }));
          }}
          onSimulateRefresh={() => {
            if (recovery && lastSaved) {
              // Simulate recovery
              setFormData({
                name: "Recovered",
                email: "recovered@example.com",
                message: "Recovered message",
              });
            }
          }}
          onGoOffline={() => setOffline(true)}
          onGoOnline={() => setOffline(false)}
          cameraPreset={cameraPreset}
          onCameraPresetChange={setCameraPreset}
        />
      </ThreeCanvasShell>
    );
  };

  if (!config) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <p>Demo unavailable: Invalid configuration</p>
      </div>
    );
  }

  return (
    <Spotlight targetId={focusTarget || null}>
      <DemoShell
        controls={renderControls()}
        visualization={
          viewMode === "3D" ? renderVisualization3D() : renderVisualization()
        }
        eventLog={<EventLog entries={eventLog} />}
      />
    </Spotlight>
  );
}

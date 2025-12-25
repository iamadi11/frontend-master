"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useMotionPrefs } from "../../motion/MotionPrefsProvider";
import { motion } from "framer-motion";
import { DemoShell } from "../DemoShell";
import { EventLog, EventLogEntry } from "../EventLog";
import { Spotlight } from "../Spotlight";
import {
  observabilityLabConfigSchema,
  type ObservabilityLabConfig,
} from "../demoSchema";
import { TelemetryPipeline } from "../TelemetryPipeline";
import { SamplingPanel } from "../SamplingPanel";
import { ErrorBoundarySim } from "../ErrorBoundarySim";
import { ThreeCanvasShell } from "../../three/ThreeCanvasShell";
import { ObservabilityControlRoomScene } from "../../three/ObservabilityControlRoomScene";

interface ObservabilityLabDemoProps {
  demoConfig: unknown;
  focusTarget?: string | null;
}

type Mode = "PIPELINE" | "SAMPLING_PRIVACY" | "ERROR_BOUNDARY";
type Signal = "LOG" | "METRIC" | "TRACE";
type ErrorType =
  | "NONE"
  | "RENDER_ERROR"
  | "EVENT_HANDLER_ERROR"
  | "ASYNC_ERROR";
type BoundaryStrategy = "NONE" | "PAGE_BOUNDARY" | "WIDGET_BOUNDARY";
type Volume = "LOW" | "MEDIUM" | "HIGH";

export function ObservabilityLabDemo({
  demoConfig,
  focusTarget,
}: ObservabilityLabDemoProps) {
  const { reduced } = useMotionPrefs();
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  const [mode, setMode] = useState<Mode>("PIPELINE");
  const [signal, setSignal] = useState<Signal>("LOG");
  const [volume, setVolume] = useState<Volume>("LOW");
  const [sampleRate, setSampleRate] = useState(1.0);
  const [redactPII, setRedactPII] = useState(false);
  const [replayEnabled, setReplayEnabled] = useState(false);
  const [errorType, setErrorType] = useState<ErrorType>("NONE");
  const [boundaryStrategy, setBoundaryStrategy] =
    useState<BoundaryStrategy>("NONE");
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [activePipelineStep, setActivePipelineStep] = useState<string | null>(
    null
  );
  const [eventPackets, setEventPackets] = useState<
    Array<{ id: string; stepId: string; signalType: Signal }>
  >([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Validate and parse demo config
  const config = useMemo(() => {
    try {
      return observabilityLabConfigSchema.parse(demoConfig);
    } catch (error) {
      console.error("Invalid demo config:", error);
      return null;
    }
  }, [demoConfig]);

  // Initialize defaults
  useEffect(() => {
    if (config?.defaults) {
      setMode(config.defaults.mode);
      setSignal(config.defaults.signal);
      setVolume(config.defaults.volume);
      setSampleRate(config.defaults.sampleRate);
      setRedactPII(config.defaults.redactPII);
      setReplayEnabled(config.defaults.replayEnabled);
      setErrorType(config.defaults.errorType);
      setBoundaryStrategy(config.defaults.boundaryStrategy);
    }
  }, [config]);

  // Compute pipeline steps with status
  const pipelineSteps = useMemo(() => {
    if (!config) return [];
    return config.pipelineSteps.map((step) => ({
      id: step.step.toLowerCase().replace(/\s+/g, "-"),
      label: step.step,
      status: step.status as "PENDING" | "PROCESSING" | "COMPLETE" | "ERROR",
    }));
  }, [config]);

  // Compute dropped events percentage
  const droppedEventsPct = useMemo(() => {
    if (!config) return 0;
    return config.droppedEventsPct;
  }, [config]);

  // Compute privacy notes
  const privacyNotes = useMemo(() => {
    if (!config) return [];
    const notes = [...config.privacyNotes];
    if (redactPII) {
      notes.push("PII fields (email, phone, SSN) are redacted in logs");
    }
    if (replayEnabled) {
      notes.push(
        "Session replay captures user interactions - ensure GDPR compliance"
      );
      notes.push("Consider masking sensitive input fields in replay");
    }
    return notes;
  }, [config, redactPII, replayEnabled]);

  // Compute error flow
  const errorFlow = useMemo(() => {
    if (!config || !hasError) return [];
    return config.errorFlow.map((step) => {
      if (step.phase === "current") {
        if (hasError && boundaryStrategy !== "NONE") {
          return {
            ...step,
            uiState:
              boundaryStrategy === "PAGE_BOUNDARY"
                ? "Page fallback UI"
                : "Widget fallback UI",
          };
        }
      }
      return step;
    });
  }, [config, hasError, boundaryStrategy]);

  // Handle sending event (Pipeline mode)
  const handleSendEvent = useCallback(() => {
    if (!config || mode !== "PIPELINE") return;

    const newTotal = totalEvents + 1;
    setTotalEvents(newTotal);

    // Animate packet through pipeline
    const steps = pipelineSteps;
    if (steps.length === 0) return;

    const currentStepIndex = 0;
    const packetId = `packet-${Date.now()}-${Math.random()}`;

    const animateStep = (index: number) => {
      if (index >= steps.length) {
        setActivePipelineStep(null);
        setEventPackets((prev) => prev.filter((p) => p.id !== packetId));
        return;
      }

      const step = steps[index];
      setActivePipelineStep(step.id);
      setEventPackets((prev) => [
        ...prev,
        { id: packetId, stepId: step.id, signalType: signal },
      ]);

      setTimeout(
        () => {
          animateStep(index + 1);
        },
        reduced ? 0 : 800
      );
    };

    animateStep(0);

    // Add event log entry
    const signalDesc =
      signal === "LOG"
        ? "high cardinality messages"
        : signal === "METRIC"
          ? "aggregated counters/gauges"
          : "spans with parent/child relationships";
    const newEntry: EventLogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      cause: `Signal: ${signal}`,
      decision: `Event sent through pipeline`,
      explanation: `${signal} selected → emits ${signalDesc}; useful for ${
        signal === "LOG"
          ? "debugging and audit trails"
          : signal === "METRIC"
            ? "performance monitoring"
            : "latency root-cause analysis"
      }.`,
    };
    setEventLog((prev) => [...prev, newEntry]);
  }, [config, mode, signal, pipelineSteps, totalEvents, reduced]);

  // Handle burst events
  const handleBurst = useCallback(() => {
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        handleSendEvent();
      }, i * 200);
    }
  }, [handleSendEvent]);

  // Handle triggering error (Error Boundary mode)
  const handleTriggerError = useCallback(() => {
    if (mode !== "ERROR_BOUNDARY") return;

    setHasError(true);

    const errorDesc =
      errorType === "RENDER_ERROR"
        ? "Component render error"
        : errorType === "EVENT_HANDLER_ERROR"
          ? "Event handler error"
          : "Async operation error";

    const boundaryDesc =
      boundaryStrategy === "NONE"
        ? "No boundary → page crashed"
        : boundaryStrategy === "PAGE_BOUNDARY"
          ? "Page boundary caught → entire page fallback"
          : "Widget boundary caught → widget fallback, page continues";

    const newEntry: EventLogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      cause: `Error: ${errorType}`,
      decision: boundaryDesc,
      explanation: `${errorDesc} occurred. ${boundaryStrategy === "WIDGET_BOUNDARY" ? "Widget boundary contained blast radius; page kept working." : boundaryStrategy === "PAGE_BOUNDARY" ? "Page boundary caught error; showing fallback UI." : "No boundary present; error propagated and crashed the page."}`,
    };
    setEventLog((prev) => [...prev, newEntry]);
  }, [mode, errorType, boundaryStrategy]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setHasError(false);
    const newEntry: EventLogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      cause: "Retry clicked",
      decision: "Error cleared, UI recovered",
      explanation:
        "User triggered retry; error state cleared and UI returned to normal.",
    };
    setEventLog((prev) => [...prev, newEntry]);
  }, []);

  // Handle sample rate change
  const handleSampleRateChange = useCallback(
    (newRate: number) => {
      setSampleRate(newRate);
      if (config) {
        const newEntry: EventLogEntry = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          cause: `SampleRate: ${(newRate * 100).toFixed(0)}%`,
          decision: `${((1 - newRate) * 100).toFixed(0)}% events dropped`,
          explanation: `SampleRate=${newRate.toFixed(2)} → reduced cost but may miss rare errors.`,
        };
        setEventLog((prev) => [...prev, newEntry]);
      }
    },
    [config]
  );

  // Handle privacy toggles
  const handleRedactPIIChange = useCallback(
    (enabled: boolean) => {
      setRedactPII(enabled);
      if (config) {
        const newEntry: EventLogEntry = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          cause: `RedactPII: ${enabled ? "ON" : "OFF"}`,
          decision: enabled
            ? "PII redaction enabled"
            : "PII redaction disabled",
          explanation: enabled
            ? "Redaction ON → safer logs, but less debugging detail."
            : "Redaction OFF → full logs available, but privacy risk.",
        };
        setEventLog((prev) => [...prev, newEntry]);
      }
    },
    [config]
  );

  const handleReplayEnabledChange = useCallback(
    (enabled: boolean) => {
      setReplayEnabled(enabled);
      if (config) {
        const newEntry: EventLogEntry = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          cause: `SessionReplay: ${enabled ? "ENABLED" : "DISABLED"}`,
          decision: enabled
            ? "Session replay enabled"
            : "Session replay disabled",
          explanation: enabled
            ? "Session replay captures user interactions - ensure GDPR compliance and consider masking sensitive fields."
            : "Session replay disabled - reduced privacy risk but less debugging capability.",
        };
        setEventLog((prev) => [...prev, newEntry]);
      }
    },
    [config]
  );

  // Handle packet completion in 3D mode
  const handlePacketComplete = useCallback((packetId: string) => {
    setEventPackets((prev) => prev.filter((p) => p.id !== packetId));
  }, []);

  // Handle sampling completion in 3D mode
  const handleSamplingComplete = useCallback(() => {
    // Sampling animation completed
  }, []);

  if (!config) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <p>Demo unavailable: Invalid configuration</p>
      </div>
    );
  }

  const controls = (
    <div className="space-y-4">
      {/* View Mode Toggle (2D / 3D) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          View Mode
        </label>
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

      {/* Mode Tabs */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Mode
        </label>
        <div className="flex gap-2">
          {(["PIPELINE", "SAMPLING_PRIVACY", "ERROR_BOUNDARY"] as Mode[]).map(
            (m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  mode === m
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {m === "PIPELINE"
                  ? "Pipeline"
                  : m === "SAMPLING_PRIVACY"
                    ? "Sampling"
                    : "Error"}
              </button>
            )
          )}
        </div>
      </div>

      {/* Pipeline Mode Controls */}
      {mode === "PIPELINE" && (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Signal Type
            </label>
            <select
              value={signal}
              onChange={(e) => setSignal(e.target.value as Signal)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="LOG">Log</option>
              <option value="METRIC">Metric</option>
              <option value="TRACE">Trace</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Volume
            </label>
            <select
              value={volume}
              onChange={(e) => setVolume(e.target.value as Volume)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSendEvent}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Send Event
            </button>
            <button
              onClick={handleBurst}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
            >
              Burst x10
            </button>
          </div>
        </>
      )}

      {/* Sampling & Privacy Mode Controls */}
      {mode === "SAMPLING_PRIVACY" && (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sample Rate: {(sampleRate * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={sampleRate}
              onChange={(e) => handleSampleRateChange(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={redactPII}
                onChange={(e) => handleRedactPIIChange(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Redact PII
              </span>
            </label>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={replayEnabled}
                onChange={(e) => handleReplayEnabledChange(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Session Replay Enabled
              </span>
            </label>
          </div>
        </>
      )}

      {/* Error Boundary Mode Controls */}
      {mode === "ERROR_BOUNDARY" && (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Error Type
            </label>
            <select
              value={errorType}
              onChange={(e) => setErrorType(e.target.value as ErrorType)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="NONE">None</option>
              <option value="RENDER_ERROR">Render Error</option>
              <option value="EVENT_HANDLER_ERROR">Event Handler Error</option>
              <option value="ASYNC_ERROR">Async Error</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Boundary Strategy
            </label>
            <select
              value={boundaryStrategy}
              onChange={(e) =>
                setBoundaryStrategy(e.target.value as BoundaryStrategy)
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="NONE">None</option>
              <option value="PAGE_BOUNDARY">Page Boundary</option>
              <option value="WIDGET_BOUNDARY">Widget Boundary</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleTriggerError}
              disabled={errorType === "NONE"}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Trigger Error
            </button>
            <button
              onClick={handleRetry}
              disabled={!hasError}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Retry
            </button>
          </div>
        </>
      )}
    </div>
  );

  const visualization =
    viewMode === "3D" ? (
      <ThreeCanvasShell
        className="w-full h-[500px] rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700"
        fallback={
          <Spotlight targetId={focusTarget || null}>
            <div className="space-y-6">
              {mode === "PIPELINE" && (
                <TelemetryPipeline
                  steps={pipelineSteps}
                  activeStepId={activePipelineStep}
                  eventPackets={eventPackets}
                />
              )}

              {mode === "SAMPLING_PRIVACY" && (
                <SamplingPanel
                  sampleRate={sampleRate}
                  droppedEventsPct={droppedEventsPct}
                  totalEvents={totalEvents || 100}
                  redactPII={redactPII}
                  replayEnabled={replayEnabled}
                  privacyNotes={privacyNotes}
                />
              )}

              {mode === "ERROR_BOUNDARY" && (
                <ErrorBoundarySim
                  errorType={errorType}
                  boundaryStrategy={boundaryStrategy}
                  errorFlow={errorFlow}
                  hasError={hasError}
                />
              )}
            </div>
          </Spotlight>
        }
      >
        <ObservabilityControlRoomScene
          config={config}
          mode={mode}
          signal={signal}
          sampleRate={sampleRate}
          redactPII={redactPII}
          replayEnabled={replayEnabled}
          errorType={errorType}
          boundaryStrategy={boundaryStrategy}
          hasError={hasError}
          activePipelineStepId={activePipelineStep}
          eventPackets={eventPackets}
          focusTarget={focusTarget}
          onPacketComplete={handlePacketComplete}
          onSamplingComplete={handleSamplingComplete}
        />
      </ThreeCanvasShell>
    ) : (
      <Spotlight targetId={focusTarget || null}>
        <div className="space-y-6">
          {mode === "PIPELINE" && (
            <TelemetryPipeline
              steps={pipelineSteps}
              activeStepId={activePipelineStep}
              eventPackets={eventPackets}
            />
          )}

          {mode === "SAMPLING_PRIVACY" && (
            <SamplingPanel
              sampleRate={sampleRate}
              droppedEventsPct={droppedEventsPct}
              totalEvents={totalEvents || 100}
              redactPII={redactPII}
              replayEnabled={replayEnabled}
              privacyNotes={privacyNotes}
            />
          )}

          {mode === "ERROR_BOUNDARY" && (
            <ErrorBoundarySim
              errorType={errorType}
              boundaryStrategy={boundaryStrategy}
              errorFlow={errorFlow}
              hasError={hasError}
            />
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

"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useMotionPrefs } from "../../motion/MotionPrefsProvider";
import { motion, AnimatePresence } from "framer-motion";
import { DemoShell } from "../DemoShell";
import { EventLog, EventLogEntry } from "../EventLog";
import { Spotlight, SpotlightTarget } from "../Spotlight";
import {
  realtimeSystemsLabConfigSchema,
  type RealtimeSystemsLabConfig,
} from "../demoSchema";

interface RealtimeSystemsLabDemoProps {
  demoConfig: unknown;
  focusTarget?: string | null;
}

type Protocol = "SSE" | "WEBSOCKET";
type Network = "STABLE" | "FLAKY" | "DISCONNECTED";
type PayloadSize = "SMALL" | "MEDIUM" | "LARGE";
type Backpressure = "NONE" | "BATCH" | "THROTTLE" | "DROP_OLD" | "ACK_WINDOW";
type ReconnectStrategy = "NONE" | "AUTO_RECONNECT" | "RECONNECT_WITH_REPLAY";
type SyncModel = "PUSH_ONLY" | "PUSH_PULL" | "CLIENT_PREDICT";
type ConflictMode = "NONE" | "LAST_WRITE_WINS" | "MANUAL_MERGE";

interface Message {
  id: string;
  timestamp: number;
  payload: string;
  direction: "server-to-client" | "client-to-server";
  status: "pending" | "in-flight" | "delivered" | "dropped";
}

interface ConflictState {
  field: string;
  clientAValue: string;
  clientBValue: string;
  resolved?: boolean;
  resolvedValue?: string;
}

export function RealtimeSystemsLabDemo({
  demoConfig,
  focusTarget,
}: RealtimeSystemsLabDemoProps) {
  const { reduced } = useMotionPrefs();
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  const [cameraPreset, setCameraPreset] = useState<
    "overview" | "closeup" | "side"
  >("overview");
  const [protocol, setProtocol] = useState<Protocol>("SSE");
  const [network, setNetwork] = useState<Network>("STABLE");
  const [msgRatePerSec, setMsgRatePerSec] = useState(10);
  const [payloadSize, setPayloadSize] = useState<PayloadSize>("SMALL");
  const [backpressure, setBackpressure] = useState<Backpressure>("NONE");
  const [batchWindowMs, setBatchWindowMs] = useState(500);
  const [reconnectStrategy, setReconnectStrategy] =
    useState<ReconnectStrategy>("AUTO_RECONNECT");
  const [replayWindow, setReplayWindow] = useState(50);
  const [syncModel, setSyncModel] = useState<SyncModel>("PUSH_ONLY");
  const [conflictMode, setConflictMode] = useState<ConflictMode>("NONE");
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [bufferDepth, setBufferDepth] = useState(0);
  const [droppedMsgsPct, setDroppedMsgsPct] = useState(0);
  const [latencyMs, setLatencyMs] = useState(0);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [conflictState, setConflictState] = useState<ConflictState | null>(
    null
  );
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [clientAState, setClientAState] = useState("Initial value");
  const [clientBState, setClientBState] = useState("Initial value");
  const [serverState, setServerState] = useState("Initial value");
  const [lastEditFrom, setLastEditFrom] = useState<"A" | "B" | null>(null);

  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const batchBufferRef = useRef<Message[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ackWindowRef = useRef<Set<string>>(new Set());
  const messageCounterRef = useRef(0);

  // Validate and parse demo config
  const config = useMemo(() => {
    try {
      return realtimeSystemsLabConfigSchema.parse(demoConfig);
    } catch (error) {
      console.error("Invalid demo config:", error);
      return null;
    }
  }, [demoConfig]);

  // Initialize defaults
  useEffect(() => {
    if (config?.defaults) {
      setProtocol(config.defaults.protocol);
      setNetwork(config.defaults.network);
      setMsgRatePerSec(config.defaults.msgRatePerSec);
      setPayloadSize(config.defaults.payloadSize);
      setBackpressure(config.defaults.backpressure);
      setBatchWindowMs(config.defaults.batchWindowMs);
      setReconnectStrategy(config.defaults.reconnectStrategy);
      setReplayWindow(config.defaults.replayWindow);
      setSyncModel(config.defaults.syncModel);
      setConflictMode(config.defaults.conflictMode);
    }
  }, [config]);

  // Find matching rule
  const currentRule = useMemo(() => {
    if (!config) return null;

    return (
      config.rules.find((rule) => {
        if (rule.protocol && rule.protocol !== protocol) return false;
        if (rule.network && rule.network !== network) return false;
        if (rule.backpressure && rule.backpressure !== backpressure)
          return false;
        if (
          rule.reconnectStrategy &&
          rule.reconnectStrategy !== reconnectStrategy
        )
          return false;
        if (rule.syncModel && rule.syncModel !== syncModel) return false;
        if (rule.conflictMode && rule.conflictMode !== conflictMode)
          return false;
        return true;
      }) || config.rules[0]
    );
  }, [
    config,
    protocol,
    network,
    backpressure,
    reconnectStrategy,
    syncModel,
    conflictMode,
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

  // Process batch
  const processBatch = useCallback(() => {
    if (batchBufferRef.current.length === 0) return;

    const batch = [...batchBufferRef.current];
    batchBufferRef.current = [];

    batch.forEach((msg) => {
      setMessages((prev) => [
        ...prev,
        { ...msg, status: "delivered" as const },
      ]);
    });

    addLogEntry(
      "Batching enabled",
      `Batch of ${batch.length} messages delivered`,
      `Messages grouped into batch window (${batchWindowMs}ms) to reduce overhead`
    );
  }, [batchWindowMs, addLogEntry]);

  // Handle message stream
  useEffect(() => {
    if (!isStreaming || network === "DISCONNECTED") {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
      }
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = null;
      }
      return;
    }

    const interval = 1000 / msgRatePerSec;
    streamIntervalRef.current = setInterval(() => {
      const currentNetwork = network;
      if (currentNetwork === "FLAKY") {
        // Simulate flaky network - drop some messages
        if (Math.random() < 0.3) {
          const droppedMsg: Message = {
            id: `msg-${messageCounterRef.current++}`,
            timestamp: Date.now(),
            payload: `Message ${messageCounterRef.current}`,
            direction: "server-to-client",
            status: "dropped",
          };
          setDroppedMsgsPct((prev) => prev + 1 / msgRatePerSec);
          addLogEntry(
            "Network FLAKY",
            "Message dropped",
            "Network instability caused message loss"
          );
          return;
        }
      }

      const newMsg: Message = {
        id: `msg-${messageCounterRef.current++}`,
        timestamp: Date.now(),
        payload: `Message ${messageCounterRef.current}`,
        direction: "server-to-client",
        status: "in-flight",
      };

      setLastEventId(newMsg.id);

      // Handle backpressure strategies
      if (backpressure === "BATCH") {
        batchBufferRef.current.push(newMsg);
        if (!batchTimeoutRef.current) {
          batchTimeoutRef.current = setTimeout(processBatch, batchWindowMs);
        }
      } else if (backpressure === "THROTTLE") {
        // Throttle: only process if buffer is low
        if (bufferDepth < 10) {
          setMessages((prev) => [...prev, { ...newMsg, status: "delivered" }]);
        } else {
          setDroppedMsgsPct((prev) => prev + 1 / msgRatePerSec);
          addLogEntry(
            "Throttling active",
            "Message dropped",
            "Buffer full; throttling drops incoming messages"
          );
        }
      } else if (backpressure === "DROP_OLD") {
        // Drop old: remove oldest if buffer is full
        if (bufferDepth >= 20) {
          setMessages((prev) => {
            const updated = [...prev];
            const oldest = updated.findIndex((m) => m.status === "pending");
            if (oldest !== -1) {
              updated[oldest] = { ...updated[oldest], status: "dropped" };
            }
            return [...updated, { ...newMsg, status: "pending" }];
          });
          addLogEntry(
            "Drop old strategy",
            "Oldest message dropped",
            "Buffer full; dropping oldest message to make room"
          );
        } else {
          setMessages((prev) => [...prev, { ...newMsg, status: "pending" }]);
        }
      } else if (backpressure === "ACK_WINDOW") {
        // Ack window: limit unacked messages
        if (ackWindowRef.current.size < replayWindow) {
          ackWindowRef.current.add(newMsg.id);
          setMessages((prev) => [...prev, { ...newMsg, status: "pending" }]);
        } else {
          setDroppedMsgsPct((prev) => prev + 1 / msgRatePerSec);
          addLogEntry(
            "Ack window full",
            "Message dropped",
            `Ack window (${replayWindow}) full; waiting for acks before accepting new messages`
          );
        }
      } else {
        // NONE: no backpressure
        setMessages((prev) => [...prev, { ...newMsg, status: "delivered" }]);
      }

      // Update buffer depth
      setBufferDepth((prev) => {
        const newDepth = prev + 1;
        if (newDepth > 0 && backpressure !== "NONE") {
          setTimeout(() => {
            setBufferDepth((current) => Math.max(0, current - 1));
          }, 100);
        }
        return newDepth;
      });

      // Simulate latency
      const payloadSizeMultiplier =
        payloadSize === "SMALL" ? 1 : payloadSize === "MEDIUM" ? 2 : 3;
      setLatencyMs((prev) => {
        const baseLatency = 50 + msgRatePerSec * 2;
        return baseLatency * payloadSizeMultiplier;
      });
    }, interval);

    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, [
    isStreaming,
    network,
    msgRatePerSec,
    backpressure,
    batchWindowMs,
    replayWindow,
    payloadSize,
    processBatch,
    bufferDepth,
    addLogEntry,
  ]);

  // Handle reconnection
  useEffect(() => {
    if (
      network === "DISCONNECTED" &&
      reconnectStrategy !== "NONE" &&
      !isReconnecting
    ) {
      setIsReconnecting(true);
      setReconnectAttempts(0);

      const attemptReconnect = () => {
        setReconnectAttempts((prev) => prev + 1);
        addLogEntry(
          "Network disconnected",
          `Reconnect attempt ${reconnectAttempts + 1}`,
          "Attempting to reconnect..."
        );

        setTimeout(() => {
          if (Math.random() > 0.3) {
            // Simulate successful reconnect
            setNetwork("STABLE");
            setIsReconnecting(false);
            addLogEntry(
              "Reconnect successful",
              "Connection restored",
              "Successfully reconnected to server"
            );

            if (reconnectStrategy === "RECONNECT_WITH_REPLAY") {
              // Replay last N messages
              const messagesToReplay = messages
                .filter((m) => m.status === "delivered")
                .slice(-replayWindow);
              addLogEntry(
                "Replay enabled",
                `Replaying ${messagesToReplay.length} messages`,
                `Replaying last ${replayWindow} messages using lastEventId: ${lastEventId}`
              );
            }
          } else {
            // Retry
            attemptReconnect();
          }
        }, 2000);
      };

      attemptReconnect();
    }
  }, [
    network,
    reconnectStrategy,
    isReconnecting,
    reconnectAttempts,
    messages,
    replayWindow,
    lastEventId,
    addLogEntry,
  ]);

  // Handle sync model
  useEffect(() => {
    if (syncModel === "PUSH_PULL" && isStreaming) {
      const pullInterval = setInterval(() => {
        addLogEntry(
          "Push-pull sync",
          "Pull refresh triggered",
          "Periodic pull refresh to ensure consistency"
        );
        setServerState((prev) => `${prev} (refreshed)`);
      }, 10000);

      return () => clearInterval(pullInterval);
    }
  }, [syncModel, isStreaming, addLogEntry]);

  // Handle conflict simulation
  const handleClientAEdit = useCallback(() => {
    const newValue = `Client A: ${Date.now()}`;
    setClientAState(newValue);
    setLastEditFrom("A");

    if (conflictMode === "LAST_WRITE_WINS") {
      setServerState(newValue);
      setClientBState(newValue);
      addLogEntry(
        "Client A edit (LWW)",
        "A overwrites B",
        "Last-write-wins: Client A's edit overwrites Client B's value"
      );
    } else if (conflictMode === "MANUAL_MERGE") {
      setConflictState({
        field: "shared-field",
        clientAValue: newValue,
        clientBValue: clientBState,
        resolved: false,
      });
      addLogEntry(
        "Client A edit (conflict)",
        "Conflict detected",
        "Manual merge required: both clients edited the same field"
      );
    }
  }, [conflictMode, clientBState, addLogEntry]);

  const handleClientBEdit = useCallback(() => {
    const newValue = `Client B: ${Date.now()}`;
    setClientBState(newValue);
    setLastEditFrom("B");

    if (conflictMode === "LAST_WRITE_WINS") {
      setServerState(newValue);
      setClientAState(newValue);
      addLogEntry(
        "Client B edit (LWW)",
        "B overwrites A",
        "Last-write-wins: Client B's edit overwrites Client A's value"
      );
    } else if (conflictMode === "MANUAL_MERGE") {
      setConflictState({
        field: "shared-field",
        clientAValue: clientAState,
        clientBValue: newValue,
        resolved: false,
      });
      addLogEntry(
        "Client B edit (conflict)",
        "Conflict detected",
        "Manual merge required: both clients edited the same field"
      );
    }
  }, [conflictMode, clientAState, addLogEntry]);

  const handleConflictResolve = useCallback(
    (resolvedValue: string) => {
      if (conflictState) {
        setConflictState({
          ...conflictState,
          resolved: true,
          resolvedValue,
        });
        setServerState(resolvedValue);
        setClientAState(resolvedValue);
        setClientBState(resolvedValue);
        addLogEntry(
          "Conflict resolved",
          "Manual merge applied",
          `User resolved conflict by choosing: ${resolvedValue}`
        );
        setTimeout(() => setConflictState(null), 2000);
      }
    },
    [conflictState, addLogEntry]
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

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Protocol
        </label>
        <select
          value={protocol}
          onChange={(e) => {
            setProtocol(e.target.value as Protocol);
            addLogEntry(
              `Protocol: ${e.target.value}`,
              "Protocol changed",
              e.target.value === "SSE"
                ? "SSE is server→client only; client updates are separate requests"
                : "WebSocket supports bidirectional communication"
            );
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="SSE">SSE</option>
          <option value="WEBSOCKET">WebSocket</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Network
        </label>
        <select
          value={network}
          onChange={(e) => {
            setNetwork(e.target.value as Network);
            if (e.target.value === "DISCONNECTED") {
              setIsStreaming(false);
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="STABLE">Stable</option>
          <option value="FLAKY">Flaky</option>
          <option value="DISCONNECTED">Disconnected</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Message Rate: {msgRatePerSec} msg/s
        </label>
        <input
          type="range"
          min="1"
          max="200"
          step="1"
          value={msgRatePerSec}
          onChange={(e) => setMsgRatePerSec(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Payload Size
        </label>
        <select
          value={payloadSize}
          onChange={(e) => setPayloadSize(e.target.value as PayloadSize)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="SMALL">Small</option>
          <option value="MEDIUM">Medium</option>
          <option value="LARGE">Large</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Backpressure
        </label>
        <select
          value={backpressure}
          onChange={(e) => {
            setBackpressure(e.target.value as Backpressure);
            addLogEntry(
              `Backpressure: ${e.target.value}`,
              "Strategy changed",
              currentRule?.notes.find((n) =>
                n.toLowerCase().includes(e.target.value.toLowerCase())
              ) || "Backpressure strategy updated"
            );
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="NONE">None</option>
          <option value="BATCH">Batch</option>
          <option value="THROTTLE">Throttle</option>
          <option value="DROP_OLD">Drop Old</option>
          <option value="ACK_WINDOW">Ack Window</option>
        </select>
      </div>

      {backpressure === "BATCH" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Batch Window: {batchWindowMs}ms
          </label>
          <input
            type="range"
            min="0"
            max="2000"
            step="100"
            value={batchWindowMs}
            onChange={(e) => setBatchWindowMs(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Reconnect Strategy
        </label>
        <select
          value={reconnectStrategy}
          onChange={(e) =>
            setReconnectStrategy(e.target.value as ReconnectStrategy)
          }
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="NONE">None</option>
          <option value="AUTO_RECONNECT">Auto Reconnect</option>
          <option value="RECONNECT_WITH_REPLAY">Reconnect with Replay</option>
        </select>
      </div>

      {reconnectStrategy === "RECONNECT_WITH_REPLAY" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Replay Window: {replayWindow} messages
          </label>
          <input
            type="range"
            min="0"
            max="500"
            step="10"
            value={replayWindow}
            onChange={(e) => setReplayWindow(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Sync Model
        </label>
        <select
          value={syncModel}
          onChange={(e) => setSyncModel(e.target.value as SyncModel)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="PUSH_ONLY">Push-only</option>
          <option value="PUSH_PULL">Push-pull</option>
          <option value="CLIENT_PREDICT">Client predict</option>
        </select>
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
          <option value="LAST_WRITE_WINS">Last-write-wins</option>
          <option value="MANUAL_MERGE">Manual merge</option>
        </select>
      </div>

      <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            setIsStreaming(!isStreaming);
            if (!isStreaming) {
              addLogEntry(
                "Start stream",
                "Streaming started",
                `Starting ${protocol} stream at ${msgRatePerSec} msg/s`
              );
            } else {
              addLogEntry("Stop stream", "Streaming stopped", "Stream stopped");
            }
          }}
          className={`w-full px-4 py-2 rounded-md transition-colors text-sm ${
            isStreaming
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {isStreaming ? "Stop stream" : "Start stream"}
        </button>
        <button
          onClick={() => {
            setNetwork("DISCONNECTED");
            setIsStreaming(false);
            addLogEntry(
              "Simulate disconnect",
              "Network disconnected",
              "Simulating network disconnection"
            );
          }}
          className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm"
        >
          Simulate disconnect
        </button>
        <button
          onClick={handleClientAEdit}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          Send edit (Client A)
        </button>
        <button
          onClick={handleClientBEdit}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
        >
          Send edit (Client B)
        </button>
      </div>
    </div>
  );

  // Prepare replay messages for 3D
  const replayMessages = useMemo(() => {
    if (reconnectStrategy !== "RECONNECT_WITH_REPLAY") return [];
    return messages
      .filter((m) => m.status === "delivered")
      .slice(-replayWindow)
      .map((m) => ({
        id: m.id,
        message: m.payload,
        timestamp: m.timestamp,
      }));
  }, [messages, reconnectStrategy, replayWindow]);

  const visualization2D = (
    <Spotlight targetId={focusTarget || null}>
      <div className="space-y-6">
        {/* Message Flow Visualization */}
        <SpotlightTarget id="flow" className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Message Flow ({protocol})
          </h4>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-xs font-semibold">Client</span>
                </div>
              </div>
              <div className="flex-1 mx-4">
                {protocol === "SSE" ? (
                  <div className="relative">
                    <motion.div
                      initial={reduced ? {} : { x: 0 }}
                      animate={
                        reduced
                          ? {}
                          : isStreaming
                            ? { x: [0, 200, 0] }
                            : { x: 0 }
                      }
                      transition={
                        reduced
                          ? {}
                          : {
                              duration: 2,
                              repeat: isStreaming ? Infinity : 0,
                              ease: "linear",
                            }
                      }
                      className="absolute top-0 left-0 w-4 h-4 bg-green-500 rounded-full"
                    />
                    <div className="h-1 bg-green-200 dark:bg-green-800 rounded-full" />
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                      Server → Client (one-way stream)
                    </p>
                    <div className="h-1 bg-blue-200 dark:bg-blue-800 rounded-full mt-2" />
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                      Client → Server (separate POST requests)
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <motion.div
                      initial={reduced ? {} : { x: 0 }}
                      animate={
                        reduced
                          ? {}
                          : isStreaming
                            ? { x: [0, 200, 0] }
                            : { x: 0 }
                      }
                      transition={
                        reduced
                          ? {}
                          : {
                              duration: 1.5,
                              repeat: isStreaming ? Infinity : 0,
                              ease: "linear",
                            }
                      }
                      className="absolute top-0 left-0 w-4 h-4 bg-green-500 rounded-full"
                    />
                    <motion.div
                      initial={reduced ? {} : { x: 200 }}
                      animate={
                        reduced
                          ? {}
                          : isStreaming
                            ? { x: [200, 0, 200] }
                            : { x: 200 }
                      }
                      transition={
                        reduced
                          ? {}
                          : {
                              duration: 1.5,
                              repeat: isStreaming ? Infinity : 0,
                              ease: "linear",
                            }
                      }
                      className="absolute top-6 left-0 w-4 h-4 bg-blue-500 rounded-full"
                    />
                    <div className="h-1 bg-green-200 dark:bg-green-800 rounded-full mb-2" />
                    <div className="h-1 bg-blue-200 dark:bg-blue-800 rounded-full" />
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                      Bidirectional WebSocket channel
                    </p>
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-xs font-semibold">Server</span>
                </div>
              </div>
            </div>
            {network === "DISCONNECTED" && (
              <motion.div
                initial={reduced ? {} : { opacity: 0 }}
                animate={reduced ? {} : { opacity: 1 }}
                className="text-center text-red-600 dark:text-red-400 text-sm font-semibold"
              >
                Connection broken
              </motion.div>
            )}
          </div>
        </SpotlightTarget>

        {/* Buffer & Backpressure Panel */}
        <SpotlightTarget id="buffer" className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Buffer & Backpressure
          </h4>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Buffer Depth</span>
                <span>{bufferDepth}</span>
              </div>
              <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={false}
                  animate={
                    reduced
                      ? {}
                      : {
                          width: `${Math.min(100, (bufferDepth / 20) * 100)}%`,
                          backgroundColor:
                            bufferDepth > 15
                              ? "rgb(239, 68, 68)"
                              : bufferDepth > 10
                                ? "rgb(234, 179, 8)"
                                : "rgb(34, 197, 94)",
                        }
                  }
                  transition={reduced ? {} : { duration: 0.3 }}
                  className="h-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Dropped:{" "}
                </span>
                <span className="font-semibold">
                  {droppedMsgsPct.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Latency:{" "}
                </span>
                <span className="font-semibold">{latencyMs.toFixed(0)}ms</span>
              </div>
            </div>
            {currentRule?.notes && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
                {currentRule.notes.map((note, index) => (
                  <motion.p
                    key={index}
                    initial={reduced ? false : { opacity: 0, y: -4 }}
                    animate={reduced ? {} : { opacity: 1, y: 0 }}
                    transition={
                      reduced ? {} : { duration: 0.3, delay: index * 0.1 }
                    }
                    className="text-xs text-gray-700 dark:text-gray-300"
                  >
                    {note}
                  </motion.p>
                ))}
              </div>
            )}
          </div>
        </SpotlightTarget>

        {/* Reconnect & Sync Panel */}
        <SpotlightTarget id="reconnect" className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Reconnect & Sync
          </h4>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
            {network === "DISCONNECTED" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Status:
                  </span>
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Disconnected
                  </span>
                </div>
                {reconnectStrategy !== "NONE" && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">
                        Reconnect attempts:
                      </span>
                      <span className="font-semibold">{reconnectAttempts}</span>
                    </div>
                    {reconnectStrategy === "RECONNECT_WITH_REPLAY" && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Last Event ID: {lastEventId || "none"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {network === "STABLE" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Status:
                  </span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Connected
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Sync Model: {syncModel.replace(/_/g, " ")}
                </div>
                {syncModel === "CLIENT_PREDICT" && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Optimistic updates enabled; will reconcile with server
                  </div>
                )}
              </div>
            )}
          </div>
        </SpotlightTarget>

        {/* Conflict Resolution */}
        {conflictMode !== "NONE" && (
          <SpotlightTarget id="conflict" className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Conflict Handling
            </h4>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Client A
                  </div>
                  <div className="font-mono bg-white dark:bg-gray-800 p-2 rounded">
                    {clientAState}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Server
                  </div>
                  <div className="font-mono bg-white dark:bg-gray-800 p-2 rounded">
                    {serverState}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Client B
                  </div>
                  <div className="font-mono bg-white dark:bg-gray-800 p-2 rounded">
                    {clientBState}
                  </div>
                </div>
              </div>
              {conflictState && !conflictState.resolved && (
                <motion.div
                  initial={reduced ? {} : { opacity: 0, scale: 0.95 }}
                  animate={reduced ? {} : { opacity: 1, scale: 1 }}
                  transition={reduced ? {} : { duration: 0.3 }}
                  className="border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20"
                >
                  <div className="text-sm font-semibold mb-2">Conflict!</div>
                  <div className="space-y-2 mb-3">
                    <div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Client A:
                      </span>
                      <div className="font-mono text-sm">
                        {conflictState.clientAValue}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Client B:
                      </span>
                      <div className="font-mono text-sm">
                        {conflictState.clientBValue}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleConflictResolve(conflictState.clientAValue)
                      }
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      Choose A
                    </button>
                    <button
                      onClick={() =>
                        handleConflictResolve(conflictState.clientBValue)
                      }
                      className="flex-1 px-3 py-2 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                    >
                      Choose B
                    </button>
                    <button
                      onClick={() =>
                        handleConflictResolve(
                          `${conflictState.clientAValue} + ${conflictState.clientBValue}`
                        )
                      }
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                    >
                      Merge
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </SpotlightTarget>
        )}
      </div>
    </Spotlight>
  );

  const visualization3D = (
    <ThreeCanvasShell
      className="w-full h-[600px] rounded-lg overflow-hidden bg-gray-900"
      fallback={
        <Fallback2D message="3D unavailable, showing 2D view">
          {visualization2D}
        </Fallback2D>
      }
    >
      <RealtimePlantScene
        protocol={protocol}
        network={network}
        isStreaming={isStreaming}
        bufferDepth={bufferDepth}
        maxBufferDepth={20}
        backpressure={backpressure}
        droppedMsgsPct={droppedMsgsPct}
        latencyMs={latencyMs}
        reconnectStrategy={reconnectStrategy}
        replayWindow={replayWindow}
        isReconnecting={isReconnecting}
        replayMessages={replayMessages}
        conflictMode={conflictMode}
        clientAValue={clientAState}
        clientBValue={clientBState}
        serverValue={serverState}
        hasConflict={conflictState !== null && !conflictState.resolved}
        lastEditFrom={lastEditFrom}
        focusTarget={focusTarget}
        onPacketComplete={(packetId) => {
          // Optional: handle packet completion
        }}
        onPacketArrive={() => {
          // Optional: handle packet arrival
        }}
        onPacketDrop={() => {
          // Optional: handle packet drop
        }}
        cameraPreset={cameraPreset}
        onCameraPresetChange={setCameraPreset}
      />
    </ThreeCanvasShell>
  );

  const visualization = viewMode === "3D" ? visualization3D : visualization2D;

  return (
    <DemoShell
      controls={controls}
      visualization={visualization}
      eventLog={<EventLog entries={eventLog} />}
    />
  );
}

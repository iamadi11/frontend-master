"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion3D } from "./useReducedMotion3D";
import { PipelineNode, type StationType } from "./PipelineNodes";
import { Packet } from "./Packet";

interface PacketAnimation {
  id: string;
  from: StationType;
  to: StationType;
  color: string;
  label?: string;
  tag?: string;
  duration: number;
  onComplete?: () => void;
}

interface BadgeState {
  station: StationType;
  text: string;
  color: string;
  visible: boolean;
}

interface StatePipelineSceneProps {
  network: "ONLINE" | "FLAKY" | "OFFLINE";
  optimistic: boolean;
  cacheMode: "FRESH_ONLY" | "STALE_WHILE_REVALIDATE";
  queueCount: number;
  cacheStatus: "fresh" | "stale";
  focusTarget?: string | null;
  onAction?: (action: string) => void;
}

// Station positions (left to right)
const STATION_POSITIONS: Record<StationType, [number, number, number]> = {
  UI: [-4, 0, 0],
  CACHE: [-1.3, 0, 0],
  QUEUE: [1.3, 0, 0],
  SERVER: [4, 0, 0],
};

const PACKET_COLORS = {
  request: "#3b82f6", // blue
  response: "#10b981", // green
  optimistic: "#fbbf24", // amber
  rollback: "#ef4444", // red
  stale: "#6b7280", // gray
};

export function StatePipelineScene({
  network,
  optimistic,
  cacheMode,
  queueCount,
  cacheStatus,
  focusTarget,
  onAction,
}: StatePipelineSceneProps) {
  const reducedMotion = useReducedMotion3D();
  const [packets, setPackets] = useState<PacketAnimation[]>([]);
  const [badges, setBadges] = useState<BadgeState[]>([]);
  const [highlightedStation, setHighlightedStation] =
    useState<StationType | null>(null);
  const [hoveredStation, setHoveredStation] = useState<StationType | null>(
    null
  );
  const packetIdCounter = useRef(0);

  // Determine which stations to highlight based on focusTarget
  useEffect(() => {
    if (focusTarget === "cache.panel") {
      setHighlightedStation("CACHE");
    } else if (focusTarget === "queue.panel") {
      setHighlightedStation("QUEUE");
    } else if (focusTarget === "controls.network") {
      setHighlightedStation(null); // Highlight Queue + Server boundary
    } else if (focusTarget === "timeline") {
      setHighlightedStation(null); // Highlight whole pipeline
    } else {
      setHighlightedStation(null);
    }
  }, [focusTarget]);

  // Helper to create a packet animation
  const createPacket = useCallback(
    (
      from: StationType,
      to: StationType,
      color: string,
      label?: string,
      tag?: string,
      duration: number = 1000
    ) => {
      const id = `packet-${packetIdCounter.current++}`;
      const packet: PacketAnimation = {
        id,
        from,
        to,
        color,
        label,
        tag,
        duration,
        onComplete: () => {
          setPackets((prev) => prev.filter((p) => p.id !== id));
        },
      };
      setPackets((prev) => [...prev, packet]);
    },
    []
  );

  // Helper to show a badge
  const showBadge = useCallback(
    (
      station: StationType,
      text: string,
      color: string,
      duration: number = 2000
    ) => {
      setBadges((prev) => [...prev, { station, text, color, visible: true }]);
      setTimeout(() => {
        setBadges((prev) =>
          prev.map((b) =>
            b.station === station && b.text === text
              ? { ...b, visible: false }
              : b
          )
        );
        setTimeout(() => {
          setBadges((prev) =>
            prev.filter((b) => !(b.station === station && b.text === text))
          );
        }, 300);
      }, duration);
    },
    []
  );

  // Handle user actions
  const handleAction = useCallback(
    (action: string) => {
      if (action === "REFETCH") {
        // Refetch flow: UI → Server → Cache → UI
        createPacket(
          "UI",
          "SERVER",
          PACKET_COLORS.request,
          "Request",
          undefined,
          800
        );
        setTimeout(() => {
          createPacket(
            "SERVER",
            "CACHE",
            PACKET_COLORS.response,
            "Response",
            undefined,
            600
          );
          showBadge("CACHE", "Updated", "#10b981", 1500);
        }, 800);
        setTimeout(() => {
          createPacket(
            "CACHE",
            "UI",
            PACKET_COLORS.response,
            "Data",
            undefined,
            600
          );
          showBadge("UI", "Re-render", "#3b82f6", 1500);
        }, 1400);
      } else if (action === "SAVE_MUTATION") {
        if (network === "OFFLINE") {
          // Offline: UI → Queue
          createPacket(
            "UI",
            "QUEUE",
            PACKET_COLORS.request,
            "Mutation",
            "queued",
            600
          );
          showBadge("QUEUE", "Queued", "#f59e0b", 2000);
        } else {
          // Online mutation flow
          if (optimistic) {
            // Optimistic: UI → UI (loop) then UI → Server
            createPacket(
              "UI",
              "UI",
              PACKET_COLORS.optimistic,
              "Optimistic",
              undefined,
              300
            );
            setTimeout(() => {
              createPacket(
                "UI",
                "SERVER",
                PACKET_COLORS.request,
                "Mutation",
                undefined,
                800
              );
            }, 300);
          } else {
            // Non-optimistic: UI → Server
            createPacket(
              "UI",
              "SERVER",
              PACKET_COLORS.request,
              "Mutation",
              undefined,
              800
            );
          }

          // Simulate success/failure (deterministic based on failure rate from parent)
          // For now, we'll assume success - parent will call with specific outcome
          setTimeout(() => {
            // This will be overridden by MUTATION_SUCCESS or MUTATION_FAILURE
          }, 1200);
        }
      } else if (action === "MUTATION_SUCCESS") {
        // Server → Cache → UI (confirm)
        createPacket(
          "SERVER",
          "CACHE",
          PACKET_COLORS.response,
          "Confirm",
          undefined,
          600
        );
        setTimeout(() => {
          createPacket(
            "CACHE",
            "UI",
            PACKET_COLORS.response,
            "Update",
            undefined,
            600
          );
          showBadge("UI", "✓", "#10b981", 2000);
        }, 600);
      } else if (action === "MUTATION_FAILURE") {
        // Rollback animation
        showBadge("UI", "↩ Rollback", "#ef4444", 2000);
        // Flash UI station
        setHighlightedStation("UI");
        setTimeout(() => setHighlightedStation(null), 500);
      } else if (action === "GO_OFFLINE") {
        showBadge("QUEUE", "Offline", "#f59e0b", 2000);
      } else if (action === "GO_ONLINE") {
        // Replay queue items
        if (queueCount > 0) {
          showBadge("QUEUE", "Replaying...", "#3b82f6", 1000);
          // Animate replay packets sequentially
          for (let i = 0; i < Math.min(queueCount, 5); i++) {
            setTimeout(() => {
              createPacket(
                "QUEUE",
                "SERVER",
                PACKET_COLORS.request,
                `Replay ${i + 1}`,
                undefined,
                800
              );
              setTimeout(() => {
                createPacket(
                  "SERVER",
                  "CACHE",
                  PACKET_COLORS.response,
                  "Confirm",
                  undefined,
                  600
                );
                setTimeout(() => {
                  createPacket(
                    "CACHE",
                    "UI",
                    PACKET_COLORS.response,
                    "Update",
                    undefined,
                    600
                  );
                }, 600);
              }, 800);
            }, i * 2000);
          }
        }
      } else if (action === "CACHE_STALE_SERVE") {
        // SWR: Cache → UI (stale) then Server → Cache (revalidate)
        createPacket(
          "CACHE",
          "UI",
          PACKET_COLORS.stale,
          "Stale",
          undefined,
          400
        );
        showBadge("UI", "Stale served", "#6b7280", 1500);
        setTimeout(() => {
          createPacket(
            "SERVER",
            "CACHE",
            PACKET_COLORS.response,
            "Revalidate",
            undefined,
            600
          );
          setTimeout(() => {
            createPacket(
              "CACHE",
              "UI",
              PACKET_COLORS.response,
              "Fresh",
              undefined,
              400
            );
            showBadge("UI", "Revalidated", "#10b981", 1500);
          }, 600);
        }, 500);
      }
    },
    [network, optimistic, queueCount, createPacket, showBadge]
  );

  // Expose action handler to parent via ref
  const actionHandlerRef = useRef<(action: string) => void>(() => {});
  useEffect(() => {
    actionHandlerRef.current = handleAction;
  }, [handleAction]);

  useEffect(() => {
    // Store ref in window for external trigger
    (window as any).__statePipelineAction = (action: string) => {
      actionHandlerRef.current(action);
    };
    return () => {
      delete (window as any).__statePipelineAction;
    };
  }, []);

  // Station status badges
  const stationStatuses = useMemo(() => {
    const statuses: Partial<Record<StationType, string>> = {};
    if (cacheStatus === "stale" && cacheMode === "STALE_WHILE_REVALIDATE") {
      statuses.CACHE = "Stale";
    }
    if (network === "OFFLINE") {
      statuses.SERVER = "Offline";
    }
    return statuses;
  }, [cacheStatus, cacheMode, network]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, 5, -5]} intensity={0.4} />

      {/* Pipeline track (ground plane) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
        receiveShadow
      >
        <planeGeometry args={[12, 1.5]} />
        <meshStandardMaterial
          color={focusTarget === "timeline" ? "#fbbf24" : "#374151"}
          emissive={focusTarget === "timeline" ? "#fbbf24" : "#1f2937"}
          emissiveIntensity={focusTarget === "timeline" ? 0.2 : 0.05}
        />
      </mesh>

      {/* Station nodes */}
      <PipelineNode
        type="UI"
        position={STATION_POSITIONS.UI}
        highlighted={highlightedStation === "UI" || hoveredStation === "UI"}
        status={stationStatuses.UI}
        onHover={setHoveredStation}
        onClick={(type) => onAction?.(`click:${type}`)}
      />
      <PipelineNode
        type="CACHE"
        position={STATION_POSITIONS.CACHE}
        highlighted={
          highlightedStation === "CACHE" || hoveredStation === "CACHE"
        }
        status={stationStatuses.CACHE}
        onHover={setHoveredStation}
        onClick={(type) => onAction?.(`click:${type}`)}
      />
      <PipelineNode
        type="QUEUE"
        position={STATION_POSITIONS.QUEUE}
        highlighted={
          highlightedStation === "QUEUE" || hoveredStation === "QUEUE"
        }
        count={queueCount}
        onHover={setHoveredStation}
        onClick={(type) => onAction?.(`click:${type}`)}
      />
      <PipelineNode
        type="SERVER"
        position={STATION_POSITIONS.SERVER}
        highlighted={
          highlightedStation === "SERVER" || hoveredStation === "SERVER"
        }
        status={stationStatuses.SERVER}
        onHover={setHoveredStation}
        onClick={(type) => onAction?.(`click:${type}`)}
      />

      {/* Animated packets */}
      {packets.map((packet) => (
        <Packet
          key={packet.id}
          id={packet.id}
          from={STATION_POSITIONS[packet.from]}
          to={STATION_POSITIONS[packet.to]}
          color={packet.color}
          label={packet.label}
          tag={packet.tag}
          duration={packet.duration}
          onComplete={packet.onComplete}
        />
      ))}

      {/* Status badges */}
      {badges.map(
        (badge, index) =>
          badge.visible && (
            <Html
              key={`${badge.station}-${badge.text}-${index}`}
              position={[
                STATION_POSITIONS[badge.station][0],
                STATION_POSITIONS[badge.station][1] + 1,
                STATION_POSITIONS[badge.station][2],
              ]}
              center
              distanceFactor={5}
            >
              <div
                className="px-3 py-1.5 text-xs font-bold rounded-lg shadow-lg border-2"
                style={{
                  backgroundColor: badge.color,
                  color: "#ffffff",
                  borderColor: badge.color,
                  opacity: reducedMotion ? 1 : badge.visible ? 1 : 0,
                  transition: reducedMotion ? "none" : "opacity 0.3s",
                }}
              >
                {badge.text}
              </div>
            </Html>
          )
      )}

      {/* Tooltip on hover */}
      {hoveredStation && (
        <Html
          position={[
            STATION_POSITIONS[hoveredStation][0],
            STATION_POSITIONS[hoveredStation][1] + 1.5,
            STATION_POSITIONS[hoveredStation][2],
          ]}
          center
          distanceFactor={5}
        >
          <div className="px-2 py-1 text-xs bg-white dark:bg-gray-800 rounded shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs">
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {hoveredStation === "UI"
                ? "Client UI"
                : hoveredStation === "CACHE"
                  ? "Server-state Cache"
                  : hoveredStation === "QUEUE"
                    ? "Offline Mutation Queue"
                    : "Backend Server"}
            </div>
            <div className="text-gray-600 dark:text-gray-400 mt-1">
              {hoveredStation === "UI"
                ? "Renders current state; applies optimistic updates"
                : hoveredStation === "CACHE"
                  ? "Stores server state; can serve stale data (SWR)"
                  : hoveredStation === "QUEUE"
                    ? "Queues mutations when offline; replays on reconnect"
                    : "Processes mutations and serves data"}
            </div>
          </div>
        </Html>
      )}
    </>
  );
}

// Export action handler for parent component
export function triggerPipelineAction(action: string) {
  const handler = (window as any).__statePipelineAction;
  if (handler) {
    handler(action);
  }
}

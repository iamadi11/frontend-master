"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion3D } from "./useReducedMotion3D";
import { Packet } from "./Packet";
import type { CapstoneBuilderConfig } from "../demo/demoSchema";

interface CapstoneMiniSim3DProps {
  config: CapstoneBuilderConfig;
  simRule: NonNullable<CapstoneBuilderConfig["sim"]>["rules"][0];
  rendering: "CSR" | "SSR" | "SSG" | "ISR" | "STREAMING";
  caching: "NONE" | "BROWSER" | "CDN" | "APP";
  realtime: "NONE" | "SSE" | "WEBSOCKET";
  optimistic: boolean;
  offline: boolean;
  sampling: number;
  cspStrict: boolean;
  isRunning: boolean;
  focusTarget?: string | null;
  onSimComplete?: () => void;
}

/**
 * 3D visualization of integrated mini-sim showing request/data/realtime/caching/observability/security flows.
 */
export function CapstoneMiniSim3D({
  config,
  simRule,
  rendering,
  caching,
  realtime,
  optimistic,
  offline,
  sampling,
  cspStrict,
  isRunning,
  focusTarget,
  onSimComplete,
}: CapstoneMiniSim3DProps) {
  const reducedMotion = useReducedMotion3D();
  const [simPhase, setSimPhase] = useState<
    | "IDLE"
    | "REQUEST"
    | "CACHE_HIT"
    | "CACHE_MISS"
    | "REALTIME"
    | "OPTIMISTIC"
    | "OFFLINE_QUEUE"
    | "TELEMETRY"
    | "SECURITY"
    | "COMPLETE"
  >("IDLE");
  const [activePackets, setActivePackets] = useState<
    Array<{
      id: string;
      from: [number, number, number];
      to: [number, number, number];
      color: string;
      label?: string;
      tag?: string;
    }>
  >([]);
  const [isOnline, setIsOnline] = useState(true);
  const packetCounterRef = useRef(0);

  // Station positions
  const clientUIPos: [number, number, number] = [-3, 1, 0];
  const cachePos: [number, number, number] = [0, 1, 0];
  const serverPos: [number, number, number] = [3, 1, 0];
  const realtimePipePos: [number, number, number] = [0, -1, 0];
  const otherClientPos: [number, number, number] = [-3, -1, 0];
  const telemetryPos: [number, number, number] = [3, -1, 0];
  const securityGatePos: [number, number, number] = [0, 0, 0];
  const offlineQueuePos: [number, number, number] = [-1.5, 0, 0];

  // Run simulation
  useEffect(() => {
    if (!isRunning) {
      setSimPhase("IDLE");
      setActivePackets([]);
      return;
    }

    let phaseIndex = 0;
    const phases: Array<{
      phase: typeof simPhase;
      delay: number;
      packets: Array<{
        from: [number, number, number];
        to: [number, number, number];
        color: string;
        label?: string;
        tag?: string;
      }>;
    }> = [];

    // Request path
    phases.push({
      phase: "REQUEST",
      delay: 0,
      packets: [
        {
          from: clientUIPos,
          to: caching !== "NONE" ? cachePos : serverPos,
          color: "#3b82f6",
          label: "Request",
        },
      ],
    });

    // Cache hit/miss
    if (caching !== "NONE") {
      const cacheHit = simRule.simMetrics.cacheHitRate > 0.5;
      phases.push({
        phase: cacheHit ? "CACHE_HIT" : "CACHE_MISS",
        delay: reducedMotion ? 100 : 500,
        packets: cacheHit
          ? [
              {
                from: cachePos,
                to: clientUIPos,
                color: "#fbbf24",
                label: "Cache Hit",
              },
            ]
          : [
              {
                from: cachePos,
                to: serverPos,
                color: "#3b82f6",
                label: "Cache Miss",
              },
            ],
      });
    }

    // Server response
    if (caching === "NONE" || simRule.simMetrics.cacheHitRate <= 0.5) {
      phases.push({
        phase: "REQUEST",
        delay: reducedMotion ? 200 : 1000,
        packets: [
          {
            from: serverPos,
            to: clientUIPos,
            color: "#22c55e",
            label: "Response",
          },
        ],
      });
    }

    // Optimistic update
    if (optimistic) {
      phases.push({
        phase: "OPTIMISTIC",
        delay: reducedMotion ? 300 : 1500,
        packets: [
          {
            from: clientUIPos,
            to: clientUIPos,
            color: "#a855f7",
            label: "Optimistic",
            tag: "UI",
          },
        ],
      });
    }

    // Realtime
    if (realtime !== "NONE") {
      phases.push({
        phase: "REALTIME",
        delay: reducedMotion ? 400 : 2000,
        packets: [
          {
            from: serverPos,
            to: realtimePipePos,
            color: "#ec4899",
            label: "Message",
          },
          {
            from: realtimePipePos,
            to: otherClientPos,
            color: "#ec4899",
            label: "Message",
          },
        ],
      });
    }

    // Offline queue
    if (offline && !isOnline) {
      phases.push({
        phase: "OFFLINE_QUEUE",
        delay: reducedMotion ? 500 : 2500,
        packets: [
          {
            from: clientUIPos,
            to: offlineQueuePos,
            color: "#f59e0b",
            label: "Queued",
          },
        ],
      });
    }

    // Telemetry
    if (sampling > 0) {
      const isDropped = sampling < 1 && Math.random() > sampling;
      if (!isDropped) {
        phases.push({
          phase: "TELEMETRY",
          delay: reducedMotion ? 600 : 3000,
          packets: [
            {
              from: clientUIPos,
              to: telemetryPos,
              color: "#8b5cf6",
              label: "Telemetry",
            },
          ],
        });
      }
    }

    // Security gate (conceptual - only if CSP strict and unsafe action)
    if (cspStrict) {
      phases.push({
        phase: "SECURITY",
        delay: reducedMotion ? 700 : 3500,
        packets: [],
      });
    }

    // Execute phases
    const executePhase = () => {
      if (phaseIndex >= phases.length) {
        setSimPhase("COMPLETE");
        onSimComplete?.();
        return;
      }

      const phase = phases[phaseIndex];
      setSimPhase(phase.phase);

      if (phase.packets.length > 0) {
        const newPackets = phase.packets.map((p) => ({
          ...p,
          id: `sim-packet-${packetCounterRef.current++}`,
        }));
        setActivePackets(newPackets);

        // Clear packets after animation
        setTimeout(
          () => {
            setActivePackets((prev) =>
              prev.filter((p) => !newPackets.some((np) => np.id === p.id))
            );
          },
          reducedMotion ? 200 : 1000
        );
      }

      phaseIndex++;
      if (phaseIndex < phases.length) {
        setTimeout(executePhase, phase.delay);
      } else {
        setTimeout(
          () => {
            setSimPhase("COMPLETE");
            onSimComplete?.();
          },
          reducedMotion ? 500 : 2000
        );
      }
    };

    executePhase();
  }, [
    isRunning,
    caching,
    realtime,
    optimistic,
    offline,
    sampling,
    cspStrict,
    simRule,
    reducedMotion,
    onSimComplete,
    isOnline,
  ]);

  const isFocused = focusTarget === "sim.panel";

  return (
    <group>
      {/* Client UI station */}
      <group position={clientUIPos}>
        <RoundedBox args={[0.8, 0.8, 0.8]} radius={0.1} smoothness={4}>
          <meshStandardMaterial
            color={isFocused ? "#a855f7" : "#c084fc"}
            emissive={isFocused ? "#a855f7" : "#c084fc"}
            emissiveIntensity={0.3}
          />
        </RoundedBox>
        <Text
          position={[0, -0.6, 0]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          Client UI
        </Text>
        {optimistic && simPhase === "OPTIMISTIC" && (
          <Html position={[0, 0.6, 0]} center distanceFactor={10}>
            <div className="bg-purple-500 text-white text-xs px-2 py-1 rounded">
              ✓ Optimistic
            </div>
          </Html>
        )}
      </group>

      {/* Cache station */}
      {caching !== "NONE" && (
        <group position={cachePos}>
          <RoundedBox args={[0.7, 0.7, 0.7]} radius={0.1} smoothness={4}>
            <meshStandardMaterial
              color={isFocused ? "#fbbf24" : "#fcd34d"}
              emissive={isFocused ? "#fbbf24" : "#fcd34d"}
              emissiveIntensity={0.3}
            />
          </RoundedBox>
          <Text
            position={[0, -0.6, 0]}
            fontSize={0.12}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            Cache
          </Text>
          {(simPhase === "CACHE_HIT" || simPhase === "CACHE_MISS") && (
            <Html position={[0, 0.6, 0]} center distanceFactor={10}>
              <div
                className={`text-white text-xs px-2 py-1 rounded ${
                  simPhase === "CACHE_HIT" ? "bg-yellow-500" : "bg-gray-500"
                }`}
              >
                {simPhase === "CACHE_HIT" ? "✓ Hit" : "✗ Miss"}
              </div>
            </Html>
          )}
        </group>
      )}

      {/* Server station */}
      <group position={serverPos}>
        <RoundedBox args={[0.8, 0.8, 0.8]} radius={0.1} smoothness={4}>
          <meshStandardMaterial
            color={isFocused ? "#22c55e" : "#4ade80"}
            emissive={isFocused ? "#22c55e" : "#4ade80"}
            emissiveIntensity={0.3}
          />
        </RoundedBox>
        <Text
          position={[0, -0.6, 0]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          Server
        </Text>
      </group>

      {/* Realtime pipe */}
      {realtime !== "NONE" && (
        <>
          <group position={realtimePipePos}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.08, 0.08, 2, 8]} />
              <meshStandardMaterial
                color={simPhase === "REALTIME" ? "#ec4899" : "#f472b6"}
                opacity={0.6}
                transparent
              />
            </mesh>
            <Text
              position={[0, -0.4, 0]}
              fontSize={0.1}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.01}
              outlineColor="#000000"
            >
              {realtime}
            </Text>
          </group>
          <group position={otherClientPos}>
            <RoundedBox args={[0.6, 0.6, 0.6]} radius={0.1} smoothness={4}>
              <meshStandardMaterial
                color="#a855f7"
                emissive="#a855f7"
                emissiveIntensity={0.2}
              />
            </RoundedBox>
            <Text
              position={[0, -0.5, 0]}
              fontSize={0.1}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.01}
              outlineColor="#000000"
            >
              Other
            </Text>
          </group>
        </>
      )}

      {/* Telemetry node */}
      <group position={telemetryPos}>
        <mesh>
          <octahedronGeometry args={[0.4, 0]} />
          <meshStandardMaterial
            color={simPhase === "TELEMETRY" ? "#8b5cf6" : "#a78bfa"}
            emissive={simPhase === "TELEMETRY" ? "#8b5cf6" : "#a78bfa"}
            emissiveIntensity={0.3}
          />
        </mesh>
        <Text
          position={[0, -0.5, 0]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          Telemetry
        </Text>
        {sampling < 1 && simPhase === "TELEMETRY" && (
          <Html position={[0, 0.5, 0]} center distanceFactor={10}>
            <div className="bg-gray-500 text-white text-xs px-2 py-1 rounded">
              Sampling: {(sampling * 100).toFixed(0)}%
            </div>
          </Html>
        )}
      </group>

      {/* Security gate */}
      {cspStrict && (
        <group position={securityGatePos}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.5, 0.1, 0.5]} />
            <meshStandardMaterial
              color={simPhase === "SECURITY" ? "#ef4444" : "#f87171"}
              emissive={simPhase === "SECURITY" ? "#ef4444" : "#f87171"}
              emissiveIntensity={0.5}
            />
          </mesh>
          <Text
            position={[0, -0.4, 0]}
            fontSize={0.1}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="#000000"
          >
            CSP Gate
          </Text>
          {simPhase === "SECURITY" && (
            <Html position={[0, 0.4, 0]} center distanceFactor={10}>
              <div className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                Blocked
              </div>
            </Html>
          )}
        </group>
      )}

      {/* Offline queue */}
      {offline && (
        <group position={offlineQueuePos}>
          <RoundedBox args={[0.6, 0.4, 0.6]} radius={0.1} smoothness={4}>
            <meshStandardMaterial
              color={!isOnline ? "#f59e0b" : "#9ca3af"}
              emissive={!isOnline ? "#f59e0b" : "#9ca3af"}
              emissiveIntensity={0.3}
            />
          </RoundedBox>
          <Text
            position={[0, -0.4, 0]}
            fontSize={0.1}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="#000000"
          >
            Queue
          </Text>
          {simPhase === "OFFLINE_QUEUE" && (
            <Html position={[0, 0.4, 0]} center distanceFactor={10}>
              <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded">
                Queued
              </div>
            </Html>
          )}
        </group>
      )}

      {/* Active packets */}
      {activePackets.map((packet) => (
        <Packet
          key={packet.id}
          id={packet.id}
          from={packet.from}
          to={packet.to}
          color={packet.color}
          label={packet.label}
          tag={packet.tag}
          duration={reducedMotion ? 100 : 800}
        />
      ))}

      {/* Reduced motion: highlight sequence */}
      {reducedMotion && simPhase !== "IDLE" && simPhase !== "COMPLETE" && (
        <mesh position={clientUIPos}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#fbbf24"
            emissiveIntensity={1}
            transparent
            opacity={0.5}
          />
        </mesh>
      )}
    </group>
  );
}

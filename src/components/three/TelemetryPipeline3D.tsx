"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion3D } from "./useReducedMotion3D";
import { Packet } from "./Packet";

interface PipelineStep {
  id: string;
  label: string;
  note: string;
}

type Signal = "LOG" | "METRIC" | "TRACE";

interface TelemetryPipeline3DProps {
  steps: PipelineStep[];
  activeStepId: string | null;
  eventPackets: Array<{ id: string; stepId: string; signalType: Signal }>;
  signal: Signal;
  focusTarget?: string | null;
  onPacketComplete?: (packetId: string) => void;
}

/**
 * 3D visualization of telemetry pipeline with nodes and packet flow.
 * Packets travel through nodes: Capture → Buffer → Send → Ingest → Store → Query → Alert
 */
export function TelemetryPipeline3D({
  steps,
  activeStepId,
  eventPackets,
  signal,
  focusTarget,
  onPacketComplete,
}: TelemetryPipeline3DProps) {
  const reducedMotion = useReducedMotion3D();
  const [packetPositions, setPacketPositions] = useState<
    Map<string, { stepIndex: number; progress: number }>
  >(new Map());

  // Calculate node positions in a line
  const nodePositions = useMemo(() => {
    const spacing = 1.8;
    const startX = -(steps.length - 1) * spacing * 0.5;
    return steps.map(
      (_, index) => [startX + index * spacing, 0, 0] as [number, number, number]
    );
  }, [steps]);

  // Signal color mapping
  const signalColors: Record<Signal, string> = {
    LOG: "#3b82f6", // blue
    METRIC: "#10b981", // green
    TRACE: "#8b5cf6", // purple
  };

  // Signal badge labels
  const signalLabels: Record<Signal, string> = {
    LOG: "LOG",
    METRIC: "METRIC",
    TRACE: "TRACE",
  };

  // Update packet positions based on active packets
  useEffect(() => {
    if (reducedMotion) {
      // In reduced motion, instantly position packets at their target step
      const newPositions = new Map<
        string,
        { stepIndex: number; progress: number }
      >();
      eventPackets.forEach((packet) => {
        const stepIndex = steps.findIndex((s) => s.id === packet.stepId);
        if (stepIndex >= 0) {
          newPositions.set(packet.id, { stepIndex, progress: 1 });
        }
      });
      setPacketPositions(newPositions);
      return;
    }

    // Animate packets through pipeline
    eventPackets.forEach((packet) => {
      const stepIndex = steps.findIndex((s) => s.id === packet.stepId);
      if (stepIndex >= 0) {
        setPacketPositions((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(packet.id);
          if (!current || current.stepIndex !== stepIndex) {
            newMap.set(packet.id, { stepIndex, progress: 0 });
          }
          return newMap;
        });
      }
    });
  }, [eventPackets, steps, reducedMotion]);

  // Animate packet progress
  useFrame(() => {
    if (reducedMotion) return;

    setPacketPositions((prev) => {
      const newMap = new Map(prev);
      let changed = false;

      newMap.forEach((pos, packetId) => {
        if (pos.progress < 1) {
          newMap.set(packetId, {
            ...pos,
            progress: Math.min(pos.progress + 0.02, 1),
          });
          changed = true;

          // Check if packet reached destination
          if (pos.progress >= 1) {
            const packet = eventPackets.find((p) => p.id === packetId);
            if (packet && onPacketComplete) {
              // Delay callback slightly to ensure visual completion
              setTimeout(() => onPacketComplete(packetId), 100);
            }
          }
        }
      });

      return changed ? newMap : prev;
    });
  });

  // Cap visible packets to 8 for performance
  const visiblePackets = useMemo(() => {
    return eventPackets.slice(-8);
  }, [eventPackets]);

  const isFocused = focusTarget === "pipeline" || focusTarget === null;

  return (
    <group>
      {/* Pipeline nodes */}
      {steps.map((step, index) => {
        const isActive = activeStepId === step.id;
        const nodePos = nodePositions[index];
        const dimmed = !isFocused;

        return (
          <PipelineNode3D
            key={step.id}
            id={step.id}
            label={step.label}
            position={nodePos}
            isActive={isActive}
            dimmed={dimmed}
            reducedMotion={reducedMotion}
          />
        );
      })}

      {/* Connection lines between nodes */}
      {nodePositions.length > 1 &&
        nodePositions.slice(0, -1).map((pos, index) => {
          const nextPos = nodePositions[index + 1];
          const distance = Math.sqrt(
            Math.pow(nextPos[0] - pos[0], 2) +
              Math.pow(nextPos[1] - pos[1], 2) +
              Math.pow(nextPos[2] - pos[2], 2)
          );
          const midX = (pos[0] + nextPos[0]) / 2;
          const midY = (pos[1] + nextPos[1]) / 2;
          const midZ = (pos[2] + nextPos[2]) / 2;

          // Calculate rotation to align with connection
          const dx = nextPos[0] - pos[0];
          const dy = nextPos[1] - pos[1];
          const dz = nextPos[2] - pos[2];
          const angleY = Math.atan2(dx, dz);
          const angleX = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));

          return (
            <group
              key={`conn-${index}`}
              position={[midX, midY, midZ]}
              rotation={[angleX, angleY, 0]}
            >
              <mesh>
                <cylinderGeometry args={[0.02, 0.02, distance, 8]} />
                <meshStandardMaterial
                  color="#6b7280"
                  opacity={isFocused ? 0.5 : 0.2}
                  transparent
                />
              </mesh>
            </group>
          );
        })}

      {/* Animated packets */}
      {visiblePackets.map((packet) => {
        const pos = packetPositions.get(packet.id);
        if (!pos) return null;

        const fromIndex = Math.max(0, pos.stepIndex - 1);
        const toIndex = pos.stepIndex;
        const fromPos = nodePositions[fromIndex];
        const toPos = nodePositions[toIndex];

        if (!fromPos || !toPos) return null;

        // Interpolate position
        const currentX =
          fromPos[0] +
          (toPos[0] - fromPos[0]) * (reducedMotion ? 1 : pos.progress);
        const currentY =
          fromPos[1] +
          (toPos[1] - fromPos[1]) * (reducedMotion ? 1 : pos.progress);
        const currentZ =
          fromPos[2] +
          (toPos[2] - fromPos[2]) * (reducedMotion ? 1 : pos.progress);

        return (
          <Packet
            key={packet.id}
            id={packet.id}
            from={[currentX, currentY, currentZ]}
            to={[currentX, currentY, currentZ]}
            color={signalColors[packet.signalType]}
            label={signalLabels[packet.signalType]}
            duration={800}
            onComplete={() => {
              if (onPacketComplete && pos.progress >= 1) {
                onPacketComplete(packet.id);
              }
            }}
          />
        );
      })}

      {/* Legend */}
      <group position={[-3, -2, 0]}>
        <Html center>
          <div className="bg-black/70 text-white text-xs p-2 rounded space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Logs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Metrics</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span>Traces</span>
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}

interface PipelineNode3DProps {
  id: string;
  label: string;
  position: [number, number, number];
  isActive: boolean;
  dimmed: boolean;
  reducedMotion: boolean;
}

function PipelineNode3D({
  id,
  label,
  position,
  isActive,
  dimmed,
  reducedMotion,
}: PipelineNode3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const activeStartTime = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      activeStartTime.current = Date.now();
    }
  }, [isActive]);

  useFrame(() => {
    if (!meshRef.current) return;

    if (isActive && !reducedMotion && activeStartTime.current) {
      const elapsed = Date.now() - activeStartTime.current;
      const pulse = Math.sin((elapsed / 1000) * Math.PI * 2) * 0.1;
      meshRef.current.scale.setScalar(1 + pulse);
    } else {
      meshRef.current.scale.setScalar(1);
    }
  });

  const nodeColor = isActive ? "#3b82f6" : "#6b7280";

  return (
    <group position={position}>
      <RoundedBox
        ref={meshRef}
        args={[0.6, 0.6, 0.3]}
        radius={0.1}
        smoothness={4}
        castShadow
      >
        <meshStandardMaterial
          color={nodeColor}
          emissive={isActive ? nodeColor : "#000000"}
          emissiveIntensity={isActive ? 0.5 : 0}
          opacity={dimmed ? 0.3 : 1}
          transparent={dimmed}
        />
      </RoundedBox>
      <Html position={[0, -0.6, 0]} center>
        <div
          className="text-xs font-medium text-center whitespace-nowrap bg-black/70 text-white px-2 py-1 rounded"
          style={{ opacity: dimmed ? 0.3 : 1 }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

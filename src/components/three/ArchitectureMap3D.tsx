"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Text, Line } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion3D } from "./useReducedMotion3D";
import { Packet } from "./Packet";
import type { CapstoneBuilderConfig } from "../demo/demoSchema";

interface ArchitectureMap3DProps {
  scenarioData: NonNullable<CapstoneBuilderConfig["scenarios"]>[0];
  emphasis: "PERF" | "RELIABILITY" | "SECURITY" | "DX";
  focusTarget?: string | null;
  onNodeClick?: (moduleId: string) => void;
  onFlowPlay?: () => void;
  isPlayingFlow?: boolean;
}

/**
 * Computes a grid layout for modules.
 */
function computeGridLayout(
  moduleCount: number
): Array<{ id: string; position: [number, number, number] }> {
  const cols = Math.ceil(Math.sqrt(moduleCount));
  const spacing = 2.5;
  const positions: Array<{ id: string; position: [number, number, number] }> =
    [];

  for (let i = 0; i < moduleCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = (col - (cols - 1) / 2) * spacing;
    const y = (row - (cols - 1) / 2) * spacing * 0.8;
    const z = 0;
    positions.push({
      id: `pos-${i}`,
      position: [x, y, z],
    });
  }

  return positions;
}

/**
 * Gets color for module type.
 */
function getModuleColor(type: string): string {
  switch (type) {
    case "UI":
      return "#a855f7"; // purple
    case "API":
      return "#22c55e"; // green
    case "CACHE":
      return "#fbbf24"; // yellow
    case "EDGE":
      return "#3b82f6"; // blue
    case "AUTH":
      return "#ef4444"; // red
    case "REALTIME":
      return "#ec4899"; // pink
    case "ANALYTICS":
      return "#8b5cf6"; // violet
    default:
      return "#9ca3af"; // gray
  }
}

interface ModuleState {
  id: string;
  position: [number, number, number];
  targetPosition: [number, number, number];
  scale: number;
  targetScale: number;
  opacity: number;
  targetOpacity: number;
  isCritical: boolean;
  isDimmed: boolean;
}

export function ArchitectureMap3D({
  scenarioData,
  emphasis,
  focusTarget,
  onNodeClick,
  onFlowPlay,
  isPlayingFlow = false,
}: ArchitectureMap3DProps) {
  const reducedMotion = useReducedMotion3D();
  const [moduleStates, setModuleStates] = useState<Map<string, ModuleState>>(
    new Map()
  );
  const [activePacket, setActivePacket] = useState<{
    from: [number, number, number];
    to: [number, number, number];
    flowKind: "DATA" | "EVENT" | "AUTH";
    currentEdgeIndex: number;
  } | null>(null);
  const [hoveredModuleId, setHoveredModuleId] = useState<string | null>(null);
  const previousScenarioRef = useRef<string | null>(null);

  // Compute layout positions
  const layoutPositions = useMemo(
    () => computeGridLayout(scenarioData.modules.length),
    [scenarioData.modules.length]
  );

  // Get critical path nodes based on emphasis
  const criticalPathNodes = useMemo(() => {
    if (emphasis === "PERF") {
      return scenarioData.modules.filter(
        (m) => m.type === "CACHE" || m.type === "EDGE"
      );
    } else if (emphasis === "SECURITY") {
      return scenarioData.modules.filter(
        (m) => m.type === "AUTH" || m.type === "API"
      );
    } else if (emphasis === "RELIABILITY") {
      return scenarioData.modules.filter(
        (m) => m.type === "API" || m.type === "REALTIME"
      );
    } else {
      return scenarioData.modules.filter((m) => m.type === "UI");
    }
  }, [scenarioData.modules, emphasis]);

  // Initialize or update module states
  useEffect(() => {
    const currentScenarioId = scenarioData.id;
    const isScenarioChange = previousScenarioRef.current !== currentScenarioId;
    previousScenarioRef.current = currentScenarioId;

    setModuleStates((prev) => {
      const newStates = new Map<string, ModuleState>();

      scenarioData.modules.forEach((module, index) => {
        const layoutPos = layoutPositions[index]?.position || [0, 0, 0];
        const existingState = prev.get(module.id);
        const isCritical = criticalPathNodes.some((m) => m.id === module.id);
        const isDimmed = !isCritical && emphasis !== "DX";

        if (existingState && !isScenarioChange) {
          // Update existing state (emphasis change)
          newStates.set(module.id, {
            ...existingState,
            targetPosition: layoutPos,
            targetScale: isCritical ? 1.2 : 1.0,
            targetOpacity: isDimmed ? 0.3 : 1.0,
            isCritical,
            isDimmed,
          });
        } else {
          // New or scenario change
          if (isScenarioChange && existingState) {
            // Fade out old modules
            newStates.set(module.id, {
              id: module.id,
              position: existingState.position,
              targetPosition: [
                existingState.position[0],
                existingState.position[1] - 1,
                existingState.position[2],
              ],
              scale: existingState.scale,
              targetScale: 0,
              opacity: existingState.opacity,
              targetOpacity: 0,
              isCritical,
              isDimmed,
            });
          } else {
            // New module - start from below
            const startPos: [number, number, number] = [
              layoutPos[0],
              layoutPos[1] - 2,
              layoutPos[2],
            ];
            newStates.set(module.id, {
              id: module.id,
              position: reducedMotion ? layoutPos : startPos,
              targetPosition: layoutPos,
              scale: reducedMotion ? 1.0 : 0,
              targetScale: isCritical ? 1.2 : 1.0,
              opacity: reducedMotion ? (isDimmed ? 0.3 : 1.0) : 0,
              targetOpacity: isDimmed ? 0.3 : 1.0,
              isCritical,
              isDimmed,
            });
          }
        }
      });

      return newStates;
    });
  }, [
    scenarioData,
    layoutPositions,
    criticalPathNodes,
    emphasis,
    reducedMotion,
  ]);

  // Animate module states
  useFrame(() => {
    if (reducedMotion) {
      // Instant updates in reduced motion
      setModuleStates((prev) => {
        const updated = new Map(prev);
        prev.forEach((state, id) => {
          updated.set(id, {
            ...state,
            position: state.targetPosition,
            scale: state.targetScale,
            opacity: state.targetOpacity,
          });
        });
        return updated;
      });
      return;
    }

    // Smooth interpolation
    setModuleStates((prev) => {
      const updated = new Map(prev);
      prev.forEach((state, id) => {
        const lerpFactor = 0.1;
        updated.set(id, {
          ...state,
          position: [
            state.position[0] +
              (state.targetPosition[0] - state.position[0]) * lerpFactor,
            state.position[1] +
              (state.targetPosition[1] - state.position[1]) * lerpFactor,
            state.position[2] +
              (state.targetPosition[2] - state.position[2]) * lerpFactor,
          ] as [number, number, number],
          scale: state.scale + (state.targetScale - state.scale) * lerpFactor,
          opacity:
            state.opacity + (state.targetOpacity - state.opacity) * lerpFactor,
        });
      });
      return updated;
    });
  });

  // Handle flow play animation
  useEffect(() => {
    if (!isPlayingFlow || !onFlowPlay) return;

    // Find critical path edges
    const criticalEdges = scenarioData.flows.filter((flow) => {
      const fromCritical = criticalPathNodes.some((m) => m.id === flow.from);
      const toCritical = criticalPathNodes.some((m) => m.id === flow.to);
      return fromCritical && toCritical;
    });

    if (criticalEdges.length === 0) return;

    let currentEdgeIndex = 0;

    const playNextEdge = () => {
      if (currentEdgeIndex >= criticalEdges.length) {
        setActivePacket(null);
        return;
      }

      const edge = criticalEdges[currentEdgeIndex];
      const fromState = moduleStates.get(edge.from);
      const toState = moduleStates.get(edge.to);

      if (fromState && toState) {
        setActivePacket({
          from: fromState.position,
          to: toState.position,
          flowKind: edge.kind,
          currentEdgeIndex,
        });

        // Move to next edge after delay
        setTimeout(
          () => {
            currentEdgeIndex++;
            playNextEdge();
          },
          reducedMotion ? 100 : 800
        );
      } else {
        currentEdgeIndex++;
        playNextEdge();
      }
    };

    playNextEdge();
  }, [
    isPlayingFlow,
    scenarioData.flows,
    criticalPathNodes,
    moduleStates,
    onFlowPlay,
    reducedMotion,
  ]);

  // Get module position helper
  const getModulePosition = (moduleId: string): [number, number, number] => {
    const state = moduleStates.get(moduleId);
    return state?.position || [0, 0, 0];
  };

  const isFocused = focusTarget === "arch.map";

  return (
    <group>
      {/* Edges */}
      {scenarioData.flows.map((flow) => {
        const fromPos = getModulePosition(flow.from);
        const toPos = getModulePosition(flow.to);
        const fromState = moduleStates.get(flow.from);
        const toState = moduleStates.get(flow.to);

        if (!fromState || !toState) return null;

        const edgeOpacity =
          fromState.opacity * toState.opacity * (isFocused ? 0.8 : 0.4);
        const edgeColor =
          flow.kind === "AUTH"
            ? "#ef4444"
            : flow.kind === "EVENT"
              ? "#a855f7"
              : "#3b82f6";

        return (
          <group key={`${flow.from}-${flow.to}`}>
            <Line
              points={[fromPos, toPos]}
              color={edgeColor}
              lineWidth={flow.kind === "EVENT" ? 2 : 3}
              opacity={edgeOpacity}
              dashed={flow.kind === "EVENT"}
            />
            {!reducedMotion && (
              <mesh
                position={[
                  (fromPos[0] + toPos[0]) / 2,
                  (fromPos[1] + toPos[1]) / 2,
                  (fromPos[2] + toPos[2]) / 2,
                ]}
              >
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshStandardMaterial
                  color={edgeColor}
                  opacity={edgeOpacity * 0.5}
                  transparent
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Modules */}
      {scenarioData.modules.map((module) => {
        const state = moduleStates.get(module.id);
        if (!state) return null;

        const color = getModuleColor(module.type);
        const isHovered = hoveredModuleId === module.id;

        return (
          <group key={module.id} position={state.position}>
            <mesh
              scale={state.scale}
              castShadow
              onClick={() => onNodeClick?.(module.id)}
              onPointerEnter={() => setHoveredModuleId(module.id)}
              onPointerLeave={() => setHoveredModuleId(null)}
            >
              <boxGeometry args={[0.6, 0.6, 0.6]} />
              <meshStandardMaterial
                color={color}
                emissive={state.isCritical ? "#fbbf24" : color}
                emissiveIntensity={state.isCritical ? 0.5 : 0.2}
                opacity={state.opacity}
                transparent
              />
            </mesh>
            {state.isCritical && (
              <mesh position={[0, 0, 0.35]} scale={state.scale * 1.1}>
                <ringGeometry args={[0.35, 0.4, 16]} />
                <meshStandardMaterial
                  color="#fbbf24"
                  emissive="#fbbf24"
                  emissiveIntensity={0.8}
                  opacity={state.opacity * 0.6}
                  transparent
                />
              </mesh>
            )}
            <Text
              position={[0, -0.5, 0]}
              fontSize={0.12}
              color={state.opacity < 0.5 ? "#888888" : "#ffffff"}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#000000"
            >
              {module.label}
            </Text>
            {isHovered && (
              <Html
                position={[0, 0.8, 0]}
                center
                distanceFactor={10}
                style={{ pointerEvents: "none" }}
              >
                <div className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {module.type}
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* Active packet for flow play */}
      {activePacket && !reducedMotion && (
        <Packet
          id={`flow-packet-${activePacket.currentEdgeIndex}`}
          from={activePacket.from}
          to={activePacket.to}
          color={
            activePacket.flowKind === "AUTH"
              ? "#ef4444"
              : activePacket.flowKind === "EVENT"
                ? "#a855f7"
                : "#3b82f6"
          }
          tag={activePacket.flowKind}
          duration={800}
          onComplete={() => {
            // Handled in useEffect
          }}
        />
      )}

      {/* Reduced motion: highlight sequence instead of packet */}
      {activePacket && reducedMotion && (
        <group>
          <mesh position={activePacket.from}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#fbbf24"
              emissiveIntensity={1}
            />
          </mesh>
          <mesh position={activePacket.to}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#fbbf24"
              emissiveIntensity={1}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

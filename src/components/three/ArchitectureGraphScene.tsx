"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion3D } from "./useReducedMotion3D";
import type {
  GraphNode,
  GraphEdge,
  Node3DState,
  Edge3DState,
  PulseState,
} from "./types";

export type CameraPreset = "overview" | "closeup" | "side";

interface ArchitectureGraphSceneProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  changedNodeIds: string[];
  focusedNodeIds: string[];
  showPreviousState?: boolean;
  onNodeClick?: (nodeId: string) => void;
  cameraPreset?: CameraPreset;
  onCameraPresetChange?: (preset: CameraPreset) => void;
}

/**
 * Computes a radial layout for nodes around a center point.
 */
function computeRadialLayout(
  nodeCount: number,
  radius: number = 3
): Array<[number, number, number]> {
  const positions: Array<[number, number, number]> = [];
  const angleStep = (2 * Math.PI) / nodeCount;

  for (let i = 0; i < nodeCount; i++) {
    const angle = i * angleStep;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    const z = 0;
    positions.push([x, y, z]);
  }

  return positions;
}

/**
 * Simple lerp function for smooth transitions.
 */
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Bezier curve interpolation for pulse path.
 */
function bezierPoint(
  p0: [number, number, number],
  p1: [number, number, number],
  p2: [number, number, number],
  t: number
): [number, number, number] {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;

  return [
    uu * p0[0] + 2 * u * t * p1[0] + tt * p2[0],
    uu * p0[1] + 2 * u * t * p1[1] + tt * p2[1],
    uu * p0[2] + 2 * u * t * p1[2] + tt * p2[2],
  ];
}

// Camera preset positions
const CAMERA_PRESETS: Record<
  CameraPreset,
  { position: [number, number, number]; lookAt: [number, number, number] }
> = {
  overview: { position: [0, 0, 8], lookAt: [0, 0, 0] },
  closeup: { position: [0, 0, 4], lookAt: [0, 0, 0] },
  side: { position: [6, 3, 6], lookAt: [0, 0, 0] },
};

export function ArchitectureGraphScene({
  nodes,
  edges,
  changedNodeIds,
  focusedNodeIds,
  showPreviousState = false,
  onNodeClick,
  cameraPreset = "overview",
  onCameraPresetChange,
}: ArchitectureGraphSceneProps) {
  const reducedMotion = useReducedMotion3D();
  const { camera } = useThree();
  const [nodeStates, setNodeStates] = useState<Map<string, Node3DState>>(
    new Map()
  );
  const [edgeStates, setEdgeStates] = useState<Map<string, Edge3DState>>(
    new Map()
  );
  const [pulse, setPulse] = useState<PulseState | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const animationRef = useRef<number>(0);

  // Compute initial layout
  const layoutPositions = useMemo(
    () => computeRadialLayout(nodes.length),
    [nodes.length]
  );

  // Initialize node states
  useEffect(() => {
    const newStates = new Map<string, Node3DState>();
    nodes.forEach((node, index) => {
      const pos = layoutPositions[index] || [0, 0, 0];
      newStates.set(node.id, {
        id: node.id,
        position: pos,
        scale: 1,
        opacity: 1,
        highlighted: node.highlighted || focusedNodeIds.includes(node.id),
      });
    });
    setNodeStates(newStates);
  }, [nodes, layoutPositions, focusedNodeIds]);

  // Initialize edge states
  useEffect(() => {
    const newStates = new Map<string, Edge3DState>();
    edges.forEach((edge) => {
      const key = `${edge.from}-${edge.to}`;
      newStates.set(key, {
        from: edge.from,
        to: edge.to,
        opacity: 0.3,
        width: 1,
      });
    });
    setEdgeStates(newStates);
  }, [edges]);

  // Handle constraint changes - animate affected nodes
  useEffect(() => {
    if (changedNodeIds.length === 0) return;

    setNodeStates((prev) => {
      const updated = new Map(prev);
      const changedNodes = changedNodeIds.map((id) => {
        const state = updated.get(id);
        if (!state) return null;

        // Store previous state for "before vs after" toggle
        const newState: Node3DState = {
          ...state,
          previousPosition: [...state.position] as [number, number, number],
          previousScale: state.scale,
          previousOpacity: state.opacity,
          highlighted: true,
        };

        // Animate: scale up, move forward on Z
        if (!reducedMotion) {
          newState.scale = 1.2;
          newState.position = [
            state.position[0],
            state.position[1],
            state.position[2] + 0.5,
          ];
        } else {
          // Reduced motion: instant update
          newState.scale = 1.1;
        }

        return { id, state: newState };
      });

      changedNodes.forEach((item) => {
        if (item) {
          updated.set(item.id, item.state);
        }
      });

      return updated;
    });

    // Animate connected edges
    setEdgeStates((prev) => {
      const updated = new Map(prev);
      changedNodeIds.forEach((nodeId) => {
        edges.forEach((edge) => {
          if (edge.from === nodeId || edge.to === nodeId) {
            const key = `${edge.from}-${edge.to}`;
            const state = updated.get(key);
            if (state) {
              updated.set(key, {
                ...state,
                previousOpacity: state.opacity,
                previousWidth: state.width,
                opacity: reducedMotion ? 0.8 : 0.9,
                width: reducedMotion ? 2 : 3,
              });
            }
          }
        });
      });
      return updated;
    });

    // Trigger pulse animation (only if not reduced motion)
    if (!reducedMotion && changedNodeIds.length > 0) {
      const mostImpactedNodeId = changedNodeIds[0];
      const mostImpactedState = nodeStates.get(mostImpactedNodeId);
      if (mostImpactedState) {
        // Pulse from center (cause origin) to the most impacted node
        const from: [number, number, number] = [0, 0, 0];
        const to: [number, number, number] = [
          mostImpactedState.position[0],
          mostImpactedState.position[1],
          mostImpactedState.position[2],
        ];
        const control: [number, number, number] = [
          (from[0] + to[0]) / 2,
          (from[1] + to[1]) / 2 + 1,
          (from[2] + to[2]) / 2,
        ];

        setPulse({
          active: true,
          progress: 0,
          from,
          control,
          to,
        });

        // Reset pulse after animation
        setTimeout(() => {
          setPulse(null);
        }, 1000);
      }
    }
  }, [changedNodeIds, reducedMotion, edges, nodeStates]);

  // Handle focus changes - spotlight effect
  useEffect(() => {
    setNodeStates((prev) => {
      const updated = new Map(prev);
      nodes.forEach((node) => {
        const state = updated.get(node.id);
        if (state) {
          const isFocused = focusedNodeIds.includes(node.id);
          updated.set(node.id, {
            ...state,
            highlighted: isFocused,
            opacity: isFocused ? 1 : 0.4,
          });
        }
      });
      return updated;
    });

    // Camera preset positioning (locked camera, no free movement)
    const preset = CAMERA_PRESETS[cameraPreset];
    if (preset) {
      if (reducedMotion) {
        // Instant positioning in reduced motion
        camera.position.set(...preset.position);
        camera.lookAt(...preset.lookAt);
      } else {
        // Smooth transition to preset position
        const startX = camera.position.x;
        const startY = camera.position.y;
        const startZ = camera.position.z;
        const [targetX, targetY, targetZ] = preset.position;

        let progress = 0;
        const animate = () => {
          progress += 0.05;
          if (progress < 1) {
            camera.position.x = lerp(startX, targetX, progress);
            camera.position.y = lerp(startY, targetY, progress);
            camera.position.z = lerp(startZ, targetZ, progress);
            camera.lookAt(...preset.lookAt);
            requestAnimationFrame(animate);
          } else {
            camera.position.set(...preset.position);
            camera.lookAt(...preset.lookAt);
          }
        };
        animate();
      }
    }
  }, [cameraPreset, reducedMotion, camera]);

  // Animation loop for smooth transitions
  useFrame((state, delta) => {
    if (reducedMotion) return; // Skip animation loop in reduced motion

    animationRef.current += delta;

    // Animate nodes back to rest state
    setNodeStates((prev) => {
      const updated = new Map(prev);
      let hasChanges = false;

      prev.forEach((state, id) => {
        if (state.scale > 1 || state.position[2] > 0) {
          const targetScale = 1;
          const targetZ =
            layoutPositions.find((_, i) => {
              const node = nodes[i];
              return node?.id === id;
            })?.[2] || 0;

          const newScale = lerp(state.scale, targetScale, 0.05);
          const newZ = lerp(state.position[2], targetZ, 0.05);

          if (
            Math.abs(newScale - targetScale) > 0.01 ||
            Math.abs(newZ - targetZ) > 0.01
          ) {
            updated.set(id, {
              ...state,
              scale: newScale,
              position: [state.position[0], state.position[1], newZ],
            });
            hasChanges = true;
          } else {
            // Snap to final state
            updated.set(id, {
              ...state,
              scale: targetScale,
              position: [state.position[0], state.position[1], targetZ],
            });
          }
        }
      });

      return hasChanges ? updated : prev;
    });

    // Animate edges back to rest state
    setEdgeStates((prev) => {
      const updated = new Map(prev);
      let hasChanges = false;

      prev.forEach((state, key) => {
        if (state.opacity > 0.3 || state.width > 1) {
          const targetOpacity = 0.3;
          const targetWidth = 1;

          const newOpacity = lerp(state.opacity, targetOpacity, 0.05);
          const newWidth = lerp(state.width, targetWidth, 0.05);

          if (
            Math.abs(newOpacity - targetOpacity) > 0.01 ||
            Math.abs(newWidth - targetWidth) > 0.01
          ) {
            updated.set(key, {
              ...state,
              opacity: newOpacity,
              width: newWidth,
            });
            hasChanges = true;
          } else {
            updated.set(key, {
              ...state,
              opacity: targetOpacity,
              width: targetWidth,
            });
          }
        }
      });

      return hasChanges ? updated : prev;
    });

    // Animate pulse
    if (pulse && pulse.active) {
      setPulse((prev) => {
        if (!prev) return null;
        const newProgress = Math.min(prev.progress + delta * 2, 1);
        if (newProgress >= 1) {
          return { ...prev, active: false };
        }
        return { ...prev, progress: newProgress };
      });
    }
  });

  // Render nodes
  const nodeMeshes = useMemo(() => {
    return Array.from(nodeStates.values()).map((state) => {
      const node = nodes.find((n) => n.id === state.id);
      if (!node) return null;

      const isHovered = hoveredNodeId === state.id;
      const isFocused = focusedNodeIds.includes(state.id);
      const isChanged = changedNodeIds.includes(state.id);

      // Color based on state
      let color = "#6b7280"; // gray
      if (isFocused) color = "#3b82f6"; // blue
      if (isChanged) color = "#10b981"; // green
      if (isHovered) color = "#f59e0b"; // amber

      return (
        <group key={state.id} position={state.position}>
          {/* Node sphere */}
          <mesh
            scale={state.scale}
            onPointerEnter={() => setHoveredNodeId(state.id)}
            onPointerLeave={() => setHoveredNodeId(null)}
            onClick={() => onNodeClick?.(state.id)}
          >
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={isFocused || isChanged ? color : "#000000"}
              emissiveIntensity={isFocused || isChanged ? 0.3 : 0}
              opacity={state.opacity}
              transparent
            />
          </mesh>

          {/* Outline ring for focused/changed nodes */}
          {(isFocused || isChanged) && (
            <mesh>
              <ringGeometry args={[0.45, 0.5, 32]} />
              <meshBasicMaterial
                color={color}
                opacity={0.6}
                transparent
                side={THREE.DoubleSide}
              />
            </mesh>
          )}

          {/* Label */}
          <Html
            position={[0, -0.7, 0]}
            center
            distanceFactor={5}
            style={{
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            <div
              className="text-xs font-medium text-center whitespace-nowrap"
              style={{
                color: isFocused || isChanged ? "#1f2937" : "#6b7280",
                textShadow: "0 1px 2px rgba(255,255,255,0.8)",
              }}
            >
              {node.label}
            </div>
          </Html>

          {/* Previous state ghost (if toggle is on) */}
          {showPreviousState &&
            state.previousPosition &&
            state.previousScale &&
            state.previousOpacity && (
              <mesh
                position={state.previousPosition}
                scale={state.previousScale}
              >
                <sphereGeometry args={[0.4, 16, 16]} />
                <meshStandardMaterial
                  color="#9ca3af"
                  opacity={state.previousOpacity * 0.3}
                  transparent
                />
              </mesh>
            )}
        </group>
      );
    });
  }, [
    nodeStates,
    nodes,
    hoveredNodeId,
    focusedNodeIds,
    changedNodeIds,
    showPreviousState,
    onNodeClick,
  ]);

  // Render edges
  const edgeLines = useMemo(() => {
    return Array.from(edgeStates.values()).map((edgeState) => {
      const fromState = nodeStates.get(edgeState.from);
      const toState = nodeStates.get(edgeState.to);

      if (!fromState || !toState) return null;

      const from = fromState.position;
      const to = toState.position;

      // Create line geometry
      const points = [new THREE.Vector3(...from), new THREE.Vector3(...to)];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      return (
        <primitive
          key={`${edgeState.from}-${edgeState.to}`}
          object={
            new THREE.Line(
              geometry,
              new THREE.LineBasicMaterial({
                color: "#6b7280",
                opacity: edgeState.opacity,
                transparent: true,
                linewidth: edgeState.width,
              })
            )
          }
        />
      );
    });
  }, [edgeStates, nodeStates]);

  // Render pulse
  const pulseMesh = useMemo(() => {
    if (!pulse || !pulse.active || reducedMotion) return null;

    const pos = bezierPoint(
      pulse.from,
      pulse.control,
      pulse.to,
      pulse.progress
    );

    return (
      <mesh position={pos}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>
    );
  }, [pulse, reducedMotion]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, -5, -5]} intensity={0.3} />

      {nodeMeshes}
      {edgeLines}
      {pulseMesh}

      {/* Camera preset controls (rendered as HTML overlay) */}
      {onCameraPresetChange && (
        <Html position={[0, -4, 0]} center>
          <div className="flex gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => onCameraPresetChange("overview")}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                cameraPreset === "overview"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onCameraPresetChange("closeup")}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                cameraPreset === "closeup"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Close-up
            </button>
            <button
              onClick={() => onCameraPresetChange("side")}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                cameraPreset === "side"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Side
            </button>
          </div>
        </Html>
      )}
    </>
  );
}

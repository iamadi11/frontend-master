"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion3D } from "./useReducedMotion3D";
import { Packet } from "./Packet";

type Backpressure = "NONE" | "BATCH" | "THROTTLE" | "DROP_OLD" | "ACK_WINDOW";

interface BufferTank3DProps {
  bufferDepth: number;
  maxDepth: number;
  backpressure: Backpressure;
  droppedMsgsPct: number;
  latencyMs: number;
  isStreaming: boolean;
  focusTarget?: string | null;
  onPacketArrive?: () => void;
  onPacketDrop?: () => void;
}

/**
 * 3D buffer tank visualization showing fill level, backpressure strategies, and metrics.
 */
export function BufferTank3D({
  bufferDepth,
  maxDepth,
  backpressure,
  droppedMsgsPct,
  latencyMs,
  isStreaming,
  focusTarget,
  onPacketArrive,
  onPacketDrop,
}: BufferTank3DProps) {
  const reducedMotion = useReducedMotion3D();
  const tankRef = useRef<THREE.Group>(null);
  const fillRef = useRef<THREE.Mesh>(null);

  const fillPercent = Math.min(100, (bufferDepth / maxDepth) * 100);
  const isFocused = focusTarget === "buffer";

  // Color based on fill level
  const getFillColor = () => {
    if (fillPercent > 75) return "#ef4444"; // red
    if (fillPercent > 50) return "#f59e0b"; // amber
    return "#10b981"; // green
  };

  useFrame(() => {
    if (!fillRef.current || reducedMotion) return;

    // Animate fill level
    const targetHeight = (fillPercent / 100) * 0.8;
    fillRef.current.scale.y = THREE.MathUtils.lerp(
      fillRef.current.scale.y,
      targetHeight,
      0.1
    );
    fillRef.current.position.y = -0.4 + targetHeight * 0.4;
  });

  return (
    <group ref={tankRef} position={[0, 0, 0]}>
      {/* Tank container */}
      <RoundedBox
        args={[0.6, 1, 0.6]}
        radius={0.05}
        position={[0, 0, 0]}
        castShadow
      >
        <meshStandardMaterial
          color={isFocused ? "#374151" : "#4b5563"}
          opacity={0.3}
          transparent
        />
      </RoundedBox>

      {/* Fill level */}
      <mesh
        ref={fillRef}
        position={[0, -0.4 + (fillPercent / 100) * 0.4, 0]}
        scale={[1, fillPercent / 100, 1]}
      >
        <boxGeometry args={[0.55, 0.8, 0.55]} />
        <meshStandardMaterial
          color={getFillColor()}
          emissive={getFillColor()}
          emissiveIntensity={0.4}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Tank label */}
      <Text
        position={[0, 0.7, 0]}
        fontSize={0.12}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        Buffer Tank
      </Text>

      {/* Depth indicator */}
      <Text
        position={[0, -0.7, 0]}
        fontSize={0.1}
        color="#9ca3af"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {bufferDepth}/{maxDepth}
      </Text>

      {/* Backpressure strategy badge */}
      {backpressure !== "NONE" && (
        <Text
          position={[0, 0.5, 0]}
          fontSize={0.08}
          color="#fbbf24"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {backpressure.replace(/_/g, " ")}
        </Text>
      )}

      {/* Metrics badges */}
      <group position={[-0.8, 0, 0]}>
        <Text
          position={[0, 0.3, 0]}
          fontSize={0.08}
          color="#ef4444"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          Dropped: {droppedMsgsPct.toFixed(1)}%
        </Text>
        <Text
          position={[0, 0.1, 0]}
          fontSize={0.08}
          color="#3b82f6"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          Latency: {latencyMs.toFixed(0)}ms
        </Text>
      </group>

      {/* ACK window gates (for ACK_WINDOW strategy) */}
      {backpressure === "ACK_WINDOW" && (
        <group position={[0, 0.2, 0]}>
          <mesh position={[-0.3, 0, 0]}>
            <boxGeometry args={[0.1, 0.05, 0.6]} />
            <meshStandardMaterial color="#fbbf24" />
          </mesh>
          <mesh position={[0.3, 0, 0]}>
            <boxGeometry args={[0.1, 0.05, 0.6]} />
            <meshStandardMaterial color="#fbbf24" />
          </mesh>
        </group>
      )}

      {/* Reduced motion: show static indicators */}
      {reducedMotion && (
        <Text
          position={[0, 0.3, 0]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          Fill: {fillPercent.toFixed(0)}%
        </Text>
      )}
    </group>
  );
}

"use client";

import { useRef, useEffect } from "react";
import { Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion3D } from "./useReducedMotion3D";

export type StationType = "UI" | "CACHE" | "QUEUE" | "SERVER";

interface PipelineNodeProps {
  type: StationType;
  position: [number, number, number];
  highlighted?: boolean;
  status?: string;
  count?: number;
  onHover?: (type: StationType | null) => void;
  onClick?: (type: StationType) => void;
}

const STATION_COLORS: Record<StationType, string> = {
  UI: "#3b82f6", // blue
  CACHE: "#10b981", // green
  QUEUE: "#f59e0b", // amber
  SERVER: "#8b5cf6", // purple
};

const STATION_LABELS: Record<StationType, string> = {
  UI: "Client UI",
  CACHE: "Cache",
  QUEUE: "Queue",
  SERVER: "Server",
};

/**
 * A station node in the state pipeline.
 * Represents UI, Cache, Queue, or Server.
 */
export function PipelineNode({
  type,
  position,
  highlighted = false,
  status,
  count,
  onHover,
  onClick,
}: PipelineNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const reducedMotion = useReducedMotion3D();
  const color = STATION_COLORS[type];
  const label = STATION_LABELS[type];

  useEffect(() => {
    if (!meshRef.current) return;

    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    if (highlighted) {
      material.emissiveIntensity = 0.5;
      material.emissive.set(color);
    } else {
      material.emissiveIntensity = 0.1;
      material.emissive.set(color);
    }
  }, [highlighted, color]);

  return (
    <group position={position}>
      {/* Station pedestal */}
      <RoundedBox
        ref={meshRef}
        args={[1.2, 0.8, 0.3]}
        radius={0.1}
        smoothness={4}
        castShadow
        onPointerEnter={() => onHover?.(type)}
        onPointerLeave={() => onHover?.(null)}
        onClick={() => onClick?.(type)}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={highlighted ? 0.5 : 0.1}
        />
      </RoundedBox>

      {/* Label */}
      <Html
        position={[0, -0.6, 0]}
        center
        distanceFactor={5}
        style={{
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div
          className="text-xs font-semibold text-center whitespace-nowrap"
          style={{
            color: highlighted ? "#1f2937" : "#6b7280",
            textShadow: "0 1px 2px rgba(255,255,255,0.8)",
          }}
        >
          {label}
        </div>
      </Html>

      {/* Status badge */}
      {status && (
        <Html
          position={[0, 0.6, 0]}
          center
          distanceFactor={5}
          style={{
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <div
            className="px-2 py-1 text-xs font-medium rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
            style={{
              color: highlighted ? "#1f2937" : "#6b7280",
            }}
          >
            {status}
          </div>
        </Html>
      )}

      {/* Count badge (for Queue) */}
      {count !== undefined && count > 0 && (
        <Html
          position={[0.7, 0.4, 0]}
          center
          distanceFactor={5}
          style={{
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <div className="w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full bg-amber-500 text-white">
            {count}
          </div>
        </Html>
      )}
    </group>
  );
}

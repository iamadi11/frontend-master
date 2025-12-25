"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { PhasePosition } from "./timelines";

interface PhaseMarkersProps {
  phases: PhasePosition[];
  trackLength: number;
  highlightedPhaseId?: string | null;
  onPhaseClick?: (phaseId: string) => void;
  reducedMotion: boolean;
}

/**
 * Renders phase gate markers along the conveyor track.
 * Each gate is a vertical frame with a label showing the phase name and duration.
 */
export function PhaseMarkers({
  phases,
  trackLength,
  highlightedPhaseId,
  onPhaseClick,
  reducedMotion,
}: PhaseMarkersProps) {
  const gatesRef = useRef<THREE.Group>(null);

  // Animate gate positions when phases change (only if not reduced motion)
  useFrame(() => {
    if (!gatesRef.current || reducedMotion) return;
    // Positions are computed in timelines.ts, so we just update them here
    // The animation is handled by React Three Fiber's state updates
  });

  return (
    <group ref={gatesRef}>
      {phases.map((phase, index) => {
        const isHighlighted = phase.id === highlightedPhaseId;
        const x = phase.position - trackLength / 2; // Center track at origin

        return (
          <group key={phase.id} position={[x, 0, 0]}>
            {/* Vertical gate frame */}
            <mesh
              position={[0, 0.5, 0]}
              onClick={() => onPhaseClick?.(phase.id)}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "default";
              }}
            >
              <boxGeometry args={[0.1, 1, 0.05]} />
              <meshStandardMaterial
                color={isHighlighted ? "#fbbf24" : "#6366f1"}
                emissive={isHighlighted ? "#fbbf24" : "#6366f1"}
                emissiveIntensity={isHighlighted ? 0.3 : 0.1}
              />
            </mesh>

            {/* Phase label */}
            <Text
              position={[0, 1.2, 0]}
              fontSize={0.15}
              color={isHighlighted ? "#fbbf24" : "#9ca3af"}
              anchorX="center"
              anchorY="middle"
            >
              {phase.label}
            </Text>

            {/* Duration label */}
            <Text
              position={[0, 0.9, 0]}
              fontSize={0.1}
              color="#6b7280"
              anchorX="center"
              anchorY="middle"
            >
              {phase.duration}ms
            </Text>
          </group>
        );
      })}
    </group>
  );
}

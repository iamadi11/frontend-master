"use client";

import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";
import * as THREE from "three";

interface TestPyramid3DProps {
  recommendedMix: {
    unitPct: number;
    integrationPct: number;
    e2ePct: number;
  };
  notes: string[];
  focused: boolean;
  reducedMotion: boolean;
}

const SLAB_COLORS = {
  unit: "#10b981", // green
  integration: "#f59e0b", // yellow/amber
  e2e: "#ef4444", // red
};

const BASE_HEIGHT = 0.3;
const MAX_HEIGHT = 2.5;
const SLAB_WIDTH = 2;
const SLAB_DEPTH = 1.5;
const SLAB_SPACING = 0.1;

/**
 * 3D visualization of the test pyramid.
 * Three stacked slabs representing Unit, Integration, and E2E tests.
 * Slabs morph height based on recommendedMix percentages.
 */
export function TestPyramid3D({
  recommendedMix,
  notes,
  focused,
  reducedMotion,
}: TestPyramid3DProps) {
  const unitSlabRef = useRef<THREE.Mesh>(null);
  const integrationSlabRef = useRef<THREE.Mesh>(null);
  const e2eSlabRef = useRef<THREE.Mesh>(null);

  // Calculate target heights (normalized to 0-1, then scaled)
  const targetHeights = useMemo(() => {
    const total =
      recommendedMix.unitPct +
      recommendedMix.integrationPct +
      recommendedMix.e2ePct;
    return {
      unit: (recommendedMix.unitPct / 100) * MAX_HEIGHT,
      integration: (recommendedMix.integrationPct / 100) * MAX_HEIGHT,
      e2e: (recommendedMix.e2ePct / 100) * MAX_HEIGHT,
    };
  }, [recommendedMix]);

  // Find slab with largest delta (for spotlight) - only when focused
  const largestDelta = useMemo(() => {
    if (!focused) return null;
    const deltas = {
      unit: Math.abs(
        targetHeights.unit - (unitSlabRef.current?.scale.y || 0) * BASE_HEIGHT
      ),
      integration: Math.abs(
        targetHeights.integration -
          (integrationSlabRef.current?.scale.y || 0) * BASE_HEIGHT
      ),
      e2e: Math.abs(
        targetHeights.e2e - (e2eSlabRef.current?.scale.y || 0) * BASE_HEIGHT
      ),
    };
    const max = Math.max(deltas.unit, deltas.integration, deltas.e2e);
    if (max < 0.05) return null; // No significant change
    if (max === deltas.unit) return "unit";
    if (max === deltas.integration) return "integration";
    return "e2e";
  }, [targetHeights, focused]);

  // Animate slab heights
  useFrame(() => {
    if (reducedMotion) return;

    if (unitSlabRef.current) {
      const currentHeight = unitSlabRef.current.scale.y * BASE_HEIGHT;
      const diff = targetHeights.unit - currentHeight;
      if (Math.abs(diff) > 0.01) {
        const newHeight = currentHeight + diff * 0.1;
        unitSlabRef.current.scale.y = newHeight / BASE_HEIGHT;
      } else {
        unitSlabRef.current.scale.y = targetHeights.unit / BASE_HEIGHT;
      }
    }

    if (integrationSlabRef.current) {
      const currentHeight = integrationSlabRef.current.scale.y * BASE_HEIGHT;
      const diff = targetHeights.integration - currentHeight;
      if (Math.abs(diff) > 0.01) {
        const newHeight = currentHeight + diff * 0.1;
        integrationSlabRef.current.scale.y = newHeight / BASE_HEIGHT;
      } else {
        integrationSlabRef.current.scale.y =
          targetHeights.integration / BASE_HEIGHT;
      }
    }

    if (e2eSlabRef.current) {
      const currentHeight = e2eSlabRef.current.scale.y * BASE_HEIGHT;
      const diff = targetHeights.e2e - currentHeight;
      if (Math.abs(diff) > 0.01) {
        const newHeight = currentHeight + diff * 0.1;
        e2eSlabRef.current.scale.y = newHeight / BASE_HEIGHT;
      } else {
        e2eSlabRef.current.scale.y = targetHeights.e2e / BASE_HEIGHT;
      }
    }
  });

  // Instant update for reduced motion
  useEffect(() => {
    if (!reducedMotion) return;
    if (unitSlabRef.current) {
      unitSlabRef.current.scale.y = targetHeights.unit / BASE_HEIGHT;
    }
    if (integrationSlabRef.current) {
      integrationSlabRef.current.scale.y =
        targetHeights.integration / BASE_HEIGHT;
    }
    if (e2eSlabRef.current) {
      e2eSlabRef.current.scale.y = targetHeights.e2e / BASE_HEIGHT;
    }
  }, [targetHeights, reducedMotion]);

  const opacity = focused ? 1 : 0.3;

  // Calculate Y positions for stacking (bottom to top: unit, integration, e2e)
  // Use target heights for initial positioning
  const unitY = targetHeights.unit / 2;
  const integrationY =
    targetHeights.unit + SLAB_SPACING + targetHeights.integration / 2;
  const e2eY =
    targetHeights.unit +
    SLAB_SPACING +
    targetHeights.integration +
    SLAB_SPACING +
    targetHeights.e2e / 2;

  // Trade-off tags (simplified - speed, confidence, flakiness)
  const tradeOffs = {
    unit: "Fast, High Confidence",
    integration: "Moderate Speed, Good Coverage",
    e2e: "Slow, Realistic, Flaky Risk",
  };

  return (
    <group position={[0, 0, 0]}>
      {/* Unit Test Slab (bottom, widest) */}
      <group position={[0, unitY, 0]}>
        <mesh ref={unitSlabRef} castShadow receiveShadow>
          <boxGeometry args={[SLAB_WIDTH, BASE_HEIGHT, SLAB_DEPTH]} />
          <meshStandardMaterial
            color={SLAB_COLORS.unit}
            opacity={opacity}
            transparent
            emissive={largestDelta === "unit" ? SLAB_COLORS.unit : "#000000"}
            emissiveIntensity={largestDelta === "unit" ? 0.4 : 0}
          />
        </mesh>
        <Text
          position={[0, BASE_HEIGHT * 0.6, SLAB_DEPTH / 2 + 0.1]}
          fontSize={0.25}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Unit: {recommendedMix.unitPct}%
        </Text>
        {largestDelta === "unit" && (
          <Html position={[SLAB_WIDTH / 2 + 0.3, 0, 0]} center>
            <div className="bg-white/90 dark:bg-gray-900/90 px-2 py-1 rounded shadow text-xs whitespace-nowrap">
              {tradeOffs.unit}
            </div>
          </Html>
        )}
      </group>

      {/* Integration Test Slab (middle) */}
      <group position={[0, integrationY, 0]}>
        <mesh ref={integrationSlabRef} castShadow receiveShadow>
          <boxGeometry
            args={[SLAB_WIDTH * 0.85, BASE_HEIGHT, SLAB_DEPTH * 0.85]}
          />
          <meshStandardMaterial
            color={SLAB_COLORS.integration}
            opacity={opacity}
            transparent
            emissive={
              largestDelta === "integration"
                ? SLAB_COLORS.integration
                : "#000000"
            }
            emissiveIntensity={largestDelta === "integration" ? 0.4 : 0}
          />
        </mesh>
        <Text
          position={[0, BASE_HEIGHT * 0.6, (SLAB_DEPTH * 0.85) / 2 + 0.1]}
          fontSize={0.22}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Integration: {recommendedMix.integrationPct}%
        </Text>
        {largestDelta === "integration" && (
          <Html position={[(SLAB_WIDTH * 0.85) / 2 + 0.3, 0, 0]} center>
            <div className="bg-white/90 dark:bg-gray-900/90 px-2 py-1 rounded shadow text-xs whitespace-nowrap">
              {tradeOffs.integration}
            </div>
          </Html>
        )}
      </group>

      {/* E2E Test Slab (top, narrowest) */}
      <group position={[0, e2eY, 0]}>
        <mesh ref={e2eSlabRef} castShadow receiveShadow>
          <boxGeometry
            args={[SLAB_WIDTH * 0.7, BASE_HEIGHT, SLAB_DEPTH * 0.7]}
          />
          <meshStandardMaterial
            color={SLAB_COLORS.e2e}
            opacity={opacity}
            transparent
            emissive={largestDelta === "e2e" ? SLAB_COLORS.e2e : "#000000"}
            emissiveIntensity={largestDelta === "e2e" ? 0.4 : 0}
          />
        </mesh>
        <Text
          position={[0, BASE_HEIGHT * 0.6, (SLAB_DEPTH * 0.7) / 2 + 0.1]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          E2E: {recommendedMix.e2ePct}%
        </Text>
        {largestDelta === "e2e" && (
          <Html position={[(SLAB_WIDTH * 0.7) / 2 + 0.3, 0, 0]} center>
            <div className="bg-white/90 dark:bg-gray-900/90 px-2 py-1 rounded shadow text-xs whitespace-nowrap">
              {tradeOffs.e2e}
            </div>
          </Html>
        )}
      </group>

      {/* Notes tooltip */}
      {notes.length > 0 && focused && (
        <Html position={[0, e2eY + 1.5, 0]} center>
          <div className="bg-white/90 dark:bg-gray-900/90 px-3 py-2 rounded shadow-lg max-w-xs text-xs">
            <div className="font-semibold mb-1">Trade-off Notes:</div>
            {notes.map((note, i) => (
              <div key={i} className="text-gray-700 dark:text-gray-300">
                • {note}
              </div>
            ))}
          </div>
        </Html>
      )}
    </group>
  );
}

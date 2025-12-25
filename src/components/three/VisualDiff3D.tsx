"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";
import * as THREE from "three";

interface VisualDiff3DProps {
  baseline: {
    layout: string;
    color: string;
    spacing: string;
  };
  current: {
    layout: string;
    color: string;
    spacing: string;
  };
  visualDiff: {
    changed: string[];
    severity: "LOW" | "MEDIUM" | "HIGH";
  } | null;
  focused: boolean;
  reducedMotion: boolean;
}

const SCREEN_WIDTH = 2;
const SCREEN_HEIGHT = 1.5;
const SCREEN_DEPTH = 0.1;
const SCREEN_SPACING = 3;
const DIFF_TILE_SIZE = 0.3;

const SEVERITY_COLORS = {
  LOW: "#3b82f6", // blue
  MEDIUM: "#f59e0b", // amber
  HIGH: "#ef4444", // red
};

/**
 * 3D visualization of visual regression testing.
 * Two "screens" (Baseline and Current) with diff overlay tiles on changed areas.
 */
export function VisualDiff3D({
  baseline,
  current,
  visualDiff,
  focused,
  reducedMotion,
}: VisualDiff3DProps) {
  const baselineRef = useRef<THREE.Mesh>(null);
  const currentRef = useRef<THREE.Mesh>(null);
  const [screensVisible, setScreensVisible] = useState(false);
  const [diffTilesVisible, setDiffTilesVisible] = useState(false);
  const scanlineRef = useRef<THREE.Mesh>(null);
  const [scanlineY, setScanlineY] = useState(SCREEN_HEIGHT / 2);

  // Trigger screen reveal when visual diff is computed
  useEffect(() => {
    if (visualDiff && visualDiff.changed.length > 0) {
      if (reducedMotion) {
        setScreensVisible(true);
        setDiffTilesVisible(true);
        setScanlineY(SCREEN_HEIGHT / 2); // Hide scanline in reduced motion
      } else {
        // Fade in screens
        setScreensVisible(true);
        setTimeout(() => {
          setDiffTilesVisible(true);
          // Trigger scanline animation (one-time sweep)
          setScanlineY(SCREEN_HEIGHT / 2);
          setTimeout(() => {
            setScanlineY(-SCREEN_HEIGHT / 2);
            setTimeout(() => setScanlineY(SCREEN_HEIGHT / 2), 1000);
          }, 100);
        }, 300);
      }
    } else {
      setScreensVisible(false);
      setDiffTilesVisible(false);
      setScanlineY(SCREEN_HEIGHT / 2);
    }
  }, [visualDiff, reducedMotion]);

  // Animate scanline
  useFrame((state) => {
    if (!scanlineRef.current || reducedMotion || !diffTilesVisible) return;
    const targetY = scanlineY;
    const currentY = scanlineRef.current.position.y;
    const diff = targetY - currentY;
    if (Math.abs(diff) > 0.01) {
      scanlineRef.current.position.y += diff * 0.1;
    } else {
      scanlineRef.current.position.y = targetY;
    }
  });

  // Get colors based on state
  const getColor = (state: { layout: string; color: string }) => {
    if (state.color === "A") {
      return state.layout === "A" ? "#dbeafe" : "#e9d5ff";
    } else {
      return state.layout === "A" ? "#fef3c7" : "#fce7f3";
    }
  };

  const baselineColor = getColor(baseline);
  const currentColor = getColor(current);

  // Calculate diff tile positions (simplified: place tiles on changed areas)
  const diffTilePositions = useMemo(() => {
    if (!visualDiff || visualDiff.changed.length === 0) return [];
    const positions: Array<{ x: number; y: number; area: string }> = [];
    const gridCols = 4;
    const gridRows = 3;
    const tileSpacing = SCREEN_WIDTH / gridCols;

    visualDiff.changed.forEach((area, index) => {
      const col = index % gridCols;
      const row = Math.floor(index / gridCols);
      positions.push({
        x: (col - gridCols / 2 + 0.5) * tileSpacing,
        y: (gridRows / 2 - row - 0.5) * (SCREEN_HEIGHT / gridRows),
        area,
      });
    });
    return positions;
  }, [visualDiff]);

  const opacity = focused ? 1 : 0.3;
  const screenOpacity = screensVisible ? opacity : 0;

  return (
    <group position={[0, 0, 0]}>
      {/* Baseline Screen (left) */}
      <group position={[-SCREEN_SPACING / 2, 0, 0]}>
        <mesh ref={baselineRef} castShadow>
          <boxGeometry args={[SCREEN_WIDTH, SCREEN_HEIGHT, SCREEN_DEPTH]} />
          <meshStandardMaterial
            color={baselineColor}
            opacity={screenOpacity}
            transparent
            emissive={focused ? baselineColor : "#000000"}
            emissiveIntensity={focused ? 0.2 : 0}
          />
        </mesh>
        <Text
          position={[0, -SCREEN_HEIGHT / 2 - 0.3, SCREEN_DEPTH / 2 + 0.1]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="top"
        >
          Baseline
        </Text>
        <Text
          position={[0, -SCREEN_HEIGHT / 2 - 0.5, SCREEN_DEPTH / 2 + 0.1]}
          fontSize={0.15}
          color="#9ca3af"
          anchorX="center"
          anchorY="top"
        >
          L:{baseline.layout} C:{baseline.color} S:{baseline.spacing}
        </Text>
      </group>

      {/* Current Screen (right) */}
      <group position={[SCREEN_SPACING / 2, 0, 0]}>
        <mesh ref={currentRef} castShadow>
          <boxGeometry args={[SCREEN_WIDTH, SCREEN_HEIGHT, SCREEN_DEPTH]} />
          <meshStandardMaterial
            color={currentColor}
            opacity={screenOpacity}
            transparent
            emissive={focused ? currentColor : "#000000"}
            emissiveIntensity={focused ? 0.2 : 0}
          />
        </mesh>
        <Text
          position={[0, -SCREEN_HEIGHT / 2 - 0.3, SCREEN_DEPTH / 2 + 0.1]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="top"
        >
          Current
        </Text>
        <Text
          position={[0, -SCREEN_HEIGHT / 2 - 0.5, SCREEN_DEPTH / 2 + 0.1]}
          fontSize={0.15}
          color="#9ca3af"
          anchorX="center"
          anchorY="top"
        >
          L:{current.layout} C:{current.color} S:{current.spacing}
        </Text>

        {/* Diff overlay tiles */}
        {diffTilesVisible &&
          visualDiff &&
          visualDiff.changed.length > 0 &&
          diffTilePositions.map((pos, index) => {
            const severityColor = SEVERITY_COLORS[visualDiff.severity];
            return (
              <mesh
                key={index}
                position={[pos.x, pos.y, SCREEN_DEPTH / 2 + 0.05]}
                rotation={[0, 0, 0]}
              >
                <boxGeometry args={[DIFF_TILE_SIZE, DIFF_TILE_SIZE, 0.05]} />
                <meshStandardMaterial
                  color={severityColor}
                  opacity={0.7}
                  transparent
                  emissive={severityColor}
                  emissiveIntensity={0.5}
                />
              </mesh>
            );
          })}

        {/* Scanline (optional, user-triggered) */}
        {diffTilesVisible && !reducedMotion && (
          <mesh
            ref={scanlineRef}
            position={[0, SCREEN_HEIGHT / 2, SCREEN_DEPTH / 2 + 0.1]}
          >
            <boxGeometry args={[SCREEN_WIDTH, 0.05, 0.05]} />
            <meshStandardMaterial
              color="#ffffff"
              opacity={0.6}
              transparent
              emissive="#ffffff"
              emissiveIntensity={0.8}
            />
          </mesh>
        )}
      </group>

      {/* Diff summary */}
      {visualDiff && visualDiff.changed.length > 0 && (
        <Html position={[0, SCREEN_HEIGHT / 2 + 0.8, 0]} center>
          <div
            className={`px-3 py-2 rounded shadow-lg border-2 text-xs ${
              visualDiff.severity === "HIGH"
                ? "bg-red-50 dark:bg-red-900/90 border-red-500"
                : visualDiff.severity === "MEDIUM"
                  ? "bg-yellow-50 dark:bg-yellow-900/90 border-yellow-500"
                  : "bg-blue-50 dark:bg-blue-900/90 border-blue-500"
            }`}
          >
            <div
              className={`font-semibold mb-1 ${
                visualDiff.severity === "HIGH"
                  ? "text-red-700 dark:text-red-300"
                  : visualDiff.severity === "MEDIUM"
                    ? "text-yellow-700 dark:text-yellow-300"
                    : "text-blue-700 dark:text-blue-300"
              }`}
            >
              Severity: {visualDiff.severity}
            </div>
            <div className="text-gray-700 dark:text-gray-300">
              Changed: {visualDiff.changed.join(", ")}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

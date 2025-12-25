"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion3D } from "./useReducedMotion3D";

interface ErrorFlowStep {
  phase: string;
  uiState: string;
  note: string;
}

interface ErrorBoundaryContainment3DProps {
  errorType: string;
  boundaryStrategy: "NONE" | "PAGE_BOUNDARY" | "WIDGET_BOUNDARY";
  errorFlow: ErrorFlowStep[];
  hasError: boolean;
  focusTarget?: string | null;
}

/**
 * 3D visualization of error boundary containment.
 * Shows UI surface split into zones (page vs widget boundaries) with containment visualization.
 */
export function ErrorBoundaryContainment3D({
  errorType,
  boundaryStrategy,
  errorFlow,
  hasError,
  focusTarget,
}: ErrorBoundaryContainment3DProps) {
  const reducedMotion = useReducedMotion3D();
  const [crashWave, setCrashWave] = useState(false);
  const [boundaryPoints, setBoundaryPoints] = useState<number[][]>([]);

  // Update boundary lines when strategy changes
  useEffect(() => {
    if (reducedMotion) {
      // Instant update in reduced motion
      updateBoundaryLines();
      return;
    }

    // Animate boundary lines moving
    const timeout = setTimeout(() => {
      updateBoundaryLines();
    }, 300);
    return () => clearTimeout(timeout);
  }, [boundaryStrategy, reducedMotion]);

  const updateBoundaryLines = () => {
    let points: number[][] = [];
    if (boundaryStrategy === "PAGE_BOUNDARY") {
      // Page boundary: large rectangle around entire UI
      points = [
        [-2, -1, 0.05],
        [2, -1, 0.05],
        [2, 1, 0.05],
        [-2, 1, 0.05],
        [-2, -1, 0.05], // close the loop
      ];
    } else if (boundaryStrategy === "WIDGET_BOUNDARY") {
      // Widget boundary: smaller rectangle for one widget
      points = [
        [-0.5, -0.5, 0.05],
        [0.5, -0.5, 0.05],
        [0.5, 0.5, 0.05],
        [-0.5, 0.5, 0.05],
        [-0.5, -0.5, 0.05], // close the loop
      ];
    }
    setBoundaryPoints(points);
  };

  // Trigger crash wave when error occurs
  useEffect(() => {
    if (hasError && !reducedMotion) {
      setCrashWave(true);
      setTimeout(() => setCrashWave(false), 1000);
    } else if (hasError && reducedMotion) {
      // In reduced motion, just show instant state change
      setCrashWave(false);
    }
  }, [hasError, reducedMotion]);

  const isFocused = focusTarget === "error.sim" || focusTarget === null;
  const showPageLevel = boundaryStrategy === "PAGE_BOUNDARY" && hasError;
  const showWidgetLevel = boundaryStrategy === "WIDGET_BOUNDARY" && hasError;
  const showNoBoundary = boundaryStrategy === "NONE" && hasError;

  return (
    <group>
      {/* UI Surface (main plane) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[4, 2]} />
        <meshStandardMaterial
          color={hasError ? "#fee2e2" : "#f3f4f6"}
          opacity={isFocused ? 1 : 0.5}
          transparent
        />
      </mesh>

      {/* Widget zones */}
      {!showPageLevel && (
        <>
          {/* Widget 1 (error zone) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.01]}>
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial
              color={
                showWidgetLevel && hasError
                  ? "#fee2e2"
                  : showNoBoundary
                    ? "#fee2e2"
                    : "#e5e7eb"
              }
              opacity={isFocused ? 1 : 0.7}
              transparent
            />
          </mesh>

          {/* Widget 2 (normal) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.5, 0, 0.01]}>
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial
              color="#e5e7eb"
              opacity={isFocused ? 1 : 0.7}
              transparent
            />
          </mesh>

          {/* Widget 3 (normal) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.5, 0, 0.01]}>
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial
              color="#e5e7eb"
              opacity={isFocused ? 1 : 0.7}
              transparent
            />
          </mesh>
        </>
      )}

      {/* Boundary lines */}
      {boundaryPoints.length > 1 &&
        boundaryPoints.slice(0, -1).map((point, idx) => {
          const nextPoint = boundaryPoints[idx + 1];
          const midX = (point[0] + nextPoint[0]) / 2;
          const midY = (point[1] + nextPoint[1]) / 2;
          const midZ = (point[2] + nextPoint[2]) / 2;
          const distance = Math.sqrt(
            Math.pow(nextPoint[0] - point[0], 2) +
              Math.pow(nextPoint[1] - point[1], 2) +
              Math.pow(nextPoint[2] - point[2], 2)
          );
          const dx = nextPoint[0] - point[0];
          const dy = nextPoint[1] - point[1];
          const dz = nextPoint[2] - point[2];
          const angleY = Math.atan2(dx, dz);
          const angleX = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));

          return (
            <group
              key={idx}
              position={[midX, midY, midZ]}
              rotation={[angleX, angleY, 0]}
            >
              <mesh>
                <cylinderGeometry args={[0.03, 0.03, distance, 8]} />
                <meshStandardMaterial
                  color="#3b82f6"
                  emissive="#3b82f6"
                  emissiveIntensity={0.5}
                  opacity={isFocused ? 1 : 0.5}
                  transparent
                />
              </mesh>
            </group>
          );
        })}

      {/* Crash wave effect (when error occurs) */}
      {crashWave && !reducedMotion && (
        <group>
          {showWidgetLevel && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.02]}>
              <ringGeometry args={[0.3, 0.6, 32]} />
              <meshStandardMaterial color="#ef4444" opacity={0.5} transparent />
            </mesh>
          )}
          {showPageLevel && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.02]}>
              <ringGeometry args={[1, 2, 32]} />
              <meshStandardMaterial color="#ef4444" opacity={0.5} transparent />
            </mesh>
          )}
        </group>
      )}

      {/* Fallback UI panel (when error caught) */}
      {(showPageLevel || showWidgetLevel) && (
        <group position={[0, 0, 0.1]}>
          <RoundedBox
            args={[showPageLevel ? 3.5 : 0.8, showPageLevel ? 1.8 : 0.8, 0.1]}
            radius={0.1}
          >
            <meshStandardMaterial
              color="#fef3c7"
              opacity={isFocused ? 1 : 0.7}
              transparent
            />
          </RoundedBox>
          <Html position={[0, 0, 0.1]} center>
            <div className="text-xs font-medium text-center bg-yellow-100 px-3 py-2 rounded">
              {showPageLevel ? "Page Fallback UI" : "Widget Fallback UI"}
            </div>
          </Html>
        </group>
      )}

      {/* Error indicator */}
      {hasError && (
        <group position={[0, 1.2, 0.1]}>
          <Html center>
            <div className="bg-red-500 text-white text-xs font-semibold px-3 py-2 rounded">
              ⚠️ Error: {errorType}
            </div>
          </Html>
        </group>
      )}

      {/* Strategy label */}
      <group position={[-2.5, -1.2, 0.1]}>
        <Html center>
          <div className="bg-black/70 text-white text-xs p-2 rounded">
            <div className="font-semibold">Strategy</div>
            <div>
              {boundaryStrategy === "NONE"
                ? "No Boundary"
                : boundaryStrategy === "PAGE_BOUNDARY"
                  ? "Page Boundary"
                  : "Widget Boundary"}
            </div>
          </div>
        </Html>
      </group>

      {/* Error flow steps */}
      {errorFlow.length > 0 && (
        <group position={[2.5, -1.2, 0.1]}>
          <Html center>
            <div className="bg-black/70 text-white text-xs p-2 rounded max-w-[200px] space-y-1">
              <div className="font-semibold">Recovery Flow</div>
              {errorFlow.slice(0, 3).map((step, idx) => (
                <div key={idx} className="text-[10px]">
                  {step.phase}: {step.uiState}
                </div>
              ))}
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

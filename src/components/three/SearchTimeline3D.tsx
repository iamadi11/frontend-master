"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";
import * as THREE from "three";

interface SearchRequest {
  id: string;
  query: string;
  startTime: number;
  endTime?: number;
  canceled: boolean;
  ignored: boolean;
}

interface SearchTimeline3DProps {
  searchRequests: SearchRequest[];
  cancellation: "NONE" | "ABORT" | "IGNORE_STALE";
  queryLatencyMs: number;
  focusTarget?: string | null;
  reducedMotion: boolean;
  onRequestBurst?: () => void;
}

/**
 * 3D visualization of search race conditions as timeline beams.
 * Shows request beams with different latencies; stale responses bounce/ignore/abort.
 */
export function SearchTimeline3D({
  searchRequests,
  cancellation,
  queryLatencyMs,
  focusTarget,
  reducedMotion,
  onRequestBurst,
}: SearchTimeline3DProps) {
  const timelineRef = useRef<THREE.Group>(null);
  const beamsRef = useRef<THREE.Group>(null);

  const isFocused = focusTarget === "search.timeline";

  // Calculate beam positions and states
  const beams = useMemo(() => {
    const now = Date.now();
    return searchRequests.map((req, i) => {
      const elapsed = req.endTime
        ? req.endTime - req.startTime
        : now - req.startTime;
      const progress = Math.min(elapsed / queryLatencyMs, 1);
      const x = -5 + (i % 3) * 3.5;
      const z = Math.floor(i / 3) * 2;

      return {
        ...req,
        x,
        z,
        progress: reducedMotion ? (req.endTime ? 1 : 0) : progress,
        isActive: !req.canceled && !req.ignored && !req.endTime,
      };
    });
  }, [searchRequests, queryLatencyMs, reducedMotion]);

  // Animate beams (only if not reduced motion)
  useFrame(() => {
    if (reducedMotion || !beamsRef.current) return;
    // Update beam positions based on progress
  });

  const hasStaleOverwrite = useMemo(() => {
    if (cancellation === "NONE" && searchRequests.length > 1) {
      const sorted = [...searchRequests].sort(
        (a, b) => b.startTime - a.startTime
      );
      return sorted.some(
        (req, i) => i > 0 && req.endTime && !req.canceled && !req.ignored
      );
    }
    return false;
  }, [searchRequests, cancellation]);

  return (
    <group position={[0, 0, 0]}>
      {/* Timeline base */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[15, 8]} />
        <meshStandardMaterial color="#e5e7eb" opacity={0.3} transparent />
      </mesh>

      {/* Timeline axis */}
      <mesh position={[-7, -1.8, 0]}>
        <boxGeometry args={[14, 0.1, 0.1]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>

      {/* Request beams */}
      <group ref={beamsRef}>
        {beams.map((beam, i) => {
          const beamLength = beam.progress * 10;
          const color = beam.canceled
            ? "#ef4444"
            : beam.ignored
              ? "#fbbf24"
              : beam.isActive
                ? "#3b82f6"
                : "#10b981";

          return (
            <group key={beam.id} position={[beam.x, -1.5, beam.z]}>
              {/* Beam */}
              <mesh
                position={[beamLength / 2, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.1, 0.1, beamLength, 8]} />
                <meshStandardMaterial
                  color={color}
                  opacity={beam.canceled || beam.ignored ? 0.5 : 1}
                  transparent
                />
              </mesh>

              {/* Request label */}
              <Html position={[beamLength + 0.5, 0, 0]} center>
                <div
                  className={`text-xs px-2 py-1 rounded ${
                    beam.canceled
                      ? "bg-red-100 dark:bg-red-900"
                      : beam.ignored
                        ? "bg-yellow-100 dark:bg-yellow-900"
                        : "bg-blue-100 dark:bg-blue-900"
                  }`}
                >
                  {beam.canceled
                    ? "Aborted"
                    : beam.ignored
                      ? "Ignored"
                      : beam.query}
                </div>
              </Html>

              {/* Status badge */}
              {beam.endTime && (
                <Html position={[beamLength / 2, 0.5, 0]} center>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {beam.endTime - beam.startTime}ms
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </group>

      {/* Ignore shield (IGNORE_STALE mode) */}
      {cancellation === "IGNORE_STALE" && (
        <group position={[5, -1.5, 0]}>
          <mesh>
            <boxGeometry args={[0.2, 3, 0.2]} />
            <meshStandardMaterial color="#fbbf24" opacity={0.7} transparent />
          </mesh>
          <Html position={[0.5, 0, 0]} center>
            <div className="text-xs bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
              Ignore Shield
            </div>
          </Html>
        </group>
      )}

      {/* UI regressed badge (NONE mode with stale overwrite) */}
      {hasStaleOverwrite && (
        <Html position={[0, 2, 0]} className="pointer-events-none">
          <div className="text-sm font-bold bg-red-100 dark:bg-red-900 px-3 py-2 rounded border-2 border-red-500">
            ⚠️ UI Regressed (stale response overwrote newer)
          </div>
        </Html>
      )}

      {/* Control panel */}
      <Html position={[-7, 2, 0]} className="pointer-events-auto">
        <div
          className={`p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 ${
            isFocused
              ? "border-blue-500"
              : "border-gray-300 dark:border-gray-600"
          }`}
        >
          <div className="text-sm font-bold mb-2">Search Races</div>
          <div className="text-xs space-y-1 mb-2">
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                Cancellation:
              </span>{" "}
              <span className="font-bold">{cancellation}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Latency:</span>{" "}
              <span className="font-bold">{queryLatencyMs}ms</span>
            </div>
          </div>
          <button
            onClick={onRequestBurst}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
          >
            Send Request Burst
          </button>
        </div>
      </Html>
    </group>
  );
}

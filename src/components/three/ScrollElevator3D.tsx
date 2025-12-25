"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";
import * as THREE from "three";

interface ScrollElevator3DProps {
  strategy: "PAGINATION" | "INFINITE_SCROLL";
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  focusTarget?: string | null;
  reducedMotion: boolean;
  onNextPage?: () => void;
  onLoadMore?: () => void;
}

/**
 * 3D visualization of pagination vs infinite scroll as an elevator.
 * PAGINATION: Elevator jumps floor-to-floor
 * INFINITE_SCROLL: Continuous shaft with sentinel gate
 */
export function ScrollElevator3D({
  strategy,
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  focusTarget,
  reducedMotion,
  onNextPage,
  onLoadMore,
}: ScrollElevator3DProps) {
  const elevatorRef = useRef<THREE.Group>(null);
  const shaftRef = useRef<THREE.Group>(null);

  // Calculate elevator position
  const elevatorY = useMemo(() => {
    if (reducedMotion) return 0;
    if (strategy === "PAGINATION") {
      return (currentPage - 1) * 2;
    } else {
      // Infinite scroll: continuous position based on items loaded
      return (currentPage - 1) * pageSize * 0.1;
    }
  }, [strategy, currentPage, pageSize, reducedMotion]);

  // Animate elevator (only if not reduced motion)
  useFrame(() => {
    if (reducedMotion || !elevatorRef.current) return;
    elevatorRef.current.position.y = THREE.MathUtils.lerp(
      elevatorRef.current.position.y,
      elevatorY,
      0.1
    );
  });

  const isFocused = focusTarget === "scroll.strategy";

  return (
    <group position={[0, 0, 0]}>
      {/* Shaft */}
      <group ref={shaftRef}>
        <mesh position={[-2, 0, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.2, totalPages * 2 + 4, 0.2]} />
          <meshStandardMaterial color="#6b7280" />
        </mesh>
        <mesh position={[2, 0, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.2, totalPages * 2 + 4, 0.2]} />
          <meshStandardMaterial color="#6b7280" />
        </mesh>
        <mesh position={[0, 0, -0.2]} rotation={[0, 0, 0]}>
          <boxGeometry args={[4.2, totalPages * 2 + 4, 0.2]} />
          <meshStandardMaterial color="#9ca3af" opacity={0.3} transparent />
        </mesh>
      </group>

      {/* Floor markers (pagination only) */}
      {strategy === "PAGINATION" &&
        Array.from({ length: totalPages }).map((_, i) => {
          const floorY = i * 2;
          return (
            <group key={i} position={[0, floorY, 0]}>
              <mesh position={[-2.2, 0, 0]}>
                <boxGeometry args={[0.1, 0.1, 0.1]} />
                <meshStandardMaterial color="#3b82f6" />
              </mesh>
              <Html position={[-3, 0, 0]} center>
                <div className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded">
                  Page {i + 1}
                </div>
              </Html>
            </group>
          );
        })}

      {/* Sentinel gate (infinite scroll only) */}
      {strategy === "INFINITE_SCROLL" && (
        <group position={[0, currentPage * pageSize * 0.1, 0]}>
          <mesh>
            <boxGeometry args={[4, 0.2, 0.2]} />
            <meshStandardMaterial color="#fbbf24" />
          </mesh>
          <Html position={[0, 0.5, 0]} center>
            <div className="text-xs bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
              Sentinel Gate
            </div>
          </Html>
        </group>
      )}

      {/* Elevator car */}
      <group ref={elevatorRef} position={[0, reducedMotion ? 0 : elevatorY, 0]}>
        <mesh castShadow>
          <boxGeometry args={[3.5, 1.5, 1.5]} />
          <meshStandardMaterial
            color={isFocused ? "#3b82f6" : "#6366f1"}
            opacity={0.8}
            transparent
          />
        </mesh>
        <Html position={[0, 0, 0.8]} center>
          <div className="text-sm font-bold bg-white dark:bg-gray-800 px-3 py-1 rounded shadow">
            {strategy === "PAGINATION"
              ? `Page ${currentPage}`
              : `Items 1-${currentPage * pageSize}`}
          </div>
        </Html>
      </group>

      {/* Strategy label */}
      <Html position={[5, 2, 0]} className="pointer-events-none">
        <div
          className={`p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 ${
            isFocused
              ? "border-blue-500"
              : "border-gray-300 dark:border-gray-600"
          }`}
        >
          <div className="text-sm font-bold mb-2">
            {strategy === "PAGINATION" ? "Pagination" : "Infinite Scroll"}
          </div>
          <div className="text-xs space-y-1">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Current:</span>{" "}
              <span className="font-bold">
                {strategy === "PAGINATION"
                  ? `Page ${currentPage}/${totalPages}`
                  : `${currentPage * pageSize} items`}
              </span>
            </div>
            {strategy === "INFINITE_SCROLL" && (
              <div className="text-yellow-600 dark:text-yellow-400 mt-2">
                ⚠️ Restoration challenge on back navigation
              </div>
            )}
          </div>
        </div>
      </Html>

      {/* Control buttons */}
      <Html position={[-5, 0, 0]} className="pointer-events-auto">
        <div className="space-y-2">
          {strategy === "PAGINATION" ? (
            <button
              onClick={onNextPage}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Next Page
            </button>
          ) : (
            <button
              onClick={onLoadMore}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Load More
            </button>
          )}
        </div>
      </Html>
    </group>
  );
}

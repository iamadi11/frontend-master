"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";
import * as THREE from "three";

interface DOMCity3DProps {
  renderMode: "FULL_DOM" | "VIRTUALIZED";
  itemCount: number;
  rowHeight: number;
  overscan: number;
  scrollTop: number;
  perfStats?: {
    domNodes: number;
    renderCost: number;
    memoryScore: number;
  };
  focusTarget?: string | null;
  reducedMotion: boolean;
  onScroll?: () => void;
}

/**
 * 3D visualization of DOM nodes as buildings in a city.
 * FULL_DOM: Shows many buildings (capped display but labeled with true count)
 * VIRTUALIZED: Shows only visible neighborhood + overscan ring
 */
export function DOMCity3D({
  renderMode,
  itemCount,
  rowHeight,
  overscan,
  scrollTop,
  perfStats,
  focusTarget,
  reducedMotion,
  onScroll,
}: DOMCity3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Calculate visible range for virtualization
  const viewportHeight = 400;
  const visibleCount = Math.ceil(viewportHeight / rowHeight);
  const renderedCount =
    renderMode === "FULL_DOM"
      ? Math.min(itemCount, 200) // Cap display but show true count
      : visibleCount + overscan * 2;
  const startIndex =
    renderMode === "VIRTUALIZED"
      ? Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
      : 0;

  // Building positions
  const buildings = useMemo(() => {
    const count =
      renderMode === "FULL_DOM" ? Math.min(itemCount, 200) : renderedCount;
    const positions: Array<{
      x: number;
      z: number;
      height: number;
      index: number;
    }> = [];

    for (let i = 0; i < count; i++) {
      const index = renderMode === "VIRTUALIZED" ? startIndex + i : i;
      if (index >= itemCount) break;

      const row = Math.floor(i / 10);
      const col = i % 10;
      const x = (col - 4.5) * 1.2;
      const z = row * 1.2;
      const height = 0.3 + Math.random() * 0.2;

      positions.push({ x, z, height, index });
    }

    return positions;
  }, [renderMode, itemCount, renderedCount, startIndex]);

  // Animate scroll position (only if not reduced motion)
  useFrame(() => {
    if (reducedMotion || !groupRef.current) return;
    const scrollY = -(scrollTop / rowHeight) * 0.1;
    groupRef.current.position.y = scrollY;
  });

  const isFocused =
    focusTarget === "virtual.list" || focusTarget === "perf.panel";

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#e5e7eb" opacity={0.3} transparent />
      </mesh>

      {/* Buildings */}
      {buildings.map((building, i) => {
        const isVisible =
          renderMode === "VIRTUALIZED"
            ? i >= overscan && i < buildings.length - overscan
            : true;

        return (
          <group key={building.index} position={[building.x, 0, building.z]}>
            <mesh
              castShadow
              receiveShadow
              position={[0, building.height / 2, 0]}
            >
              <boxGeometry args={[0.8, building.height, 0.8]} />
              <meshStandardMaterial
                color={isVisible ? "#3b82f6" : "#9ca3af"}
                opacity={isVisible ? 1 : 0.3}
                transparent
              />
            </mesh>
            {i === 0 && (
              <Html position={[0, building.height + 0.5, 0]} center>
                <div className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
                  Item {building.index + 1}
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* Overscan ring indicator (virtualized mode only) */}
      {renderMode === "VIRTUALIZED" && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[8, 8.5, 32]} />
          <meshStandardMaterial
            color="#fbbf24"
            opacity={0.3}
            transparent
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Performance stats panel */}
      {perfStats && (
        <Html position={[-6, 3, 0]} className="pointer-events-none">
          <div
            className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 ${
              isFocused
                ? "border-blue-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
            style={{ minWidth: "200px" }}
          >
            <div className="text-sm font-bold mb-2">Performance Stats</div>
            <div className="space-y-1 text-xs">
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  DOM Nodes:
                </span>{" "}
                <span className="font-bold">
                  {renderMode === "FULL_DOM"
                    ? itemCount.toLocaleString()
                    : perfStats.domNodes.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Render Cost:
                </span>{" "}
                <span className="font-bold">
                  {perfStats.renderCost.toFixed(1)}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Memory Score:
                </span>{" "}
                <span className="font-bold">
                  {perfStats.memoryScore.toFixed(0)}
                </span>
              </div>
            </div>
            {renderMode === "FULL_DOM" && (
              <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                Main thread pressure: HIGH
              </div>
            )}
            {renderMode === "VIRTUALIZED" && (
              <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                Only {perfStats.domNodes} nodes rendered
              </div>
            )}
          </div>
        </Html>
      )}

      {/* Mode label */}
      <Html position={[6, 3, 0]} className="pointer-events-none">
        <div className="text-sm font-bold bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded">
          {renderMode === "FULL_DOM" ? "Full DOM" : "Virtualized"}
        </div>
      </Html>
    </group>
  );
}

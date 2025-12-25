"use client";

import { Suspense, useEffect } from "react";
import { PerspectiveCamera, Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { DOMCity3D } from "./DOMCity3D";
import { ScrollElevator3D } from "./ScrollElevator3D";
import { SearchTimeline3D } from "./SearchTimeline3D";
import { AutosaveVault3D } from "./AutosaveVault3D";
import { useReducedMotion3D } from "./useReducedMotion3D";

export type CameraPreset = "overview" | "closeup" | "side";

// Camera preset positions for UX megacity view
const CAMERA_PRESETS: Record<
  CameraPreset,
  { position: [number, number, number]; lookAt: [number, number, number] }
> = {
  overview: { position: [0, 3, 10], lookAt: [0, -1, 0] },
  closeup: { position: [0, 2, 6], lookAt: [0, -1, 0] },
  side: { position: [8, 3, 6], lookAt: [0, -1, 0] },
};

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

type Mode =
  | "VIRTUALIZATION"
  | "PAGINATION_SCROLL"
  | "SEARCH_RACES"
  | "FORMS_AUTOSAVE";
type RenderMode = "FULL_DOM" | "VIRTUALIZED";
type Strategy = "PAGINATION" | "INFINITE_SCROLL";
type Cancellation = "NONE" | "ABORT" | "IGNORE_STALE";

interface SearchRequest {
  id: string;
  query: string;
  startTime: number;
  endTime?: number;
  canceled: boolean;
  ignored: boolean;
}

interface AutosaveEvent {
  id: string;
  timestamp: number;
  status: "saving" | "saved" | "queued" | "failed";
}

interface UXMegacitySceneProps {
  mode: Mode;
  focusTarget?: string | null;

  // Virtualization props
  renderMode?: RenderMode;
  itemCount?: number;
  rowHeight?: number;
  overscan?: number;
  scrollTop?: number;
  perfStats?: {
    domNodes: number;
    renderCost: number;
    memoryScore: number;
  };

  // Pagination props
  strategy?: Strategy;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  totalItems?: number;

  // Search races props
  searchRequests?: SearchRequest[];
  cancellation?: Cancellation;
  queryLatencyMs?: number;

  // Forms/Autosave props
  autosaveEvents?: AutosaveEvent[];
  offline?: boolean;
  recovery?: boolean;
  queuedCount?: number;
  lastSaved?: number | null;

  // Callbacks
  onScroll?: () => void;
  onNextPage?: () => void;
  onLoadMore?: () => void;
  onRequestBurst?: () => void;
  onEditField?: () => void;
  onSimulateRefresh?: () => void;
  onGoOffline?: () => void;
  onGoOnline?: () => void;
  cameraPreset?: CameraPreset;
  onCameraPresetChange?: (preset: CameraPreset) => void;
}

/**
 * Main 3D scene for UX Megacity visualization.
 * Shows different sub-scenes based on mode: DOM City, Scroll Elevator, Search Timeline, Autosave Vault.
 */
export function UXMegacityScene({
  mode,
  focusTarget,
  renderMode,
  itemCount,
  rowHeight,
  overscan,
  scrollTop,
  perfStats,
  strategy,
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  searchRequests,
  cancellation,
  queryLatencyMs,
  autosaveEvents,
  offline,
  recovery,
  queuedCount,
  lastSaved,
  onScroll,
  onNextPage,
  onLoadMore,
  onRequestBurst,
  onEditField,
  onSimulateRefresh,
  onGoOffline,
  onGoOnline,
  cameraPreset = "overview",
  onCameraPresetChange,
}: UXMegacitySceneProps) {
  const reducedMotion = useReducedMotion3D();
  const { camera } = useThree();

  // Camera preset positioning (locked camera, no free movement)
  useEffect(() => {
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

  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={50} />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.5} />

      {/* Mode-specific scenes */}
      <Suspense fallback={null}>
        {mode === "VIRTUALIZATION" && (
          <DOMCity3D
            renderMode={renderMode || "FULL_DOM"}
            itemCount={itemCount || 1000}
            rowHeight={rowHeight || 40}
            overscan={overscan || 5}
            scrollTop={scrollTop || 0}
            perfStats={perfStats}
            focusTarget={focusTarget}
            reducedMotion={reducedMotion}
            onScroll={onScroll}
          />
        )}

        {mode === "PAGINATION_SCROLL" && (
          <ScrollElevator3D
            strategy={strategy || "PAGINATION"}
            currentPage={currentPage || 1}
            totalPages={totalPages || 1}
            pageSize={pageSize || 20}
            totalItems={totalItems || 500}
            focusTarget={focusTarget}
            reducedMotion={reducedMotion}
            onNextPage={onNextPage}
            onLoadMore={onLoadMore}
          />
        )}

        {mode === "SEARCH_RACES" && (
          <SearchTimeline3D
            searchRequests={searchRequests || []}
            cancellation={cancellation || "NONE"}
            queryLatencyMs={queryLatencyMs || 500}
            focusTarget={focusTarget}
            reducedMotion={reducedMotion}
            onRequestBurst={onRequestBurst}
          />
        )}

        {mode === "FORMS_AUTOSAVE" && (
          <AutosaveVault3D
            autosaveEvents={autosaveEvents || []}
            offline={offline || false}
            recovery={recovery || false}
            queuedCount={queuedCount || 0}
            lastSaved={lastSaved ?? null}
            focusTarget={focusTarget}
            reducedMotion={reducedMotion}
            onEditField={onEditField}
            onSimulateRefresh={onSimulateRefresh}
            onGoOffline={onGoOffline}
            onGoOnline={onGoOnline}
          />
        )}
      </Suspense>

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

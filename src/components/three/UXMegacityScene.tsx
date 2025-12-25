"use client";

import { Suspense } from "react";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { DOMCity3D } from "./DOMCity3D";
import { ScrollElevator3D } from "./ScrollElevator3D";
import { SearchTimeline3D } from "./SearchTimeline3D";
import { AutosaveVault3D } from "./AutosaveVault3D";
import { useReducedMotion3D } from "./useReducedMotion3D";

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
}: UXMegacitySceneProps) {
  const reducedMotion = useReducedMotion3D();

  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={50} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={15}
        target={[0, -1, 0]}
      />

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
    </>
  );
}

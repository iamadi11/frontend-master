"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion3D } from "./useReducedMotion3D";
import {
  computePhasePositions,
  getContentVisiblePhase,
  getCardPositionAtTime,
  getCurrentPhaseAtTime,
  type PhasePosition,
} from "./timelines";
import { PhaseMarkers } from "./PhaseMarkers";

interface RequestConveyorSceneProps {
  strategy: "CSR" | "SSR" | "SSG" | "ISR" | "STREAMING";
  phases: Array<{ id: string; label: string; duration: number }>;
  cacheMode: "NONE" | "BROWSER" | "CDN" | "APP";
  revalidateSeconds: number;
  focusTarget?: string | null;
  onPhaseClick?: (phaseId: string, notes: string[]) => void;
  cacheEvents?: string[];
  notes?: string[];
}

const TRACK_LENGTH = 20;
const TRACK_WIDTH = 2;

export function RequestConveyorScene({
  strategy,
  phases,
  cacheMode,
  revalidateSeconds,
  focusTarget,
  onPhaseClick,
  cacheEvents = [],
  notes = [],
}: RequestConveyorSceneProps) {
  const reducedMotion = useReducedMotion3D();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTime, setPlayTime] = useState(0);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [showRevalidateGhost, setShowRevalidateGhost] = useState(false);

  const cardRef = useRef<THREE.Group>(null);
  const contentMarkerRef = useRef<THREE.Group>(null);
  const cacheIconRef = useRef<THREE.Group>(null);

  // Compute phase positions
  const phasePositions = useMemo(
    () => computePhasePositions(phases, TRACK_LENGTH),
    [phases]
  );

  const totalDuration = useMemo(
    () => phases.reduce((sum, p) => sum + p.duration, 0),
    [phases]
  );

  // Content visible phase
  const contentVisiblePhaseId = useMemo(
    () => getContentVisiblePhase(strategy, phasePositions),
    [strategy, phasePositions]
  );

  const contentVisiblePosition = useMemo(() => {
    const phase = phasePositions.find((p) => p.id === contentVisiblePhaseId);
    if (!phase) return null;
    return phase.position - TRACK_LENGTH / 2;
  }, [contentVisiblePhaseId, phasePositions]);

  // Current phase during playback
  const currentPhaseId = useMemo(
    () => getCurrentPhaseAtTime(playTime, phasePositions),
    [playTime, phasePositions]
  );

  // Card position
  const cardX = useMemo(
    () =>
      getCardPositionAtTime(playTime, phasePositions, TRACK_LENGTH) -
      TRACK_LENGTH / 2,
    [playTime, phasePositions]
  );

  // Animation loop
  useFrame((state, delta) => {
    if (!isPlaying || reducedMotion) return;

    const deltaMs = delta * 1000;
    setPlayTime((prev) => {
      const next = prev + deltaMs;
      if (next >= totalDuration) {
        setIsPlaying(false);
        return totalDuration;
      }
      return next;
    });
  });

  // Update card position
  useEffect(() => {
    if (!cardRef.current) return;

    if (reducedMotion) {
      // In reduced motion, jump to final position
      cardRef.current.position.x = cardX;
    } else {
      // Smooth animation
      cardRef.current.position.x = cardX;
    }
  }, [cardX, reducedMotion]);

  // Update content marker position when strategy changes
  useEffect(() => {
    if (!contentMarkerRef.current || !contentVisiblePosition) return;

    if (reducedMotion) {
      contentMarkerRef.current.position.x = contentVisiblePosition;
    } else {
      // Animate marker sliding
      contentMarkerRef.current.position.x = contentVisiblePosition;
    }
  }, [contentVisiblePosition, reducedMotion]);

  // Handle ISR revalidation
  useEffect(() => {
    if (strategy === "ISR" && revalidateSeconds > 0 && !isFirstVisit) {
      // Show revalidate ghost after a delay
      const timer = setTimeout(() => {
        setShowRevalidateGhost(true);
        setTimeout(() => setShowRevalidateGhost(false), 2000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [strategy, revalidateSeconds, isFirstVisit]);

  const handlePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setPlayTime(0);
    } else {
      setPlayTime(0);
      setIsPlaying(true);
    }
  };

  const handlePhaseClick = (phaseId: string) => {
    onPhaseClick?.(phaseId, notes);
  };

  // Determine which elements to highlight based on focusTarget
  const highlightTimeline = focusTarget === "timeline";
  const highlightHydrate = focusTarget === "hydrate";
  const highlightCache = focusTarget === "cache.panel";
  const highlightStreaming = focusTarget === "streaming";

  // Check if we're past hydration phase
  const isPastHydration = useMemo(() => {
    const hydratePhase = phasePositions.find((p) => p.id === "HYDRATE");
    if (!hydratePhase) return false;
    return playTime >= hydratePhase.cumulativeTime + hydratePhase.duration;
  }, [playTime, phasePositions]);

  // Check if streaming and which chunks to show
  const showStreamingChunks = strategy === "STREAMING";
  const streamingChunkPhases = useMemo(() => {
    if (!showStreamingChunks) return [];
    return phasePositions.filter((p) => ["HTML", "DATA"].includes(p.id));
  }, [showStreamingChunks, phasePositions]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, 5, -5]} intensity={0.4} />

      {/* Conveyor track (horizontal plane) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
        receiveShadow
      >
        <planeGeometry args={[TRACK_LENGTH, TRACK_WIDTH]} />
        <meshStandardMaterial
          color={highlightTimeline ? "#fbbf24" : "#374151"}
          emissive={highlightTimeline ? "#fbbf24" : "#1f2937"}
          emissiveIntensity={highlightTimeline ? 0.2 : 0.05}
        />
      </mesh>

      {/* Phase gates */}
      <PhaseMarkers
        phases={phasePositions}
        trackLength={TRACK_LENGTH}
        highlightedPhaseId={
          highlightHydrate
            ? "HYDRATE"
            : highlightStreaming && strategy === "STREAMING"
              ? phasePositions.find((p) => p.id === "HTML" || p.id === "DATA")
                  ?.id || null
              : null
        }
        onPhaseClick={handlePhaseClick}
        reducedMotion={reducedMotion}
      />

      {/* Page card (travels along track) */}
      <group ref={cardRef} position={[cardX, 0.3, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.6, 0.1]} />
          <meshStandardMaterial
            color="#3b82f6"
            emissive="#3b82f6"
            emissiveIntensity={0.2}
          />
        </mesh>

        {/* Hydration interaction dots (appear after HYDRATE phase) */}
        {isPastHydration && (
          <group>
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[-0.2 + i * 0.2, 0.5, 0.1]}>
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshStandardMaterial
                  color="#10b981"
                  emissive="#10b981"
                  emissiveIntensity={0.5}
                />
              </mesh>
            ))}
          </group>
        )}

        {/* Streaming chunks (attach to card for STREAMING strategy) */}
        {showStreamingChunks &&
          streamingChunkPhases.map((chunkPhase, index) => {
            const shouldShow =
              playTime >= chunkPhase.cumulativeTime &&
              playTime < chunkPhase.cumulativeTime + chunkPhase.duration;

            if (!shouldShow && !reducedMotion) return null;

            return (
              <mesh
                key={chunkPhase.id}
                position={[-0.3 + index * 0.15, -0.2, 0.1]}
              >
                <boxGeometry args={[0.1, 0.1, 0.05]} />
                <meshStandardMaterial
                  color="#8b5cf6"
                  emissive="#8b5cf6"
                  emissiveIntensity={0.4}
                />
              </mesh>
            );
          })}
      </group>

      {/* Content visible marker */}
      {contentVisiblePosition !== null && (
        <group
          ref={contentMarkerRef}
          position={[contentVisiblePosition, 0.8, 0]}
        >
          <mesh>
            <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
            <meshStandardMaterial color="#10b981" />
          </mesh>
          <Text
            position={[0, 0.4, 0]}
            fontSize={0.12}
            color="#10b981"
            anchorX="center"
            anchorY="middle"
          >
            Content visible
          </Text>
        </group>
      )}

      {/* Cache icon overlay (top right) */}
      <group ref={cacheIconRef} position={[TRACK_LENGTH / 2 - 1, 2, 0]}>
        <mesh
          onClick={() => setIsFirstVisit(!isFirstVisit)}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "default";
          }}
        >
          <boxGeometry args={[0.4, 0.4, 0.1]} />
          <meshStandardMaterial
            color={isFirstVisit ? "#6b7280" : "#10b981"}
            emissive={isFirstVisit ? "#6b7280" : "#10b981"}
            emissiveIntensity={isFirstVisit ? 0.1 : highlightCache ? 0.5 : 0.3}
            opacity={isFirstVisit ? 0.5 : 1}
            transparent
          />
        </mesh>
        <Text
          position={[0, -0.5, 0]}
          fontSize={0.1}
          color="#9ca3af"
          anchorX="center"
          anchorY="middle"
        >
          {isFirstVisit ? "First visit" : "Cached"}
        </Text>

        {/* Cache hit pulse animation (only on repeat visit, not reduced motion) */}
        {!isFirstVisit &&
          !reducedMotion &&
          cacheMode !== "NONE" &&
          isPlaying && (
            <mesh position={[0, 0, 0]}>
              <ringGeometry args={[0.3, 0.35, 16]} />
              <meshStandardMaterial color="#10b981" transparent opacity={0.3} />
            </mesh>
          )}
      </group>

      {/* ISR revalidate ghost card (background) */}
      {strategy === "ISR" &&
        revalidateSeconds > 0 &&
        !isFirstVisit &&
        showRevalidateGhost &&
        !reducedMotion && (
          <group position={[cardX - 0.5, 0.2, -0.2]}>
            <mesh>
              <boxGeometry args={[0.8, 0.6, 0.1]} />
              <meshStandardMaterial color="#f59e0b" transparent opacity={0.4} />
            </mesh>
            <Text
              position={[0, 0, 0.1]}
              fontSize={0.08}
              color="#f59e0b"
              anchorX="center"
              anchorY="middle"
            >
              Updated
            </Text>
          </group>
        )}

      {/* ISR revalidate badge (static for reduced motion) */}
      {strategy === "ISR" &&
        revalidateSeconds > 0 &&
        !isFirstVisit &&
        (showRevalidateGhost || reducedMotion) && (
          <group position={[TRACK_LENGTH / 2 - 1, 1.5, 0]}>
            <mesh>
              <boxGeometry args={[0.6, 0.2, 0.05]} />
              <meshStandardMaterial color="#f59e0b" />
            </mesh>
            <Text
              position={[0, 0, 0.1]}
              fontSize={0.08}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              Revalidated
            </Text>
          </group>
        )}

      {/* Play controls (HTML overlay) */}
      <Html position={[-TRACK_LENGTH / 2, 2.5, 0]} center transform occlude>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={handlePlay}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors"
          >
            {isPlaying ? "Pause" : "Play Timeline"}
          </button>
          {isPlaying && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {Math.round(playTime)}ms / {totalDuration}ms
            </div>
          )}
        </div>
      </Html>

      {/* First visit / Repeat visit toggle (HTML overlay) */}
      <Html position={[TRACK_LENGTH / 2 - 1, 1.8, 0]} center transform occlude>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg border border-gray-200 dark:border-gray-700">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={!isFirstVisit}
              onChange={(e) => setIsFirstVisit(!e.target.checked)}
              className="rounded"
            />
            <span className="text-gray-700 dark:text-gray-300">
              Repeat visit
            </span>
          </label>
        </div>
      </Html>
    </>
  );
}

"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Html } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion3D } from "./useReducedMotion3D";
import { PipelineLanes3D } from "./PipelineLanes3D";
import { TrafficShift3D } from "./TrafficShift3D";
import { CDNCacheMap3D } from "./CDNCacheMap3D";

type StageMode = "PIPELINE" | "FLAGS_AB" | "CANARY_ROLLBACK" | "CDN_EDGE";

interface ReleaseOpsTheaterSceneProps {
  mode: StageMode;
  focusTarget?: string | null;
  // Pipeline props
  pipelineRunning?: boolean;
  currentStage?: string | null;
  runTests?: boolean;
  visualRegression?: boolean;
  onPipelineComplete?: () => void;
  // Flags & A/B props
  flagEnabled?: boolean;
  abSplit?: number;
  targeting?: "ALL" | "MOBILE_ONLY" | "COUNTRY_IN" | "BETA_USERS";
  // Canary props
  trafficPercent?: number;
  errorRateNew?: number;
  latencyNewMs?: number;
  canaryActive?: boolean;
  sloPass?: boolean;
  onCanaryThresholdBreach?: () => void;
  // CDN props
  cacheTTLSeconds?: number;
  cacheInvalidation?: "NONE" | "PURGE_PATH" | "VERSIONED_ASSETS";
  edgeCompute?: boolean;
  cacheHitRate?: number;
  requestAssetTrigger?: number;
  deployNewBuildTrigger?: number;
  // Events
  pipelineEvents?: string[];
  rolloutEvents?: string[];
  cdnEvents?: string[];
  notes?: string[];
}

export function ReleaseOpsTheaterScene({
  mode,
  focusTarget,
  // Pipeline
  pipelineRunning = false,
  currentStage = null,
  runTests = true,
  visualRegression = true,
  onPipelineComplete,
  // Flags & A/B
  flagEnabled = false,
  abSplit = 50,
  targeting = "ALL",
  // Canary
  trafficPercent = 10,
  errorRateNew = 0.05,
  latencyNewMs = 200,
  canaryActive = false,
  sloPass = true,
  onCanaryThresholdBreach,
  // CDN
  cacheTTLSeconds = 60,
  cacheInvalidation = "NONE",
  edgeCompute = false,
  cacheHitRate = 0.7,
  requestAssetTrigger,
  deployNewBuildTrigger,
  // Events
  pipelineEvents = [],
  rolloutEvents = [],
  cdnEvents = [],
  notes = [],
}: ReleaseOpsTheaterSceneProps) {
  const reducedMotion = useReducedMotion3D();
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  // Spotlight dimming for non-focused elements
  const isFocused = (target: string) => {
    if (!focusTarget) return true;
    return focusTarget === target || focusTarget.includes(target);
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />

      <OrbitControls
        enablePan={false}
        minDistance={8}
        maxDistance={20}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
      />

      {/* Pipeline Mode */}
      {mode === "PIPELINE" && (
        <PipelineLanes3D
          running={pipelineRunning}
          currentStage={currentStage}
          runTests={runTests}
          visualRegression={visualRegression}
          events={pipelineEvents}
          notes={notes}
          focused={isFocused("pipeline")}
          reducedMotion={reducedMotion}
          onComplete={onPipelineComplete}
        />
      )}

      {/* Flags & A/B Mode */}
      {mode === "FLAGS_AB" && (
        <TrafficShift3D
          mode="flags_ab"
          flagEnabled={flagEnabled}
          abSplit={abSplit}
          targeting={targeting}
          events={rolloutEvents}
          notes={notes}
          focused={isFocused("traffic")}
          reducedMotion={reducedMotion}
        />
      )}

      {/* Canary & Rollback Mode */}
      {mode === "CANARY_ROLLBACK" && (
        <TrafficShift3D
          mode="canary"
          trafficPercent={trafficPercent}
          errorRateNew={errorRateNew}
          latencyNewMs={latencyNewMs}
          canaryActive={canaryActive}
          sloPass={sloPass}
          events={rolloutEvents}
          notes={notes}
          focused={isFocused("metrics")}
          reducedMotion={reducedMotion}
          onThresholdBreach={onCanaryThresholdBreach}
        />
      )}

      {/* CDN & Edge Mode */}
      {mode === "CDN_EDGE" && (
        <CDNCacheMap3D
          cacheTTLSeconds={cacheTTLSeconds}
          cacheInvalidation={cacheInvalidation}
          edgeCompute={edgeCompute}
          cacheHitRate={cacheHitRate}
          events={cdnEvents}
          notes={notes}
          focused={isFocused("cdn.map")}
          reducedMotion={reducedMotion}
          requestAssetTrigger={requestAssetTrigger}
          deployNewBuildTrigger={deployNewBuildTrigger}
        />
      )}

      {/* Help text */}
      <Html
        position={[-4, 3, 0]}
        center
        style={{ pointerEvents: "none" }}
        className="text-xs text-gray-600 dark:text-gray-400"
      >
        <div className="bg-white/80 dark:bg-gray-900/80 px-2 py-1 rounded">
          {mode === "PIPELINE" && "Pipeline Gates"}
          {mode === "FLAGS_AB" && "Feature Flags & A/B"}
          {mode === "CANARY_ROLLBACK" && "Canary & Rollback"}
          {mode === "CDN_EDGE" && "CDN & Edge"}
        </div>
      </Html>
    </>
  );
}

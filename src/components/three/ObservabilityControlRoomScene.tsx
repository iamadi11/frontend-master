"use client";

import { useMemo, useEffect } from "react";
import { PerspectiveCamera, Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useReducedMotion3D } from "./useReducedMotion3D";
import { TelemetryPipeline3D } from "./TelemetryPipeline3D";
import { SamplingRain3D } from "./SamplingRain3D";
import { ErrorBoundaryContainment3D } from "./ErrorBoundaryContainment3D";
import type { ObservabilityLabConfig } from "../demo/demoSchema";

export type CameraPreset = "overview" | "closeup" | "side";

// Camera preset positions for observability control room view
const CAMERA_PRESETS: Record<
  CameraPreset,
  { position: [number, number, number]; lookAt: [number, number, number] }
> = {
  overview: { position: [0, 3, 10], lookAt: [0, 0, 0] },
  closeup: { position: [0, 2, 6], lookAt: [0, 0, 0] },
  side: { position: [8, 3, 6], lookAt: [0, 0, 0] },
};

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

type Mode = "PIPELINE" | "SAMPLING_PRIVACY" | "ERROR_BOUNDARY";
type Signal = "LOG" | "METRIC" | "TRACE";
type BoundaryStrategy = "NONE" | "PAGE_BOUNDARY" | "WIDGET_BOUNDARY";

interface ObservabilityControlRoomSceneProps {
  config: ObservabilityLabConfig;
  mode: Mode;
  signal: Signal;
  sampleRate: number;
  redactPII: boolean;
  replayEnabled: boolean;
  errorType: string;
  boundaryStrategy: BoundaryStrategy;
  hasError: boolean;
  activePipelineStepId: string | null;
  eventPackets: Array<{ id: string; stepId: string; signalType: Signal }>;
  focusTarget?: string | null;
  onPacketComplete?: (packetId: string) => void;
  onSamplingComplete?: () => void;
  cameraPreset?: CameraPreset;
  onCameraPresetChange?: (preset: CameraPreset) => void;
}

/**
 * Main 3D scene for Observability Control Room.
 * Switches between three visualization modes based on current mode.
 */
export function ObservabilityControlRoomScene({
  config,
  mode,
  signal,
  sampleRate,
  redactPII,
  replayEnabled,
  errorType,
  boundaryStrategy,
  hasError,
  activePipelineStepId,
  eventPackets,
  focusTarget,
  onPacketComplete,
  onSamplingComplete,
  cameraPreset = "overview",
  onCameraPresetChange,
}: ObservabilityControlRoomSceneProps) {
  const reducedMotion = useReducedMotion3D();
  const { camera } = useThree();

  // Compute pipeline steps from config
  const pipelineSteps = useMemo(() => {
    return config.pipelineSteps.map((step) => ({
      id: step.step.toLowerCase().replace(/\s+/g, "-"),
      label: step.step,
      note: step.note,
    }));
  }, [config]);

  // Compute dropped events percentage
  const droppedEventsPct = useMemo(() => {
    return config.droppedEventsPct;
  }, [config]);

  // Compute privacy notes
  const privacyNotes = useMemo(() => {
    const notes = [...config.privacyNotes];
    if (redactPII) {
      notes.push("PII fields (email, phone, SSN) are redacted in logs");
    }
    if (replayEnabled) {
      notes.push(
        "Session replay captures user interactions - ensure GDPR compliance"
      );
      notes.push("Consider masking sensitive input fields in replay");
    }
    return notes;
  }, [config, redactPII, replayEnabled]);

  // Compute error flow
  const errorFlow = useMemo(() => {
    if (!hasError) return [];
    return config.errorFlow.map((step) => {
      if (step.phase === "current") {
        if (hasError && boundaryStrategy !== "NONE") {
          return {
            ...step,
            uiState:
              boundaryStrategy === "PAGE_BOUNDARY"
                ? "Page fallback UI"
                : "Widget fallback UI",
          };
        }
      }
      return step;
    });
  }, [config, hasError, boundaryStrategy]);

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

  // Determine which sub-scene to show based on mode
  const isPipelineFocused =
    focusTarget === "pipeline" || focusTarget === null || focusTarget === "";
  const isSamplingFocused =
    focusTarget === "sampling" || focusTarget === "privacy.panel";
  const isErrorFocused = focusTarget === "error.sim";

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={50} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, 3, -5]} intensity={0.4} />

      {mode === "PIPELINE" && (
        <TelemetryPipeline3D
          steps={pipelineSteps}
          activeStepId={activePipelineStepId}
          eventPackets={eventPackets}
          signal={signal}
          focusTarget={isPipelineFocused ? focusTarget : null}
          onPacketComplete={onPacketComplete}
        />
      )}

      {mode === "SAMPLING_PRIVACY" && (
        <SamplingRain3D
          sampleRate={sampleRate}
          droppedEventsPct={droppedEventsPct}
          redactPII={redactPII}
          replayEnabled={replayEnabled}
          privacyNotes={privacyNotes}
          focusTarget={isSamplingFocused ? focusTarget : null}
          onSamplingComplete={onSamplingComplete}
        />
      )}

      {mode === "ERROR_BOUNDARY" && (
        <ErrorBoundaryContainment3D
          errorType={errorType}
          boundaryStrategy={boundaryStrategy}
          errorFlow={errorFlow}
          hasError={hasError}
          focusTarget={isErrorFocused ? focusTarget : null}
        />
      )}
    </>
  );
}

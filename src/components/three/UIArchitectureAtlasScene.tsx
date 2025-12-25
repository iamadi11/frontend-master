"use client";

import { Suspense, useEffect } from "react";
import { Environment, Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useReducedMotion3D } from "./useReducedMotion3D";
import { TokenPropagation3D } from "./TokenPropagation3D";
import { MFBoundaryTiles3D } from "./MFBoundaryTiles3D";
import { FederationGraph3D } from "./FederationGraph3D";
import type { UIArchitectureLabConfig, TokenSet } from "../demo/demoSchema";

export type CameraPreset = "overview" | "closeup" | "side";

// Camera preset positions for UI architecture atlas view
const CAMERA_PRESETS: Record<
  CameraPreset,
  { position: [number, number, number]; lookAt: [number, number, number] }
> = {
  overview: { position: [0, 4, 10], lookAt: [0, 0, 0] },
  closeup: { position: [0, 2, 6], lookAt: [0, 0, 0] },
  side: { position: [8, 3, 6], lookAt: [0, 0, 0] },
};

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

type Mode = "TOKENS" | "MICROFRONTENDS" | "MODULE_FEDERATION";

interface UIArchitectureAtlasSceneProps {
  mode: Mode;
  config: UIArchitectureLabConfig;
  // Token mode props
  currentTokenSet?: TokenSet | null;
  previousTokenSet?: TokenSet | null;
  showTokenDiff?: boolean;
  // Micro-frontends mode props
  integrationType?: "ROUTE_BASED" | "COMPONENT_BASED";
  sharedUI?: boolean;
  selectedRoute?: string;
  selectedComponent?: string;
  // Module Federation mode props
  sharedDepsSingleton?: boolean;
  sharedDepsStrictVersion?: boolean;
  duplicationKb?: number;
  loadOrderEvents?: string[];
  network?: "FAST" | "SLOW";
  preloadRemotes?: boolean;
  // Interaction
  onPlayLoad?: () => void;
  focusTarget?: string | null;
  cameraPreset?: CameraPreset;
  onCameraPresetChange?: (preset: CameraPreset) => void;
}

/**
 * Main 3D scene for UI Architecture Atlas.
 * Swaps between three sub-scenes based on mode.
 */
export function UIArchitectureAtlasScene({
  mode,
  config,
  currentTokenSet,
  previousTokenSet,
  showTokenDiff,
  integrationType = "ROUTE_BASED",
  sharedUI = false,
  selectedRoute,
  selectedComponent,
  sharedDepsSingleton = true,
  sharedDepsStrictVersion = false,
  duplicationKb = 0,
  loadOrderEvents = [],
  network = "FAST",
  preloadRemotes = false,
  onPlayLoad,
  focusTarget,
  cameraPreset = "overview",
  onCameraPresetChange,
}: UIArchitectureAtlasSceneProps) {
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
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.4} />

      <Environment preset="city" />

      <Suspense fallback={null}>
        {mode === "TOKENS" && config.tokens && (
          <TokenPropagation3D
            tokenSets={config.tokens.tokenSets}
            components={config.tokens.components}
            currentTokenSet={currentTokenSet}
            previousTokenSet={previousTokenSet}
            showTokenDiff={showTokenDiff}
            focusTarget={focusTarget}
          />
        )}

        {mode === "MICROFRONTENDS" && config.microfrontends && (
          <MFBoundaryTiles3D
            mfes={config.microfrontends.mfes}
            integrationType={integrationType}
            sharedUI={sharedUI}
            selectedRoute={selectedRoute}
            selectedComponent={selectedComponent}
            focusTarget={focusTarget}
          />
        )}

        {mode === "MODULE_FEDERATION" && config.moduleFederation && (
          <FederationGraph3D
            remotes={config.moduleFederation.remotes}
            sharedDeps={config.moduleFederation.sharedDeps}
            duplicationKb={duplicationKb}
            loadOrderEvents={loadOrderEvents}
            network={network}
            preloadRemotes={preloadRemotes}
            sharedDepsSingleton={sharedDepsSingleton}
            sharedDepsStrictVersion={sharedDepsStrictVersion}
            onPlayLoad={onPlayLoad}
            focusTarget={focusTarget}
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

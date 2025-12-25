"use client";

import { Suspense, useEffect } from "react";
import { PerspectiveCamera, Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useReducedMotion3D } from "./useReducedMotion3D";
import { ArchitectureMap3D } from "./ArchitectureMap3D";
import { CapstoneMiniSim3D } from "./CapstoneMiniSim3D";
import type { CapstoneBuilderConfig } from "../demo/demoSchema";

export type CameraPreset = "overview" | "closeup" | "side";

// Camera preset positions for capstone atlas view
const CAMERA_PRESETS: Record<
  CameraPreset,
  { position: [number, number, number]; lookAt: [number, number, number] }
> = {
  overview: { position: [0, 0, 8], lookAt: [0, 0, 0] },
  closeup: { position: [0, 0, 5], lookAt: [0, 0, 0] },
  side: { position: [6, 2, 6], lookAt: [0, 0, 0] },
};

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

interface CapstoneAtlasSceneProps {
  config: CapstoneBuilderConfig;
  view: "ARCH_MAP" | "INTERACTIVE_SIM";
  scenario: "ECOMMERCE" | "DASHBOARD" | "CHAT_COLLAB" | "MEDIA_UI";
  emphasis: "PERF" | "RELIABILITY" | "SECURITY" | "DX";
  // ARCH_MAP props
  onNodeClick?: (moduleId: string) => void;
  onFlowPlay?: () => void;
  isPlayingFlow?: boolean;
  // INTERACTIVE_SIM props
  rendering: "CSR" | "SSR" | "SSG" | "ISR" | "STREAMING";
  caching: "NONE" | "BROWSER" | "CDN" | "APP";
  realtime: "NONE" | "SSE" | "WEBSOCKET";
  optimistic: boolean;
  offline: boolean;
  sampling: number;
  cspStrict: boolean;
  isSimRunning: boolean;
  onSimComplete?: () => void;
  focusTarget?: string | null;
  cameraPreset?: CameraPreset;
  onCameraPresetChange?: (preset: CameraPreset) => void;
}

/**
 * Main 3D scene for Capstone Builder demo.
 * Switches between ARCH_MAP and INTERACTIVE_SIM views.
 */
export function CapstoneAtlasScene({
  config,
  view,
  scenario,
  emphasis,
  onNodeClick,
  onFlowPlay,
  isPlayingFlow = false,
  rendering,
  caching,
  realtime,
  optimistic,
  offline,
  sampling,
  cspStrict,
  isSimRunning,
  onSimComplete,
  focusTarget,
  cameraPreset = "overview",
  onCameraPresetChange,
}: CapstoneAtlasSceneProps) {
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

  const currentScenarioData = config.scenarios.find((s) => s.id === scenario);
  if (!currentScenarioData) return null;

  // Find matching sim rule
  const currentSimRule =
    view === "INTERACTIVE_SIM"
      ? config.sim.rules.find((rule) => {
          if (rule.rendering && rule.rendering !== rendering) return false;
          if (rule.caching && rule.caching !== caching) return false;
          if (rule.realtime && rule.realtime !== realtime) return false;
          if (rule.optimistic !== undefined && rule.optimistic !== optimistic)
            return false;
          if (rule.offline !== undefined && rule.offline !== offline)
            return false;
          if (rule.sampling !== undefined && rule.sampling !== sampling)
            return false;
          if (rule.cspStrict !== undefined && rule.cspStrict !== cspStrict)
            return false;
          return true;
        }) || config.sim.rules[0]
      : null;

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />

      {view === "ARCH_MAP" ? (
        <ArchitectureMap3D
          scenarioData={currentScenarioData}
          emphasis={emphasis}
          focusTarget={focusTarget}
          onNodeClick={onNodeClick}
          onFlowPlay={onFlowPlay}
          isPlayingFlow={isPlayingFlow}
        />
      ) : (
        currentSimRule && (
          <CapstoneMiniSim3D
            config={config}
            simRule={currentSimRule}
            rendering={rendering}
            caching={caching}
            realtime={realtime}
            optimistic={optimistic}
            offline={offline}
            sampling={sampling}
            cspStrict={cspStrict}
            isRunning={isSimRunning}
            focusTarget={focusTarget}
            onSimComplete={onSimComplete}
          />
        )
      )}

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

"use client";

import { Suspense, useEffect } from "react";
import { PerspectiveCamera, Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useReducedMotion3D } from "./useReducedMotion3D";
import { TestPyramid3D } from "./TestPyramid3D";
import { ContractFlow3D } from "./ContractFlow3D";
import { VisualDiff3D } from "./VisualDiff3D";

export type CameraPreset = "overview" | "closeup" | "side";

// Camera preset positions for testing lab view
const CAMERA_PRESETS: Record<
  CameraPreset,
  { position: [number, number, number]; lookAt: [number, number, number] }
> = {
  overview: { position: [0, 2, 8], lookAt: [0, 0, 0] },
  closeup: { position: [0, 1, 5], lookAt: [0, 0, 0] },
  side: { position: [6, 2, 6], lookAt: [0, 0, 0] },
};

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

type Mode = "PYRAMID" | "CONTRACT" | "VISUAL";

interface TestingLabSceneProps {
  mode: Mode;
  focusTarget?: string | null;
  // Pyramid mode props
  recommendedMix?: {
    unitPct: number;
    integrationPct: number;
    e2ePct: number;
  };
  pyramidNotes?: string[];
  // Contract mode props
  contractResult?: {
    pass: boolean;
    breakingReasons: string[];
  } | null;
  apiChange?: string;
  // Visual mode props
  visualDiff?: {
    changed: string[];
    severity: "LOW" | "MEDIUM" | "HIGH";
  } | null;
  baseline?: {
    layout: string;
    color: string;
    spacing: string;
  };
  current?: {
    layout: string;
    color: string;
    spacing: string;
  };
  cameraPreset?: CameraPreset;
  onCameraPresetChange?: (preset: CameraPreset) => void;
}

/**
 * Main 3D scene for Testing Strategy Lab.
 * Switches between three sub-scenes based on mode.
 */
export function TestingLabScene({
  mode,
  focusTarget,
  recommendedMix,
  pyramidNotes,
  contractResult,
  apiChange,
  visualDiff,
  baseline,
  current,
  cameraPreset = "overview",
  onCameraPresetChange,
}: TestingLabSceneProps) {
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

  // Determine which sub-scene should be focused
  const pyramidFocused = focusTarget === "pyramid";
  const contractFocused = focusTarget === "contract.flow";
  const visualFocused = focusTarget === "visual.diff";

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={50} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, 3, -5]} intensity={0.4} />

      {/* Ground plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
        receiveShadow
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#f3f4f6" opacity={0.3} transparent />
      </mesh>

      {/* Mode-specific scenes */}
      <Suspense fallback={null}>
        {mode === "PYRAMID" && recommendedMix && (
          <TestPyramid3D
            recommendedMix={recommendedMix}
            notes={pyramidNotes || []}
            focused={pyramidFocused}
            reducedMotion={reducedMotion}
          />
        )}

        {mode === "CONTRACT" && (
          <ContractFlow3D
            contractResult={contractResult || null}
            apiChange={apiChange || "NONE"}
            breakingReasons={contractResult?.breakingReasons || []}
            focused={contractFocused}
            reducedMotion={reducedMotion}
          />
        )}

        {mode === "VISUAL" && baseline && current && (
          <VisualDiff3D
            baseline={baseline}
            current={current}
            visualDiff={visualDiff || null}
            focused={visualFocused}
            reducedMotion={reducedMotion}
          />
        )}
      </Suspense>

      {/* Camera preset controls (rendered as HTML overlay) */}
      {onCameraPresetChange && (
        <Html position={[0, -3, 0]} center>
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

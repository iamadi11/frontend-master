"use client";

import { Suspense } from "react";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useReducedMotion3D } from "./useReducedMotion3D";
import { TestPyramid3D } from "./TestPyramid3D";
import { ContractFlow3D } from "./ContractFlow3D";
import { VisualDiff3D } from "./VisualDiff3D";

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
}: TestingLabSceneProps) {
  const reducedMotion = useReducedMotion3D();

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

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={!reducedMotion}
        minDistance={5}
        maxDistance={15}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
      />

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
    </>
  );
}

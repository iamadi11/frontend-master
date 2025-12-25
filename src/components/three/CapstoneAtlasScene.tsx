"use client";

import { Suspense } from "react";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useReducedMotion3D } from "./useReducedMotion3D";
import { ArchitectureMap3D } from "./ArchitectureMap3D";
import { CapstoneMiniSim3D } from "./CapstoneMiniSim3D";
import type { CapstoneBuilderConfig } from "../demo/demoSchema";

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
}: CapstoneAtlasSceneProps) {
  const reducedMotion = useReducedMotion3D();

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

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={!reducedMotion}
        minDistance={5}
        maxDistance={15}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
      />

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
    </>
  );
}

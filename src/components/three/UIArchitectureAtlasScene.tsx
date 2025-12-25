"use client";

import { Suspense } from "react";
import { OrbitControls, Environment } from "@react-three/drei";
import { useReducedMotion3D } from "./useReducedMotion3D";
import { TokenPropagation3D } from "./TokenPropagation3D";
import { MFBoundaryTiles3D } from "./MFBoundaryTiles3D";
import { FederationGraph3D } from "./FederationGraph3D";
import type { UIArchitectureLabConfig, TokenSet } from "../demo/demoSchema";

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
}: UIArchitectureAtlasSceneProps) {
  const reducedMotion = useReducedMotion3D();

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.4} />

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={15}
        autoRotate={false}
      />

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
    </>
  );
}

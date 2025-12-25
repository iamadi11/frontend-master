"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, Text } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion3D } from "./useReducedMotion3D";
import { CSPGates3D } from "./CSPGates3D";
import { TokenStorageSurface3D } from "./TokenStorageSurface3D";
import { FrameBarrier3D } from "./FrameBarrier3D";
import { RiskShelf3D } from "./RiskShelf3D";

export type CameraPreset = "overview" | "closeup" | "side";

// Camera preset positions for security sandbox view
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

type Mode =
  | "XSS_CSRF"
  | "CSP"
  | "TOKEN_STORAGE"
  | "CLICKJACKING"
  | "DEPENDENCIES"
  | "PII";

type Threat = "XSS" | "CSRF";
type SameSite = "NONE" | "LAX" | "STRICT";
type TokenStorage = "HTTP_ONLY_COOKIE" | "LOCAL_STORAGE" | "MEMORY";
type ClickjackingDefense = "NONE" | "XFO_DENY" | "CSP_FRAME_ANCESTORS";
type PIIMode = "RAW" | "REDACTED" | "MINIMIZED";
type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

interface DefenseState {
  inputEncoding: boolean;
  sanitizeHtml: boolean;
  sameSite: SameSite;
  csrfToken: boolean;
}

interface CSPState {
  scriptSrc: "NONE" | "SELF" | "SELF_CDN" | "UNSAFE_INLINE";
  connectSrc: "SELF" | "API_ONLY" | "ANY";
  frameAncestors: "NONE" | "SELF" | "TRUSTED";
}

interface Dependency {
  name: string;
  version: string;
  risk: RiskLevel;
}

interface AllowedOrBlocked {
  action: string;
  result: "ALLOW" | "BLOCK";
  reason: string;
}

interface SecuritySandboxSceneProps {
  mode: Mode;
  threat?: Threat;
  defense?: DefenseState;
  csp?: CSPState;
  tokenStorage?: TokenStorage;
  clickjackingDefense?: ClickjackingDefense;
  deps?: Dependency[];
  piiMode?: PIIMode;
  allowedOrBlocked?: AllowedOrBlocked[];
  riskSummary?: { severity: RiskLevel; notes: string[] };
  evaluatePolicyTrigger?: number;
  tryEmbedTrigger?: number;
  focusTarget?: string | null;
  cameraPreset?: CameraPreset;
  onCameraPresetChange?: (preset: CameraPreset) => void;
}

/**
 * 3D Security Sandbox scene showing defensive security concepts.
 * Purely defensive and conceptual - no exploit payloads.
 */
export function SecuritySandboxScene({
  mode,
  threat,
  defense,
  csp,
  tokenStorage,
  clickjackingDefense,
  deps = [],
  piiMode,
  allowedOrBlocked = [],
  riskSummary,
  evaluatePolicyTrigger = 0,
  tryEmbedTrigger = 0,
  focusTarget,
  cameraPreset = "overview",
  onCameraPresetChange,
}: SecuritySandboxSceneProps) {
  const reducedMotion = useReducedMotion3D();
  const { camera } = useThree();

  // Ambient lighting
  const ambientLight = useMemo(() => new THREE.AmbientLight(0xffffff, 0.6), []);
  const directionalLight = useMemo(
    () => new THREE.DirectionalLight(0xffffff, 0.8),
    []
  );

  // Position lights
  directionalLight.position.set(5, 5, 5);

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

  // Dim non-focused sub-scenes by adjusting scale
  const isFocused = (target: string) => {
    if (!focusTarget) return true;
    return focusTarget === target || focusTarget.startsWith(target + ".");
  };

  const scale = (target: string) => (isFocused(target) ? 1 : 0.7);

  return (
    <>
      <primitive object={ambientLight} />
      <primitive object={directionalLight} />

      {/* XSS/CSRF Defense Flow */}
      {mode === "XSS_CSRF" && threat && defense && (
        <group scale={scale("flow")}>
          <XSSCSRFDefenseFlow
            threat={threat}
            defense={defense}
            reducedMotion={reducedMotion}
          />
        </group>
      )}

      {/* CSP Gates */}
      {mode === "CSP" && csp && (
        <group scale={scale("csp")}>
          <CSPGates3D
            csp={csp}
            allowedOrBlocked={allowedOrBlocked}
            evaluatePolicyTrigger={evaluatePolicyTrigger}
            reducedMotion={reducedMotion}
          />
        </group>
      )}

      {/* Token Storage Surface */}
      {mode === "TOKEN_STORAGE" && tokenStorage !== undefined && (
        <group scale={scale("token.sim")}>
          <TokenStorageSurface3D
            tokenStorage={tokenStorage}
            reducedMotion={reducedMotion}
          />
        </group>
      )}

      {/* Clickjacking Frame Barrier */}
      {mode === "CLICKJACKING" && clickjackingDefense !== undefined && (
        <group scale={scale("frame")}>
          <FrameBarrier3D
            defense={clickjackingDefense}
            allowedOrBlocked={allowedOrBlocked}
            tryEmbedTrigger={tryEmbedTrigger}
            reducedMotion={reducedMotion}
          />
        </group>
      )}

      {/* Dependencies Risk Shelf + PII Vault */}
      {(mode === "DEPENDENCIES" || mode === "PII") && (
        <group scale={scale(mode === "DEPENDENCIES" ? "deps" : "pii")}>
          <RiskShelf3D
            mode={mode}
            deps={deps}
            piiMode={piiMode}
            riskSummary={riskSummary}
            reducedMotion={reducedMotion}
          />
        </group>
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

/**
 * XSS/CSRF Defense Flow visualization
 * Shows request flow through defensive checkpoints
 */
function XSSCSRFDefenseFlow({
  threat,
  defense,
  reducedMotion,
}: {
  threat: Threat;
  defense: DefenseState;
  reducedMotion: boolean;
}) {
  const requestFlowRef = useRef<THREE.Group>(null);
  const [checkpointState, setCheckpointState] = useState<{
    pass: boolean;
    risk: boolean;
  }>({ pass: false, risk: false });

  useEffect(() => {
    if (threat === "XSS") {
      const hasDefense = defense.inputEncoding || defense.sanitizeHtml;
      setCheckpointState({ pass: hasDefense, risk: !hasDefense });
    } else {
      const hasDefense = defense.sameSite !== "NONE" || defense.csrfToken;
      setCheckpointState({ pass: hasDefense, risk: !hasDefense });
    }
  }, [threat, defense]);

  useFrame((state, delta) => {
    if (!requestFlowRef.current || reducedMotion) return;
    // Subtle rotation for visual interest
    requestFlowRef.current.rotation.y += delta * 0.1;
  });

  return (
    <group ref={requestFlowRef} position={[0, 0, 0]}>
      {/* Request arrow */}
      <mesh position={[-2, 0, 0]}>
        <coneGeometry args={[0.2, 0.8, 8]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      <mesh position={[-1.5, 0, 0]}>
        <boxGeometry args={[1, 0.1, 0.1]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>

      {/* Checkpoint */}
      <group position={[0, 0, 0]}>
        <mesh>
          <boxGeometry args={[1, 1.5, 0.3]} />
          <meshStandardMaterial
            color={checkpointState.pass ? "#10b981" : "#ef4444"}
            opacity={0.8}
            transparent
          />
        </mesh>
        <Text
          position={[0, 0, 0.2]}
          fontSize={0.2}
          color={checkpointState.pass ? "#10b981" : "#ef4444"}
          anchorX="center"
          anchorY="middle"
        >
          {checkpointState.pass ? "PASS" : "RISK"}
        </Text>
        {checkpointState.risk && (
          <Html position={[0, 1, 0]} center>
            <div className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded border border-red-300 dark:border-red-700">
              Defense needed
            </div>
          </Html>
        )}
      </group>

      {/* Output */}
      <mesh position={[2, 0, 0]}>
        <boxGeometry args={[1, 0.1, 0.1]} />
        <meshStandardMaterial
          color={checkpointState.pass ? "#10b981" : "#ef4444"}
        />
      </mesh>
    </group>
  );
}

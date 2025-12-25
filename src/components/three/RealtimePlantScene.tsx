"use client";

import { Suspense, useEffect } from "react";
import { PerspectiveCamera, Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { RealtimePipes3D } from "./RealtimePipes3D";
import { BufferTank3D } from "./BufferTank3D";
import { ReplayConveyor3D } from "./ReplayConveyor3D";
import { ConflictArena3D } from "./ConflictArena3D";
import { useReducedMotion3D } from "./useReducedMotion3D";

export type CameraPreset = "overview" | "closeup" | "side";

// Camera preset positions for realtime plant view
const CAMERA_PRESETS: Record<
  CameraPreset,
  { position: [number, number, number]; lookAt: [number, number, number] }
> = {
  overview: { position: [0, 3, 10], lookAt: [0, -1, 0] },
  closeup: { position: [0, 2, 6], lookAt: [0, -1, 0] },
  side: { position: [8, 3, 6], lookAt: [0, -1, 0] },
};

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

type Protocol = "SSE" | "WEBSOCKET";
type Network = "STABLE" | "FLAKY" | "DISCONNECTED";
type Backpressure = "NONE" | "BATCH" | "THROTTLE" | "DROP_OLD" | "ACK_WINDOW";
type ReconnectStrategy = "NONE" | "AUTO_RECONNECT" | "RECONNECT_WITH_REPLAY";
type ConflictMode = "NONE" | "LAST_WRITE_WINS" | "MANUAL_MERGE";

interface RealtimePlantSceneProps {
  // Protocol & Network
  protocol: Protocol;
  network: Network;
  isStreaming: boolean;

  // Buffer & Backpressure
  bufferDepth: number;
  maxBufferDepth: number;
  backpressure: Backpressure;
  droppedMsgsPct: number;
  latencyMs: number;

  // Reconnect & Replay
  reconnectStrategy: ReconnectStrategy;
  replayWindow: number;
  isReconnecting: boolean;
  replayMessages: Array<{ id: string; message: string; timestamp: number }>;

  // Conflict
  conflictMode: ConflictMode;
  clientAValue: string;
  clientBValue: string;
  serverValue: string;
  hasConflict: boolean;
  lastEditFrom?: "A" | "B" | null;

  // Focus
  focusTarget?: string | null;

  // Callbacks
  onPacketComplete?: (packetId: string) => void;
  onPacketArrive?: () => void;
  onPacketDrop?: () => void;
  cameraPreset?: CameraPreset;
  onCameraPresetChange?: (preset: CameraPreset) => void;
}

/**
 * Main 3D scene for Realtime Plant visualization.
 * Shows 4 zones: Pipes (SSE/WS), Buffer Tank, Replay Conveyor, Conflict Arena.
 */
export function RealtimePlantScene({
  protocol,
  network,
  isStreaming,
  bufferDepth,
  maxBufferDepth,
  backpressure,
  droppedMsgsPct,
  latencyMs,
  reconnectStrategy,
  replayWindow,
  isReconnecting,
  replayMessages,
  conflictMode,
  clientAValue,
  clientBValue,
  serverValue,
  hasConflict,
  lastEditFrom,
  focusTarget,
  onPacketComplete,
  onPacketArrive,
  onPacketDrop,
  cameraPreset = "overview",
  onCameraPresetChange,
}: RealtimePlantSceneProps) {
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
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={50} />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.5} />

      {/* Zone 1: Pipes (top) */}
      <group position={[0, 2, 0]}>
        <RealtimePipes3D
          protocol={protocol}
          network={network}
          isStreaming={isStreaming}
          focusTarget={focusTarget === "flow" ? "flow" : null}
          onPacketComplete={onPacketComplete}
        />
      </group>

      {/* Zone 2: Buffer Tank (center-left) */}
      <group position={[-3, 0, 0]}>
        <BufferTank3D
          bufferDepth={bufferDepth}
          maxDepth={maxBufferDepth}
          backpressure={backpressure}
          droppedMsgsPct={droppedMsgsPct}
          latencyMs={latencyMs}
          isStreaming={isStreaming}
          focusTarget={focusTarget === "buffer" ? "buffer" : null}
          onPacketArrive={onPacketArrive}
          onPacketDrop={onPacketDrop}
        />
      </group>

      {/* Zone 3: Replay Conveyor (center-right) */}
      {reconnectStrategy === "RECONNECT_WITH_REPLAY" && (
        <group position={[3, 0, 0]}>
          <ReplayConveyor3D
            replayWindow={replayWindow}
            messages={replayMessages}
            isReconnecting={isReconnecting}
            focusTarget={focusTarget === "reconnect" ? "reconnect" : null}
          />
        </group>
      )}

      {/* Zone 4: Conflict Arena (bottom) */}
      {conflictMode !== "NONE" && (
        <ConflictArena3D
          conflictMode={conflictMode}
          clientAValue={clientAValue}
          clientBValue={clientBValue}
          serverValue={serverValue}
          hasConflict={hasConflict}
          lastEditFrom={lastEditFrom}
          focusTarget={focusTarget === "conflict" ? "conflict" : null}
        />
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

      {/* Zone labels (reduced motion only) */}
      {reducedMotion && (
        <>
          <mesh position={[0, 3.5, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
          <mesh position={[-3, 1.5, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial color="#10b981" />
          </mesh>
          {reconnectStrategy === "RECONNECT_WITH_REPLAY" && (
            <mesh position={[3, 1.5, 0]}>
              <boxGeometry args={[0.1, 0.1, 0.1]} />
              <meshStandardMaterial color="#8b5cf6" />
            </mesh>
          )}
          {conflictMode !== "NONE" && (
            <mesh position={[0, -4.5, 0]}>
              <boxGeometry args={[0.1, 0.1, 0.1]} />
              <meshStandardMaterial color="#f59e0b" />
            </mesh>
          )}
        </>
      )}
    </>
  );
}

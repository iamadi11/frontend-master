"use client";

import { Suspense } from "react";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { RealtimePipes3D } from "./RealtimePipes3D";
import { BufferTank3D } from "./BufferTank3D";
import { ReplayConveyor3D } from "./ReplayConveyor3D";
import { ConflictArena3D } from "./ConflictArena3D";
import { useReducedMotion3D } from "./useReducedMotion3D";

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
}: RealtimePlantSceneProps) {
  const reducedMotion = useReducedMotion3D();

  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={50} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={15}
        target={[0, -1, 0]}
      />

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

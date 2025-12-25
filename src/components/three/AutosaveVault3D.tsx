"use client";

import { useRef, useMemo } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface AutosaveEvent {
  id: string;
  timestamp: number;
  status: "saving" | "saved" | "queued" | "failed";
}

interface AutosaveVault3DProps {
  autosaveEvents: AutosaveEvent[];
  offline: boolean;
  recovery: boolean;
  queuedCount: number;
  lastSaved: number | null;
  focusTarget?: string | null;
  reducedMotion: boolean;
  onEditField?: () => void;
  onSimulateRefresh?: () => void;
  onGoOffline?: () => void;
  onGoOnline?: () => void;
}

/**
 * 3D visualization of autosave as a vault + offline queue.
 * Shows draft storage vault, offline queue conveyor, and recovery restore badge.
 */
export function AutosaveVault3D({
  autosaveEvents,
  offline,
  recovery,
  queuedCount,
  lastSaved,
  focusTarget,
  reducedMotion,
  onEditField,
  onSimulateRefresh,
  onGoOffline,
  onGoOnline,
}: AutosaveVault3DProps) {
  const vaultRef = useRef<THREE.Group>(null);
  const queueRef = useRef<THREE.Group>(null);

  const isFocused = focusTarget === "form.panel";

  const savedCount = useMemo(
    () => autosaveEvents.filter((e) => e.status === "saved").length,
    [autosaveEvents]
  );

  const queuedEvents = useMemo(
    () => autosaveEvents.filter((e) => e.status === "queued"),
    [autosaveEvents]
  );

  return (
    <group position={[0, 0, 0]}>
      {/* Vault (draft storage) */}
      <group ref={vaultRef} position={[-3, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial
            color={isFocused ? "#3b82f6" : "#6366f1"}
            opacity={0.8}
            transparent
          />
        </mesh>
        <mesh position={[0, 1.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 0.1, 32]} />
          <meshStandardMaterial color="#1e40af" />
        </mesh>
        <Html position={[0, 2, 0]} center>
          <div className="text-sm font-bold bg-white dark:bg-gray-800 px-3 py-1 rounded shadow">
            Vault ({savedCount} saved)
          </div>
        </Html>
      </group>

      {/* Offline queue conveyor */}
      <group ref={queueRef} position={[3, 0, 0]}>
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <boxGeometry args={[3, 1, 0.1]} />
          <meshStandardMaterial color="#9ca3af" />
        </mesh>
        {queuedEvents.map((event, i) => (
          <group
            key={event.id}
            position={[i * 0.5 - (queuedEvents.length - 1) * 0.25, 0, 0]}
          >
            <mesh>
              <boxGeometry args={[0.4, 0.4, 0.4]} />
              <meshStandardMaterial
                color="#fbbf24"
                opacity={
                  reducedMotion ? 1 : 0.7 + Math.sin(Date.now() / 500 + i) * 0.3
                }
                transparent
              />
            </mesh>
            {i === 0 && (
              <Html position={[0, 0.5, 0]} center>
                <div className="text-xs bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
                  Queued
                </div>
              </Html>
            )}
          </group>
        ))}
        <Html position={[0, 1, 0]} center>
          <div className="text-sm font-bold bg-white dark:bg-gray-800 px-3 py-1 rounded shadow">
            Queue ({queuedCount})
          </div>
        </Html>
      </group>

      {/* Offline indicator */}
      {offline && (
        <Html position={[0, 2.5, 0]} className="pointer-events-none">
          <div className="text-sm font-bold bg-red-100 dark:bg-red-900 px-3 py-2 rounded border-2 border-red-500">
            🔴 Offline
          </div>
        </Html>
      )}

      {/* Recovery badge */}
      {recovery && lastSaved && (
        <Html position={[0, -2, 0]} className="pointer-events-none">
          <div className="text-sm font-bold bg-green-100 dark:bg-green-900 px-3 py-2 rounded border-2 border-green-500">
            ✓ Recovery Available
          </div>
        </Html>
      )}

      {/* Control panel */}
      <Html position={[-6, 0, 0]} className="pointer-events-auto">
        <div
          className={`p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 ${
            isFocused
              ? "border-blue-500"
              : "border-gray-300 dark:border-gray-600"
          }`}
          style={{ minWidth: "200px" }}
        >
          <div className="text-sm font-bold mb-2">Autosave System</div>
          <div className="text-xs space-y-1 mb-2">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Status:</span>{" "}
              <span className="font-bold">
                {offline ? "Offline" : "Online"}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Saved:</span>{" "}
              <span className="font-bold">{savedCount}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Queued:</span>{" "}
              <span className="font-bold">{queuedCount}</span>
            </div>
            {lastSaved && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Last saved:
                </span>{" "}
                <span className="font-bold text-xs">
                  {new Date(lastSaved).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <button
              onClick={onEditField}
              className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
            >
              Edit Field
            </button>
            <button
              onClick={onSimulateRefresh}
              className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
            >
              Simulate Refresh
            </button>
            {offline ? (
              <button
                onClick={onGoOnline}
                className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
              >
                Go Online
              </button>
            ) : (
              <button
                onClick={onGoOffline}
                className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
              >
                Go Offline
              </button>
            )}
          </div>
        </div>
      </Html>
    </group>
  );
}

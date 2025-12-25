"use client";

import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";
import * as THREE from "three";

interface CDNCacheMap3DProps {
  cacheTTLSeconds: number;
  cacheInvalidation: "NONE" | "PURGE_PATH" | "VERSIONED_ASSETS";
  edgeCompute: boolean;
  cacheHitRate: number;
  events: string[];
  notes: string[];
  focused: boolean;
  reducedMotion: boolean;
  requestAssetTrigger?: number; // Increment to trigger request
  deployNewBuildTrigger?: number; // Increment to trigger deploy
}

const NODE_SIZE = 0.5;
const PACKET_SIZE = 0.15;
const CACHE_BOX_SIZE = 0.8;

export function CDNCacheMap3D({
  cacheTTLSeconds,
  cacheInvalidation,
  edgeCompute,
  cacheHitRate,
  events,
  notes,
  focused,
  reducedMotion,
  requestAssetTrigger,
  deployNewBuildTrigger,
}: CDNCacheMap3DProps) {
  const [packetState, setPacketState] = useState<{
    active: boolean;
    position: [number, number, number];
    hit: boolean;
    phase: "client" | "cdn" | "origin" | "return";
  } | null>(null);
  const [cacheFill, setCacheFill] = useState(0);
  const [purgePulse, setPurgePulse] = useState(false);
  const [staleBadge, setStaleBadge] = useState(false);
  const [versionedBadge, setVersionedBadge] = useState(false);
  const packetRef = useRef<THREE.Mesh>(null);
  const edgeComputeRingRef = useRef<THREE.Mesh>(null);

  // Node positions
  const clientPos: [number, number, number] = [-3, 0, 0];
  const cdnPos: [number, number, number] = [0, 0, 0];
  const originPos: [number, number, number] = [3, 0, 0];

  // Animate packet movement
  useFrame(() => {
    if (!packetState || !packetRef.current || reducedMotion) return;

    const [px, py, pz] = packetState.position;
    const currentPos = packetRef.current.position;

    const dx = px - currentPos.x;
    const dy = py - currentPos.y;
    const dz = pz - currentPos.z;

    if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01 || Math.abs(dz) > 0.01) {
      currentPos.x += dx * 0.1;
      currentPos.y += dy * 0.1;
      currentPos.z += dz * 0.1;
    } else {
      currentPos.x = px;
      currentPos.y = py;
      currentPos.z = pz;
    }
  });

  // Instant positioning for reduced motion
  useEffect(() => {
    if (!packetState || !packetRef.current) return;
    if (reducedMotion) {
      packetRef.current.position.set(...packetState.position);
    }
  }, [packetState, reducedMotion]);

  // Animate edge compute ring
  useFrame((state) => {
    if (!edgeComputeRingRef.current || !edgeCompute || reducedMotion) return;
    edgeComputeRingRef.current.rotation.z = state.clock.elapsedTime * 2;
  });

  // Handle request asset
  const handleRequestAsset = useCallback(() => {
    const hit = Math.random() < cacheHitRate;
    setPacketState({
      active: true,
      position: [...clientPos],
      hit,
      phase: "client",
    });

    if (reducedMotion) {
      // Instant completion
      if (hit) {
        setPacketState({
          active: true,
          position: [...cdnPos],
          hit: true,
          phase: "return",
        });
        setTimeout(() => setPacketState(null), 100);
      } else {
        setPacketState({
          active: true,
          position: [...originPos],
          hit: false,
          phase: "origin",
        });
        setTimeout(() => {
          setCacheFill((prev) => Math.min(prev + 0.2, 1));
          setPacketState(null);
        }, 200);
      }
    } else {
      // Animated flow
      setTimeout(() => {
        setPacketState((prev) =>
          prev
            ? {
                ...prev,
                position: [...cdnPos],
                phase: "cdn",
              }
            : null
        );
      }, 500);

      if (hit) {
        // Cache hit - return quickly
        setTimeout(() => {
          setPacketState((prev) =>
            prev
              ? {
                  ...prev,
                  position: [...clientPos],
                  phase: "return",
                }
              : null
          );
          setTimeout(() => setPacketState(null), 500);
        }, 1000);
      } else {
        // Cache miss - go to origin
        setTimeout(() => {
          setPacketState((prev) =>
            prev
              ? {
                  ...prev,
                  position: [...originPos],
                  phase: "origin",
                }
              : null
          );
          setTimeout(() => {
            setCacheFill((prev) => Math.min(prev + 0.2, 1));
            setPacketState((prev) =>
              prev
                ? {
                    ...prev,
                    position: [...cdnPos],
                    phase: "return",
                  }
                : null
            );
            setTimeout(() => {
              setPacketState((prev) =>
                prev
                  ? {
                      ...prev,
                      position: [...clientPos],
                      phase: "return",
                    }
                  : null
              );
              setTimeout(() => setPacketState(null), 500);
            }, 1000);
          }, 1000);
        }, 1500);
      }
    }
  }, [cacheHitRate, reducedMotion, clientPos, cdnPos, originPos]);

  // Handle deploy new build
  const handleDeployNewBuild = useCallback(() => {
    if (cacheInvalidation === "NONE") {
      setStaleBadge(true);
      setTimeout(() => setStaleBadge(false), reducedMotion ? 500 : 3000);
    } else if (cacheInvalidation === "PURGE_PATH") {
      setPurgePulse(true);
      setCacheFill(0);
      setTimeout(() => setPurgePulse(false), reducedMotion ? 200 : 1000);
    } else if (cacheInvalidation === "VERSIONED_ASSETS") {
      setVersionedBadge(true);
      setTimeout(() => setVersionedBadge(false), reducedMotion ? 500 : 3000);
    }
  }, [cacheInvalidation, reducedMotion]);

  // Trigger handlers when trigger props change
  useEffect(() => {
    if (requestAssetTrigger !== undefined && requestAssetTrigger > 0) {
      handleRequestAsset();
    }
  }, [requestAssetTrigger, handleRequestAsset]);

  useEffect(() => {
    if (deployNewBuildTrigger !== undefined && deployNewBuildTrigger > 0) {
      handleDeployNewBuild();
    }
  }, [deployNewBuildTrigger, handleDeployNewBuild]);

  const opacity = focused ? 1 : 0.3;

  return (
    <group position={[0, 0, 0]}>
      {/* Client node */}
      <group position={clientPos}>
        <mesh>
          <sphereGeometry args={[NODE_SIZE, 16, 16]} />
          <meshStandardMaterial color="#3b82f6" opacity={opacity} transparent />
        </mesh>
        <Text
          position={[0, -NODE_SIZE - 0.3, 0]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Client
        </Text>
      </group>

      {/* CDN node */}
      <group position={cdnPos}>
        <mesh>
          <sphereGeometry args={[NODE_SIZE, 16, 16]} />
          <meshStandardMaterial color="#8b5cf6" opacity={opacity} transparent />
        </mesh>
        <Text
          position={[0, -NODE_SIZE - 0.3, 0]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          CDN
        </Text>

        {/* Cache box */}
        <mesh position={[0, NODE_SIZE + 0.5, 0]}>
          <boxGeometry
            args={[CACHE_BOX_SIZE, CACHE_BOX_SIZE * cacheFill, 0.2]}
          />
          <meshStandardMaterial
            color={purgePulse ? "#ef4444" : "#10b981"}
            opacity={opacity * 0.6}
            transparent
            emissive={purgePulse ? "#ef4444" : "#000000"}
            emissiveIntensity={purgePulse ? (reducedMotion ? 0.5 : 1) : 0}
          />
        </mesh>

        {/* Edge compute ring */}
        {edgeCompute && (
          <mesh ref={edgeComputeRingRef} position={[0, 0, 0]}>
            <torusGeometry args={[NODE_SIZE + 0.2, 0.05, 8, 16]} />
            <meshStandardMaterial
              color="#f59e0b"
              opacity={reducedMotion ? 0.8 : 0.5}
              transparent
              emissive="#f59e0b"
              emissiveIntensity={reducedMotion ? 0.3 : 0.6}
            />
          </mesh>
        )}

        {/* Purge pulse effect */}
        {purgePulse && (
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[NODE_SIZE + 0.5, 16, 16]} />
            <meshStandardMaterial
              color="#ef4444"
              opacity={reducedMotion ? 0.5 : 0.2}
              transparent
              emissive="#ef4444"
              emissiveIntensity={reducedMotion ? 0.5 : 1}
            />
          </mesh>
        )}

        {/* Versioned assets badge */}
        {versionedBadge && (
          <Html position={[0, NODE_SIZE + 1, 0]} center>
            <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
              ✓ Versioned Assets
            </div>
          </Html>
        )}
      </group>

      {/* Origin node */}
      <group position={originPos}>
        <mesh>
          <sphereGeometry args={[NODE_SIZE, 16, 16]} />
          <meshStandardMaterial color="#10b981" opacity={opacity} transparent />
        </mesh>
        <Text
          position={[0, -NODE_SIZE - 0.3, 0]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Origin
        </Text>
      </group>

      {/* Connection lines */}
      <mesh position={[-1.5, 0, 0]}>
        <boxGeometry args={[3, 0.05, 0.05]} />
        <meshStandardMaterial
          color="#6b7280"
          opacity={opacity * 0.5}
          transparent
        />
      </mesh>
      <mesh position={[1.5, 0, 0]}>
        <boxGeometry args={[3, 0.05, 0.05]} />
        <meshStandardMaterial
          color="#6b7280"
          opacity={opacity * 0.5}
          transparent
        />
      </mesh>

      {/* Packet */}
      {packetState && (
        <mesh ref={packetRef} position={packetState.position}>
          <boxGeometry args={[PACKET_SIZE, PACKET_SIZE, PACKET_SIZE]} />
          <meshStandardMaterial
            color={packetState.hit ? "#10b981" : "#f59e0b"}
            emissive={packetState.hit ? "#10b981" : "#f59e0b"}
            emissiveIntensity={0.8}
            opacity={opacity}
            transparent
          />
        </mesh>
      )}

      {/* Stale badge */}
      {staleBadge && (
        <Html position={[0, 2, 0]} center>
          <div className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold">
            ⚠️ Stale Content Risk
          </div>
        </Html>
      )}

      {/* Metrics panel */}
      <Html position={[0, -2, 0]} center>
        <div className="bg-white/90 dark:bg-gray-900/90 px-3 py-2 rounded shadow-lg text-xs">
          <div className="font-semibold mb-1">Cache Metrics:</div>
          <div className="text-gray-700 dark:text-gray-300">
            Hit Rate: {(cacheHitRate * 100).toFixed(1)}%
          </div>
          <div className="text-gray-700 dark:text-gray-300">
            TTL: {cacheTTLSeconds}s
          </div>
          {edgeCompute && (
            <div className="text-green-600 dark:text-green-400 mt-1">
              Edge Compute: Enabled
            </div>
          )}
        </div>
      </Html>

      {/* Notes tooltip */}
      {notes.length > 0 && (
        <Html position={[0, 2.5, 0]} center>
          <div className="bg-white/90 dark:bg-gray-900/90 px-3 py-2 rounded shadow-lg max-w-xs text-xs">
            <div className="font-semibold mb-1">CDN Notes:</div>
            {notes.map((note, i) => (
              <div key={i} className="text-gray-700 dark:text-gray-300">
                • {note}
              </div>
            ))}
          </div>
        </Html>
      )}
    </group>
  );
}

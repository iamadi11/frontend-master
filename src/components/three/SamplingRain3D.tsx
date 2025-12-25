"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion3D } from "./useReducedMotion3D";

interface SamplingRain3DProps {
  sampleRate: number;
  droppedEventsPct: number;
  redactPII: boolean;
  replayEnabled: boolean;
  privacyNotes: string[];
  focusTarget?: string | null;
  onSamplingComplete?: () => void;
}

interface DroppedPacket {
  id: string;
  position: [number, number, number];
  startTime: number;
  velocity: number;
  shouldKeep: boolean;
}

/**
 * 3D visualization of sampling: packets stream down, some are kept, some drop.
 * Shows redaction masks when PII redaction is enabled.
 */
export function SamplingRain3D({
  sampleRate,
  droppedEventsPct,
  redactPII,
  replayEnabled,
  privacyNotes,
  focusTarget,
  onSamplingComplete,
}: SamplingRain3DProps) {
  const reducedMotion = useReducedMotion3D();
  const [packets, setPackets] = useState<DroppedPacket[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [redactionPulse, setRedactionPulse] = useState(false);
  const packetIdCounter = useRef(0);
  const streamStartTime = useRef<number | null>(null);

  // Start streaming when sampleRate changes (teaching sequence, 2-3 seconds)
  useEffect(() => {
    if (reducedMotion) {
      // In reduced motion, just show static counts
      setIsStreaming(false);
      return;
    }

    setIsStreaming(true);
    streamStartTime.current = Date.now();

    // Generate packets for a short window (2-3 seconds)
    const packetInterval = 150; // ms between packets
    const streamDuration = 2500; // 2.5 seconds
    const packetCount = Math.floor(streamDuration / packetInterval);

    const newPackets: DroppedPacket[] = [];
    for (let i = 0; i < packetCount; i++) {
      const shouldKeep = Math.random() < sampleRate;
      newPackets.push({
        id: `packet-${packetIdCounter.current++}`,
        position: [
          (Math.random() - 0.5) * 4, // random X
          3 + i * 0.3, // start high, stagger
          0,
        ] as [number, number, number],
        startTime: Date.now() + i * packetInterval,
        velocity: shouldKeep ? 0.02 : 0.05, // dropped packets fall faster
        shouldKeep,
      });
    }

    setPackets(newPackets);

    // Stop streaming after duration
    const timeout = setTimeout(() => {
      setIsStreaming(false);
      if (onSamplingComplete) {
        onSamplingComplete();
      }
    }, streamDuration);

    return () => clearTimeout(timeout);
  }, [sampleRate, reducedMotion, onSamplingComplete]);

  // Trigger redaction pulse when redactPII toggles ON
  useEffect(() => {
    if (redactPII && !reducedMotion) {
      setRedactionPulse(true);
      setTimeout(() => setRedactionPulse(false), 1000);
    }
  }, [redactPII, reducedMotion]);

  // Animate packet falling
  useFrame(() => {
    if (reducedMotion) return;

    setPackets((prev) => {
      const now = Date.now();
      return prev
        .map((packet) => {
          if (now < packet.startTime) return packet;

          const elapsed = (now - packet.startTime) / 1000;
          const newY = packet.position[1] - packet.velocity * elapsed * 10;

          // Remove packets that fell below ground
          if (newY < -2) return null;

          return {
            ...packet,
            position: [packet.position[0], newY, packet.position[2]],
          };
        })
        .filter((p): p is DroppedPacket => p !== null);
    });
  });

  // Calculate kept vs dropped counts
  const totalPackets = packets.length;
  const keptCount = Math.floor(totalPackets * sampleRate);
  const droppedCount = totalPackets - keptCount;

  const isFocused =
    focusTarget === "sampling" || focusTarget === "privacy.panel";

  return (
    <group>
      {/* Sampling visualization area */}
      <group position={[0, 0, 0]}>
        {/* Ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
          <planeGeometry args={[8, 2]} />
          <meshStandardMaterial color="#1f2937" opacity={0.3} transparent />
        </mesh>

        {/* Kept packets area (green zone) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2, -1.9, 0]}>
          <planeGeometry args={[2, 1.5]} />
          <meshStandardMaterial color="#10b981" opacity={0.2} transparent />
        </mesh>
        <Html position={[-1, -2.5, 0]} center>
          <div className="text-xs font-medium text-green-600 bg-white/90 px-2 py-1 rounded">
            Kept: {keptCount}
          </div>
        </Html>

        {/* Dropped packets area (red zone) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2, -1.9, 0]}>
          <planeGeometry args={[2, 1.5]} />
          <meshStandardMaterial color="#ef4444" opacity={0.2} transparent />
        </mesh>
        <Html position={[1, -2.5, 0]} center>
          <div className="text-xs font-medium text-red-600 bg-white/90 px-2 py-1 rounded">
            Dropped: {droppedCount}
          </div>
        </Html>

        {/* Animated packets */}
        {packets.map((packet) => {
          const packetColor = packet.shouldKeep ? "#10b981" : "#ef4444";

          return (
            <mesh key={packet.id} position={packet.position} castShadow>
              <boxGeometry args={[0.15, 0.15, 0.15]} />
              <meshStandardMaterial
                color={packetColor}
                emissive={packetColor}
                emissiveIntensity={0.5}
                opacity={isFocused ? 1 : 0.5}
                transparent
              />
            </mesh>
          );
        })}
      </group>

      {/* Stats panel */}
      <group position={[0, 2.5, 0]}>
        <Html center>
          <div className="bg-black/70 text-white text-xs p-3 rounded space-y-2 min-w-[200px]">
            <div className="font-semibold">Sampling Stats</div>
            <div>Sample Rate: {(sampleRate * 100).toFixed(0)}%</div>
            <div>Dropped: {droppedEventsPct.toFixed(1)}%</div>
            {isStreaming && <div className="text-yellow-400">Streaming...</div>}
          </div>
        </Html>
      </group>

      {/* Privacy panel */}
      <group position={[3, 0, 0]}>
        <RoundedBox args={[1.5, 2, 0.2]} radius={0.1} smoothness={4}>
          <meshStandardMaterial
            color={redactPII ? "#10b981" : "#6b7280"}
            emissive={redactPII ? "#10b981" : "#000000"}
            emissiveIntensity={redactPII ? (redactionPulse ? 0.8 : 0.3) : 0}
            opacity={isFocused ? 1 : 0.5}
            transparent
          />
        </RoundedBox>
        <Html position={[0, 0, 0.2]} center>
          <div className="bg-black/70 text-white text-xs p-2 rounded space-y-1">
            <div className="font-semibold">Privacy</div>
            <div>PII Redaction: {redactPII ? "ON" : "OFF"}</div>
            <div>Replay: {replayEnabled ? "ENABLED" : "DISABLED"}</div>
            {replayEnabled && (
              <div className="text-yellow-400 text-[10px]">⚠️ Risk</div>
            )}
          </div>
        </Html>

        {/* Redaction mask overlay (when enabled) */}
        {redactPII && (
          <group position={[0, 0, 0.15]}>
            {redactionPulse && (
              <mesh>
                <planeGeometry args={[1.4, 1.9]} />
                <meshStandardMaterial
                  color="#fbbf24"
                  opacity={0.3}
                  transparent
                />
              </mesh>
            )}
          </group>
        )}
      </group>

      {/* Privacy notes */}
      {privacyNotes.length > 0 && (
        <group position={[-3, -1, 0]}>
          <Html center>
            <div className="bg-black/70 text-white text-xs p-2 rounded max-w-[200px] space-y-1">
              {privacyNotes.slice(0, 3).map((note, idx) => (
                <div key={idx} className="text-[10px]">
                  • {note}
                </div>
              ))}
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

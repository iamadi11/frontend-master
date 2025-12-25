"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Line } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion3D } from "./useReducedMotion3D";
import { Packet } from "./Packet";

type Protocol = "SSE" | "WEBSOCKET";
type Network = "STABLE" | "FLAKY" | "DISCONNECTED";

interface RealtimePipes3DProps {
  protocol: Protocol;
  network: Network;
  isStreaming: boolean;
  focusTarget?: string | null;
  onPacketComplete?: (packetId: string) => void;
}

/**
 * 3D visualization of SSE vs WebSocket pipes showing directionality.
 * SSE: one-way Server→Client pipe + conceptual Client→Server POST line
 * WebSocket: bidirectional pipe
 */
export function RealtimePipes3D({
  protocol,
  network,
  isStreaming,
  focusTarget,
  onPacketComplete,
}: RealtimePipes3DProps) {
  const reducedMotion = useReducedMotion3D();
  const [activePackets, setActivePackets] = useState<
    Array<{ id: string; direction: "server-to-client" | "client-to-server" }>
  >([]);
  const packetCounterRef = useRef(0);

  // Client position (left)
  const clientPos: [number, number, number] = [-2, 0, 0];
  // Server position (right)
  const serverPos: [number, number, number] = [2, 0, 0];

  // Emit packets when streaming starts
  useEffect(() => {
    if (!isStreaming || network === "DISCONNECTED") {
      setActivePackets([]);
      return;
    }

    // Emit a short burst of packets (max 10 visible)
    const burstPackets: Array<{
      id: string;
      direction: "server-to-client" | "client-to-server";
    }> = [];

    if (protocol === "SSE") {
      // SSE: only server-to-client
      for (let i = 0; i < 8; i++) {
        burstPackets.push({
          id: `sse-${packetCounterRef.current++}`,
          direction: "server-to-client",
        });
      }
    } else {
      // WebSocket: bidirectional
      for (let i = 0; i < 5; i++) {
        burstPackets.push({
          id: `ws-s2c-${packetCounterRef.current++}`,
          direction: "server-to-client",
        });
      }
      for (let i = 0; i < 3; i++) {
        burstPackets.push({
          id: `ws-c2s-${packetCounterRef.current++}`,
          direction: "client-to-server",
        });
      }
    }

    setActivePackets(burstPackets);

    // Stop streaming after 2-3 seconds
    const timeout = setTimeout(() => {
      setActivePackets([]);
    }, 2500);

    return () => clearTimeout(timeout);
  }, [isStreaming, protocol, network]);

  const isFocused = focusTarget === "flow";

  return (
    <group>
      {/* Client node */}
      <mesh position={clientPos} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial
          color={isFocused ? "#3b82f6" : "#60a5fa"}
          emissive={isFocused ? "#3b82f6" : "#60a5fa"}
          emissiveIntensity={0.3}
        />
      </mesh>
      <Text
        position={[clientPos[0], clientPos[1] - 0.5, clientPos[2]]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        Client
      </Text>

      {/* Server node */}
      <mesh position={serverPos} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial
          color={isFocused ? "#10b981" : "#34d399"}
          emissive={isFocused ? "#10b981" : "#34d399"}
          emissiveIntensity={0.3}
        />
      </mesh>
      <Text
        position={[serverPos[0], serverPos[1] - 0.5, serverPos[2]]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        Server
      </Text>

      {/* SSE: One-way pipe + conceptual POST line */}
      {protocol === "SSE" && (
        <>
          {/* Server→Client pipe (solid) */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 4, 8]} />
            <meshStandardMaterial
              color={network === "DISCONNECTED" ? "#6b7280" : "#10b981"}
              opacity={network === "DISCONNECTED" ? 0.3 : 0.6}
              transparent
            />
          </mesh>

          {/* Client→Server conceptual POST line (dotted, below) */}
          <Line
            points={[
              [clientPos[0], -0.3, 0],
              [serverPos[0], -0.3, 0],
            ]}
            color="#3b82f6"
            lineWidth={2}
            dashed
            dashScale={0.2}
            dashSize={0.1}
            gapSize={0.1}
            opacity={0.4}
          />
        </>
      )}

      {/* WebSocket: Bidirectional pipe */}
      {protocol === "WEBSOCKET" && (
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 4, 8]} />
          <meshStandardMaterial
            color={network === "DISCONNECTED" ? "#6b7280" : "#8b5cf6"}
            opacity={network === "DISCONNECTED" ? 0.3 : 0.6}
            transparent
          />
        </mesh>
      )}

      {/* Disconnected indicator */}
      {network === "DISCONNECTED" && (
        <Text
          position={[0, 0.8, 0]}
          fontSize={0.2}
          color="#ef4444"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          Connection broken
        </Text>
      )}

      {/* Animated packets */}
      {!reducedMotion &&
        activePackets.map((packet) => {
          const from =
            packet.direction === "server-to-client" ? serverPos : clientPos;
          const to =
            packet.direction === "server-to-client" ? clientPos : serverPos;
          const color =
            packet.direction === "server-to-client" ? "#10b981" : "#3b82f6";

          return (
            <Packet
              key={packet.id}
              id={packet.id}
              from={from}
              to={to}
              color={color}
              duration={1500}
              onComplete={() => {
                setActivePackets((prev) =>
                  prev.filter((p) => p.id !== packet.id)
                );
                onPacketComplete?.(packet.id);
              }}
            />
          );
        })}

      {/* Reduced motion: show packet count instead */}
      {reducedMotion && isStreaming && network !== "DISCONNECTED" && (
        <Text
          position={[0, 0.8, 0]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {activePackets.length} packets in flight
        </Text>
      )}
    </group>
  );
}

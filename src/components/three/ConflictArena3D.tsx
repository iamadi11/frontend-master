"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion3D } from "./useReducedMotion3D";
import { Packet } from "./Packet";

type ConflictMode = "NONE" | "LAST_WRITE_WINS" | "MANUAL_MERGE";

interface ConflictArena3DProps {
  conflictMode: ConflictMode;
  clientAValue: string;
  clientBValue: string;
  serverValue: string;
  hasConflict: boolean;
  lastEditFrom?: "A" | "B" | null;
  focusTarget?: string | null;
  onEditA?: () => void;
  onEditB?: () => void;
}

/**
 * 3D conflict arena showing Client A, Server, and Client B with conflict resolution.
 */
export function ConflictArena3D({
  conflictMode,
  clientAValue,
  clientBValue,
  serverValue,
  hasConflict,
  lastEditFrom,
  focusTarget,
  onEditA,
  onEditB,
}: ConflictArena3DProps) {
  const reducedMotion = useReducedMotion3D();
  const [activePackets, setActivePackets] = useState<
    Array<{ id: string; from: "A" | "B"; to: "server" }>
  >([]);
  const packetCounterRef = useRef(0);
  const lastEditRef = useRef<"A" | "B" | null>(null);

  const isFocused = focusTarget === "conflict";

  // Client A position (left)
  const clientAPos: [number, number, number] = [-1.5, 0, 0];
  // Server position (center)
  const serverPos: [number, number, number] = [0, 0, 0];
  // Client B position (right)
  const clientBPos: [number, number, number] = [1.5, 0, 0];

  // Animate edits when they happen
  useEffect(() => {
    if (lastEditFrom && lastEditFrom !== lastEditRef.current) {
      lastEditRef.current = lastEditFrom;
      // Show edit packet animation
      const packet = {
        id: `edit-${packetCounterRef.current++}`,
        from: lastEditFrom,
        to: "server" as const,
      };
      setActivePackets((prev) => [...prev, packet]);
      setTimeout(() => {
        setActivePackets((prev) => prev.filter((p) => p.id !== packet.id));
      }, 1500);
    }
  }, [lastEditFrom]);

  return (
    <group position={[0, -3, 0]}>
      {/* Client A */}
      <group position={clientAPos}>
        <RoundedBox args={[0.5, 0.6, 0.3]} radius={0.05} castShadow>
          <meshStandardMaterial
            color={isFocused ? "#3b82f6" : "#60a5fa"}
            emissive={isFocused ? "#3b82f6" : "#60a5fa"}
            emissiveIntensity={0.3}
          />
        </RoundedBox>
        <Text
          position={[0, 0.5, 0]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          Client A
        </Text>
        <Text
          position={[0, -0.4, 0]}
          fontSize={0.06}
          color="#9ca3af"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
          maxWidth={0.4}
        >
          {clientAValue.slice(0, 10)}
        </Text>
      </group>

      {/* Server (shared state) */}
      <group position={serverPos}>
        <RoundedBox args={[0.5, 0.6, 0.3]} radius={0.05} castShadow>
          <meshStandardMaterial
            color={hasConflict ? "#f59e0b" : isFocused ? "#10b981" : "#34d399"}
            emissive={
              hasConflict ? "#f59e0b" : isFocused ? "#10b981" : "#34d399"
            }
            emissiveIntensity={0.4}
          />
        </RoundedBox>
        <Text
          position={[0, 0.5, 0]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          Server
        </Text>
        <Text
          position={[0, -0.4, 0]}
          fontSize={0.06}
          color="#9ca3af"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
          maxWidth={0.4}
        >
          {serverValue.slice(0, 10)}
        </Text>
        {hasConflict && (
          <Text
            position={[0, 0.8, 0]}
            fontSize={0.08}
            color="#ef4444"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="#000000"
          >
            CONFLICT!
          </Text>
        )}
      </group>

      {/* Client B */}
      <group position={clientBPos}>
        <RoundedBox args={[0.5, 0.6, 0.3]} radius={0.05} castShadow>
          <meshStandardMaterial
            color={isFocused ? "#8b5cf6" : "#a78bfa"}
            emissive={isFocused ? "#8b5cf6" : "#a78bfa"}
            emissiveIntensity={0.3}
          />
        </RoundedBox>
        <Text
          position={[0, 0.5, 0]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          Client B
        </Text>
        <Text
          position={[0, -0.4, 0]}
          fontSize={0.06}
          color="#9ca3af"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
          maxWidth={0.4}
        >
          {clientBValue.slice(0, 10)}
        </Text>
      </group>

      {/* Connection lines */}
      <mesh position={[-0.75, 0, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
        <meshStandardMaterial
          color={hasConflict ? "#f59e0b" : "#6b7280"}
          opacity={0.4}
          transparent
        />
      </mesh>
      <mesh position={[0.75, 0, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
        <meshStandardMaterial
          color={hasConflict ? "#f59e0b" : "#6b7280"}
          opacity={0.4}
          transparent
        />
      </mesh>

      {/* Animated edit packets */}
      {!reducedMotion &&
        activePackets.map((packet) => {
          const from = packet.from === "A" ? clientAPos : clientBPos;
          const to = serverPos;
          const color = packet.from === "A" ? "#3b82f6" : "#8b5cf6";

          return (
            <Packet
              key={packet.id}
              id={packet.id}
              from={from}
              to={to}
              color={color}
              duration={1000}
              onComplete={() => {
                setActivePackets((prev) =>
                  prev.filter((p) => p.id !== packet.id)
                );
              }}
            />
          );
        })}

      {/* Reduced motion: show conflict indicator */}
      {reducedMotion && hasConflict && (
        <Text
          position={[0, 0.8, 0]}
          fontSize={0.12}
          color="#ef4444"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          Conflict: {conflictMode.replace(/_/g, " ")}
        </Text>
      )}
    </group>
  );
}

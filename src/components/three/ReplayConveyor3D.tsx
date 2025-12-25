"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion3D } from "./useReducedMotion3D";

interface ReplayTile {
  id: string;
  message: string;
  timestamp: number;
}

interface ReplayConveyor3DProps {
  replayWindow: number;
  messages: ReplayTile[];
  isReconnecting: boolean;
  focusTarget?: string | null;
}

/**
 * 3D conveyor belt showing replay window tiles.
 * Tiles move from left to right when replaying.
 */
export function ReplayConveyor3D({
  replayWindow,
  messages,
  isReconnecting,
  focusTarget,
}: ReplayConveyor3DProps) {
  const reducedMotion = useReducedMotion3D();
  const [tilePositions, setTilePositions] = useState<
    Map<string, { x: number; progress: number }>
  >(new Map());
  const conveyorRef = useRef<THREE.Group>(null);

  const isFocused = focusTarget === "reconnect";

  // Update tile positions when messages change
  useEffect(() => {
    if (reducedMotion) {
      // Instant positioning
      const newPositions = new Map<string, { x: number; progress: number }>();
      messages.forEach((msg, index) => {
        const x = -1.5 + (index / Math.max(1, messages.length - 1)) * 3;
        newPositions.set(msg.id, { x, progress: 1 });
      });
      setTilePositions(newPositions);
      return;
    }

    // Animate tiles moving on conveyor
    messages.forEach((msg) => {
      setTilePositions((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(msg.id);
        if (!current) {
          newMap.set(msg.id, { x: -2, progress: 0 });
        }
        return newMap;
      });
    });
  }, [messages, reducedMotion]);

  useFrame((state, delta) => {
    if (reducedMotion || !isReconnecting) return;

    // Animate tiles moving right
    setTilePositions((prev) => {
      const newMap = new Map(prev);
      newMap.forEach((pos, id) => {
        if (pos.progress < 1) {
          const newX = THREE.MathUtils.lerp(pos.x, 2, delta * 0.5);
          const newProgress = Math.min(1, pos.progress + delta * 0.5);
          newMap.set(id, { x: newX, progress: newProgress });
        }
      });
      return newMap;
    });
  });

  const visibleMessages = messages.slice(-Math.min(replayWindow, 10));

  return (
    <group ref={conveyorRef} position={[0, -1.5, 0]}>
      {/* Conveyor belt base */}
      <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[4, 0.1, 0.3]} />
        <meshStandardMaterial
          color={isFocused ? "#4b5563" : "#6b7280"}
          opacity={0.5}
          transparent
        />
      </mesh>

      {/* Replay tiles */}
      {visibleMessages.map((msg, index) => {
        const pos = tilePositions.get(msg.id);
        const x =
          pos?.x ??
          -1.5 + (index / Math.max(1, visibleMessages.length - 1)) * 3;

        return (
          <group key={msg.id} position={[x, 0, 0]}>
            <RoundedBox args={[0.3, 0.2, 0.2]} radius={0.02} castShadow>
              <meshStandardMaterial
                color={isReconnecting ? "#3b82f6" : "#10b981"}
                emissive={isReconnecting ? "#3b82f6" : "#10b981"}
                emissiveIntensity={0.3}
              />
            </RoundedBox>
            <Text
              position={[0, 0, 0.15]}
              fontSize={0.06}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.01}
              outlineColor="#000000"
            >
              {msg.id.slice(-3)}
            </Text>
          </group>
        );
      })}

      {/* Label */}
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.12}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        Replay Window ({replayWindow})
      </Text>

      {/* Reconnecting indicator */}
      {isReconnecting && (
        <Text
          position={[0, -0.5, 0]}
          fontSize={0.1}
          color="#3b82f6"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          Replaying {visibleMessages.length} messages...
        </Text>
      )}

      {/* Reduced motion: show count only */}
      {reducedMotion && (
        <Text
          position={[0, 0, 0]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {visibleMessages.length} messages in replay
        </Text>
      )}
    </group>
  );
}

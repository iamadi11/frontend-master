"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion3D } from "./useReducedMotion3D";

interface PacketProps {
  id: string;
  from: [number, number, number];
  to: [number, number, number];
  color?: string;
  label?: string;
  onComplete?: () => void;
  duration?: number;
  tag?: string;
}

/**
 * Animated packet that moves between two positions.
 * In reduced motion mode, it appears instantly at the destination.
 */
export function Packet({
  id,
  from,
  to,
  color = "#3b82f6",
  label,
  onComplete,
  duration = 1000,
  tag,
}: PacketProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const reducedMotion = useReducedMotion3D();
  const startTimeRef = useRef<number>(Date.now());
  const progressRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
    progressRef.current = 0;
  }, [from, to]);

  useFrame(() => {
    if (!meshRef.current || !groupRef.current) return;

    if (reducedMotion) {
      // Instant positioning in reduced motion
      groupRef.current.position.set(to[0], to[1], to[2]);
      progressRef.current = 1;
      if (onComplete && progressRef.current >= 1) {
        onComplete();
      }
      return;
    }

    // Animate packet movement
    const elapsed = Date.now() - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);
    progressRef.current = progress;

    // Linear interpolation
    const x = from[0] + (to[0] - from[0]) * progress;
    const y = from[1] + (to[1] - from[1]) * progress;
    const z = from[2] + (to[2] - from[2]) * progress;

    groupRef.current.position.set(x, y, z);

    // Add slight bounce effect
    const bounceY = Math.sin(progress * Math.PI) * 0.1;
    meshRef.current.position.y = bounceY;

    // Fade out as it approaches destination
    if (progress > 0.8) {
      const fadeProgress = (progress - 0.8) / 0.2;
      if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
        meshRef.current.material.opacity = 1 - fadeProgress;
        meshRef.current.material.transparent = true;
      }
    }

    // Call onComplete when animation finishes
    if (progress >= 1 && onComplete) {
      onComplete();
    }
  });

  return (
    <group ref={groupRef} position={from}>
      <mesh ref={meshRef} castShadow>
        <capsuleGeometry args={[0.08, 0.2, 4, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
        />
      </mesh>
      {label && (
        <Text
          position={[0, 0.3, 0]}
          fontSize={0.08}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {label}
        </Text>
      )}
      {tag && (
        <Text
          position={[0, -0.2, 0]}
          fontSize={0.06}
          color="#fbbf24"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {tag}
        </Text>
      )}
    </group>
  );
}

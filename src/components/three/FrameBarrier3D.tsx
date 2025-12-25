"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Text } from "@react-three/drei";
import * as THREE from "three";

type ClickjackingDefense = "NONE" | "XFO_DENY" | "CSP_FRAME_ANCESTORS";

interface AllowedOrBlocked {
  action: string;
  result: "ALLOW" | "BLOCK";
  reason: string;
}

interface FrameBarrier3DProps {
  defense: ClickjackingDefense;
  allowedOrBlocked: AllowedOrBlocked[];
  tryEmbedTrigger?: number;
  reducedMotion: boolean;
}

/**
 * Frame Barrier visualization for clickjacking defense.
 * Shows frame overlay and barrier (XFO/CSP frame-ancestors) blocking embedding.
 */
export function FrameBarrier3D({
  defense,
  allowedOrBlocked,
  tryEmbedTrigger = 0,
  reducedMotion,
}: FrameBarrier3DProps) {
  const [embedding, setEmbedding] = useState(false);
  const [barrierRaised, setBarrierRaised] = useState(false);
  const frameRef = useRef<THREE.Group>(null);
  const barrierRef = useRef<THREE.Group>(null);

  const handleTryEmbed = () => {
    if (embedding) return;
    setEmbedding(true);

    if (!reducedMotion) {
      // Animate frame sliding in
      setTimeout(() => {
        if (defense !== "NONE") {
          setBarrierRaised(true);
        }
        setTimeout(() => {
          setEmbedding(false);
          setBarrierRaised(false);
        }, 2000);
      }, 500);
    } else {
      // Instant in reduced motion
      if (defense !== "NONE") {
        setBarrierRaised(true);
      }
      setTimeout(() => {
        setEmbedding(false);
        setBarrierRaised(false);
      }, 100);
    }
  };

  // Trigger embed attempt when defense changes or button is clicked
  useEffect(() => {
    if (defense !== "NONE" && !embedding) {
      const timer = setTimeout(() => {
        handleTryEmbed();
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defense, tryEmbedTrigger]);

  useFrame((state, delta) => {
    if (reducedMotion) return;

    // Animate frame sliding in
    if (frameRef.current && embedding) {
      const targetX = defense === "NONE" ? 0 : -1;
      frameRef.current.position.x = THREE.MathUtils.lerp(
        frameRef.current.position.x,
        targetX,
        delta * 2
      );
    }

    // Animate barrier raising
    if (barrierRef.current && barrierRaised) {
      barrierRef.current.position.y = THREE.MathUtils.lerp(
        barrierRef.current.position.y,
        1.5,
        delta * 3
      );
    }
  });

  const isBlocked = defense !== "NONE";

  return (
    <group position={[0, 0, 0]}>
      {/* Main page representation */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 2.5, 0.1]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      <Text
        position={[0, 0, 0.1]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Protected Page
      </Text>

      {/* Frame overlay (malicious frame attempting to embed) */}
      <group
        ref={frameRef}
        position={
          reducedMotion ? (isBlocked ? [-1, 0, 0] : [0, 0, 0]) : [-3, 0, 0]
        }
      >
        <mesh>
          <boxGeometry args={[1.8, 2.3, 0.05]} />
          <meshStandardMaterial
            color="#ef4444"
            opacity={embedding ? 0.7 : 0.3}
            transparent
          />
        </mesh>
        <Text
          position={[0, 0, 0.05]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Untrusted Frame
        </Text>
      </group>

      {/* Barrier (defense) */}
      {defense !== "NONE" && (
        <group
          ref={barrierRef}
          position={[0, reducedMotion ? (barrierRaised ? 1.5 : 0) : 0, 0.2]}
        >
          <mesh>
            <boxGeometry args={[2.5, 0.2, 0.3]} />
            <meshStandardMaterial color="#10b981" />
          </mesh>
          <Text
            position={[0, 0, 0.2]}
            fontSize={0.15}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {defense === "XFO_DENY"
              ? "X-Frame-Options: DENY"
              : "CSP frame-ancestors"}
          </Text>
          {barrierRaised && (
            <Html position={[0, -0.5, 0]} center>
              <div className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                Embedding Blocked
              </div>
            </Html>
          )}
        </group>
      )}

      {/* Result display */}
      {allowedOrBlocked.length > 0 && (
        <Html position={[0, -2, 0]} center>
          <div
            className={`px-3 py-2 rounded border ${
              allowedOrBlocked[0].result === "ALLOW"
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            }`}
          >
            <div className="text-xs font-medium mb-1">
              {allowedOrBlocked[0].action}
            </div>
            <div
              className={`text-xs px-2 py-0.5 rounded inline-block ${
                allowedOrBlocked[0].result === "ALLOW"
                  ? "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200"
                  : "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200"
              }`}
            >
              {allowedOrBlocked[0].result}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {allowedOrBlocked[0].reason}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

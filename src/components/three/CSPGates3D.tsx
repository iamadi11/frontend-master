"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Text } from "@react-three/drei";
import * as THREE from "three";

interface CSPState {
  scriptSrc: "NONE" | "SELF" | "SELF_CDN" | "UNSAFE_INLINE";
  connectSrc: "SELF" | "API_ONLY" | "ANY";
  frameAncestors: "NONE" | "SELF" | "TRUSTED";
}

interface AllowedOrBlocked {
  action: string;
  result: "ALLOW" | "BLOCK";
  reason: string;
}

interface CSPGates3DProps {
  csp: CSPState;
  allowedOrBlocked: AllowedOrBlocked[];
  evaluatePolicyTrigger?: number;
  reducedMotion: boolean;
}

/**
 * CSP Gates visualization - shows allow/block gates for actions.
 * Actions approach gates one-by-one when "Evaluate policy" is triggered.
 */
export function CSPGates3D({
  csp,
  allowedOrBlocked,
  evaluatePolicyTrigger = 0,
  reducedMotion,
}: CSPGates3DProps) {
  const [evaluating, setEvaluating] = useState(false);
  const [currentActionIndex, setCurrentActionIndex] = useState(-1);
  const actionRefs = useRef<THREE.Group[]>([]);

  const handleEvaluate = () => {
    if (evaluating || allowedOrBlocked.length === 0) return;
    setEvaluating(true);
    setCurrentActionIndex(0);

    // Animate through actions
    if (!reducedMotion) {
      allowedOrBlocked.forEach((_, idx) => {
        setTimeout(() => {
          setCurrentActionIndex(idx);
          if (idx === allowedOrBlocked.length - 1) {
            setTimeout(() => {
              setEvaluating(false);
              setCurrentActionIndex(-1);
            }, 1000);
          }
        }, idx * 800);
      });
    } else {
      // Instant in reduced motion
      setCurrentActionIndex(0);
      setTimeout(() => {
        setEvaluating(false);
        setCurrentActionIndex(-1);
      }, 100);
    }
  };

  // Trigger evaluation when policy changes or button is clicked
  useEffect(() => {
    if (allowedOrBlocked.length > 0 && !evaluating) {
      const timer = setTimeout(() => {
        handleEvaluate();
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    csp.scriptSrc,
    csp.connectSrc,
    csp.frameAncestors,
    evaluatePolicyTrigger,
  ]);

  useFrame((state, delta) => {
    if (reducedMotion) return;
    actionRefs.current.forEach((ref, idx) => {
      if (!ref || currentActionIndex !== idx) return;
      // Subtle pulse for current action
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      ref.scale.setScalar(scale);
    });
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Gate structure */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.5, 3, 0.2]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>

      {/* Actions approaching gates */}
      {allowedOrBlocked.slice(0, 4).map((item, idx) => {
        const isActive = currentActionIndex === idx;
        const xPos = reducedMotion ? 0 : isActive ? -1.5 + idx * 0.5 : -3;

        return (
          <group
            key={idx}
            ref={(el) => {
              if (el) actionRefs.current[idx] = el;
            }}
            position={[xPos, 1.5 - idx * 1, 0]}
          >
            {/* Action representation */}
            <mesh>
              <boxGeometry args={[0.4, 0.4, 0.1]} />
              <meshStandardMaterial
                color={
                  item.result === "ALLOW"
                    ? "#10b981"
                    : item.result === "BLOCK"
                      ? "#ef4444"
                      : "#6b7280"
                }
              />
            </mesh>
            <Text
              position={[0, -0.3, 0.1]}
              fontSize={0.15}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              {item.action.split(" ")[0]}
            </Text>

            {/* Gate decision */}
            {isActive && (
              <>
                <mesh position={[0.5, 0, 0]}>
                  <boxGeometry args={[0.3, 0.6, 0.15]} />
                  <meshStandardMaterial
                    color={
                      item.result === "ALLOW"
                        ? "#10b981"
                        : item.result === "BLOCK"
                          ? "#ef4444"
                          : "#6b7280"
                    }
                  />
                </mesh>
                <Text
                  position={[0.5, 0, 0.1]}
                  fontSize={0.2}
                  color="#ffffff"
                  anchorX="center"
                  anchorY="middle"
                >
                  {item.result}
                </Text>
                <Html position={[0.5, -0.5, 0]} center>
                  <div className="px-2 py-1 bg-gray-900 text-white text-xs rounded max-w-xs">
                    {item.reason}
                  </div>
                </Html>
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}

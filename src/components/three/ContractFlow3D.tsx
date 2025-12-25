"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";
import * as THREE from "three";

interface ContractFlow3DProps {
  contractResult: {
    pass: boolean;
    breakingReasons: string[];
  } | null;
  apiChange: string;
  breakingReasons: string[];
  focused: boolean;
  reducedMotion: boolean;
}

const NODE_SPACING = 3;
const NODE_SIZE = 0.8;
const PACKET_SIZE = 0.2;
const BEAM_HEIGHT = 0.3;

/**
 * 3D visualization of contract testing flow.
 * Shows Consumer → Contract → Provider nodes with packet flow animation.
 * Displays mismatch beam when contract fails.
 */
export function ContractFlow3D({
  contractResult,
  apiChange,
  breakingReasons,
  focused,
  reducedMotion,
}: ContractFlow3DProps) {
  const packetRef = useRef<THREE.Mesh>(null);
  const [packetPosition, setPacketPosition] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const mismatchBeamRef = useRef<THREE.Mesh>(null);

  // Trigger packet animation when contract check runs
  useEffect(() => {
    if (contractResult !== null) {
      setIsAnimating(true);
      if (reducedMotion) {
        // Instant position for reduced motion
        setPacketPosition(NODE_SPACING * 2);
        setTimeout(() => setIsAnimating(false), 100);
      } else {
        // Animate packet from Consumer to Provider
        setPacketPosition(0);
        const duration = 1500;
        const startTime = Date.now();
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          setPacketPosition(progress * NODE_SPACING * 2);
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            setIsAnimating(false);
          }
        };
        requestAnimationFrame(animate);
      }
    } else {
      setIsAnimating(false);
      setPacketPosition(0);
    }
  }, [contractResult, reducedMotion]);

  // Animate packet movement
  useFrame(() => {
    if (!packetRef.current || reducedMotion || !isAnimating) return;
    const targetX = packetPosition - NODE_SPACING;
    packetRef.current.position.x = targetX;
  });

  // Instant position for reduced motion
  useEffect(() => {
    if (!packetRef.current || !reducedMotion) return;
    const targetX = packetPosition - NODE_SPACING;
    packetRef.current.position.x = targetX;
  }, [packetPosition, reducedMotion]);

  const opacity = focused ? 1 : 0.3;
  const consumerColor = "#3b82f6"; // blue
  const contractColor = "#f59e0b"; // yellow/amber
  const providerColor = "#10b981"; // green
  const failColor = "#ef4444"; // red

  // Show mismatch beam when contract fails
  const showMismatchBeam = contractResult && !contractResult.pass;

  // Get breaking field name from apiChange
  const breakingField =
    apiChange === "ADD_FIELD"
      ? "email"
      : apiChange === "REMOVE_FIELD"
        ? "name"
        : apiChange === "RENAME_FIELD"
          ? "fullName"
          : apiChange === "TYPE_CHANGE"
            ? "id"
            : null;

  return (
    <group position={[0, 0, 0]}>
      {/* Consumer Node */}
      <group position={[-NODE_SPACING, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[NODE_SIZE, NODE_SIZE, NODE_SIZE]} />
          <meshStandardMaterial
            color={consumerColor}
            opacity={opacity}
            transparent
            emissive={focused ? consumerColor : "#000000"}
            emissiveIntensity={focused ? 0.3 : 0}
          />
        </mesh>
        <Text
          position={[0, -NODE_SIZE / 2 - 0.3, 0]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="top"
        >
          Consumer
        </Text>
        <Text
          position={[0, -NODE_SIZE / 2 - 0.5, 0]}
          fontSize={0.15}
          color="#9ca3af"
          anchorX="center"
          anchorY="top"
        >
          Schema
        </Text>
      </group>

      {/* Contract Node (middle) */}
      <group position={[0, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[NODE_SIZE, NODE_SIZE, NODE_SIZE]} />
          <meshStandardMaterial
            color={contractColor}
            opacity={opacity}
            transparent
            emissive={focused ? contractColor : "#000000"}
            emissiveIntensity={focused ? 0.3 : 0}
          />
        </mesh>
        <Text
          position={[0, -NODE_SIZE / 2 - 0.3, 0]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="top"
        >
          Contract
        </Text>
        <Text
          position={[0, -NODE_SIZE / 2 - 0.5, 0]}
          fontSize={0.15}
          color="#9ca3af"
          anchorX="center"
          anchorY="top"
        >
          Validating...
        </Text>
      </group>

      {/* Provider Node */}
      <group position={[NODE_SPACING, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[NODE_SIZE, NODE_SIZE, NODE_SIZE]} />
          <meshStandardMaterial
            color={providerColor}
            opacity={opacity}
            transparent
            emissive={focused ? providerColor : "#000000"}
            emissiveIntensity={focused ? 0.3 : 0}
          />
        </mesh>
        <Text
          position={[0, -NODE_SIZE / 2 - 0.3, 0]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="top"
        >
          Provider
        </Text>
        <Text
          position={[0, -NODE_SIZE / 2 - 0.5, 0]}
          fontSize={0.15}
          color="#9ca3af"
          anchorX="center"
          anchorY="top"
        >
          Response
        </Text>
      </group>

      {/* Connection lines */}
      <mesh position={[-NODE_SPACING / 2, 0, 0]}>
        <boxGeometry args={[NODE_SPACING, 0.05, 0.05]} />
        <meshStandardMaterial
          color={
            contractResult
              ? contractResult.pass
                ? "#10b981"
                : "#ef4444"
              : "#6b7280"
          }
          opacity={opacity}
          transparent
        />
      </mesh>
      <mesh position={[NODE_SPACING / 2, 0, 0]}>
        <boxGeometry args={[NODE_SPACING, 0.05, 0.05]} />
        <meshStandardMaterial
          color={
            contractResult
              ? contractResult.pass
                ? "#10b981"
                : "#ef4444"
              : "#6b7280"
          }
          opacity={opacity}
          transparent
        />
      </mesh>

      {/* Packet animation */}
      {isAnimating && (
        <mesh ref={packetRef} position={[-NODE_SPACING, 0, 0.2]}>
          <sphereGeometry args={[PACKET_SIZE, 16, 16]} />
          <meshStandardMaterial
            color="#3b82f6"
            emissive="#3b82f6"
            emissiveIntensity={0.8}
            opacity={opacity}
            transparent
          />
        </mesh>
      )}

      {/* Mismatch beam (red beam on breaking field line) */}
      {showMismatchBeam && breakingField && (
        <group>
          <mesh
            ref={mismatchBeamRef}
            position={[0, BEAM_HEIGHT, 0]}
            rotation={[0, 0, Math.PI / 4]}
          >
            <boxGeometry args={[NODE_SPACING * 2.5, 0.1, 0.1]} />
            <meshStandardMaterial
              color={failColor}
              opacity={0.8}
              transparent
              emissive={failColor}
              emissiveIntensity={0.6}
            />
          </mesh>
          <Html position={[0, BEAM_HEIGHT + 0.5, 0]} center>
            <div className="bg-red-50 dark:bg-red-900/90 px-3 py-2 rounded shadow-lg border-2 border-red-500 text-xs max-w-xs">
              <div className="font-semibold text-red-700 dark:text-red-300 mb-1">
                ✗ Contract Mismatch
              </div>
              <div className="text-red-600 dark:text-red-400 font-mono mb-1">
                Field: {breakingField}
              </div>
              {breakingReasons.length > 0 && (
                <div className="text-red-700 dark:text-red-300">
                  {breakingReasons.map((reason, i) => (
                    <div key={i}>• {reason}</div>
                  ))}
                </div>
              )}
            </div>
          </Html>
        </group>
      )}

      {/* Success pulse (green confirmation) */}
      {contractResult && contractResult.pass && !isAnimating && (
        <Html position={[0, NODE_SIZE / 2 + 0.5, 0]} center>
          <div className="bg-green-50 dark:bg-green-900/90 px-3 py-2 rounded shadow-lg border-2 border-green-500 text-xs">
            <div className="font-semibold text-green-700 dark:text-green-300">
              ✓ Contract: PASS
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

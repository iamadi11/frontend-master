"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";
import * as THREE from "three";

interface TrafficShift3DProps {
  mode: "flags_ab" | "canary";
  // Flags & A/B props
  flagEnabled?: boolean;
  abSplit?: number;
  targeting?: "ALL" | "MOBILE_ONLY" | "COUNTRY_IN" | "BETA_USERS";
  // Canary props
  trafficPercent?: number;
  errorRateNew?: number;
  latencyNewMs?: number;
  canaryActive?: boolean;
  sloPass?: boolean;
  onThresholdBreach?: () => void;
  // Common
  events: string[];
  notes: string[];
  focused: boolean;
  reducedMotion: boolean;
}

const BUCKET_WIDTH = 2;
const BUCKET_HEIGHT = 3;
const BUCKET_DEPTH = 1;
const USER_DOT_SIZE = 0.1;
const USER_COUNT = 20;

export function TrafficShift3D({
  mode,
  flagEnabled = false,
  abSplit = 50,
  targeting = "ALL",
  trafficPercent = 10,
  errorRateNew = 0.05,
  latencyNewMs = 200,
  canaryActive = false,
  sloPass = true,
  onThresholdBreach,
  events,
  notes,
  focused,
  reducedMotion,
}: TrafficShift3DProps) {
  const [userPositions, setUserPositions] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      z: number;
      target: "v1" | "v2" | "a" | "b";
    }>
  >([]);
  const [alarmPulse, setAlarmPulse] = useState(false);

  // Initialize user positions
  useEffect(() => {
    const positions: typeof userPositions = [];
    for (let i = 0; i < USER_COUNT; i++) {
      positions.push({
        id: i,
        x: (Math.random() - 0.5) * 4,
        y: Math.random() * 2,
        z: (Math.random() - 0.5) * 2,
        target:
          mode === "flags_ab"
            ? Math.random() < abSplit / 100
              ? "b"
              : "a"
            : Math.random() < trafficPercent / 100
              ? "v2"
              : "v1",
      });
    }
    setUserPositions(positions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only initialize once

  // Update user targets based on mode and props
  useEffect(() => {
    if (mode === "flags_ab") {
      setUserPositions((prev) =>
        prev.map((user) => ({
          ...user,
          target: flagEnabled && Math.random() < abSplit / 100 ? "b" : "a",
        }))
      );
    } else {
      // Canary mode
      setUserPositions((prev) =>
        prev.map((user) => ({
          ...user,
          target:
            canaryActive && Math.random() < trafficPercent / 100 ? "v2" : "v1",
        }))
      );

      // Check for threshold breach
      if (canaryActive && !sloPass) {
        setAlarmPulse(true);
        if (onThresholdBreach) {
          setTimeout(() => onThresholdBreach(), 500);
        }
        setTimeout(() => setAlarmPulse(false), 2000);
      }
    }
  }, [
    mode,
    flagEnabled,
    abSplit,
    trafficPercent,
    canaryActive,
    sloPass,
    onThresholdBreach,
  ]);

  // Animate user dots moving to buckets
  useFrame(() => {
    if (reducedMotion) return;

    setUserPositions((prev) =>
      prev.map((user) => {
        const targetX =
          user.target === "v1" || user.target === "a" ? -2.5 : 2.5;
        const targetY = 0.5;
        const targetZ = 0;

        const dx = targetX - user.x;
        const dy = targetY - user.y;
        const dz = targetZ - user.z;

        return {
          ...user,
          x: user.x + dx * 0.05,
          y: user.y + dy * 0.05,
          z: user.z + dz * 0.05,
        };
      })
    );
  });

  // Instant positioning for reduced motion
  useEffect(() => {
    if (!reducedMotion) return;

    setUserPositions((prev) =>
      prev.map((user) => {
        const targetX =
          user.target === "v1" || user.target === "a" ? -2.5 : 2.5;
        return {
          ...user,
          x: targetX,
          y: 0.5,
          z: 0,
        };
      })
    );
  }, [reducedMotion, mode, flagEnabled, abSplit, trafficPercent, canaryActive]);

  const opacity = focused ? 1 : 0.3;

  // Bucket configurations
  const bucketConfig = useMemo(() => {
    if (mode === "flags_ab") {
      return {
        left: {
          label: "Control (A)",
          color: "#3b82f6",
          count: USER_COUNT - Math.round((abSplit / 100) * USER_COUNT),
        },
        right: {
          label: "Variant (B)",
          color: "#8b5cf6",
          count: Math.round((abSplit / 100) * USER_COUNT),
        },
      };
    } else {
      return {
        left: {
          label: "v1 (stable)",
          color: "#10b981",
          count: USER_COUNT - Math.round((trafficPercent / 100) * USER_COUNT),
        },
        right: {
          label: "v2 (new)",
          color: canaryActive && !sloPass ? "#ef4444" : "#f59e0b",
          count: Math.round((trafficPercent / 100) * USER_COUNT),
        },
      };
    }
  }, [mode, abSplit, trafficPercent, canaryActive, sloPass]);

  return (
    <group position={[0, 0, 0]}>
      {/* Left bucket */}
      <group position={[-2.5, 0, 0]}>
        <mesh>
          <boxGeometry args={[BUCKET_WIDTH, BUCKET_HEIGHT, BUCKET_DEPTH]} />
          <meshStandardMaterial
            color={bucketConfig.left.color}
            opacity={opacity * 0.3}
            transparent
          />
        </mesh>
        <Text
          position={[0, BUCKET_HEIGHT / 2 + 0.3, 0.1]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {bucketConfig.left.label}
        </Text>
        <Text
          position={[0, -BUCKET_HEIGHT / 2 - 0.3, 0.1]}
          fontSize={0.15}
          color="#6b7280"
          anchorX="center"
          anchorY="middle"
        >
          {bucketConfig.left.count} users
        </Text>
      </group>

      {/* Right bucket */}
      <group position={[2.5, 0, 0]}>
        <mesh>
          <boxGeometry args={[BUCKET_WIDTH, BUCKET_HEIGHT, BUCKET_DEPTH]} />
          <meshStandardMaterial
            color={bucketConfig.right.color}
            opacity={opacity * 0.3}
            transparent
          />
        </mesh>
        <Text
          position={[0, BUCKET_HEIGHT / 2 + 0.3, 0.1]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {bucketConfig.right.label}
        </Text>
        <Text
          position={[0, -BUCKET_HEIGHT / 2 - 0.3, 0.1]}
          fontSize={0.15}
          color="#6b7280"
          anchorX="center"
          anchorY="middle"
        >
          {bucketConfig.right.count} users
        </Text>

        {/* Alarm pulse for canary failure */}
        {mode === "canary" && alarmPulse && (
          <mesh position={[0, BUCKET_HEIGHT / 2 + 0.5, 0]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial
              color="#ef4444"
              emissive="#ef4444"
              emissiveIntensity={reducedMotion ? 0 : 1}
              opacity={reducedMotion ? 0.8 : 0.3}
              transparent
            />
          </mesh>
        )}
      </group>

      {/* User dots */}
      {userPositions.map((user) => (
        <mesh key={user.id} position={[user.x, user.y, user.z]}>
          <sphereGeometry args={[USER_DOT_SIZE, 8, 8]} />
          <meshStandardMaterial
            color={
              user.target === "v1" || user.target === "a"
                ? bucketConfig.left.color
                : bucketConfig.right.color
            }
            opacity={opacity}
            transparent
          />
        </mesh>
      ))}

      {/* Metrics panel */}
      {mode === "canary" && canaryActive && (
        <Html position={[0, -2.5, 0]} center>
          <div className="bg-white/90 dark:bg-gray-900/90 px-3 py-2 rounded shadow-lg text-xs">
            <div className="font-semibold mb-1">SLO Check:</div>
            <div className={sloPass ? "text-green-600" : "text-red-600"}>
              {sloPass ? "✓ PASS" : "✗ FAIL"}
            </div>
            <div className="text-gray-600 dark:text-gray-400 mt-1">
              Error: {(errorRateNew * 100).toFixed(1)}% | Latency:{" "}
              {latencyNewMs}ms
            </div>
          </div>
        </Html>
      )}

      {/* Notes tooltip */}
      {notes.length > 0 && (
        <Html position={[0, 2.5, 0]} center>
          <div className="bg-white/90 dark:bg-gray-900/90 px-3 py-2 rounded shadow-lg max-w-xs text-xs">
            <div className="font-semibold mb-1">Rollout Notes:</div>
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

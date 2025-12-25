"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";
import * as THREE from "three";

interface PipelineLanes3DProps {
  running: boolean;
  currentStage: string | null;
  runTests: boolean;
  visualRegression: boolean;
  events: string[];
  notes: string[];
  focused: boolean;
  reducedMotion: boolean;
  onComplete?: () => void;
}

const STAGES = ["BUILD", "UNIT", "INTEGRATION", "E2E", "DEPLOY"];
const STAGE_COLORS = {
  pending: "#6b7280",
  active: "#3b82f6",
  completed: "#10b981",
  failed: "#ef4444",
};

const LANE_SPACING = 1.5;
const STAGE_WIDTH = 2;
const TOKEN_SIZE = 0.3;

export function PipelineLanes3D({
  running,
  currentStage,
  runTests,
  visualRegression,
  events,
  notes,
  focused,
  reducedMotion,
  onComplete,
}: PipelineLanes3DProps) {
  const tokenRef = useRef<THREE.Mesh>(null);
  const [tokenPosition, setTokenPosition] = useState(0);
  const [stageStatuses, setStageStatuses] = useState<
    Record<string, "pending" | "active" | "completed" | "failed">
  >({
    BUILD: "pending",
    UNIT: "pending",
    INTEGRATION: "pending",
    E2E: "pending",
    DEPLOY: "pending",
  });

  // Calculate stage positions
  const stagePositions = useMemo(() => {
    const positions: Record<string, number> = {};
    STAGES.forEach((stage, index) => {
      positions[stage] =
        index * LANE_SPACING - (STAGES.length - 1) * LANE_SPACING * 0.5;
    });
    return positions;
  }, []);

  // Update stage statuses based on currentStage
  useEffect(() => {
    if (!running) {
      setStageStatuses({
        BUILD: "pending",
        UNIT: "pending",
        INTEGRATION: "pending",
        E2E: "pending",
        DEPLOY: "pending",
      });
      setTokenPosition(0);
      return;
    }

    const newStatuses: typeof stageStatuses = {
      BUILD: "pending",
      UNIT: "pending",
      INTEGRATION: "pending",
      E2E: "pending",
      DEPLOY: "pending",
    };

    let foundCurrent = false;
    for (const stage of STAGES) {
      if (stage === currentStage) {
        newStatuses[stage] = "active";
        foundCurrent = true;
        setTokenPosition(stagePositions[stage]);
      } else if (!foundCurrent) {
        newStatuses[stage] = "completed";
      }
    }

    // Check for failures (simplified - based on config)
    if (currentStage === "UNIT" && !runTests) {
      newStatuses.UNIT = "failed";
    }
    if (currentStage === "E2E" && !visualRegression) {
      newStatuses.E2E = "failed";
    }

    setStageStatuses(newStatuses);

    // Check if pipeline completed
    if (currentStage === "DEPLOY" && running) {
      setTimeout(
        () => {
          if (onComplete) onComplete();
        },
        reducedMotion ? 100 : 1000
      );
    }
  }, [
    running,
    currentStage,
    runTests,
    visualRegression,
    stagePositions,
    reducedMotion,
    onComplete,
  ]);

  // Animate token movement
  useFrame(() => {
    if (!tokenRef.current || !running || reducedMotion) return;

    const targetX = tokenPosition;
    const currentX = tokenRef.current.position.x;
    const diff = targetX - currentX;

    if (Math.abs(diff) > 0.01) {
      tokenRef.current.position.x += diff * 0.1;
    } else {
      tokenRef.current.position.x = targetX;
    }
  });

  // Instant position update for reduced motion
  useEffect(() => {
    if (!tokenRef.current) return;
    if (reducedMotion || !running) {
      tokenRef.current.position.x = tokenPosition;
    }
  }, [tokenPosition, reducedMotion, running]);

  const opacity = focused ? 1 : 0.3;

  return (
    <group position={[0, 0, 0]}>
      {/* Stage lanes */}
      {STAGES.map((stage, index) => {
        const status = stageStatuses[stage];
        const x = stagePositions[stage];
        const color = STAGE_COLORS[status];

        return (
          <group key={stage} position={[x, 0, 0]}>
            {/* Stage box */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[STAGE_WIDTH, 0.8, 0.2]} />
              <meshStandardMaterial
                color={color}
                opacity={opacity}
                transparent
                emissive={status === "active" ? color : "#000000"}
                emissiveIntensity={status === "active" ? 0.3 : 0}
              />
            </mesh>

            {/* Stage label */}
            <Text
              position={[0, -0.6, 0.1]}
              fontSize={0.2}
              color={status === "active" ? "#ffffff" : "#6b7280"}
              anchorX="center"
              anchorY="middle"
            >
              {stage}
            </Text>

            {/* Gate indicator */}
            {(stage === "UNIT" || stage === "E2E") && (
              <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[0.3, 0.3, 0.1]} />
                <meshStandardMaterial
                  color={status === "failed" ? "#ef4444" : "#10b981"}
                  opacity={opacity}
                  transparent
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Connecting lines */}
      {STAGES.slice(0, -1).map((stage, index) => {
        const x1 = stagePositions[stage];
        const x2 = stagePositions[STAGES[index + 1]];
        const midX = (x1 + x2) / 2;
        const isCompleted =
          stageStatuses[STAGES[index + 1]] === "completed" ||
          stageStatuses[STAGES[index + 1]] === "active";

        return (
          <mesh key={`line-${index}`} position={[midX, 0, 0]}>
            <boxGeometry args={[LANE_SPACING - STAGE_WIDTH, 0.05, 0.05]} />
            <meshStandardMaterial
              color={isCompleted ? "#10b981" : "#6b7280"}
              opacity={opacity}
              transparent
            />
          </mesh>
        );
      })}

      {/* Job token */}
      {running && (
        <mesh ref={tokenRef} position={[tokenPosition, 0, 0.2]}>
          <sphereGeometry args={[TOKEN_SIZE, 16, 16]} />
          <meshStandardMaterial
            color="#3b82f6"
            emissive="#3b82f6"
            emissiveIntensity={0.5}
            opacity={opacity}
            transparent
          />
        </mesh>
      )}

      {/* Notes tooltip */}
      {notes.length > 0 && (
        <Html position={[0, 2, 0]} center>
          <div className="bg-white/90 dark:bg-gray-900/90 px-3 py-2 rounded shadow-lg max-w-xs text-xs">
            <div className="font-semibold mb-1">Pipeline Notes:</div>
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

"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Text } from "@react-three/drei";
import * as THREE from "three";

type Mode = "DEPENDENCIES" | "PII";
type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
type PIIMode = "RAW" | "REDACTED" | "MINIMIZED";

interface Dependency {
  name: string;
  version: string;
  risk: RiskLevel;
}

interface RiskShelf3DProps {
  mode: Mode;
  deps?: Dependency[];
  piiMode?: PIIMode;
  riskSummary?: { severity: RiskLevel; notes: string[] };
  reducedMotion: boolean;
}

/**
 * Risk Shelf visualization for Dependencies and PII Vault.
 * Dependencies: shelf of packages with risk meters (simulated).
 * PII: vault showing raw→redacted→minimized (toy data labels).
 */
export function RiskShelf3D({
  mode,
  deps = [],
  piiMode,
  riskSummary,
  reducedMotion,
}: RiskShelf3DProps) {
  const [riskMeter, setRiskMeter] = useState(0);
  const [piiTransition, setPiiTransition] = useState(false);
  const meterRef = useRef<THREE.Mesh>(null);

  // Calculate risk meter based on dependencies
  useEffect(() => {
    if (mode === "DEPENDENCIES") {
      const highRisk = deps.filter((d) => d.risk === "HIGH").length;
      const medRisk = deps.filter((d) => d.risk === "MEDIUM").length;
      const total = deps.length || 1;
      const riskValue = (highRisk * 1.0 + medRisk * 0.5) / total;

      if (reducedMotion) {
        setRiskMeter(riskValue);
      } else {
        // Animate meter fill
        const target = riskValue;
        const duration = 1000;
        const startTime = Date.now();
        const startValue = riskMeter;

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const current = startValue + (target - startValue) * progress;
          setRiskMeter(current);

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        animate();
      }
    }
  }, [deps, mode, reducedMotion]);

  // Trigger PII transition animation
  useEffect(() => {
    if (mode === "PII" && piiMode) {
      setPiiTransition(true);
      const timer = setTimeout(
        () => setPiiTransition(false),
        reducedMotion ? 100 : 500
      );
      return () => clearTimeout(timer);
    }
  }, [piiMode, mode, reducedMotion]);

  useFrame((state, delta) => {
    if (reducedMotion || !meterRef.current) return;

    // Subtle pulse for risk meter
    if (mode === "DEPENDENCIES") {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      meterRef.current.scale.y = riskMeter * pulse;
    }
  });

  if (mode === "DEPENDENCIES") {
    return (
      <group position={[0, 0, 0]}>
        {/* Shelf */}
        <mesh position={[0, -1, 0]}>
          <boxGeometry args={[4, 0.1, 1]} />
          <meshStandardMaterial color="#6b7280" />
        </mesh>

        {/* Risk meter */}
        <group position={[-1.5, 0, 0]}>
          <mesh position={[0, -0.5, 0]}>
            <boxGeometry args={[0.3, 1, 0.1]} />
            <meshStandardMaterial color="#374151" />
          </mesh>
          <mesh ref={meterRef} position={[0, -0.5 + riskMeter * 0.5, 0.05]}>
            <boxGeometry args={[0.25, riskMeter || 0.01, 0.1]} />
            <meshStandardMaterial
              color={
                riskMeter > 0.7
                  ? "#ef4444"
                  : riskMeter > 0.3
                    ? "#f59e0b"
                    : "#10b981"
              }
            />
          </mesh>
          <Text
            position={[0, 0.8, 0]}
            fontSize={0.15}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            Risk Meter
          </Text>
        </group>

        {/* Dependency packages (max 6 visible) */}
        {deps.slice(0, 6).map((dep, idx) => {
          const xPos = -1 + (idx % 3) * 1;
          const zPos = Math.floor(idx / 3) * 0.5;

          return (
            <group key={idx} position={[xPos, -0.5, zPos]}>
              <mesh>
                <boxGeometry args={[0.6, 0.3, 0.2]} />
                <meshStandardMaterial
                  color={
                    dep.risk === "HIGH"
                      ? "#ef4444"
                      : dep.risk === "MEDIUM"
                        ? "#f59e0b"
                        : "#10b981"
                  }
                />
              </mesh>
              <Text
                position={[0, -0.3, 0.15]}
                fontSize={0.1}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
              >
                {dep.name.substring(0, 8)}
              </Text>
              <Html position={[0, 0.3, 0]} center>
                <div
                  className={`px-1 py-0.5 text-xs rounded ${
                    dep.risk === "HIGH"
                      ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                      : dep.risk === "MEDIUM"
                        ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                        : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                  }`}
                >
                  {dep.risk}
                </div>
              </Html>
            </group>
          );
        })}

        {/* Risk summary */}
        {riskSummary && (
          <Html position={[0, 1.5, 0]} center>
            <div
              className={`px-3 py-2 rounded border ${
                riskSummary.severity === "HIGH"
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  : riskSummary.severity === "MEDIUM"
                    ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                    : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              }`}
            >
              <div className="text-xs font-medium mb-1">
                Overall Risk: {riskSummary.severity}
              </div>
              {riskSummary.notes.slice(0, 2).map((note, idx) => (
                <div
                  key={idx}
                  className="text-xs text-gray-700 dark:text-gray-300"
                >
                  • {note}
                </div>
              ))}
            </div>
          </Html>
        )}
      </group>
    );
  }

  // PII Vault mode
  const piiFields = [
    { key: "userId", label: "User ID", value: "12345" },
    { key: "email", label: "Email", value: "user@example.com" },
    { key: "phone", label: "Phone", value: "+1234567890" },
    { key: "action", label: "Action", value: "checkout" },
  ];

  return (
    <group position={[0, 0, 0]}>
      {/* Vault container */}
      <mesh>
        <boxGeometry args={[3, 2.5, 0.5]} />
        <meshStandardMaterial color="#1f2937" opacity={0.8} transparent />
      </mesh>
      <Text
        position={[0, 1.3, 0.3]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        PII Vault
      </Text>

      {/* PII fields */}
      {piiFields.map((field, idx) => {
        const yPos = 0.8 - idx * 0.5;
        let displayValue = field.value;

        if (piiMode === "REDACTED") {
          if (field.key === "email") {
            displayValue = "u***@e***.com";
          } else if (field.key === "phone") {
            displayValue = "+1***7890";
          }
        } else if (piiMode === "MINIMIZED") {
          if (field.key === "email" || field.key === "phone") {
            return null; // Field removed
          }
        }

        return (
          <group key={field.key} position={[-1, yPos, 0.3]}>
            <mesh>
              <boxGeometry args={[2, 0.3, 0.05]} />
              <meshStandardMaterial
                color={
                  piiMode === "RAW"
                    ? "#ef4444"
                    : piiMode === "REDACTED"
                      ? "#f59e0b"
                      : "#10b981"
                }
                opacity={piiTransition && !reducedMotion ? 0.5 : 1}
                transparent
              />
            </mesh>
            <Text
              position={[-0.9, 0, 0.06]}
              fontSize={0.12}
              color="#ffffff"
              anchorX="left"
              anchorY="middle"
            >
              {field.label}:
            </Text>
            <Text
              position={[0.9, 0, 0.06]}
              fontSize={0.12}
              color="#ffffff"
              anchorX="right"
              anchorY="middle"
            >
              {displayValue}
            </Text>
          </group>
        );
      })}

      {/* Mode indicator */}
      <Html position={[0, -1.5, 0]} center>
        <div
          className={`px-2 py-1 text-xs rounded ${
            piiMode === "RAW"
              ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
              : piiMode === "REDACTED"
                ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
          }`}
        >
          Mode: {piiMode}
        </div>
      </Html>

      {/* Risk summary */}
      {riskSummary && (
        <Html position={[0, 1.8, 0]} center>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {riskSummary.notes[0] || "PII handling configured"}
          </div>
        </Html>
      )}
    </group>
  );
}

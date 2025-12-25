"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Text } from "@react-three/drei";
import * as THREE from "three";

type TokenStorage = "HTTP_ONLY_COOKIE" | "LOCAL_STORAGE" | "MEMORY";

interface TokenStorageSurface3DProps {
  tokenStorage: TokenStorage;
  reducedMotion: boolean;
}

/**
 * Token Storage Surface visualization.
 * Shows three lockers (HttpOnly cookie / localStorage / memory) with "JS readable" probe.
 * Defensive visualization only - no exploit code.
 */
export function TokenStorageSurface3D({
  tokenStorage,
  reducedMotion,
}: TokenStorageSurface3DProps) {
  const [probeActive, setProbeActive] = useState(false);
  const [probeResult, setProbeResult] = useState<"readable" | "blocked" | null>(
    null
  );
  const probeRef = useRef<THREE.Group>(null);
  const selectedLockerRef = useRef<THREE.Group>(null);

  useEffect(() => {
    // Trigger probe animation when storage changes
    setProbeActive(true);
    setProbeResult(null);

    const timer = setTimeout(
      () => {
        if (tokenStorage === "LOCAL_STORAGE") {
          setProbeResult("readable");
        } else if (tokenStorage === "HTTP_ONLY_COOKIE") {
          setProbeResult("blocked");
        } else {
          setProbeResult("blocked"); // Memory: depends on page lifetime
        }
        setProbeActive(false);
      },
      reducedMotion ? 100 : 1500
    );

    return () => clearTimeout(timer);
  }, [tokenStorage, reducedMotion]);

  useFrame((state, delta) => {
    if (reducedMotion || !probeRef.current) return;

    if (probeActive) {
      // Animate probe moving toward locker
      const progress = Math.sin(state.clock.elapsedTime * 2) * 0.3;
      probeRef.current.position.x = 0.5 + progress;
    }
  });

  const lockerPositions: Record<TokenStorage, [number, number, number]> = {
    HTTP_ONLY_COOKIE: [-1.5, 0, 0],
    LOCAL_STORAGE: [0, 0, 0],
    MEMORY: [1.5, 0, 0],
  };

  const lockerLabels: Record<TokenStorage, string> = {
    HTTP_ONLY_COOKIE: "HttpOnly Cookie",
    LOCAL_STORAGE: "localStorage",
    MEMORY: "Memory",
  };

  return (
    <group position={[0, 0, 0]}>
      {/* Three lockers */}
      {(["HTTP_ONLY_COOKIE", "LOCAL_STORAGE", "MEMORY"] as TokenStorage[]).map(
        (storage) => {
          const isSelected = storage === tokenStorage;
          const pos = lockerPositions[storage];

          return (
            <group
              key={storage}
              position={pos}
              ref={isSelected ? selectedLockerRef : undefined}
            >
              {/* Locker box */}
              <mesh>
                <boxGeometry args={[1, 1.2, 0.3]} />
                <meshStandardMaterial
                  color={isSelected ? "#3b82f6" : "#6b7280"}
                  opacity={isSelected ? 1 : 0.5}
                  transparent
                />
              </mesh>
              <Text
                position={[0, -0.8, 0.2]}
                fontSize={0.15}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
              >
                {lockerLabels[storage]}
              </Text>

              {/* JS readable indicator */}
              {isSelected && probeResult && (
                <Html position={[0, 0.8, 0]} center>
                  <div
                    className={`px-2 py-1 text-xs rounded ${
                      probeResult === "readable"
                        ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                        : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                    }`}
                  >
                    {probeResult === "readable"
                      ? "Readable by JS"
                      : "Not readable by JS"}
                  </div>
                </Html>
              )}

              {/* Memory-specific note */}
              {isSelected && storage === "MEMORY" && (
                <Html position={[0, -1.2, 0]} center>
                  <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                    Lost on refresh
                  </div>
                </Html>
              )}

              {/* CSRF consideration badge for cookies */}
              {isSelected && storage === "HTTP_ONLY_COOKIE" && (
                <Html position={[0, -1.2, 0]} center>
                  <div className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded">
                    Requires SameSite/CSRF token
                  </div>
                </Html>
              )}
            </group>
          );
        }
      )}

      {/* JS probe (conceptual) */}
      {probeActive && !reducedMotion && (
        <group ref={probeRef} position={[0.5, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial color="#fbbf24" />
          </mesh>
          <Text
            position={[0, -0.3, 0]}
            fontSize={0.12}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            JS Probe
          </Text>
        </group>
      )}

      {/* Static probe result in reduced motion */}
      {!probeActive && probeResult && reducedMotion && (
        <Html position={lockerPositions[tokenStorage]} center>
          <div
            className={`px-2 py-1 text-xs rounded ${
              probeResult === "readable"
                ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
            }`}
          >
            {probeResult === "readable"
              ? "Readable by JS"
              : "Not readable by JS"}
          </div>
        </Html>
      )}
    </group>
  );
}

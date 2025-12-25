"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion3D } from "./useReducedMotion3D";
import type { TokenSet } from "../demo/demoSchema";

interface TokenPropagation3DProps {
  tokenSets: TokenSet[];
  components: string[];
  currentTokenSet: TokenSet | null | undefined;
  previousTokenSet: TokenSet | null | undefined;
  showTokenDiff?: boolean;
  focusTarget?: string | null;
}

interface ComponentTile {
  id: string;
  position: [number, number, number];
  color: string;
  radius: number;
  spacing: number;
}

interface TokenPulse {
  id: string;
  from: [number, number, number];
  to: [number, number, number];
  startTime: number;
  duration: number;
}

/**
 * 3D visualization of token propagation through component garden.
 * Shows token chips and component tiles that morph when tokens change.
 */
export function TokenPropagation3D({
  tokenSets,
  components,
  currentTokenSet,
  previousTokenSet,
  showTokenDiff = false,
  focusTarget,
}: TokenPropagation3DProps) {
  const reducedMotion = useReducedMotion3D();
  const [pulses, setPulses] = useState<TokenPulse[]>([]);
  const [morphingTiles, setMorphingTiles] = useState<Set<string>>(new Set());
  const [showGhost, setShowGhost] = useState(false);
  const pulseIdCounter = useRef(0);

  // Calculate component tile positions in a grid
  const componentTiles = useMemo<ComponentTile[]>(() => {
    const cols = Math.ceil(Math.sqrt(components.length));
    const spacing = 1.5;
    return components.map((comp, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const x = (col - (cols - 1) / 2) * spacing;
      const z = (row - (components.length / cols - 1) / 2) * spacing * 0.8;
      return {
        id: comp,
        position: [x, 0, z] as [number, number, number],
        color: currentTokenSet?.tokens.color.accent || "#3b82f6",
        radius: parseFloat(currentTokenSet?.tokens.radius.md || "0.5"),
        spacing: parseFloat(currentTokenSet?.tokens.space["2"] || "0.5"),
      };
    });
  }, [components, currentTokenSet]);

  // Find changed tokens when token set changes
  useEffect(() => {
    if (!currentTokenSet || !previousTokenSet) return;

    const changedTokens: string[] = [];
    const checkTokens = (
      oldObj: Record<string, unknown>,
      newObj: Record<string, unknown>,
      path: string = ""
    ) => {
      Object.keys(oldObj).forEach((key) => {
        const newPath = path ? `${path}.${key}` : key;
        if (
          typeof oldObj[key] === "object" &&
          oldObj[key] !== null &&
          typeof newObj[key] === "object" &&
          newObj[key] !== null
        ) {
          checkTokens(
            oldObj[key] as Record<string, unknown>,
            newObj[key] as Record<string, unknown>,
            newPath
          );
        } else if (oldObj[key] !== newObj[key]) {
          changedTokens.push(newPath);
        }
      });
    };
    checkTokens(previousTokenSet.tokens, currentTokenSet.tokens);

    if (changedTokens.length === 0) return;

    // Show ghost overlay for 2 seconds
    setShowGhost(true);
    setTimeout(() => setShowGhost(false), 2000);

    // Create token pulses for each changed token
    if (!reducedMotion) {
      const tokenChipPos: [number, number, number] = [-3, 1.5, 0];
      const newPulses: TokenPulse[] = componentTiles.map((tile) => ({
        id: `pulse-${pulseIdCounter.current++}`,
        from: tokenChipPos,
        to: tile.position,
        startTime: Date.now() + Math.random() * 300, // Stagger slightly
        duration: 800,
      }));
      setPulses(newPulses);
      setMorphingTiles(new Set(componentTiles.map((t) => t.id)));
    } else {
      // In reduced motion, just highlight tiles instantly
      setMorphingTiles(new Set(componentTiles.map((t) => t.id)));
      setTimeout(() => setMorphingTiles(new Set()), 1000);
    }
  }, [currentTokenSet, previousTokenSet, componentTiles, reducedMotion]);

  // Update tile properties when token set changes
  useEffect(() => {
    if (currentTokenSet) {
      componentTiles.forEach((tile) => {
        // Tiles will be updated via useFrame based on currentTokenSet
      });
    }
  }, [currentTokenSet, componentTiles]);

  // Animate pulses
  useFrame(() => {
    if (reducedMotion) return;

    setPulses((prev) =>
      prev.filter((pulse) => {
        const elapsed = Date.now() - pulse.startTime;
        return elapsed < pulse.duration;
      })
    );
  });

  if (!currentTokenSet) return null;

  const tokens = currentTokenSet.tokens;
  const isFocused =
    focusTarget === "tokens.preview" || focusTarget === "tokens.diff";

  return (
    <group>
      {/* Token chips (source) */}
      <group position={[-3, 1.5, 0]}>
        <mesh>
          <boxGeometry args={[0.3, 0.3, 0.1]} />
          <meshStandardMaterial
            color={tokens.color.accent}
            emissive={tokens.color.accent}
            emissiveIntensity={0.5}
          />
        </mesh>
        <Html position={[0, -0.3, 0]} center>
          <div className="text-xs font-semibold text-center whitespace-nowrap">
            Tokens
          </div>
        </Html>
      </group>

      {/* Component tiles (garden) */}
      {componentTiles.map((tile) => {
        const isMorphing = morphingTiles.has(tile.id);
        const tileColor = isMorphing ? tokens.color.accent : tokens.color.bg;
        const tileRadius = parseFloat(tokens.radius.md || "0.5");

        return (
          <ComponentTile3D
            key={tile.id}
            id={tile.id}
            position={tile.position}
            color={tileColor}
            radius={tileRadius}
            spacing={parseFloat(tokens.space["2"] || "0.5")}
            isMorphing={isMorphing}
            reducedMotion={reducedMotion}
            dimmed={isFocused && focusTarget !== "tokens.preview"}
          />
        );
      })}

      {/* Token pulses (animated) */}
      {!reducedMotion &&
        pulses.map((pulse) => (
          <TokenPulse3D
            key={pulse.id}
            from={pulse.from}
            to={pulse.to}
            startTime={pulse.startTime}
            duration={pulse.duration}
          />
        ))}

      {/* Ghost overlay (previous theme) */}
      {showGhost && previousTokenSet && !reducedMotion && (
        <group>
          {componentTiles.map((tile) => (
            <mesh
              key={`ghost-${tile.id}`}
              position={[
                tile.position[0],
                tile.position[1] + 0.1,
                tile.position[2],
              ]}
            >
              <boxGeometry args={[0.8, 0.8, 0.1]} />
              <meshStandardMaterial
                color={previousTokenSet.tokens.color.bg}
                transparent
                opacity={0.3}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

interface ComponentTile3DProps {
  id: string;
  position: [number, number, number];
  color: string;
  radius: number;
  spacing: number;
  isMorphing: boolean;
  reducedMotion: boolean;
  dimmed?: boolean;
}

function ComponentTile3D({
  id,
  position,
  color,
  radius,
  spacing,
  isMorphing,
  reducedMotion,
  dimmed = false,
}: ComponentTile3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const morphStartTime = useRef<number | null>(null);

  useEffect(() => {
    if (isMorphing) {
      morphStartTime.current = Date.now();
    }
  }, [isMorphing]);

  useFrame(() => {
    if (!meshRef.current) return;

    if (isMorphing && !reducedMotion && morphStartTime.current) {
      const elapsed = Date.now() - morphStartTime.current;
      const duration = 600;
      const progress = Math.min(elapsed / duration, 1);

      // Scale pop effect
      const scale = 1 + Math.sin(progress * Math.PI) * 0.2;
      meshRef.current.scale.setScalar(scale);

      // Update material
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.3 + (1 - progress) * 0.4;
    } else if (!isMorphing) {
      meshRef.current.scale.setScalar(1);
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.1;
    }
  });

  return (
    <group position={position}>
      <RoundedBox
        ref={meshRef}
        args={[0.8, 0.8, 0.2]}
        radius={Math.min(radius, 0.1)}
        smoothness={4}
        castShadow
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.1}
          opacity={dimmed ? 0.3 : 1}
          transparent={dimmed}
        />
      </RoundedBox>
      <Html position={[0, -0.5, 0]} center>
        <div
          className="text-xs font-medium text-center whitespace-nowrap"
          style={{ opacity: dimmed ? 0.3 : 1 }}
        >
          {id}
        </div>
      </Html>
    </group>
  );
}

interface TokenPulse3DProps {
  from: [number, number, number];
  to: [number, number, number];
  startTime: number;
  duration: number;
}

function TokenPulse3D({ from, to, startTime, duration }: TokenPulse3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;

    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    if (progress >= 1) return;

    // Linear interpolation
    const x = from[0] + (to[0] - from[0]) * progress;
    const y = from[1] + (to[1] - from[1]) * progress;
    const z = from[2] + (to[2] - from[2]) * progress;

    groupRef.current.position.set(x, y, z);
  });

  return (
    <group ref={groupRef} position={from}>
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#fbbf24"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

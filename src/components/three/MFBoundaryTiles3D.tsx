"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Text } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion3D } from "./useReducedMotion3D";

interface MFE {
  name: string;
  routes: string[];
  ownedComponents: string[];
  apiContracts: string[];
}

interface MFBoundaryTiles3DProps {
  mfes: MFE[];
  integrationType: "ROUTE_BASED" | "COMPONENT_BASED";
  sharedUI: boolean;
  selectedRoute?: string;
  selectedComponent?: string;
  focusTarget?: string | null;
}

interface BoundaryTile {
  id: string;
  type: "route" | "component";
  position: [number, number, number];
  owner: string;
  color: string;
}

interface OwnershipBeam {
  id: string;
  from: [number, number, number];
  to: [number, number, number];
  startTime: number;
  duration: number;
}

/**
 * 3D visualization of micro-frontend boundaries.
 * Shows tiles grouped into colored zones with seams, ownership beams.
 */
export function MFBoundaryTiles3D({
  mfes,
  integrationType,
  sharedUI,
  selectedRoute,
  selectedComponent,
  focusTarget,
}: MFBoundaryTiles3DProps) {
  const reducedMotion = useReducedMotion3D();
  const [beams, setBeams] = useState<OwnershipBeam[]>([]);
  const beamIdCounter = useRef(0);

  // MFE colors
  const mfeColors = useMemo(() => {
    const colors = [
      "#3b82f6", // blue
      "#10b981", // green
      "#f59e0b", // amber
      "#8b5cf6", // purple
      "#ef4444", // red
    ];
    return mfes.reduce(
      (acc, mfe, idx) => {
        acc[mfe.name] = colors[idx % colors.length];
        return acc;
      },
      {} as Record<string, string>
    );
  }, [mfes]);

  // Create boundary tiles
  const boundaryTiles = useMemo<BoundaryTile[]>(() => {
    const tiles: BoundaryTile[] = [];
    let tileIdx = 0;

    mfes.forEach((mfe) => {
      const color = mfeColors[mfe.name];

      // Routes (larger blocks for ROUTE_BASED, smaller for COMPONENT_BASED)
      mfe.routes.forEach((route, routeIdx) => {
        const row = Math.floor(tileIdx / 4);
        const col = tileIdx % 4;
        const size = integrationType === "ROUTE_BASED" ? 1.2 : 0.8;
        tiles.push({
          id: route,
          type: "route",
          position: [
            (col - 1.5) * size * 1.2,
            0,
            (row - mfes.length / 2) * size * 1.2,
          ] as [number, number, number],
          owner: mfe.name,
          color,
        });
        tileIdx++;
      });

      // Components (smaller tiles, more seams for COMPONENT_BASED)
      mfe.ownedComponents.forEach((comp, compIdx) => {
        const row = Math.floor(tileIdx / 4);
        const col = tileIdx % 4;
        const size = integrationType === "COMPONENT_BASED" ? 0.6 : 0.8;
        tiles.push({
          id: comp,
          type: "component",
          position: [
            (col - 1.5) * size * 1.2,
            -0.5,
            (row - mfes.length / 2) * size * 1.2,
          ] as [number, number, number],
          owner: mfe.name,
          color,
        });
        tileIdx++;
      });
    });

    return tiles;
  }, [mfes, mfeColors, integrationType]);

  // Animate ownership beam when selection changes
  useEffect(() => {
    if (!selectedRoute && !selectedComponent) {
      setBeams([]);
      return;
    }

    const selectedTile = boundaryTiles.find(
      (t) => t.id === (selectedRoute || selectedComponent)
    );
    if (!selectedTile) return;

    const ownerMfe = mfes.find((mfe) => mfe.name === selectedTile.owner);
    if (!ownerMfe) return;

    // MFE label position (top of zone)
    const ownerLabelPos: [number, number, number] = [
      selectedTile.position[0],
      2,
      selectedTile.position[2],
    ];

    if (!reducedMotion) {
      const beam: OwnershipBeam = {
        id: `beam-${beamIdCounter.current++}`,
        from: selectedTile.position,
        to: ownerLabelPos,
        startTime: Date.now(),
        duration: 800,
      };
      setBeams([beam]);
    }
  }, [selectedRoute, selectedComponent, boundaryTiles, mfes, reducedMotion]);

  // Animate beams
  useFrame(() => {
    if (reducedMotion) return;

    setBeams((prev) =>
      prev.filter((beam) => {
        const elapsed = Date.now() - beam.startTime;
        return elapsed < beam.duration;
      })
    );
  });

  const isFocused =
    focusTarget === "mfe.map" || focusTarget === "mfe.contracts";

  return (
    <group>
      {/* MFE zones with labels */}
      {mfes.map((mfe, mfeIdx) => {
        const color = mfeColors[mfe.name];
        const zoneTiles = boundaryTiles.filter((t) => t.owner === mfe.name);
        if (zoneTiles.length === 0) return null;

        const avgX =
          zoneTiles.reduce((sum, t) => sum + t.position[0], 0) /
          zoneTiles.length;
        const avgZ =
          zoneTiles.reduce((sum, t) => sum + t.position[2], 0) /
          zoneTiles.length;

        return (
          <group key={mfe.name}>
            {/* MFE label */}
            <Html position={[avgX, 2, avgZ]} center>
              <div
                className="px-3 py-1 rounded text-xs font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {mfe.name}
              </div>
            </Html>

            {/* Zone boundary (visual seam) */}
            {integrationType === "COMPONENT_BASED" && (
              <mesh position={[avgX, 0, avgZ]}>
                <boxGeometry args={[0.05, 0.1, 5]} />
                <meshStandardMaterial
                  color={color}
                  emissive={color}
                  emissiveIntensity={0.3}
                  opacity={0.5}
                  transparent
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Boundary tiles */}
      {boundaryTiles.map((tile) => {
        const isSelected =
          tile.id === selectedRoute || tile.id === selectedComponent;
        const ownerMfe = mfes.find((mfe) => mfe.name === tile.owner);
        const styleVariance = sharedUI ? 0 : 0.1; // Slight drift when sharedUI is off

        return (
          <BoundaryTile3D
            key={tile.id}
            tile={tile}
            isSelected={isSelected}
            styleVariance={styleVariance}
            sharedUI={sharedUI}
            dimmed={isFocused && focusTarget !== "mfe.map"}
          />
        );
      })}

      {/* Ownership beams */}
      {!reducedMotion &&
        beams.map((beam) => (
          <OwnershipBeam3D
            key={beam.id}
            from={beam.from}
            to={beam.to}
            startTime={beam.startTime}
            duration={beam.duration}
          />
        ))}
    </group>
  );
}

interface BoundaryTile3DProps {
  tile: BoundaryTile;
  isSelected: boolean;
  styleVariance: number;
  sharedUI: boolean;
  dimmed?: boolean;
}

function BoundaryTile3D({
  tile,
  isSelected,
  styleVariance,
  sharedUI,
  dimmed = false,
}: BoundaryTile3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const size = tile.type === "route" ? 1.0 : 0.6;

  useEffect(() => {
    if (!meshRef.current) return;

    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    if (isSelected) {
      material.emissiveIntensity = 0.6;
    } else {
      material.emissiveIntensity = 0.2;
    }
  }, [isSelected]);

  // Apply style variance when sharedUI is off
  const color = sharedUI
    ? tile.color
    : `#${(parseInt(tile.color.slice(1, 3), 16) + styleVariance * 20).toString(
        16
      )}${(parseInt(tile.color.slice(3, 5), 16) + styleVariance * 20).toString(
        16
      )}${(parseInt(tile.color.slice(5, 7), 16) + styleVariance * 20).toString(
        16
      )}`;

  return (
    <group position={tile.position}>
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[size, 0.3, size]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.6 : 0.2}
          opacity={dimmed ? 0.3 : 1}
          transparent={dimmed}
        />
      </mesh>
      <Html position={[0, -0.3, 0]} center>
        <div
          className="text-xs font-medium text-center whitespace-nowrap"
          style={{ opacity: dimmed ? 0.3 : 1 }}
        >
          {tile.id}
        </div>
      </Html>
    </group>
  );
}

interface OwnershipBeam3DProps {
  from: [number, number, number];
  to: [number, number, number];
  startTime: number;
  duration: number;
}

function OwnershipBeam3D({
  from,
  to,
  startTime,
  duration,
}: OwnershipBeam3DProps) {
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
        <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#fbbf24"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

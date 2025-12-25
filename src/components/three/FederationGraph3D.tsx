"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Text } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion3D } from "./useReducedMotion3D";

interface Remote {
  name: string;
  exposes: string[];
  deps: string[];
}

interface SharedDep {
  pkg: string;
  singleton: boolean;
  strictVersion: boolean;
}

interface FederationGraph3DProps {
  remotes: Remote[];
  sharedDeps: SharedDep[];
  duplicationKb: number;
  loadOrderEvents: string[];
  network: "FAST" | "SLOW";
  preloadRemotes: boolean;
  sharedDepsSingleton: boolean;
  sharedDepsStrictVersion: boolean;
  onPlayLoad?: () => void;
  focusTarget?: string | null;
}

interface GraphNode {
  id: string;
  type: "host" | "remote" | "shared";
  position: [number, number, number];
  color: string;
  size: number;
}

interface LoadPacket {
  id: string;
  from: [number, number, number];
  to: [number, number, number];
  startTime: number;
  duration: number;
  label?: string;
}

/**
 * 3D visualization of Module Federation dependency graph.
 * Shows host, remotes, shared deps as nodes with load order animation.
 */
export function FederationGraph3D({
  remotes,
  sharedDeps,
  duplicationKb,
  loadOrderEvents,
  network,
  preloadRemotes,
  sharedDepsSingleton,
  sharedDepsStrictVersion,
  onPlayLoad,
  focusTarget,
}: FederationGraph3DProps) {
  const reducedMotion = useReducedMotion3D();
  const [loadPackets, setLoadPackets] = useState<LoadPacket[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duplicationMeter, setDuplicationMeter] = useState(0);
  const packetIdCounter = useRef(0);

  // Calculate graph layout
  const graphNodes = useMemo<GraphNode[]>(() => {
    const nodes: GraphNode[] = [];

    // Host node (center)
    nodes.push({
      id: "host",
      type: "host",
      position: [0, 0, 0],
      color: "#3b82f6",
      size: 1.2,
    });

    // Remote nodes (arranged in circle)
    const angleStep = (2 * Math.PI) / remotes.length;
    remotes.forEach((remote, idx) => {
      const angle = idx * angleStep;
      const radius = 3;
      nodes.push({
        id: remote.name,
        type: "remote",
        position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [
          number,
          number,
          number,
        ],
        color: "#10b981",
        size: 1.0,
      });
    });

    // Shared deps (above)
    sharedDeps.forEach((dep, idx) => {
      nodes.push({
        id: dep.pkg,
        type: "shared",
        position: [(idx - sharedDeps.length / 2) * 1.5, 2, 0] as [
          number,
          number,
          number,
        ],
        color: dep.singleton ? "#8b5cf6" : "#ef4444",
        size: 0.8,
      });
    });

    return nodes;
  }, [remotes, sharedDeps]);

  // Update duplication meter
  useEffect(() => {
    if (duplicationKb > 0 && !sharedDepsSingleton) {
      const maxDuplication = 200; // KB
      const meterValue = Math.min((duplicationKb / maxDuplication) * 100, 100);
      setDuplicationMeter(meterValue);
    } else {
      setDuplicationMeter(0);
    }
  }, [duplicationKb, sharedDepsSingleton]);

  // Handle load order play
  const handlePlayLoad = () => {
    if (isPlaying || reducedMotion) return;

    setIsPlaying(true);
    setLoadPackets([]);

    const hostNode = graphNodes.find((n) => n.type === "host");
    if (!hostNode) return;

    // Animate load order: Host -> Remote -> Host
    const remoteNodes = graphNodes.filter((n) => n.type === "remote");
    let delay = 0;

    remoteNodes.forEach((remote, idx) => {
      setTimeout(() => {
        // Host -> Remote
        const packet1: LoadPacket = {
          id: `packet-${packetIdCounter.current++}`,
          from: hostNode.position,
          to: remote.position,
          startTime: Date.now() + delay,
          duration: network === "FAST" ? 600 : 1200,
          label: `Load ${remote.id}`,
        };

        // Remote -> Host (after delay)
        setTimeout(() => {
          const packet2: LoadPacket = {
            id: `packet-${packetIdCounter.current++}`,
            from: remote.position,
            to: hostNode.position,
            startTime: Date.now() + delay + 300,
            duration: network === "FAST" ? 600 : 1200,
            label: "Module ready",
          };
          setLoadPackets((prev) => [...prev, packet1, packet2]);
        }, 300);
      }, delay);

      delay += network === "FAST" ? 800 : 1500;
    });

    // Call onPlayLoad callback to update EventLog
    if (onPlayLoad) {
      setTimeout(() => {
        onPlayLoad();
        setTimeout(() => setIsPlaying(false), 2000);
      }, delay);
    }
  };

  // Animate packets
  useFrame(() => {
    if (reducedMotion) return;

    setLoadPackets((prev) =>
      prev.filter((packet) => {
        const elapsed = Date.now() - packet.startTime;
        return elapsed < packet.duration * 2; // Keep for 2x duration
      })
    );
  });

  const isFocused = focusTarget === "mf.graph";
  const hasDuplication = duplicationKb > 0 && !sharedDepsSingleton;
  const hasVersionMismatch =
    sharedDepsStrictVersion &&
    sharedDeps.some((dep) => dep.strictVersion && !dep.singleton);

  return (
    <group>
      {/* Graph nodes */}
      {graphNodes.map((node) => {
        const isShared = node.type === "shared";
        const sharedDep = isShared
          ? sharedDeps.find((d) => d.pkg === node.id)
          : null;
        const isBlocked = Boolean(
          isShared &&
          hasVersionMismatch &&
          sharedDep &&
          sharedDep.strictVersion &&
          !sharedDep.singleton
        );

        return (
          <GraphNode3D
            key={node.id}
            node={node}
            isBlocked={isBlocked}
            dimmed={isFocused && focusTarget !== "mf.graph"}
          />
        );
      })}

      {/* Dependency links */}
      {graphNodes
        .filter((n) => n.type === "remote" || n.type === "host")
        .map((node) => {
          const remote = remotes.find((r) => r.name === node.id);
          if (!remote) return null;

          return remote.deps.map((dep) => {
            const depNode = graphNodes.find((n) => n.id === dep);
            if (!depNode) return null;

            return (
              <DependencyLink3D
                key={`${node.id}-${dep}`}
                from={node.position}
                to={depNode.position}
                isShared={depNode.type === "shared"}
                isDuplicated={hasDuplication && depNode.type === "shared"}
              />
            );
          });
        })}

      {/* Load packets */}
      {!reducedMotion &&
        loadPackets.map((packet) => (
          <LoadPacket3D
            key={packet.id}
            from={packet.from}
            to={packet.to}
            startTime={packet.startTime}
            duration={packet.duration}
            label={packet.label}
          />
        ))}

      {/* Duplication meter */}
      {hasDuplication && (
        <group position={[0, -2.5, 0]}>
          <Html center>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg shadow-lg">
              <div className="text-xs font-semibold mb-2">Duplication Risk</div>
              <div className="w-48 h-4 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-500"
                  style={{ width: `${duplicationMeter}%` }}
                />
              </div>
              <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                {duplicationKb.toFixed(1)} KB duplicated
              </div>
            </div>
          </Html>
        </group>
      )}

      {/* Version mismatch barrier */}
      {hasVersionMismatch && (
        <group position={[0, 1, 0]}>
          <Html center>
            <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-500 p-3 rounded-lg shadow-lg">
              <div className="text-xs font-bold text-red-700 dark:text-red-300 mb-1">
                ⚠️ Version Mismatch Blocked
              </div>
              <div className="text-xs text-red-600 dark:text-red-400">
                Strict version check failed: shared dependency versions don't
                match
              </div>
            </div>
          </Html>
        </group>
      )}

      {/* Play load button (only in federation mode) */}
      {!isPlaying && (
        <group position={[0, -3.5, 0]}>
          <Html center>
            <button
              onClick={handlePlayLoad}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-md transition-colors"
            >
              Play Load Order
            </button>
          </Html>
        </group>
      )}
    </group>
  );
}

interface GraphNode3DProps {
  node: GraphNode;
  isBlocked: boolean;
  dimmed?: boolean;
}

function GraphNode3D({ node, isBlocked, dimmed = false }: GraphNode3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <group position={node.position}>
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[node.size, 16, 16]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={isBlocked ? 0.1 : 0.3}
          opacity={dimmed ? 0.3 : 1}
          transparent={dimmed}
        />
      </mesh>
      {isBlocked && (
        <mesh position={[0, 0, 0]}>
          <ringGeometry args={[node.size * 1.2, node.size * 1.4, 16]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      <Html position={[0, -node.size - 0.3, 0]} center>
        <div
          className="text-xs font-semibold text-center whitespace-nowrap"
          style={{ opacity: dimmed ? 0.3 : 1 }}
        >
          {node.id}
        </div>
      </Html>
    </group>
  );
}

interface DependencyLink3DProps {
  from: [number, number, number];
  to: [number, number, number];
  isShared: boolean;
  isDuplicated: boolean;
}

function DependencyLink3D({
  from,
  to,
  isShared,
  isDuplicated,
}: DependencyLink3DProps) {
  const midpoint: [number, number, number] = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2,
    (from[2] + to[2]) / 2,
  ];

  const direction = new THREE.Vector3(
    to[0] - from[0],
    to[1] - from[1],
    to[2] - from[2]
  );
  const length = direction.length();
  direction.normalize();

  // Calculate rotation to align cylinder with direction
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(up, direction);

  const color = isDuplicated ? "#ef4444" : isShared ? "#8b5cf6" : "#6b7280";

  return (
    <group position={midpoint} quaternion={quaternion}>
      <mesh>
        <cylinderGeometry args={[0.02, 0.02, length, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isDuplicated ? 0.5 : 0.2}
          opacity={0.6}
          transparent
        />
      </mesh>
    </group>
  );
}

interface LoadPacket3DProps {
  from: [number, number, number];
  to: [number, number, number];
  startTime: number;
  duration: number;
  label?: string;
}

function LoadPacket3D({
  from,
  to,
  startTime,
  duration,
  label,
}: LoadPacket3DProps) {
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
        <capsuleGeometry args={[0.1, 0.3, 4, 8]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#fbbf24"
          emissiveIntensity={0.8}
        />
      </mesh>
      {label && (
        <Text
          position={[0, 0.4, 0]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {label}
        </Text>
      )}
    </group>
  );
}

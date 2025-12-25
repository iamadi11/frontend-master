"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion3D } from "./useReducedMotion3D";

export type CameraPreset = "overview" | "closeup" | "side";

interface Metrics {
  LCP_ms: number;
  INP_ms: number;
  CLS_score: number;
}

interface Breakdown {
  html_ms: number;
  css_ms: number;
  js_ms: number;
  images_ms: number;
  video_ms: number;
  mainThread_ms: number;
}

// Camera preset positions for performance theater view
const CAMERA_PRESETS: Record<
  CameraPreset,
  { position: [number, number, number]; lookAt: [number, number, number] }
> = {
  overview: { position: [0, 4, 10], lookAt: [0, 0, 0] },
  closeup: { position: [0, 2, 6], lookAt: [0, 0, 0] },
  side: { position: [8, 3, 6], lookAt: [0, 0, 0] },
};

interface PerformanceTheaterSceneProps {
  metrics: Metrics;
  breakdown: Breakdown;
  longTaskMs: number;
  caching: "NONE" | "BROWSER" | "CDN" | "APP";
  imageMode: "UNOPTIMIZED_JPEG" | "RESPONSIVE_WEBP" | "AVIF";
  focusTarget?: string | null;
  onSegmentClick?: (category: string, ms: number) => void;
  recommendations?: string[];
  cameraPreset?: CameraPreset;
  onCameraPresetChange?: (preset: CameraPreset) => void;
}

const GAUGE_TARGETS = {
  LCP: 2500,
  INP: 200,
  CLS: 0.1,
};

const GAUGE_COLORS = {
  good: "#10b981", // green
  bad: "#ef4444", // red
  neutral: "#6b7280", // gray
};

const BREAKDOWN_COLORS = {
  html: "#3b82f6", // blue
  css: "#8b5cf6", // purple
  js: "#fbbf24", // yellow
  images: "#10b981", // green
  video: "#ef4444", // red
  mainThread: "#f59e0b", // amber
};

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function PerformanceTheaterScene({
  metrics,
  breakdown,
  longTaskMs,
  caching,
  imageMode,
  focusTarget,
  onSegmentClick,
  recommendations = [],
  cameraPreset = "overview",
  onCameraPresetChange,
}: PerformanceTheaterSceneProps) {
  const reducedMotion = useReducedMotion3D();
  const { camera } = useThree();
  const [highlightedMetric, setHighlightedMetric] = useState<string | null>(
    null
  );
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [pulseInputDelay, setPulseInputDelay] = useState(false);

  // Animate gauge heights
  const lcpGaugeRef = useRef<THREE.Mesh>(null);
  const inpGaugeRef = useRef<THREE.Mesh>(null);
  const clsGaugeRef = useRef<THREE.Mesh>(null);

  // Waterfall segment refs
  const htmlSegmentRef = useRef<THREE.Mesh>(null);
  const cssSegmentRef = useRef<THREE.Mesh>(null);
  const jsSegmentRef = useRef<THREE.Mesh>(null);
  const imagesSegmentRef = useRef<THREE.Mesh>(null);
  const videoSegmentRef = useRef<THREE.Mesh>(null);

  // Main thread block ref
  const mainThreadBlockRef = useRef<THREE.Mesh>(null);
  const lcpMarkerRef = useRef<THREE.Group>(null);
  const inpMarkerRef = useRef<THREE.Group>(null);

  // Calculate total duration for waterfall
  const totalDuration = useMemo(
    () =>
      breakdown.html_ms +
      breakdown.css_ms +
      breakdown.js_ms +
      breakdown.images_ms +
      breakdown.video_ms,
    [breakdown]
  );

  // Calculate waterfall segment positions and widths
  const waterfallSegments = useMemo(() => {
    const runwayLength = 12;
    let cumulativeX = -runwayLength / 2;

    const segments = [
      {
        id: "html",
        ms: breakdown.html_ms,
        color: BREAKDOWN_COLORS.html,
        x: cumulativeX,
        width: (breakdown.html_ms / totalDuration) * runwayLength,
      },
    ];
    cumulativeX += segments[0].width;

    segments.push({
      id: "css",
      ms: breakdown.css_ms,
      color: BREAKDOWN_COLORS.css,
      x: cumulativeX,
      width: (breakdown.css_ms / totalDuration) * runwayLength,
    });
    cumulativeX += segments[segments.length - 1].width;

    segments.push({
      id: "js",
      ms: breakdown.js_ms,
      color: BREAKDOWN_COLORS.js,
      x: cumulativeX,
      width: (breakdown.js_ms / totalDuration) * runwayLength,
    });
    cumulativeX += segments[segments.length - 1].width;

    segments.push({
      id: "images",
      ms: breakdown.images_ms,
      color: BREAKDOWN_COLORS.images,
      x: cumulativeX,
      width: (breakdown.images_ms / totalDuration) * runwayLength,
    });
    cumulativeX += segments[segments.length - 1].width;

    segments.push({
      id: "video",
      ms: breakdown.video_ms,
      color: BREAKDOWN_COLORS.video,
      x: cumulativeX,
      width: (breakdown.video_ms / totalDuration) * runwayLength,
    });

    return { segments, runwayLength };
  }, [breakdown, totalDuration]);

  // Camera preset positioning (locked camera, no free movement)
  useEffect(() => {
    const preset = CAMERA_PRESETS[cameraPreset];
    if (preset) {
      if (reducedMotion) {
        // Instant positioning in reduced motion
        camera.position.set(...preset.position);
        camera.lookAt(...preset.lookAt);
      } else {
        // Smooth transition to preset position
        const startX = camera.position.x;
        const startY = camera.position.y;
        const startZ = camera.position.z;
        const [targetX, targetY, targetZ] = preset.position;

        let progress = 0;
        const animate = () => {
          progress += 0.05;
          if (progress < 1) {
            camera.position.x = lerp(startX, targetX, progress);
            camera.position.y = lerp(startY, targetY, progress);
            camera.position.z = lerp(startZ, targetZ, progress);
            camera.lookAt(...preset.lookAt);
            requestAnimationFrame(animate);
          } else {
            camera.position.set(...preset.position);
            camera.lookAt(...preset.lookAt);
          }
        };
        animate();
      }
    }
  }, [cameraPreset, reducedMotion, camera]);

  // Calculate gauge heights (normalized 0-1)
  const gaugeHeights = useMemo(() => {
    return {
      lcp: Math.min(1, metrics.LCP_ms / GAUGE_TARGETS.LCP),
      inp: Math.min(1, metrics.INP_ms / GAUGE_TARGETS.INP),
      cls: Math.min(1, metrics.CLS_score / GAUGE_TARGETS.CLS),
    };
  }, [metrics]);

  // Determine which metric is most impacted
  useEffect(() => {
    const impacts = [
      { id: "lcp", value: metrics.LCP_ms / GAUGE_TARGETS.LCP },
      { id: "inp", value: metrics.INP_ms / GAUGE_TARGETS.INP },
      { id: "cls", value: metrics.CLS_score / GAUGE_TARGETS.CLS },
    ];
    const worst = impacts.reduce((max, curr) =>
      curr.value > max.value ? curr : max
    );
    if (worst.value > 1) {
      setHighlightedMetric(worst.id);
      setTimeout(() => setHighlightedMetric(null), 2000);
    } else {
      setHighlightedMetric(null);
    }
  }, [metrics]);

  // Pulse input delay when long task is large
  useEffect(() => {
    if (longTaskMs > 50 && !reducedMotion) {
      setPulseInputDelay(true);
      setTimeout(() => setPulseInputDelay(false), 1000);
    }
  }, [longTaskMs, reducedMotion]);

  // Animate gauge morphs
  useFrame(() => {
    if (reducedMotion) {
      // Instant updates
      if (lcpGaugeRef.current) {
        lcpGaugeRef.current.scale.y = gaugeHeights.lcp;
      }
      if (inpGaugeRef.current) {
        inpGaugeRef.current.scale.y = gaugeHeights.inp;
      }
      if (clsGaugeRef.current) {
        clsGaugeRef.current.scale.y = gaugeHeights.cls;
      }
    } else {
      // Smooth morphs
      if (lcpGaugeRef.current) {
        lcpGaugeRef.current.scale.y = THREE.MathUtils.lerp(
          lcpGaugeRef.current.scale.y,
          gaugeHeights.lcp,
          0.1
        );
      }
      if (inpGaugeRef.current) {
        inpGaugeRef.current.scale.y = THREE.MathUtils.lerp(
          inpGaugeRef.current.scale.y,
          gaugeHeights.inp,
          0.1
        );
      }
      if (clsGaugeRef.current) {
        clsGaugeRef.current.scale.y = THREE.MathUtils.lerp(
          clsGaugeRef.current.scale.y,
          gaugeHeights.cls,
          0.1
        );
      }
    }
  });

  // Update waterfall segments
  useEffect(() => {
    const updateSegment = (
      ref: React.RefObject<THREE.Mesh | null>,
      width: number,
      x: number
    ) => {
      if (!ref.current) return;
      const runwayStart = -waterfallSegments.runwayLength / 2;
      const targetX = runwayStart + x + width / 2;
      const targetScale = Math.max(0.01, width);

      if (reducedMotion) {
        ref.current.scale.x = targetScale;
        ref.current.position.x = targetX;
      } else {
        // Smooth animation
        ref.current.scale.x = THREE.MathUtils.lerp(
          ref.current.scale.x,
          targetScale,
          0.1
        );
        ref.current.position.x = THREE.MathUtils.lerp(
          ref.current.position.x,
          targetX,
          0.1
        );
      }
    };

    if (waterfallSegments.segments.length >= 5) {
      updateSegment(
        htmlSegmentRef,
        waterfallSegments.segments[0].width,
        waterfallSegments.segments[0].x
      );
      updateSegment(
        cssSegmentRef,
        waterfallSegments.segments[1].width,
        waterfallSegments.segments[1].x
      );
      updateSegment(
        jsSegmentRef,
        waterfallSegments.segments[2].width,
        waterfallSegments.segments[2].x
      );
      updateSegment(
        imagesSegmentRef,
        waterfallSegments.segments[3].width,
        waterfallSegments.segments[3].x
      );
      updateSegment(
        videoSegmentRef,
        waterfallSegments.segments[4].width,
        waterfallSegments.segments[4].x
      );
    }
  }, [waterfallSegments, reducedMotion]);

  // Update LCP marker position
  useEffect(() => {
    if (!lcpMarkerRef.current) return;
    const lcpPosition =
      -waterfallSegments.runwayLength / 2 +
      (metrics.LCP_ms / totalDuration) * waterfallSegments.runwayLength;
    if (reducedMotion) {
      lcpMarkerRef.current.position.x = lcpPosition;
    } else {
      lcpMarkerRef.current.position.x = THREE.MathUtils.lerp(
        lcpMarkerRef.current.position.x,
        lcpPosition,
        0.1
      );
    }
  }, [
    metrics.LCP_ms,
    totalDuration,
    waterfallSegments.runwayLength,
    reducedMotion,
  ]);

  // Update INP marker position (approximate TTI)
  useEffect(() => {
    if (!inpMarkerRef.current) return;
    const inpPosition =
      -waterfallSegments.runwayLength / 2 +
      ((metrics.INP_ms * 2) / totalDuration) * waterfallSegments.runwayLength;
    if (reducedMotion) {
      inpMarkerRef.current.position.x = inpPosition;
    } else {
      inpMarkerRef.current.position.x = THREE.MathUtils.lerp(
        inpMarkerRef.current.position.x,
        inpPosition,
        0.1
      );
    }
  }, [
    metrics.INP_ms,
    totalDuration,
    waterfallSegments.runwayLength,
    reducedMotion,
  ]);

  // Update main thread block
  useEffect(() => {
    if (!mainThreadBlockRef.current) return;
    const blockWidth = Math.min(
      1,
      (longTaskMs / 2000) * waterfallSegments.runwayLength
    );
    if (reducedMotion) {
      mainThreadBlockRef.current.scale.x = blockWidth;
    } else {
      mainThreadBlockRef.current.scale.x = THREE.MathUtils.lerp(
        mainThreadBlockRef.current.scale.x,
        blockWidth,
        0.1
      );
    }
  }, [longTaskMs, waterfallSegments.runwayLength, reducedMotion]);

  // Determine zone highlighting based on focusTarget
  const highlightMetrics = focusTarget === "metrics";
  const highlightWaterfall = focusTarget === "waterfall";
  const highlightMainThread = focusTarget === "mainthread";
  const highlightCache = focusTarget === "cache.panel";

  // Get gauge colors
  const getGaugeColor = (value: number, target: number) => {
    return value < target ? GAUGE_COLORS.good : GAUGE_COLORS.bad;
  };

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, 5, -5]} intensity={0.4} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial
          color={highlightWaterfall ? "#fbbf24" : "#374151"}
          emissive={highlightWaterfall ? "#fbbf24" : "#1f2937"}
          emissiveIntensity={highlightWaterfall ? 0.1 : 0.05}
        />
      </mesh>

      {/* LEFT ZONE: CWV Gauges */}
      <group position={[-6, 0, 0]}>
        {/* Zone background highlight */}
        {highlightMetrics && (
          <mesh position={[0, 0, -0.1]}>
            <planeGeometry args={[2, 4]} />
            <meshStandardMaterial color="#fbbf24" transparent opacity={0.2} />
          </mesh>
        )}

        {/* LCP Gauge */}
        <group position={[-0.6, 0, 0]}>
          <mesh
            ref={lcpGaugeRef}
            position={[0, -1, 0]}
            scale={[0.2, gaugeHeights.lcp, 0.2]}
          >
            <cylinderGeometry args={[0.3, 0.3, 2, 16]} />
            <meshStandardMaterial
              color={
                highlightedMetric === "lcp"
                  ? "#fbbf24"
                  : getGaugeColor(metrics.LCP_ms, GAUGE_TARGETS.LCP)
              }
              emissive={
                highlightedMetric === "lcp"
                  ? "#fbbf24"
                  : getGaugeColor(metrics.LCP_ms, GAUGE_TARGETS.LCP)
              }
              emissiveIntensity={highlightedMetric === "lcp" ? 0.5 : 0.2}
            />
          </mesh>
          <Text
            position={[0, -2, 0]}
            fontSize={0.15}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            LCP
          </Text>
          <Text
            position={[0, -2.3, 0]}
            fontSize={0.1}
            color="#9ca3af"
            anchorX="center"
            anchorY="middle"
          >
            {metrics.LCP_ms.toFixed(0)}ms
          </Text>
        </group>

        {/* INP Gauge */}
        <group position={[0, 0, 0]}>
          <mesh
            ref={inpGaugeRef}
            position={[0, -1, 0]}
            scale={[0.2, gaugeHeights.inp, 0.2]}
          >
            <cylinderGeometry args={[0.3, 0.3, 2, 16]} />
            <meshStandardMaterial
              color={
                highlightedMetric === "inp" || pulseInputDelay
                  ? "#fbbf24"
                  : getGaugeColor(metrics.INP_ms, GAUGE_TARGETS.INP)
              }
              emissive={
                highlightedMetric === "inp" || pulseInputDelay
                  ? "#fbbf24"
                  : getGaugeColor(metrics.INP_ms, GAUGE_TARGETS.INP)
              }
              emissiveIntensity={
                highlightedMetric === "inp" || pulseInputDelay ? 0.5 : 0.2
              }
            />
          </mesh>
          <Text
            position={[0, -2, 0]}
            fontSize={0.15}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            INP
          </Text>
          <Text
            position={[0, -2.3, 0]}
            fontSize={0.1}
            color="#9ca3af"
            anchorX="center"
            anchorY="middle"
          >
            {metrics.INP_ms.toFixed(0)}ms
          </Text>
        </group>

        {/* CLS Gauge */}
        <group position={[0.6, 0, 0]}>
          <mesh
            ref={clsGaugeRef}
            position={[0, -1, 0]}
            scale={[0.2, gaugeHeights.cls, 0.2]}
          >
            <cylinderGeometry args={[0.3, 0.3, 2, 16]} />
            <meshStandardMaterial
              color={
                highlightedMetric === "cls"
                  ? "#fbbf24"
                  : getGaugeColor(metrics.CLS_score, GAUGE_TARGETS.CLS)
              }
              emissive={
                highlightedMetric === "cls"
                  ? "#fbbf24"
                  : getGaugeColor(metrics.CLS_score, GAUGE_TARGETS.CLS)
              }
              emissiveIntensity={highlightedMetric === "cls" ? 0.5 : 0.2}
            />
          </mesh>
          <Text
            position={[0, -2, 0]}
            fontSize={0.15}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            CLS
          </Text>
          <Text
            position={[0, -2.3, 0]}
            fontSize={0.1}
            color="#9ca3af"
            anchorX="center"
            anchorY="middle"
          >
            {metrics.CLS_score.toFixed(2)}
          </Text>
        </group>
      </group>

      {/* CENTER ZONE: Waterfall Timeline */}
      <group position={[0, 0, 0]}>
        {/* Runway */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]}>
          <boxGeometry args={[waterfallSegments.runwayLength, 0.1, 0.1]} />
          <meshStandardMaterial
            color={highlightWaterfall ? "#fbbf24" : "#4b5563"}
            emissive={highlightWaterfall ? "#fbbf24" : "#1f2937"}
            emissiveIntensity={highlightWaterfall ? 0.2 : 0.05}
          />
        </mesh>

        {/* Waterfall segments */}
        {waterfallSegments.segments.map((segment, index) => {
          const refs = [
            htmlSegmentRef,
            cssSegmentRef,
            jsSegmentRef,
            imagesSegmentRef,
            videoSegmentRef,
          ];
          const isHovered = hoveredSegment === segment.id;
          const isHighlighted =
            (imageMode !== "UNOPTIMIZED_JPEG" && segment.id === "images") ||
            (caching !== "NONE" &&
              (segment.id === "js" || segment.id === "images"));
          const runwayStart = -waterfallSegments.runwayLength / 2;
          const initialX = runwayStart + segment.x + segment.width / 2;

          return (
            <mesh
              key={segment.id}
              ref={refs[index]}
              position={[initialX, -0.8, 0]}
              scale={[Math.max(0.01, segment.width), 0.3, 0.3]}
              onPointerOver={() => setHoveredSegment(segment.id)}
              onPointerOut={() => setHoveredSegment(null)}
              onClick={() => onSegmentClick?.(segment.id, segment.ms)}
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial
                color={segment.color}
                emissive={
                  isHovered || isHighlighted ? segment.color : "#000000"
                }
                emissiveIntensity={isHovered || isHighlighted ? 0.4 : 0.1}
              />
            </mesh>
          );
        })}

        {/* LCP Marker */}
        <group ref={lcpMarkerRef} position={[0, -0.5, 0]}>
          <mesh>
            <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
            <meshStandardMaterial color="#10b981" />
          </mesh>
          <Text
            position={[0, 0.4, 0]}
            fontSize={0.12}
            color="#10b981"
            anchorX="center"
            anchorY="middle"
          >
            LCP
          </Text>
        </group>

        {/* INP Marker */}
        <group ref={inpMarkerRef} position={[0, -0.3, 0]}>
          <mesh>
            <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
          <Text
            position={[0, 0.4, 0]}
            fontSize={0.12}
            color="#3b82f6"
            anchorX="center"
            anchorY="middle"
          >
            INP
          </Text>
        </group>

        {/* Segment labels */}
        {waterfallSegments.segments.map((segment) => (
          <Text
            key={`label-${segment.id}`}
            position={[segment.x + segment.width / 2, -1.2, 0]}
            fontSize={0.1}
            color="#9ca3af"
            anchorX="center"
            anchorY="middle"
          >
            {segment.id.toUpperCase()}
          </Text>
        ))}
      </group>

      {/* RIGHT ZONE: Main Thread Track */}
      <group position={[6, 0, 0]}>
        {/* Zone background highlight */}
        {highlightMainThread && (
          <mesh position={[0, 0, -0.1]}>
            <planeGeometry args={[2, 2]} />
            <meshStandardMaterial color="#fbbf24" transparent opacity={0.2} />
          </mesh>
        )}

        {/* Track */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2, 0.1, 0.1]} />
          <meshStandardMaterial color="#4b5563" />
        </mesh>

        {/* Long task block */}
        {longTaskMs > 0 && (
          <mesh
            ref={mainThreadBlockRef}
            position={[-1, 0, 0]}
            scale={[0.1, 0.3, 0.3]}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color="#ef4444"
              emissive="#ef4444"
              emissiveIntensity={0.4}
            />
          </mesh>
        )}

        <Text
          position={[0, -0.5, 0]}
          fontSize={0.12}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Main Thread
        </Text>
        {longTaskMs > 0 && (
          <Text
            position={[0, -0.8, 0]}
            fontSize={0.1}
            color="#ef4444"
            anchorX="center"
            anchorY="middle"
          >
            {longTaskMs}ms
          </Text>
        )}
      </group>

      {/* Cache icon (simple cube) */}
      {caching !== "NONE" && (
        <group position={[waterfallSegments.runwayLength / 2 - 1, 1, 0]}>
          <mesh
            onClick={() => onSegmentClick?.("cache", 0)}
            onPointerOver={() => setHoveredSegment("cache")}
            onPointerOut={() => setHoveredSegment(null)}
          >
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial
              color={highlightCache ? "#fbbf24" : "#10b981"}
              emissive={highlightCache ? "#fbbf24" : "#10b981"}
              emissiveIntensity={highlightCache ? 0.5 : 0.3}
            />
          </mesh>
          <Text
            position={[0, -0.4, 0]}
            fontSize={0.08}
            color="#9ca3af"
            anchorX="center"
            anchorY="middle"
          >
            Cache
          </Text>
        </group>
      )}

      {/* Tooltips on hover */}
      {hoveredSegment && hoveredSegment !== "cache" && (
        <Html
          position={[
            waterfallSegments.segments.find((s) => s.id === hoveredSegment)
              ?.x || 0,
            -0.5,
            0.5,
          ]}
          center
          distanceFactor={5}
        >
          <div className="px-2 py-1 text-xs bg-white dark:bg-gray-800 rounded shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs">
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {hoveredSegment.toUpperCase()}
            </div>
            <div className="text-gray-600 dark:text-gray-400 mt-1">
              {
                waterfallSegments.segments.find((s) => s.id === hoveredSegment)
                  ?.ms
              }
              ms
            </div>
          </div>
        </Html>
      )}

      {/* Recommendations callout (DOM overlay) */}
      {recommendations.length > 0 && (
        <Html position={[-6, 2, 0]} center distanceFactor={5}>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 shadow-lg border border-blue-200 dark:border-blue-800 max-w-xs">
            <h5 className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Recommendations
            </h5>
            <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
              {recommendations.slice(0, 3).map((rec, i) => (
                <li key={i}>• {rec}</li>
              ))}
            </ul>
          </div>
        </Html>
      )}

      {/* Simulated model label */}
      <Html position={[0, 2.5, 0]} center distanceFactor={5}>
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
          Simulated model — values for educational purposes
        </div>
      </Html>

      {/* Camera preset controls (rendered as HTML overlay) */}
      {onCameraPresetChange && (
        <Html position={[0, -3.5, 0]} center>
          <div className="flex gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => onCameraPresetChange("overview")}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                cameraPreset === "overview"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onCameraPresetChange("closeup")}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                cameraPreset === "closeup"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Close-up
            </button>
            <button
              onClick={() => onCameraPresetChange("side")}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                cameraPreset === "side"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Side
            </button>
          </div>
        </Html>
      )}
    </>
  );
}

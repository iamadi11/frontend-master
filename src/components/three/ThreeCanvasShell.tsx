"use client";

import { Suspense, useRef, useEffect, useState, ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { useReducedMotion3D } from "./useReducedMotion3D";

interface ThreeCanvasShellProps {
  children: ReactNode;
  className?: string;
  fallback?: ReactNode;
}

/**
 * Shell component that wraps Three.js Canvas with error handling, DPR capping, and fallback.
 * Caps DPR on mobile devices for performance.
 */
export function ThreeCanvasShell({
  children,
  className = "",
  fallback,
}: ThreeCanvasShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const reducedMotion = useReducedMotion3D();

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Cap DPR for mobile (1-1.5 range)
  const dpr = isMobile
    ? Math.min(window.devicePixelRatio || 1, 1.5)
    : undefined;

  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div ref={containerRef} className={className}>
      <Suspense
        fallback={
          <div className="p-4 text-center text-gray-500">Loading 3D...</div>
        }
      >
        <Canvas
          dpr={dpr}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          camera={{
            position: [0, 0, 8],
            fov: 50,
          }}
          onCreated={(state) => {
            // Test WebGL context
            try {
              const gl = state.gl.getContext();
              if (!gl) {
                throw new Error("WebGL context not available");
              }
            } catch (error) {
              console.error("WebGL error:", error);
              setHasError(true);
            }
          }}
          onError={(error) => {
            console.error("Three.js error:", error);
            setHasError(true);
          }}
        >
          {children}
        </Canvas>
      </Suspense>
    </div>
  );
}

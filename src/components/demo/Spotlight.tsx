"use client";

import { useEffect, useRef } from "react";
import { useMotionPrefs } from "../motion/MotionPrefsProvider";
import { motion } from "framer-motion";

interface SpotlightProps {
  targetId: string | null;
  children: React.ReactNode;
}

export function Spotlight({ targetId, children }: SpotlightProps) {
  const { reduced } = useMotionPrefs();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!targetId || !containerRef.current || reduced) return;

    const target = containerRef.current.querySelector(
      `[data-spotlight="${targetId}"]`
    );
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }, [targetId, reduced]);

  return (
    <div ref={containerRef} className="relative">
      {children}
      {targetId && (
        <motion.div
          initial={reduced ? {} : { opacity: 0, scale: 0.95 }}
          animate={reduced ? {} : { opacity: 1, scale: 1 }}
          transition={reduced ? {} : { duration: 0.3 }}
          className="absolute inset-0 pointer-events-none"
        >
          <div
            data-spotlight-highlight={targetId}
            className="absolute rounded-lg border-2 border-yellow-400 dark:border-yellow-500 shadow-lg shadow-yellow-400/50 dark:shadow-yellow-500/50"
            style={{
              // Will be positioned by JS or CSS
              display: "none",
            }}
          />
        </motion.div>
      )}
    </div>
  );
}

// Helper component to mark elements for spotlight
export function SpotlightTarget({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { reduced } = useMotionPrefs();

  return (
    <motion.div
      data-spotlight={id}
      className={className}
      initial={false}
      animate={
        reduced
          ? {}
          : {
              boxShadow: [
                "0 0 0 0 rgba(250, 204, 21, 0)",
                "0 0 0 4px rgba(250, 204, 21, 0.3)",
                "0 0 0 0 rgba(250, 204, 21, 0)",
              ],
            }
      }
      transition={
        reduced
          ? {}
          : {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }
      }
    >
      {children}
    </motion.div>
  );
}

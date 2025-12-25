"use client";

import { useMotionPrefs } from "../motion/MotionPrefsProvider";

/**
 * Hook to get reduced motion preference for 3D animations.
 * Returns true if motion should be reduced (no camera movement, no pulse animations, instant state updates).
 */
export function useReducedMotion3D(): boolean {
  const { reduced } = useMotionPrefs();
  return reduced;
}

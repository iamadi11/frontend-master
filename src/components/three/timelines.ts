/**
 * Pure helper functions for mapping timeline phase durations to 3D positions.
 * Used by RequestConveyorScene to compute gate positions along the conveyor track.
 */

export interface PhasePosition {
  id: string;
  label: string;
  position: number; // X position along track (0 = start)
  duration: number; // Duration in ms
  cumulativeTime: number; // Cumulative time up to this phase
}

/**
 * Compute phase positions along a horizontal track.
 * @param phases Array of phase objects with id, label, and duration
 * @param trackLength Total length of the track in 3D units (default: 20)
 * @returns Array of phase positions with computed X coordinates
 */
export function computePhasePositions(
  phases: Array<{ id: string; label: string; duration: number }>,
  trackLength: number = 20
): PhasePosition[] {
  if (phases.length === 0) return [];

  const totalDuration = phases.reduce((sum, p) => sum + p.duration, 0);
  if (totalDuration === 0) {
    // If all durations are 0, space evenly
    return phases.map((phase, index) => ({
      id: phase.id,
      label: phase.label,
      position: (index / phases.length) * trackLength,
      duration: phase.duration,
      cumulativeTime: 0,
    }));
  }

  let cumulativeTime = 0;
  return phases.map((phase) => {
    const position = (cumulativeTime / totalDuration) * trackLength;
    const result: PhasePosition = {
      id: phase.id,
      label: phase.label,
      position,
      duration: phase.duration,
      cumulativeTime,
    };
    cumulativeTime += phase.duration;
    return result;
  });
}

/**
 * Find the phase that should contain the "content visible" marker.
 * @param strategy The rendering strategy
 * @param phases Array of phase positions
 * @returns Phase ID where content becomes visible, or null
 */
export function getContentVisiblePhase(
  strategy: "CSR" | "SSR" | "SSG" | "ISR" | "STREAMING",
  phases: PhasePosition[]
): string | null {
  if (strategy === "CSR") {
    // CSR: content visible after JS/DATA phases
    const jsPhase = phases.find((p) => p.id === "JS");
    const dataPhase = phases.find((p) => p.id === "DATA");
    return dataPhase?.id || jsPhase?.id || null;
  }

  // SSR/SSG/ISR/Streaming: content visible at HTML/TTFB
  const htmlPhase = phases.find((p) => p.id === "HTML");
  const ttfbPhase = phases.find((p) => p.id === "TTFB");
  return htmlPhase?.id || ttfbPhase?.id || null;
}

/**
 * Get the position where the page card should be at a given time.
 * @param time Current time in ms (0 = start)
 * @param phases Array of phase positions
 * @param trackLength Total track length
 * @returns X position along track, clamped to [0, trackLength]
 */
export function getCardPositionAtTime(
  time: number,
  phases: PhasePosition[],
  trackLength: number = 20
): number {
  if (phases.length === 0) return 0;

  const totalDuration = phases.reduce((sum, p) => sum + p.duration, 0);
  if (totalDuration === 0) return 0;

  const progress = Math.min(time / totalDuration, 1);
  return Math.min(progress * trackLength, trackLength);
}

/**
 * Get which phase the card is currently in at a given time.
 * @param time Current time in ms
 * @param phases Array of phase positions
 * @returns Phase ID or null if before start or after end
 */
export function getCurrentPhaseAtTime(
  time: number,
  phases: PhasePosition[]
): string | null {
  let cumulative = 0;
  for (const phase of phases) {
    if (time >= cumulative && time < cumulative + phase.duration) {
      return phase.id;
    }
    cumulative += phase.duration;
  }
  return null;
}

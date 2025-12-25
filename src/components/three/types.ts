export interface GraphNode {
  id: string;
  label: string;
  decision: string;
  reasoning: string;
  highlighted: boolean;
}

export interface GraphEdge {
  from: string;
  to: string;
  constraintId?: string;
}

export interface Node3DState {
  id: string;
  position: [number, number, number];
  scale: number;
  opacity: number;
  highlighted: boolean;
  previousPosition?: [number, number, number];
  previousScale?: number;
  previousOpacity?: number;
}

export interface Edge3DState {
  from: string;
  to: string;
  opacity: number;
  width: number;
  previousOpacity?: number;
  previousWidth?: number;
}

export interface PulseState {
  active: boolean;
  progress: number;
  from: [number, number, number];
  control: [number, number, number];
  to: [number, number, number];
}

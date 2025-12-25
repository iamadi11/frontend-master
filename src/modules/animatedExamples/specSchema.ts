import { z } from "zod";

// Timeline2D spec schema
const timeline2DHighlightSchema = z.object({
  lane: z.string(),
  nodeId: z.string(),
});

const timeline2DTokenPathSchema = z.object({
  from: z.string(),
  to: z.string(),
  lane: z.string(),
});

const timeline2DStepSchema = z.object({
  label: z.string(),
  explanation: z.string(),
  highlights: z.array(timeline2DHighlightSchema).optional(),
  tokenPath: timeline2DTokenPathSchema.optional(),
});

export const timeline2DSpecSchema = z.object({
  lanes: z.array(z.string()),
  steps: z.array(timeline2DStepSchema).min(2),
});

// Flow2D spec schema
const flow2DNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  x: z.number(),
  y: z.number(),
  group: z.string().optional(),
});

const flow2DEdgeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
});

const flow2DStepSchema = z.object({
  label: z.string(),
  explanation: z.string(),
  activeNodes: z.array(z.string()).optional(),
  activeEdges: z.array(z.string()).optional(),
});

export const flow2DSpecSchema = z.object({
  nodes: z.array(flow2DNodeSchema).min(2),
  edges: z.array(flow2DEdgeSchema),
  steps: z.array(flow2DStepSchema).optional(),
});

// Diff2D spec schema
const diff2DHighlightSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

const diff2DToggleSchema = z.object({
  label: z.string(),
  leftHighlights: z.array(diff2DHighlightSchema).optional(),
  rightHighlights: z.array(diff2DHighlightSchema).optional(),
  explanation: z.string(),
});

export const diff2DSpecSchema = z.object({
  leftTitle: z.string(),
  rightTitle: z.string(),
  toggles: z.array(diff2DToggleSchema).min(1),
});

// Union schema for any spec type
export const animatedExampleSpecSchema = z.union([
  timeline2DSpecSchema,
  flow2DSpecSchema,
  diff2DSpecSchema,
]);

// Type exports
export type Timeline2DSpec = z.infer<typeof timeline2DSpecSchema>;
export type Flow2DSpec = z.infer<typeof flow2DSpecSchema>;
export type Diff2DSpec = z.infer<typeof diff2DSpecSchema>;
export type AnimatedExampleSpec = z.infer<typeof animatedExampleSpecSchema>;

// Validation helper
export function validateSpec(
  kind: "timeline2d" | "flow2d" | "diff2d",
  spec: unknown
):
  | { success: true; data: AnimatedExampleSpec }
  | { success: false; error: string } {
  let schema;
  switch (kind) {
    case "timeline2d":
      schema = timeline2DSpecSchema;
      break;
    case "flow2d":
      schema = flow2DSpecSchema;
      break;
    case "diff2d":
      schema = diff2DSpecSchema;
      break;
    default:
      return { success: false, error: `Unknown kind: ${kind}` };
  }

  const result = schema.safeParse(spec);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; "),
  };
}

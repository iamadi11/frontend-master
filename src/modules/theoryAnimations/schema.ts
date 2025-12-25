import { z } from "zod";

// Base block schema
const baseBlockSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  whatToNotice: z.array(z.string()).min(1).max(6),
  linkedPracticeAnchor: z.string().optional(),
});

// Timeline2D block schema
const timeline2DStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  lane: z.enum(["default", "server", "client", "edge"]).optional(),
});

const timeline2DBlockSchema = baseBlockSchema.extend({
  kind: z.literal("timeline2d"),
  steps: z.array(timeline2DStepSchema).min(2).max(10),
  defaultState: z
    .object({
      currentStep: z.number().int().min(0).optional(),
    })
    .optional(),
});

// Flow2D block schema
const flow2DNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["default", "source", "sink", "process"]).optional(),
});

const flow2DEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
});

const flow2DBlockSchema = baseBlockSchema.extend({
  kind: z.literal("flow2d"),
  nodes: z.array(flow2DNodeSchema).min(2).max(15),
  edges: z.array(flow2DEdgeSchema),
  defaultState: z
    .object({
      activeNodeId: z.string().optional(),
    })
    .optional(),
});

// Diff2D block schema
const diff2DBlockSchema = baseBlockSchema.extend({
  kind: z.literal("diff2d"),
  before: z.object({
    title: z.string(),
    items: z.array(z.string()),
  }),
  after: z.object({
    title: z.string(),
    items: z.array(z.string()),
  }),
  highlights: z
    .array(
      z.object({
        side: z.enum(["before", "after"]),
        itemIndex: z.number().int(),
        type: z.enum(["added", "removed", "changed"]),
      })
    )
    .optional(),
});

// Three3D block schema (reuse wrapper)
const three3DBlockSchema = baseBlockSchema.extend({
  kind: z.literal("three3d"),
  sceneComponent: z.string(), // e.g., "RequestConveyorScene"
  cameraPresets: z
    .array(
      z.object({
        name: z.string(),
        position: z.tuple([z.number(), z.number(), z.number()]),
        target: z.tuple([z.number(), z.number(), z.number()]),
      })
    )
    .optional(),
  defaultState: z.record(z.string(), z.unknown()).optional(),
});

// Union of all block types
export const theoryAnimationBlockSchema = z.discriminatedUnion("kind", [
  timeline2DBlockSchema,
  flow2DBlockSchema,
  diff2DBlockSchema,
  three3DBlockSchema,
]);

// Array of blocks schema
export const theoryAnimationsSchema = z.array(theoryAnimationBlockSchema);

// Type exports
export type TheoryAnimationBlock = z.infer<typeof theoryAnimationBlockSchema>;
export type Timeline2DBlock = z.infer<typeof timeline2DBlockSchema>;
export type Flow2DBlock = z.infer<typeof flow2DBlockSchema>;
export type Diff2DBlock = z.infer<typeof diff2DBlockSchema>;
export type Three3DBlock = z.infer<typeof three3DBlockSchema>;

// Safe parse helper
export function parseTheoryAnimations(data: unknown):
  | {
      success: true;
      data: TheoryAnimationBlock[];
    }
  | {
      success: false;
      error: string;
    } {
  const result = theoryAnimationsSchema.safeParse(data);
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

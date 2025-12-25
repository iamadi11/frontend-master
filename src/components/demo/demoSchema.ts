import { z } from "zod";

export const constraintControlSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["select", "toggle"]),
  options: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .optional(),
  defaultValue: z.string(),
});

export const decisionNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
});

export const demoConfigSchema = z.object({
  constraints: z.array(constraintControlSchema),
  nodes: z.array(decisionNodeSchema),
  rules: z.array(
    z.object({
      constraintId: z.string(),
      constraintValue: z.string(),
      affectedNodes: z.array(z.string()),
      decision: z.string(),
      explanation: z.string(),
    })
  ),
});

export type DemoConfig = z.infer<typeof demoConfigSchema>;
export type ConstraintControl = z.infer<typeof constraintControlSchema>;
export type DecisionNode = z.infer<typeof decisionNodeSchema>;

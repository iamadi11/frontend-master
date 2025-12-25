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

// Resource 1: Requirements to Architecture
export const requirementsToArchitectureConfigSchema = z.object({
  demoType: z.literal("requirementsToArchitecture"),
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

// Resource 2: Rendering Strategy Lab
export const renderingStrategyLabConfigSchema = z.object({
  demoType: z.literal("renderingStrategyLab"),
  defaults: z.object({
    strategy: z.enum(["CSR", "SSR", "SSG", "ISR", "STREAMING"]),
    network: z.enum(["FAST", "SLOW"]),
    device: z.enum(["DESKTOP", "MOBILE"]),
    dataFetch: z.enum(["SERVER", "CLIENT", "MIXED"]),
    cacheMode: z.enum(["NONE", "BROWSER", "CDN", "APP"]),
    revalidateSeconds: z.number().min(0).max(3600),
  }),
  timelinePhases: z.array(z.string()),
  rules: z.array(
    z.object({
      strategy: z.enum(["CSR", "SSR", "SSG", "ISR", "STREAMING"]).optional(),
      network: z.enum(["FAST", "SLOW"]).optional(),
      device: z.enum(["DESKTOP", "MOBILE"]).optional(),
      dataFetch: z.enum(["SERVER", "CLIENT", "MIXED"]).optional(),
      cacheMode: z.enum(["NONE", "BROWSER", "CDN", "APP"]).optional(),
      phaseDurations: z.record(z.string(), z.number()),
      notes: z.array(z.string()),
      htmlPreview: z.string(),
      domPreview: z.string(),
      cacheEvents: z.array(z.string()),
    })
  ),
});

// Resource 3: State at Scale Lab
export const stateAtScaleLabConfigSchema = z.object({
  demoType: z.literal("stateAtScaleLab"),
  defaults: z.object({
    network: z.enum(["ONLINE", "FLAKY", "OFFLINE"]),
    serverLatencyMs: z.number().min(200).max(2000),
    failureRate: z.number().min(0).max(1),
    cacheMode: z.enum(["FRESH_ONLY", "STALE_WHILE_REVALIDATE"]),
    optimistic: z.boolean(),
    conflictMode: z.enum(["NONE", "LAST_WRITE_WINS", "MANUAL_MERGE"]),
  }),
  entity: z.object({
    id: z.string(),
    value: z.string(),
    version: z.number(),
  }),
  serverState: z.object({
    value: z.string(),
    version: z.number(),
  }),
  timelinePhases: z.array(z.string()),
  rules: z.array(
    z.object({
      network: z.enum(["ONLINE", "FLAKY", "OFFLINE"]).optional(),
      optimistic: z.boolean().optional(),
      cacheMode: z.enum(["FRESH_ONLY", "STALE_WHILE_REVALIDATE"]).optional(),
      conflictMode: z
        .enum(["NONE", "LAST_WRITE_WINS", "MANUAL_MERGE"])
        .optional(),
      phaseDurations: z.record(z.string(), z.number()),
      notes: z.array(z.string()),
      cacheEvents: z.array(z.string()),
      stateSnapshots: z.array(
        z.object({
          label: z.string(),
          clientValue: z.string(),
          serverValue: z.string(),
          status: z.string(),
        })
      ),
    })
  ),
});

// Resource 4: Performance Budget Lab
export const performanceBudgetLabConfigSchema = z.object({
  demoType: z.literal("performanceBudgetLab"),
  defaults: z.object({
    network: z.enum(["FAST_4G", "SLOW_4G"]),
    device: z.enum(["DESKTOP", "MOBILE"]),
    jsKb: z.number().min(0).max(800),
    cssKb: z.number().min(0).max(300),
    imageMode: z.enum(["UNOPTIMIZED_JPEG", "RESPONSIVE_WEBP", "AVIF"]),
    imageCount: z.number().min(1).max(12),
    video: z.enum(["NONE", "MP4", "HLS"]),
    caching: z.enum(["NONE", "BROWSER", "CDN", "APP"]),
    loading: z.enum([
      "DEFAULT",
      "PRELOAD_KEY_ASSET",
      "DEFER_NONCRITICAL",
      "ROUTE_SPLIT",
    ]),
    longTaskMs: z.number().min(0).max(2000),
    clsRisk: z.enum(["LOW", "MEDIUM", "HIGH"]),
  }),
  rules: z.array(
    z.object({
      network: z.enum(["FAST_4G", "SLOW_4G"]).optional(),
      device: z.enum(["DESKTOP", "MOBILE"]).optional(),
      imageMode: z
        .enum(["UNOPTIMIZED_JPEG", "RESPONSIVE_WEBP", "AVIF"])
        .optional(),
      caching: z.enum(["NONE", "BROWSER", "CDN", "APP"]).optional(),
      loading: z
        .enum([
          "DEFAULT",
          "PRELOAD_KEY_ASSET",
          "DEFER_NONCRITICAL",
          "ROUTE_SPLIT",
        ])
        .optional(),
      simulatedMetrics: z.object({
        LCP_ms: z.number(),
        INP_ms: z.number(),
        CLS_score: z.number(),
      }),
      breakdown: z.object({
        html_ms: z.number(),
        css_ms: z.number(),
        js_ms: z.number(),
        images_ms: z.number(),
        video_ms: z.number(),
        mainThread_ms: z.number(),
      }),
      recommendations: z.array(z.string()),
      eventLines: z.array(z.string()),
    })
  ),
});

// Discriminated union for all demo types
export const demoConfigSchema = z.discriminatedUnion("demoType", [
  requirementsToArchitectureConfigSchema,
  renderingStrategyLabConfigSchema,
  stateAtScaleLabConfigSchema,
  performanceBudgetLabConfigSchema,
]);

export type DemoConfig = z.infer<typeof demoConfigSchema>;
export type RequirementsToArchitectureConfig = z.infer<
  typeof requirementsToArchitectureConfigSchema
>;
export type RenderingStrategyLabConfig = z.infer<
  typeof renderingStrategyLabConfigSchema
>;
export type StateAtScaleLabConfig = z.infer<typeof stateAtScaleLabConfigSchema>;
export type PerformanceBudgetLabConfig = z.infer<
  typeof performanceBudgetLabConfigSchema
>;
export type ConstraintControl = z.infer<typeof constraintControlSchema>;
export type DecisionNode = z.infer<typeof decisionNodeSchema>;

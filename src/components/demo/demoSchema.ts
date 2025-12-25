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

// Resource 5: UI Architecture Lab
export const tokenSetSchema = z.object({
  name: z.string(),
  tokens: z.object({
    color: z.object({
      bg: z.string(),
      fg: z.string(),
      accent: z.string(),
    }),
    radius: z.object({
      sm: z.string(),
      md: z.string(),
      lg: z.string(),
    }),
    space: z.object({
      "1": z.string(),
      "2": z.string(),
      "3": z.string(),
    }),
    font: z.object({
      size: z.object({
        sm: z.string(),
        md: z.string(),
        lg: z.string(),
      }),
    }),
  }),
});

export const uiArchitectureLabConfigSchema = z.object({
  demoType: z.literal("uiArchitectureLab"),
  defaults: z.object({
    mode: z.enum(["TOKENS", "MICROFRONTENDS", "MODULE_FEDERATION"]),
    tokenSetName: z.string().optional(),
    showTokenDiff: z.boolean().optional(),
    integrationType: z.enum(["ROUTE_BASED", "COMPONENT_BASED"]).optional(),
    sharedUI: z.boolean().optional(),
    strictContractChecking: z.boolean().optional(),
    sharedDepsSingleton: z.boolean().optional(),
    sharedDepsStrictVersion: z.boolean().optional(),
    network: z.enum(["FAST", "SLOW"]).optional(),
    preloadRemotes: z.boolean().optional(),
  }),
  tokens: z
    .object({
      tokenSets: z.array(tokenSetSchema),
      components: z.array(z.string()),
      diffRules: z.array(
        z.object({
          tokenPath: z.string(),
          highlightColor: z.string(),
        })
      ),
    })
    .optional(),
  microfrontends: z
    .object({
      mfes: z.array(
        z.object({
          name: z.string(),
          routes: z.array(z.string()),
          ownedComponents: z.array(z.string()),
          apiContracts: z.array(z.string()),
        })
      ),
      integration: z.enum(["ROUTE_BASED", "COMPONENT_BASED"]),
      sharedUI: z.boolean(),
      riskNotes: z.array(z.string()),
    })
    .optional(),
  moduleFederation: z
    .object({
      remotes: z.array(
        z.object({
          name: z.string(),
          exposes: z.array(z.string()),
          deps: z.array(z.string()),
        })
      ),
      sharedDeps: z.array(
        z.object({
          pkg: z.string(),
          singleton: z.boolean(),
          strictVersion: z.boolean(),
        })
      ),
      rules: z.array(
        z.object({
          sharedDepsSingleton: z.boolean().optional(),
          sharedDepsStrictVersion: z.boolean().optional(),
          network: z.enum(["FAST", "SLOW"]).optional(),
          preloadRemotes: z.boolean().optional(),
          estimatedBundleKb: z.object({
            host: z.number(),
            remotes: z.record(z.string(), z.number()),
          }),
          duplicationKb: z.number(),
          loadOrderEvents: z.array(z.string()),
          pitfalls: z.array(z.string()),
        })
      ),
    })
    .optional(),
});

// Resource 6: Release & Delivery Lab
export const releaseDeliveryLabConfigSchema = z.object({
  demoType: z.literal("releaseDeliveryLab"),
  defaults: z.object({
    stageMode: z.array(
      z.enum(["PIPELINE", "FLAGS_AB", "CANARY_ROLLBACK", "CDN_EDGE"])
    ),
    trafficPercent: z.number().min(0).max(100),
    errorRateNew: z.number().min(0).max(0.3),
    latencyNewMs: z.number().min(0).max(800),
    flagEnabled: z.boolean(),
    abSplit: z.number().min(0).max(100),
    targeting: z.enum(["ALL", "MOBILE_ONLY", "COUNTRY_IN", "BETA_USERS"]),
    cacheTTLSeconds: z.number().min(0).max(300),
    cacheInvalidation: z.enum(["NONE", "PURGE_PATH", "VERSIONED_ASSETS"]),
    edgeCompute: z.boolean(),
  }),
  pipelineEvents: z.array(z.string()).optional(),
  rolloutEvents: z.array(z.string()).optional(),
  cdnEvents: z.array(z.string()).optional(),
  metrics: z
    .object({
      errorRate: z.number(),
      latencyMs: z.number(),
      cacheHitRate: z.number(),
    })
    .optional(),
  notes: z.array(z.string()).optional(),
});

// Resource 7: Testing Strategy Lab
export const testingStrategyLabConfigSchema = z.object({
  demoType: z.literal("testingStrategyLab"),
  defaults: z.object({
    mode: z.enum(["PYRAMID", "CONTRACT", "VISUAL"]),
    teamSize: z.enum(["SMALL", "MEDIUM", "LARGE"]),
    releaseCadence: z.enum(["WEEKLY", "DAILY", "CONTINUOUS"]),
    apiChange: z.enum([
      "NONE",
      "ADD_FIELD",
      "REMOVE_FIELD",
      "RENAME_FIELD",
      "TYPE_CHANGE",
    ]),
    consumerStrictness: z.enum(["LENIENT", "STRICT"]),
    baseline: z.object({
      layout: z.enum(["A", "B"]),
      color: z.enum(["A", "B"]),
      spacing: z.enum(["A", "B"]),
    }),
    current: z.object({
      layout: z.enum(["A", "B"]),
      color: z.enum(["A", "B"]),
      spacing: z.enum(["A", "B"]),
    }),
  }),
  rules: z.array(
    z.object({
      teamSize: z.enum(["SMALL", "MEDIUM", "LARGE"]).optional(),
      releaseCadence: z.enum(["WEEKLY", "DAILY", "CONTINUOUS"]).optional(),
      recommendedMix: z.object({
        unitPct: z.number().min(0).max(100),
        integrationPct: z.number().min(0).max(100),
        e2ePct: z.number().min(0).max(100),
      }),
      pyramidNotes: z.array(z.string()),
      eventLines: z.array(z.string()),
    })
  ),
  contractRules: z.array(
    z.object({
      apiChange: z
        .enum([
          "NONE",
          "ADD_FIELD",
          "REMOVE_FIELD",
          "RENAME_FIELD",
          "TYPE_CHANGE",
        ])
        .optional(),
      consumerStrictness: z.enum(["LENIENT", "STRICT"]).optional(),
      contractResult: z.object({
        pass: z.boolean(),
        breakingReasons: z.array(z.string()),
      }),
      eventLines: z.array(z.string()),
    })
  ),
  visualRules: z.array(
    z.object({
      baseline: z
        .object({
          layout: z.enum(["A", "B"]),
          color: z.enum(["A", "B"]),
          spacing: z.enum(["A", "B"]),
        })
        .optional(),
      current: z
        .object({
          layout: z.enum(["A", "B"]),
          color: z.enum(["A", "B"]),
          spacing: z.enum(["A", "B"]),
        })
        .optional(),
      visualDiff: z.object({
        changed: z.array(z.string()),
        severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
      }),
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
  uiArchitectureLabConfigSchema,
  releaseDeliveryLabConfigSchema,
  testingStrategyLabConfigSchema,
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
export type UIArchitectureLabConfig = z.infer<
  typeof uiArchitectureLabConfigSchema
>;
export type ReleaseDeliveryLabConfig = z.infer<
  typeof releaseDeliveryLabConfigSchema
>;
export type TestingStrategyLabConfig = z.infer<
  typeof testingStrategyLabConfigSchema
>;
export type ConstraintControl = z.infer<typeof constraintControlSchema>;
export type DecisionNode = z.infer<typeof decisionNodeSchema>;
export type TokenSet = z.infer<typeof tokenSetSchema>;

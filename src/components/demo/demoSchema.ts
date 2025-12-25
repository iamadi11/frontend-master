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

// Resource 8: Observability Lab
export const observabilityLabConfigSchema = z.object({
  demoType: z.literal("observabilityLab"),
  defaults: z.object({
    mode: z.enum(["PIPELINE", "SAMPLING_PRIVACY", "ERROR_BOUNDARY"]),
    signal: z.enum(["LOG", "METRIC", "TRACE"]),
    sampleRate: z.number().min(0).max(1),
    redactPII: z.boolean(),
    replayEnabled: z.boolean(),
    errorType: z.enum([
      "NONE",
      "RENDER_ERROR",
      "EVENT_HANDLER_ERROR",
      "ASYNC_ERROR",
    ]),
    boundaryStrategy: z.enum(["NONE", "PAGE_BOUNDARY", "WIDGET_BOUNDARY"]),
    volume: z.enum(["LOW", "MEDIUM", "HIGH"]),
  }),
  pipelineSteps: z.array(
    z.object({
      step: z.string(),
      status: z.enum(["PENDING", "PROCESSING", "COMPLETE", "ERROR"]),
      note: z.string(),
    })
  ),
  droppedEventsPct: z.number().min(0).max(100),
  privacyNotes: z.array(z.string()),
  errorFlow: z.array(
    z.object({
      phase: z.string(),
      uiState: z.string(),
      note: z.string(),
    })
  ),
  recommendedSetup: z.array(z.string()),
  eventLines: z.array(z.string()),
});

// Resource 9: Security & Privacy Lab
export const securityPrivacyLabConfigSchema = z.object({
  demoType: z.literal("securityPrivacyLab"),
  defaults: z.object({
    mode: z.enum([
      "XSS_CSRF",
      "CSP",
      "TOKEN_STORAGE",
      "CLICKJACKING",
      "DEPENDENCIES",
      "PII",
    ]),
    threat: z.enum(["XSS", "CSRF"]).optional(),
    defense: z
      .object({
        inputEncoding: z.boolean(),
        sanitizeHtml: z.boolean(),
        sameSite: z.enum(["NONE", "LAX", "STRICT"]),
        csrfToken: z.boolean(),
      })
      .optional(),
    csp: z
      .object({
        scriptSrc: z.enum(["NONE", "SELF", "SELF_CDN", "UNSAFE_INLINE"]),
        connectSrc: z.enum(["SELF", "API_ONLY", "ANY"]),
        frameAncestors: z.enum(["NONE", "SELF", "TRUSTED"]),
      })
      .optional(),
    tokenStorage: z
      .enum(["HTTP_ONLY_COOKIE", "LOCAL_STORAGE", "MEMORY"])
      .optional(),
    refreshFlow: z.boolean().optional(),
    clickjackingDefense: z
      .enum(["NONE", "XFO_DENY", "CSP_FRAME_ANCESTORS"])
      .optional(),
    deps: z
      .array(
        z.object({
          name: z.string(),
          version: z.string(),
          risk: z.enum(["LOW", "MEDIUM", "HIGH"]),
        })
      )
      .optional(),
    piiMode: z.enum(["RAW", "REDACTED", "MINIMIZED"]).optional(),
  }),
  allowedOrBlocked: z.array(
    z.object({
      action: z.string(),
      result: z.enum(["ALLOW", "BLOCK"]),
      reason: z.string(),
    })
  ),
  riskSummary: z.object({
    severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
    notes: z.array(z.string()),
  }),
  eventLines: z.array(z.string()),
});

// Resource 10: Real-time Systems Lab
export const realtimeSystemsLabConfigSchema = z.object({
  demoType: z.literal("realtimeSystemsLab"),
  defaults: z.object({
    protocol: z.enum(["SSE", "WEBSOCKET"]),
    network: z.enum(["STABLE", "FLAKY", "DISCONNECTED"]),
    msgRatePerSec: z.number().min(1).max(200),
    payloadSize: z.enum(["SMALL", "MEDIUM", "LARGE"]),
    backpressure: z.enum([
      "NONE",
      "BATCH",
      "THROTTLE",
      "DROP_OLD",
      "ACK_WINDOW",
    ]),
    batchWindowMs: z.number().min(0).max(2000),
    reconnectStrategy: z.enum([
      "NONE",
      "AUTO_RECONNECT",
      "RECONNECT_WITH_REPLAY",
    ]),
    replayWindow: z.number().min(0).max(500),
    syncModel: z.enum(["PUSH_ONLY", "PUSH_PULL", "CLIENT_PREDICT"]),
    conflictMode: z.enum(["NONE", "LAST_WRITE_WINS", "MANUAL_MERGE"]),
  }),
  rules: z.array(
    z.object({
      protocol: z.enum(["SSE", "WEBSOCKET"]).optional(),
      network: z.enum(["STABLE", "FLAKY", "DISCONNECTED"]).optional(),
      backpressure: z
        .enum(["NONE", "BATCH", "THROTTLE", "DROP_OLD", "ACK_WINDOW"])
        .optional(),
      reconnectStrategy: z
        .enum(["NONE", "AUTO_RECONNECT", "RECONNECT_WITH_REPLAY"])
        .optional(),
      syncModel: z
        .enum(["PUSH_ONLY", "PUSH_PULL", "CLIENT_PREDICT"])
        .optional(),
      conflictMode: z
        .enum(["NONE", "LAST_WRITE_WINS", "MANUAL_MERGE"])
        .optional(),
      flowEvents: z.array(z.string()),
      droppedMsgsPct: z.number(),
      latencyMs: z.number(),
      bufferDepth: z.number(),
      conflictEvents: z.array(z.string()),
      notes: z.array(z.string()),
    })
  ),
});

// Resource 11: Large-scale UX Systems Lab
export const largeScaleUXLabConfigSchema = z.object({
  demoType: z.literal("largeScaleUXLab"),
  defaults: z.object({
    mode: z.enum([
      "VIRTUALIZATION",
      "PAGINATION_SCROLL",
      "SEARCH_RACES",
      "FORMS_AUTOSAVE",
    ]),
    // Virtualization
    itemCount: z.number().min(100).max(50000),
    renderMode: z.enum(["FULL_DOM", "VIRTUALIZED"]),
    rowHeight: z.number().min(24).max(80),
    overscan: z.number().min(0).max(20),
    // Pagination vs Infinite
    strategy: z.enum(["PAGINATION", "INFINITE_SCROLL"]),
    pageSize: z.number().min(10).max(100),
    totalItems: z.number().min(100).max(5000),
    // Search races
    queryLatencyMs: z.number().min(50).max(2000),
    typingSpeed: z.enum(["SLOW", "FAST"]),
    cancellation: z.enum(["NONE", "ABORT", "IGNORE_STALE"]),
    // Forms/autosave
    validationMode: z.enum(["ON_CHANGE", "ON_BLUR", "ON_SUBMIT"]),
    autosave: z.boolean(),
    autosaveIntervalMs: z.number().min(500).max(5000),
    offline: z.boolean(),
    recovery: z.boolean(),
  }),
  rules: z.array(
    z.object({
      mode: z
        .enum([
          "VIRTUALIZATION",
          "PAGINATION_SCROLL",
          "SEARCH_RACES",
          "FORMS_AUTOSAVE",
        ])
        .optional(),
      renderMode: z.enum(["FULL_DOM", "VIRTUALIZED"]).optional(),
      strategy: z.enum(["PAGINATION", "INFINITE_SCROLL"]).optional(),
      cancellation: z.enum(["NONE", "ABORT", "IGNORE_STALE"]).optional(),
      validationMode: z.enum(["ON_CHANGE", "ON_BLUR", "ON_SUBMIT"]).optional(),
      perfStats: z.object({
        domNodes: z.number(),
        renderCost: z.number(),
        memoryScore: z.number(),
      }),
      uxNotes: z.array(z.string()),
      searchEvents: z.array(z.string()),
      autosaveEvents: z.array(z.string()),
      eventLines: z.array(z.string()),
    })
  ),
});

// Resource 12: Capstone Builder
export const capstoneBuilderConfigSchema = z.object({
  demoType: z.literal("capstoneBuilder"),
  defaults: z.object({
    scenario: z.enum(["ECOMMERCE", "DASHBOARD", "CHAT_COLLAB", "MEDIA_UI"]),
    view: z.enum(["ARCH_MAP", "INTERACTIVE_SIM"]),
    emphasis: z.enum(["PERF", "RELIABILITY", "SECURITY", "DX"]),
  }),
  scenarios: z.array(
    z.object({
      id: z.enum(["ECOMMERCE", "DASHBOARD", "CHAT_COLLAB", "MEDIA_UI"]),
      modules: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          type: z.enum([
            "UI",
            "API",
            "CACHE",
            "EDGE",
            "ANALYTICS",
            "AUTH",
            "REALTIME",
          ]),
        })
      ),
      flows: z.array(
        z.object({
          from: z.string(),
          to: z.string(),
          label: z.string(),
          kind: z.enum(["DATA", "EVENT", "AUTH"]),
        })
      ),
      tradeoffs: z.array(
        z.object({
          label: z.string(),
          goodFor: z.array(z.string()),
          risks: z.array(z.string()),
        })
      ),
      recommendedChoices: z.object({
        rendering: z.enum(["CSR", "SSR", "SSG", "ISR", "STREAMING"]),
        caching: z.enum(["NONE", "BROWSER", "CDN", "APP"]),
        state: z.string(),
        delivery: z.string(),
        observability: z.string(),
        security: z.string(),
        deployment: z.string(),
      }),
    })
  ),
  sim: z.object({
    demoScenario: z.enum(["CHAT_COLLAB", "ECOMMERCE", "DASHBOARD", "MEDIA_UI"]),
    toggles: z.object({
      rendering: z.array(z.enum(["CSR", "SSR", "SSG", "ISR", "STREAMING"])),
      caching: z.array(z.enum(["NONE", "BROWSER", "CDN", "APP"])),
      realtime: z.array(z.enum(["NONE", "SSE", "WEBSOCKET"])),
      optimistic: z.boolean(),
      offline: z.boolean(),
      sampling: z.number().min(0).max(1),
      cspStrict: z.boolean(),
    }),
    rules: z.array(
      z.object({
        rendering: z.enum(["CSR", "SSR", "SSG", "ISR", "STREAMING"]).optional(),
        caching: z.enum(["NONE", "BROWSER", "CDN", "APP"]).optional(),
        realtime: z.enum(["NONE", "SSE", "WEBSOCKET"]).optional(),
        optimistic: z.boolean().optional(),
        offline: z.boolean().optional(),
        sampling: z.number().optional(),
        cspStrict: z.boolean().optional(),
        simTimelineEvents: z.array(z.string()),
        simMetrics: z.object({
          latencyMs: z.number(),
          errorRate: z.number(),
          cacheHitRate: z.number(),
          droppedMsgsPct: z.number().optional(),
        }),
        simNotes: z.array(z.string()),
      })
    ),
  }),
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
  observabilityLabConfigSchema,
  securityPrivacyLabConfigSchema,
  realtimeSystemsLabConfigSchema,
  largeScaleUXLabConfigSchema,
  capstoneBuilderConfigSchema,
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
export type ObservabilityLabConfig = z.infer<
  typeof observabilityLabConfigSchema
>;
export type SecurityPrivacyLabConfig = z.infer<
  typeof securityPrivacyLabConfigSchema
>;
export type RealtimeSystemsLabConfig = z.infer<
  typeof realtimeSystemsLabConfigSchema
>;
export type LargeScaleUXLabConfig = z.infer<typeof largeScaleUXLabConfigSchema>;
export type CapstoneBuilderConfig = z.infer<typeof capstoneBuilderConfigSchema>;
export type ConstraintControl = z.infer<typeof constraintControlSchema>;
export type DecisionNode = z.infer<typeof decisionNodeSchema>;
export type TokenSet = z.infer<typeof tokenSetSchema>;

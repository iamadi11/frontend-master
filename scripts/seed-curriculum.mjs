import { getPayload } from "payload";
import { config as dotenvConfig } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenvConfig({ path: join(__dirname, "..", ".env.local") });

// Helper to create richText content
function createRichText(text) {
  return {
    root: {
      children: [
        {
          children: [{ text }],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

// Curriculum modules data (12 modules from PDF)
const modulesData = [
  {
    order: 1,
    slug: "foundations",
    title: "Frontend System Design Foundations: Requirements, Constraints, and Architecture Thinking",
    summary: "Learn how to translate business requirements and technical constraints into frontend architecture decisions.",
    readingTimeMins: 45,
    sections: [
      {
        key: "overview",
        heading: "Overview",
        kind: "overview",
        body: createRichText("This module covers how to turn product goals into frontend requirements, a repeatable design process, and how to document constraints and make trade-offs explicit."),
      },
      {
        key: "prerequisites",
        heading: "Prerequisites",
        kind: "prerequisites",
        body: createRichText("Basic React/TypeScript familiarity, basic HTTP understanding (requests, caching headers)."),
      },
      {
        key: "mental_model",
        heading: "Mental Model",
        kind: "mentalModel",
        body: createRichText("Frontend system design is about designing a web app so it remains fast, accessible, secure, and maintainable as it grows. Think in terms of: (a) user experience budgets (time, CPU, memory), (b) data flow and consistency, (c) reliability and recovery, and (d) delivery (CDN, caching, releases)."),
      },
    ],
  },
  {
    order: 2,
    slug: "rendering-data-lifecycles",
    title: "Rendering Strategies & Data Lifecycles: CSR, SSR, SSG, ISR, Streaming, Hydration, Routing, Fetching, Caching, Revalidation",
    summary: "Master rendering strategies and data lifecycle management for optimal performance and user experience.",
    readingTimeMins: 60,
    sections: [
      {
        key: "overview",
        heading: "Overview",
        kind: "overview",
        body: createRichText("This module covers client-side rendering (CSR), server-side rendering (SSR), static site generation (SSG), incremental static regeneration (ISR), streaming, hydration, routing, data fetching, caching, and revalidation strategies."),
      },
    ],
  },
  {
    order: 3,
    slug: "state-management-scale",
    title: "State Management at Scale: Server State vs Client State, Async Orchestration, Optimistic Updates, and Offline",
    summary: "Learn to manage state effectively at scale, distinguishing between server and client state, handling async operations, optimistic updates, and offline scenarios.",
    readingTimeMins: 55,
    sections: [
      {
        key: "overview",
        heading: "Overview",
        kind: "overview",
        body: createRichText("This module covers server state vs client state boundaries, async orchestration patterns, optimistic updates, and offline state management strategies."),
      },
    ],
  },
  {
    order: 4,
    slug: "performance-system-design",
    title: "Performance System Design: Core Web Vitals, Loading Strategies, Bundles, Caching, Images/Video, CPU/Memory, and Long Tasks",
    summary: "Design frontend systems that meet performance budgets through strategic optimization of Core Web Vitals, loading strategies, bundles, caching, and resource management.",
    readingTimeMins: 70,
    sections: [
      {
        key: "overview",
        heading: "Overview",
        kind: "overview",
        body: createRichText("This module covers Core Web Vitals (LCP, INP, CLS), loading strategies, bundle optimization, caching strategies, image/video optimization, CPU/memory management, and handling long tasks."),
      },
    ],
  },
  {
    order: 5,
    slug: "component-ui-architecture",
    title: "Component & UI Architecture: Design Systems, Theming, Tokens, Micro-frontends, and Module Federation Trade-offs",
    summary: "Build scalable UI architectures with design systems, theming, tokens, and understand micro-frontend patterns and module federation trade-offs.",
    readingTimeMins: 65,
    sections: [
      {
        key: "overview",
        heading: "Overview",
        kind: "overview",
        body: createRichText("This module covers design systems, theming strategies, design tokens, micro-frontend architectures, and module federation trade-offs."),
      },
    ],
  },
  {
    order: 6,
    slug: "deployment-delivery",
    title: "Deployment & Delivery for Frontend Systems: CI/CD, Feature Flags, A/B Testing, Canary, Rollback, CDN Strategy, Edge",
    summary: "Master deployment and delivery strategies including CI/CD, feature flags, A/B testing, canary releases, rollback procedures, CDN strategies, and edge deployment.",
    readingTimeMins: 50,
    sections: [
      {
        key: "overview",
        heading: "Overview",
        kind: "overview",
        body: createRichText("This module covers CI/CD pipelines, feature flags, A/B testing, canary deployments, rollback strategies, CDN configuration, and edge deployment patterns."),
      },
    ],
  },
  {
    order: 7,
    slug: "testing-strategy",
    title: "Testing Strategy for Frontend Systems: Unit, Integration, E2E, Contract Testing, and Visual Regression",
    summary: "Design comprehensive testing strategies covering unit, integration, E2E, contract, and visual regression testing for frontend systems.",
    readingTimeMins: 55,
    sections: [
      {
        key: "overview",
        heading: "Overview",
        kind: "overview",
        body: createRichText("This module covers unit testing, integration testing, end-to-end (E2E) testing, contract testing, and visual regression testing strategies."),
      },
    ],
  },
  {
    order: 8,
    slug: "observability",
    title: "Observability for Frontend Systems: Logging, Metrics, Tracing, Session Replay Considerations, Error Boundaries, Monitoring Strategy",
    summary: "Implement comprehensive observability for frontend systems through logging, metrics, tracing, session replay, error boundaries, and monitoring strategies.",
    readingTimeMins: 60,
    sections: [
      {
        key: "overview",
        heading: "Overview",
        kind: "overview",
        body: createRichText("This module covers logging strategies, metrics collection, distributed tracing, session replay considerations, error boundary patterns, and monitoring strategies."),
      },
    ],
  },
  {
    order: 9,
    slug: "security-privacy",
    title: "Security & Privacy for Frontend Systems: XSS/CSRF/CSP, Auth Flows, Token Storage, Clickjacking, Dependency Risk, PII Handling, GDPR-like Principles",
    summary: "Secure frontend systems against common vulnerabilities and implement privacy-compliant practices for user data handling.",
    readingTimeMins: 65,
    sections: [
      {
        key: "overview",
        heading: "Overview",
        kind: "overview",
        body: createRichText("This module covers XSS/CSRF/CSP defenses, authentication flows, secure token storage, clickjacking prevention, dependency risk management, PII handling, and GDPR compliance principles."),
      },
    ],
  },
  {
    order: 10,
    slug: "real-time-systems",
    title: "Real-time Frontend Systems: WebSockets vs SSE, Sync Models, Conflict Handling, Backpressure, and Resilience",
    summary: "Build real-time frontend systems using WebSockets and SSE, implement sync models, handle conflicts, manage backpressure, and ensure resilience.",
    readingTimeMins: 55,
    sections: [
      {
        key: "overview",
        heading: "Overview",
        kind: "overview",
        body: createRichText("This module covers WebSockets vs Server-Sent Events (SSE), synchronization models, conflict resolution strategies, backpressure handling, and resilience patterns."),
      },
    ],
  },
  {
    order: 11,
    slug: "large-scale-ux",
    title: "Large-scale UX Systems: Virtualization, Pagination vs Infinite Scroll, Search, Forms, Validation, Autosave",
    summary: "Design large-scale UX systems with virtualization, navigation patterns, search, form handling, validation, and autosave capabilities.",
    readingTimeMins: 50,
    sections: [
      {
        key: "overview",
        heading: "Overview",
        kind: "overview",
        body: createRichText("This module covers virtualization techniques, pagination vs infinite scroll trade-offs, search implementation, form handling, validation strategies, and autosave patterns."),
      },
    ],
  },
  {
    order: 12,
    slug: "capstone-designs",
    title: "Capstone Frontend System Designs: E-commerce PDP/Checkout, Dashboard/Analytics, Chat/Collab, Media Streaming UI",
    summary: "Apply all concepts through comprehensive capstone designs for e-commerce, dashboards, chat/collaboration, and media streaming interfaces.",
    readingTimeMins: 80,
    sections: [
      {
        key: "overview",
        heading: "Overview",
        kind: "overview",
        body: createRichText("This capstone module covers end-to-end system designs for e-commerce product detail pages and checkout flows, analytics dashboards, chat/collaboration interfaces, and media streaming UIs."),
      },
    ],
  },
];

// Animated examples data (minimum 3 per module as per requirements)
const examplesData = {
  foundations: [
    {
      exampleId: "foundations-requirements-flow",
      title: "Requirements → Constraints → Architecture Decisions",
      description: "Shows how requirements flow into constraints and ultimately architectural decisions",
      placementHint: "mentalModel",
      kind: "flow2d",
      whatToNotice: [
        "Requirements drive constraints",
        "Constraints influence architecture choices",
        "Trade-offs are explicit at each step",
      ],
      controls: { mode: "stepper", initialStep: 0 },
      spec: {
        nodes: [
          { id: "req", label: "Requirements", x: 100, y: 200 },
          { id: "const", label: "Constraints", x: 300, y: 200 },
          { id: "arch", label: "Architecture", x: 500, y: 200 },
        ],
        edges: [
          { id: "e1", from: "req", to: "const" },
          { id: "e2", from: "const", to: "arch" },
        ],
      },
    },
  ],
};

async function seedCurriculum() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  if (!process.env.PAYLOAD_SECRET) {
    throw new Error("PAYLOAD_SECRET environment variable is not set");
  }

  const configModule = await import("../payload.config.ts");
  const config = configModule.default;
  const payload = await getPayload({ config });

  const force = process.argv.includes("--force");

  console.log("🌱 Seeding curriculum modules...\n");

  try {
    // Seed modules
    for (const moduleData of modulesData) {
      const existing = await payload.find({
        collection: "curriculum_modules",
        where: {
          slug: {
            equals: moduleData.slug,
          },
        },
        limit: 1,
      });

      if (existing.docs.length > 0) {
        if (force) {
          await payload.update({
            collection: "curriculum_modules",
            id: existing.docs[0].id,
            data: moduleData,
          });
          console.log(`✓ Updated module: ${moduleData.title}`);
        } else {
          console.log(`⊘ Skipped existing module: ${moduleData.slug}`);
        }
      } else {
        const created = await payload.create({
          collection: "curriculum_modules",
          data: moduleData,
        });
        console.log(`✓ Created module: ${moduleData.title} (ID: ${created.id})`);
      }
    }

    console.log("\n✅ Curriculum modules seeded successfully!");
    console.log("\n⚠️  Note: Animated examples seeding is not yet implemented.");
    console.log("   Create animated examples manually in Payload CMS or extend this script.");

  } catch (error) {
    console.error("❌ Error seeding curriculum:", error);
    throw error;
  }

  process.exit(0);
}

seedCurriculum();


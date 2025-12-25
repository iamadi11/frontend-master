import { getPayload } from "payload";
import { config as dotenvConfig } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenvConfig({ path: join(__dirname, "..", ".env.local") });

// We'll need to dynamically import the config
async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  if (!process.env.PAYLOAD_SECRET) {
    throw new Error("PAYLOAD_SECRET environment variable is not set");
  }

  // Import config dynamically
  const configModule = await import("../payload.config.ts");
  const config = configModule.default;

  const payload = await getPayload({ config });

  try {
    // Check if sample resource exists
    const existingResource = await payload.find({
      collection: "resources",
      where: {
        resourceNumber: {
          equals: 1,
        },
      },
      limit: 1,
    });

    if (existingResource.docs.length === 0) {
      await payload.create({
        collection: "resources",
        data: {
          title: "Sample Resource",
          resourceNumber: 1,
          summary: "This is a sample resource created by the seed script.",
          body: [
            {
              children: [
                {
                  text: "This is sample content for the resource body.",
                },
              ],
            },
          ],
          references: [
            {
              label: "Sample Reference",
              url: "https://example.com",
            },
          ],
        },
      });
      console.log("✓ Created sample resource");
    } else {
      console.log("✓ Sample resource already exists");
    }

    // Check if sample page exists
    const existingPage = await payload.find({
      collection: "pages",
      where: {
        slug: {
          equals: "sample-page",
        },
      },
      limit: 1,
    });

    if (existingPage.docs.length === 0) {
      await payload.create({
        collection: "pages",
        data: {
          title: "Sample Page",
          slug: "sample-page",
          status: "published",
          content: [
            {
              children: [
                {
                  text: "This is a sample page created by the seed script.",
                },
              ],
            },
          ],
        },
      });
      console.log("✓ Created sample page");
    } else {
      console.log("✓ Sample page already exists");
    }

    // Check if Resource 1 topic exists
    const existingTopic = await payload.find({
      collection: "topics",
      where: {
        slug: {
          equals: "foundations",
        },
      },
      limit: 1,
    });

    if (existingTopic.docs.length === 0) {
      const practiceDemoConfig = {
        constraints: [
          {
            id: "traffic",
            label: "Traffic Volume",
            type: "select",
            options: [
              { label: "Low", value: "low" },
              { label: "Medium", value: "medium" },
              { label: "High", value: "high" },
            ],
            defaultValue: "low",
          },
          {
            id: "latency",
            label: "Latency Requirements",
            type: "select",
            options: [
              { label: "Relaxed", value: "relaxed" },
              { label: "Strict", value: "strict" },
            ],
            defaultValue: "relaxed",
          },
          {
            id: "seo",
            label: "SEO Importance",
            type: "select",
            options: [
              { label: "None", value: "none" },
              { label: "Important", value: "important" },
              { label: "Critical", value: "critical" },
            ],
            defaultValue: "none",
          },
          {
            id: "device-mix",
            label: "Device Mix",
            type: "select",
            options: [
              { label: "Desktop Heavy", value: "desktop-heavy" },
              { label: "Mobile Heavy", value: "mobile-heavy" },
            ],
            defaultValue: "desktop-heavy",
          },
          {
            id: "offline",
            label: "Offline Support",
            type: "select",
            options: [
              { label: "No", value: "no" },
              { label: "Yes", value: "yes" },
            ],
            defaultValue: "no",
          },
          {
            id: "realtime",
            label: "Real-time Requirements",
            type: "select",
            options: [
              { label: "No", value: "no" },
              { label: "Yes", value: "yes" },
            ],
            defaultValue: "no",
          },
          {
            id: "accessibility",
            label: "Accessibility",
            type: "select",
            options: [
              { label: "Standard", value: "standard" },
              { label: "High", value: "high" },
            ],
            defaultValue: "standard",
          },
          {
            id: "i18n",
            label: "Internationalization",
            type: "select",
            options: [
              { label: "No", value: "no" },
              { label: "Yes", value: "yes" },
            ],
            defaultValue: "no",
          },
        ],
        nodes: [
          {
            id: "rendering-strategy",
            label: "Rendering Strategy",
            description: "How content is rendered (CSR, SSR, SSG, etc.)",
          },
          {
            id: "data-caching",
            label: "Data Caching",
            description: "Caching strategy for data fetching",
          },
          {
            id: "state-approach",
            label: "State Approach",
            description: "Client vs server state management",
          },
          {
            id: "delivery-cdn",
            label: "Delivery/CDN",
            description: "Content delivery and CDN strategy",
          },
          {
            id: "observability",
            label: "Observability",
            description: "Monitoring and logging approach",
          },
          {
            id: "security-baseline",
            label: "Security Baseline",
            description: "Security requirements and measures",
          },
        ],
        rules: [
          {
            constraintId: "seo",
            constraintValue: "critical",
            affectedNodes: ["rendering-strategy"],
            decision: "SSR or SSG required",
            explanation: "Critical SEO needs require server-side rendering for proper indexing",
          },
          {
            constraintId: "traffic",
            constraintValue: "high",
            affectedNodes: ["delivery-cdn"],
            decision: "CDN + Edge caching essential",
            explanation: "High traffic requires CDN distribution and edge caching for performance",
          },
          {
            constraintId: "latency",
            constraintValue: "strict",
            affectedNodes: ["rendering-strategy", "data-caching"],
            decision: "SSG with aggressive caching",
            explanation: "Strict latency requirements favor pre-rendered static content with aggressive caching",
          },
          {
            constraintId: "offline",
            constraintValue: "yes",
            affectedNodes: ["state-approach", "data-caching"],
            decision: "Service Worker + Client state cache",
            explanation: "Offline support requires service workers and client-side state caching",
          },
          {
            constraintId: "realtime",
            constraintValue: "yes",
            affectedNodes: ["state-approach"],
            decision: "WebSocket/SSE + Optimistic updates",
            explanation: "Real-time features require persistent connections and optimistic UI updates",
          },
          {
            constraintId: "device-mix",
            constraintValue: "mobile-heavy",
            affectedNodes: ["rendering-strategy", "delivery-cdn"],
            decision: "Mobile-first SSR with CDN",
            explanation: "Mobile-heavy traffic benefits from server-side rendering and CDN optimization",
          },
        ],
      };

      await payload.create({
        collection: "topics",
        data: {
          title: "Frontend System Design Foundations: Requirements, Constraints, and Architecture Thinking",
          slug: "foundations",
          order: 1,
          difficulty: "beginner",
          summary: "Learn how to translate business requirements and technical constraints into frontend architecture decisions. Understand the decision-making process that connects constraints to architectural choices.",
          theory: {
            root: {
              children: [
                {
                  children: [
                    {
                      text: "Introduction to Frontend System Design",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "heading",
                  tag: "h1",
                  version: 1,
                },
                {
                  children: [
                    {
                      text: "Frontend system design begins with understanding requirements and constraints. This topic covers the foundational thinking needed to make architectural decisions.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [
                    {
                      text: "Key Concepts",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "heading",
                  tag: "h2",
                  version: 1,
                },
                {
                  children: [
                    {
                      text: "Requirements Analysis",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "heading",
                  tag: "h3",
                  version: 1,
                },
                {
                  children: [
                    {
                      text: "Understanding functional and non-functional requirements is the first step. Functional requirements define what the system should do, while non-functional requirements define how well it should perform.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [
                    {
                      text: "Constraints and Trade-offs",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "heading",
                  tag: "h3",
                  version: 1,
                },
                {
                  children: [
                    {
                      text: "Every constraint influences architecture decisions. High traffic requires different strategies than low traffic. SEO requirements affect rendering choices. Understanding these relationships is crucial.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [
                    {
                      text: "Architecture Decision Framework",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "heading",
                  tag: "h3",
                  version: 1,
                },
                {
                  children: [
                    {
                      text: "A systematic approach to making architecture decisions involves mapping constraints to architectural patterns. This topic introduces the framework used throughout the curriculum.",
                    },
                  ],
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
          },
          references: [
            {
              label: "Web.dev: Rendering on the Web",
              url: "https://web.dev/rendering-on-the-web/",
              note: "Overview of rendering strategies (placeholder - verify content)",
              claimIds: "rendering-strategy",
            },
            {
              label: "MDN: Progressive Web Apps",
              url: "https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps",
              note: "PWA concepts for offline support (placeholder - verify content)",
              claimIds: "offline-support",
            },
            {
              label: "Next.js: Data Fetching",
              url: "https://nextjs.org/docs/app/building-your-application/data-fetching",
              note: "Next.js patterns for data fetching and caching (placeholder - verify content)",
              claimIds: "data-caching",
            },
          ],
          practiceDemo: practiceDemoConfig,
          practiceSteps: [
            {
              title: "Explore Constraints",
              body: "Use the controls on the left to adjust different constraints. Notice how changing values like 'SEO Importance' or 'Traffic Volume' affects the architecture decisions shown in the graph.",
              focusTarget: "rendering-strategy",
            },
            {
              title: "Observe Decision Changes",
              body: "Watch how the decision nodes update in real-time as you change constraints. The event log at the bottom records each cause-and-effect relationship.",
              focusTarget: "data-caching",
            },
            {
              title: "Understand Relationships",
              body: "Try setting 'SEO Importance' to 'Critical' and observe how it affects the Rendering Strategy. Then set 'Traffic Volume' to 'High' and see how it impacts Delivery/CDN decisions.",
              focusTarget: "delivery-cdn",
            },
            {
              title: "Combine Constraints",
              body: "Experiment with multiple constraints. For example, set both 'Offline Support' to 'Yes' and 'Real-time Requirements' to 'Yes'. Notice how these interact to influence State Approach decisions.",
              focusTarget: "state-approach",
            },
            {
              title: "Review the Log",
              body: "Scroll through the event log to see a chronological record of all decisions made based on your constraint changes. This helps you understand the decision-making process.",
              focusTarget: null,
            },
          ],
          practiceTasks: [
            {
              prompt: "A news website needs to support high traffic (millions of daily visitors) and requires excellent SEO for article discovery. What rendering strategy would you recommend and why?",
              expectedAnswer: "SSG (Static Site Generation) with ISR (Incremental Static Regeneration) would be ideal. This provides excellent SEO through pre-rendered HTML while handling high traffic efficiently. ISR allows content updates without full rebuilds.",
              explanation: "High traffic benefits from static content served via CDN, while SEO requires server-rendered HTML. SSG provides both. ISR adds the ability to update content incrementally, perfect for news sites with frequent updates.",
            },
            {
              prompt: "A collaborative document editor needs real-time updates and offline editing capabilities. What state management approach would you use?",
              expectedAnswer: "A hybrid approach: client-side state for immediate UI updates (optimistic updates), WebSocket/SSE for real-time sync, and IndexedDB/Service Worker for offline persistence. Conflict resolution strategies are essential.",
              explanation: "Real-time requires persistent connections (WebSocket/SSE) and optimistic UI. Offline support needs local storage (IndexedDB) and sync mechanisms. The combination requires careful conflict resolution when multiple users edit simultaneously.",
            },
          ],
        },
      });
      console.log("✓ Created Resource 1 topic (foundations)");
    } else {
      console.log("✓ Resource 1 topic already exists");
    }

    console.log("\n✓ Seed script completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed().catch((error) => {
  console.error("Failed to run seed:", error);
  process.exit(1);
});

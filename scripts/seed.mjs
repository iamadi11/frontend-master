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
        demoType: "requirementsToArchitecture",
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
                  children: [{ text: "What You Will Learn" }],
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
                      text: "By the end of this topic, you will understand how to translate business requirements and technical constraints into frontend architecture decisions. You'll learn to identify key constraints, evaluate trade-offs, and make informed architectural choices that balance performance, user experience, and development complexity.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Prerequisites" }],
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
                      text: "Basic understanding of web development (HTML, CSS, JavaScript), familiarity with frontend frameworks (React, Vue, or similar), and awareness of web performance concepts. No prior system design experience required.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Mental Model" }],
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
                      text: "Think of frontend system design as a translation layer between business needs and technical implementation. Requirements flow in, constraints shape decisions, and architecture emerges from understanding trade-offs. Simple: Requirements → Constraints → Architecture. Deep: Every constraint creates a decision point with multiple valid solutions, each with different trade-offs in performance, complexity, maintainability, and user experience.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Core Concepts" }],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "heading",
                  tag: "h2",
                  version: 1,
                },
                {
                  children: [{ text: "Requirements Analysis" }],
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
                      text: "Functional requirements define what the system should do (features, user flows). Non-functional requirements define how well it should perform (performance, scalability, accessibility, SEO). Both are critical for architecture decisions.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Constraints and Trade-offs" }],
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
                      text: "Every constraint (traffic volume, device mix, SEO needs, offline support) influences architecture. High traffic favors SSR/SSG. Mobile-heavy apps need smaller bundles. SEO requirements affect rendering strategy. Understanding these relationships is crucial.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Architecture Decision Framework" }],
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
                      text: "A systematic approach: 1) Gather requirements and constraints, 2) Identify decision points (rendering, state, routing, etc.), 3) Evaluate options with trade-offs, 4) Choose based on priority constraints, 5) Document decisions and rationale.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Design Process" }],
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
                      text: "Step 1: Gather requirements (functional and non-functional). Step 2: Identify constraints (traffic, devices, SEO, offline, real-time). Step 3: Map constraints to architectural decisions (rendering strategy, state management, routing). Step 4: Evaluate trade-offs for each decision. Step 5: Choose architecture that best fits priority constraints. Step 6: Document decisions and rationale.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Trade-offs" }],
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
                      text: "CSR vs SSR: CSR offers faster interactivity but slower initial load and poor SEO. SSR offers better SEO and faster initial load but requires server infrastructure. High traffic favors SSR/SSG. Low traffic can use CSR. SEO-critical pages need SSR/SSG.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Common Mistakes" }],
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
                      text: "1) Choosing architecture before understanding constraints. 2) Optimizing for the wrong metrics (e.g., bundle size when SEO is critical). 3) Ignoring non-functional requirements. 4) Not considering device mix and network conditions. 5) Over-engineering for hypothetical scale.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Mini Case Study" }],
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
                      text: "E-commerce product page: High SEO requirement → SSR/SSG. Mobile-heavy traffic → Optimize bundle size, lazy load images. High traffic → CDN, caching strategy. Real-time inventory → WebSocket or polling. Result: SSG with ISR for product data, CSR for interactive cart, WebSocket for inventory updates.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "3D Mental Model" }],
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
                      text: "The 3D Practice demo visualizes how requirements and constraints map to architectural decisions. In 3D mode, you'll see:",
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
                      children: [
                        {
                          children: [
                            {
                              text: "How constraint changes (traffic, SEO, device mix) affect the architecture graph",
                            },
                          ],
                          direction: "ltr",
                          format: "",
                          indent: 0,
                          type: "text",
                          version: 1,
                        },
                      ],
                      direction: "ltr",
                      format: "",
                      indent: 0,
                      type: "listitem",
                      version: 1,
                    },
                    {
                      children: [
                        {
                          children: [
                            {
                              text: "The decision flow from requirements → constraints → architecture patterns",
                            },
                          ],
                          direction: "ltr",
                          format: "",
                          indent: 0,
                          type: "text",
                          version: 1,
                        },
                      ],
                      direction: "ltr",
                      format: "",
                      indent: 0,
                      type: "listitem",
                      version: 1,
                    },
                    {
                      children: [
                        {
                          children: [
                            {
                              text: "How different constraint combinations create different architectural outcomes",
                            },
                          ],
                          direction: "ltr",
                          format: "",
                          indent: 0,
                          type: "text",
                          version: 1,
                        },
                      ],
                      direction: "ltr",
                      format: "",
                      indent: 0,
                      type: "listitem",
                      version: 1,
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "list",
                  listType: "bullet",
                  version: 1,
                },
                {
                  children: [{ text: "Try this in Practice:" }],
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
                      text: "1. Enable 3D mode in the Practice demo. 2. Adjust traffic volume constraint and observe how the architecture graph changes. 3. Toggle SEO importance and see rendering strategy updates. 4. Change device mix and notice bundle optimization recommendations. 5. Review the EventLog to see the decision flow.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Interview Q&A" }],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "heading",
                  tag: "h2",
                  version: 1,
                },
                {
                  children: [{ text: "Q: How do you decide between CSR and SSR?" }],
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
                      text: "A: Evaluate constraints: SEO requirement → SSR/SSG. High traffic → SSR/SSG for better caching. Mobile-heavy → Consider CSR with code splitting. Real-time updates → CSR may be better. The decision depends on priority constraints.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Q: What if requirements conflict?" }],
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
                      text: "A: Prioritize based on business goals. If SEO and fast interactivity conflict, use SSR with hydration. If bundle size and feature richness conflict, use code splitting and lazy loading. Document trade-offs and rationale.",
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
      // Update existing topic with complete data
      const existing = existingTopic.docs[0];
      await payload.update({
        collection: "topics",
        id: existing.id,
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
                  children: [{ text: "What You Will Learn" }],
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
                      text: "By the end of this topic, you will understand how to translate business requirements and technical constraints into frontend architecture decisions. You'll learn to identify key constraints, evaluate trade-offs, and make informed architectural choices that balance performance, user experience, and development complexity.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Prerequisites" }],
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
                      text: "Basic understanding of web development (HTML, CSS, JavaScript), familiarity with frontend frameworks (React, Vue, or similar), and awareness of web performance concepts. No prior system design experience required.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Mental Model" }],
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
                      text: "Think of frontend system design as a translation layer between business needs and technical implementation. Requirements flow in, constraints shape decisions, and architecture emerges from understanding trade-offs. Simple: Requirements → Constraints → Architecture. Deep: Every constraint creates a decision point with multiple valid solutions, each with different trade-offs in performance, complexity, maintainability, and user experience.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Core Concepts" }],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "heading",
                  tag: "h2",
                  version: 1,
                },
                {
                  children: [{ text: "Requirements Analysis" }],
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
                      text: "Functional requirements define what the system should do (features, user flows). Non-functional requirements define how well it should perform (performance, scalability, accessibility, SEO). Both are critical for architecture decisions.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Constraints and Trade-offs" }],
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
                      text: "Every constraint (traffic volume, device mix, SEO needs, offline support) influences architecture. High traffic favors SSR/SSG. Mobile-heavy apps need smaller bundles. SEO requirements affect rendering strategy. Understanding these relationships is crucial.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Architecture Decision Framework" }],
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
                      text: "A systematic approach: 1) Gather requirements and constraints, 2) Identify decision points (rendering, state, routing, etc.), 3) Evaluate options with trade-offs, 4) Choose based on priority constraints, 5) Document decisions and rationale.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Design Process" }],
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
                      text: "Step 1: Gather requirements (functional and non-functional). Step 2: Identify constraints (traffic, devices, SEO, offline, real-time). Step 3: Map constraints to architectural decisions (rendering strategy, state management, routing). Step 4: Evaluate trade-offs for each decision. Step 5: Choose architecture that best fits priority constraints. Step 6: Document decisions and rationale.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Trade-offs" }],
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
                      text: "CSR vs SSR: CSR offers faster interactivity but slower initial load and poor SEO. SSR offers better SEO and faster initial load but requires server infrastructure. High traffic favors SSR/SSG. Low traffic can use CSR. SEO-critical pages need SSR/SSG.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Common Mistakes" }],
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
                      text: "1) Choosing architecture before understanding constraints. 2) Optimizing for the wrong metrics (e.g., bundle size when SEO is critical). 3) Ignoring non-functional requirements. 4) Not considering device mix and network conditions. 5) Over-engineering for hypothetical scale.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Mini Case Study" }],
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
                      text: "E-commerce product page: High SEO requirement → SSR/SSG. Mobile-heavy traffic → Optimize bundle size, lazy load images. High traffic → CDN, caching strategy. Real-time inventory → WebSocket or polling. Result: SSG with ISR for product data, CSR for interactive cart, WebSocket for inventory updates.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "3D Mental Model" }],
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
                      text: "The 3D Practice demo visualizes how requirements and constraints map to architectural decisions. In 3D mode, you'll see:",
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
                      children: [
                        {
                          children: [
                            {
                              text: "How constraint changes (traffic, SEO, device mix) affect the architecture graph",
                            },
                          ],
                          direction: "ltr",
                          format: "",
                          indent: 0,
                          type: "text",
                          version: 1,
                        },
                      ],
                      direction: "ltr",
                      format: "",
                      indent: 0,
                      type: "listitem",
                      version: 1,
                    },
                    {
                      children: [
                        {
                          children: [
                            {
                              text: "The decision flow from requirements → constraints → architecture patterns",
                            },
                          ],
                          direction: "ltr",
                          format: "",
                          indent: 0,
                          type: "text",
                          version: 1,
                        },
                      ],
                      direction: "ltr",
                      format: "",
                      indent: 0,
                      type: "listitem",
                      version: 1,
                    },
                    {
                      children: [
                        {
                          children: [
                            {
                              text: "How different constraint combinations create different architectural outcomes",
                            },
                          ],
                          direction: "ltr",
                          format: "",
                          indent: 0,
                          type: "text",
                          version: 1,
                        },
                      ],
                      direction: "ltr",
                      format: "",
                      indent: 0,
                      type: "listitem",
                      version: 1,
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "list",
                  listType: "bullet",
                  version: 1,
                },
                {
                  children: [{ text: "Try this in Practice:" }],
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
                      text: "1. Enable 3D mode in the Practice demo. 2. Adjust traffic volume constraint and observe how the architecture graph changes. 3. Toggle SEO importance and see rendering strategy updates. 4. Change device mix and notice bundle optimization recommendations. 5. Review the EventLog to see the decision flow.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Interview Q&A" }],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "heading",
                  tag: "h2",
                  version: 1,
                },
                {
                  children: [{ text: "Q: How do you decide between CSR and SSR?" }],
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
                      text: "A: Evaluate constraints: SEO requirement → SSR/SSG. High traffic → SSR/SSG for better caching. Mobile-heavy → Consider CSR with code splitting. Real-time updates → CSR may be better. The decision depends on priority constraints.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Q: What if requirements conflict?" }],
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
                      text: "A: Prioritize based on business goals. If SEO and fast interactivity conflict, use SSR with hydration. If bundle size and feature richness conflict, use code splitting and lazy loading. Document trade-offs and rationale.",
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
        },
      });
      console.log("✓ Updated Resource 1 topic (foundations) with complete theory");
    }

    // Check if Resource 2 topic exists
    const existingTopic2 = await payload.find({
      collection: "topics",
      where: {
        slug: {
          equals: "rendering-strategies",
        },
      },
      limit: 1,
    });

    if (existingTopic2.docs.length === 0) {
      const renderingStrategyDemoConfig = {
        demoType: "renderingStrategyLab",
        defaults: {
          strategy: "CSR",
          network: "FAST",
          device: "DESKTOP",
          dataFetch: "CLIENT",
          cacheMode: "NONE",
          revalidateSeconds: 0,
        },
        timelinePhases: ["REQUEST", "TTFB", "HTML", "JS", "HYDRATE", "DATA", "INTERACTIVE"],
        rules: [
          {
            strategy: "CSR",
            phaseDurations: {
              REQUEST: 50,
              TTFB: 100,
              HTML: 200,
              JS: 800,
              HYDRATE: 300,
              DATA: 500,
              INTERACTIVE: 200,
            },
            notes: [
              "HTML shell first; data arrives after JS; TTI shifts later on slow networks.",
            ],
            htmlPreview: `<!DOCTYPE html>
<html>
<head><title>App</title></head>
<body>
  <div id="root"></div>
  <script src="/app.js"></script>
</body>
</html>`,
            domPreview: `<!DOCTYPE html>
<html>
<head><title>App</title></head>
<body>
  <div id="root">
    <header>Welcome</header>
    <main>Content loaded</main>
  </div>
  <script src="/app.js"></script>
</body>
</html>`,
            cacheEvents: ["Cache: MISS", "Fetching from server"],
          },
          {
            strategy: "SSR",
            phaseDurations: {
              REQUEST: 50,
              TTFB: 300,
              HTML: 400,
              JS: 600,
              HYDRATE: 200,
              DATA: 0,
              INTERACTIVE: 100,
            },
            notes: [
              "Server renders HTML with data; faster initial content; hydration required.",
            ],
            htmlPreview: `<!DOCTYPE html>
<html>
<head><title>App</title></head>
<body>
  <div id="root">
    <header>Welcome</header>
    <main>Server-rendered content</main>
  </div>
  <script src="/app.js"></script>
</body>
</html>`,
            domPreview: `<!DOCTYPE html>
<html>
<head><title>App</title></head>
<body>
  <div id="root">
    <header>Welcome</header>
    <main>Server-rendered content</main>
  </div>
  <script src="/app.js"></script>
</body>
</html>`,
            cacheEvents: ["Cache: MISS", "Server rendering", "HTML delivered"],
          },
          {
            strategy: "SSG",
            phaseDurations: {
              REQUEST: 50,
              TTFB: 50,
              HTML: 100,
              JS: 400,
              HYDRATE: 150,
              DATA: 0,
              INTERACTIVE: 50,
            },
            notes: [
              "Pre-rendered HTML; fastest TTFB; no server processing; instant content.",
            ],
            htmlPreview: `<!DOCTYPE html>
<html>
<head><title>App</title></head>
<body>
  <div id="root">
    <header>Welcome</header>
    <main>Static content</main>
  </div>
  <script src="/app.js"></script>
</body>
</html>`,
            domPreview: `<!DOCTYPE html>
<html>
<head><title>App</title></head>
<body>
  <div id="root">
    <header>Welcome</header>
    <main>Static content</main>
  </div>
  <script src="/app.js"></script>
</body>
</html>`,
            cacheEvents: ["Cache: HIT (CDN)", "Serving static HTML"],
          },
          {
            strategy: "ISR",
            cacheMode: "CDN",
            phaseDurations: {
              REQUEST: 50,
              TTFB: 50,
              HTML: 100,
              JS: 400,
              HYDRATE: 150,
              DATA: 0,
              INTERACTIVE: 50,
            },
            notes: [
              "Cached HTML served; background revalidation may update later.",
            ],
            htmlPreview: `<!DOCTYPE html>
<html>
<head><title>App</title></head>
<body>
  <div id="root">
    <header>Welcome</header>
    <main>ISR cached content</main>
  </div>
  <script src="/app.js"></script>
</body>
</html>`,
            domPreview: `<!DOCTYPE html>
<html>
<head><title>App</title></head>
<body>
  <div id="root">
    <header>Welcome</header>
    <main>ISR cached content</main>
  </div>
  <script src="/app.js"></script>
</body>
</html>`,
            cacheEvents: [
              "Cache: HIT (CDN)",
              "Serving cached HTML",
              "Background revalidation scheduled",
            ],
          },
          {
            strategy: "STREAMING",
            phaseDurations: {
              REQUEST: 50,
              TTFB: 200,
              HTML: 300,
              JS: 400,
              HYDRATE: 200,
              DATA: 400,
              INTERACTIVE: 100,
            },
            notes: [
              "Streaming chunks; progressive rendering; content appears incrementally.",
            ],
            htmlPreview: `<!DOCTYPE html>
<html>
<head><title>App</title></head>
<body>
  <div id="root">
    <header>Welcome</header>
    <!-- Streaming... -->
  </div>
</body>
</html>`,
            domPreview: `<!DOCTYPE html>
<html>
<head><title>App</title></head>
<body>
  <div id="root">
    <header>Welcome</header>
    <main>Streamed content</main>
  </div>
  <script src="/app.js"></script>
</body>
</html>`,
            cacheEvents: ["Cache: MISS", "Streaming response", "Chunks arriving"],
          },
        ],
      };

      await payload.create({
        collection: "topics",
        data: {
          title: "Rendering Strategies & Data Lifecycles",
          slug: "rendering-strategies",
          order: 2,
          difficulty: "beginner",
          summary: "Learn how different rendering strategies (CSR, SSR, SSG, ISR, Streaming) affect performance, user experience, and data fetching patterns. Understand when to use each approach.",
          theory: {
            root: {
              children: [
                {
                  children: [{ text: "What You Will Learn" }],
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
                      text: "By the end of this topic, you will understand different rendering strategies (CSR, SSR, SSG, ISR, Streaming), their trade-offs, when to use each, and how data fetching and caching interact with rendering. You'll learn to choose the right strategy based on requirements and constraints.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Prerequisites" }],
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
                      text: "Understanding of HTML, CSS, JavaScript, React or similar framework, basic knowledge of HTTP and web performance metrics. Familiarity with Next.js helpful but not required.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Mental Model" }],
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
                      text: "Simple: Rendering = when and where HTML is generated. CSR = browser, SSR = server per request, SSG = server at build time. Deep: Each strategy creates a different timeline of events (HTML delivery, JavaScript execution, data fetching, hydration, interactivity). The choice affects Core Web Vitals, SEO, caching strategies, and user experience. Understanding the timeline helps you optimize each phase.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Core Concepts" }],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "heading",
                  tag: "h2",
                  version: 1,
                },
                {
                  children: [{ text: "Client-Side Rendering (CSR)" }],
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
                      text: "CSR renders content in the browser after JavaScript loads. Fast initial HTML shell, but content appears after hydration. Best for interactive apps with minimal SEO needs.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Server-Side Rendering (SSR)" }],
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
                      text: "SSR generates HTML on the server for each request. Faster initial content, better SEO, but requires server processing. Good for dynamic content with SEO requirements.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Static Site Generation (SSG)" }],
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
                      text: "SSG pre-renders pages at build time. Fastest TTFB, excellent for CDN caching, but requires rebuilds for content updates. Ideal for mostly-static sites.",
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
                    { text: "Incremental Static Regeneration (ISR)" },
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
                      text: "ISR combines SSG benefits with on-demand updates. Pages are statically generated but can be revalidated in the background. Perfect for content that changes occasionally.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Streaming" }],
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
                      text: "Streaming sends HTML in chunks as it's generated. Progressive rendering improves perceived performance. Content appears incrementally, reducing time to first content.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Design Process" }],
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
                      text: "Step 1: Assess SEO requirements (critical → SSR/SSG). Step 2: Evaluate traffic patterns (high → SSG/ISR for caching). Step 3: Consider content update frequency (frequent → SSR/ISR, static → SSG). Step 4: Analyze interactivity needs (high → CSR or SSR with hydration). Step 5: Choose strategy balancing performance, SEO, and complexity. Step 6: Implement data fetching and caching strategy.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Trade-offs" }],
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
                      text: "CSR: Fast interactivity, poor SEO, slower initial content. SSR: Better SEO, faster initial content, requires server, slower TTI. SSG: Fastest TTFB, excellent caching, requires rebuilds. ISR: SSG benefits with on-demand updates, more complex. Streaming: Progressive rendering, better perceived performance, requires server support.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Common Mistakes" }],
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
                      text: "1) Using CSR for SEO-critical pages. 2) Over-using SSR when SSG would suffice. 3) Not considering caching strategy with rendering choice. 4) Ignoring hydration costs in SSR. 5) Choosing SSG for frequently-changing content without ISR.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Mini Case Study" }],
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
                      text: "E-commerce product page: High SEO → SSG with ISR. Product data updates hourly → ISR revalidate: 3600s. High traffic → CDN caching. Interactive cart → CSR for cart component. Result: SSG for product page (fast, SEO-friendly), ISR for freshness, CSR for cart interactions.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "3D Mental Model" }],
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
                      text: "The 3D Practice demo visualizes rendering timelines and strategy differences. In 3D mode, you'll see:",
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
                      children: [
                        {
                          children: [
                            {
                              text: "How different rendering strategies create different timelines (HTML delivery, JS load, data fetch, hydration)",
                            },
                          ],
                          direction: "ltr",
                          format: "",
                          indent: 0,
                          type: "text",
                          version: 1,
                        },
                      ],
                      direction: "ltr",
                      format: "",
                      indent: 0,
                      type: "listitem",
                      version: 1,
                    },
                    {
                      children: [
                        {
                          children: [
                            {
                              text: "The relationship between network speed and strategy performance",
                            },
                          ],
                          direction: "ltr",
                          format: "",
                          indent: 0,
                          type: "text",
                          version: 1,
                        },
                      ],
                      direction: "ltr",
                      format: "",
                      indent: 0,
                      type: "listitem",
                      version: 1,
                    },
                    {
                      children: [
                        {
                          children: [
                            {
                              text: "How caching strategies interact with rendering (CDN cache hits, revalidation)",
                            },
                          ],
                          direction: "ltr",
                          format: "",
                          indent: 0,
                          type: "text",
                          version: 1,
                        },
                      ],
                      direction: "ltr",
                      format: "",
                      indent: 0,
                      type: "listitem",
                      version: 1,
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "list",
                  listType: "bullet",
                  version: 1,
                },
                {
                  children: [{ text: "Try this in Practice:" }],
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
                      text: "1. Enable 3D mode in the Practice demo. 2. Switch between CSR, SSR, SSG, ISR, and Streaming strategies. 3. Observe how the timeline changes for each strategy. 4. Adjust network speed and see how it affects different strategies. 5. Change cache mode and watch revalidation events. 6. Review the EventLog to understand the sequence of events.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Interview Q&A" }],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "heading",
                  tag: "h2",
                  version: 1,
                },
                {
                  children: [{ text: "Q: When should you use SSR vs SSG?" }],
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
                      text: "A: Use SSG for content that doesn't change frequently (blog posts, product pages with stable data). Use SSR for content that changes per request (user-specific data, real-time data). Use ISR when you want SSG benefits but need periodic updates without full rebuilds.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Q: What's the trade-off between CSR and SSR?" }],
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
                      text: "A: CSR offers faster Time to Interactive (TTI) and better interactivity, but slower initial content and poor SEO. SSR offers faster initial content and better SEO, but slower TTI due to hydration. Choose CSR for interactive apps with minimal SEO needs. Choose SSR for SEO-critical pages or when initial content speed matters.",
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
              label: "Next.js: Data Fetching",
              url: "https://nextjs.org/docs/app/building-your-application/data-fetching",
              note: "Next.js patterns for rendering strategies (placeholder - verify content)",
              claimIds: "rendering-strategies",
            },
            {
              label: "Web.dev: Rendering on the Web",
              url: "https://web.dev/rendering-on-the-web/",
              note: "Overview of rendering strategies (placeholder - verify content)",
              claimIds: "rendering-overview",
            },
            {
              label: "MDN: Server-Side Rendering",
              url: "https://developer.mozilla.org/en-US/docs/Glossary/SSR",
              note: "SSR concepts (placeholder - verify content)",
              claimIds: "ssr",
            },
          ],
          practiceDemo: renderingStrategyDemoConfig,
          practiceSteps: [
            {
              title: "Explore Rendering Strategies",
              body: "Use the Strategy selector to switch between CSR, SSR, SSG, ISR, and Streaming. Watch how the timeline changes - notice when users first see content (the green marker).",
              focusTarget: "controls.strategy",
            },
            {
              title: "Observe Timeline Differences",
              body: "Compare CSR vs SSR: CSR shows HTML shell first, then JS loads and data arrives. SSR shows HTML with data immediately, but requires hydration. SSG is fastest with pre-rendered content.",
              focusTarget: "timeline",
            },
            {
              title: "Understand HTML vs DOM",
              body: "The diff view shows what the browser receives (HTML) vs what appears after hydration (DOM). Notice how CSR starts with minimal HTML, while SSR/SSG have content immediately.",
              focusTarget: "diff",
            },
            {
              title: "Experiment with Network Speed",
              body: "Switch Network to 'Slow' and see how CSR's Time to Interactive (TTI) shifts significantly later. SSR and SSG are less affected by network speed for initial content.",
              focusTarget: "timeline",
            },
            {
              title: "Explore Caching",
              body: "Change Cache Mode and observe the cache events panel. SSG and ISR benefit most from CDN caching. ISR shows background revalidation when revalidate seconds > 0.",
              focusTarget: "cache",
            },
            {
              title: "ISR Revalidation",
              body: "Set Strategy to ISR and adjust the Revalidate slider. This controls how often cached pages are regenerated in the background. Lower values = fresher content but more server load.",
              focusTarget: "cache",
            },
            {
              title: "Review Event Log",
              body: "Scroll through the event log to see a chronological record of all strategy changes and their impacts. This helps you understand the decision-making process.",
              focusTarget: "eventlog",
            },
          ],
          practiceTasks: [
            {
              prompt: "A news website needs to support high traffic (millions of daily visitors) and requires excellent SEO for article discovery. The content updates frequently (every few minutes). Which rendering strategy would you recommend and why?",
              expectedAnswer: "ISR (Incremental Static Regeneration) with a short revalidation period (e.g., 60 seconds). This provides excellent SEO through pre-rendered HTML, handles high traffic efficiently via CDN caching, and allows content updates without full rebuilds. SSG would require constant rebuilds, while SSR would overload the server.",
              explanation: "ISR combines the SEO and performance benefits of SSG with the ability to update content incrementally. The revalidation period balances freshness with server load. For high-traffic sites, CDN caching is essential, which ISR supports perfectly.",
            },
            {
              prompt: "A marketing landing page is mostly static but needs to show personalized pricing based on user location. The pricing data changes rarely (maybe once per month). Choose between SSG and ISR and set an appropriate revalidation time.",
              expectedAnswer: "ISR with revalidation set to a long period (e.g., 3600 seconds / 1 hour) or even longer. Since pricing changes rarely, you can use a long revalidation period. The personalization can be handled client-side after the static HTML loads, or via edge functions.",
              explanation: "ISR is better than SSG here because you need some dynamic behavior (personalized pricing). A long revalidation period (1 hour or more) ensures the page is cached efficiently while still allowing updates when pricing changes. The personalization can be layered on top of the static HTML.",
            },
            {
              prompt: "An interactive dashboard application needs real-time data updates and doesn't require SEO. Users expect immediate interactivity. Which strategy fits best?",
              expectedAnswer: "CSR (Client-Side Rendering). Since SEO isn't needed and users expect immediate interactivity, CSR provides the best experience. The dashboard can fetch data client-side and update in real-time without server round-trips for rendering.",
              explanation: "CSR is ideal for authenticated, interactive applications where SEO isn't a concern. The initial HTML shell loads quickly, then JavaScript takes over for all rendering and data fetching. This allows for real-time updates and smooth interactions without server-side rendering overhead.",
            },
          ],
        },
      });
      console.log("✓ Created Resource 2 topic (rendering-strategies)");
    } else {
      console.log("✓ Resource 2 topic already exists");
    }

    // Check if Resource 3 topic exists
    const existingTopic3 = await payload.find({
      collection: "topics",
      where: {
        slug: {
          equals: "state-management-at-scale",
        },
      },
      limit: 1,
    });

    if (existingTopic3.docs.length === 0) {
      const stateAtScaleDemoConfig = {
        demoType: "stateAtScaleLab",
        defaults: {
          network: "ONLINE",
          serverLatencyMs: 500,
          failureRate: 0,
          cacheMode: "FRESH_ONLY",
          optimistic: true,
          conflictMode: "NONE",
        },
        entity: {
          id: "entity-1",
          value: "Initial value",
          version: 1,
        },
        serverState: {
          value: "Initial value",
          version: 1,
        },
        timelinePhases: [
          "ACTION",
          "OPTIMISTIC_APPLY",
          "QUEUE",
          "REQUEST",
          "SERVER_APPLY",
          "RESPONSE",
          "CACHE_UPDATE",
          "ROLLBACK_OR_CONFIRM",
          "RENDER",
        ],
        rules: [
          {
            network: "ONLINE",
            optimistic: true,
            cacheMode: "FRESH_ONLY",
            phaseDurations: {
              ACTION: 100,
              OPTIMISTIC_APPLY: 200,
              REQUEST: 100,
              SERVER_APPLY: 250,
              RESPONSE: 250,
              CACHE_UPDATE: 200,
              ROLLBACK_OR_CONFIRM: 100,
              RENDER: 100,
            },
            notes: [
              "Optimistic ON: UI updated immediately before server confirmation.",
              "Cache updated after server confirms mutation.",
            ],
            cacheEvents: [
              "Cache: FRESH",
              "Optimistic update applied",
              "Server confirmed → cache updated",
            ],
            stateSnapshots: [
              {
                label: "Before",
                clientValue: "Initial value",
                serverValue: "Initial value",
                status: "synced",
              },
              {
                label: "After optimistic",
                clientValue: "New value",
                serverValue: "Initial value",
                status: "optimistic",
              },
              {
                label: "After confirm",
                clientValue: "New value",
                serverValue: "New value",
                status: "synced",
              },
            ],
          },
          {
            network: "ONLINE",
            optimistic: false,
            cacheMode: "FRESH_ONLY",
            phaseDurations: {
              ACTION: 100,
              REQUEST: 100,
              SERVER_APPLY: 250,
              RESPONSE: 250,
              CACHE_UPDATE: 200,
              ROLLBACK_OR_CONFIRM: 100,
              RENDER: 100,
            },
            notes: [
              "Optimistic OFF: UI waits for server confirmation before updating.",
              "User sees loading state until server responds.",
            ],
            cacheEvents: [
              "Cache: FRESH",
              "Waiting for server response",
              "Server confirmed → cache updated",
            ],
            stateSnapshots: [
              {
                label: "Before",
                clientValue: "Initial value",
                serverValue: "Initial value",
                status: "synced",
              },
              {
                label: "Loading",
                clientValue: "Initial value",
                serverValue: "Initial value",
                status: "pending",
              },
              {
                label: "After confirm",
                clientValue: "New value",
                serverValue: "New value",
                status: "synced",
              },
            ],
          },
          {
            network: "OFFLINE",
            optimistic: true,
            phaseDurations: {
              ACTION: 100,
              OPTIMISTIC_APPLY: 200,
              QUEUE: 300,
            },
            notes: [
              "Offline: mutation queued; will replay when online.",
              "UI updated optimistically; queue holds mutation for later.",
            ],
            cacheEvents: [
              "Cache: STALE",
              "Network offline",
              "Mutation queued for replay",
            ],
            stateSnapshots: [
              {
                label: "Before",
                clientValue: "Initial value",
                serverValue: "Initial value",
                status: "synced",
              },
              {
                label: "After optimistic",
                clientValue: "New value",
                serverValue: "Initial value",
                status: "queued",
              },
            ],
          },
          {
            network: "ONLINE",
            optimistic: true,
            cacheMode: "STALE_WHILE_REVALIDATE",
            phaseDurations: {
              ACTION: 100,
              OPTIMISTIC_APPLY: 200,
              REQUEST: 100,
              SERVER_APPLY: 250,
              RESPONSE: 250,
              CACHE_UPDATE: 200,
              ROLLBACK_OR_CONFIRM: 100,
              RENDER: 100,
            },
            notes: [
              "SWR: served stale cache then revalidated in background.",
              "User sees content immediately; cache updates in background.",
            ],
            cacheEvents: [
              "Cache: STALE (served)",
              "Background revalidation started",
              "Cache updated in background",
            ],
            stateSnapshots: [
              {
                label: "Stale served",
                clientValue: "Cached value",
                serverValue: "Server value",
                status: "stale",
              },
              {
                label: "After revalidate",
                clientValue: "Server value",
                serverValue: "Server value",
                status: "fresh",
              },
            ],
          },
        ],
      };

      await payload.create({
        collection: "topics",
        data: {
          title: "State Management at Scale: Server State vs Client State, Async Orchestration, Optimistic Updates, and Offline",
          slug: "state-management-at-scale",
          order: 3,
          difficulty: "intermediate",
          summary: "Learn how to manage state at scale: distinguish between server and client state, implement optimistic updates, handle offline scenarios, and resolve conflicts. Understand async orchestration patterns for robust state management.",
          theory: {
            root: {
              children: [
                {
                  children: [{ text: "What You Will Learn" }],
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
                      text: "By the end of this topic, you will understand the distinction between server and client state, implement optimistic updates, handle offline scenarios with queue management, resolve conflicts, and use effective caching strategies. You'll learn async orchestration patterns for robust state management at scale.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Prerequisites" }],
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
                      text: "Understanding of React or similar framework, familiarity with async JavaScript (Promises, async/await), basic knowledge of HTTP and REST APIs. Experience with state management libraries helpful but not required.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Mental Model" }],
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
                      text: "Simple: Server state = source of truth from backend, client state = UI-only state. Optimistic updates = show changes immediately, rollback if server rejects. Deep: State management involves synchronization between client cache and server, handling network failures, conflict resolution, and maintaining consistency. The cache acts as a local replica that must stay in sync with the server, requiring strategies for freshness, invalidation, and conflict resolution.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Core Concepts" }],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "heading",
                  tag: "h2",
                  version: 1,
                },
                {
                  children: [{ text: "Server State vs Client State" }],
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
                      text: "Server state comes from backend APIs and represents the source of truth. Client state is ephemeral UI state that exists only in the browser. Understanding this distinction is crucial for building reliable applications.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Optimistic Updates" }],
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
                      text: "Optimistic updates improve perceived performance by updating the UI immediately, before the server confirms the mutation. If the server rejects the change, the UI must rollback to the previous state.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Offline Support and Queue Management" }],
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
                      text: "When the network is unavailable, mutations must be queued and replayed when connectivity is restored. This requires careful conflict resolution strategies to handle cases where multiple clients modify the same data.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Cache Strategies" }],
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
                      text: "Effective caching balances freshness with performance. Strategies like stale-while-revalidate serve cached content immediately while updating in the background, improving perceived performance.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Design Process" }],
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
                      text: "Step 1: Identify state type (server vs client). Step 2: Choose caching strategy (fresh-only, stale-while-revalidate, etc.). Step 3: Implement optimistic updates for mutations. Step 4: Add offline queue for network failures. Step 5: Design conflict resolution strategy. Step 6: Implement cache invalidation and refetching.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Trade-offs" }],
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
                      text: "Optimistic updates: Better UX but requires rollback logic. Offline queue: Better resilience but adds complexity. Stale-while-revalidate: Faster perceived performance but may show stale data. Fresh-only: Always current but slower. Conflict resolution: Last-write-wins is simple but may lose data; Operational transforms are complex but preserve all changes.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Common Mistakes" }],
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
                      text: "1) Mixing server and client state. 2) Not handling optimistic update rollbacks. 3) Ignoring offline scenarios. 4) Not implementing conflict resolution. 5) Over-caching or under-caching. 6) Not invalidating cache after mutations.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Mini Case Study" }],
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
                      text: "Collaborative document editor: Real-time updates → WebSocket for server state sync. Optimistic updates → Immediate UI feedback. Offline support → Queue mutations, replay on reconnect. Conflict resolution → Operational transforms for concurrent edits. Cache strategy → Stale-while-revalidate for document content. Result: Responsive UI with offline support and conflict-free collaboration.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "3D Mental Model" }],
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
                      text: "The 3D Practice demo visualizes state synchronization and async orchestration. In 3D mode, you'll see:",
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
                      children: [
                        {
                          children: [
                            {
                              text: "How server state and client cache synchronize (cache updates, server responses, conflicts)",
                            },
                          ],
                          direction: "ltr",
                          format: "",
                          indent: 0,
                          type: "text",
                          version: 1,
                        },
                      ],
                      direction: "ltr",
                      format: "",
                      indent: 0,
                      type: "listitem",
                      version: 1,
                    },
                    {
                      children: [
                        {
                          children: [
                            {
                              text: "The flow of optimistic updates and rollbacks when mutations fail",
                            },
                          ],
                          direction: "ltr",
                          format: "",
                          indent: 0,
                          type: "text",
                          version: 1,
                        },
                      ],
                      direction: "ltr",
                      format: "",
                      indent: 0,
                      type: "listitem",
                      version: 1,
                    },
                    {
                      children: [
                        {
                          children: [
                            {
                              text: "How offline queue manages mutations and replays them when connectivity returns",
                            },
                          ],
                          direction: "ltr",
                          format: "",
                          indent: 0,
                          type: "text",
                          version: 1,
                        },
                      ],
                      direction: "ltr",
                      format: "",
                      indent: 0,
                      type: "listitem",
                      version: 1,
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "list",
                  listType: "bullet",
                  version: 1,
                },
                {
                  children: [{ text: "Try this in Practice:" }],
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
                      text: "1. Enable 3D mode in the Practice demo. 2. Make a mutation with optimistic updates enabled and watch the state pipeline. 3. Set network to offline and queue mutations, then go online to see replay. 4. Adjust failure rate and observe rollback behavior. 5. Switch cache modes and see how stale-while-revalidate works. 6. Review the EventLog to understand the complete state flow.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Interview Q&A" }],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "heading",
                  tag: "h2",
                  version: 1,
                },
                {
                  children: [{ text: "Q: When should you use optimistic updates?" }],
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
                      text: "A: Use optimistic updates for mutations that are likely to succeed and where immediate feedback improves UX (likes, comments, form submissions). Avoid for critical operations (payments, deletions) or when rollback is complex. Always implement proper rollback logic.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Q: How do you handle conflicts in offline scenarios?" }],
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
                      text: "A: Use version numbers or timestamps to detect conflicts. When conflicts occur, choose a resolution strategy: last-write-wins (simple, may lose data), merge (combine changes when possible), or operational transforms (preserve all changes, complex). For most apps, last-write-wins with user notification is sufficient.",
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
              label: "React Query: Server State Management",
              url: "https://tanstack.com/query/latest",
              note: "TanStack Query patterns for server state (placeholder - verify content)",
              claimIds: "server-state",
            },
            {
              label: "SWR: Stale-While-Revalidate",
              url: "https://swr.vercel.app/",
              note: "SWR caching strategy documentation (placeholder - verify content)",
              claimIds: "swr",
            },
            {
              label: "MDN: Service Workers",
              url: "https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API",
              note: "Service Workers for offline support (placeholder - verify content)",
              claimIds: "offline",
            },
          ],
          practiceDemo: stateAtScaleDemoConfig,
          practiceSteps: [
            {
              title: "Explore Server State vs Client State",
              body: "Notice the Cache & Server State panel showing both cached value and server value. The cache represents what the client knows, while server value is the source of truth. Try clicking Refetch to sync them.",
              focusTarget: "cache.panel",
            },
            {
              title: "Understand Optimistic Updates",
              body: "With Optimistic Updates enabled, click 'Edit Value', enter a new value, and click 'Save Mutation'. Watch the timeline - the UI updates immediately (OPTIMISTIC_APPLY) before the server confirms.",
              focusTarget: "timeline",
            },
            {
              title: "Observe Cache Behavior",
              body: "After a successful mutation, watch the cache panel update. The cache status changes from stale to fresh, and the cached value matches the server value. Check the cache events below to see the flow.",
              focusTarget: "cache.panel",
            },
            {
              title: "Test Failure and Rollback",
              body: "Increase the Failure Rate slider to ~30%, then try saving a mutation. When the server rejects it, you'll see a rollback - the optimistic update is reverted, and the UI returns to the previous state.",
              focusTarget: "timeline",
            },
            {
              title: "Experience Offline Queue",
              body: "Set Network to OFFLINE, then try saving a mutation. Notice it gets added to the Offline Queue with status 'queued'. The UI updates optimistically, but the mutation waits in the queue.",
              focusTarget: "queue.panel",
            },
            {
              title: "Watch Queue Replay",
              body: "While offline, add a mutation to the queue. Then set Network back to ONLINE. Watch the queue item change from 'queued' → 'replaying' → 'acked' (or 'failed' if it fails). The mutation replays automatically.",
              focusTarget: "queue.panel",
            },
            {
              title: "Compare Cache Modes",
              body: "Switch Cache Mode between 'Fresh Only' and 'Stale-While-Revalidate'. In SWR mode, you'll see the cache serve stale data immediately while revalidating in the background. Check the event log for details.",
              focusTarget: "cache.panel",
            },
            {
              title: "Review Event Log",
              body: "Scroll through the event log to see a chronological record of all state changes, cache updates, and queue operations. This helps you understand the complete flow of state management operations.",
              focusTarget: null,
            },
          ],
          practiceTasks: [
            {
              prompt: "Given offline + optimistic ON, what should user see after clicking Save?",
              expectedAnswer: "The user should see the UI update immediately with the new value (optimistic update), and the mutation should be added to the offline queue with status 'queued'. When the network comes back online, the mutation will automatically replay and update the server.",
              explanation: "Optimistic updates provide immediate feedback even when offline. The mutation is queued for later replay, ensuring it eventually reaches the server when connectivity is restored.",
            },
            {
              prompt: "If server rejects mutation, what happens to UI and cache?",
              expectedAnswer: "If optimistic updates are enabled, the UI rolls back to the previous cached value. The cache remains unchanged (still has the old value). If optimistic updates are disabled, the UI never changed in the first place, so there's nothing to rollback.",
              explanation: "Rollback is necessary when optimistic updates are enabled because the UI was updated before server confirmation. The cache must remain consistent with the server's actual state.",
            },
            {
              prompt: "When is SWR beneficial and what's the trade-off?",
              expectedAnswer: "SWR (Stale-While-Revalidate) is beneficial when you want to show content immediately (from cache) while fetching fresh data in the background. The trade-off is that users might briefly see stale data, but they get faster perceived performance and the cache updates automatically.",
              explanation: "SWR prioritizes perceived performance by serving cached content immediately. Users see data faster, but there's a brief period where the data might be slightly outdated. For most use cases, this trade-off is acceptable and improves user experience.",
            },
          ],
        },
      });
      console.log("✓ Created Resource 3 topic (state-management-at-scale)");
    } else {
      console.log("✓ Resource 3 topic already exists");
    }

    // Check if Resource 4 topic exists
    const existingTopic4 = await payload.find({
      collection: "topics",
      where: {
        slug: {
          equals: "performance-system-design",
        },
      },
      limit: 1,
    });

    if (existingTopic4.docs.length === 0) {
      const performanceBudgetLabDemoConfig = {
        demoType: "performanceBudgetLab",
        defaults: {
          network: "FAST_4G",
          device: "DESKTOP",
          jsKb: 200,
          cssKb: 50,
          imageMode: "UNOPTIMIZED_JPEG",
          imageCount: 6,
          video: "NONE",
          caching: "NONE",
          loading: "DEFAULT",
          longTaskMs: 0,
          clsRisk: "LOW",
        },
        rules: [],
      };

      await payload.create({
        collection: "topics",
        data: {
          title: "Performance System Design",
          slug: "performance-system-design",
          order: 4,
          difficulty: "intermediate",
          summary:
            "Learn how to measure and optimize web performance using Core Web Vitals, loading strategies, bundle optimization, caching, image/video optimization, and main-thread performance. Understand the trade-offs in performance budgets.",
          theory: {
            root: {
              children: [
                {
                  children: [{ text: "What You Will Learn" }],
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
                      text: "By the end of this topic, you will understand Core Web Vitals (LCP, INP, CLS), loading strategies, bundle optimization, caching strategies, image/video optimization, and main-thread performance. You'll learn to measure performance, set performance budgets, and optimize for real-world user experience.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Prerequisites" }],
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
                      text: "Understanding of HTML, CSS, JavaScript, basic knowledge of HTTP, browser DevTools, and web performance concepts. Familiarity with build tools helpful but not required.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Mental Model" }],
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
                      text: "Simple: Performance = how fast the page loads and responds. Core Web Vitals measure real user experience. Deep: Performance involves multiple layers: network (latency, bandwidth), rendering (HTML parsing, CSS, JS execution), and runtime (main thread, memory). Each layer has optimization strategies. Performance budgets help prioritize optimizations. The goal is optimizing for real users on real devices and networks.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Core Concepts" }],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "heading",
                  tag: "h2",
                  version: 1,
                },
                {
                  children: [{ text: "Core Web Vitals" }],
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
                      text: "Core Web Vitals are metrics that measure real-world user experience. LCP (Largest Contentful Paint) measures loading performance, INP (Interaction to Next Paint) measures interactivity, and CLS (Cumulative Layout Shift) measures visual stability.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Loading Strategies" }],
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
                      text: "Loading strategies like preloading key assets, deferring non-critical JavaScript, and route-based code splitting can significantly improve performance by prioritizing critical resources and reducing initial bundle size.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Caching Strategies" }],
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
                      text: "Effective caching at the browser, CDN, and application levels reduces load times for repeat visits. Understanding cache headers and invalidation strategies is essential for optimal performance.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Image and Video Optimization" }],
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
                      text: "Modern image formats (WebP, AVIF) provide better compression than JPEG. Responsive images with proper sizing reduce wasted bandwidth. Video optimization involves format selection and lazy loading strategies.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Main Thread Performance" }],
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
                      text: "Long tasks that block the main thread degrade interactivity. Breaking up heavy JavaScript work, using web workers, and optimizing bundle sizes help maintain responsive user experiences.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Design Process" }],
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
                      text: "Step 1: Measure current performance (Core Web Vitals, Lighthouse). Step 2: Set performance budgets (bundle size, LCP, INP targets). Step 3: Identify bottlenecks (network, rendering, runtime). Step 4: Optimize loading (code splitting, preloading, lazy loading). Step 5: Optimize assets (images, fonts, videos). Step 6: Optimize runtime (reduce main thread work, use workers). Step 7: Monitor and maintain budgets.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Trade-offs" }],
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
                      text: "Bundle size vs code splitting: Smaller bundles load faster but may require more requests. Caching vs freshness: Aggressive caching improves performance but may show stale content. Image quality vs size: Higher quality looks better but loads slower. Preloading vs lazy loading: Preloading improves perceived performance but uses bandwidth upfront.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Common Mistakes" }],
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
                      text: "1) Optimizing for synthetic metrics only (Lighthouse) without real user monitoring. 2) Not setting performance budgets. 3) Over-optimizing one metric while ignoring others. 4) Not considering mobile devices and slow networks. 5) Ignoring third-party script impact. 6) Not measuring performance in production.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Mini Case Study" }],
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
                      text: "E-commerce product page: Large images → WebP format, responsive images, lazy loading. Heavy JavaScript → Code splitting, route-based chunks. Third-party scripts → Defer non-critical, load asynchronously. Result: LCP improved from 4.2s to 1.8s, INP from 350ms to 120ms, bundle size reduced 40% through code splitting.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "3D Mental Model" }],
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
                      text: "The 3D Practice demo visualizes performance budgets and optimization strategies. In 3D mode, you'll see:",
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
                      children: [
                        {
                          children: [
                            {
                              text: "How bundle size, loading strategies, and caching affect Core Web Vitals",
                            },
                          ],
                          direction: "ltr",
                          format: "",
                          indent: 0,
                          type: "text",
                          version: 1,
                        },
                      ],
                      direction: "ltr",
                      format: "",
                      indent: 0,
                      type: "listitem",
                      version: 1,
                    },
                    {
                      children: [
                        {
                          children: [
                            {
                              text: "The relationship between performance budgets and actual metrics",
                            },
                          ],
                          direction: "ltr",
                          format: "",
                          indent: 0,
                          type: "text",
                          version: 1,
                        },
                      ],
                      direction: "ltr",
                      format: "",
                      indent: 0,
                      type: "listitem",
                      version: 1,
                    },
                    {
                      children: [
                        {
                          children: [
                            {
                              text: "How different optimization strategies impact loading timeline and interactivity",
                            },
                          ],
                          direction: "ltr",
                          format: "",
                          indent: 0,
                          type: "text",
                          version: 1,
                        },
                      ],
                      direction: "ltr",
                      format: "",
                      indent: 0,
                      type: "listitem",
                      version: 1,
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "list",
                  listType: "bullet",
                  version: 1,
                },
                {
                  children: [{ text: "Try this in Practice:" }],
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
                      text: "1. Enable 3D mode in the Practice demo. 2. Adjust bundle size and observe impact on LCP and INP. 3. Change loading strategies (preload, lazy load) and see timeline changes. 4. Modify cache settings and observe performance improvements. 5. Set performance budgets and see which optimizations help meet targets. 6. Review the EventLog to understand optimization impact.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Interview Q&A" }],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "heading",
                  tag: "h2",
                  version: 1,
                },
                {
                  children: [{ text: "Q: How do you prioritize performance optimizations?" }],
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
                      text: "A: Start with Core Web Vitals (LCP, INP, CLS) as they directly impact user experience and SEO. Measure real user metrics, not just Lighthouse. Set performance budgets. Optimize the biggest bottlenecks first (usually images, JavaScript bundles, third-party scripts). Use the 80/20 rule: 20% of optimizations often provide 80% of the benefit.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Q: What's the trade-off between bundle size and code splitting?" }],
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
                      text: "A: Smaller bundles load faster but code splitting adds HTTP requests and may delay interactivity if chunks load sequentially. Balance: Split large chunks (>200KB), keep critical path small, use route-based splitting, preload critical chunks. Too much splitting can hurt performance due to request overhead.",
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
              label: "Web.dev: Core Web Vitals",
              url: "https://web.dev/vitals/",
              note: "Core Web Vitals documentation (placeholder - verify content)",
              claimIds: "core-web-vitals",
            },
            {
              label: "Web.dev: Optimize Images",
              url: "https://web.dev/fast/#optimize-your-images",
              note: "Image optimization best practices (placeholder - verify content)",
              claimIds: "image-optimization",
            },
            {
              label: "MDN: Performance",
              url: "https://developer.mozilla.org/en-US/docs/Web/Performance",
              note: "Web performance fundamentals (placeholder - verify content)",
              claimIds: "performance-fundamentals",
            },
          ],
          practiceDemo: performanceBudgetLabDemoConfig,
          practiceSteps: [
            {
              title: "Explore LCP Drivers",
              body: "Adjust the Image Mode and Image Count controls to see how they affect LCP (Largest Contentful Paint). Notice how AVIF and responsive images reduce loading time compared to unoptimized JPEG.",
              focusTarget: "metrics",
            },
            {
              title: "Understand Image Optimization",
              body: "Switch between JPEG, WebP, and AVIF formats while keeping image count constant. Observe how modern formats significantly improve LCP by reducing image byte size.",
              focusTarget: "waterfall",
            },
            {
              title: "Test Caching Impact",
              body: "Change the Caching setting from None to CDN or Browser. Notice how caching improves repeat-visit performance (though first visit is unchanged). Check the event log for caching events.",
              focusTarget: "cache.panel",
            },
            {
              title: "Explore Loading Strategies",
              body: "Try different Loading Strategy options (Preload key asset, Defer noncritical, Route split). Watch how they affect INP (Interaction to Next Paint) by reducing JavaScript blocking time.",
              focusTarget: "controls.js",
            },
            {
              title: "Observe Main Thread Blocking",
              body: "Increase the Long Task slider and watch how it affects INP. Long tasks block the main thread and delay user interactions. Notice the visual representation in the Main Thread panel.",
              focusTarget: "mainthread",
            },
            {
              title: "Understand CLS Risk",
              body: "Change the CLS Risk setting and observe how it affects the CLS score. High CLS risk typically comes from images without dimensions or dynamic content insertion causing layout shifts.",
              focusTarget: "metrics",
            },
            {
              title: "Analyze Waterfall Breakdown",
              body: "Adjust multiple controls (JS size, CSS size, images) and watch the waterfall breakdown update. This shows how different resources contribute to total load time.",
              focusTarget: "waterfall",
            },
            {
              title: "Review Event Log",
              body: "Scroll through the event log to see a chronological record of all performance changes and their impacts. This helps you understand cause-and-effect relationships in performance optimization.",
              focusTarget: "eventlog",
            },
          ],
          practiceTasks: [
            {
              prompt:
                "Bring LCP under 2500ms by adjusting only images and caching. What combination of settings achieves this?",
              expectedAnswer:
                "Use AVIF format (or WebP), reduce image count if possible, and enable CDN or Browser caching. AVIF provides the best compression, reducing image loading time significantly. Caching helps on repeat visits.",
              explanation:
                "LCP is primarily driven by image loading time for image-heavy pages. Modern formats like AVIF can reduce image size by 50-70% compared to JPEG. Caching reduces network requests on subsequent visits.",
            },
            {
              prompt:
                "Improve INP without changing images. What strategies work best?",
              expectedAnswer:
                "Reduce JavaScript bundle size, use Route Split loading strategy, defer non-critical JavaScript, and minimize long tasks. Smaller JS bundles parse and execute faster, improving interactivity.",
              explanation:
                "INP measures responsiveness to user interactions. JavaScript parsing, execution, and long tasks block the main thread, delaying responses. Code splitting and deferring non-critical JS reduces blocking time.",
            },
            {
              prompt:
                "What UI patterns cause CLS and how can you prevent them?",
              expectedAnswer:
                "Common CLS causes include: images without width/height attributes, dynamically inserted content, fonts with incorrect fallbacks, and ads/embeds without reserved space. Prevent by: setting image dimensions, using aspect-ratio CSS, reserving space for dynamic content, and using font-display: swap with proper fallbacks.",
              explanation:
                "CLS measures visual stability. Layout shifts occur when elements move after initial render, often due to missing dimensions or content loading asynchronously. Setting explicit dimensions and reserving space prevents shifts.",
            },
          ],
        },
      });
      console.log("✓ Created Resource 4 topic (performance-system-design)");
    } else {
      console.log("✓ Resource 4 topic already exists");
    }

    // Check if Resource 5 topic exists
    const existingTopic5 = await payload.find({
      collection: "topics",
      where: {
        slug: {
          equals: "component-ui-architecture",
        },
      },
      limit: 1,
    });

    if (existingTopic5.docs.length === 0) {
      const uiArchitectureLabDemoConfig = {
        demoType: "uiArchitectureLab",
        defaults: {
          mode: "TOKENS",
          tokenSetName: "Light",
          showTokenDiff: false,
          integrationType: "ROUTE_BASED",
          sharedUI: false,
          strictContractChecking: false,
          sharedDepsSingleton: true,
          sharedDepsStrictVersion: false,
          network: "FAST",
          preloadRemotes: false,
        },
        tokens: {
          tokenSets: [
            {
              name: "Light",
              tokens: {
                color: {
                  bg: "#ffffff",
                  fg: "#1f2937",
                  accent: "#3b82f6",
                },
                radius: {
                  sm: "4px",
                  md: "8px",
                  lg: "12px",
                },
                space: {
                  "1": "4px",
                  "2": "8px",
                  "3": "16px",
                },
                font: {
                  size: {
                    sm: "12px",
                    md: "16px",
                    lg: "24px",
                  },
                },
              },
            },
            {
              name: "Dark",
              tokens: {
                color: {
                  bg: "#1f2937",
                  fg: "#f9fafb",
                  accent: "#60a5fa",
                },
                radius: {
                  sm: "4px",
                  md: "8px",
                  lg: "12px",
                },
                space: {
                  "1": "4px",
                  "2": "8px",
                  "3": "16px",
                },
                font: {
                  size: {
                    sm: "12px",
                    md: "16px",
                    lg: "24px",
                  },
                },
              },
            },
            {
              name: "Brand A",
              tokens: {
                color: {
                  bg: "#fef3c7",
                  fg: "#92400e",
                  accent: "#f59e0b",
                },
                radius: {
                  sm: "6px",
                  md: "12px",
                  lg: "16px",
                },
                space: {
                  "1": "6px",
                  "2": "12px",
                  "3": "24px",
                },
                font: {
                  size: {
                    sm: "14px",
                    md: "18px",
                    lg: "28px",
                  },
                },
              },
            },
          ],
          components: ["Button", "Card", "Input", "Badge"],
          diffRules: [
            {
              tokenPath: "color.accent",
              highlightColor: "#3b82f6",
            },
            {
              tokenPath: "radius.md",
              highlightColor: "#10b981",
            },
          ],
        },
        microfrontends: {
          mfes: [
            {
              name: "Checkout MFE",
              routes: ["/checkout", "/checkout/review", "/checkout/complete"],
              ownedComponents: ["CheckoutForm", "PaymentForm", "OrderSummary"],
              apiContracts: ["POST /api/checkout", "GET /api/orders/:id"],
            },
            {
              name: "Product MFE",
              routes: ["/products", "/products/:id"],
              ownedComponents: ["ProductList", "ProductDetail", "ProductCard"],
              apiContracts: ["GET /api/products", "GET /api/products/:id"],
            },
            {
              name: "User MFE",
              routes: ["/profile", "/settings"],
              ownedComponents: ["UserProfile", "SettingsForm"],
              apiContracts: ["GET /api/user", "PUT /api/user"],
            },
          ],
          integration: "ROUTE_BASED",
          sharedUI: false,
          riskNotes: [
            "Route-based integration reduces runtime coupling but requires coordination on routes.",
            "Shared UI library reduces inconsistency but adds coupling risk.",
            "Component-based integration increases runtime coupling but enables better composition.",
          ],
        },
        moduleFederation: {
          remotes: [
            {
              name: "checkout",
              exposes: ["./CheckoutForm", "./PaymentForm"],
              deps: ["react", "react-dom"],
            },
            {
              name: "products",
              exposes: ["./ProductList", "./ProductDetail"],
              deps: ["react", "react-dom", "react-query"],
            },
            {
              name: "user",
              exposes: ["./UserProfile"],
              deps: ["react", "react-dom"],
            },
          ],
          sharedDeps: [
            {
              pkg: "react",
              singleton: true,
              strictVersion: false,
            },
            {
              pkg: "react-dom",
              singleton: true,
              strictVersion: false,
            },
            {
              pkg: "react-query",
              singleton: false,
              strictVersion: false,
            },
          ],
          rules: [
            {
              sharedDepsSingleton: true,
              sharedDepsStrictVersion: false,
              network: "FAST",
              preloadRemotes: false,
              estimatedBundleKb: {
                host: 150,
                remotes: {
                  checkout: 80,
                  products: 120,
                  user: 60,
                },
              },
              duplicationKb: 0,
              loadOrderEvents: [
                "Host loads",
                "Shared deps resolved (singleton)",
                "Remote 'checkout' loaded",
                "Remote 'products' loaded",
                "Remote 'user' loaded",
              ],
              pitfalls: [
                "React singleton ensures single runtime; safe for hooks.",
              ],
            },
            {
              sharedDepsSingleton: false,
              sharedDepsStrictVersion: false,
              network: "FAST",
              preloadRemotes: false,
              estimatedBundleKb: {
                host: 150,
                remotes: {
                  checkout: 120,
                  products: 180,
                  user: 100,
                },
              },
              duplicationKb: 280,
              loadOrderEvents: [
                "Host loads",
                "React duplicated in host",
                "React duplicated in 'checkout'",
                "React duplicated in 'products'",
                "Risk: Multiple React instances may cause hooks issues",
              ],
              pitfalls: [
                "React not singleton → duplicated runtime; risk of hooks mismatch.",
              ],
            },
            {
              sharedDepsSingleton: true,
              sharedDepsStrictVersion: true,
              network: "FAST",
              preloadRemotes: false,
              estimatedBundleKb: {
                host: 150,
                remotes: {
                  checkout: 80,
                  products: 120,
                  user: 60,
                },
              },
              duplicationKb: 0,
              loadOrderEvents: [
                "Host loads",
                "Shared deps resolved (singleton, strict version)",
                "Version check passed",
                "Remote 'checkout' loaded",
                "Remote 'products' loaded",
              ],
              pitfalls: [
                "Strict version may block remote if version mismatch.",
              ],
            },
            {
              sharedDepsSingleton: true,
              sharedDepsStrictVersion: false,
              network: "SLOW",
              preloadRemotes: false,
              estimatedBundleKb: {
                host: 150,
                remotes: {
                  checkout: 80,
                  products: 120,
                  user: 60,
                },
              },
              duplicationKb: 0,
              loadOrderEvents: [
                "Host loads",
                "Slow network detected",
                "Waiting for shared deps...",
                "Remote 'checkout' loading (slow)",
                "Remote 'products' loading (slow)",
              ],
              pitfalls: [
                "Slow network increases load time; consider preloading.",
              ],
            },
            {
              sharedDepsSingleton: true,
              sharedDepsStrictVersion: false,
              network: "FAST",
              preloadRemotes: true,
              estimatedBundleKb: {
                host: 150,
                remotes: {
                  checkout: 80,
                  products: 120,
                  user: 60,
                },
              },
              duplicationKb: 0,
              loadOrderEvents: [
                "Host loads",
                "Preloading remotes...",
                "Remote 'checkout' preloaded",
                "Remote 'products' preloaded",
                "Remote 'user' preloaded",
                "Faster initial render, but higher initial bandwidth",
              ],
              pitfalls: [
                "Preloading improves perceived performance but uses more bandwidth upfront.",
              ],
            },
          ],
        },
      };

      await payload.create({
        collection: "topics",
        data: {
          title: "Component & UI Architecture: Design Systems, Theming, Tokens, Micro-frontends, and Module Federation Trade-offs",
          slug: "component-ui-architecture",
          order: 5,
          difficulty: "intermediate",
          summary:
            "Learn how to architect component systems using design tokens, implement theming, understand micro-frontend boundaries, and evaluate Module Federation trade-offs. Master design system propagation, MFE integration patterns, and shared dependency management.",
          theory: {
            root: {
              children: [
                {
                  children: [{ text: "Component & UI Architecture" }],
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
                      text: "Building scalable UI systems requires understanding design tokens, theming strategies, micro-frontend architecture, and Module Federation patterns. This topic covers how to structure component libraries, manage design systems, and make integration decisions.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Design Systems & Tokens" }],
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
                      text: "Design tokens are the atomic values that define a design system (colors, spacing, typography, etc.). Tokens enable consistent theming and make it easy to switch between themes or brand variants. When tokens change, components automatically update across the system.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Micro-frontends" }],
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
                      text: "Micro-frontends break large applications into smaller, independently deployable frontend applications. Route-based integration routes traffic to different MFEs, while component-based integration composes components at runtime. Each approach has trade-offs in coupling, deployment independence, and complexity.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Module Federation" }],
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
                      text: "Module Federation enables runtime sharing of code between independently built applications. Key decisions include singleton vs. non-singleton shared dependencies, strict version checking, and preloading strategies. Misconfiguration can lead to duplication, bundle size increases, and runtime conflicts.",
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
              label: "Design Tokens Community Group",
              url: "https://www.w3.org/community/design-tokens/",
              note: "Design tokens specification (placeholder - verify content)",
              claimIds: "design-tokens",
            },
            {
              label: "Module Federation Documentation",
              url: "https://module-federation.io/",
              note: "Module Federation patterns and trade-offs (placeholder - verify content)",
              claimIds: "module-federation",
            },
            {
              label: "Micro-frontends.org",
              url: "https://micro-frontends.org/",
              note: "Micro-frontend architecture patterns (placeholder - verify content)",
              claimIds: "micro-frontends",
            },
          ],
          practiceDemo: uiArchitectureLabDemoConfig,
          practiceSteps: [
            {
              title: "Explore Design Tokens",
              body: "Use the Mode selector to switch to 'Tokens' mode. Select different token sets (Light, Dark, Brand A) from the dropdown and watch how the Design System Preview updates automatically. Notice how all components (Button, Card, Input, Badge) reflect the token changes.",
              focusTarget: "tokens.preview",
            },
            {
              title: "View Token Changes",
              body: "Enable 'Show token diff' to see a detailed view of which tokens changed between sets. Notice how changing from Light to Dark updates color tokens, while Brand A also changes radius and spacing. This demonstrates how tokens propagate through the system.",
              focusTarget: "tokens.diff",
            },
            {
              title: "Understand Micro-frontend Boundaries",
              body: "Switch to 'Micro-frontends' mode. Click on different routes or components to see which MFE owns them. Notice how each MFE has distinct routes, components, and API contracts. This visualization helps understand ownership and integration seams.",
              focusTarget: "mfe.map",
            },
            {
              title: "Compare Integration Types",
              body: "Toggle between Route-based and Component-based integration. Route-based integration assigns whole routes to MFEs, while component-based allows composing components at runtime. Observe how this affects coupling and deployment independence.",
              focusTarget: "mfe.map",
            },
            {
              title: "Explore Shared UI Trade-offs",
              body: "Toggle 'Shared UI library' on and off. With shared UI enabled, MFEs share design system components, reducing inconsistency but adding coupling. Consider when shared UI is worth the coupling risk.",
              focusTarget: "mfe.map",
            },
            {
              title: "Understand Module Federation Architecture",
              body: "Switch to 'Module Federation' mode. The visualization shows the Host and Remotes. Notice how shared dependencies are configured (singleton, strict version). The duplication meter shows how misconfiguration leads to bundle size increases.",
              focusTarget: "mf.graph",
            },
            {
              title: "Experiment with Shared Dependency Settings",
              body: "Toggle 'Shared deps singleton' off and observe how duplication increases. This happens because each remote bundles its own copy of React. Turn it back on to see duplication drop to zero. Singleton ensures a single React runtime, critical for hooks.",
              focusTarget: "mf.graph",
            },
            {
              title: "Test Strict Version Checking",
              body: "Enable 'Strict version' and observe the trade-off: strict versioning prevents version mismatches but may block remotes if versions don't align. This is a balance between safety and flexibility.",
              focusTarget: "mf.graph",
            },
            {
              title: "Review Event Log",
              body: "Scroll through the event log to see a chronological record of all changes and their impacts. This helps you understand cause-and-effect relationships in UI architecture decisions.",
              focusTarget: null,
            },
          ],
          practiceTasks: [
            {
              prompt:
                "A large organization has multiple independent teams working on different parts of the application (checkout, products, user profile). Each team needs to deploy independently and use a shared design system. Should you use route-based or component-based micro-frontend integration? Justify your choice.",
              expectedAnswer:
                "Route-based integration is better for this scenario. Independent teams and independent deployments benefit from route-based boundaries because each team owns entire routes, reducing runtime coupling. The shared design system can still be distributed via a shared UI library, but teams maintain deployment independence. Component-based integration would increase runtime coupling and complicate deployment coordination.",
              explanation:
                "Route-based integration provides clear ownership boundaries (each team owns specific routes) and enables true deployment independence. While component-based integration offers better composition, it increases runtime coupling and requires more coordination. For large orgs with independent teams, route-based is the safer choice.",
            },
            {
              prompt:
                "In a Module Federation setup, you notice that disabling 'shared deps singleton' causes duplication. React is duplicated 280KB across remotes. What are the risks of this duplication, and when might you accept it?",
              expectedAnswer:
                "The main risk is multiple React instances causing hooks to fail (React hooks must use the same React instance). This can lead to runtime errors. However, if you're confident all remotes use the same React version and you want complete isolation (e.g., for experimentation), non-singleton might be acceptable. In practice, React should almost always be singleton due to hooks.",
              explanation:
                "React hooks require a single React instance. Multiple instances can cause 'Invalid hook call' errors. While duplication increases bundle size, the bigger risk is runtime incompatibility. Only use non-singleton if you have a specific need for isolation and can guarantee version compatibility.",
            },
            {
              prompt:
                "Your design system needs to support three brand variants (Light, Dark, Brand A) that differ in colors, spacing, and typography. How would you structure design tokens to enable easy switching while maintaining consistency?",
              expectedAnswer:
                "Structure tokens hierarchically by category (color, spacing, typography). Each brand variant defines complete token sets. When switching themes, update the root token context/provider, and all components automatically receive new tokens. Use CSS custom properties or a theme provider pattern. Components should reference tokens (e.g., tokens.color.accent) not hardcoded values.",
              explanation:
                "Design tokens should be organized by category and referenced by components, not hardcoded. When switching themes, update the token context/provider at the root, and changes propagate automatically. This ensures consistency and makes theme switching trivial.",
            },
          ],
        },
      });
      console.log("✓ Created Resource 5 topic (component-ui-architecture)");
    } else {
      console.log("✓ Resource 5 topic already exists");
    }

    // Check if Resource 6 topic exists
    const existingTopic6 = await payload.find({
      collection: "topics",
      where: {
        slug: {
          equals: "deployment-delivery",
        },
      },
      limit: 1,
    });

    if (existingTopic6.docs.length === 0) {
      const releaseDeliveryLabDemoConfig = {
        demoType: "releaseDeliveryLab",
        defaults: {
          stageMode: ["PIPELINE", "FLAGS_AB", "CANARY_ROLLBACK", "CDN_EDGE"],
          trafficPercent: 10,
          errorRateNew: 0.05,
          latencyNewMs: 200,
          flagEnabled: false,
          abSplit: 50,
          targeting: "ALL",
          cacheTTLSeconds: 60,
          cacheInvalidation: "NONE",
          edgeCompute: false,
        },
        pipelineEvents: [
          "Build stage: compiling TypeScript",
          "Unit tests: 150 tests passed",
          "Integration tests: 12 tests passed",
          "E2E tests: 8 tests passed",
          "Deploy: assets uploaded to CDN",
        ],
        rolloutEvents: [
          "Canary at 10% → monitor metrics",
          "Threshold breached → recommend rollback",
        ],
        cdnEvents: [
          "TTL=300 → higher hit rate but risk stale HTML",
          "Versioned assets → safe caching for static assets",
        ],
        metrics: {
          errorRate: 0.02,
          latencyMs: 180,
          cacheHitRate: 0.7,
        },
        notes: [
          "Pipeline stages must pass before deployment",
          "Feature flags enable gradual rollout",
          "Canary deployments reduce risk",
          "CDN caching improves performance but requires invalidation strategy",
        ],
      };

      await payload.create({
        collection: "topics",
        data: {
          title: "Deployment & Delivery for Frontend Systems",
          slug: "deployment-delivery",
          order: 6,
          difficulty: "intermediate",
          summary:
            "Learn CI/CD pipelines, feature flags, A/B testing, canary rollouts, rollback strategies, CDN caching, and edge computing. Master deployment and delivery patterns for frontend systems.",
          theory: {
            root: {
              children: [
                {
                  children: [{ text: "Deployment & Delivery for Frontend Systems" }],
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
                      text: "Effective deployment and delivery strategies are crucial for frontend systems. This topic covers CI/CD pipelines, feature flags, A/B testing, canary rollouts, rollback mechanisms, CDN strategies, and edge computing.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "CI/CD Pipelines" }],
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
                      text: "Continuous Integration and Continuous Deployment pipelines automate the build, test, and deployment process. Stages typically include build, unit tests, integration tests, E2E tests, and deployment. Each stage must pass before proceeding to the next.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Feature Flags & A/B Testing" }],
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
                      text: "Feature flags enable gradual feature rollouts and A/B testing. They allow you to control which users see which features, enabling safe experimentation and gradual releases. Targeting can be based on user attributes, geography, or user segments.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Canary Rollouts & Rollback" }],
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
                      text: "Canary rollouts gradually shift traffic from the stable version to a new version, starting with a small percentage. SLO (Service Level Objective) checks monitor error rates and latency. If thresholds are breached, rollback shifts all traffic back to the stable version.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "CDN Strategy & Edge Computing" }],
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
                      text: "CDN (Content Delivery Network) caching improves performance by serving content from edge locations closer to users. Cache TTL (Time To Live) controls how long content is cached. Invalidation strategies (purge path, versioned assets) ensure users receive fresh content after deployments. Edge computing enables running code at CDN edge locations for even faster responses.",
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
              label: "Web.dev: CI/CD for Frontend",
              url: "https://web.dev/",
              note: "CI/CD best practices for frontend (placeholder - verify content)",
              claimIds: "cicd",
            },
            {
              label: "Feature Flags Best Practices",
              url: "https://featureflags.io/",
              note: "Feature flag patterns and A/B testing (placeholder - verify content)",
              claimIds: "feature-flags",
            },
            {
              label: "CDN Caching Strategies",
              url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching",
              note: "HTTP caching and CDN strategies (placeholder - verify content)",
              claimIds: "cdn-caching",
            },
          ],
          practiceDemo: releaseDeliveryLabDemoConfig,
          practiceSteps: [
            {
              title: "Explore CI/CD Pipeline",
              body: "Switch to the Pipeline mode. Toggle 'Run tests' and 'Visual regression gate' on/off, then click 'Run pipeline'. Watch the animated pipeline stages progress from Build → Unit → Integration → E2E → Deploy. Notice how disabling tests shows a risk warning but doesn't fail the build.",
              focusTarget: "pipeline",
            },
            {
              title: "Understand Feature Flags & A/B Testing",
              body: "Switch to Flags & A/B mode. Enable the feature flag and adjust the A/B split slider. Change the targeting selector (ALL, MOBILE_ONLY, COUNTRY_IN, BETA_USERS). Watch the traffic routing visualization update and see how targeting affects which users receive variant B.",
              focusTarget: "traffic",
            },
            {
              title: "Experiment with Canary Rollout",
              body: "Switch to Canary & Rollback mode. Adjust the traffic percentage, error rate, and latency sliders. Click 'Start canary' to begin the rollout. Watch the SLO check indicator - if error rate exceeds 10% or latency exceeds 500ms, it will show FAIL and recommend rollback.",
              focusTarget: "metrics",
            },
            {
              title: "Test Rollback",
              body: "After starting a canary, if metrics breach thresholds, click 'Rollback'. Watch the traffic visualization animate back to 100% v1 (stable). The event log will record the rollback action.",
              focusTarget: "metrics",
            },
            {
              title: "Understand CDN Caching",
              body: "Switch to CDN & Edge mode. Adjust the Cache TTL slider and observe how it affects cache hit rate. Click 'Request asset' multiple times to see cache HIT vs MISS events in the log. Higher TTL = higher hit rate but risk of stale content.",
              focusTarget: "cdn.map",
            },
            {
              title: "Test Cache Invalidation Strategies",
              body: "Change the Invalidation strategy (None, Purge path, Versioned assets) and click 'Deploy new build'. Notice how different strategies affect cache behavior. Versioned assets ensure correctness without purging, while purge path clears cache but requires coordination.",
              focusTarget: "cdn.map",
            },
            {
              title: "Compare Invalidation Approaches",
              body: "Try deploying with 'None' invalidation - you'll see a stale content risk warning. Switch to 'Versioned assets' and deploy again - this shows safe caching without purging. Understand when each strategy is appropriate.",
              focusTarget: "cdn.map",
            },
            {
              title: "Review Event Log",
              body: "Scroll through the event log to see a chronological record of all pipeline runs, feature flag changes, canary rollouts, rollbacks, and CDN operations. This helps you understand the complete deployment and delivery workflow.",
              focusTarget: null,
            },
          ],
          practiceTasks: [
            {
              prompt:
                "Design a safe rollout plan for a risky UI change that affects the checkout flow. What combination of feature flags, canary rollout, and monitoring would you use?",
              expectedAnswer:
                "Use feature flags to enable the change for a small beta user segment first. Then use canary rollout starting at 5% traffic, gradually increasing to 10%, 25%, 50%, and 100% over several hours. Monitor error rates, latency, and checkout completion rates. Set SLO thresholds (e.g., error rate < 1%, latency < 300ms, checkout completion > 95%). If any threshold is breached, immediately rollback. Feature flags provide instant kill switch, canary provides gradual exposure.",
              explanation:
                "Risky changes require multiple safety layers. Feature flags enable instant rollback without redeployment. Canary rollout limits blast radius. Gradual traffic increase allows monitoring at each stage. SLO thresholds provide objective criteria for rollback decisions.",
            },
            {
              prompt:
                "Choose a caching strategy for static assets (JS, CSS, images) and ISR-like HTML pages. What TTL and invalidation strategy would you use for each?",
              expectedAnswer:
                "Static assets (JS, CSS, images): Use versioned assets (content-based hashing) with long TTL (e.g., 1 year). This enables aggressive caching since versioned URLs change when content changes, ensuring correctness without purging. ISR-like HTML: Use shorter TTL (e.g., 60-300 seconds) with background revalidation. For deployments, use purge path invalidation for affected routes. Versioned assets don't work for HTML since URLs are fixed.",
              explanation:
                "Static assets benefit from versioned URLs because the URL changes when content changes, enabling safe long-term caching. HTML pages have fixed URLs, so they need TTL-based caching with invalidation on deploy. ISR provides background revalidation to keep content fresh while serving cached versions.",
            },
            {
              prompt:
                "When should you use canary rollout vs feature flags? What are the trade-offs?",
              expectedAnswer:
                "Use feature flags for: instant rollback without redeployment, A/B testing, gradual user exposure (beta users → all users), and feature toggling. Use canary rollout for: infrastructure changes, dependency updates, performance-sensitive changes, and when you need traffic-based gradual exposure. Trade-offs: Feature flags add code complexity and require flag management. Canary rollouts require infrastructure support and monitoring. Feature flags are better for feature-level control, canary is better for version-level control.",
              explanation:
                "Feature flags and canary rollouts serve different purposes. Feature flags provide feature-level control and instant rollback, ideal for new features and A/B testing. Canary rollouts provide version-level gradual exposure, ideal for infrastructure and performance changes. Both can be used together for maximum safety.",
            },
          ],
        },
      });
      console.log("✓ Created Resource 6 topic (deployment-delivery)");
    } else {
      console.log("✓ Resource 6 topic already exists");
    }

    // Check if Resource 7 topic exists
    const existingTopic7 = await payload.find({
      collection: "topics",
      where: {
        slug: {
          equals: "testing-strategy",
        },
      },
      limit: 1,
    });

    if (existingTopic7.docs.length === 0) {
      const testingStrategyLabDemoConfig = {
        demoType: "testingStrategyLab",
        defaults: {
          mode: "PYRAMID",
          teamSize: "MEDIUM",
          releaseCadence: "DAILY",
          apiChange: "NONE",
          consumerStrictness: "STRICT",
          baseline: {
            layout: "A",
            color: "A",
            spacing: "A",
          },
          current: {
            layout: "A",
            color: "A",
            spacing: "A",
          },
        },
        rules: [
          {
            teamSize: "SMALL",
            releaseCadence: "WEEKLY",
            recommendedMix: {
              unitPct: 60,
              integrationPct: 30,
              e2ePct: 10,
            },
            pyramidNotes: [
              "Small teams benefit from higher unit test coverage for fast feedback.",
              "Weekly releases allow time for integration tests.",
              "Minimal E2E tests focus on critical user flows.",
            ],
            eventLines: [
              "Small team + weekly cadence → prioritize unit tests for fast feedback.",
            ],
          },
          {
            teamSize: "SMALL",
            releaseCadence: "DAILY",
            recommendedMix: {
              unitPct: 70,
              integrationPct: 20,
              e2ePct: 10,
            },
            pyramidNotes: [
              "Daily releases require fast feedback - unit tests are fastest.",
              "Reduced integration tests to maintain speed.",
              "E2E tests kept minimal to avoid flakiness slowing releases.",
            ],
            eventLines: [
              "Small team + daily cadence → maximize unit tests, minimize slower tests.",
            ],
          },
          {
            teamSize: "MEDIUM",
            releaseCadence: "WEEKLY",
            recommendedMix: {
              unitPct: 50,
              integrationPct: 35,
              e2ePct: 15,
            },
            pyramidNotes: [
              "Medium teams can balance all test types effectively.",
              "Weekly cadence allows comprehensive integration testing.",
              "E2E tests cover key user journeys without slowing releases.",
            ],
            eventLines: [
              "Medium team + weekly cadence → balanced test pyramid.",
            ],
          },
          {
            teamSize: "MEDIUM",
            releaseCadence: "DAILY",
            recommendedMix: {
              unitPct: 60,
              integrationPct: 30,
              e2ePct: 10,
            },
            pyramidNotes: [
              "Daily releases favor unit tests for speed.",
              "Integration tests remain important for API contracts.",
              "E2E tests limited to prevent flakiness from blocking releases.",
            ],
            eventLines: [
              "Medium team + daily cadence → unit-heavy with solid integration coverage.",
            ],
          },
          {
            teamSize: "LARGE",
            releaseCadence: "WEEKLY",
            recommendedMix: {
              unitPct: 40,
              integrationPct: 40,
              e2ePct: 20,
            },
            pyramidNotes: [
              "Large teams need integration tests to catch cross-team issues.",
              "Weekly cadence allows comprehensive E2E coverage.",
              "More E2E tests increase confidence but require maintenance.",
            ],
            eventLines: [
              "Large team + weekly cadence → balanced pyramid with more E2E coverage.",
            ],
          },
          {
            teamSize: "LARGE",
            releaseCadence: "DAILY",
            recommendedMix: {
              unitPct: 50,
              integrationPct: 35,
              e2ePct: 15,
            },
            pyramidNotes: [
              "Daily releases in large teams require fast feedback.",
              "Integration tests catch cross-team contract issues.",
              "E2E tests focus on critical paths to avoid blocking releases.",
            ],
            eventLines: [
              "Large team + daily cadence → balanced mix with emphasis on speed.",
            ],
          },
          {
            teamSize: "LARGE",
            releaseCadence: "CONTINUOUS",
            recommendedMix: {
              unitPct: 60,
              integrationPct: 30,
              e2ePct: 10,
            },
            pyramidNotes: [
              "Continuous deployment requires fastest feedback loops.",
              "Unit tests provide immediate feedback on code changes.",
              "Minimal E2E tests prevent flakiness from blocking deployments.",
            ],
            eventLines: [
              "Large team + continuous cadence → unit-heavy for speed, minimal E2E.",
            ],
          },
        ],
        contractRules: [
          {
            apiChange: "NONE",
            contractResult: {
              pass: true,
              breakingReasons: [],
            },
            eventLines: ["No API changes → contract check passes."],
          },
          {
            apiChange: "ADD_FIELD",
            consumerStrictness: "LENIENT",
            contractResult: {
              pass: true,
              breakingReasons: [],
            },
            eventLines: [
              "Adding field → backward compatible, lenient consumer accepts.",
            ],
          },
          {
            apiChange: "ADD_FIELD",
            consumerStrictness: "STRICT",
            contractResult: {
              pass: true,
              breakingReasons: [],
            },
            eventLines: [
              "Adding field → backward compatible, strict consumer accepts.",
            ],
          },
          {
            apiChange: "REMOVE_FIELD",
            consumerStrictness: "LENIENT",
            contractResult: {
              pass: true,
              breakingReasons: [],
            },
            eventLines: [
              "Removing field → lenient consumer ignores missing fields, passes.",
            ],
          },
          {
            apiChange: "REMOVE_FIELD",
            consumerStrictness: "STRICT",
            contractResult: {
              pass: false,
              breakingReasons: [
                "Field 'name' was removed but consumer requires it.",
                "Strict schema validation fails on missing required field.",
              ],
            },
            eventLines: [
              "Removing field → breaking for strict consumer, fails contract check.",
            ],
          },
          {
            apiChange: "RENAME_FIELD",
            consumerStrictness: "LENIENT",
            contractResult: {
              pass: false,
              breakingReasons: [
                "Field 'name' renamed to 'fullName' - consumer expects 'name'.",
              ],
            },
            eventLines: [
              "Renaming field → breaking change, lenient consumer still fails.",
            ],
          },
          {
            apiChange: "RENAME_FIELD",
            consumerStrictness: "STRICT",
            contractResult: {
              pass: false,
              breakingReasons: [
                "Field 'name' renamed to 'fullName' - consumer requires 'name'.",
                "Strict schema validation fails on missing field.",
              ],
            },
            eventLines: [
              "Renaming field → breaking for strict consumer, fails contract check.",
            ],
          },
          {
            apiChange: "TYPE_CHANGE",
            consumerStrictness: "LENIENT",
            contractResult: {
              pass: false,
              breakingReasons: [
                "Field 'id' type changed from string to number - type mismatch.",
              ],
            },
            eventLines: [
              "Type change → breaking change, lenient consumer fails on type mismatch.",
            ],
          },
          {
            apiChange: "TYPE_CHANGE",
            consumerStrictness: "STRICT",
            contractResult: {
              pass: false,
              breakingReasons: [
                "Field 'id' type changed from string to number - consumer expects string.",
                "Strict schema validation fails on type mismatch.",
              ],
            },
            eventLines: [
              "Type change → breaking for strict consumer, fails contract check.",
            ],
          },
        ],
        visualRules: [
          {
            visualDiff: {
              changed: [],
              severity: "LOW",
            },
            eventLines: ["No visual changes detected."],
          },
          {
            baseline: { layout: "A", color: "A", spacing: "A" },
            current: { layout: "B", color: "A", spacing: "A" },
            visualDiff: {
              changed: ["layout"],
              severity: "HIGH",
            },
            eventLines: [
              "Layout changed → likely breaking visual regression for key pages.",
            ],
          },
          {
            baseline: { layout: "A", color: "A", spacing: "A" },
            current: { layout: "A", color: "B", spacing: "A" },
            visualDiff: {
              changed: ["color"],
              severity: "LOW",
            },
            eventLines: [
              "Color changed → low severity, may be intentional design update.",
            ],
          },
          {
            baseline: { layout: "A", color: "A", spacing: "A" },
            current: { layout: "A", color: "A", spacing: "B" },
            visualDiff: {
              changed: ["spacing"],
              severity: "MEDIUM",
            },
            eventLines: [
              "Spacing changed → medium severity, may affect layout on different screen sizes.",
            ],
          },
          {
            baseline: { layout: "A", color: "A", spacing: "A" },
            current: { layout: "B", color: "B", spacing: "B" },
            visualDiff: {
              changed: ["layout", "color", "spacing"],
              severity: "HIGH",
            },
            eventLines: [
              "Multiple visual changes → high severity, likely breaking regression.",
            ],
          },
        ],
      };

      await payload.create({
        collection: "topics",
        data: {
          title: "Testing Strategy for Frontend Systems",
          slug: "testing-strategy",
          order: 7,
          difficulty: "intermediate",
          summary:
            "Learn unit, integration, E2E testing trade-offs, contract testing for API compatibility, and visual regression testing. Master testing strategies that balance speed, confidence, and maintenance.",
          theory: {
            root: {
              children: [
                {
                  children: [
                    { text: "Testing Strategy for Frontend Systems" },
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
                      text: "Effective testing strategies balance speed, confidence, and maintenance. This topic covers the test pyramid (unit/integration/E2E), contract testing for API compatibility, and visual regression testing.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Test Pyramid" }],
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
                      text: "The test pyramid recommends a mix of unit tests (fast, many), integration tests (moderate speed, moderate count), and E2E tests (slow, few). Team size and release cadence influence the optimal mix. Small teams with daily releases favor unit tests for speed. Large teams with weekly releases can afford more E2E tests for confidence.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Contract Testing" }],
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
                      text: "Contract testing ensures API compatibility between consumers and providers. It detects breaking changes like field removal, renaming, or type changes. Strict consumers fail on missing fields, while lenient consumers may ignore missing optional fields. Contract tests catch breaking changes before deployment.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Visual Regression Testing" }],
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
                      text: "Visual regression testing compares baseline screenshots with current renders to detect unintended visual changes. Layout changes are high severity (likely breaking), spacing changes are medium severity (may affect responsive design), and color changes are low severity (may be intentional). Severity determines whether to block releases.",
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
              label: "Testing Trophy and Test Pyramid",
              url: "https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications",
              note: "Test pyramid and testing classifications (placeholder - verify content)",
              claimIds: "test-pyramid",
            },
            {
              label: "Contract Testing with Pact",
              url: "https://docs.pact.io/",
              note: "Contract testing patterns and tools (placeholder - verify content)",
              claimIds: "contract-testing",
            },
            {
              label: "Visual Regression Testing",
              url: "https://www.chromatic.com/docs/visual-testing",
              note: "Visual regression testing strategies (placeholder - verify content)",
              claimIds: "visual-regression",
            },
          ],
          practiceDemo: testingStrategyLabDemoConfig,
          practiceSteps: [
            {
              title: "Explore Test Pyramid",
              body: "Switch to Pyramid mode. Adjust the Team Size and Release Cadence selectors. Watch the animated pyramid segments (Unit, Integration, E2E) morph to show the recommended test mix. Notice how small teams with daily releases favor unit tests, while large teams with weekly releases can afford more E2E tests. Read the trade-off notes below the pyramid.",
              focusTarget: "pyramid",
            },
            {
              title: "Understand Trade-offs",
              body: "Change team size from Small to Large while keeping release cadence at Daily. Observe how the pyramid shifts - more E2E tests increase confidence but slow feedback and increase flakiness risk. The event log records the reasoning for each recommendation.",
              focusTarget: "pyramid",
            },
            {
              title: "Experiment with Release Cadence",
              body: "Keep team size at Medium and switch between Weekly, Daily, and Continuous release cadence. Notice how faster cadences favor unit tests for speed, while slower cadences allow more comprehensive integration and E2E coverage.",
              focusTarget: "pyramid",
            },
            {
              title: "Test Contract Checking",
              body: "Switch to Contract mode. Select different API changes (None, Add Field, Remove Field, Rename Field, Type Change) and consumer strictness (Lenient, Strict). Click 'Run contract check' to see if the contract passes or fails. Watch the animated flow from Consumer Schema → Contract → Provider Response.",
              focusTarget: "contract.flow",
            },
            {
              title: "Understand Breaking Changes",
              body: "Try 'Remove Field' with 'Strict' consumer - this should fail because strict consumers require all fields. Then try 'Remove Field' with 'Lenient' consumer - this passes because lenient consumers ignore missing fields. Understand when breaking changes occur.",
              focusTarget: "contract.flow",
            },
            {
              title: "Explore Visual Regression",
              body: "Switch to Visual Regression mode. Adjust the Baseline and Current state dropdowns (Layout, Color, Spacing). Click 'Compare' to see the visual diff. Notice how layout changes are marked as HIGH severity, spacing as MEDIUM, and color as LOW.",
              focusTarget: "visual.diff",
            },
            {
              title: "Test Visual Diff Severity",
              body: "Change only the Layout from A to B in Current (keep Baseline at A). Click Compare - this shows HIGH severity. Then change Layout back to A and change only Color to B. Click Compare - this shows LOW severity. Understand how different visual changes have different severity levels.",
              focusTarget: "visual.diff",
            },
            {
              title: "Review Event Log",
              body: "Scroll through the event log to see a chronological record of all pyramid recommendations, contract checks, and visual comparisons. This helps you understand how testing strategies adapt to team size, release cadence, API changes, and visual regressions.",
              focusTarget: "eventlog",
            },
          ],
          practiceTasks: [
            {
              prompt:
                "Pick a test mix for daily releases and large team. Justify your choice considering speed, confidence, and maintenance trade-offs.",
              expectedAnswer:
                "For daily releases with a large team, I recommend: 50% unit tests, 35% integration tests, 15% E2E tests. Justification: Daily releases require fast feedback, so unit tests (50%) provide immediate validation. Large teams need integration tests (35%) to catch cross-team contract issues. E2E tests (15%) focus on critical paths to avoid flakiness blocking releases. This balances speed (unit-heavy) with confidence (integration for contracts) while minimizing maintenance (limited E2E).",
              explanation:
                "Daily releases favor speed, so unit tests dominate. Large teams need integration tests for cross-team compatibility. E2E tests are kept minimal to prevent flakiness from blocking fast releases. The mix balances all three concerns.",
            },
            {
              prompt:
                "Handle API rename without breaking consumers. Propose steps for a safe migration.",
              expectedAnswer:
                "Steps: 1) Add new field alongside old field (additive change, backward compatible). 2) Update consumers to use new field gradually. 3) Monitor contract tests to ensure both fields work. 4) Once all consumers migrated, mark old field as deprecated. 5) After deprecation period, remove old field. This uses additive changes (non-breaking) followed by gradual migration, avoiding breaking changes that fail contract tests.",
              explanation:
                "API renames are breaking changes. The safe approach is additive: add new field, migrate consumers gradually, then remove old field. Contract tests catch breaking changes, so additive changes pass while renames fail.",
            },
            {
              prompt:
                "Decide if visual diff severity warrants blocking the release. When would you block vs allow?",
              expectedAnswer:
                "Block release for: HIGH severity (layout changes) on critical pages (checkout, login, payment) - these likely break user flows. Allow with review for: HIGH severity on non-critical pages, MEDIUM severity (spacing) that may be intentional responsive design improvements, LOW severity (color) that may be intentional design updates. Decision factors: page criticality, whether change is intentional, impact on user flows, and whether visual diff matches expected design changes.",
              explanation:
                "Severity alone isn't enough - page criticality and intent matter. Layout changes on critical pages are blocking. Spacing and color changes may be intentional and non-blocking. Always consider context.",
            },
          ],
        },
      });
      console.log("✓ Created Resource 7 topic (testing-strategy)");
    } else {
      console.log("✓ Resource 7 topic already exists");
    }

    // Check if Resource 8 topic exists
    const existingTopic8 = await payload.find({
      collection: "topics",
      where: {
        slug: {
          equals: "observability",
        },
      },
      limit: 1,
    });

    if (existingTopic8.docs.length === 0) {
      const observabilityLabDemoConfig = {
        demoType: "observabilityLab",
        defaults: {
          mode: "PIPELINE",
          signal: "LOG",
          sampleRate: 1.0,
          redactPII: false,
          replayEnabled: false,
          errorType: "NONE",
          boundaryStrategy: "NONE",
          volume: "LOW",
        },
        pipelineSteps: [
          {
            step: "Capture",
            status: "PENDING",
            note: "Client captures event",
          },
          {
            step: "Buffer",
            status: "PENDING",
            note: "Events buffered locally",
          },
          {
            step: "Send",
            status: "PENDING",
            note: "Events sent to backend",
          },
          {
            step: "Ingest",
            status: "PENDING",
            note: "Backend ingests events",
          },
          {
            step: "Store",
            status: "PENDING",
            note: "Events stored in database",
          },
          {
            step: "Query",
            status: "PENDING",
            note: "Events queryable via API",
          },
          {
            step: "Alert",
            status: "PENDING",
            note: "Alerts triggered if needed",
          },
        ],
        droppedEventsPct: 0,
        privacyNotes: [],
        errorFlow: [
          {
            phase: "crash",
            uiState: "Error occurred",
            note: "Component throws error",
          },
          {
            phase: "fallback",
            uiState: "Fallback UI shown",
            note: "Error boundary catches and shows fallback",
          },
          {
            phase: "retry",
            uiState: "User clicks retry",
            note: "User attempts recovery",
          },
          {
            phase: "recover",
            uiState: "UI recovered",
            note: "Error cleared, normal operation resumed",
          },
          {
            phase: "current",
            uiState: "Normal",
            note: "Current state",
          },
        ],
        recommendedSetup: [
          "Use traces for latency root-cause analysis",
          "Use metrics for performance monitoring",
          "Use logs for debugging and audit trails",
          "Set sample rate based on volume and cost constraints",
          "Enable PII redaction for production logs",
          "Use widget-level boundaries to minimize blast radius",
        ],
        eventLines: [
          "Event captured and sent through pipeline",
          "Pipeline processes event through all stages",
        ],
      };

      await payload.create({
        collection: "topics",
        data: {
          title: "Observability for Frontend Systems",
          slug: "observability",
          order: 8,
          difficulty: "intermediate",
          summary:
            "Learn logging, metrics, tracing, session replay considerations, error boundaries, and monitoring strategy. Master observability patterns that balance debugging capability, cost, and privacy.",
          theory: {
            root: {
              children: [
                {
                  children: [{ text: "Observability for Frontend Systems" }],
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
                      text: "Observability enables understanding system behavior through logs, metrics, and traces. This topic covers telemetry pipeline design, sampling and privacy trade-offs, error boundaries, and monitoring strategies.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Logs, Metrics, and Traces" }],
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
                      text: "Logs are high-cardinality text messages useful for debugging and audit trails. Metrics are aggregated numerical values (counters, gauges) useful for performance monitoring. Traces are distributed request flows with spans showing parent/child relationships, useful for latency root-cause analysis. Each signal type serves different purposes in the observability stack.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Telemetry Pipeline" }],
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
                      text: "The telemetry pipeline flows from client capture → local buffering → network send → backend ingest → storage → query → alerting. Each stage can introduce latency, buffering, or failures. Design the pipeline to handle high volume, network failures, and cost constraints.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Sampling and Privacy" }],
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
                      text: "Sampling reduces telemetry volume and cost but may miss rare errors. Sample rates (0-1) determine what percentage of events are kept. PII redaction masks sensitive fields (email, phone, SSN) in logs but reduces debugging detail. Session replay captures user interactions for debugging but requires GDPR compliance and sensitive field masking.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Error Boundaries" }],
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
                      text: "Error boundaries catch render errors and event handler errors in React components. Widget-level boundaries contain errors to specific components, minimizing blast radius. Page-level boundaries catch errors for entire pages. Async errors (promises, setTimeout) are not automatically caught by boundaries and must be reported manually. Recovery flows: crash → fallback UI → retry → recover.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Monitoring Strategy" }],
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
                      text: "Effective monitoring combines logs (debugging), metrics (performance), and traces (latency analysis). Set up alerts for error rates, latency p95/p99, and critical user flows. Use sampling to balance cost and coverage. Enable PII redaction for production. Use error boundaries strategically to minimize blast radius and maintain user experience.",
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
              label: "OpenTelemetry Documentation",
              url: "https://opentelemetry.io/docs/",
              note: "OpenTelemetry observability standards (placeholder - verify content)",
              claimIds: "opentelemetry",
            },
            {
              label: "React Error Boundaries",
              url: "https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary",
              note: "React error boundary patterns (placeholder - verify content)",
              claimIds: "error-boundaries",
            },
            {
              label: "Session Replay Privacy",
              url: "https://www.datadoghq.com/knowledge-center/session-replay/privacy/",
              note: "Session replay privacy considerations (placeholder - verify content)",
              claimIds: "session-replay",
            },
          ],
          practiceDemo: observabilityLabDemoConfig,
          practiceSteps: [
            {
              title: "Explore Telemetry Pipeline",
              body: "Switch to Pipeline mode. Select different signal types (Log, Metric, Trace) and click 'Send Event' to see events flow through the pipeline: Capture → Buffer → Send → Ingest → Store → Query → Alert. Notice how different signal types have different visual tags. Try 'Burst x10' to see multiple events flowing simultaneously.",
              focusTarget: "pipeline",
            },
            {
              title: "Understand Signal Types",
              body: "Switch between Log, Metric, and Trace signals. Logs are high-cardinality messages useful for debugging. Metrics are aggregated counters/gauges useful for performance monitoring. Traces are spans with parent/child relationships useful for latency root-cause analysis. The event log explains when to use each type.",
              focusTarget: "pipeline",
            },
            {
              title: "Experiment with Volume",
              body: "Change the Volume selector (Low, Medium, High) and send events. Higher volume increases pipeline load and may affect processing speed. Observe how the pipeline handles different volumes.",
              focusTarget: "pipeline",
            },
            {
              title: "Explore Sampling",
              body: "Switch to Sampling & Privacy mode. Adjust the Sample Rate slider (0-100%). Watch the visualization show kept events (green) vs dropped events (red). Lower sample rates reduce cost but may miss rare errors. The dropped percentage shows the trade-off.",
              focusTarget: "sampling",
            },
            {
              title: "Understand Privacy Trade-offs",
              body: "Toggle 'Redact PII' on and off. When enabled, PII fields (email, phone, SSN) are redacted in logs - safer but less debugging detail. Toggle 'Session Replay Enabled' - when enabled, a privacy risk badge appears with guidance notes. Session replay captures user interactions and requires GDPR compliance.",
              focusTarget: "privacy.panel",
            },
            {
              title: "Test Error Boundaries",
              body: "Switch to Error Boundaries mode. Select an error type (Render Error, Event Handler Error, Async Error) and a boundary strategy (None, Page Boundary, Widget Boundary). Click 'Trigger Error' to see how errors are handled. Notice how widget boundaries contain errors to specific components while page boundaries catch entire pages.",
              focusTarget: "error.sim",
            },
            {
              title: "Compare Boundary Strategies",
              body: "Try different boundary strategies with the same error type. 'None' shows an uncaught error that crashes the page. 'Page Boundary' shows a page-level fallback UI. 'Widget Boundary' shows a widget-level fallback while other widgets continue working. Widget boundaries minimize blast radius.",
              focusTarget: "error.sim",
            },
            {
              title: "Test Recovery Flow",
              body: "After triggering an error, click 'Retry' to see the recovery flow: crash → fallback → retry → recover. The error flow visualization shows each phase. Notice how async errors require manual reporting since boundaries don't catch them automatically.",
              focusTarget: "error.sim",
            },
            {
              title: "Review Event Log",
              body: "Scroll through the event log to see a chronological record of all pipeline events, sampling changes, privacy toggles, and error handling. This helps you understand how observability decisions affect debugging capability, cost, and privacy.",
              focusTarget: "eventlog",
            },
          ],
          practiceTasks: [
            {
              prompt:
                "Pick a signal type for measuring checkout latency. Explain why you chose that signal type and how it helps with root-cause analysis.",
              expectedAnswer:
                "I would use Traces for measuring checkout latency. Traces show distributed request flows with spans that have parent/child relationships, making it easy to identify which part of the checkout flow (API call, database query, payment gateway) is causing latency. Traces provide end-to-end visibility across services, unlike logs (which are point-in-time messages) or metrics (which are aggregated values without context). For root-cause analysis, traces show the exact path and timing of each operation in the checkout flow.",
              explanation:
                "Traces are ideal for latency root-cause analysis because they show the full request flow with timing for each span. Logs and metrics don't provide the same end-to-end context needed to identify which specific operation in a distributed system is causing latency.",
            },
            {
              prompt:
                "Set sampling and redaction for a high-volume app. Justify your trade-offs between cost, debugging capability, and privacy.",
              expectedAnswer:
                "For a high-volume app, I would set: Sample Rate: 0.1 (10%) to reduce cost while still capturing enough events for debugging. Redact PII: ON for production to protect user privacy and comply with GDPR. Trade-offs: Lower sample rate (10%) reduces cost significantly but may miss rare errors (90% of events dropped). PII redaction protects privacy but reduces debugging detail - I'd use a separate debug environment with redaction OFF for detailed investigation. For critical errors, I'd use a higher sample rate (50-100%) or targeted sampling based on error type.",
              explanation:
                "High-volume apps require sampling to manage cost. 10% sample rate balances cost reduction with coverage. PII redaction is essential for production privacy compliance. The trade-off is managed by using different configurations for production (redacted, sampled) vs debug environments (full logs, higher sampling).",
            },
            {
              prompt:
                "Choose boundary placement to minimize blast radius. When would you use widget-level vs page-level boundaries?",
              expectedAnswer:
                "I would use widget-level boundaries for most components to minimize blast radius. Widget boundaries contain errors to specific components, allowing the rest of the page to continue working. Use page-level boundaries only for critical single-purpose pages (like checkout) where an error in any component should show a fallback for the entire page. Widget boundaries are preferred because they: 1) Minimize blast radius (only the failing widget shows fallback), 2) Maintain user experience (other widgets continue working), 3) Allow partial page functionality. Page boundaries are appropriate when the entire page is a single cohesive flow that shouldn't continue if any part fails.",
              explanation:
                "Widget-level boundaries minimize blast radius by containing errors to specific components. Page-level boundaries are appropriate for critical single-purpose flows. The choice depends on whether the page can function partially (use widget boundaries) or must function as a whole (use page boundaries).",
            },
          ],
        },
      });
      console.log("✓ Created Resource 8 topic (observability)");
    } else {
      console.log("✓ Resource 8 topic already exists");
    }

    // Check if Resource 9 topic exists
    const existingTopic9 = await payload.find({
      collection: "topics",
      where: {
        slug: {
          equals: "security-privacy",
        },
      },
      limit: 1,
    });

    if (existingTopic9.docs.length === 0) {
      const securityPrivacyLabDemoConfig = {
        demoType: "securityPrivacyLab",
        defaults: {
          mode: "XSS_CSRF",
          threat: "XSS",
          defense: {
            inputEncoding: false,
            sanitizeHtml: false,
            sameSite: "NONE",
            csrfToken: false,
          },
          csp: {
            scriptSrc: "NONE",
            connectSrc: "SELF",
            frameAncestors: "NONE",
          },
          tokenStorage: "LOCAL_STORAGE",
          refreshFlow: false,
          clickjackingDefense: "NONE",
          deps: [
            { name: "react", version: "18.2.0", risk: "LOW" },
            { name: "lodash", version: "4.17.21", risk: "MEDIUM" },
          ],
          piiMode: "RAW",
        },
        allowedOrBlocked: [
          {
            action: "render user comment",
            result: "ALLOW",
            reason: "No XSS defenses enabled - unsafe content may execute",
          },
        ],
        riskSummary: {
          severity: "HIGH",
          notes: ["XSS vulnerability: no input encoding or sanitization"],
        },
        eventLines: [
          "Security configuration initialized",
          "Default settings applied - review defenses",
        ],
      };

      await payload.create({
        collection: "topics",
        data: {
          title: "Security & Privacy for Frontend Systems",
          slug: "security-privacy",
          order: 9,
          difficulty: "intermediate",
          summary:
            "Learn XSS/CSRF defenses, CSP policies, token storage trade-offs, clickjacking prevention, dependency risk management, and PII handling. Master security patterns that protect users and comply with privacy regulations.",
          theory: {
            root: {
              children: [
                {
                  children: [{ text: "Security & Privacy for Frontend Systems" }],
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
                      text: "Frontend security protects users from attacks like XSS and CSRF. Privacy practices ensure compliance with regulations like GDPR. This topic covers defense mechanisms, token storage strategies, Content Security Policy, clickjacking prevention, dependency risk management, and PII handling.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "XSS and CSRF Defenses" }],
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
                      text: "Cross-Site Scripting (XSS) occurs when untrusted input is rendered without sanitization, allowing attackers to execute scripts in user browsers. Defenses include input encoding (HTML entities), HTML sanitization (removing dangerous tags), and Content Security Policy. Cross-Site Request Forgery (CSRF) occurs when malicious sites trigger authenticated requests. Defenses include SameSite cookies (Lax/Strict), CSRF tokens (server-validated), and origin checking.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Content Security Policy (CSP)" }],
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
                      text: "CSP restricts resource loading (scripts, styles, images, connections) to prevent XSS and data exfiltration. script-src controls script sources ('self', CDN whitelist, 'unsafe-inline' - dangerous). connect-src controls fetch/XMLHttpRequest destinations. frame-ancestors prevents clickjacking by controlling who can embed your page. Start restrictive and relax incrementally. 'unsafe-inline' defeats XSS protection.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Token Storage Trade-offs" }],
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
                      text: "HttpOnly cookies are not accessible to JavaScript, reducing XSS token theft risk but requiring CSRF/SameSite considerations. localStorage is accessible to XSS but not sent automatically (lower CSRF risk). Memory storage (in-memory variables) has no persistence but requires refresh flow for token renewal. Choose based on XSS risk, CSRF risk, and refresh requirements.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Clickjacking Prevention" }],
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
                      text: "Clickjacking embeds your page in an iframe to trick users into clicking hidden elements. Defenses: X-Frame-Options: DENY (legacy, simple) or CSP frame-ancestors 'none'/'self' (modern, flexible). Use CSP frame-ancestors for better control and compatibility.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "Dependency Risk Management" }],
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
                      text: "Dependencies introduce vulnerabilities through transitive deps and outdated packages. Risk levels: HIGH (known CVEs, unmaintained), MEDIUM (outdated, large surface area), LOW (up-to-date, minimal surface). Mitigation: regular audits (npm audit), pin versions (package-lock.json), reduce surface area (tree-shaking, minimal deps), review changelogs before updates, isolate risky deps when possible.",
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
                {
                  children: [{ text: "PII Handling and Privacy" }],
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
                      text: "Personally Identifiable Information (PII) includes email, phone, SSN, addresses. Raw storage has high breach impact. Redaction masks fields (u***@e***.com) but PII still present. Minimization removes fields entirely, reducing breach impact and compliance risk. GDPR-like principles: collect only what's needed, minimize retention, encrypt at rest, redact in logs, obtain consent for processing.",
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
              label: "OWASP Top 10",
              url: "https://owasp.org/www-project-top-ten/",
              note: "OWASP security risks and defenses (placeholder - verify content)",
              claimIds: "owasp",
            },
            {
              label: "Content Security Policy",
              url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
              note: "MDN CSP documentation (placeholder - verify content)",
              claimIds: "csp",
            },
            {
              label: "GDPR Compliance",
              url: "https://gdpr.eu/what-is-gdpr/",
              note: "GDPR privacy principles (placeholder - verify content)",
              claimIds: "gdpr",
            },
          ],
          practiceDemo: securityPrivacyLabDemoConfig,
          practiceSteps: [
            {
              title: "Explore XSS Defenses",
              body: "Switch to XSS/CSRF mode and select Threat: XSS. Toggle Input Encoding and Sanitize HTML defenses on/off. Watch the flow visualization show how untrusted input flows through defenses to rendered output. Try rendering a user comment with defenses OFF (ALLOW - unsafe) vs ON (BLOCK - safe). The event log explains how each defense prevents XSS.",
              focusTarget: "flow",
            },
            {
              title: "Understand CSRF Defenses",
              body: "Switch Threat to CSRF. Toggle SameSite (None/Lax/Strict) and CSRF Token. Watch the flow show how cross-site requests are blocked by SameSite or CSRF token validation. Try POST /transfer with defenses OFF (ALLOW - vulnerable) vs ON (BLOCK - protected). SameSite=Strict is strongest but may break legitimate cross-site flows.",
              focusTarget: "flow",
            },
            {
              title: "Configure CSP Policies",
              body: "Switch to CSP mode. Adjust script-src (none/self/self+CDN/unsafe-inline), connect-src (self/API only/any), and frame-ancestors (none/self/trusted). Watch the CSP visualizer show ALLOW/BLOCK for actions: load inline script, load script from CDN, fetch to api, embed in iframe. Notice how 'unsafe-inline' allows all inline scripts (dangerous). Restrictive CSP reduces attack surface.",
              focusTarget: "csp",
            },
            {
              title: "Compare Token Storage Options",
              body: "Switch to Token Storage mode. Compare HttpOnly Cookie (not accessible to JS, reduces XSS risk but requires CSRF/SameSite), localStorage (accessible to XSS, lower CSRF risk), and Memory (no persistence, requires refresh flow). The visualization shows XSS accessibility and CSRF risk for each option. Toggle Refresh Flow to see how memory storage requires token renewal.",
              focusTarget: "token.sim",
            },
            {
              title: "Test Clickjacking Defenses",
              body: "Switch to Clickjacking mode. Try different defenses: None (ALLOW - page can be embedded), X-Frame-Options: DENY (BLOCK - prevents embedding), CSP frame-ancestors (BLOCK - modern approach). The visualization shows how defenses block embedding attempts. Use CSP frame-ancestors for better control and compatibility.",
              focusTarget: "frame",
            },
            {
              title: "Assess Dependency Risk",
              body: "Switch to Dependencies mode. View the list of dependencies with risk levels (LOW/MEDIUM/HIGH). The risk summary shows overall severity and notes. High-risk deps should be isolated, evaluated for alternatives, or updated. Regular audits (npm audit) and version pinning reduce risk.",
              focusTarget: "deps",
            },
            {
              title: "Compare PII Handling Modes",
              body: "Switch to PII mode. Compare Raw (full PII visible - high breach impact), Redacted (masked fields - moderate risk), and Minimized (removed fields - low risk). Watch the event payload visualization show how PII changes in each mode. Minimization reduces breach impact and compliance risk. GDPR-like principles: collect only what's needed, minimize retention.",
              focusTarget: "pii",
            },
            {
              title: "Review Risk Summary",
              body: "Check the Risk Summary panel to see overall severity (LOW/MEDIUM/HIGH) and notes for the current configuration. Risk increases with missing defenses, permissive CSP, risky token storage, no clickjacking defense, high-risk dependencies, and raw PII. Adjust configurations to reduce risk.",
              focusTarget: "risk",
            },
            {
              title: "Review Event Log",
              body: "Scroll through the event log to see a chronological record of all security configuration changes, defense toggles, CSP updates, token storage changes, and risk assessments. This helps you understand how security decisions affect protection and compliance.",
              focusTarget: "eventlog",
            },
          ],
          practiceTasks: [
            {
              prompt:
                "Choose the best token storage for a SPA with high XSS risk. Justify your choice and explain the trade-offs.",
              expectedAnswer:
                "For a SPA with high XSS risk, I would use HttpOnly cookies for token storage. HttpOnly cookies are not accessible to JavaScript, which prevents XSS attacks from stealing tokens even if an XSS vulnerability exists. However, this requires CSRF protection (SameSite=Strict or CSRF tokens) since cookies are sent automatically. Trade-offs: HttpOnly cookies reduce XSS token theft risk significantly but require additional CSRF defenses. localStorage would be vulnerable to XSS (accessible to JavaScript), and memory storage requires a refresh flow which may not be suitable for SPAs.",
              explanation:
                "HttpOnly cookies are the best choice for high XSS risk because they prevent JavaScript access. The trade-off is requiring CSRF protection (SameSite or CSRF tokens) since cookies are sent automatically with requests.",
            },
            {
              prompt:
                "Design a CSP policy for an app that loads scripts from self + a trusted CDN. Explain which actions will be ALLOWED vs BLOCKED.",
              expectedAnswer:
                "I would set: script-src 'self' + CDN (SELF_CDN), connect-src 'self' + API (API_ONLY), frame-ancestors 'self'. This allows: loading scripts from self and the trusted CDN (ALLOW), loading inline scripts (BLOCK - unless 'unsafe-inline' is added, which is dangerous), fetching to same-origin API (ALLOW), fetching to third-party APIs (BLOCK), embedding page in same-origin iframe (ALLOW), embedding in cross-origin iframe (BLOCK). The policy balances security (blocks inline scripts and third-party connections) with functionality (allows trusted CDN scripts and same-origin operations).",
              explanation:
                "A restrictive CSP that allows self + trusted CDN scripts while blocking inline scripts and third-party connections provides good security. frame-ancestors 'self' prevents clickjacking from other origins while allowing same-origin embedding if needed.",
            },
            {
              prompt:
                "Pick defenses for form submission against CSRF. Explain why each defense works and when you'd use them together.",
              expectedAnswer:
                "I would use SameSite=Strict cookies + CSRF tokens together for defense-in-depth. SameSite=Strict blocks cross-site requests automatically at the browser level, preventing most CSRF attacks. CSRF tokens provide server-side validation - the server checks that the token in the form matches the token in the session, blocking requests without valid tokens. Use both together because: SameSite may not work in all browsers/contexts (legacy browsers, some redirect flows), and CSRF tokens provide server-side validation as a backup. SameSite alone is simpler but less reliable; CSRF tokens alone require implementation but work everywhere. Together they provide defense-in-depth.",
              explanation:
                "Defense-in-depth uses multiple layers (SameSite + CSRF tokens) to protect against CSRF. SameSite blocks at the browser level, CSRF tokens validate at the server level. Using both provides redundancy and better protection.",
            },
          ],
        },
      });
      console.log("✓ Created Resource 9 topic (security-privacy)");
    } else {
      console.log("✓ Resource 9 topic already exists");
    }

    // Check if Resource 10 topic exists
    const existingTopic10 = await payload.find({
      collection: "topics",
      where: {
        slug: {
          equals: "realtime-systems",
        },
      },
      limit: 1,
    });

    if (existingTopic10.docs.length === 0) {
      const realtimeSystemsLabDemoConfig = {
        demoType: "realtimeSystemsLab",
        defaults: {
          protocol: "SSE",
          network: "STABLE",
          msgRatePerSec: 10,
          payloadSize: "SMALL",
          backpressure: "NONE",
          batchWindowMs: 500,
          reconnectStrategy: "AUTO_RECONNECT",
          replayWindow: 50,
          syncModel: "PUSH_ONLY",
          conflictMode: "NONE",
        },
        rules: [
          {
            protocol: "SSE",
            flowEvents: [
              "SSE connection established",
              "Server sends event stream",
              "Client receives messages one-way",
              "Client updates via separate POST requests",
            ],
            droppedMsgsPct: 0,
            latencyMs: 50,
            bufferDepth: 0,
            conflictEvents: [],
            notes: [
              "SSE is server→client only; client updates are separate requests.",
              "SSE uses HTTP/1.1 long-polling; simpler than WebSocket but unidirectional.",
            ],
          },
          {
            protocol: "WEBSOCKET",
            flowEvents: [
              "WebSocket handshake (HTTP upgrade)",
              "Bidirectional channel established",
              "Messages flow both directions",
              "Full-duplex communication",
            ],
            droppedMsgsPct: 0,
            latencyMs: 30,
            bufferDepth: 0,
            conflictEvents: [],
            notes: [
              "WebSocket supports bidirectional communication.",
              "Lower latency than SSE due to persistent connection.",
            ],
          },
          {
            backpressure: "BATCH",
            flowEvents: [
              "Messages accumulate in batch buffer",
              "Batch window timer expires",
              "Batch delivered as single unit",
            ],
            droppedMsgsPct: 0,
            latencyMs: 500,
            bufferDepth: 5,
            conflictEvents: [],
            notes: [
              "Batching reduces overhead but increases latency within window.",
              "Trade-off: lower overhead vs higher latency.",
            ],
          },
          {
            backpressure: "THROTTLE",
            flowEvents: [
              "Incoming rate exceeds capacity",
              "Messages dropped when buffer full",
              "Rate clamped to prevent overflow",
            ],
            droppedMsgsPct: 15,
            latencyMs: 100,
            bufferDepth: 10,
            conflictEvents: [],
            notes: [
              "Throttling drops messages when buffer is full.",
              "Prevents memory overflow but loses messages.",
            ],
          },
          {
            backpressure: "DROP_OLD",
            flowEvents: [
              "Buffer reaches capacity",
              "Oldest message removed",
              "New message added",
            ],
            droppedMsgsPct: 5,
            latencyMs: 80,
            bufferDepth: 20,
            conflictEvents: [],
            notes: [
              "Drop old strategy removes oldest messages first.",
              "Preserves recent messages but loses historical data.",
            ],
          },
          {
            backpressure: "ACK_WINDOW",
            flowEvents: [
              "Messages sent with sequence IDs",
              "Client acks received messages",
              "Window slides as acks arrive",
            ],
            droppedMsgsPct: 0,
            latencyMs: 60,
            bufferDepth: 50,
            conflictEvents: [],
            notes: [
              "Ack window bounds memory but can drop if client too slow.",
              "Requires sequence IDs and ack mechanism.",
            ],
          },
          {
            reconnectStrategy: "AUTO_RECONNECT",
            flowEvents: [
              "Connection lost detected",
              "Reconnect attempts initiated",
              "Connection restored",
              "Stream resumes",
            ],
            droppedMsgsPct: 10,
            latencyMs: 100,
            bufferDepth: 0,
            conflictEvents: [],
            notes: [
              "Auto reconnect resumes stream but may miss messages during disconnect.",
            ],
          },
          {
            reconnectStrategy: "RECONNECT_WITH_REPLAY",
            flowEvents: [
              "Connection lost detected",
              "Last event ID stored",
              "Reconnect with lastEventId",
              "Server replays missed messages",
            ],
            droppedMsgsPct: 0,
            latencyMs: 120,
            bufferDepth: 0,
            conflictEvents: [],
            notes: [
              "Replay avoids missing messages after reconnect but needs cursor/ids.",
              "Requires server to maintain message history.",
            ],
          },
          {
            syncModel: "PUSH_PULL",
            flowEvents: [
              "Push updates from server",
              "Periodic pull refresh",
              "Ensures consistency",
            ],
            droppedMsgsPct: 0,
            latencyMs: 70,
            bufferDepth: 0,
            conflictEvents: [],
            notes: [
              "Push-pull combines real-time updates with periodic consistency checks.",
            ],
          },
          {
            syncModel: "CLIENT_PREDICT",
            flowEvents: [
              "Client applies optimistic update",
              "Server confirms or corrects",
              "Reconciliation if needed",
            ],
            droppedMsgsPct: 0,
            latencyMs: 40,
            bufferDepth: 0,
            conflictEvents: [],
            notes: [
              "Client predict enables instant UI updates with server reconciliation.",
            ],
          },
          {
            conflictMode: "LAST_WRITE_WINS",
            flowEvents: [
              "Client A edits field",
              "Client B edits same field",
              "Last write overwrites previous",
            ],
            droppedMsgsPct: 0,
            latencyMs: 50,
            bufferDepth: 0,
            conflictEvents: ["A overwritten by B"],
            notes: [
              "Last-write-wins is simple but may lose data.",
            ],
          },
          {
            conflictMode: "MANUAL_MERGE",
            flowEvents: [
              "Conflict detected",
              "User presented with both values",
              "User chooses or merges",
              "Resolution applied",
            ],
            droppedMsgsPct: 0,
            latencyMs: 200,
            bufferDepth: 0,
            conflictEvents: ["Conflict: A vs B", "User resolved"],
            notes: [
              "Manual merge preserves all data but requires user interaction.",
            ],
          },
        ],
      };

      await payload.create({
        collection: "topics",
        data: {
          title: "Real-time Frontend Systems",
          slug: "realtime-systems",
          order: 10,
          difficulty: "intermediate",
          summary:
            "Learn WebSockets vs SSE, sync models, conflict handling, backpressure strategies, and resilience patterns for real-time frontend systems.",
          theory: {
            root: {
              children: [
                {
                  children: [
                    {
                      text: "Real-time Frontend Systems",
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
                      text: "Real-time systems require careful protocol selection, backpressure handling, reconnection strategies, and conflict resolution. This resource covers WebSockets vs Server-Sent Events (SSE), sync models, and resilience patterns.",
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
                      text: "Protocols: SSE vs WebSocket",
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
                      text: "Server-Sent Events (SSE) provides one-way server-to-client streaming over HTTP/1.1. It's simpler than WebSocket but unidirectional. WebSocket provides full-duplex bidirectional communication with lower latency. Choose SSE for server-push scenarios (live dashboards, notifications). Choose WebSocket for interactive applications (chat, collaborative editing).",
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
                      text: "Backpressure Strategies",
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
                      text: "When message rate exceeds processing capacity, backpressure strategies prevent buffer overflow: Batching groups messages to reduce overhead (trade-off: latency). Throttling drops messages when buffer is full. Drop-old removes oldest messages first. Ack-window limits unacked messages using sequence IDs. Each strategy has trade-offs between latency, memory, and message loss.",
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
                      text: "Reconnection and Replay",
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
                      text: "Network disconnections require reconnection strategies. Auto-reconnect resumes stream but may miss messages. Reconnect-with-replay uses lastEventId/cursor to replay missed messages, avoiding gaps but requiring server-side message history. Replay window size balances memory vs completeness.",
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
                      text: "Sync Models",
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
                      text: "Push-only relies solely on server push. Push-pull combines real-time updates with periodic pull refreshes for consistency. Client-predict applies optimistic updates locally and reconciles with server, enabling instant UI feedback.",
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
                      text: "Conflict Handling",
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
                      text: "When multiple clients edit shared state, conflicts occur. Last-write-wins is simple but may lose data. Manual merge presents both values to the user for resolution, preserving data but requiring interaction. Operational Transform (OT) and Conflict-free Replicated Data Types (CRDTs) provide automatic conflict resolution for collaborative editing.",
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
              label: "MDN: Server-Sent Events",
              url: "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events",
              note: "MDN documentation on SSE (placeholder - verify content)",
              claimIds: "sse",
            },
            {
              label: "MDN: WebSocket API",
              url: "https://developer.mozilla.org/en-US/docs/Web/API/WebSocket",
              note: "MDN documentation on WebSocket (placeholder - verify content)",
              claimIds: "websocket",
            },
            {
              label: "CRDTs Explained",
              url: "https://crdt.tech/",
              note: "Conflict-free Replicated Data Types (placeholder - verify content)",
              claimIds: "crdt",
            },
          ],
          practiceDemo: realtimeSystemsLabDemoConfig,
          practiceSteps: [
            {
              title: "Compare SSE vs WebSocket",
              body: "Switch between SSE and WebSocket protocols. Watch the message flow visualization: SSE shows one-way server→client stream with separate POST for client updates, while WebSocket shows bidirectional channel. Notice the directionality difference and when each is appropriate.",
              focusTarget: "flow",
            },
            {
              title: "Explore Backpressure Strategies",
              body: "Increase message rate to 100+ msg/s. Try different backpressure strategies: None (buffer grows), Batch (messages group), Throttle (drops when full), Drop Old (removes oldest), Ack Window (limits unacked). Watch buffer depth, dropped messages %, and latency. Each strategy has trade-offs.",
              focusTarget: "buffer",
            },
            {
              title: "Test Reconnection Strategies",
              body: "Click 'Simulate disconnect'. With Auto Reconnect, watch reconnect attempts. With Reconnect with Replay, notice how lastEventId is used to replay missed messages. Replay avoids gaps but requires server-side history.",
              focusTarget: "reconnect",
            },
            {
              title: "Understand Sync Models",
              body: "Try different sync models: Push-only (server updates only), Push-pull (periodic refresh), Client-predict (optimistic updates). Watch how each affects latency and consistency. Client-predict enables instant UI but requires reconciliation.",
              focusTarget: "reconnect",
            },
            {
              title: "Handle Conflicts",
              body: "Set Conflict Mode to Last-write-wins or Manual merge. Click 'Send edit (Client A)' then 'Send edit (Client B)'. With LWW, B overwrites A. With Manual merge, see conflict UI where you choose A, B, or merge. Manual merge preserves data but requires interaction.",
              focusTarget: "conflict",
            },
            {
              title: "Review Event Log",
              body: "Scroll through the event log to see chronological records of protocol changes, backpressure effects, reconnection attempts, sync model behavior, and conflict resolutions. This helps understand how real-time system decisions affect behavior.",
              focusTarget: "eventlog",
            },
          ],
          practiceTasks: [
            {
              prompt:
                "Choose SSE vs WebSocket for live dashboard vs collaborative editor; justify.",
              expectedAnswer:
                "For a live dashboard, I would use SSE because it's server-push only (dashboard updates come from server), simpler to implement, and works over HTTP/1.1. For a collaborative editor, I would use WebSocket because it requires bidirectional communication (users send edits, server broadcasts to others), lower latency for real-time collaboration, and full-duplex support. SSE is unidirectional (server→client only), so client updates would require separate POST requests, which is inefficient for collaborative editing.",
              explanation:
                "SSE is ideal for server-push scenarios like dashboards. WebSocket is better for bidirectional interactive applications like collaborative editing.",
            },
            {
              prompt:
                "Pick backpressure strategy for 200 msg/s on mobile; explain trade-offs.",
              expectedAnswer:
                "For 200 msg/s on mobile, I would use Ack Window strategy. Mobile devices have limited processing power and memory. Ack Window limits unacked messages (e.g., 50-100), preventing memory overflow while ensuring message delivery. Trade-offs: Ack Window requires sequence IDs and ack mechanism (more complex), but bounds memory usage and prevents buffer overflow. Alternatives: Batch increases latency (bad for real-time), Throttle drops messages (loses data), Drop Old loses historical data. Ack Window balances memory safety with message delivery.",
              explanation:
                "Ack Window is best for high message rates on resource-constrained devices because it bounds memory while ensuring delivery through acknowledgments.",
            },
            {
              prompt:
                "Design reconnect strategy to avoid missed updates.",
              expectedAnswer:
                "I would use Reconnect with Replay strategy. When connection is lost, store the lastEventId (or cursor/sequence number) of the last received message. On reconnect, send lastEventId to server. Server maintains message history (e.g., last 100-500 messages) and replays all messages after lastEventId. This ensures no missed updates. Implementation: client stores lastEventId, server maintains message buffer, reconnect includes lastEventId in handshake, server replays missed messages. Trade-off: requires server-side message history (memory cost) but guarantees completeness.",
              explanation:
                "Reconnect with Replay uses lastEventId/cursor to replay missed messages, avoiding gaps but requiring server-side message history. This is essential for applications where missing updates is unacceptable.",
            },
          ],
        },
      });
      console.log("✓ Created Resource 10 topic (realtime-systems)");
    } else {
      console.log("✓ Resource 10 topic already exists");
    }

    // Check if Resource 11 topic exists
    const existingTopic11 = await payload.find({
      collection: "topics",
      where: {
        slug: {
          equals: "large-scale-ux",
        },
      },
      limit: 1,
    });

    if (existingTopic11.docs.length === 0) {
      const largeScaleUXLabDemoConfig = {
        demoType: "largeScaleUXLab",
        defaults: {
          mode: "VIRTUALIZATION",
          itemCount: 1000,
          renderMode: "FULL_DOM",
          rowHeight: 40,
          overscan: 5,
          strategy: "PAGINATION",
          pageSize: 20,
          totalItems: 500,
          queryLatencyMs: 500,
          typingSpeed: "FAST",
          cancellation: "NONE",
          validationMode: "ON_CHANGE",
          autosave: true,
          autosaveIntervalMs: 2000,
          offline: false,
          recovery: true,
        },
        rules: [
          {
            mode: "VIRTUALIZATION",
            renderMode: "FULL_DOM",
            perfStats: {
              domNodes: 1000,
              renderCost: 100,
              memoryScore: 90,
            },
            uxNotes: [],
            searchEvents: [],
            autosaveEvents: [],
            eventLines: [
              "Full DOM renders all items; performance degrades with large lists.",
            ],
          },
          {
            mode: "VIRTUALIZATION",
            renderMode: "VIRTUALIZED",
            perfStats: {
              domNodes: 15,
              renderCost: 1.5,
              memoryScore: 100,
            },
            uxNotes: [],
            searchEvents: [],
            autosaveEvents: [],
            eventLines: [
              "Virtualization reduces DOM nodes; overscan improves scroll smoothness but increases work.",
            ],
          },
          {
            mode: "PAGINATION_SCROLL",
            strategy: "PAGINATION",
            perfStats: {
              domNodes: 20,
              renderCost: 2,
              memoryScore: 100,
            },
            uxNotes: [
              "Pagination: navigable, stable URLs, easier 'where am I'",
              "Users can jump to specific pages",
              "Footer access is straightforward",
            ],
            searchEvents: [],
            autosaveEvents: [],
            eventLines: [
              "Pagination provides predictable navigation and stable URLs.",
            ],
          },
          {
            mode: "PAGINATION_SCROLL",
            strategy: "INFINITE_SCROLL",
            perfStats: {
              domNodes: 100,
              renderCost: 10,
              memoryScore: 95,
            },
            uxNotes: [
              "Infinite scroll: engagement, but harder footer access/position",
              "Back navigation challenges require state restoration",
              "Scroll position must be preserved",
            ],
            searchEvents: [],
            autosaveEvents: [],
            eventLines: [
              "Infinite scroll needs state restoration for back navigation.",
            ],
          },
          {
            mode: "SEARCH_RACES",
            cancellation: "NONE",
            perfStats: {
              domNodes: 0,
              renderCost: 0,
              memoryScore: 100,
            },
            uxNotes: [],
            searchEvents: [
              "Request 1 sent",
              "Request 2 sent (overwrites Request 1)",
              "Request 1 completes last (stale response overwrites UI)",
            ],
            autosaveEvents: [],
            eventLines: [
              "Without cancellation, stale responses can overwrite newer results.",
            ],
          },
          {
            mode: "SEARCH_RACES",
            cancellation: "ABORT",
            perfStats: {
              domNodes: 0,
              renderCost: 0,
              memoryScore: 100,
            },
            uxNotes: [],
            searchEvents: [
              "Request 1 sent",
              "Request 2 sent, Request 1 aborted",
              "Request 2 completes (only latest result shown)",
            ],
            autosaveEvents: [],
            eventLines: [
              "Abort prevents wasted work; ignore-stale prevents UI regression but still costs network.",
            ],
          },
          {
            mode: "SEARCH_RACES",
            cancellation: "IGNORE_STALE",
            perfStats: {
              domNodes: 0,
              renderCost: 0,
              memoryScore: 100,
            },
            uxNotes: [],
            searchEvents: [
              "Request 1 sent",
              "Request 2 sent",
              "Request 2 completes first (shown)",
              "Request 1 completes (ignored as stale)",
            ],
            autosaveEvents: [],
            eventLines: [
              "Ignore-stale prevents UI regression but still costs network bandwidth.",
            ],
          },
          {
            mode: "FORMS_AUTOSAVE",
            validationMode: "ON_CHANGE",
            perfStats: {
              domNodes: 0,
              renderCost: 0,
              memoryScore: 100,
            },
            uxNotes: [],
            searchEvents: [],
            autosaveEvents: ["Draft saved"],
            eventLines: [
              "OnChange validation gives immediate feedback but can be noisy.",
            ],
          },
          {
            mode: "FORMS_AUTOSAVE",
            validationMode: "ON_BLUR",
            perfStats: {
              domNodes: 0,
              renderCost: 0,
              memoryScore: 100,
            },
            uxNotes: [],
            searchEvents: [],
            autosaveEvents: ["Draft saved"],
            eventLines: [
              "OnBlur validation reduces noise but delays feedback.",
            ],
          },
          {
            mode: "FORMS_AUTOSAVE",
            validationMode: "ON_SUBMIT",
            perfStats: {
              domNodes: 0,
              renderCost: 0,
              memoryScore: 100,
            },
            uxNotes: [],
            searchEvents: [],
            autosaveEvents: ["Draft saved"],
            eventLines: [
              "OnSubmit validation is least intrusive but provides no early feedback.",
            ],
          },
        ],
      };

      await payload.create({
        collection: "topics",
        data: {
          title: "Large-scale UX Systems",
          slug: "large-scale-ux",
          order: 11,
          difficulty: "intermediate",
          summary:
            "Learn virtualization, pagination vs infinite scroll, search race conditions, and form validation with autosave for large-scale UX systems.",
          theory: {
            root: {
              children: [
                {
                  children: [
                    {
                      text: "Large-scale UX Systems",
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
                      text: "Large-scale UX systems require careful handling of virtualization, pagination strategies, search race conditions, and form validation with autosave. This resource covers performance optimization, UX trade-offs, and resilience patterns for handling large datasets and user interactions.",
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
                      text: "Virtualization",
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
                      text: "Virtualization renders only visible items plus an overscan buffer, dramatically reducing DOM nodes and memory usage. Full DOM rendering creates all items upfront, which degrades performance with large lists. Virtualization trades initial render cost for scroll smoothness through overscan. Choose virtualization for lists with 1000+ items, especially on mobile devices.",
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
                      text: "Pagination vs Infinite Scroll",
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
                      text: "Pagination provides predictable navigation, stable URLs, and easier 'where am I' context. Users can jump to specific pages and footer access is straightforward. Infinite scroll increases engagement and feels seamless but requires state restoration for back navigation and makes footer access challenging. Choose pagination for admin tables and search results. Choose infinite scroll for social feeds and discovery interfaces.",
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
                      text: "Search Race Conditions",
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
                      text: "When users type quickly, multiple search requests are in flight. Without cancellation, stale responses can overwrite newer results, causing UI regression. AbortController cancels previous requests, preventing wasted work. Ignore-stale checks request order and ignores older responses, preventing UI regression but still consuming network bandwidth. Use abort for most cases; use ignore-stale if you need to track all requests for analytics.",
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
                      text: "Forms: Validation and Autosave",
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
                      text: "Validation modes: OnChange provides immediate feedback but can be noisy. OnBlur reduces noise but delays feedback. OnSubmit is least intrusive but provides no early feedback. Autosave reduces data loss by periodically saving drafts. Offline mode queues saves and replays them when connection is restored. Recovery restores drafts after page refresh using localStorage or IndexedDB. Combine autosave with offline queue and recovery for resilient form experiences.",
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
              label: "React Window Documentation",
              url: "https://github.com/bvaughn/react-window",
              note: "Virtualization library for React (placeholder - verify content)",
              claimIds: "virtualization",
            },
            {
              label: "MDN: AbortController",
              url: "https://developer.mozilla.org/en-US/docs/Web/API/AbortController",
              note: "MDN documentation on AbortController (placeholder - verify content)",
              claimIds: "abort",
            },
            {
              label: "Web.dev: Form Best Practices",
              url: "https://web.dev/sign-up-form-best-practices/",
              note: "Form validation and autosave patterns (placeholder - verify content)",
              claimIds: "forms",
            },
          ],
          practiceDemo: largeScaleUXLabDemoConfig,
          practiceSteps: [
            {
              title: "Explore Virtualization",
              body: "Switch to Virtualization mode. Adjust item count from 100 to 50,000. Toggle between Full DOM and Virtualized render modes. Watch the performance panel: Full DOM shows all items as DOM nodes (performance degrades), while Virtualized shows only visible + overscan items (consistent performance). Adjust overscan to see how it affects rendered count. Overscan improves scroll smoothness but increases work.",
              focusTarget: "virtual.list",
            },
            {
              title: "Compare Pagination vs Infinite Scroll",
              body: "Switch to Pagination vs Infinite Scroll mode. Try Pagination strategy: use page controls to navigate. Notice stable URLs, predictable navigation, and easy footer access. Switch to Infinite Scroll: click 'Load More' to see incremental loading. Notice engagement benefits but consider back navigation challenges. Read UX notes panel for trade-offs.",
              focusTarget: "scroll.strategy",
            },
            {
              title: "Understand Search Race Conditions",
              body: "Switch to Search Races mode. Set cancellation to 'None' and click 'Type Demo Query'. Watch how multiple requests are sent and stale responses can overwrite newer results. Set cancellation to 'Abort': previous requests are canceled, only latest completes. Set to 'Ignore Stale': responses arrive but stale ones are ignored. Watch the timeline visualization to understand request lifecycle.",
              focusTarget: "search.timeline",
            },
            {
              title: "Test Form Validation Modes",
              body: "Switch to Forms & Autosave mode. Try different validation modes: OnChange (immediate feedback, can be noisy), OnBlur (less noise, delayed feedback), OnSubmit (no early feedback). Type in form fields to see when errors appear. Notice the trade-off between feedback immediacy and noise.",
              focusTarget: "form.panel",
            },
            {
              title: "Explore Autosave and Offline",
              body: "Enable autosave and adjust interval. Watch autosave timeline events. Enable offline mode: saves are queued. Disable offline: queued saves replay automatically. Enable recovery: simulate page refresh (draft should restore). This demonstrates resilient form experiences that prevent data loss.",
              focusTarget: "form.panel",
            },
            {
              title: "Review Event Log",
              body: "Scroll through the event log to see chronological records of virtualization changes, pagination/infinite scroll behavior, search race handling, and form validation/autosave events. This helps understand how large-scale UX decisions affect user experience.",
              focusTarget: "eventlog",
            },
          ],
          practiceTasks: [
            {
              prompt:
                "Pick virtualization settings for 50k rows on mobile; justify overscan/row height.",
              expectedAnswer:
                "For 50k rows on mobile, I would use Virtualized render mode with overscan of 3-5 and row height of 40-48px. Mobile devices have limited memory and processing power, so virtualization is essential (reduces DOM nodes from 50k to ~15-20). Overscan of 3-5 provides smooth scrolling without excessive work (renders ~10-15 items instead of just visible ~8). Row height of 40-48px balances content visibility with scroll performance (smaller = more items visible but more scrolling, larger = less scrolling but fewer items visible). Full DOM would create 50k DOM nodes, causing severe performance degradation and potential crashes on mobile.",
              explanation:
                "Virtualization is essential for large lists on mobile. Overscan balances smoothness with performance. Row height affects visible content and scroll behavior.",
            },
            {
              prompt:
                "Choose pagination vs infinite for admin table vs social feed; explain.",
              expectedAnswer:
                "For an admin table, I would use Pagination because: users need to navigate to specific records (pagination allows page jumping), stable URLs enable bookmarking/sharing specific pages, footer access is straightforward (pagination controls don't interfere), and predictable navigation helps with data management tasks. For a social feed, I would use Infinite Scroll because: it increases engagement (seamless content discovery), users don't need to navigate to specific posts (no page jumping needed), and it feels more natural for content consumption. However, infinite scroll requires state restoration for back navigation (store scroll position and loaded items) and makes footer access challenging (need 'back to top' button).",
              explanation:
                "Pagination suits structured data navigation (admin tables). Infinite scroll suits content consumption (social feeds). Each has trade-offs in navigation and state management.",
            },
            {
              prompt:
                "Fix search race: choose abort vs ignore-stale; explain.",
              expectedAnswer:
                "I would use Abort cancellation strategy. When a new search query is typed, cancel the previous request using AbortController. This prevents wasted network bandwidth and server resources, ensures only the latest result is shown (prevents stale overwrites), and is simpler to implement than ignore-stale. Ignore-stale still sends all requests (wastes bandwidth) and requires tracking request order/comparison logic. Abort is the standard approach for search debouncing and race condition handling. Implementation: create AbortController for each request, abort previous controller when new request starts, handle AbortError in catch block.",
              explanation:
                "Abort cancellation is the standard approach for search race conditions. It prevents wasted work and ensures only latest results are shown. Ignore-stale is more complex and still wastes bandwidth.",
            },
            {
              prompt:
                "Design autosave + recovery for long form.",
              expectedAnswer:
                "I would implement: Autosave every 2-3 seconds (balance between frequency and server load), save to localStorage immediately (client-side persistence), send to server in background (non-blocking), offline queue (store saves in IndexedDB when offline, replay on reconnect), and recovery on page load (check localStorage/IndexedDB for draft, restore form state). Validation: use OnBlur mode (less noisy than OnChange, provides feedback before submit). Conflict handling: if server has newer version, show merge UI or 'server version is newer' warning. This ensures users don't lose work even with network issues, page refreshes, or browser crashes.",
              explanation:
                "Autosave with offline queue and recovery prevents data loss. OnBlur validation balances feedback with noise. Conflict handling manages concurrent edits.",
            },
          ],
        },
      });
      console.log("✓ Created Resource 11 topic (large-scale-ux)");
    } else {
      console.log("✓ Resource 11 topic already exists");
    }

    // Check if Resource 12 topic exists
    const existingTopic12 = await payload.find({
      collection: "topics",
      where: {
        slug: {
          equals: "capstone",
        },
      },
      limit: 1,
    });

    if (existingTopic12.docs.length === 0) {
      const capstoneBuilderDemoConfig = {
        demoType: "capstoneBuilder",
        defaults: {
          scenario: "ECOMMERCE",
          view: "ARCH_MAP",
          emphasis: "PERF",
        },
        scenarios: [
          {
            id: "ECOMMERCE",
            modules: [
              { id: "pdp", label: "Product Detail Page", type: "UI" },
              { id: "checkout", label: "Checkout", type: "UI" },
              { id: "product-api", label: "Product API", type: "API" },
              { id: "cart-api", label: "Cart API", type: "API" },
              { id: "payment-api", label: "Payment API", type: "API" },
              { id: "auth", label: "Auth Service", type: "AUTH" },
              { id: "cdn", label: "CDN", type: "CACHE" },
              { id: "edge", label: "Edge Cache", type: "EDGE" },
              { id: "analytics", label: "Analytics", type: "ANALYTICS" },
            ],
            flows: [
              { from: "pdp", to: "product-api", label: "Product Data", kind: "DATA" },
              { from: "checkout", to: "cart-api", label: "Cart Updates", kind: "DATA" },
              { from: "checkout", to: "payment-api", label: "Payment", kind: "DATA" },
              { from: "pdp", to: "auth", label: "Auth Check", kind: "AUTH" },
              { from: "pdp", to: "analytics", label: "Page Views", kind: "EVENT" },
              { from: "cdn", to: "pdp", label: "Static Assets", kind: "DATA" },
            ],
            tradeoffs: [
              {
                label: "SSR vs SSG for PDP",
                goodFor: ["SEO", "Initial load", "Dynamic pricing"],
                risks: ["Server load", "TTFB", "Cache invalidation"],
              },
              {
                label: "CDN caching for product images",
                goodFor: ["Performance", "Bandwidth", "Global delivery"],
                risks: ["Cache invalidation", "Stale images", "Storage costs"],
              },
              {
                label: "Strict CSP for checkout",
                goodFor: ["Security", "XSS prevention"],
                risks: ["Third-party script limitations", "Development overhead"],
              },
            ],
            recommendedChoices: {
              rendering: "SSR",
              caching: "CDN",
              state: "Server state with React Query",
              delivery: "CDN + Edge caching",
              observability: "Checkout funnel tracking",
              security: "Strict CSP + token-based auth",
              deployment: "Canary releases with feature flags",
            },
          },
          {
            id: "DASHBOARD",
            modules: [
              { id: "dashboard-ui", label: "Dashboard UI", type: "UI" },
              { id: "charts-api", label: "Charts API", type: "API" },
              { id: "metrics-api", label: "Metrics API", type: "API" },
              { id: "auth", label: "Auth Service", type: "AUTH" },
              { id: "cache", label: "API Cache", type: "CACHE" },
              { id: "edge", label: "Edge Compute", type: "EDGE" },
              { id: "analytics", label: "Analytics", type: "ANALYTICS" },
            ],
            flows: [
              { from: "dashboard-ui", to: "charts-api", label: "Chart Data", kind: "DATA" },
              { from: "dashboard-ui", to: "metrics-api", label: "Metrics", kind: "DATA" },
              { from: "dashboard-ui", to: "auth", label: "Auth Check", kind: "AUTH" },
              { from: "dashboard-ui", to: "analytics", label: "User Actions", kind: "EVENT" },
              { from: "cache", to: "charts-api", label: "Cached Responses", kind: "DATA" },
            ],
            tradeoffs: [
              {
                label: "CSR vs SSR for dashboard",
                goodFor: ["Interactivity", "Real-time updates"],
                risks: ["Initial load", "SEO", "Client performance"],
              },
              {
                label: "API caching strategy",
                goodFor: ["Performance", "Server load reduction"],
                risks: ["Stale data", "Cache invalidation complexity"],
              },
            ],
            recommendedChoices: {
              rendering: "CSR",
              caching: "APP",
              state: "Client state with SWR/React Query",
              delivery: "CDN for static assets only",
              observability: "User interaction tracking",
              security: "Token-based auth + RBAC",
              deployment: "Feature flags for gradual rollout",
            },
          },
          {
            id: "CHAT_COLLAB",
            modules: [
              { id: "chat-ui", label: "Chat UI", type: "UI" },
              { id: "messages-api", label: "Messages API", type: "API" },
              { id: "presence-api", label: "Presence API", type: "API" },
              { id: "auth", label: "Auth Service", type: "AUTH" },
              { id: "websocket", label: "WebSocket Server", type: "REALTIME" },
              { id: "cache", label: "Message Cache", type: "CACHE" },
              { id: "analytics", label: "Analytics", type: "ANALYTICS" },
            ],
            flows: [
              { from: "chat-ui", to: "websocket", label: "Real-time Messages", kind: "DATA" },
              { from: "chat-ui", to: "messages-api", label: "History", kind: "DATA" },
              { from: "chat-ui", to: "presence-api", label: "Presence", kind: "DATA" },
              { from: "chat-ui", to: "auth", label: "Auth Check", kind: "AUTH" },
              { from: "websocket", to: "chat-ui", label: "Message Events", kind: "EVENT" },
            ],
            tradeoffs: [
              {
                label: "WebSocket vs SSE",
                goodFor: ["Bidirectional", "Low latency"],
                risks: ["Connection management", "Scalability"],
              },
              {
                label: "Optimistic updates",
                goodFor: ["Perceived performance", "UX"],
                risks: ["State conflicts", "Rollback complexity"],
              },
              {
                label: "Message caching",
                goodFor: ["Offline support", "Performance"],
                risks: ["Storage limits", "Sync complexity"],
              },
            ],
            recommendedChoices: {
              rendering: "CSR",
              caching: "BROWSER",
              state: "Optimistic updates with conflict resolution",
              delivery: "WebSocket for real-time, REST for history",
              observability: "Message delivery tracking + sampling",
              security: "WSS + token auth + message encryption",
              deployment: "Blue-green with message replay",
            },
          },
          {
            id: "MEDIA_UI",
            modules: [
              { id: "player-ui", label: "Media Player UI", type: "UI" },
              { id: "stream-api", label: "Stream API", type: "API" },
              { id: "metadata-api", label: "Metadata API", type: "API" },
              { id: "auth", label: "Auth Service", type: "AUTH" },
              { id: "cdn", label: "Media CDN", type: "CACHE" },
              { id: "edge", label: "Edge Streaming", type: "EDGE" },
              { id: "analytics", label: "Analytics", type: "ANALYTICS" },
            ],
            flows: [
              { from: "player-ui", to: "stream-api", label: "Stream Request", kind: "DATA" },
              { from: "player-ui", to: "metadata-api", label: "Metadata", kind: "DATA" },
              { from: "player-ui", to: "auth", label: "Auth Check", kind: "AUTH" },
              { from: "cdn", to: "player-ui", label: "Media Stream", kind: "DATA" },
              { from: "player-ui", to: "analytics", label: "Playback Events", kind: "EVENT" },
            ],
            tradeoffs: [
              {
                label: "Streaming vs download",
                goodFor: ["Bandwidth efficiency", "Start time"],
                risks: ["Buffering", "Quality adaptation"],
              },
              {
                label: "CDN distribution",
                goodFor: ["Global performance", "Bandwidth offload"],
                risks: ["Cost", "Cache invalidation"],
              },
            ],
            recommendedChoices: {
              rendering: "SSR",
              caching: "CDN",
              state: "Streaming state with buffering logic",
              delivery: "HLS/DASH via CDN",
              observability: "Playback quality + buffering metrics",
              security: "Token-based auth + DRM",
              deployment: "Canary with quality rollback",
            },
          },
        ],
        sim: {
          demoScenario: "CHAT_COLLAB",
          toggles: {
            rendering: ["CSR", "SSR", "SSG", "ISR", "STREAMING"],
            caching: ["NONE", "BROWSER", "CDN", "APP"],
            realtime: ["NONE", "SSE", "WEBSOCKET"],
            optimistic: true,
            offline: false,
            sampling: 1.0,
            cspStrict: true,
          },
          rules: [
            {
              rendering: "CSR",
              caching: "BROWSER",
              realtime: "WEBSOCKET",
              optimistic: true,
              offline: false,
              sampling: 1.0,
              cspStrict: true,
              simTimelineEvents: [
                "User types message → Optimistic render in UI",
                "Message sent to WebSocket server",
                "Server receives and broadcasts",
                "Other user receives via WebSocket",
                "Message cache updated in browser",
                "Analytics event sent (sampled)",
              ],
              simMetrics: {
                latencyMs: 150,
                errorRate: 0.01,
                cacheHitRate: 0.85,
                droppedMsgsPct: 0.5,
              },
              simNotes: [
                "CSR enables instant optimistic updates",
                "WebSocket provides low-latency real-time delivery",
                "Browser cache improves offline experience",
                "CSP strict prevents XSS in message rendering",
              ],
            },
            {
              rendering: "CSR",
              caching: "BROWSER",
              realtime: "SSE",
              optimistic: true,
              offline: false,
              simTimelineEvents: [
                "User types message → Optimistic render",
                "Message sent to server via POST",
                "Server sends via SSE to other users",
                "SSE connection delivers message",
                "Browser cache updated",
              ],
              simMetrics: {
                latencyMs: 200,
                errorRate: 0.02,
                cacheHitRate: 0.80,
                droppedMsgsPct: 1.0,
              },
              simNotes: [
                "SSE provides server-to-client real-time",
                "Higher latency than WebSocket (no bidirectional)",
                "Requires separate POST for client-to-server",
              ],
            },
            {
              rendering: "SSR",
              caching: "CDN",
              realtime: "WEBSOCKET",
              optimistic: false,
              simTimelineEvents: [
                "Server renders initial HTML",
                "Client hydrates",
                "WebSocket connection established",
                "Messages arrive and update UI",
                "CDN caches static assets",
              ],
              simMetrics: {
                latencyMs: 300,
                errorRate: 0.015,
                cacheHitRate: 0.90,
                droppedMsgsPct: 0.3,
              },
              simNotes: [
                "SSR improves initial load but delays interactivity",
                "CDN caching helps with static assets",
                "No optimistic updates increase perceived latency",
              ],
            },
          ],
        },
      };

      await payload.create({
        collection: "topics",
        data: {
          title: "Capstone Frontend System Designs",
          slug: "capstone",
          order: 12,
          difficulty: "advanced",
          summary:
            "Capstone system design builder: E-commerce PDP/Checkout, Dashboard/Analytics, Chat/Collab, Media Streaming UI. Interactive architecture maps and simulation.",
          theory: {
            root: {
              children: [
                {
                  children: [
                    {
                      text: "Capstone Frontend System Designs",
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
                      text: "This capstone resource brings together concepts from all previous topics to design complete frontend systems for real-world scenarios: E-commerce Product Detail Page and Checkout, Dashboard/Analytics, Chat/Collaboration, and Media Streaming UI.",
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
                      text: "E-commerce PDP/Checkout",
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
                      text: "E-commerce systems require SSR/SSG for SEO on product pages, CDN caching for assets, strict CSP for checkout security, and comprehensive observability for checkout funnel tracking. Key considerations include dynamic pricing updates, inventory management, and payment processing security.",
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
                      text: "Dashboard/Analytics",
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
                      text: "Dashboard systems prioritize interactivity with CSR, API-level caching, client-side state management, and real-time data updates. Focus on performance for chart rendering, efficient data fetching patterns, and user interaction tracking for analytics.",
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
                      text: "Chat/Collaboration",
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
                      text: "Chat systems require WebSocket or SSE for real-time delivery, optimistic updates for perceived performance, browser caching for offline support, and conflict resolution for concurrent edits. Security considerations include message encryption, token-based auth, and CSP for XSS prevention.",
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
                      text: "Media Streaming UI",
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
                      text: "Media streaming systems use SSR for initial page load, CDN distribution for media delivery, adaptive bitrate streaming (HLS/DASH), and comprehensive playback analytics. Key challenges include buffering management, quality adaptation, and global distribution.",
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
              label: "Web.dev: E-commerce Performance",
              url: "https://web.dev/ecommerce/",
              note: "E-commerce performance best practices (placeholder - verify content)",
              claimIds: "ecommerce",
            },
            {
              label: "MDN: WebSocket API",
              url: "https://developer.mozilla.org/en-US/docs/Web/API/WebSocket",
              note: "WebSocket API documentation (placeholder - verify content)",
              claimIds: "websocket",
            },
            {
              label: "HLS.js Documentation",
              url: "https://github.com/video-dev/hls.js/",
              note: "HTTP Live Streaming library (placeholder - verify content)",
              claimIds: "streaming",
            },
          ],
          practiceDemo: capstoneBuilderDemoConfig,
          practiceSteps: [
            {
              title: "Choose Scenario",
              body: "Select a capstone scenario (E-commerce, Dashboard, Chat/Collab, or Media UI). Each scenario represents a real-world frontend system with different requirements and trade-offs.",
              focusTarget: "controls.scenario",
            },
            {
              title: "Explore Architecture Map",
              body: "Switch to Architecture Map view. Review the module graph showing UI components, APIs, caches, edge services, auth, realtime connections, and analytics. Understand the data flows between modules.",
              focusTarget: "arch.map",
            },
            {
              title: "Change Emphasis",
              body: "Try different emphasis modes (Performance, Reliability, Security, DX). Watch how the architecture map highlights different critical paths and trade-offs. Performance emphasizes caching/CDN/streaming; Security emphasizes auth/CSP/token handling; Reliability emphasizes retries/fallbacks; DX emphasizes module boundaries/testing.",
              focusTarget: "tradeoffs.panel",
            },
            {
              title: "Review Recommended Choices",
              body: "Examine the recommended choices panel for your selected scenario. These represent best-practice decisions for rendering strategy, caching, state management, delivery, observability, security, and deployment based on the scenario's requirements.",
              focusTarget: "tradeoffs.panel",
            },
            {
              title: "Switch to Interactive Simulation",
              body: "Switch to Interactive Simulation view. This provides a mini-capstone implementation (default: Chat/Collab) that demonstrates how multiple concepts work together: rendering strategy, caching, realtime, optimistic updates, offline support, sampling, and CSP.",
              focusTarget: "sim.panel",
            },
            {
              title: "Adjust Simulation Toggles",
              body: "Experiment with different toggles: rendering strategy (CSR/SSR/SSG/ISR/STREAMING), caching mode (NONE/BROWSER/CDN/APP), realtime protocol (NONE/SSE/WEBSOCKET), optimistic updates, offline support, sampling rate, and CSP strict mode. Each combination produces different outcomes.",
              focusTarget: "sim.panel",
            },
            {
              title: "Run Simulation",
              body: "Click 'Run Simulation' to see a timeline of events: user actions, network requests, server processing, realtime delivery, cache updates, observability telemetry, and security checks. Watch how different toggle combinations affect the flow.",
              focusTarget: "sim.panel",
            },
            {
              title: "Review Metrics",
              body: "After running the simulation, examine the metrics panel: latency, error rate, cache hit rate, and dropped messages (if applicable). Understand how your toggle choices impact these metrics.",
              focusTarget: "metrics",
            },
            {
              title: "Understand Trade-offs",
              body: "Notice how different combinations create different trade-offs. For example: CSR enables optimistic updates but increases initial load; WebSocket provides low latency but requires connection management; CSP strict improves security but limits third-party scripts.",
              focusTarget: "sim.panel",
            },
            {
              title: "Review Event Log",
              body: "Scroll through the event log to see chronological records of architecture decisions and simulation events. This helps understand how system design choices affect behavior and outcomes.",
              focusTarget: "eventlog",
            },
            {
              title: "Apply to Your Scenario",
              body: "Think about how the concepts demonstrated in the interactive simulation apply to your chosen scenario. Consider: rendering strategy for SEO vs interactivity, caching for performance vs freshness, realtime for collaboration vs efficiency, security for protection vs flexibility.",
              focusTarget: "sim.panel",
            },
            {
              title: "Design Integration",
              body: "Consider how all these pieces fit together: rendering strategy + caching + state management + delivery + observability + security + deployment. Each scenario requires a different combination optimized for its specific requirements.",
              focusTarget: "arch.map",
            },
          ],
          practiceTasks: [
            {
              prompt:
                "For your chosen scenario, justify the recommended rendering + caching choices. Explain why these choices fit the scenario's requirements.",
              expectedAnswer:
                "For E-commerce PDP/Checkout: SSR is recommended because product pages need SEO (search engines can crawl HTML), initial content is critical (users see products immediately), and dynamic pricing/inventory requires server-side rendering. CDN caching is recommended because product images and static assets are large and benefit from global distribution, reducing bandwidth costs and improving load times. For Dashboard: CSR is recommended because dashboards prioritize interactivity (users need to interact with charts/filters immediately), real-time updates are common (data refreshes frequently), and SEO is not required (dashboards are authenticated). APP-level caching is recommended because API responses benefit from caching to reduce server load while allowing real-time invalidation when needed.",
              explanation:
                "Rendering and caching choices depend on scenario requirements: SEO needs SSR, interactivity needs CSR. CDN for static assets, APP cache for API responses, BROWSER cache for offline support.",
            },
            {
              prompt:
                "Identify the main security/privacy risks for your scenario and explain how to mitigate them.",
              expectedAnswer:
                "For Chat/Collab: Main risks include XSS in message rendering (malicious scripts in messages), CSRF in message sending (unauthorized actions), message interception (data in transit), and PII in messages (personal information). Mitigations: Use strict CSP to prevent inline scripts and limit script sources, sanitize message content before rendering, use token-based auth with CSRF tokens, encrypt messages in transit (WSS) and at rest, implement message filtering/redaction for PII, use secure token storage (HTTP-only cookies), and implement rate limiting to prevent abuse. For E-commerce: Main risks include payment data exposure, XSS in checkout forms, CSRF in cart/payment actions, and session hijacking. Mitigations: Never store payment data on frontend, use PCI-compliant payment processors, strict CSP for checkout pages, CSRF tokens for state-changing actions, secure session management with HttpOnly cookies, and comprehensive input validation.",
              explanation:
                "Security risks vary by scenario. Chat systems focus on message security and XSS prevention. E-commerce focuses on payment security and checkout protection. Always use CSP, token-based auth, encryption, and input validation.",
            },
            {
              prompt:
                "Design a rollout strategy (feature flags/canary/rollback) for a risky change in your scenario (e.g., switching rendering strategy or enabling a new caching layer).",
              expectedAnswer:
                "For switching Dashboard from CSR to SSR: Phase 1 - Feature flag to enable SSR for 5% of users (internal team + beta users), monitor error rates and latency metrics, collect user feedback. Phase 2 - If metrics are good, increase to 25% of users, continue monitoring, ensure SEO improvements are measurable. Phase 3 - Gradual rollout to 50%, then 75%, then 100% over 1-2 weeks, monitoring for regressions. Rollback plan: Feature flag allows instant rollback to CSR if error rate increases >1% or latency increases >200ms. Canary deployment with automatic rollback triggers. Blue-green deployment for zero-downtime rollback. Monitoring: Track SSR vs CSR metrics separately (error rates, latency, SEO rankings, user engagement). Alert on anomalies. For enabling CDN caching for E-commerce: Phase 1 - Enable CDN for static assets only (images, CSS, JS), verify cache hit rates, monitor origin server load reduction. Phase 2 - Enable CDN for product pages with short TTL (5 minutes), monitor for stale content issues. Phase 3 - Gradually increase TTL and expand to more pages. Rollback: CDN can be disabled instantly via configuration, fallback to origin server. Cache purge available for emergency invalidation.",
              explanation:
                "Rollout strategy should be gradual with feature flags, monitoring, and rollback plans. Start small (5-25%), monitor metrics, gradually increase, and always have instant rollback capability. Measure success criteria before and during rollout.",
            },
          ],
        },
      });
      console.log("✓ Created Resource 12 topic (capstone)");
    } else {
      console.log("✓ Resource 12 topic already exists");
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

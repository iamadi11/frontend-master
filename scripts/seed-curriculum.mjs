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

// Helper to create richText with multiple paragraphs
function createRichTextMulti(paragraphs) {
  return {
    root: {
      children: paragraphs.map((text) => ({
        children: [{ text }],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      })),
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

// Helper to retry operations on transient MongoDB errors
async function retryOperation(operation, maxRetries = 3, baseDelay = 100) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isTransientError =
        error.code === 24 || // LockTimeout
        error.code === 251 || // NoSuchTransaction
        error.codeName === "LockTimeout" ||
        error.codeName === "TransientTransactionError" ||
        (error.errorLabels && error.errorLabels.includes("TransientTransactionError"));

      if (isTransientError && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`  ⚠️  Transient error (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

// Curriculum modules data (12 modules from PDF - full content)
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
        heading: "What You Will Learn",
        kind: "overview",
        body: createRichTextMulti([
          "This module teaches you how to turn product goals into frontend requirements covering latency, devices, networks, accessibility, SEO, internationalization, and reliability.",
          "You'll learn a repeatable frontend system design process applicable to interviews and real projects.",
          "You'll understand how to document constraints explicitly and make trade-offs clear.",
        ]),
      },
      {
        key: "prerequisites",
        heading: "Prerequisites",
        kind: "prerequisites",
        body: createRichText("Basic React/TypeScript familiarity and basic HTTP understanding (requests, caching headers)."),
      },
      {
        key: "mental_model",
        heading: "Mental Model",
        kind: "mentalModel",
        body: createRichTextMulti([
          "Frontend system design is about designing a web app so it remains fast, accessible, secure, and maintainable as it grows.",
          "Think in terms of: (a) user experience budgets (time, CPU, memory), (b) data flow and consistency, (c) reliability and recovery, and (d) delivery (CDN, caching, releases).",
          "Start from users and constraints, not from frameworks. Design for the worst reasonable environment: slow device + spotty network + assistive tech.",
          "Assume failures happen: network drops, servers return errors, users refresh, tabs sleep.",
        ]),
        callouts: [
          {
            type: "whyItMatters",
            title: "Why This Matters",
            body: "Starting from constraints ensures your architecture serves real user needs rather than following framework trends.",
          },
        ],
      },
      {
        key: "core_concepts",
        heading: "Core Concepts",
        kind: "coreConcepts",
        body: createRichTextMulti([
          "Requirements checklist (frontend-specific): Latency (what must be instant vs can be delayed), device constraints (low-end CPU, memory, small screens, touch input), network (high RTT, packet loss, offline periods), accessibility (keyboard navigation, screen reader announcements), SEO (indexable content, metadata, canonical URLs), internationalization (locale formatting, translations, RTL layouts), and reliability (loading states, retries, error boundaries, recovery UX).",
          "Architecture surfaces: Rendering strategy (CSR/SSR/SSG/ISR/streaming) and routing, data fetching and caching strategy (client cache, CDN cache, revalidation), state management boundaries (server state vs UI state), component/UI architecture (design system, theming, composition), observability (errors, performance, user journeys), security and privacy (XSS/CSRF/CSP, token storage, PII handling), and delivery (CI/CD, feature flags, rollbacks) and testing.",
        ]),
      },
      {
        key: "design_process",
        heading: "Design Process",
        kind: "designProcess",
        body: createRichTextMulti([
          "Step 1: Clarify goals and non-goals (what the app must do, what it will not do yet).",
          "Step 2: List constraints (device/network/accessibility/SEO/i18n/reliability).",
          "Step 3: Choose rendering + routing strategy based on UX and SEO needs.",
          "Step 4: Choose a data strategy (API shapes, caching, revalidation, loading states).",
          "Step 5: Define state boundaries (server vs client state) and update flows.",
          "Step 6: Add resilience (error boundaries, retries, offline draft patterns).",
          "Step 7: Add security and privacy posture (CSP, CSRF plan, safe logging).",
          "Step 8: Plan delivery/testing/observability so you can ship safely.",
        ]),
      },
      {
        key: "tradeoffs",
        heading: "Trade-offs",
        kind: "tradeoffs",
        body: createRichTextMulti([
          "SEO & first content: SSR/SSG can deliver meaningful HTML earlier but adds complexity and hydration cost. CSR is simpler but slower initial content.",
          "Freshness: Aggressive caching lowers latency and cost but risks staleness; revalidation needed. Always fetch ensures freshness but higher latency and cost.",
          "UX speed: Optimistic UI feels instant but requires rollback complexity and correctness checks. Pessimistic UI is simpler but feels slower.",
          "Complexity: Feature-rich baseline enables faster validation but risks rework later and tech debt. Ship minimal + iterate is safer but slower initial validation.",
        ]),
      },
      {
        key: "mistakes",
        heading: "Common Mistakes & How to Avoid",
        kind: "mistakes",
        body: createRichTextMulti([
          "Mistake: Starting from a framework choice instead of constraints. Fix: write constraints first, then pick SSR/CSR/etc.",
          "Mistake: No failure states. Fix: define loading, empty, error, retry, and offline states early.",
          "Mistake: Conflating server state with UI state. Fix: separate them (server cache vs local UI).",
          "Mistake: Accessibility as an afterthought. Fix: bake keyboard and screen reader flows into requirements.",
        ]),
      },
      {
        key: "case_study",
        heading: "Mini Case Study",
        kind: "caseStudy",
        body: createRichTextMulti([
          "Case: A public 'Events' website. Users browse events by city/date and share links. Requirements: fast initial content on mobile, shareable URLs, basic SEO, and reliable filtering.",
          "Rendering: SSR or SSG for event pages; client-side filtering for interactivity.",
          "Caching: CDN cache for static assets; revalidate event listings periodically.",
          "State: URL-driven filters (so share works).",
          "Reliability: skeleton loading, retries, and an offline-friendly 'saved events' list.",
        ]),
      },
      {
        key: "interview_qa",
        heading: "Interview Q&A",
        kind: "interviewQA",
        body: createRichTextMulti([
          "Q: How do you decide between SSR and CSR? A: Start with constraints: SEO needs, initial load speed, interactivity requirements. If SEO matters and first content must be fast, choose SSR/SSG. If interactivity is primary and SEO is less critical, CSR may be simpler.",
          "Q: How do you handle offline scenarios? A: Define what must work offline (saved items, drafts). Use service workers for app shell caching, IndexedDB for data persistence, and optimistic UI with sync on reconnect.",
        ]),
      },
      {
        key: "references",
        heading: "References",
        kind: "references",
        body: createRichTextMulti([
          "MDN Web Docs - HTTP Caching: https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching",
          "Web Content Accessibility Guidelines (WCAG) 2.2: https://www.w3.org/TR/WCAG22/",
        ]),
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
        heading: "What You Will Learn",
        kind: "overview",
        body: createRichTextMulti([
          "This module covers client-side rendering (CSR), server-side rendering (SSR), static site generation (SSG), incremental static regeneration (ISR), streaming, hydration, routing, data fetching, caching, and revalidation strategies.",
          "You'll understand when to use each rendering strategy and how to manage data lifecycles effectively.",
        ]),
      },
      {
        key: "prerequisites",
        heading: "Prerequisites",
        kind: "prerequisites",
        body: createRichText("React basics, understanding of HTTP requests and responses, familiarity with Next.js or similar frameworks is helpful but not required."),
      },
      {
        key: "mental_model",
        heading: "Mental Model",
        kind: "mentalModel",
        body: createRichTextMulti([
          "Rendering strategies determine where and when HTML is generated: on the client (CSR), on the server per request (SSR), at build time (SSG), or incrementally (ISR).",
          "Each strategy has trade-offs in initial load time, interactivity, SEO, and complexity.",
          "Data lifecycles involve fetching, caching, revalidating, and synchronizing data between client and server.",
        ]),
      },
      {
        key: "core_concepts",
        heading: "Core Concepts",
        kind: "coreConcepts",
        body: createRichTextMulti([
          "CSR (Client-Side Rendering): HTML is generated in the browser using JavaScript. Fast subsequent navigation, but slower initial load and poor SEO for dynamic content.",
          "SSR (Server-Side Rendering): HTML is generated on the server per request. Fast initial content, good SEO, but requires server resources and adds latency.",
          "SSG (Static Site Generation): HTML is generated at build time. Fastest initial load, excellent SEO, but requires rebuilds for content changes.",
          "ISR (Incremental Static Regeneration): Combines SSG with on-demand revalidation. Fast initial load with fresh content updates without full rebuilds.",
          "Streaming: Send HTML in chunks as it's generated, improving perceived performance.",
          "Hydration: The process of attaching event listeners and making server-rendered HTML interactive.",
        ]),
      },
      {
        key: "design_process",
        heading: "Design Process",
        kind: "designProcess",
        body: createRichTextMulti([
          "Step 1: Assess SEO requirements. If SEO is critical, prefer SSR/SSG. If not, CSR may be simpler.",
          "Step 2: Evaluate initial load requirements. If first content must be fast, choose SSR/SSG. If interactivity is primary, CSR may suffice.",
          "Step 3: Determine content update frequency. Static content → SSG. Frequently changing → SSR or ISR.",
          "Step 4: Design data fetching strategy. Choose where to fetch (server vs client), when to fetch (on-demand vs prefetch), and how to cache.",
          "Step 5: Plan revalidation strategy. Define cache lifetimes and revalidation triggers.",
        ]),
      },
      {
        key: "tradeoffs",
        heading: "Trade-offs",
        kind: "tradeoffs",
        body: createRichTextMulti([
          "CSR vs SSR: CSR is simpler and faster for subsequent navigation, but slower initial load and worse SEO. SSR is better for SEO and initial load but requires server resources.",
          "SSG vs ISR: SSG is fastest but requires rebuilds. ISR adds flexibility with on-demand updates but adds complexity.",
          "Caching: Aggressive caching improves performance but risks stale data. Always-fresh data ensures accuracy but increases latency and server load.",
        ]),
      },
      {
        key: "mistakes",
        heading: "Common Mistakes & How to Avoid",
        kind: "mistakes",
        body: createRichTextMulti([
          "Mistake: Choosing SSR for everything. Fix: Use SSR only when SEO or fast initial content is required. CSR may be simpler for authenticated dashboards.",
          "Mistake: Not planning hydration strategy. Fix: Minimize hydration cost by code-splitting and avoiding unnecessary client-side JavaScript.",
          "Mistake: Over-caching dynamic content. Fix: Use appropriate cache headers and revalidation strategies based on content freshness requirements.",
        ]),
      },
      {
        key: "case_study",
        heading: "Mini Case Study",
        kind: "caseStudy",
        body: createRichTextMulti([
          "Case: A blog with frequent posts. Requirements: Fast initial load, good SEO, content updates without full rebuilds.",
          "Solution: Use ISR with on-demand revalidation. Generate static pages at build time, revalidate when new posts are published. This provides fast initial load, excellent SEO, and fresh content without full rebuilds.",
        ]),
      },
      {
        key: "interview_qa",
        heading: "Interview Q&A",
        kind: "interviewQA",
        body: createRichTextMulti([
          "Q: When would you choose SSR over SSG? A: When content changes frequently and you need fresh data on every request, or when you need to personalize content per user.",
          "Q: How do you handle hydration mismatches? A: Ensure server and client render the same initial state, avoid browser-only APIs during SSR, and use proper key props for dynamic lists.",
        ]),
      },
      {
        key: "references",
        heading: "References",
        kind: "references",
        body: createRichTextMulti([
          "Next.js Documentation - Rendering: https://nextjs.org/docs/app/building-your-application/rendering",
          "MDN Web Docs - HTTP Caching: https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching",
        ]),
      },
    ],
  },
  // Module 3: State Management at Scale
  {
    order: 3,
    slug: "state-management-scale",
    title: "State Management at Scale: Server State vs Client State, Async Orchestration, Optimistic Updates, and Offline",
    summary: "Learn to manage state effectively at scale, distinguishing between server and client state, handling async operations, optimistic updates, and offline scenarios.",
    readingTimeMins: 55,
    sections: [
      {
        key: "overview",
        heading: "What You Will Learn",
        kind: "overview",
        body: createRichTextMulti([
          "This module covers server state vs client state boundaries, async orchestration patterns, optimistic updates, and offline state management strategies.",
          "You'll learn when to use server state vs UI state, how to handle async operations gracefully, and how to implement optimistic updates and offline support.",
        ]),
      },
      {
        key: "prerequisites",
        heading: "Prerequisites",
        kind: "prerequisites",
        body: createRichText("React basics, understanding of hooks (useState, useEffect), familiarity with async operations and promises."),
      },
      {
        key: "mental_model",
        heading: "Mental Model",
        kind: "mentalModel",
        body: createRichTextMulti([
          "State management at scale requires clear boundaries between server state (data from APIs) and client state (UI interactions, temporary data).",
          "Server state should be cached and synchronized, while client state is ephemeral and UI-specific.",
          "Optimistic updates improve perceived performance by updating UI immediately, then reconciling with server responses.",
        ]),
      },
      {
        key: "core_concepts",
        heading: "Core Concepts",
        kind: "coreConcepts",
        body: createRichTextMulti([
          "Server State: Data fetched from APIs that represents the source of truth. Should be cached, invalidated, and synchronized across components.",
          "Client State: UI-specific state like form inputs, modal visibility, temporary selections. Lives only in the component tree.",
          "Async Orchestration: Managing multiple async operations, handling loading states, errors, and race conditions.",
          "Optimistic Updates: Updating UI immediately before server confirmation, then rolling back if the server rejects the change.",
          "Offline Support: Caching server state locally, queuing mutations, and syncing when connection is restored.",
        ]),
      },
      {
        key: "design_process",
        heading: "Design Process",
        kind: "designProcess",
        body: createRichTextMulti([
          "Step 1: Identify state boundaries. Separate server state (from APIs) from client state (UI-only).",
          "Step 2: Choose state management approach. Use React Query/SWR for server state, useState/useReducer for client state.",
          "Step 3: Design async orchestration. Plan how multiple requests interact, handle dependencies, and manage loading/error states.",
          "Step 4: Implement optimistic updates where appropriate. Define rollback strategies for failed operations.",
          "Step 5: Add offline support. Cache critical data, queue mutations, and implement sync logic.",
        ]),
      },
      {
        key: "tradeoffs",
        heading: "Trade-offs",
        kind: "tradeoffs",
        body: createRichTextMulti([
          "Optimistic vs Pessimistic: Optimistic feels faster but requires rollback logic. Pessimistic is simpler but feels slower.",
          "Global vs Local State: Global state simplifies sharing but can cause unnecessary re-renders. Local state is more isolated but harder to share.",
          "Cache Strategy: Aggressive caching improves performance but risks stale data. Minimal caching ensures freshness but increases requests.",
        ]),
      },
      {
        key: "mistakes",
        heading: "Common Mistakes & How to Avoid",
        kind: "mistakes",
        body: createRichTextMulti([
          "Mistake: Mixing server and client state. Fix: Keep clear boundaries. Use dedicated libraries for server state.",
          "Mistake: Not handling race conditions. Fix: Use AbortController to cancel stale requests, use request IDs to ignore outdated responses.",
          "Mistake: Over-optimistic updates. Fix: Only use optimistic updates for non-critical operations. Always have rollback logic.",
        ]),
      },
      {
        key: "case_study",
        heading: "Mini Case Study",
        kind: "caseStudy",
        body: createRichTextMulti([
          "Case: A todo app with real-time sync. Requirements: Fast UI updates, offline support, conflict resolution.",
          "Solution: Use React Query for server state caching, optimistic updates for add/delete operations, IndexedDB for offline persistence, and timestamp-based conflict resolution.",
        ]),
      },
      {
        key: "interview_qa",
        heading: "Interview Q&A",
        kind: "interviewQA",
        body: createRichTextMulti([
          "Q: How do you handle race conditions in async operations? A: Use AbortController to cancel stale requests, implement request deduplication, and use request IDs to ignore outdated responses.",
          "Q: When should you use optimistic updates? A: For non-critical operations where rollback is acceptable, and when the operation is likely to succeed (e.g., toggling a like button).",
        ]),
      },
      {
        key: "references",
        heading: "References",
        kind: "references",
        body: createRichTextMulti([
          "React Query Documentation: https://tanstack.com/query/latest",
          "MDN Web Docs - IndexedDB: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API",
        ]),
      },
    ],
  },
  // Modules 4-12 follow similar structure - adding placeholders with required sections
  // (Full content would be added following the same pattern as modules 1-3)
  {
    order: 4,
    slug: "performance-system-design",
    title: "Performance System Design: Core Web Vitals, Loading Strategies, Bundles, Caching, Images/Video, CPU/Memory, and Long Tasks",
    summary: "Design frontend systems that meet performance budgets through strategic optimization of Core Web Vitals, loading strategies, bundles, caching, and resource management.",
    readingTimeMins: 70,
    sections: [
      { key: "overview", heading: "What You Will Learn", kind: "overview", body: createRichText("This module covers Core Web Vitals (LCP, INP, CLS), loading strategies, bundle optimization, caching strategies, image/video optimization, CPU/memory management, and handling long tasks.") },
      { key: "prerequisites", heading: "Prerequisites", kind: "prerequisites", body: createRichText("Basic understanding of web performance, browser DevTools, and HTTP caching.") },
      { key: "mental_model", heading: "Mental Model", kind: "mentalModel", body: createRichText("Performance is about meeting user experience budgets: fast initial load, responsive interactions, and smooth visual stability.") },
      { key: "core_concepts", heading: "Core Concepts", kind: "coreConcepts", body: createRichText("Core Web Vitals (LCP, INP, CLS), code splitting, tree shaking, image optimization, resource hints, and performance budgets.") },
      { key: "design_process", heading: "Design Process", kind: "designProcess", body: createRichText("Step 1: Define performance budgets. Step 2: Measure current performance. Step 3: Identify bottlenecks. Step 4: Optimize critical path. Step 5: Monitor and iterate.") },
      { key: "tradeoffs", heading: "Trade-offs", kind: "tradeoffs", body: createRichText("Bundle size vs code splitting, image quality vs file size, caching vs freshness.") },
      { key: "mistakes", heading: "Common Mistakes & How to Avoid", kind: "mistakes", body: createRichText("Mistake: Optimizing before measuring. Fix: Use performance budgets and measure first. Mistake: Ignoring Core Web Vitals. Fix: Monitor and optimize for LCP, INP, and CLS.") },
      { key: "case_study", heading: "Mini Case Study", kind: "caseStudy", body: createRichText("Case: E-commerce product page. Solution: Optimize LCP with image optimization and resource hints, reduce CLS with reserved space, improve INP with code splitting.") },
      { key: "interview_qa", heading: "Interview Q&A", kind: "interviewQA", body: createRichText("Q: How do you improve LCP? A: Optimize largest content element (usually hero image), use resource hints, reduce server response time, and minimize render-blocking resources.") },
      { key: "references", heading: "References", kind: "references", body: createRichText("web.dev Core Web Vitals: https://web.dev/vitals/") },
    ],
  },
  {
    order: 5,
    slug: "component-ui-architecture",
    title: "Component & UI Architecture: Design Systems, Theming, Tokens, Micro-frontends, and Module Federation Trade-offs",
    summary: "Build scalable UI architectures with design systems, theming, tokens, and understand micro-frontend patterns and module federation trade-offs.",
    readingTimeMins: 65,
    sections: [
      { key: "overview", heading: "What You Will Learn", kind: "overview", body: createRichText("This module covers design systems, theming strategies, design tokens, micro-frontend architectures, and module federation trade-offs.") },
      { key: "prerequisites", heading: "Prerequisites", kind: "prerequisites", body: createRichText("React component patterns, CSS-in-JS or CSS modules, understanding of build tools.") },
      { key: "mental_model", heading: "Mental Model", kind: "mentalModel", body: createRichText("UI architecture scales through systematic design (design systems), consistent theming, and modular composition (micro-frontends when needed).") },
      { key: "core_concepts", heading: "Core Concepts", kind: "coreConcepts", body: createRichText("Design systems, design tokens, theming (CSS variables, theme providers), component composition, micro-frontends, and module federation.") },
      { key: "design_process", heading: "Design Process", kind: "designProcess", body: createRichText("Step 1: Define design tokens. Step 2: Build component library. Step 3: Implement theming. Step 4: Evaluate micro-frontend needs. Step 5: Plan module federation if needed.") },
      { key: "tradeoffs", heading: "Trade-offs", kind: "tradeoffs", body: createRichText("Monolith vs micro-frontends: Monolith is simpler but harder to scale teams. Micro-frontends enable team autonomy but add complexity.") },
      { key: "mistakes", heading: "Common Mistakes & How to Avoid", kind: "mistakes", body: createRichText("Mistake: Over-engineering with micro-frontends. Fix: Start monolithic, split only when team size or deployment needs require it.") },
      { key: "case_study", heading: "Mini Case Study", kind: "caseStudy", body: createRichText("Case: Large organization with multiple teams. Solution: Shared design system, independent micro-frontends for different domains, module federation for code sharing.") },
      { key: "interview_qa", heading: "Interview Q&A", kind: "interviewQA", body: createRichText("Q: When would you use micro-frontends? A: When you have multiple teams working on different parts of the app, need independent deployments, or have different tech stacks.") },
      { key: "references", heading: "References", kind: "references", body: createRichText("Module Federation: https://module-federation.github.io/") },
    ],
  },
  {
    order: 6,
    slug: "deployment-delivery",
    title: "Deployment & Delivery for Frontend Systems: CI/CD, Feature Flags, A/B Testing, Canary, Rollback, CDN Strategy, Edge",
    summary: "Master deployment and delivery strategies including CI/CD, feature flags, A/B testing, canary releases, rollback procedures, CDN strategies, and edge deployment.",
    readingTimeMins: 50,
    sections: [
      { key: "overview", heading: "What You Will Learn", kind: "overview", body: createRichText("This module covers CI/CD pipelines, feature flags, A/B testing, canary deployments, rollback strategies, CDN configuration, and edge deployment patterns.") },
      { key: "prerequisites", heading: "Prerequisites", kind: "prerequisites", body: createRichText("Basic understanding of Git, build tools, and deployment concepts.") },
      { key: "mental_model", heading: "Mental Model", kind: "mentalModel", body: createRichText("Deployment is about shipping safely: automated pipelines, gradual rollouts, feature toggles, and quick rollbacks.") },
      { key: "core_concepts", heading: "Core Concepts", kind: "coreConcepts", body: createRichText("CI/CD pipelines, feature flags, A/B testing, canary deployments, blue-green deployments, CDN strategies, and edge computing.") },
      { key: "design_process", heading: "Design Process", kind: "designProcess", body: createRichText("Step 1: Set up CI/CD. Step 2: Implement feature flags. Step 3: Plan canary strategy. Step 4: Configure CDN. Step 5: Test rollback procedures.") },
      { key: "tradeoffs", heading: "Trade-offs", kind: "tradeoffs", body: createRichText("Canary vs blue-green: Canary is safer but slower. Blue-green is faster but requires more infrastructure.") },
      { key: "mistakes", heading: "Common Mistakes & How to Avoid", kind: "mistakes", body: createRichText("Mistake: No rollback plan. Fix: Always have a tested rollback procedure. Mistake: Deploying on Fridays. Fix: Deploy early in the week.") },
      { key: "case_study", heading: "Mini Case Study", kind: "caseStudy", body: createRichText("Case: High-traffic e-commerce site. Solution: CI/CD with automated tests, feature flags for gradual rollout, canary deployments, CDN for global distribution.") },
      { key: "interview_qa", heading: "Interview Q&A", kind: "interviewQA", body: createRichText("Q: How do you handle a bad deployment? A: Use feature flags to disable the feature, or rollback to previous version. Monitor error rates and user feedback.") },
      { key: "references", heading: "References", kind: "references", body: createRichText("Feature Flags Best Practices: https://launchdarkly.com/blog/") },
    ],
  },
  {
    order: 7,
    slug: "testing-strategy",
    title: "Testing Strategy for Frontend Systems: Unit, Integration, E2E, Contract Testing, and Visual Regression",
    summary: "Design comprehensive testing strategies covering unit, integration, E2E, contract, and visual regression testing for frontend systems.",
    readingTimeMins: 55,
    sections: [
      { key: "overview", heading: "What You Will Learn", kind: "overview", body: createRichText("This module covers unit testing, integration testing, end-to-end (E2E) testing, contract testing, and visual regression testing strategies.") },
      { key: "prerequisites", heading: "Prerequisites", kind: "prerequisites", body: createRichText("Basic understanding of testing concepts, familiarity with testing frameworks (Jest, React Testing Library).") },
      { key: "mental_model", heading: "Mental Model", kind: "mentalModel", body: createRichText("Testing is a pyramid: many unit tests, fewer integration tests, and minimal E2E tests. Each layer serves a different purpose.") },
      { key: "core_concepts", heading: "Core Concepts", kind: "coreConcepts", body: createRichText("Unit tests, integration tests, E2E tests, contract tests, visual regression tests, test coverage, and testing best practices.") },
      { key: "design_process", heading: "Design Process", kind: "designProcess", body: createRichText("Step 1: Define testing strategy. Step 2: Set up testing infrastructure. Step 3: Write unit tests. Step 4: Add integration tests. Step 5: Implement E2E tests for critical paths.") },
      { key: "tradeoffs", heading: "Trade-offs", kind: "tradeoffs", body: createRichText("Test coverage vs speed: High coverage catches bugs but slows development. Focus on critical paths and user journeys.") },
      { key: "mistakes", heading: "Common Mistakes & How to Avoid", kind: "mistakes", body: createRichText("Mistake: Testing implementation details. Fix: Test user behavior, not internal implementation. Mistake: Too many E2E tests. Fix: Use E2E for critical user journeys only.") },
      { key: "case_study", heading: "Mini Case Study", kind: "caseStudy", body: createRichText("Case: Complex form with validation. Solution: Unit tests for validation logic, integration tests for form flow, E2E test for complete submission flow.") },
      { key: "interview_qa", heading: "Interview Q&A", kind: "interviewQA", body: createRichText("Q: How do you test async operations? A: Use async utilities in testing libraries, mock API responses, and test loading and error states.") },
      { key: "references", heading: "References", kind: "references", body: createRichText("React Testing Library: https://testing-library.com/react") },
    ],
  },
  {
    order: 8,
    slug: "observability",
    title: "Observability for Frontend Systems: Logging, Metrics, Tracing, Session Replay Considerations, Error Boundaries, Monitoring Strategy",
    summary: "Implement comprehensive observability for frontend systems through logging, metrics, tracing, session replay, error boundaries, and monitoring strategies.",
    readingTimeMins: 60,
    sections: [
      { key: "overview", heading: "What You Will Learn", kind: "overview", body: createRichText("This module covers logging strategies, metrics collection, distributed tracing, session replay considerations, error boundary patterns, and monitoring strategies.") },
      { key: "prerequisites", heading: "Prerequisites", kind: "prerequisites", body: createRichText("Understanding of browser DevTools, basic knowledge of error handling.") },
      { key: "mental_model", heading: "Mental Model", kind: "mentalModel", body: createRichText("Observability is about understanding what's happening in production: errors, performance, user journeys, and system health.") },
      { key: "core_concepts", heading: "Core Concepts", kind: "coreConcepts", body: createRichText("Logging, metrics (performance, errors, user actions), distributed tracing, session replay, error boundaries, and monitoring dashboards.") },
      { key: "design_process", heading: "Design Process", kind: "designProcess", body: createRichText("Step 1: Define what to monitor. Step 2: Implement error boundaries. Step 3: Set up logging. Step 4: Add metrics collection. Step 5: Create monitoring dashboards.") },
      { key: "tradeoffs", heading: "Trade-offs", kind: "tradeoffs", body: createRichText("Detailed logging vs performance: More logs provide better debugging but impact performance. Use sampling and log levels.") },
      { key: "mistakes", heading: "Common Mistakes & How to Avoid", kind: "mistakes", body: createRichText("Mistake: Logging sensitive data. Fix: Sanitize logs, avoid PII. Mistake: No error boundaries. Fix: Add error boundaries at key component boundaries.") },
      { key: "case_study", heading: "Mini Case Study", kind: "caseStudy", body: createRichText("Case: Production error affecting users. Solution: Error boundaries catch errors, logging provides context, session replay shows user actions, metrics track error rate.") },
      { key: "interview_qa", heading: "Interview Q&A", kind: "interviewQA", body: createRichText("Q: How do you debug production errors? A: Use error boundaries to catch errors, log contextual information, use session replay to see user actions, and monitor error rates.") },
      { key: "references", heading: "References", kind: "references", body: createRichText("Sentry Documentation: https://docs.sentry.io/") },
    ],
  },
  {
    order: 9,
    slug: "security-privacy",
    title: "Security & Privacy for Frontend Systems: XSS/CSRF/CSP, Auth Flows, Token Storage, Clickjacking, Dependency Risk, PII Handling, GDPR-like Principles",
    summary: "Secure frontend systems against common vulnerabilities and implement privacy-compliant practices for user data handling.",
    readingTimeMins: 65,
    sections: [
      { key: "overview", heading: "What You Will Learn", kind: "overview", body: createRichText("This module covers XSS/CSRF/CSP defenses, authentication flows, secure token storage, clickjacking prevention, dependency risk management, PII handling, and GDPR compliance principles.") },
      { key: "prerequisites", heading: "Prerequisites", kind: "prerequisites", body: createRichText("Basic understanding of web security concepts, HTTP, and browser security model.") },
      { key: "mental_model", heading: "Mental Model", kind: "mentalModel", body: createRichText("Security is about defense in depth: validate input, sanitize output, use secure headers, and follow principle of least privilege.") },
      { key: "core_concepts", heading: "Core Concepts", kind: "coreConcepts", body: createRichText("XSS (Cross-Site Scripting), CSRF (Cross-Site Request Forgery), CSP (Content Security Policy), secure authentication, token storage, clickjacking, dependency vulnerabilities, and PII handling.") },
      { key: "design_process", heading: "Design Process", kind: "designProcess", body: createRichText("Step 1: Implement CSP headers. Step 2: Sanitize user input. Step 3: Use secure authentication. Step 4: Secure token storage. Step 5: Audit dependencies.") },
      { key: "tradeoffs", heading: "Trade-offs", kind: "tradeoffs", body: createRichText("Security vs usability: Stricter security may impact user experience. Balance security requirements with usability needs.") },
      { key: "mistakes", heading: "Common Mistakes & How to Avoid", kind: "mistakes", body: createRichText("Mistake: Storing tokens in localStorage. Fix: Use httpOnly cookies or secure storage. Mistake: Not sanitizing user input. Fix: Always sanitize and validate user input.") },
      { key: "case_study", heading: "Mini Case Study", kind: "caseStudy", body: createRichText("Case: User authentication system. Solution: JWT tokens in httpOnly cookies, CSP headers, input sanitization, CSRF tokens, and secure password handling.") },
      { key: "interview_qa", heading: "Interview Q&A", kind: "interviewQA", body: createRichText("Q: How do you prevent XSS attacks? A: Sanitize user input, use CSP headers, avoid innerHTML with user data, and use React's built-in XSS protection.") },
      { key: "references", heading: "References", kind: "references", body: createRichText("OWASP Top 10: https://owasp.org/www-project-top-ten/") },
    ],
  },
  {
    order: 10,
    slug: "real-time-systems",
    title: "Real-time Frontend Systems: WebSockets vs SSE, Sync Models, Conflict Handling, Backpressure, and Resilience",
    summary: "Build real-time frontend systems using WebSockets and SSE, implement sync models, handle conflicts, manage backpressure, and ensure resilience.",
    readingTimeMins: 55,
    sections: [
      { key: "overview", heading: "What You Will Learn", kind: "overview", body: createRichText("This module covers WebSockets vs Server-Sent Events (SSE), synchronization models, conflict resolution strategies, backpressure handling, and resilience patterns.") },
      { key: "prerequisites", heading: "Prerequisites", kind: "prerequisites", body: createRichText("Understanding of HTTP, basic knowledge of WebSockets or SSE.") },
      { key: "mental_model", heading: "Mental Model", kind: "mentalModel", body: createRichText("Real-time systems require bidirectional communication (WebSockets) or server push (SSE), with conflict resolution and reconnection strategies.") },
      { key: "core_concepts", heading: "Core Concepts", kind: "coreConcepts", body: createRichText("WebSockets, Server-Sent Events (SSE), synchronization models, conflict resolution (last-write-wins, operational transforms), backpressure, and reconnection strategies.") },
      { key: "design_process", heading: "Design Process", kind: "designProcess", body: createRichText("Step 1: Choose WebSocket vs SSE. Step 2: Design sync model. Step 3: Implement conflict resolution. Step 4: Handle backpressure. Step 5: Add reconnection logic.") },
      { key: "tradeoffs", heading: "Trade-offs", kind: "tradeoffs", body: createRichText("WebSocket vs SSE: WebSocket enables bidirectional communication but is more complex. SSE is simpler but server-to-client only.") },
      { key: "mistakes", heading: "Common Mistakes & How to Avoid", kind: "mistakes", body: createRichText("Mistake: Not handling reconnections. Fix: Implement exponential backoff and reconnection logic. Mistake: Ignoring backpressure. Fix: Implement message queuing and rate limiting.") },
      { key: "case_study", heading: "Mini Case Study", kind: "caseStudy", body: createRichText("Case: Real-time chat application. Solution: WebSocket for bidirectional communication, message queuing for backpressure, reconnection with exponential backoff, conflict resolution using timestamps.") },
      { key: "interview_qa", heading: "Interview Q&A", kind: "interviewQA", body: createRichText("Q: When would you use SSE over WebSocket? A: When you only need server-to-client communication (e.g., live updates, notifications). SSE is simpler and works over HTTP.") },
      { key: "references", heading: "References", kind: "references", body: createRichText("MDN WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API") },
    ],
  },
  {
    order: 11,
    slug: "large-scale-ux",
    title: "Large-scale UX Systems: Virtualization, Pagination vs Infinite Scroll, Search, Forms, Validation, Autosave",
    summary: "Design large-scale UX systems with virtualization, navigation patterns, search, form handling, validation, and autosave capabilities.",
    readingTimeMins: 50,
    sections: [
      { key: "overview", heading: "What You Will Learn", kind: "overview", body: createRichText("This module covers virtualization techniques, pagination vs infinite scroll trade-offs, search implementation, form handling, validation strategies, and autosave patterns.") },
      { key: "prerequisites", heading: "Prerequisites", kind: "prerequisites", body: createRichText("React basics, understanding of DOM performance, basic accessibility awareness.") },
      { key: "mental_model", heading: "Mental Model", kind: "mentalModel", body: createRichText("Large-scale UX is about keeping the UI fast, navigable, and reliable when data or forms get big.") },
      { key: "core_concepts", heading: "Core Concepts", kind: "coreConcepts", body: createRichText("Virtualization (rendering only visible items), pagination vs infinite scroll, debounced search, form validation, autosave, and accessibility considerations.") },
      { key: "design_process", heading: "Design Process", kind: "designProcess", body: createRichText("Step 1: Pick navigation model (pagination vs infinite scroll). Step 2: Virtualize long lists. Step 3: Implement debounced search. Step 4: Design form validation. Step 5: Add autosave.") },
      { key: "tradeoffs", heading: "Trade-offs", kind: "tradeoffs", body: createRichText("Pagination vs infinite scroll: Pagination provides better orientation but more clicks. Infinite scroll is smoother but harder to navigate and can harm accessibility.") },
      { key: "mistakes", heading: "Common Mistakes & How to Avoid", kind: "mistakes", body: createRichText("Mistake: Infinite scroll for search results. Fix: Use pagination for goal-driven lists. Mistake: No abort for search. Fix: Use AbortController to cancel stale requests.") },
      { key: "case_study", heading: "Mini Case Study", kind: "caseStudy", body: createRichText("Case: Customer directory with 10k rows. Solution: Pagination for navigation, virtualization for list rendering, debounced search with AbortController, autosave for notes.") },
      { key: "interview_qa", heading: "Interview Q&A", kind: "interviewQA", body: createRichText("Q: When to avoid infinite scroll? A: For goal-driven tasks needing orientation, like search results or admin tables. Use pagination instead.") },
      { key: "references", heading: "References", kind: "references", body: createRichText("web.dev - Virtualize long lists: https://web.dev/articles/virtualize-long-lists-react-window") },
    ],
  },
  {
    order: 12,
    slug: "capstone-designs",
    title: "Capstone Frontend System Designs: E-commerce PDP/Checkout, Dashboard/Analytics, Chat/Collab, Media Streaming UI",
    summary: "Apply all concepts through comprehensive capstone designs for e-commerce, dashboards, chat/collaboration, and media streaming interfaces.",
    readingTimeMins: 80,
    sections: [
      { key: "overview", heading: "What You Will Learn", kind: "overview", body: createRichText("This capstone module covers end-to-end system designs for e-commerce product detail pages and checkout flows, analytics dashboards, chat/collaboration interfaces, and media streaming UIs.") },
      { key: "prerequisites", heading: "Prerequisites", kind: "prerequisites", body: createRichText("Completion of previous modules, React + TypeScript, Core Web Vitals familiarity, WebSocket/SSE basics.") },
      { key: "mental_model", heading: "Mental Model", kind: "mentalModel", body: createRichText("Capstone design applies all concepts: define constraints, pick rendering, design data/state, add performance, add resilience, secure, observe, and test.") },
      { key: "core_concepts", heading: "Core Concepts", kind: "coreConcepts", body: createRichText("E-commerce: correctness + trust + fast first content. Dashboard: CPU/memory and data freshness. Chat/collab: ordering, reconnect, conflict rules. Media: playback smoothness.") },
      { key: "design_process", heading: "Design Process", kind: "designProcess", body: createRichText("Step 1: Write constraints. Step 2: Choose architecture. Step 3: Define truth boundaries. Step 4: Design recovery paths. Step 5: Plan monitoring.") },
      { key: "tradeoffs", heading: "Trade-offs", kind: "tradeoffs", body: createRichText("E-commerce: SSR/SSG for fast/SEO + trust but hydration complexity. Dashboard: CSR + caching + virtualization for fast interactions but JS/CPU cost. Chat: WebSocket + resume for low latency but ordering and drift challenges.") },
      { key: "mistakes", heading: "Common Mistakes & How to Avoid", kind: "mistakes", body: createRichText("Mistake: No rollback/recovery. Fix: Reconnect and reconcile; keep last known good release. Mistake: Ignoring security headers. Fix: CSP and frame-ancestors deny on sensitive routes.") },
      { key: "case_study", heading: "Mini Case Study", kind: "caseStudy", body: createRichText("Case: Mobile-heavy e-commerce PDP and checkout. Solution: SSR/SSG for PDP content, validate inventory/price at action time, optimize hero image for LCP, strict CSP and clickjacking protection for checkout.") },
      { key: "interview_qa", heading: "Interview Q&A", kind: "interviewQA", body: createRichText("Q: How do you keep chat correct after reconnect? A: Dedupe by id + snapshot reconcile. Use client IDs for optimistic messages, reconcile on server acknowledgment.") },
      { key: "references", heading: "References", kind: "references", body: createRichText("MDN WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API") },
    ],
  },
];

// Animated examples data (3-7 per module)
const examplesData = {
  foundations: [
    {
      exampleId: "foundations-requirements-flow",
      title: "Requirements → Constraints → Architecture Decisions",
      description: "Shows how requirements flow into constraints and ultimately architectural decisions",
      placementHint: "mentalModel",
      kind: "flow2d",
      whatToNotice: [
        { item: "Requirements drive constraints" },
        { item: "Constraints influence architecture choices" },
        { item: "Trade-offs are explicit at each step" },
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
    {
      exampleId: "foundations-design-process",
      title: "8-Step Design Process",
      description: "Visualizes the step-by-step frontend system design process",
      placementHint: "coreConcepts",
      kind: "timeline2d",
      whatToNotice: [
        { item: "Process starts with goals and constraints" },
        { item: "Each step builds on the previous" },
        { item: "Security and observability come last" },
      ],
      controls: { mode: "stepper", initialStep: 0 },
      spec: {
        lanes: ["Planning", "Architecture", "Implementation"],
        steps: [
          { id: "s1", label: "Goals", lane: "Planning", time: 0 },
          { id: "s2", label: "Constraints", lane: "Planning", time: 1 },
          { id: "s3", label: "Rendering", lane: "Architecture", time: 2 },
          { id: "s4", label: "Data Strategy", lane: "Architecture", time: 3 },
          { id: "s5", label: "State Boundaries", lane: "Architecture", time: 4 },
          { id: "s6", label: "Resilience", lane: "Implementation", time: 5 },
          { id: "s7", label: "Security", lane: "Implementation", time: 6 },
          { id: "s8", label: "Delivery", lane: "Implementation", time: 7 },
        ],
      },
    },
  ],
  "rendering-data-lifecycles": [
    {
      exampleId: "rendering-csr-vs-ssr",
      title: "CSR vs SSR Request Flow",
      description: "Compares client-side and server-side rendering request flows",
      placementHint: "coreConcepts",
      kind: "diff2d",
      whatToNotice: [
        { item: "CSR requires JavaScript execution before content" },
        { item: "SSR sends HTML immediately" },
        { item: "SSR has faster First Contentful Paint" },
      ],
      controls: { mode: "toggle", toggleLabels: [{ label: "CSR" }, { label: "SSR" }] },
      spec: {
        left: {
          title: "CSR",
          steps: [
            { id: "1", label: "Request HTML", lane: "client" },
            { id: "2", label: "Load JS", lane: "client" },
            { id: "3", label: "Execute JS", lane: "client" },
            { id: "4", label: "Fetch Data", lane: "client" },
            { id: "5", label: "Render", lane: "client" },
          ],
        },
        right: {
          title: "SSR",
          steps: [
            { id: "1", label: "Request HTML", lane: "client" },
            { id: "2", label: "Server Renders", lane: "server" },
            { id: "3", label: "Send HTML", lane: "server" },
            { id: "4", label: "Hydrate", lane: "client" },
          ],
        },
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

  console.log("🌱 Seeding curriculum modules and animated examples...\n");

  try {
    const createdModules = new Map();

    // Seed modules first
    for (const moduleData of modulesData) {
      const existing = await retryOperation(() =>
        payload.find({
          collection: "curriculum_modules",
          where: {
            slug: {
              equals: moduleData.slug,
            },
          },
          limit: 1,
        })
      );

      let moduleId;
      if (existing.docs.length > 0) {
        if (force) {
          const updated = await retryOperation(() =>
            payload.update({
              collection: "curriculum_modules",
              id: existing.docs[0].id,
              data: moduleData,
            })
          );
          moduleId = updated.id;
          console.log(`✓ Updated module: ${moduleData.title}`);
        } else {
          moduleId = existing.docs[0].id;
          console.log(`⊘ Skipped existing module: ${moduleData.slug}`);
        }
      } else {
        const created = await retryOperation(() =>
          payload.create({
            collection: "curriculum_modules",
            data: moduleData,
          })
        );
        moduleId = created.id;
        console.log(`✓ Created module: ${moduleData.title} (ID: ${moduleId})`);
      }
      createdModules.set(moduleData.slug, moduleId);
    }

    // Seed animated examples
    console.log("\n🎬 Seeding animated examples...\n");
    for (const [moduleSlug, examples] of Object.entries(examplesData)) {
      const moduleId = createdModules.get(moduleSlug);
      if (!moduleId) {
        console.warn(`⚠️  Module ${moduleSlug} not found, skipping examples`);
        continue;
      }

      for (const exampleData of examples) {
        const existing = await retryOperation(() =>
          payload.find({
            collection: "animated_examples",
            where: {
              exampleId: {
                equals: exampleData.exampleId,
              },
            },
            limit: 1,
          })
        );

        const examplePayload = {
          ...exampleData,
          module: moduleId,
        };

        if (existing.docs.length > 0) {
          if (force) {
            await retryOperation(() =>
              payload.update({
                collection: "animated_examples",
                id: existing.docs[0].id,
                data: examplePayload,
              })
            );
            console.log(`  ✓ Updated example: ${exampleData.exampleId}`);
          } else {
            console.log(`  ⊘ Skipped existing example: ${exampleData.exampleId}`);
          }
        } else {
          await retryOperation(() =>
            payload.create({
              collection: "animated_examples",
              data: examplePayload,
            })
          );
          console.log(`  ✓ Created example: ${exampleData.exampleId}`);
        }
      }
    }

    console.log("\n✅ Curriculum seeding completed successfully!");

  } catch (error) {
    console.error("❌ Error seeding curriculum:", error);
    throw error;
  }

  process.exit(0);
}

seedCurriculum();

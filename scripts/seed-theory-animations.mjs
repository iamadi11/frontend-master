import { getPayload } from "payload";
import { config as dotenvConfig } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenvConfig({ path: join(__dirname, "..", ".env.local") });

/**
 * Block templates for different animation types
 */
const blockTemplates = {
  timeline2d: {
    requestLifecycle: (topicSlug) => ({
      id: `${topicSlug}-timeline-request`,
      title: "Request Lifecycle Timeline",
      description: "Shows the phases of a request from browser to server and back",
      kind: "timeline2d",
      steps: [
        { id: "req-1", label: "Request", description: "Browser sends HTTP request", lane: "client" },
        { id: "req-2", label: "Network", description: "Request travels over network", lane: "default" },
        { id: "req-3", label: "Server", description: "Server processes request", lane: "server" },
        { id: "req-4", label: "Response", description: "Server sends response back", lane: "server" },
        { id: "req-5", label: "Render", description: "Browser renders the response", lane: "client" },
      ],
      whatToNotice: [
        "Request flows from client to server",
        "Network latency affects total time",
        "Server processing is a critical phase",
        "Response must travel back to client",
      ],
    }),
    renderPhases: (topicSlug) => ({
      id: `${topicSlug}-timeline-render`,
      title: "Rendering Phases",
      description: "Shows the sequence of rendering phases",
      kind: "timeline2d",
      steps: [
        { id: "render-1", label: "Parse", description: "HTML parsing begins", lane: "client" },
        { id: "render-2", label: "Build", description: "DOM tree construction", lane: "client" },
        { id: "render-3", label: "Layout", description: "Layout calculation", lane: "client" },
        { id: "render-4", label: "Paint", description: "Pixels painted to screen", lane: "client" },
      ],
      whatToNotice: [
        "Each phase depends on the previous",
        "Layout can trigger reflow",
        "Paint is the final visual output",
      ],
    }),
    hydrationSequence: (topicSlug) => ({
      id: `${topicSlug}-timeline-hydration`,
      title: "Hydration Sequence",
      description: "Shows how server-rendered HTML is hydrated with client-side JavaScript",
      kind: "timeline2d",
      steps: [
        { id: "hyd-1", label: "SSR HTML", description: "Server sends HTML", lane: "server" },
        { id: "hyd-2", label: "Parse", description: "Browser parses HTML", lane: "client" },
        { id: "hyd-3", label: "Display", description: "Initial paint (fast)", lane: "client" },
        { id: "hyd-4", label: "JS Load", description: "JavaScript bundle loads", lane: "client" },
        { id: "hyd-5", label: "Hydrate", description: "React attaches to DOM", lane: "client" },
        { id: "hyd-6", label: "Interactive", description: "Event handlers active", lane: "client" },
      ],
      whatToNotice: [
        "Users see content before JS loads",
        "Hydration connects server HTML to client state",
        "Mismatch between SSR and client can cause errors",
      ],
    }),
    cachingStages: (topicSlug) => ({
      id: `${topicSlug}-timeline-cache`,
      title: "Caching Stages",
      description: "Shows how content moves through cache layers",
      kind: "timeline2d",
      steps: [
        { id: "cache-1", label: "Request", description: "User request arrives", lane: "client" },
        { id: "cache-2", label: "Browser", description: "Check browser cache", lane: "client" },
        { id: "cache-3", label: "CDN", description: "Check CDN edge cache", lane: "edge" },
        { id: "cache-4", label: "Origin", description: "Fetch from origin server", lane: "server" },
        { id: "cache-5", label: "Store", description: "Store in cache layers", lane: "default" },
      ],
      whatToNotice: [
        "Each cache layer reduces server load",
        "Cache hits are faster than misses",
        "Cache invalidation is critical",
      ],
    }),
  },
  flow2d: {
    clientServerFlow: (topicSlug) => ({
      id: `${topicSlug}-flow-client-server`,
      title: "Client-Server Data Flow",
      description: "Shows how data flows between client and server",
      kind: "flow2d",
      nodes: [
        { id: "user", label: "User", type: "source" },
        { id: "ui", label: "UI Layer", type: "process" },
        { id: "api", label: "API", type: "process" },
        { id: "db", label: "Database", type: "sink" },
      ],
      edges: [
        { from: "user", to: "ui", label: "Input" },
        { from: "ui", to: "api", label: "Request" },
        { from: "api", to: "db", label: "Query" },
        { from: "db", to: "api", label: "Data" },
        { from: "api", to: "ui", label: "Response" },
        { from: "ui", to: "user", label: "Display" },
      ],
      whatToNotice: [
        "Data flows in a cycle",
        "Each layer has a specific role",
        "API acts as a bridge between UI and DB",
      ],
      defaultState: { activeNodeId: "user" },
    }),
    renderPipeline: (topicSlug) => ({
      id: `${topicSlug}-flow-render`,
      title: "Render Pipeline",
      description: "Shows the render pipeline from data to pixels",
      kind: "flow2d",
      nodes: [
        { id: "data", label: "Data", type: "source" },
        { id: "components", label: "Components", type: "process" },
        { id: "vdom", label: "Virtual DOM", type: "process" },
        { id: "dom", label: "DOM", type: "process" },
        { id: "pixels", label: "Pixels", type: "sink" },
      ],
      edges: [
        { from: "data", to: "components", label: "Props" },
        { from: "components", to: "vdom", label: "Render" },
        { from: "vdom", to: "dom", label: "Diff" },
        { from: "dom", to: "pixels", label: "Paint" },
      ],
      whatToNotice: [
        "Virtual DOM enables efficient updates",
        "Diffing minimizes DOM changes",
        "Paint is the final step",
      ],
      defaultState: { activeNodeId: "data" },
    }),
    telemetryPipeline: (topicSlug) => ({
      id: `${topicSlug}-flow-telemetry`,
      title: "Telemetry Pipeline",
      description: "Shows how observability data flows through the system",
      kind: "flow2d",
      nodes: [
        { id: "app", label: "Application", type: "source" },
        { id: "collect", label: "Collector", type: "process" },
        { id: "process", label: "Processor", type: "process" },
        { id: "store", label: "Storage", type: "sink" },
        { id: "dashboard", label: "Dashboard", type: "sink" },
      ],
      edges: [
        { from: "app", to: "collect", label: "Logs/Metrics" },
        { from: "collect", to: "process", label: "Raw Data" },
        { from: "process", to: "store", label: "Processed" },
        { from: "store", to: "dashboard", label: "Query" },
      ],
      whatToNotice: [
        "Data flows from app to storage",
        "Processing can filter and aggregate",
        "Dashboards query stored data",
      ],
      defaultState: { activeNodeId: "app" },
    }),
  },
  diff2d: {
    ssrVsCsr: (topicSlug) => ({
      id: `${topicSlug}-diff-ssr-csr`,
      title: "SSR vs CSR Trade-offs",
      description: "Compares server-side rendering with client-side rendering",
      kind: "diff2d",
      before: {
        title: "Client-Side Rendering (CSR)",
        items: [
          "Fast initial load (empty shell)",
          "SEO challenges",
          "JavaScript required",
          "Client-side data fetching",
        ],
      },
      after: {
        title: "Server-Side Rendering (SSR)",
        items: [
          "Slower initial load (server processing)",
          "Better SEO",
          "Works without JavaScript",
          "Server-side data fetching",
        ],
      },
      highlights: [
        { side: "before", itemIndex: 0, type: "added" },
        { side: "after", itemIndex: 1, type: "added" },
        { side: "before", itemIndex: 2, type: "changed" },
        { side: "after", itemIndex: 2, type: "changed" },
      ],
      whatToNotice: [
        "CSR prioritizes interactivity",
        "SSR prioritizes SEO and initial content",
        "Choose based on requirements",
      ],
    }),
    cachingStrategies: (topicSlug) => ({
      id: `${topicSlug}-diff-cache`,
      title: "Caching Strategy Comparison",
      description: "Compares different caching approaches",
      kind: "diff2d",
      before: {
        title: "No Caching",
        items: [
          "Every request hits origin",
          "High server load",
          "Slower responses",
          "Higher costs",
        ],
      },
      after: {
        title: "Multi-Layer Caching",
        items: [
          "Browser cache first",
          "CDN edge cache",
          "Faster responses",
          "Lower server costs",
        ],
      },
      highlights: [
        { side: "before", itemIndex: 0, type: "removed" },
        { side: "after", itemIndex: 0, type: "added" },
        { side: "before", itemIndex: 1, type: "removed" },
        { side: "after", itemIndex: 1, type: "added" },
      ],
      whatToNotice: [
        "Caching reduces server load",
        "Multiple layers improve performance",
        "Cache invalidation is important",
      ],
    }),
  },
};

/**
 * Generate blocks for each topic based on its slug
 */
function generateBlocksForTopic(topicSlug, topicOrder) {
  const blocks = [];

  switch (topicSlug) {
    case "foundations":
      blocks.push(blockTemplates.flow2d.clientServerFlow(topicSlug));
      blocks.push(blockTemplates.timeline2d.requestLifecycle(topicSlug));
      blocks.push(blockTemplates.diff2d.ssrVsCsr(topicSlug));
      break;

    case "rendering-strategies":
      blocks.push(blockTemplates.timeline2d.hydrationSequence(topicSlug));
      blocks.push(blockTemplates.timeline2d.renderPhases(topicSlug));
      blocks.push(blockTemplates.diff2d.ssrVsCsr(topicSlug));
      blocks.push(blockTemplates.timeline2d.cachingStages(topicSlug));
      break;

    case "state-management-at-scale":
      blocks.push(blockTemplates.flow2d.clientServerFlow(topicSlug));
      blocks.push(blockTemplates.timeline2d.requestLifecycle(topicSlug));
      blocks.push(blockTemplates.diff2d.cachingStrategies(topicSlug));
      break;

    case "performance-system-design":
      blocks.push(blockTemplates.timeline2d.cachingStages(topicSlug));
      blocks.push(blockTemplates.flow2d.renderPipeline(topicSlug));
      blocks.push(blockTemplates.diff2d.cachingStrategies(topicSlug));
      break;

    case "component-ui-architecture":
      blocks.push(blockTemplates.flow2d.renderPipeline(topicSlug));
      blocks.push(blockTemplates.timeline2d.renderPhases(topicSlug));
      blocks.push(blockTemplates.diff2d.cachingStrategies(topicSlug));
      break;

    case "release-delivery":
    case "deployment-delivery":
      blocks.push(blockTemplates.timeline2d.requestLifecycle(topicSlug));
      blocks.push(blockTemplates.flow2d.clientServerFlow(topicSlug));
      blocks.push(blockTemplates.timeline2d.cachingStages(topicSlug));
      break;

    case "testing-strategy":
      blocks.push(blockTemplates.flow2d.renderPipeline(topicSlug));
      blocks.push(blockTemplates.timeline2d.requestLifecycle(topicSlug));
      blocks.push(blockTemplates.diff2d.cachingStrategies(topicSlug));
      break;

    case "observability":
      blocks.push(blockTemplates.flow2d.telemetryPipeline(topicSlug));
      blocks.push(blockTemplates.timeline2d.requestLifecycle(topicSlug));
      blocks.push(blockTemplates.flow2d.clientServerFlow(topicSlug));
      break;

    case "security-privacy":
      blocks.push(blockTemplates.flow2d.clientServerFlow(topicSlug));
      blocks.push(blockTemplates.timeline2d.requestLifecycle(topicSlug));
      blocks.push(blockTemplates.diff2d.ssrVsCsr(topicSlug));
      break;

    case "realtime-systems":
      blocks.push(blockTemplates.flow2d.clientServerFlow(topicSlug));
      blocks.push(blockTemplates.timeline2d.requestLifecycle(topicSlug));
      blocks.push(blockTemplates.flow2d.telemetryPipeline(topicSlug));
      break;

    case "large-scale-ux":
      blocks.push(blockTemplates.flow2d.renderPipeline(topicSlug));
      blocks.push(blockTemplates.timeline2d.renderPhases(topicSlug));
      blocks.push(blockTemplates.timeline2d.cachingStages(topicSlug));
      break;

    case "capstone":
    case "capstone-builder":
      blocks.push(blockTemplates.flow2d.clientServerFlow(topicSlug));
      blocks.push(blockTemplates.timeline2d.requestLifecycle(topicSlug));
      blocks.push(blockTemplates.flow2d.renderPipeline(topicSlug));
      blocks.push(blockTemplates.timeline2d.cachingStages(topicSlug));
      break;

    default:
      // Fallback: add generic blocks
      blocks.push(blockTemplates.timeline2d.requestLifecycle(topicSlug));
      blocks.push(blockTemplates.flow2d.clientServerFlow(topicSlug));
  }

  return blocks;
}

/**
 * Main seed function
 */
async function seedTheoryAnimations(force = false) {
  console.log("🌱 Seeding Theory Animated Explanation Blocks...\n");

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
    // Fetch all topics
    const result = await payload.find({
      collection: "topics",
      limit: 100,
      sort: "order",
    });

    const topics = result.docs;

    if (topics.length === 0) {
      console.log("❌ No topics found. Run seed.mjs first to create topics.");
      return 1;
    }

    console.log(`Found ${topics.length} topics\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const topic of topics) {
      const existingBlocks = topic.theoryAnimations || [];
      const hasBlocks = Array.isArray(existingBlocks) && existingBlocks.length >= 2;

      if (hasBlocks && !force) {
        console.log(`⏭️  Topic ${topic.order} (${topic.slug}): Already has ${existingBlocks.length} blocks, skipping`);
        skipped++;
        continue;
      }

      try {
        const newBlocks = generateBlocksForTopic(topic.slug, topic.order);

        if (newBlocks.length === 0) {
          console.log(`⚠️  Topic ${topic.order} (${topic.slug}): No blocks generated`);
          continue;
        }

        await payload.update({
          collection: "topics",
          id: topic.id,
          data: {
            theoryAnimations: newBlocks,
          },
        });

        console.log(`✓ Topic ${topic.order} (${topic.slug}): Added ${newBlocks.length} blocks`);
        updated++;
      } catch (error) {
        console.error(`❌ Topic ${topic.order} (${topic.slug}): Error - ${error.message}`);
        errors++;
      }
    }

    console.log("\n" + "─".repeat(60));
    console.log(`Summary: ${updated} updated, ${skipped} skipped, ${errors} errors`);
    console.log("─".repeat(60));

    return errors > 0 ? 1 : 0;
  } catch (error) {
    console.error("❌ Seed failed:", error);
    return 1;
  } finally {
    // Payload cleanup
    if (payload && typeof payload.db?.destroy === "function") {
      await payload.db.destroy();
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const force = args.includes("--force");

// Run seed
seedTheoryAnimations(force)
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });


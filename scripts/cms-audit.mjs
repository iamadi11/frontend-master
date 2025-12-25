import { getPayload } from "payload";
import { config as dotenvConfig } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenvConfig({ path: join(__dirname, "..", ".env.local") });

// Expected topics from curriculum-index.md
const EXPECTED_TITLES = [
  "Frontend System Design Foundations: Requirements, Constraints, and Architecture Thinking",
  "Rendering Strategies & Data Lifecycles: CSR, SSR, SSG, ISR, Streaming, Hydration, Routing, Fetching, Caching, Revalidation",
  "State Management at Scale: Server State vs Client State, Async Orchestration, Optimistic Updates, and Offline",
  "Performance System Design: Core Web Vitals, Loading Strategies, Bundles, Caching, Images/Video, CPU/Memory, and Long Tasks",
  "Component & UI Architecture: Design Systems, Theming, Tokens, Micro-frontends, and Module Federation Trade-offs",
  "Deployment & Delivery for Frontend Systems: CI/CD, Feature Flags, A/B Testing, Canary, Rollback, CDN Strategy, Edge",
  "Testing Strategy for Frontend Systems: Unit, Integration, E2E, Contract Testing, and Visual Regression",
  "Observability for Frontend Systems: Logging, Metrics, Tracing, Session Replay Considerations, Error Boundaries, Monitoring Strategy",
  "Security & Privacy for Frontend Systems: XSS/CSRF/CSP, Auth Flows, Token Storage, Clickjacking, Dependency Risk, PII Handling, GDPR-like Principles",
  "Real-time Frontend Systems: WebSockets vs SSE, Sync Models, Conflict Handling, Backpressure, and Resilience",
  "Large-scale UX Systems: Virtualization, Pagination vs Infinite Scroll, Search, Forms, Validation, Autosave",
  "Capstone Frontend System Designs: E-commerce PDP/Checkout, Dashboard/Analytics, Chat/Collab, Media Streaming UI",
];

/**
 * Extracts text from a Lexical node
 */
function extractText(node) {
  if (node.text) {
    return node.text;
  }
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(extractText).join("");
  }
  return "";
}

/**
 * Finds headings in theory content
 */
function findHeadings(theory) {
  const headings = [];
  if (!theory || !theory.root || !theory.root.children) {
    return headings;
  }

  function traverse(node) {
    if (node.type === "heading" && node.tag) {
      const text = extractText(node);
      headings.push({ level: node.tag, text: text.toLowerCase() });
    }
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(traverse);
    }
  }

  theory.root.children.forEach(traverse);
  return headings;
}

/**
 * Required headings from Topic Page Contract
 */
const REQUIRED_HEADINGS = [
  "what you will learn",
  "prerequisites",
  "mental model",
  "core concepts",
  "design process",
  "trade-offs",
  "common mistakes",
  "mini case study",
  "interview q&a",
];

/**
 * Validates if theory field has meaningful content and required headings
 * Lexical richText structure: root with children array
 */
function validateTheory(theory) {
  if (!theory) {
    return { valid: false, reason: "Missing", missingHeadings: REQUIRED_HEADINGS };
  }

  if (typeof theory === "object" && theory.root) {
    const children = theory.root.children || [];
    if (children.length === 0) {
      return { valid: false, reason: "Empty root", missingHeadings: REQUIRED_HEADINGS };
    }

    // Count total text content
    let totalTextLength = 0;
    function countText(node) {
      if (node.text) {
        totalTextLength += node.text.length;
      }
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(countText);
      }
    }
    children.forEach(countText);

    // Require at least 100 characters of actual text
    if (totalTextLength < 100) {
      return { valid: false, reason: `Too short (${totalTextLength} chars)`, missingHeadings: REQUIRED_HEADINGS };
    }

    // Check for required headings (case-insensitive)
    const headings = findHeadings(theory);
    const headingTexts = headings.map(h => h.text.toLowerCase());
    const missingHeadings = REQUIRED_HEADINGS.filter(
      required => !headingTexts.some(h => {
        const normalizedH = h.toLowerCase();
        const normalizedReq = required.toLowerCase();
        return normalizedH.includes(normalizedReq) || normalizedReq.includes(normalizedH);
      })
    );

    // Check for 3D Mental Model section (case-insensitive)
    const has3DMentalModel = headingTexts.some(h => {
      const normalized = h.toLowerCase();
      return normalized.includes("3d mental model") || 
             (normalized.includes("3d") && normalized.includes("mental"));
    });

    return { 
      valid: totalTextLength >= 100, 
      charCount: totalTextLength,
      missingHeadings: missingHeadings.length > 0 ? missingHeadings : null,
      has3DMentalModel,
      headings: headings.length
    };
  }

  return { valid: false, reason: "Invalid format", missingHeadings: REQUIRED_HEADINGS };
}

/**
 * Compares topic title against expected curriculum title
 */
function compareTitles(actualTitle, expectedTitle) {
  const normalize = (str) =>
    str.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();

  const actual = normalize(actualTitle);
  const expected = normalize(expectedTitle);

  if (actual === expected) return { match: true };
  
  // Check if titles are similar (contains most words)
  const expectedWords = expected.split(" ");
  const actualWords = actual.split(" ");
  const matchedWords = expectedWords.filter((word) =>
    actualWords.includes(word)
  );

  if (matchedWords.length >= expectedWords.length * 0.7) {
    return { match: "partial", diff: `"${actualTitle}" vs "${expectedTitle}"` };
  }

  return { match: false, diff: `"${actualTitle}" vs "${expectedTitle}"` };
}

/**
 * Main audit function
 */
async function audit() {
  console.log("🔍 CMS Audit: Validating all 12 topics...\n");

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

    // Validation results
    const issues = [];
    const warnings = [];

    // Check count
    if (topics.length !== 12) {
      issues.push(
        `❌ Expected 12 topics, found ${topics.length}`
      );
    } else {
      console.log(`✓ Found 12 topics\n`);
    }

    // Check orders (1-12 with no gaps/duplicates)
    const orders = topics.map((t) => t.order).sort((a, b) => a - b);
    const expectedOrders = Array.from({ length: 12 }, (_, i) => i + 1);
    const orderMismatches = expectedOrders.filter(
      (expected, idx) => orders[idx] !== expected
    );
    if (orderMismatches.length > 0) {
      issues.push(
        `❌ Order gaps/duplicates detected. Expected [1-12], got [${orders.join(", ")}]`
      );
    } else {
      console.log(`✓ Orders are correct (1-12, no gaps)\n`);
    }

    // Check for duplicate slugs
    const slugs = topics.map((t) => t.slug);
    const duplicateSlugs = slugs.filter(
      (slug, index) => slugs.indexOf(slug) !== index
    );
    if (duplicateSlugs.length > 0) {
      issues.push(`❌ Duplicate slugs: ${duplicateSlugs.join(", ")}`);
    } else {
      console.log(`✓ All slugs are unique\n`);
    }

    // Table header
    console.log("─".repeat(160));
    console.log(
      `${"Order".padEnd(6)} | ${"Slug".padEnd(25)} | ${"Title Match".padEnd(12)} | ${"Theory".padEnd(20)} | ${"Refs".padEnd(5)} | ${"Steps".padEnd(6)} | ${"Tasks".padEnd(6)} | ${"Animations".padEnd(10)} | Issues`
    );
    console.log("─".repeat(160));

    // Validate each topic
    for (const topic of topics) {
      const topicIssues = [];
      const topicWarnings = [];

      // Title validation
      const expectedTitle = EXPECTED_TITLES[topic.order - 1];
      let titleMatchStr = "N/A";
      if (expectedTitle) {
        const titleComparison = compareTitles(topic.title, expectedTitle);
        if (titleComparison.match === true) {
          titleMatchStr = "✓ Match";
        } else if (titleComparison.match === "partial") {
          titleMatchStr = "~ Partial";
          topicWarnings.push(`Title differs: ${titleComparison.diff}`);
        } else {
          titleMatchStr = "✗ Mismatch";
          topicWarnings.push(`Title mismatch: ${titleComparison.diff}`);
        }
      }

      // Theory validation
      const theoryValidation = validateTheory(topic.theory);
      let theoryStatus = "";
      if (theoryValidation.valid) {
        let statusParts = [`✓ OK (${theoryValidation.charCount}ch, ${theoryValidation.headings} headings)`];
        if (theoryValidation.missingHeadings && theoryValidation.missingHeadings.length > 0) {
          statusParts.push(`Missing: ${theoryValidation.missingHeadings.slice(0, 2).join(", ")}${theoryValidation.missingHeadings.length > 2 ? "..." : ""}`);
          topicWarnings.push(`Missing headings: ${theoryValidation.missingHeadings.join(", ")}`);
        }
        if (!theoryValidation.has3DMentalModel) {
          statusParts.push("No 3D Mental Model");
          topicWarnings.push("Missing '3D Mental Model' section");
        }
        theoryStatus = statusParts.join("; ");
      } else {
        theoryStatus = `✗ ${theoryValidation.reason}`;
        topicIssues.push(`Theory: ${theoryValidation.reason}`);
        if (theoryValidation.missingHeadings) {
          topicIssues.push(`Missing headings: ${theoryValidation.missingHeadings.join(", ")}`);
        }
      }

      // References validation
      const refsCount = topic.references?.length || 0;
      const refsStatus = refsCount >= 2 ? `✓ ${refsCount}` : `⚠ ${refsCount}`;
      if (refsCount < 2) {
        topicWarnings.push(`Only ${refsCount} references (need ≥2)`);
      }

      // Practice demo validation
      if (!topic.practiceDemo) {
        topicIssues.push("Missing practiceDemo");
      } else if (!topic.practiceDemo.demoType) {
        topicIssues.push("practiceDemo missing demoType");
      }

      // Practice steps validation
      const stepsCount = topic.practiceSteps?.length || 0;
      const stepsStatus = stepsCount >= 4 ? `✓ ${stepsCount}` : `⚠ ${stepsCount}`;
      if (stepsCount < 4) {
        topicWarnings.push(`Only ${stepsCount} steps (recommended ≥4)`);
      }

      // Practice tasks validation
      const tasksCount = topic.practiceTasks?.length || 0;
      const tasksStatus = tasksCount >= 2 ? `✓ ${tasksCount}` : `⚠ ${tasksCount}`;
      if (tasksCount < 2) {
        topicWarnings.push(`Only ${tasksCount} tasks (need ≥2)`);
      }

      // Theory animations validation
      const animationsCount = Array.isArray(topic.theoryAnimations) ? topic.theoryAnimations.length : 0;
      const animationsStatus = animationsCount >= 2 && animationsCount <= 6 ? `✓ ${animationsCount}` : animationsCount < 2 ? `⚠ ${animationsCount}` : `⚠ ${animationsCount} (>6)`;
      if (animationsCount < 2) {
        topicWarnings.push(`Only ${animationsCount} theory animations (need 2-6)`);
      } else if (animationsCount > 6) {
        topicWarnings.push(`${animationsCount} theory animations (recommended ≤6)`);
      } else if (animationsCount > 0) {
        // Validate each block structure
        topic.theoryAnimations.forEach((block, idx) => {
          if (!block.title) {
            topicWarnings.push(`Animation block ${idx + 1} missing title`);
          }
          if (!block.kind) {
            topicWarnings.push(`Animation block ${idx + 1} missing kind`);
          }
          if (!block.description) {
            topicWarnings.push(`Animation block ${idx + 1} missing description`);
          }
          if (!Array.isArray(block.whatToNotice) || block.whatToNotice.length < 3) {
            topicWarnings.push(`Animation block ${idx + 1} has <3 whatToNotice items`);
          }
        });
      }

      // Combine issues for display
      const allIssuesStr =
        topicIssues.length > 0
          ? topicIssues.join("; ")
          : topicWarnings.length > 0
          ? `⚠ ${topicWarnings.join("; ")}`
          : "None";

      // Theory animations status
      const animationsCount = Array.isArray(topic.theoryAnimations) ? topic.theoryAnimations.length : 0;
      const animationsStatus = animationsCount >= 2 && animationsCount <= 6 ? `✓ ${animationsCount}` : animationsCount < 2 ? `⚠ ${animationsCount}` : `⚠ ${animationsCount}`;

      // Print row
      console.log(
        `${String(topic.order).padEnd(6)} | ${topic.slug.padEnd(25)} | ${titleMatchStr.padEnd(12)} | ${theoryStatus.padEnd(20)} | ${refsStatus.padEnd(5)} | ${stepsStatus.padEnd(6)} | ${tasksStatus.padEnd(6)} | ${animationsStatus.padEnd(10)} | ${allIssuesStr}`
      );

      // Collect global issues/warnings
      if (topicIssues.length > 0) {
        issues.push(`Topic ${topic.order} (${topic.slug}): ${topicIssues.join(", ")}`);
      }
      if (topicWarnings.length > 0) {
        warnings.push(`Topic ${topic.order} (${topic.slug}): ${topicWarnings.join(", ")}`);
      }
    }

    console.log("─".repeat(140));
    console.log();

    // Summary
    if (issues.length === 0 && warnings.length === 0) {
      console.log("✅ All validations passed! All 12 topics are complete.\n");
      return 0;
    }

    if (issues.length > 0) {
      console.log("❌ CRITICAL ISSUES:\n");
      issues.forEach((issue) => console.log(`  ${issue}`));
      console.log();
    }

    if (warnings.length > 0) {
      console.log("⚠️  WARNINGS:\n");
      warnings.forEach((warning) => console.log(`  ${warning}`));
      console.log();
    }

    // Validate curriculum_modules (new schema)
    console.log("\n" + "=".repeat(160));
    console.log("CURRICULUM MODULES AUDIT");
    console.log("=".repeat(160) + "\n");

    const curriculumModules = await payload.find({
      collection: "curriculum_modules",
      sort: "order",
      limit: 100,
      depth: 2,
    });

    // Check count
    if (curriculumModules.docs.length !== 12) {
      issues.push(
        `❌ Expected 12 curriculum modules, found ${curriculumModules.docs.length}`
      );
      console.log(`❌ Expected 12 curriculum modules, found ${curriculumModules.docs.length}\n`);
    } else {
      console.log(`✓ Found 12 curriculum modules\n`);
    }

    // Check orders (1-12 with no gaps/duplicates)
    if (curriculumModules.docs.length > 0) {
      const moduleOrders = curriculumModules.docs.map((m) => m.order).sort((a, b) => a - b);
      const expectedOrders = Array.from({ length: 12 }, (_, i) => i + 1);
      const orderMismatches = expectedOrders.filter(
        (expected, idx) => moduleOrders[idx] !== expected
      );
      if (orderMismatches.length > 0) {
        issues.push(
          `❌ Curriculum module order gaps/duplicates. Expected [1-12], got [${moduleOrders.join(", ")}]`
        );
      } else {
        console.log(`✓ Module orders are correct (1-12, no gaps)\n`);
      }

      // Required section kinds per module
      const REQUIRED_SECTION_KINDS = [
        "overview",
        "prerequisites",
        "mentalModel",
        "coreConcepts",
        "designProcess",
        "tradeoffs",
        "mistakes",
        "caseStudy",
        "interviewQA",
      ];

      console.log("─".repeat(160));
      console.log(
        `${"Order".padEnd(6)} | ${"Slug".padEnd(30)} | ${"Sections".padEnd(8)} | ${"Examples".padEnd(9)} | Issues`
      );
      console.log("─".repeat(160));

      for (const module of curriculumModules.docs) {
        const moduleIssues = [];
        const moduleWarnings = [];

        // Validate sections
        const sections = module.sections || [];
        const sectionsCount = sections.length;
        const sectionKinds = sections.map((s) => s.kind);
        const missingKinds = REQUIRED_SECTION_KINDS.filter(
          (kind) => !sectionKinds.includes(kind)
        );

        if (sectionsCount === 0) {
          moduleIssues.push("No sections");
        } else if (missingKinds.length > 0) {
          moduleWarnings.push(`Missing sections: ${missingKinds.join(", ")}`);
        }

        // Validate embedded examples (should have >= 3 animated examples per module)
        // Count unique exampleIds from embeddedExamples
        const exampleIds = new Set();
        sections.forEach((section) => {
          if (section.embeddedExamples) {
            section.embeddedExamples.forEach((emb) => {
              const exampleId = typeof emb.exampleId === "string" ? emb.exampleId : emb.exampleId?.exampleId;
              if (exampleId) exampleIds.add(exampleId);
            });
          }
        });

        const examplesCount = exampleIds.size;
        if (examplesCount < 3) {
          moduleWarnings.push(`Only ${examplesCount} animated examples (need ≥3)`);
        }

        // Validate that practice fields don't exist (should be removed)
        if (module.practiceDemo || module.practiceSteps || module.practiceTasks) {
          moduleIssues.push("Contains practice fields (should be removed)");
        }

        const allIssuesStr =
          moduleIssues.length > 0
            ? moduleIssues.join("; ")
            : moduleWarnings.length > 0
            ? `⚠ ${moduleWarnings.join("; ")}`
            : "None";

        console.log(
          `${String(module.order).padEnd(6)} | ${module.slug.padEnd(30)} | ${String(sectionsCount).padEnd(8)} | ${String(examplesCount).padEnd(9)} | ${allIssuesStr}`
        );

        if (moduleIssues.length > 0) {
          issues.push(`Module ${module.order} (${module.slug}): ${moduleIssues.join(", ")}`);
        }
        if (moduleWarnings.length > 0) {
          warnings.push(`Module ${module.order} (${module.slug}): ${moduleWarnings.join(", ")}`);
        }
      }

      console.log("─".repeat(160));
      console.log();

      // Validate animated_examples collection
      const animatedExamples = await payload.find({
        collection: "animated_examples",
        limit: 1000,
        depth: 1,
      });

      console.log(`Found ${animatedExamples.docs.length} animated examples`);
      
      // Check for invalid specs
      for (const example of animatedExamples.docs) {
        if (!example.spec) {
          issues.push(`Animated example ${example.exampleId}: Missing spec`);
        }
        if (!example.whatToNotice || example.whatToNotice.length < 3) {
          warnings.push(`Animated example ${example.exampleId}: <3 whatToNotice items`);
        }
      }

      console.log();
    }

    // Exit code: 1 if any critical issues, 0 if only warnings
    return issues.length > 0 ? 1 : 0;
  } catch (error) {
    console.error("❌ Audit failed:", error);
    return 1;
  } finally {
    // Payload cleanup
    if (payload && typeof payload.db?.destroy === "function") {
      await payload.db.destroy();
    }
  }
}

// Run audit
audit()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });


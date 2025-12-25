#!/usr/bin/env node

/**
 * Content Audit Script
 * 
 * Verifies CMS content aligns with curriculum:
 * - Checks required fields exist (title, slug, order, theory, practiceDemo, references)
 * - Verifies order covers 1..12 and slugs are unique
 * - Compares topic titles with curriculum-index.md
 * - Reports missing headings, empty sections, missing references
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Read curriculum index
const curriculumPath = join(rootDir, "docs/curriculum-index.md");
let curriculumTopics = [];

try {
  const curriculumContent = readFileSync(curriculumPath, "utf-8");
  // Extract topic titles from markdown (lines starting with number and **)
  const lines = curriculumContent.split("\n");
  curriculumTopics = lines
    .filter((line) => /^\d+\.\s+\*\*/.test(line))
    .map((line) => {
      const match = line.match(/^\d+\.\s+\*\*(.+?)\*\*/);
      return match ? match[1].trim() : null;
    })
    .filter(Boolean);
} catch (error) {
  console.error("⚠️  Could not read curriculum-index.md:", error.message);
}

// Fetch topics from API (assuming local dev server or direct DB access)
// For production, you'd need to configure DB connection
async function fetchTopics() {
  try {
    // Try API endpoint first (requires dev server running)
    const response = await fetch("http://localhost:3000/api/topics");
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn("⚠️  API endpoint not available, you may need to run: npm run dev");
  }

  // Fallback: instruct user to use Payload API or direct DB
  console.warn("⚠️  Cannot fetch topics. Options:");
  console.warn("   1. Run 'npm run dev' and ensure API is accessible");
  console.warn("   2. Use Payload Admin API directly");
  return [];
}

async function auditContent() {
  console.log("🔍 Starting content audit...\n");

  const topics = await fetchTopics();

  if (topics.length === 0) {
    console.error("❌ No topics found. Cannot perform audit.");
    process.exit(1);
  }

  console.log(`📚 Found ${topics.length} topics\n`);

  const issues = [];
  const orderSet = new Set();
  const slugSet = new Set();
  const expectedOrderCount = 12;

  // Check each topic
  topics.forEach((topic, index) => {
    const topicNum = index + 1;
    const slug = topic.slug || "unknown";

    // Required fields check
    if (!topic.title) issues.push({ type: "missing_field", topic: slug, field: "title" });
    if (!topic.slug) issues.push({ type: "missing_field", topic: slug, field: "slug" });
    if (topic.order === undefined || topic.order === null) {
      issues.push({ type: "missing_field", topic: slug, field: "order" });
    }
    if (!topic.theory || !topic.theory.root) {
      issues.push({ type: "empty_section", topic: slug, section: "theory" });
    }
    if (!topic.practiceDemo) {
      issues.push({ type: "missing_field", topic: slug, field: "practiceDemo" });
    }
    if (!topic.references || topic.references.length === 0) {
      issues.push({ type: "missing_references", topic: slug });
    }

    // Order validation
    if (topic.order !== undefined) {
      if (orderSet.has(topic.order)) {
        issues.push({ type: "duplicate_order", topic: slug, order: topic.order });
      }
      orderSet.add(topic.order);

      if (topic.order < 1 || topic.order > expectedOrderCount) {
        issues.push({
          type: "invalid_order_range",
          topic: slug,
          order: topic.order,
          expected: `1-${expectedOrderCount}`,
        });
      }
    }

    // Slug uniqueness
    if (slugSet.has(slug)) {
      issues.push({ type: "duplicate_slug", topic: slug });
    }
    slugSet.add(slug);

    // Curriculum title comparison
    if (curriculumTopics.length > 0 && topic.order) {
      const curriculumIndex = topic.order - 1;
      if (curriculumTopics[curriculumIndex]) {
        const expectedTitle = curriculumTopics[curriculumIndex];
        if (topic.title !== expectedTitle) {
          issues.push({
            type: "title_mismatch",
            topic: slug,
            actual: topic.title,
            expected: expectedTitle,
            order: topic.order,
          });
        }
      }
    }

    // Theory content structure check
    if (topic.theory?.root?.children) {
      const hasHeadings = topic.theory.root.children.some(
        (child) => child.type === "heading"
      );
      if (!hasHeadings) {
        issues.push({ type: "no_headings", topic: slug });
      }
    }
  });

  // Check for missing orders (gaps)
  const orders = Array.from(orderSet).sort((a, b) => a - b);
  for (let i = 1; i <= expectedOrderCount; i++) {
    if (!orders.includes(i)) {
      issues.push({ type: "missing_order", order: i });
    }
  }

  // Report results
  console.log("📊 Audit Results:\n");

  if (issues.length === 0) {
    console.log("✅ No issues found! All topics are properly configured.\n");
  } else {
    console.log(`❌ Found ${issues.length} issue(s):\n`);

    const grouped = issues.reduce((acc, issue) => {
      const type = issue.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(issue);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([type, items]) => {
      console.log(`\n${type.toUpperCase().replace(/_/g, " ")}:`);
      items.forEach((item) => {
        if (type === "missing_field") {
          console.log(`  • Topic "${item.topic}": missing ${item.field}`);
        } else if (type === "empty_section") {
          console.log(`  • Topic "${item.topic}": empty ${item.section} section`);
        } else if (type === "missing_references") {
          console.log(`  • Topic "${item.topic}": no references`);
        } else if (type === "duplicate_order") {
          console.log(`  • Topic "${item.topic}": duplicate order ${item.order}`);
        } else if (type === "invalid_order_range") {
          console.log(`  • Topic "${item.topic}": order ${item.order} not in range ${item.expected}`);
        } else if (type === "duplicate_slug") {
          console.log(`  • Topic "${item.topic}": duplicate slug`);
        } else if (type === "title_mismatch") {
          console.log(`  • Topic "${item.topic}" (order ${item.order}):`);
          console.log(`    Expected: "${item.expected}"`);
          console.log(`    Actual:   "${item.actual}"`);
        } else if (type === "no_headings") {
          console.log(`  • Topic "${item.topic}": theory has no headings`);
        } else if (type === "missing_order") {
          console.log(`  • Missing order ${item.order}`);
        }
      });
    });
    console.log("");
  }

  // Summary
  console.log("📋 Summary:");
  console.log(`   Total topics: ${topics.length}`);
  console.log(`   Expected orders: 1-${expectedOrderCount}`);
  console.log(`   Unique orders found: ${orders.length}`);
  console.log(`   Unique slugs: ${slugSet.size}`);
  console.log(`   Issues: ${issues.length}\n`);

  process.exit(issues.length > 0 ? 1 : 0);
}

auditContent().catch((error) => {
  console.error("❌ Audit failed:", error);
  process.exit(1);
});


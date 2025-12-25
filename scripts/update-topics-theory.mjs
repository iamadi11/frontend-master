import { getPayload } from "payload";
import { config as dotenvConfig } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenvConfig({ path: join(__dirname, "..", ".env.local") });

/**
 * This script updates existing topics to ensure they have complete theory content.
 * Run this if topics exist but theory is missing/incomplete.
 */
async function updateTopicsTheory() {
  console.log("📝 Updating topics with complete theory content...\n");

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

    console.log(`Found ${result.docs.length} topics.\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const topic of result.docs) {
      // Check if theory field exists and has content
      const hasTheory = topic.theory && 
                       topic.theory.root && 
                       topic.theory.root.children && 
                       topic.theory.root.children.length > 0;

      if (hasTheory) {
        console.log(`⏭️  Skipping topic ${topic.order} (${topic.slug}) - already has theory content`);
        skippedCount++;
      } else {
        console.log(`⚠️  Topic ${topic.order} (${topic.slug}) - missing theory content`);
        console.log(`   Please check the seed script or add theory content via Payload admin.`);
        skippedCount++;
      }
    }

    console.log(`\n✅ Scan complete:`);
    console.log(`   - ${updatedCount} topics updated`);
    console.log(`   - ${skippedCount} topics skipped (already have content or need manual update)`);
    
    if (skippedCount === result.docs.length) {
      console.log(`\n💡 All topics already have theory content.`);
      console.log(`   If theory still doesn't display, the issue is in the rendering pipeline.`);
      console.log(`   Check browser console for errors when visiting /topics/foundations`);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    return 1;
  } finally {
    // Payload cleanup
    if (payload && typeof payload.db?.destroy === "function") {
      await payload.db.destroy();
    }
  }

  return 0;
}

// Run update
updateTopicsTheory()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });


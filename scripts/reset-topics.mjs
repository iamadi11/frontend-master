import { getPayload } from "payload";
import { config as dotenvConfig } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenvConfig({ path: join(__dirname, "..", ".env.local") });

async function resetTopics() {
  console.log("🗑️  Resetting all topics...\n");

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
    });

    console.log(`Found ${result.docs.length} topics. Deleting...\n`);

    for (const topic of result.docs) {
      await payload.delete({
        collection: "topics",
        id: topic.id,
      });
      console.log(`✓ Deleted topic: ${topic.slug} (order: ${topic.order})`);
    }

    console.log(`\n✅ All ${result.docs.length} topics deleted successfully.`);
    console.log("\n📝 Next step: Run 'npm run seed' to create fresh topics with complete theory content.");
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

// Run reset
resetTopics()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });


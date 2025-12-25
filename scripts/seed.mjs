import { getPayload } from "payload";

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

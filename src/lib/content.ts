import "server-only";
import { cache } from "react";
import { getPayloadClient } from "./payload";

export async function getPageBySlug(slug: string) {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "pages",
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        {
          status: {
            equals: "published",
          },
        },
      ],
    },
    limit: 1,
  });

  return result.docs[0] || null;
}

// Deprecated functions removed - use curriculum_modules collection instead
// Use listCurriculumModules, getCurriculumModuleBySlug, and getAdjacentModules

// Curriculum modules (new schema)
export const listCurriculumModules = cache(async () => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "curriculum_modules",
    sort: "order",
    limit: 100,
    depth: 2, // Required for richText and relationships
  });

  return result.docs;
});

export async function getCurriculumModuleBySlug(slug: string) {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "curriculum_modules",
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
    depth: 3, // Required for richText, relationships, and nested animated examples
  });

  const module = result.docs[0];
  if (!module) return null;

  // Resolve embedded examples relationships
  if (module.sections) {
    for (const section of module.sections) {
      if (section.embeddedExamples) {
        section.embeddedExamples = await Promise.all(
          section.embeddedExamples.map(async (emb: any) => {
            // If exampleId is a string (ID), fetch the example
            if (typeof emb.exampleId === "string") {
              const exampleResult = await payload.findByID({
                collection: "animated_examples",
                id: emb.exampleId,
                depth: 1,
              });
              return { ...emb, exampleId: exampleResult };
            }
            // If it's already a relationship object, use it
            return emb;
          })
        );
      }
    }
  }

  return module;
}

export function getAdjacentModules(
  currentSlug: string,
  modules: Array<{ slug: string; title: string }>
) {
  const currentIndex = modules.findIndex((m) => m.slug === currentSlug);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: currentIndex > 0 ? modules[currentIndex - 1] : null,
    next: currentIndex < modules.length - 1 ? modules[currentIndex + 1] : null,
  };
}

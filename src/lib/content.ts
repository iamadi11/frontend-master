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

/**
 * @deprecated Use listCurriculumModules instead. This function will be removed in a future version.
 */
export const listTopics = cache(async () => {
  console.warn("listTopics is deprecated. Use listCurriculumModules instead.");
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "topics",
    sort: "order",
    limit: 100,
    depth: 2,
  });

  return result.docs;
});

/**
 * @deprecated Use getCurriculumModuleBySlug instead. This function will be removed in a future version.
 */
export async function getTopicBySlug(slug: string) {
  console.warn(
    "getTopicBySlug is deprecated. Use getCurriculumModuleBySlug instead."
  );
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "topics",
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
    depth: 2,
  });

  return result.docs[0] || null;
}

/**
 * @deprecated Use getAdjacentModules instead. This function will be removed in a future version.
 */
export function getAdjacentTopics(
  currentSlug: string,
  topics: Array<{ slug: string; title: string }>
) {
  console.warn(
    "getAdjacentTopics is deprecated. Use getAdjacentModules instead."
  );
  const currentIndex = topics.findIndex((t) => t.slug === currentSlug);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: currentIndex > 0 ? topics[currentIndex - 1] : null,
    next: currentIndex < topics.length - 1 ? topics[currentIndex + 1] : null,
  };
}

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

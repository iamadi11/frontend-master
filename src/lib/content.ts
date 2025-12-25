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

// Cache listTopics to deduplicate requests within the same render
export const listTopics = cache(async () => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "topics",
    sort: "order",
    limit: 100, // Fetch all topics (default limit is 10)
    depth: 2, // Required for richText fields to be fully populated
  });

  return result.docs;
});

export async function getTopicBySlug(slug: string) {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "topics",
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
    depth: 2, // Required for richText fields to be fully populated
  });

  return result.docs[0] || null;
}

// Optimized: accepts topics list to avoid re-fetching
export function getAdjacentTopics(
  currentSlug: string,
  topics: Array<{ slug: string; title: string }>
) {
  const currentIndex = topics.findIndex((t) => t.slug === currentSlug);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: currentIndex > 0 ? topics[currentIndex - 1] : null,
    next: currentIndex < topics.length - 1 ? topics[currentIndex + 1] : null,
  };
}

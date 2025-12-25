import "server-only";
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

export async function listResources() {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "resources",
    sort: "resourceNumber",
  });

  return result.docs;
}

export async function getResourceByNumber(number: number) {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "resources",
    where: {
      resourceNumber: {
        equals: number,
      },
    },
    limit: 1,
  });

  return result.docs[0] || null;
}

export async function listTopics() {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "topics",
    sort: "order",
  });

  return result.docs;
}

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
  });

  return result.docs[0] || null;
}

export async function getAdjacentTopics(currentSlug: string) {
  const allTopics = await listTopics();
  const currentIndex = allTopics.findIndex((t) => t.slug === currentSlug);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: currentIndex > 0 ? allTopics[currentIndex - 1] : null,
    next:
      currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : null,
  };
}

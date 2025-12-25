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

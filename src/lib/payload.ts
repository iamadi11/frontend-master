import "server-only";
import { getPayload } from "payload";
import config from "../../payload.config";

let cachedPayload: Awaited<ReturnType<typeof getPayload>> | null = null;

export async function getPayloadClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  if (!process.env.PAYLOAD_SECRET) {
    throw new Error("PAYLOAD_SECRET environment variable is not set");
  }

  if (cachedPayload) {
    return cachedPayload;
  }

  cachedPayload = await getPayload({
    config,
  });

  return cachedPayload;
}

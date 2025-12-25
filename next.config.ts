import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  // Next.js 16 uses Turbopack by default
  // No need for experimental flags
};

export default withPayload(nextConfig);

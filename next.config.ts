import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  // Next.js 16 with Payload CMS 3.69.0 (using legacy peer deps)
};

export default withPayload(nextConfig);

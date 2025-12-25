import { MetadataRoute } from "next";
import { listCurriculumModules } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const modules = await listCurriculumModules();

  const moduleUrls: MetadataRoute.Sitemap = modules.map((module) => ({
    url: `${baseUrl}/topics/${module.slug}`,
    lastModified: module.updatedAt ? new Date(module.updatedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/topics`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...moduleUrls,
  ];
}

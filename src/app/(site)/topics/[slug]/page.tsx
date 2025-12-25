import { notFound } from "next/navigation";
import {
  getCurriculumModuleBySlug,
  getAdjacentModules,
  listCurriculumModules,
} from "@/lib/content";
import { ModulePageClient } from "./ModulePageClient";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const module = await getCurriculumModuleBySlug(slug);

  if (!module) {
    return {
      title: "Module Not Found",
    };
  }

  return {
    title: `${module.title} | Frontend System Design`,
    description: module.summary || `Learn ${module.title}`,
  };
}

export async function generateStaticParams() {
  const modules = await listCurriculumModules();
  return modules.map((module) => ({
    slug: module.slug,
  }));
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Fetch modules list once (cached) and use for both module and adjacent lookup
  const [allModules, module] = await Promise.all([
    listCurriculumModules(),
    getCurriculumModuleBySlug(slug),
  ]);

  if (!module) {
    notFound();
  }

  // Use modules list for adjacent lookup (no additional API call)
  const adjacent = getAdjacentModules(slug, allModules);

  return (
    <ModulePageClient
      module={module as any}
      prevModule={
        adjacent.prev
          ? { title: adjacent.prev.title, slug: adjacent.prev.slug }
          : null
      }
      nextModule={
        adjacent.next
          ? { title: adjacent.next.title, slug: adjacent.next.slug }
          : null
      }
    />
  );
}
